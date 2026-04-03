# Sharkbait Starter Kit

Drop these files into your Sharkbait project folder on your other computer.

## What's Included

```
scripts/
  setup.sh          → First-time setup (run once)
  dev.sh            → Start the dev server
  save.sh           → Quick commit + push to GitHub
  push-github.sh    → Create GitHub repo + first push
  new-feature.sh    → Start a new feature branch

.cursor/rules/
  sharkbait.mdc     → Tells Cursor how to help you with Sharkbait

CLAUDE.md           → Tells Claude Code about the project
```

## How To Use

1. **Copy everything** from this folder into your Sharkbait project root
2. Open the project in Cursor
3. In the terminal, run:
   ```
   bash scripts/setup.sh
   ```
4. To start the app:
   ```
   bash scripts/dev.sh
   ```
5. To push to GitHub for the first time:
   ```
   bash scripts/push-github.sh
   ```
6. After that, whenever you want to save your work:
   ```
   bash scripts/save.sh
   ```

## Talking To Cursor

With the `.cursor/rules/sharkbait.mdc` file in place, Cursor will understand:
- What Sharkbait is
- That you're non-technical
- To just make changes instead of explaining code
- UI preferences (dark ocean theme, map-first, mobile-friendly)
- What data sources to pull from

Just talk to it like you normally would. Say things like:
- "make the map bigger"
- "add more shark data sources"
- "the sightings aren't loading, fix it"
- "make the mobile view better"
- "push my changes"
