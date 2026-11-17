# Gatherly Safe Pull Wrapper (PowerShell)
# Runs git pull, invokes the sync logger, and prints a colored summary

$ErrorActionPreference = "Continue"

Write-Host "`n=======================================================" -ForegroundColor Cyan
Write-Host " 🚀 Gatherly Git Pull & Team Sync Utility" -ForegroundColor Cyan
Write-Host "=======================================================`n" -ForegroundColor Cyan

# 1. Capture HEAD before pull
$prevHead = (git rev-parse -q --verify HEAD 2>$null)
$branch = (git rev-parse --abbrev-ref HEAD 2>$null)

# 2. Execute git pull
Write-Host "[1/3] Pulling latest changes from remote ($branch)..." -ForegroundColor Yellow
$pullOutput = git pull 2>&1
Write-Host ($pullOutput -join "`n")

# 3. Capture HEAD after pull
$newHead = (git rev-parse -q --verify HEAD 2>$null)

# 4. Check if anything changed
if (-not $prevHead -or -not $newHead -or ($prevHead -eq $newHead)) {
    Write-Host "`n✅ Local branch '$branch' is already up to date. No new commits." -ForegroundColor Green
    Write-Host "=======================================================`n" -ForegroundColor Cyan
    exit 0
}

Write-Host "`n[2/3] Updating docs/SYNC_LOG.md..." -ForegroundColor Yellow
& "$PSScriptRoot\sync-log.ps1" $prevHead $newHead

# 5. Extract summary metrics
$commitLines = @(git log --pretty=format:"%h %s (%an)" "$prevHead..$newHead" 2>$null)
$diffFiles = @(git diff --name-status "$prevHead" "$newHead" 2>$null)

Write-Host "`n[3/3] Sync Summary & Team Action Items:" -ForegroundColor Cyan
Write-Host "-------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "New Commits ($($commitLines.Count)):" -ForegroundColor Green
foreach ($c in $commitLines) {
    Write-Host "  * $c" -ForegroundColor White
}

Write-Host "`nFiles Changed ($($diffFiles.Count)):" -ForegroundColor Green
$pkgChanged = $false
$reqChanged = $false
$envChanged = $false
$dbChanged = $false
$apiChanged = $false

foreach ($f in $diffFiles) {
    if ([string]::IsNullOrWhiteSpace($f)) { continue }
    $parts = $f -split "`t"
    $status = $parts[0]
    $file = if ($parts.Count -gt 1) { $parts[1] } else { "" }
    Write-Host "  [$status] $file" -ForegroundColor Gray

    if ($file -like "*package.json") { $pkgChanged = $true }
    if ($file -like "*requirements.txt") { $reqChanged = $true }
    if ($file -like "*.env.example*") { $envChanged = $true }
    if ($file -like "*models/*" -or $file -like "*DATABASE.md*") { $dbChanged = $true }
    if ($file -like "*routes/*" -or $file -like "*API_CONTRACT.md*") { $apiChanged = $true }
}

Write-Host "`n📋 Team Catch-up Checklist:" -ForegroundColor Magenta
if ($pkgChanged) {
    Write-Host "  [!] package.json changed -> RUN: npm install" -ForegroundColor Red
} else {
    Write-Host "  [x] Node dependencies up to date" -ForegroundColor DarkGray
}

if ($reqChanged) {
    Write-Host "  [!] requirements.txt changed -> RUN: pip install -r requirements.txt" -ForegroundColor Red
} else {
    Write-Host "  [x] Python requirements up to date" -ForegroundColor DarkGray
}

if ($envChanged) {
    Write-Host "  [!] .env.example changed -> CHECK: docs/ENV_SETUP.md and update local .env" -ForegroundColor Yellow
} else {
    Write-Host "  [x] Environment variables unchanged" -ForegroundColor DarkGray
}

if ($dbChanged) {
    Write-Host "  [!] Database models changed -> CHECK: docs/DATABASE.md" -ForegroundColor Yellow
} else {
    Write-Host "  [x] Database schema unchanged" -ForegroundColor DarkGray
}

if ($apiChanged) {
    Write-Host "  [!] API endpoints changed -> CHECK: docs/API_CONTRACT.md" -ForegroundColor Yellow
} else {
    Write-Host "  [x] API contract unchanged" -ForegroundColor DarkGray
}

Write-Host "`n💡 Tip: Restart backend and AI service servers if server code changed." -ForegroundColor Cyan
Write-Host "=======================================================`n" -ForegroundColor Cyan
