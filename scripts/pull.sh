#!/usr/bin/env bash
# Gatherly Safe Pull Wrapper (Bash for Linux/Mac/Git Bash)
# Runs git pull, invokes the sync logger, and prints a colored summary

set -euo pipefail

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
MAGENTA='\033[0;35m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

echo -e "\n${CYAN}=======================================================${NC}"
echo -e "${CYAN} 🚀 Gatherly Git Pull & Team Sync Utility${NC}"
echo -e "${CYAN}=======================================================\n${NC}"

# 1. Capture HEAD before pull
PREV_HEAD=$(git rev-parse -q --verify HEAD 2>/dev/null || true)
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")

# 2. Execute git pull
echo -e "${YELLOW}[1/3] Pulling latest changes from remote (${BRANCH})...${NC}"
git pull || true

# 3. Capture HEAD after pull
NEW_HEAD=$(git rev-parse -q --verify HEAD 2>/dev/null || true)

# 4. Check if anything changed
if [ -z "$PREV_HEAD" ] || [ -z "$NEW_HEAD" ] || [ "$PREV_HEAD" = "$NEW_HEAD" ]; then
  echo -e "\n${GREEN}✅ Local branch '${BRANCH}' is already up to date. No new commits.${NC}"
  echo -e "${CYAN}=======================================================\n${NC}"
  exit 0
fi

echo -e "\n${YELLOW}[2/3] Updating docs/SYNC_LOG.md...${NC}"
bash ./scripts/sync-log.sh "$PREV_HEAD" "$NEW_HEAD"

# 5. Extract summary metrics
COMMIT_LINES=$(git log --pretty=format:"%h %s (%an)" "$PREV_HEAD..$NEW_HEAD" 2>/dev/null || true)
DIFF_FILES=$(git diff --name-status "$PREV_HEAD" "$NEW_HEAD" 2>/dev/null || true)

COMMIT_COUNT=$(echo "$COMMIT_LINES" | wc -l | tr -d ' ')
FILE_COUNT=$(echo "$DIFF_FILES" | grep -v '^$' | wc -l | tr -d ' ')

echo -e "\n${CYAN}[3/3] Sync Summary & Team Action Items:${NC}"
echo -e "${GRAY}-------------------------------------------------------${NC}"
echo -e "${GREEN}New Commits (${COMMIT_COUNT}):${NC}"
while IFS= read -r line; do
  [ -n "$line" ] && echo -e "  * $line"
done <<< "$COMMIT_LINES"

echo -e "\n${GREEN}Files Changed (${FILE_COUNT}):${NC}"
PKG_CHANGED=0
REQ_CHANGED=0
ENV_CHANGED=0
DB_CHANGED=0
API_CHANGED=0

while IFS=$'\t' read -r status file extra; do
  [ -z "$status" ] && continue
  echo -e "  ${GRAY}[$status] $file${NC}"
  case "$file" in
    *package.json) PKG_CHANGED=1 ;;
    *requirements.txt) REQ_CHANGED=1 ;;
    *.env.example*) ENV_CHANGED=1 ;;
    *models/*|*DATABASE.md*) DB_CHANGED=1 ;;
    *routes/*|*API_CONTRACT.md*) API_CHANGED=1 ;;
  esac
done <<< "$DIFF_FILES"

echo -e "\n${MAGENTA}📋 Team Catch-up Checklist:${NC}"
if [ $PKG_CHANGED -eq 1 ]; then
  echo -e "  ${RED}[!] package.json changed -> RUN: npm install${NC}"
else
  echo -e "  ${GRAY}[x] Node dependencies up to date${NC}"
fi

if [ $REQ_CHANGED -eq 1 ]; then
  echo -e "  ${RED}[!] requirements.txt changed -> RUN: pip install -r requirements.txt${NC}"
else
  echo -e "  ${GRAY}[x] Python requirements up to date${NC}"
fi

if [ $ENV_CHANGED -eq 1 ]; then
  echo -e "  ${YELLOW}[!] .env.example changed -> CHECK: docs/ENV_SETUP.md and update local .env${NC}"
else
  echo -e "  ${GRAY}[x] Environment variables unchanged${NC}"
fi

if [ $DB_CHANGED -eq 1 ]; then
  echo -e "  ${YELLOW}[!] Database models changed -> CHECK: docs/DATABASE.md${NC}"
else
  echo -e "  ${GRAY}[x] Database schema unchanged${NC}"
fi

if [ $API_CHANGED -eq 1 ]; then
  echo -e "  ${YELLOW}[!] API endpoints changed -> CHECK: docs/API_CONTRACT.md${NC}"
else
  echo -e "  ${GRAY}[x] API contract unchanged${NC}"
fi

echo -e "\n${CYAN}💡 Tip: Restart backend and AI service servers if server code changed.${NC}"
echo -e "${CYAN}=======================================================\n${NC}"
