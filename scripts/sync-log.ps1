# Gatherly Git Pull Sync Logger (PowerShell)
# Automatically updates docs/SYNC_LOG.md after git pull / merge

$ErrorActionPreference = "Stop"

# 1. Determine commit range
$head = (git rev-parse -q --verify HEAD 2>$null)
$origHead = (git rev-parse -q --verify ORIG_HEAD 2>$null)

# Support explicit arguments (e.g. .\scripts\sync-log.ps1 HEAD~1 HEAD)
if ($args.Count -ge 2) {
    $origHead = (git rev-parse -q --verify $args[0] 2>$null)
    $head = (git rev-parse -q --verify $args[1] 2>$null)
}

if (-not $head) {
    Write-Host "[sync-log] No git HEAD detected. Skipping." -ForegroundColor Yellow
    exit 0
}

if (-not $origHead -or ($origHead -eq $head)) {
    Write-Host "[sync-log] Already up to date. No new commits to log." -ForegroundColor Green
    exit 0
}

$shortOld = (git rev-parse --short $origHead 2>$null)
$shortNew = (git rev-parse --short $head 2>$null)
$range = "$origHead..$head"

# 2. Extract commits
$rawCommits = @(git log --pretty=format:"%h|%an|%s" $range 2>$null)
if ($rawCommits.Count -eq 0 -or [string]::IsNullOrWhiteSpace($rawCommits[0])) {
    Write-Host "[sync-log] No commits found in range $shortOld..$shortNew." -ForegroundColor Green
    exit 0
}

$commitCount = $rawCommits.Count
$branch = (git rev-parse --abbrev-ref HEAD 2>$null)
if (-not $branch) { $branch = "main" }

$puller = (git config user.name 2>$null)
if (-not $puller) { $puller = $env:USERNAME }
if (-not $puller) { $puller = "Developer" }

$timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
$nowIST = "$timestamp IST"

# 3. Extract authors
$authors = @(git log --pretty=format:"%an" $range 2>$null | Sort-Object -Unique)
$authorsStr = $authors -join ", "

# 4. Extract file diff statistics
$diffLines = @(git diff --name-status $origHead $head 2>$null)
$addedCount = 0
$modifiedCount = 0
$deletedCount = 0
$filesChangedList = @()

$pkgChanged = $false
$reqChanged = $false
$envChanged = $false
$dbChanged = $false
$apiChanged = $false

foreach ($line in $diffLines) {
    if ([string]::IsNullOrWhiteSpace($line)) { continue }
    $parts = $line -split "`t"
    $statusCode = $parts[0].Trim()
    $filePath = if ($parts.Count -gt 1) { $parts[1].Trim() } else { "" }
    $filesChangedList += $filePath

    if ($statusCode -like "A*") { $addedCount++ }
    elseif ($statusCode -like "M*") { $modifiedCount++ }
    elseif ($statusCode -like "D*") { $deletedCount++ }
    else { $modifiedCount++ }

    if ($filePath -like "*package.json*") { $pkgChanged = $true }
    if ($filePath -like "*requirements.txt*") { $reqChanged = $true }
    if ($filePath -like "*.env.example*") { $envChanged = $true }
    if ($filePath -like "*models/*" -or $filePath -like "*DATABASE.md*") { $dbChanged = $true }
    if ($filePath -like "*routes/*" -or $filePath -like "*API_CONTRACT.md*") { $apiChanged = $true }
}

$totalFilesChanged = $filesChangedList.Count

# 5. Group commits by Conventional Commit type
$groupedCommits = @{
    "feat" = New-Object System.Collections.ArrayList
    "fix" = New-Object System.Collections.ArrayList
    "docs" = New-Object System.Collections.ArrayList
    "refactor" = New-Object System.Collections.ArrayList
    "test" = New-Object System.Collections.ArrayList
    "chore" = New-Object System.Collections.ArrayList
    "other" = New-Object System.Collections.ArrayList
}

$summaries = @()

foreach ($c in $rawCommits) {
    if ([string]::IsNullOrWhiteSpace($c)) { continue }
    $cParts = $c -split "\|", 3
    if ($cParts.Count -lt 3) { continue }
    $cHash = $cParts[0]
    $cSubject = $cParts[2].Trim()
    $summaries += $cSubject

    $itemText = "- ``$cHash`` $cSubject"

    if ($cSubject -match "^(?i)feat(\(.*?\))?:\s*(.+)$") {
        [void]$groupedCommits["feat"].Add($itemText)
    } elseif ($cSubject -match "^(?i)fix(\(.*?\))?:\s*(.+)$") {
        [void]$groupedCommits["fix"].Add($itemText)
    } elseif ($cSubject -match "^(?i)docs(\(.*?\))?:\s*(.+)$") {
        [void]$groupedCommits["docs"].Add($itemText)
    } elseif ($cSubject -match "^(?i)refactor(\(.*?\))?:\s*(.+)$") {
        [void]$groupedCommits["refactor"].Add($itemText)
    } elseif ($cSubject -match "^(?i)test(\(.*?\))?:\s*(.+)$") {
        [void]$groupedCommits["test"].Add($itemText)
    } elseif ($cSubject -match "^(?i)chore(\(.*?\))?:\s*(.+)$") {
        [void]$groupedCommits["chore"].Add($itemText)
    } else {
        [void]$groupedCommits["other"].Add($itemText)
    }
}

