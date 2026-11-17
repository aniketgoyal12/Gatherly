# Setup Git Hooks for Gatherly (PowerShell)
# Configures Git to use version-controlled .githooks directory

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Gatherly Git Hooks Setup (Windows)" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

try {
    $currentHooksPath = (git config core.hooksPath 2>$null)
    if ($currentHooksPath -eq ".githooks") {
        Write-Host "[OK] Git hooks path is already set to: .githooks" -ForegroundColor Green
    } else {
        git config core.hooksPath .githooks
        Write-Host "[OK] Git hooks path configured to: .githooks" -ForegroundColor Green
    }
    Write-Host "[OK] Post-merge hook will automatically update docs/SYNC_LOG.md on every git pull." -ForegroundColor Green
    Write-Host "`nSetup complete! You can now use 'npm run pull' for daily work." -ForegroundColor Green
} catch {
    $check = (git config core.hooksPath 2>$null)
    if ($check -eq ".githooks") {
        Write-Host "[OK] Git hooks path verified: .githooks" -ForegroundColor Green
        Write-Host "`nSetup complete! You can now use 'npm run pull' for daily work." -ForegroundColor Green
    } else {
        Write-Host "[WARNING] Could not execute git config automatically. Please run manually: git config core.hooksPath .githooks" -ForegroundColor Yellow
    }
}
