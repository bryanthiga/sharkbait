#!/bin/bash
# ============================================================
# Sharkbait — Push to GitHub
# Creates the repo on GitHub if it doesn't exist, commits everything, and pushes.
# Usage: bash scripts/push-github.sh
# ============================================================

set -e
echo ""
echo "🦈 Pushing Sharkbait to GitHub..."
echo ""

# Check for gh CLI
if ! command -v gh &>/dev/null; then
  echo "❌ GitHub CLI required. Install: brew install gh && gh auth login"
  exit 1
fi

# Initialize git if needed
if [ ! -d .git ]; then
  git init
fi

# Stage and commit any changes
if [ -n "$(git status --porcelain)" ]; then
  git add -A
  git commit -m "Update: $(date '+%Y-%m-%d %H:%M')"
  echo "✅ Changes committed"
else
  echo "✅ No new changes to commit"
fi

# Check if remote exists
if ! git remote get-url origin &>/dev/null; then
  echo ""
  echo "📦 Creating GitHub repository..."
  
  # Ask public or private
  read -p "Make the repo public? (y/N): " PUBLIC
  VISIBILITY="--private"
  if [[ "$PUBLIC" =~ ^[Yy]$ ]]; then
    VISIBILITY="--public"
  fi
  
  gh repo create sharkbait $VISIBILITY --source=. --push
  echo "✅ Repository created and pushed!"
else
  echo "📤 Pushing to GitHub..."
  git push -u origin HEAD
  echo "✅ Pushed!"
fi

echo ""
REPO_URL=$(gh repo view --json url -q '.url' 2>/dev/null || echo "")
if [ -n "$REPO_URL" ]; then
  echo "🔗 $REPO_URL"
fi
echo ""
