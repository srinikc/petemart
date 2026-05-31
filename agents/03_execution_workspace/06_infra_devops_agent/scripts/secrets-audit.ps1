# =============================================================================
# PeteMart — Secrets & Credentials Audit Script
# =============================================================================
# Scans the entire repository for hardcoded secrets, tokens, and credentials.
# Fails with exit code 1 if any are found.
#
# Usage:
#   .\scripts\secrets-audit.ps1
#   .\scripts\secrets-audit.ps1 -Path "C:\project" -FailOnWarning
# =============================================================================

param(
    [string]$Path = ".",
    [switch]$FailOnWarning,
    [switch]$GenerateReport
)

$ROOT_DIR = Resolve-Path $Path
$issues = @()
$warnings = @()

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  🔐 PeteMart Secrets Audit" -ForegroundColor Cyan
Write-Host "  Scanning: $ROOT_DIR" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# Patterns that indicate hardcoded secrets
$patterns = @(
    # AWS
    @{ Pattern = 'AKIA[0-9A-Z]{16}'; Severity = 'error'; Description = 'AWS Access Key ID' }
    @{ Pattern = '(?<![A-Za-z0-9/+=])[A-Za-z0-9/+=]{40}(?![A-Za-z0-9/+=])'; Severity = 'warning'; Description = 'AWS Secret Access Key (base64 40 chars)' }
    # GitHub
    @{ Pattern = 'ghp_[A-Za-z0-9]{36}'; Severity = 'error'; Description = 'GitHub Personal Access Token' }
    @{ Pattern = 'gho_[A-Za-z0-9]{36}'; Severity = 'error'; Description = 'GitHub OAuth Access Token' }
    @{ Pattern = 'github_pat_[A-Za-z0-9]{4,}'; Severity = 'error'; Description = 'GitHub Fine-Grained PAT' }
    # Generic
    @{ Pattern = '(?i)(password|passwd|pwd)\s*[:=]\s*["''](?![*]).+["'']'; Severity = 'error'; Description = 'Hardcoded Password' }
    @{ Pattern = '(?i)(api[_-]?key|apikey)\s*[:=]\s*["''](?![*]).+["'']'; Severity = 'error'; Description = 'Hardcoded API Key' }
    @{ Pattern = '(?i)(secret|token|auth)\s*[:=]\s*["''](?![*]).+["'']'; Severity = 'warning'; Description = 'Possible Hardcoded Secret/Token' }
    @{ Pattern = '(?i)jdbc:[a-z]+://[^"''\s]+:[^"''\s]+@'; Severity = 'error'; Description = 'Database connection string with credentials' }
    @{ Pattern = 'postgres://[^:]+:[^@]+@'; Severity = 'error'; Description = 'PostgreSQL connection string with password' }
    @{ Pattern = 'mongodb://[^:]+:[^@]+@'; Severity = 'error'; Description = 'MongoDB connection string with password' }
    @{ Pattern = 'redis://:[^@]+@'; Severity = 'error'; Description = 'Redis connection string with password' }
    @{ Pattern = '-----BEGIN (RSA |EC |DSA )?PRIVATE KEY-----'; Severity = 'error'; Description = 'Private Key' }
    @{ Pattern = '-----BEGIN CERTIFICATE-----'; Severity = 'warning'; Description = 'Certificate (should not be in repo)' }
    @{ Pattern = 'SUPABASE_SERVICE_ROLE_KEY\s*=\s*["''](?!\*)'; Severity = 'error'; Description = 'Supabase Service Role Key (plaintext)' }
    @{ Pattern = 'SLACK_BOT_TOKEN\s*=\s*["''](?!\*)'; Severity = 'warning'; Description = 'Slack Bot Token' }
    @{ Pattern = 'STRIPE_(SECRET|API)_KEY\s*=\s*["''](?!\*)'; Severity = 'error'; Description = 'Stripe Secret Key' }
    @{ Pattern = 'sk_live_[A-Za-z0-9]{20,}'; Severity = 'error'; Description = 'Stripe Live Secret Key' }
    @{ Pattern = 'pk_live_[A-Za-z0-9]{20,}'; Severity = 'warning'; Description = 'Stripe Live Publishable Key' }
)

# Files to exclude
$excludePatterns = @(
    'node_modules',
    '.next',
    '.git',
    'package-lock.json',
    'pnpm-lock.yaml',
    '*.log',
    'coverage'
)

Write-Host "`nScanning for secrets patterns..." -ForegroundColor Yellow

# Get all non-excluded files
$files = Get-ChildItem -Path $ROOT_DIR -File -Recurse | Where-Object {
    $included = $true
    foreach ($exclude in $excludePatterns) {
        if ($_.FullName -match [regex]::Escape($exclude)) {
            $included = $false
            break
        }
    }
    return $included
}

$totalFiles = $files.Count
$scannedFiles = 0
$foundIssues = 0

foreach ($file in $files) {
    $scannedFiles++
    if ($scannedFiles % 100 -eq 0) {
        Write-Host "  Progress: $scannedFiles / $totalFiles files scanned..." -ForegroundColor Gray
    }

    try {
        $content = Get-Content -LiteralPath $file.FullName -Raw -ErrorAction Stop
    }
    catch {
        continue  # Binary file, skip
    }

    foreach ($rule in $patterns) {
        $matches = [regex]::Matches($content, $rule.Pattern)
        foreach ($match in $matches) {
            $relativePath = [System.IO.Path]::GetRelativePath($ROOT_DIR, $file.FullName)
            $lineNumber = ($content.Substring(0, $match.Index).Split("`n").Count)

            $issue = @{
                File     = $relativePath
                Line     = $lineNumber
                Severity = $rule.Severity
                Pattern  = $rule.Description
                Match    = $match.Value.Substring(0, [Math]::Min(20, $match.Value.Length)) + "..."
            }

            if ($rule.Severity -eq 'error') {
                $issues += $issue
                Write-Host "  ❌ ERROR: $($rule.Description) in $relativePath`:$lineNumber" -ForegroundColor Red
            }
            else {
                $warnings += $issue
                Write-Host "  ⚠️  WARNING: $($rule.Description) in $relativePath`:$lineNumber" -ForegroundColor Yellow
            }
            $foundIssues++
        }
    }
}

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "  Audit Complete" -ForegroundColor Cyan
Write-Host "  Files Scanned: $scannedFiles" -ForegroundColor Cyan
Write-Host "  Errors: $($issues.Count)" -ForegroundColor $(if ($issues.Count -gt 0) { "Red" } else { "Green" })
Write-Host "  Warnings: $($warnings.Count)" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan

# Generate report
if ($GenerateReport) {
    $reportPath = Join-Path $ROOT_DIR "secrets-audit-report.json"
    $report = @{
        timestamp       = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
        filesScanned    = $scannedFiles
        errors          = $issues.Count
        warnings        = $warnings.Count
        errorDetails    = $issues
        warningDetails  = $warnings
    }
    $report | ConvertTo-Json -Depth 5 | Set-Content $reportPath
    Write-Host "  📝 Report generated: $reportPath" -ForegroundColor Gray
}

# Fail on errors
if ($issues.Count -gt 0) {
    Write-Host "`n❌ Secrets audit FAILED: $($issues.Count) error(s) found." -ForegroundColor Red
    exit 1
}

if ($FailOnWarning -and $warnings.Count -gt 0) {
    Write-Host "`n⚠️  Secrets audit WARNED: $($warnings.Count) warning(s) found." -ForegroundColor Yellow
    exit 1
}

Write-Host "`n✅ Secrets audit PASSED. No hardcoded credentials detected." -ForegroundColor Green
exit 0
