#!/usr/bin/env bash
# Gatherly Git Pull Sync Logger (Bash for Linux/Mac/Git Bash)
# Automatically updates docs/SYNC_LOG.md after git pull / merge

set -euo pipefail

# 1. Determine commit range
HEAD_HASH=$(git rev-parse -q --verify HEAD 2>/dev/null || true)
ORIG_HEAD_HASH=$(git rev-parse -q --verify ORIG_HEAD 2>/dev/null || true)

# Support explicit arguments (e.g. ./scripts/sync-log.sh HEAD~1 HEAD)
if [ $# -ge 2 ]; then
  ORIG_HEAD_HASH=$(git rev-parse -q --verify "$1" 2>/dev/null || true)
  HEAD_HASH=$(git rev-parse -q --verify "$2" 2>/dev/null || true)
fi

if [ -z "$HEAD_HASH" ]; then
  echo "[sync-log] No git HEAD detected. Skipping."
  exit 0
fi

if [ -z "$ORIG_HEAD_HASH" ] || [ "$ORIG_HEAD_HASH" = "$HEAD_HASH" ]; then
  echo "[sync-log] Already up to date. No new commits to log."
  exit 0
fi

SHORT_OLD=$(git rev-parse --short "$ORIG_HEAD_HASH")
SHORT_NEW=$(git rev-parse --short "$HEAD_HASH")
RANGE="$ORIG_HEAD_HASH..$HEAD_HASH"

# 2. Extract commit info
COMMITS_RAW=$(git log --pretty=format:"%h|%an|%s" "$RANGE" 2>/dev/null || true)
if [ -z "$COMMITS_RAW" ]; then
  echo "[sync-log] No commits found in range $SHORT_OLD..$SHORT_NEW."
  exit 0
fi

COMMIT_COUNT=$(echo "$COMMITS_RAW" | wc -l | tr -d ' ')
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")
PULLER=$(git config user.name 2>/dev/null || echo "${USER:-Developer}")
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
NOW_IST="${TIMESTAMP} IST"

# Authors
AUTHORS=$(git log --pretty=format:"%an" "$RANGE" 2>/dev/null | sort -u | paste -sd ", " - || echo "$PULLER")

# 3. Extract diff stats
DIFF_LINES=$(git diff --name-status "$ORIG_HEAD_HASH" "$HEAD_HASH" 2>/dev/null || true)

ADDED_COUNT=0
MODIFIED_COUNT=0
DELETED_COUNT=0
TOTAL_FILES=0

PKG_CHANGED=0
REQ_CHANGED=0
ENV_CHANGED=0
DB_CHANGED=0
API_CHANGED=0

if [ -n "$DIFF_LINES" ]; then
  while IFS=$'\t' read -r status_code file_path extra; do
    [ -z "$status_code" ] && continue
    TOTAL_FILES=$((TOTAL_FILES + 1))
    case "$status_code" in
      A*) ADDED_COUNT=$((ADDED_COUNT + 1)) ;;
      M*) MODIFIED_COUNT=$((MODIFIED_COUNT + 1)) ;;
      D*) DELETED_COUNT=$((DELETED_COUNT + 1)) ;;
      *) MODIFIED_COUNT=$((MODIFIED_COUNT + 1)) ;;
    esac

    case "$file_path" in
      *package.json) PKG_CHANGED=1 ;;
      *requirements.txt) REQ_CHANGED=1 ;;
      *.env.example*) ENV_CHANGED=1 ;;
      *models/*|*DATABASE.md*) DB_CHANGED=1 ;;
      *routes/*|*API_CONTRACT.md*) API_CHANGED=1 ;;
    esac
  done <<< "$DIFF_LINES"
fi

# 4. Group commits by Conventional Commit type
FEAT_LIST=""
FIX_LIST=""
DOCS_LIST=""
REFACTOR_LIST=""
TEST_LIST=""
CHORE_LIST=""
OTHER_LIST=""
SUMMARIES=""
COUNT=0

while IFS='|' read -r c_hash c_author c_subject; do
  [ -z "$c_hash" ] && continue
  if [ $COUNT -lt 2 ]; then
    if [ -z "$SUMMARIES" ]; then
      SUMMARIES="$c_subject"
    else
      SUMMARIES="$SUMMARIES; $c_subject"
    fi
  fi
  COUNT=$((COUNT + 1))

  # Categorize by conventional prefix
  case "$c_subject" in
    [fF][eE][aA][tT]*) FEAT_LIST="${FEAT_LIST}\n  - \`$c_hash\` $c_subject" ;;
    [fF][iI][xX]*) FIX_LIST="${FIX_LIST}\n  - \`$c_hash\` $c_subject" ;;
    [dD][oO][cC][sS]*) DOCS_LIST="${DOCS_LIST}\n  - \`$c_hash\` $c_subject" ;;
    [rR][eE][fF][aA][cC][tT][oO][rR]*) REFACTOR_LIST="${REFACTOR_LIST}\n  - \`$c_hash\` $c_subject" ;;
    [tT][eE][sS][tT]*) TEST_LIST="${TEST_LIST}\n  - \`$c_hash\` $c_subject" ;;
    [cC][hH][oO][rR][eE]*) CHORE_LIST="${CHORE_LIST}\n  - \`$c_hash\` $c_subject" ;;
    *) OTHER_LIST="${OTHER_LIST}\n  - \`$c_hash\` $c_subject" ;;
  esac
done <<< "$COMMITS_RAW"

if [ $COUNT -gt 2 ]; then
  SUMMARIES="$SUMMARIES (+ $((COUNT - 2)) more)"
fi
SUMMARIES=$(echo "$SUMMARIES" | tr '|' '/')

DOCS_UPDATED="No"
if [ -n "$DOCS_LIST" ] || [ $DB_CHANGED -eq 1 ] || [ $API_CHANGED -eq 1 ]; then
  DOCS_UPDATED="Yes"
fi

# High impact warnings
WARNINGS=""
[ $PKG_CHANGED -eq 1 ] && WARNINGS="${WARNINGS}\n  - ⚠️ Dependencies changed (\`package.json\`) -> Run: \`npm install\`"
[ $REQ_CHANGED -eq 1 ] && WARNINGS="${WARNINGS}\n  - ⚠️ Python requirements changed (\`requirements.txt\`) -> Run: \`pip install -r requirements.txt\`"
[ $ENV_CHANGED -eq 1 ] && WARNINGS="${WARNINGS}\n  - ⚠️ Environment templates updated -> Check \`.env.example\` & update \`.env\`"
[ $DB_CHANGED -eq 1 ] && WARNINGS="${WARNINGS}\n  - ⚠️ Database models or specs updated -> Check \`docs/DATABASE.md\`"
[ $API_CHANGED -eq 1 ] && WARNINGS="${WARNINGS}\n  - ⚠️ API routes or contract updated -> Check \`docs/API_CONTRACT.md\`"

if [ -n "$WARNINGS" ]; then
  WARNINGS_BLOCK="\n- **High-Impact Detections:**${WARNINGS}"
else
  WARNINGS_BLOCK="\n- **High-Impact Detections:** None (Safe standard update)"
fi

# 5. Build New Latest Sync block
LATEST_BLOCK="<!-- LATEST_SYNC_START -->\n- **Date / Time:** $NOW_IST\n- **Puller:** $PULLER\n- **Branch:** \`$BRANCH\`\n- **Commit Range:** \`$SHORT_OLD\` -> \`$SHORT_NEW\`\n- **Commits Pulled:** $COMMIT_COUNT\n- **Files Changed:** $TOTAL_FILES files (\`+$ADDED_COUNT\` added, \`~$MODIFIED_COUNT\` modified, \`-$DELETED_COUNT\` deleted)${WARNINGS_BLOCK}\n<!-- LATEST_SYNC_END -->"

# 6. Build History Entry
BULLETS=""
[ -n "$FEAT_LIST" ] && BULLETS="${BULLETS}\n- **\`feat\`**:${FEAT_LIST}"
[ -n "$FIX_LIST" ] && BULLETS="${BULLETS}\n- **\`fix\`**:${FIX_LIST}"
[ -n "$DOCS_LIST" ] && BULLETS="${BULLETS}\n- **\`docs\`**:${DOCS_LIST}"
[ -n "$REFACTOR_LIST" ] && BULLETS="${BULLETS}\n- **\`refactor\`**:${REFACTOR_LIST}"
[ -n "$TEST_LIST" ] && BULLETS="${BULLETS}\n- **\`test\`**:${TEST_LIST}"
[ -n "$CHORE_LIST" ] && BULLETS="${BULLETS}\n- **\`chore\`**:${CHORE_LIST}"
[ -n "$OTHER_LIST" ] && BULLETS="${BULLETS}\n- **\`other\`**:${OTHER_LIST}"

HISTORY_ENTRY="\n### Sync Entry: $NOW_IST (\`$BRANCH\`)\n- **Puller:** $PULLER\n- **Commit Range:** \`$SHORT_OLD...$SHORT_NEW\` ($COMMIT_COUNT commits)\n- **Authors:** $AUTHORS\n\n| Date / Time | Puller | Branch | Commits Pulled | Authors | Summary of Changes | Files Added | Files Modified | Files Deleted | Docs Updated? |\n| :---: | :---: | :---: | :---: | :---: | :--- | :---: | :---: | :---: | :---: |\n| $TIMESTAMP | $PULLER | \`$BRANCH\` | $COMMIT_COUNT | $AUTHORS | $SUMMARIES | $ADDED_COUNT | $MODIFIED_COUNT | $DELETED_COUNT | $DOCS_UPDATED |\n\n#### What's New in This Sync\n${BULLETS}\n"

# 7. Update docs/SYNC_LOG.md via node (using env vars so backticks/quotes never break JS syntax)
SYNC_LOG_PATH="docs/SYNC_LOG.md"
if [ -f "$SYNC_LOG_PATH" ]; then
  LATEST_BLOCK="$(printf '%b' "$LATEST_BLOCK")" \
  HISTORY_ENTRY="$(printf '%b' "$HISTORY_ENTRY")" \
  SYNC_LOG_PATH="$SYNC_LOG_PATH" \
  node -e '
    const fs = require("fs");
    const filePath = process.env.SYNC_LOG_PATH;
    let content = fs.readFileSync(filePath, "utf8");
    const latestBlock = process.env.LATEST_BLOCK || "";
    const historyEntry = process.env.HISTORY_ENTRY || "";
    content = content.replace(/<!-- LATEST_SYNC_START -->[\s\S]*?<!-- LATEST_SYNC_END -->/, () => latestBlock);
    content = content.replace(/(<!-- SYNC_HISTORY_START -->)/, (_, marker) => marker + "\n" + historyEntry);
    fs.writeFileSync(filePath, content, "utf8");
  '
  echo "[sync-log] docs/SYNC_LOG.md updated successfully."
else
  echo "[sync-log] Warning: $SYNC_LOG_PATH not found."
fi
