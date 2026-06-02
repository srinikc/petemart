$root = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
$pidFile = Join-Path $root ".qa-dashboard-pid"

if (Test-Path $pidFile) {
  $pid = Get-Content $pidFile -Raw | ForEach-Object { $_.Trim() }
  if ($pid -match '^\d+$') {
    Write-Host "Killing QA Dashboard (PID: $pid)..." -ForegroundColor Yellow
    taskkill /F /PID $pid 2>$null
    Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
    Write-Host "Stopped." -ForegroundColor Green
  }
} else {
  Write-Host "No QA Dashboard PID file found. Checking port 3458..." -ForegroundColor Yellow
  $existing = netstat -ano | Select-String ":3458" | Select-String "LISTENING"
  if ($existing) {
    $existing | ForEach-Object {
      $pid = $_ -replace '.*\s+(\d+)$', '$1'
      if ($pid -match '^\d+$') { taskkill /F /PID $pid 2>$null }
    }
    Write-Host "Stopped process on port 3458." -ForegroundColor Green
  } else {
    Write-Host "No server running on port 3458." -ForegroundColor Gray
  }
}
