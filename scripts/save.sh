#!/bin/bash
# ============================================================
# Sharkbait — Quick Save (commit + push)
# Like hitting Cmd+S but for GitHub.
# Usage: bash scripts/save.sh
# Usage: bash scripts/save.sh "what I changed"
# ============================================================

set -e

MSG="${1:-Auto-save: $(date '+%Y-%m-%d %H:%M')}"

if [ -z "$(git status --porcelain)" ]; then
  echo "✅ Nothing to save — everything is already committed."
  exit 0
fi

git add -A
git commit -m "$MSG"

if git remote get-url origin &>/dev/null; then
  git push -u origin HEAD
  echo "✅ Saved and pushed: $MSG"
else
  echo "✅ Saved locally: $MSG"
  echo "   Run 'bash scripts/push-github.sh' to push to GitHub"
fi
