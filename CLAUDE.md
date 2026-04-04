# Sharkbait

Shark sighting tracker — monitors and displays shark sightings from around the world.

## Quick Start

```bash
bash scripts/setup.sh   # First time only (installs Node deps, inits git)
bash scripts/dev.sh     # Start the app → http://localhost:3000
```

## Scripts

```bash
bash scripts/setup.sh           # Install deps, init git
bash scripts/dev.sh             # Start dev server
bash scripts/save.sh            # Commit + push everything
bash scripts/save.sh "message"  # Commit with message + push
bash scripts/push-github.sh     # Create GitHub repo + push (first time)
bash scripts/new-feature.sh X   # Start a feature branch
```

## Tech Stack

- **Framework**: Next.js 15 (App Router) + TypeScript
- **Styling**: Tailwind CSS — dark ocean theme (deep blues, teals, white text)
- **Map**: Mapbox GL JS (dark-v11 style) — interactive, color-coded markers
- **Data**: 9 free sources fetched server-side, cached 15 min
- **Hosting**: Local dev for now (Vercel-ready)

## Project Structure

```
app/
  layout.tsx          → Root layout, fonts, metadata
  page.tsx            → Main page — map + sidebar/bottom sheet + filters
  globals.css         → Tailwind base + ocean theme + animations
  api/sightings/
    route.ts          → GET endpoint — runs scanner, returns JSON, caches 15 min

components/
  SharkMap.tsx        → Mapbox GL map (client component, dynamic import)
  SightingFeed.tsx    → Scrollable sighting card list
  StatsBar.tsx        → 4 stat cards (total, attacks, warnings, sightings)

lib/
  scanner.ts          → Data pipeline — fetches all 9 sources, extracts locations,
                        geocodes via Nominatim, classifies type, deduplicates
  types.ts            → Sighting interface + SightingType union

scripts/              → Shell helpers (setup, dev, save, push, branching)
.cursor/rules/        → Cursor agent rules
.env.local            → API keys (not committed)
.env.example          → Template for .env.local
```

## Data Sources (all free, no extra keys needed except NewsAPI)

| # | Source | Key? | What it pulls |
|---|--------|------|---------------|
| 1 | NewsAPI | .env.local `NEWS_API_KEY` | 50 shark news articles (7-day window) |
| 2 | Reddit | None | 13 subreddits (sharks, surfing, Florida, Hawaii, AU, etc.) |
| 3 | Google News RSS | None | 5 shark search queries via RSS |
| 4 | Bing News RSS | None | Shark attack/sighting news feed |
| 5 | Ocearch Tracker | None | GPS-tagged sharks with live lat/lon |
| 6 | Shark Research Committee | None | Pacific coast incident reports |
| 7 | Dorsal Watch (AU) | None | Australian shark alerts via RSS |
| 8 | BeachSafe Australia | None | Official shark warnings |
| 9 | Florida Museum ISAF | None | International Shark Attack File |

All sources fire in parallel via `Promise.all`. Ocearch sharks arrive pre-geocoded (GPS tags). Everything else goes through the location extraction → Nominatim geocoding pipeline.

## Data Schema

```typescript
interface Sighting {
  id: string;           // Unique per article+source
  title: string;        // Article headline or tracker name
  date: string;         // ISO date
  location: string;     // Extracted place name
  lat: number;
  lon: number;
  type: "Attack" | "Warning" | "Sighting" | "Unknown";
  source: string;       // e.g. "r/sharks", "Google News", "Ocearch Tracker"
  url: string;          // Link to original article
}
```

## Classification Logic (in scanner.ts)

- **Attack**: title/description contains attack, bite, bitten, mauled, fatal
- **Warning**: contains warning, alert, closed, advisory, ban, closure
- **Sighting**: contains spotted, seen, sighting, encounter, swimming
- **Unknown**: none of the above matched

## API Keys (.env.local)

```bash
NEXT_PUBLIC_MAPBOX_TOKEN=   # Mapbox public token (free @ mapbox.com)
NEWS_API_KEY=               # NewsAPI key (free @ newsapi.org)
GEMINI_API_KEY=             # Google Gemini (available, not yet wired up)
```

After changing `.env.local`, restart the dev server (Ctrl+C → `bash scripts/dev.sh`).

## UI Architecture

- **Desktop**: Full-height map (left) + 380px sidebar (right) with stats, filters, feed
- **Mobile**: Map fills 55dvh top, sidebar fills 45dvh bottom (bottom sheet pattern)
- **Map markers**: Color-coded dots (red=Attack, orange=Warning, green=Sighting, blue=Unknown) with popups
- **Interactions**: Click sighting card → map flies to location and opens popup; click marker → highlights card
- **Filter pills**: All / Attacks / Warnings / Sightings
- **Refresh button**: Re-fetches all 9 sources

## For AI Agents

- The user (Bryant) is non-technical. Make changes directly, explain briefly in plain English.
- Mobile-first. Most users check sightings on their phone.
- UI should feel like a polished consumer app, not a dashboard.
- Dark ocean theme — deep blues, teals, white text. No light mode.
- Map is the centerpiece. Sighting cards are secondary.
- Keep it simple. No over-engineering.
- All API keys live in `.env.local` — always read from there, never hardcode.
- Test that `bash scripts/dev.sh` still works after making changes.
