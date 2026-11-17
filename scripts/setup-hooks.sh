#!/usr/bin/env bash
# Setup Git Hooks for Gatherly (Bash for Linux/Mac/Git Bash)
# Configures Git to use version-controlled .githooks directory

set -euo pipefail

echo "=========================================="
echo " Gatherly Git Hooks Setup (Linux/Mac/Bash)"
echo "=========================================="

git config core.hooksPath .githooks
chmod +x .githooks/* scripts/*.sh 2>/dev/null || true

echo "[OK] Git hooks path configured to: .githooks"
echo "[OK] Post-merge hook will automatically update docs/SYNC_LOG.md on every git pull."
echo ""
echo "Setup complete! You can now use 'npm run pull' for daily work."
