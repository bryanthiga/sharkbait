#!/bin/bash
# ============================================================
# Sharkbait — Start a New Feature Branch
# Creates a branch so you can experiment without breaking main.
# Usage: bash scripts/new-feature.sh better-map-view
# ============================================================

set -e

if [ -z "$1" ]; then
  echo "Usage: bash scripts/new-feature.sh <feature-name>"
  echo "Example: bash scripts/new-feature.sh better-map-view"
  exit 1
fi

BRANCH="feature/$1"

# Save any current work
if [ -n "$(git status --porcelain)" ]; then
  git add -A
  git commit -m "WIP: save before starting $1"
fi

# Get latest main
git checkout main 2>/dev/null || git checkout master 2>/dev/null
git pull origin HEAD 2>/dev/null || true

# Create and switch to new branch
git checkout -b "$BRANCH"
echo ""
echo "✅ On new branch: $BRANCH"
echo "   Make your changes, then run: bash scripts/save.sh"
echo ""
