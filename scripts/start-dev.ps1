param(
  [ValidateSet("all","console","product","qa")]
  [string]$Mode = "all",
  [switch]$ForceRebuild
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $PSCommandPath)

Write-Host "=== ProductForge Dev Server (Background) ===" -ForegroundColor Cyan

# Clean stale PID files
$pidFiles = @(
  "$root\.dev-server-pid",
  "$root\.product-pid",
  "$root\.qa-pid",
  "$root\00_state_ledger\SUPERVISOR_DAEMON.pid",
  "$root\00_state_ledger\.runtime.pid"
)
foreach ($f in $pidFiles) {
  if (Test-Path $f) { Remove-Item $f -Force -ErrorAction SilentlyContinue }
}

# Determine which apps to start based on mode
switch ($Mode) {
  "all" {
    Write-Host "Starting all apps (console :3000, product :3001, QA :3458)..." -ForegroundColor Green
    $args = @("dev-server.js")
  }
  "console" {
    Write-Host "Starting console app (:3000)..." -ForegroundColor Green
    $args = @("dev-server.js", "-p", "3000")
  }
  "product" {
    Write-Host "Starting product app (:3001)..." -ForegroundColor Green
    $args = @("dev-server.js", "-p", "3001")
  }
  "qa" {
    Write-Host "Starting QA dashboard (:3458)..." -ForegroundColor Green
    $args = @("dev-server.js", "-p", "3458")
  }
}

# Start detached process (no stdout/stderr redirect — avoids pipe buffer deadlock)
$proc = Start-Process -FilePath "node" -ArgumentList $args -WorkingDirectory $root -WindowStyle Hidden -PassThru

# Save PID
$proc.Id | Out-File -FilePath "$root\.dev-server-pid" -Encoding ascii
Write-Host "Dev Server PID: $($proc.Id)" -ForegroundColor Green

# Allow time for Next.js compilation (cold start may take 30-60s)
Write-Host "Waiting for servers to compile (cold start)..." -ForegroundColor Yellow

# Verify (retry loop: up to 20 attempts x 6s = 120s)
$maxRetries = 20
$retrySeconds = 6
$verified = $false

for ($i = 1; $i -le $maxRetries; $i++) {
  Write-Host "  Checking... attempt $i of $maxRetries" -ForegroundColor Cyan
  $ok = $true
  try {
    $r = Invoke-WebRequest -Uri "http://localhost:3000/api/agentic-console/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    if ($r.StatusCode -ne 200) { $ok = $false }
  } catch { $ok = $false }

  if ($Mode -in @("all","product")) {
    try {
      $r2 = Invoke-WebRequest -Uri "http://localhost:3001/api/v1/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
      if ($r2.StatusCode -ne 200) { $ok = $false }
    } catch { $ok = $false }
  }

  if ($Mode -in @("all","qa")) {
    try {
      $r3 = Invoke-WebRequest -Uri "http://localhost:3458/qa-dashboard" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
      if ($r3.StatusCode -ne 200) { $ok = $false }
    } catch { $ok = $false }
  }

  if ($ok) {
    Write-Host "Dev Server: HTTP 200 OK" -ForegroundColor Green
    Write-Host "→ http://localhost:3000 (console)" -ForegroundColor Cyan
    Write-Host "→ http://localhost:3000/agentic-console" -ForegroundColor Cyan
    if ($Mode -in @("all","product")) { Write-Host "→ http://localhost:3001 (product)" -ForegroundColor Cyan }
    if ($Mode -in @("all","qa")) { Write-Host "→ http://localhost:3458/qa-dashboard (QA)" -ForegroundColor Cyan }
    $verified = $true
    break
  }

  if ($i -lt $maxRetries) {
    Start-Sleep -Seconds $retrySeconds
  }
}

if (-not $verified) {
  Write-Host "WARNING: Server(s) started but did not respond within $(($maxRetries * $retrySeconds))s." -ForegroundColor Yellow
  Write-Host "  Process may still be compiling. Check the ports above." -ForegroundColor Yellow
  Write-Host "  To stop: npm run dev:stop" -ForegroundColor Yellow
  exit 0
}

Write-Host ""
Write-Host "=== Dev Server(s) running in background ===" -ForegroundColor Cyan
Write-Host "  npm run dev:stop   — stop the server" -ForegroundColor Gray
Write-Host "  npm run stop:all   — stop all servers" -ForegroundColor Gray