$shortSummary = ($summaries | Select-Object -First 2) -join "; "
if ($summaries.Count -gt 2) {
    $shortSummary += " (+ $($summaries.Count - 2) more)"
}
$shortSummary = $shortSummary.Replace("|", "/")

$docsUpdatedStr = if ($groupedCommits["docs"].Count -gt 0 -or $dbChanged -or $apiChanged) { "Yes" } else { "No" }

# 6. Format high impact warnings
$warningsList = @()
if ($pkgChanged) { $warningsList += "  - ⚠️ Dependencies changed (`package.json`) -> Run: ``npm install``" }
if ($reqChanged) { $warningsList += "  - ⚠️ Python requirements changed (`requirements.txt`) -> Run: ``pip install -r requirements.txt``" }
if ($envChanged) { $warningsList += "  - ⚠️ Environment templates updated -> Check ``.env.example`` & update ``.env``" }
if ($dbChanged)  { $warningsList += "  - ⚠️ Database models or specs updated -> Check ``docs/DATABASE.md``" }
if ($apiChanged) { $warningsList += "  - ⚠️ API routes or contract updated -> Check ``docs/API_CONTRACT.md``" }

$warningsMd = ""
if ($warningsList.Count -gt 0) {
    $warningsMd = "`n- **High-Impact Detections:**`n" + ($warningsList -join "`n")
} else {
    $warningsMd = "`n- **High-Impact Detections:** None (Safe standard update)"
}

# 7. Construct new Latest Sync block
$newLatestSync = "<!-- LATEST_SYNC_START -->`n" +
"- **Date / Time:** $nowIST`n" +
"- **Puller:** $puller`n" +
"- **Branch:** `$branch```n" +
"- **Commit Range:** `$shortOld``` -> `$shortNew```n" +
"- **Commits Pulled:** $commitCount`n" +
"- **Files Changed:** $totalFilesChanged files (`+$addedCount` added, `~$modifiedCount` modified, `-$deletedCount` deleted)$warningsMd`n" +
"<!-- LATEST_SYNC_END -->"

# 8. Construct new History Entry
$bulletsList = @()
foreach ($key in @("feat", "fix", "docs", "refactor", "test", "chore", "other")) {
    $items = $groupedCommits[$key]
    if ($items.Count -gt 0) {
        $bulletsList += "- **``$key``**:"
        foreach ($item in $items) {
            $bulletsList += "  $item"
        }
    }
}
$bulletsStr = $bulletsList -join "`n"

$newHistoryEntry = "`n### Sync Entry: $nowIST (`$branch`)`n" +
"- **Puller:** $puller`n" +
"- **Commit Range:** `$shortOld...$shortNew` ($commitCount commits)`n" +
"- **Authors:** $authorsStr`n`n" +
"| Date / Time | Puller | Branch | Commits Pulled | Authors | Summary of Changes | Files Added | Files Modified | Files Deleted | Docs Updated? |`n" +
"| :---: | :---: | :---: | :---: | :---: | :--- | :---: | :---: | :---: | :---: |`n" +
"| $timestamp | $puller | `$branch` | $commitCount | $authorsStr | $shortSummary | $addedCount | $modifiedCount | $deletedCount | $docsUpdatedStr |`n`n" +
"#### What's New in This Sync`n" +
"$bulletsStr`n"

# 9. Update docs/SYNC_LOG.md
$syncLogPath = Join-Path $PSScriptRoot "..\docs\SYNC_LOG.md"
if (Test-Path $syncLogPath) {
    $content = [System.IO.File]::ReadAllText($syncLogPath, [System.Text.Encoding]::UTF8)

    # Replace Latest Sync section
    $patternLatest = '(?s)<!-- LATEST_SYNC_START -->.*?<!-- LATEST_SYNC_END -->'
    if ($content -match $patternLatest) {
        $content = [regex]::Replace($content, $patternLatest, $newLatestSync)
    }

    # Prepend new History Entry
    $patternHistory = '(?s)(<!-- SYNC_HISTORY_START -->)'
    if ($content -match $patternHistory) {
        $content = [regex]::Replace($content, $patternHistory, "`$1`n" + $newHistoryEntry)
    }

    [System.IO.File]::WriteAllText($syncLogPath, $content, [System.Text.Encoding]::UTF8)
    Write-Host "[sync-log] docs/SYNC_LOG.md updated successfully." -ForegroundColor Green
} else {
    Write-Host "[sync-log] Warning: docs/SYNC_LOG.md not found at $syncLogPath" -ForegroundColor Yellow
}
