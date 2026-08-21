$ErrorActionPreference = "SilentlyContinue"
$root = Split-Path -Parent (Split-Path -Parent $PSCommandPath)

Write-Host "=== Cleaning Next.js build caches ===" -ForegroundColor Cyan

$targets = @(
  (Join-Path $root "apps\framework-console\.next"),
  (Join-Path $root "apps\framework-console\.next-qa"),
  (Join-Path $root "apps\petemart\.next"),
  (Join-Path $root ".next")
)

foreach ($t in $targets) {
  if (Test-Path $t) {
    Remove-Item $t -Recurse -Force -ErrorAction SilentlyContinue
    if (-not (Test-Path $t)) {
      Write-Host "  Removed $t" -ForegroundColor Green
    } else {
      Write-Host "  FAILED to remove $t" -ForegroundColor Red
    }
  } else {
    Write-Host "  Skipped (not present): $t" -ForegroundColor Gray
  }
}

Write-Host ""
Write-Host "=== Next.js caches cleared ===" -ForegroundColor Green
