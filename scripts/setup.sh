#!/bin/bash
# ============================================================
# Sharkbait — First-Time Setup
# Run this ONCE when you open the project in Cursor for the first time.
# Usage: bash scripts/setup.sh
# ============================================================

set -e
echo ""
echo "🦈 Sharkbait Setup"
echo "=================="
echo ""

# ---------- 1. Check for Node.js ----------
if ! command -v node &>/dev/null; then
  echo "❌ Node.js not found. Install it from https://nodejs.org (LTS version)"
  exit 1
fi
echo "✅ Node.js $(node -v)"

# ---------- 2. Check for git ----------
if ! command -v git &>/dev/null; then
  echo "❌ Git not found. Install Xcode Command Line Tools: xcode-select --install"
  exit 1
fi
echo "✅ Git $(git --version | cut -d' ' -f3)"

# ---------- 3. Check for GitHub CLI ----------
if ! command -v gh &>/dev/null; then
  echo "⚠️  GitHub CLI not found. Install it: brew install gh"
  echo "   Then run: gh auth login"
else
  echo "✅ GitHub CLI $(gh --version | head -1 | cut -d' ' -f3)"
fi

# ---------- 4. Initialize git if needed ----------
if [ ! -d .git ]; then
  echo ""
  echo "📦 Initializing git repo..."
  git init
  git add -A
  git commit -m "Initial commit — Sharkbait shark sighting tracker"
  echo "✅ Git repo initialized with initial commit"
else
  echo "✅ Git repo already exists"
fi

# ---------- 5. Install dependencies ----------
echo ""
echo "📦 Installing dependencies..."
if [ -f "package-lock.json" ]; then
  npm install
elif [ -f "yarn.lock" ]; then
  yarn install
elif [ -f "pnpm-lock.yaml" ]; then
  pnpm install
elif [ -f "bun.lockb" ]; then
  bun install
elif [ -f "package.json" ]; then
  npm install
elif [ -f "requirements.txt" ]; then
  pip install -r requirements.txt
elif [ -f "pyproject.toml" ]; then
  pip install -e .
else
  echo "⚠️  No package manager lockfile found — skipping dependency install"
fi

# ---------- 6. Check for .env ----------
if [ -f ".env.example" ] && [ ! -f ".env" ] && [ ! -f ".env.local" ]; then
  cp .env.example .env
  echo ""
  echo "⚠️  Created .env from .env.example — fill in your API keys!"
  echo "   Open .env and add your keys before running the app."
elif [ -f ".env" ] || [ -f ".env.local" ]; then
  echo "✅ Environment file exists"
else
  echo "⚠️  No .env file found — you may need to create one with your API keys"
fi

echo ""
echo "✅ Setup complete! Next steps:"
echo "   1. bash scripts/dev.sh        — Start the dev server"
echo "   2. bash scripts/push-github.sh — Push to GitHub"
echo ""
