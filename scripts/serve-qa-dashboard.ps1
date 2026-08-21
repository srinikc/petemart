param(
  [int]$Port = 3458,
  [switch]$ForceRebuild
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
$pidFile = Join-Path $root ".qa-dashboard-pid"

Write-Host "=== QA Dashboard Server ===" -ForegroundColor Cyan

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

# Build if needed
$appDir = Join-Path $root "apps\framework-console"
if ($ForceRebuild -or !(Test-Path (Join-Path $appDir ".next"))) {
  Write-Host "Building framework-console app..." -ForegroundColor Yellow
  Push-Location $appDir
  npm run build 2>&1
  if ($LASTEXITCODE -ne 0) { Write-Host "BUILD FAILED" -ForegroundColor Red; exit 1 }
  Pop-Location
}

# Start detached process using Next.js binary directly (avoids npx module resolution issues)
Write-Host "Starting server on port $Port..." -ForegroundColor Green
$nextBin = Join-Path $root "node_modules\.bin\next.cmd"
if (!(Test-Path $nextBin)) {
  Write-Host "ERROR: next.cmd not found at $nextBin" -ForegroundColor Red
  exit 1
}
$proc = Start-Process -FilePath $nextBin -ArgumentList "start $appDir -p $Port" -WorkingDirectory $appDir -WindowStyle Hidden -PassThru

# Save PID
$proc.Id | Out-File -FilePath $pidFile -Encoding ascii
Write-Host "Server PID: $($proc.Id)" -ForegroundColor Green

# Allow a brief moment for server to initialize before first check
Start-Sleep -Seconds 2

# Wait and verify (retry loop: up to 5 attempts × 3s intervals = ~15s total)
$maxRetries = 5
$retrySeconds = 3

for ($i = 1; $i -le $maxRetries; $i++) {
  Write-Host "Verification attempt $i of $maxRetries..." -ForegroundColor Cyan
  try {
    $r = Invoke-WebRequest -Uri "http://localhost:$Port/qa-dashboard" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    if ($r.StatusCode -eq 200) {
      Write-Host "QA Dashboard: HTTP 200 OK ($($r.Content.Length) bytes)" -ForegroundColor Green
      Write-Host "→ http://localhost:$Port/qa-dashboard" -ForegroundColor Cyan
      exit 0
    }
  } catch {
    if ($i -lt $maxRetries) {
      Write-Host "  Not ready yet (attempt $i/$maxRetries). Waiting ${retrySeconds}s..." -ForegroundColor Yellow
      Start-Sleep -Seconds $retrySeconds
    }
  }
}

Write-Host "Dashboard verification FAILED after $maxRetries attempts." -ForegroundColor Red
exit 1
