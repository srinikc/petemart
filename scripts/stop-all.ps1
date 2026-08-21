$ErrorActionPreference = "SilentlyContinue"
$root = Split-Path -Parent (Split-Path -Parent $PSCommandPath)

Write-Host "=== Stopping All Servers ===" -ForegroundColor Cyan
Write-Host ""

# ── 1. Dev Server (console :3000) ──
Write-Host "[1/4] Dev Server (console, port 3000)..." -ForegroundColor Cyan
$devPidFile = Join-Path $root ".dev-server-pid"
$killedDev = $false
if (Test-Path $devPidFile) {
  $storedPid = Get-Content $devPidFile -Raw | ForEach-Object { $_.Trim() }
  if ($storedPid -match '^\d+$') {
    taskkill /F /PID $storedPid 2>$null
    if ($?) { Write-Host "  PID $storedPid terminated." -ForegroundColor Green; $killedDev = $true }
  }
  Remove-Item $devPidFile -Force -ErrorAction SilentlyContinue
}
# Fallback: kill by port
$on3000 = netstat -ano | Select-String ":3000" | Select-String "LISTENING"
if ($on3000) {
  $on3000 | ForEach-Object {
    $foundPid = $_ -replace '.*\s+(\d+)$', '$1'
    if ($foundPid -match '^\d+$') { taskkill /F /PID $foundPid 2>$null; $killedDev = $true }
  }
}
if ($killedDev) { Write-Host "  ✓ Dev server stopped" -ForegroundColor Green } else { Write-Host "  - Not running" -ForegroundColor Gray }

# ── 2. Product (petemart :3001) ──
Write-Host "[2/4] Product app (port 3001)..." -ForegroundColor Cyan
$killedProduct = $false
$on3001 = netstat -ano | Select-String ":3001" | Select-String "LISTENING"
if ($on3001) {
  $on3001 | ForEach-Object {
    $foundPid = $_ -replace '.*\s+(\d+)$', '$1'
    if ($foundPid -match '^\d+$') { taskkill /F /PID $foundPid 2>$null; $killedProduct = $true }
  }
}
if ($killedProduct) { Write-Host "  ✓ Product app stopped" -ForegroundColor Green } else { Write-Host "  - Not running" -ForegroundColor Gray }

# ── 3. QA Dashboard ──
Write-Host "[3/4] QA Dashboard (port 3458)..." -ForegroundColor Cyan
$qaPidFile = Join-Path $root ".qa-dashboard-pid"
$killedQa = $false
if (Test-Path $qaPidFile) {
  $storedPid = Get-Content $qaPidFile -Raw | ForEach-Object { $_.Trim() }
  if ($storedPid -match '^\d+$') {
    taskkill /F /PID $storedPid 2>$null
    if ($?) { Write-Host "  PID $storedPid terminated." -ForegroundColor Green; $killedQa = $true }
  }
  Remove-Item $qaPidFile -Force -ErrorAction SilentlyContinue
}
# Fallback: kill by port
$on3458 = netstat -ano | Select-String ":3458" | Select-String "LISTENING"
if ($on3458) {
  $on3458 | ForEach-Object {
    $foundPid = $_ -replace '.*\s+(\d+)$', '$1'
    if ($foundPid -match '^\d+$') { taskkill /F /PID $foundPid 2>$null; $killedQa = $true }
  }
}
if ($killedQa) { Write-Host "  [OK] QA Dashboard stopped" -ForegroundColor Green } else { Write-Host "  - Not running" -ForegroundColor Gray }

# ── 4. Stale Supervisor / Runtime PIDs ──
Write-Host "[4/4] Stale PID files..." -ForegroundColor Cyan
$staleFiles = @(
  (Join-Path $root "00_state_ledger\SUPERVISOR_DAEMON.pid"),
  (Join-Path $root "00_state_ledger\.runtime.pid")
)
$cleaned = $false
foreach ($f in $staleFiles) {
  if (Test-Path $f) {
    try {
      $oldPid = Get-Content $f -Raw | ForEach-Object { $_.Trim() }
      if ($oldPid -match '^\d+$') { taskkill /F /PID $oldPid 2>$null }
    } catch {}
    Remove-Item $f -Force -ErrorAction SilentlyContinue
    Write-Host "  Removed $f" -ForegroundColor Gray
    $cleaned = $true
  }
}
if (-not $cleaned) { Write-Host "  - None found" -ForegroundColor Gray }

Write-Host ""
Write-Host "=== All servers stopped ===" -ForegroundColor Green
