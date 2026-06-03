# Self-Decomposition Protocol

## Purpose
When a task exceeds ~60s wall-clock time or requires >30 tool calls, decompose it into smaller units that fit within a single agent invocation context window. Use detached-process + poll pattern so long operations survive across tool calls.

## When to Decompose

| Condition | Action |
|---|---|
| Task runs >60s (build, deploy, test suite, server start) | Use detached-process + poll pattern |
| Task generates >200KB output (large datasets, logs) | Pipe to file, read in chunks |
| Task requires >30 tool calls (mass edits, batch operations) | Split into batches of 10-15 calls each |
| Everything else | Run directly — no decomposition needed |

## How to Decompose (Detached Process + Poll Pattern)

### Step 1: Launch as Detached Process
```powershell
$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = "powershell"
$psi.Arguments = "-Command npm run build; `$LASTEXITCODE | Out-File .build-exit -Encoding ascii"
$psi.WorkingDirectory = "$PWD"
$psi.UseShellExecute = $false
$psi.CreateNoWindow = $true
$proc = [System.Diagnostics.Process]::Start($psi)
$proc.Id | Out-File .build-pid -Encoding ascii
```

### Step 2: Poll for Completion
```powershell
while (!(Test-Path .build-exit)) { Start-Sleep -Seconds 5 }
$exitCode = Get-Content .build-exit
if ($exitCode -ne "0") { throw "Build failed with exit code $exitCode" }
```

### Step 3: Consolidate Results
Read output files, format into summary, return to caller. Clean up temp files (.pid, .exit, .log).

## Agent Flow

1. **Self-check**: "Will this take >60s or >30 calls or >200KB output?"
2. **No** → execute normally
3. **Yes** → decompose: Step 1 → Step 2 → Step 3 → consolidate
4. Report result back to caller

## File-Based Handoff Pattern

For multi-minute sequences, use a status.json marker:
```json
{ "status": "running", "started_at": "2026-06-02T10:00:00Z", "pid": 1234 }
```
Poll until `status` changes to `"complete"` or `"failed"`.

## Cleanup

Always remove temp marker files after completion to avoid stale state on next run.
