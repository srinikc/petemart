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
    $pid = $_ -replace '.*\s+(\d+)$', '$1'
    if ($pid -match '^\d+$') { taskkill /F /PID $pid 2>$null }
  }
  Start-Sleep -Seconds 2
}

# Build if needed
if ($ForceRebuild -or !(Test-Path (Join-Path $root ".next"))) {
  Write-Host "Building project..." -ForegroundColor Yellow
  Push-Location $root
  npm run build 2>&1
  if ($LASTEXITCODE -ne 0) { Write-Host "BUILD FAILED" -ForegroundColor Red; exit 1 }
  Pop-Location
}

# Start detached process
Write-Host "Starting server on port $Port..." -ForegroundColor Green
$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = "npx.cmd"
$psi.Arguments = "next start -p $Port"
$psi.WorkingDirectory = $root
$psi.UseShellExecute = $false
$psi.CreateNoWindow = $true
$psi.RedirectStandardOutput = $true
$psi.RedirectStandardError = $true
$proc = [System.Diagnostics.Process]::Start($psi)

# Save PID
$proc.Id | Out-File -FilePath $pidFile -Encoding ascii
Write-Host "Server PID: $($proc.Id)" -ForegroundColor Green

# Wait and verify
Start-Sleep -Seconds 8
$serverLog = Join-Path (Join-Path $root ".next") "server-start.log"
$proc.StandardOutput.ReadToEnd() | Out-File $serverLog
$proc.StandardError.ReadToEnd() | Out-File ($serverLog -replace "\.log$", ".err")

try {
  $r = Invoke-WebRequest -Uri "http://localhost:$Port/qa-dashboard" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
  if ($r.StatusCode -eq 200) {
    Write-Host "QA Dashboard: HTTP 200 OK ($($r.Content.Length) bytes)" -ForegroundColor Green
    Write-Host "→ http://localhost:$Port/qa-dashboard" -ForegroundColor Cyan
    exit 0
  }
} catch {
  Write-Host "Dashboard verification FAILED: $_" -ForegroundColor Red
  exit 1
}
