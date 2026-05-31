# =============================================================================
# PeteMart — Local Deployment Script (PowerShell)
# =============================================================================
# Usage:
#   .\scripts\deploy.ps1 -Environment development
#   .\scripts\deploy.ps1 -Environment production -Version "1.2.3"
# =============================================================================

param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("development", "qa", "staging", "production")]
    [string]$Environment,

    [Parameter(Mandatory = $false)]
    [string]$Version = "",

    [Parameter(Mandatory = $false)]
    [switch]$SkipBuild,

    [Parameter(Mandatory = $false)]
    [switch]$SkipMigrations
)

$ROOT_DIR = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$ENV_FILE = Join-Path $ROOT_DIR "environments\$Environment.json"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  PeteMart Deploy - $Environment" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# Validate environment file
if (-not (Test-Path $ENV_FILE)) {
    Write-Error "Environment file not found: $ENV_FILE"
    exit 1
}

$envConfig = Get-Content $ENV_FILE | ConvertFrom-Json

# 1. Install dependencies
if (-not $SkipBuild) {
    Write-Host "`n[1/4] Installing dependencies..." -ForegroundColor Yellow
    pnpm install --frozen-lockfile
    if ($LASTEXITCODE -ne 0) {
        Write-Error "pnpm install failed"
        exit 1
    }

    # 2. Build
    Write-Host "`n[2/4] Building application..." -ForegroundColor Yellow
    pnpm build
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Build failed"
        exit 1
    }
}
else {
    Write-Host "`n[1/4] Skipping build (--SkipBuild)" -ForegroundColor Gray
}

# 3. Deploy to Vercel
Write-Host "`n[3/4] Deploying to Vercel ($Environment)..." -ForegroundColor Yellow
$vercelArgs = @("deploy", "--prebuilt")
if ($Environment -eq "production") {
    $vercelArgs += "--prod"
}
else {
    $vercelArgs += "--target", $Environment
}

& "npx" "vercel" $vercelArgs
if ($LASTEXITCODE -ne 0) {
    Write-Error "Vercel deploy failed"
    exit 1
}

# 4. Supabase Migrations
if (-not $SkipMigrations) {
    Write-Host "`n[4/4] Running Supabase migrations..." -ForegroundColor Yellow
    & "npx" "supabase" "db" "push"
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Supabase migration failed - manual intervention required"
        exit 1
    }
}
else {
    Write-Host "`n[4/4] Skipping migrations (--SkipMigrations)" -ForegroundColor Gray
}

Write-Host "`n============================================" -ForegroundColor Green
Write-Host "  ✅ Deploy to $Environment complete!" -ForegroundColor Green
Write-Host "  Domain: $($envConfig.domain)" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
