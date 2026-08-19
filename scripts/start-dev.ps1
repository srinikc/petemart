param(
  [int]$Port = 3000,
  [switch]$ForceRebuild
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
$pidFile = Join-Path $root ".dev-server-pid"

Write-Host "=== PeteMart Dev Server (Background) ===" -ForegroundColor Cyan

# Kill existing on port
$existing = netstat -ano | Select-String ":$Port" | Select-String "LISTENING"
if ($existing) {
  Write-Host "Port $Port in use. Killing existing process..." -ForegroundColor Yellow
  $existing | ForEach-Object {
    $foundPid = $_ -replace '.*\s+(\d+)$', '$1'
    if ($foundPid -match '^\d+$') { taskkill /F /PID $foundPid 2>$null }
  }
  Start-Sleep -Seconds 2
}

# Clean stale PID files
$stalePids = @("$root\.dev-server-pid", "$root\00_state_ledger\SUPERVISOR_DAEMON.pid", "$root\00_state_ledger\.runtime.pid")
foreach ($f in $stalePids) {
  if (Test-Path $f) { Remove-Item $f -Force -ErrorAction SilentlyContinue }
}

# Start detached process (no stdout/stderr redirect — avoids pipe buffer deadlock)
Write-Host "Starting dev server on port $Port..." -ForegroundColor Green
$proc = Start-Process -FilePath "node" -ArgumentList "dev-server.js -p $Port" -WorkingDirectory $root -WindowStyle Hidden -PassThru

# Save PID
$proc.Id | Out-File -FilePath $pidFile -Encoding ascii
Write-Host "Dev Server PID: $($proc.Id)" -ForegroundColor Green

# Allow time for Next.js compilation (cold start may take 30-60s)
Write-Host "Waiting for server to compile (cold start)..." -ForegroundColor Yellow

# Verify (retry loop: up to 20 attempts x 6s = 120s)
$maxRetries = 20
$retrySeconds = 6
$verified = $false

for ($i = 1; $i -le $maxRetries; $i++) {
  Write-Host "  Checking... attempt $i of $maxRetries" -ForegroundColor Cyan
  try {
    $r = Invoke-WebRequest -Uri "http://localhost:$Port/api/agentic-console/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    if ($r.StatusCode -eq 200) {
      Write-Host "Dev Server: HTTP 200 OK" -ForegroundColor Green
      Write-Host "→ http://localhost:$Port" -ForegroundColor Cyan
      Write-Host "→ http://localhost:$Port/agentic-console" -ForegroundColor Cyan
      $verified = $true
      break
    }
  } catch {
    if ($i -lt $maxRetries) {
      Start-Sleep -Seconds $retrySeconds
    }
  }
}

if (-not $verified) {
  Write-Host "WARNING: Server started but did not respond within $(($maxRetries * $retrySeconds))s." -ForegroundColor Yellow
  Write-Host "  Process may still be compiling. Check http://localhost:$Port" -ForegroundColor Yellow
  Write-Host "  To stop: npm run dev:stop" -ForegroundColor Yellow
  exit 0
}

Write-Host ""
Write-Host "=== Dev Server running in background ===" -ForegroundColor Cyan
Write-Host "  npm run dev:stop   — stop the server" -ForegroundColor Gray
Write-Host "  npm run stop:all   — stop all servers" -ForegroundColor Gray
