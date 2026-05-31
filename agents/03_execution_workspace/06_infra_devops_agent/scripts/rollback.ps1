# =============================================================================
# PeteMart — One-Click Rollback Protocol (PowerShell)
# =============================================================================
# Usage:
#   .\scripts\rollback.ps1 -Environment production -Version "v1.0.0"
#   .\scripts\rollback.ps1 -Environment staging -Version "v0.9.3"
# =============================================================================
# This script performs a Git-based rollback:
#   1. Validates the target version exists as a Git tag
#   2. Checks out the tag
#   3. Rebuilds from that tagged code
#   4. Deploys to Vercel
#   5. Verifies the deployment
# =============================================================================

param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("development", "qa", "staging", "production")]
    [string]$Environment,

    [Parameter(Mandatory = $true)]
    [string]$Version,

    [Parameter(Mandatory = $true)]
    [string]$Reason
)

$ROOT_DIR = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

Write-Host "============================================" -ForegroundColor Red
Write-Host "  ↩️  PeteMart Rollback Protocol" -ForegroundColor Red
Write-Host "============================================" -ForegroundColor Red
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host "Target Version: $Version" -ForegroundColor Yellow
Write-Host "Reason: $Reason" -ForegroundColor Yellow
Write-Host ""

# ── Step 0: Confirmation ──────────────────────────────────────────────────
$confirmation = Read-Host "⚠️  ARE YOU SURE you want to rollback $Environment to $Version? (yes/N)"
if ($confirmation -ne "yes") {
    Write-Host "Rollback cancelled." -ForegroundColor Gray
    exit 0
}

# ── Step 1: Save current state ────────────────────────────────────────────
Write-Host "`n[1/6] Saving current state..." -ForegroundColor Yellow
$currentBranch = git rev-parse --abbrev-ref HEAD
$currentCommit = git rev-parse HEAD
Write-Host "  Current branch: $currentBranch" -ForegroundColor Gray
Write-Host "  Current commit: $currentCommit" -ForegroundColor Gray

# ── Step 2: Validate tag ──────────────────────────────────────────────────
Write-Host "`n[2/6] Validating version tag: $Version..." -ForegroundColor Yellow
$tagExists = git tag -l "$Version"
if (-not $tagExists) {
    Write-Error "Version tag '$Version' not found!"
    Write-Host "Available tags:" -ForegroundColor Gray
    git tag --sort=-v:refname | Select-Object -First 10
    exit 1
}
Write-Host "  ✅ Tag validated" -ForegroundColor Green

# ── Step 3: Stash working changes ─────────────────────────────────────────
Write-Host "`n[3/6] Stashing working changes..." -ForegroundColor Yellow
git stash -u -m "rollback-stash-$Version-$(Get-Date -Format 'yyyyMMddHHmmss')"
Write-Host "  ✅ Working changes stashed" -ForegroundColor Green

# ── Step 4: Checkout tagged version ───────────────────────────────────────
Write-Host "`n[4/6] Checking out $Version..." -ForegroundColor Yellow
git checkout "tags/$Version" -b "rollback/$Environment/$Version"
if ($LASTEXITCODE -ne 0) {
    Write-Error "Checkout failed!"
    exit 1
}
Write-Host "  ✅ Checked out $Version" -ForegroundColor Green

# ── Step 5: Build and deploy ──────────────────────────────────────────────
Write-Host "`n[5/6] Building and deploying to $Environment..." -ForegroundColor Yellow

# Install
pnpm install --frozen-lockfile
if ($LASTEXITCODE -ne 0) {
    Write-Error "pnpm install failed!"
    git checkout "$currentBranch"
    exit 1
}

# Build
pnpm build
if ($LASTEXITCODE -ne 0) {
    Write-Error "Build failed!"
    git checkout "$currentBranch"
    exit 1
}

# Deploy
$vercelArgs = @("deploy", "--prebuilt")
if ($Environment -eq "production") { $vercelArgs += "--prod" }
else { $vercelArgs += "--target", $Environment }

& "npx" "vercel" $vercelArgs
if ($LASTEXITCODE -ne 0) {
    Write-Error "Vercel deploy failed!"
    # Restore original state
    git checkout "$currentBranch"
    if ($currentBranch -ne "HEAD") { git stash pop }
    exit 1
}

# ── Step 6: Verify deployment ─────────────────────────────────────────────
Write-Host "`n[6/6] Verifying deployment..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

$domain = switch ($Environment) {
    "development" { "https://dev.petemart.vercel.app" }
    "qa"          { "https://qa.petemart.vercel.app" }
    "staging"     { "https://staging.petemart.vercel.app" }
    "production"  { "https://petemart.vercel.app" }
}

try {
    $response = Invoke-WebRequest -Uri $domain -TimeoutSec 30 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "  ✅ Deployment verified: $domain → $($response.StatusCode)" -ForegroundColor Green
    }
    else {
        Write-Warning "  ⚠️  Deployment returned status $($response.StatusCode)"
    }
}
catch {
    Write-Warning "  ⚠️  Could not verify deployment: $_"
}

# ── Restore original branch ───────────────────────────────────────────────
Write-Host "`nRestoring original branch: $currentBranch..." -ForegroundColor Yellow
git checkout "$currentBranch"
git branch -D "rollback/$Environment/$Version"

Write-Host "`n============================================" -ForegroundColor Green
Write-Host "  ✅ Rollback to $Version on $Environment complete!" -ForegroundColor Green
Write-Host "  🔄 Run 'git stash pop' to restore working changes" -ForegroundColor Gray
Write-Host "============================================" -ForegroundColor Green

# ── Log the rollback ──────────────────────────────────────────────────────
$logEntry = @{
    Timestamp   = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
    Environment = $Environment
    Version     = $Version
    Reason      = $Reason
    User        = $env:USERNAME
}
$logPath = Join-Path $ROOT_DIR "scripts\rollback-history.json"
if (Test-Path $logPath) {
    $log = Get-Content $logPath | ConvertFrom-Json
    $log += $logEntry
}
else {
    $log = @($logEntry)
}
$log | ConvertTo-Json -Depth 3 | Set-Content $logPath
Write-Host "  📝 Rollback logged to: $logPath" -ForegroundColor Gray
