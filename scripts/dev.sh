#!/bin/bash
# ============================================================
# Sharkbait — Start Dev Server
# Usage: bash scripts/dev.sh
# ============================================================

echo ""
echo "🦈 Starting Sharkbait dev server..."
echo ""

# Auto-install deps if node_modules is missing
if [ -f "package.json" ] && [ ! -d "node_modules" ]; then
  echo "📦 node_modules missing — installing dependencies first..."
  npm install
  echo ""
fi

# Detect framework and start
if [ -f "package.json" ]; then
  # Check what dev command exists
  DEV_CMD=$(node -e "const p=require('./package.json'); console.log(p.scripts?.dev||'')" 2>/dev/null)
  if [ -n "$DEV_CMD" ]; then
    echo "Running: npm run dev"
    npm run dev
  else
    START_CMD=$(node -e "const p=require('./package.json'); console.log(p.scripts?.start||'')" 2>/dev/null)
    if [ -n "$START_CMD" ]; then
      echo "Running: npm start"
      npm start
    else
      echo "❌ No 'dev' or 'start' script found in package.json"
      echo "   Add one, e.g.: \"dev\": \"next dev\" or \"dev\": \"vite\""
    fi
  fi
elif [ -f "manage.py" ]; then
  echo "Running: python manage.py runserver"
  python manage.py runserver
elif [ -f "app.py" ] || [ -f "main.py" ]; then
  FILE=$([ -f "app.py" ] && echo "app.py" || echo "main.py")
  echo "Running: python $FILE"
  python "$FILE"
else
  echo "❌ Can't detect how to start the app."
  echo "   Tell Cursor: 'How do I start my dev server?'"
fi
