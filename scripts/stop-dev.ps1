$ErrorActionPreference = "SilentlyContinue"
$root = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
$pidFile = Join-Path $root ".dev-server-pid"

Write-Host "=== Stopping Dev Server ===" -ForegroundColor Cyan

$killed = $false

if (Test-Path $pidFile) {
  $storedPid = Get-Content $pidFile -Raw | ForEach-Object { $_.Trim() }
  if ($storedPid -match '^\d+$') {
    Write-Host "Killing dev server (PID: $storedPid)..." -ForegroundColor Yellow
    taskkill /F /PID $storedPid 2>$null
    if ($?) {
      Write-Host "  Process $storedPid terminated." -ForegroundColor Green
      $killed = $true
    }
  }
  Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
}

# Also kill any process on port 3000 as fallback cleanup
$existing = netstat -ano | Select-String ":3000" | Select-String "LISTENING"
if ($existing) {
  Write-Host "Cleaning up process on port 3000..." -ForegroundColor Yellow
  $existing | ForEach-Object {
    $foundPid = $_ -replace '.*\s+(\d+)$', '$1'
    if ($foundPid -match '^\d+$') { taskkill /F /PID $foundPid 2>$null; $killed = $true }
  }
}

# Clean stale supervisor/runtime PID files
$stalePids = @(
  (Join-Path $root "00_state_ledger\SUPERVISOR_DAEMON.pid"),
  (Join-Path $root "00_state_ledger\.runtime.pid")
)
foreach ($f in $stalePids) {
  if (Test-Path $f) {
    try {
      $oldPid = Get-Content $f -Raw | ForEach-Object { $_.Trim() }
      if ($oldPid -match '^\d+$') { taskkill /F /PID $oldPid 2>$null }
    } catch {}
    Remove-Item $f -Force -ErrorAction SilentlyContinue
  }
}

if ($killed) {
  Write-Host "Dev server stopped." -ForegroundColor Green
} else {
  Write-Host "No dev server was running." -ForegroundColor Gray
}
