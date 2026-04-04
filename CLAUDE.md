# Sharkbait

Shark sighting tracker — monitors and displays shark sightings from around the world.

## Quick Start

```bash
bash scripts/setup.sh    # First time only
bash scripts/dev.sh      # Start the app (localhost:3000)
npm test                 # Run tests
```

## Architecture

- **Frontend**: Static `public/index.html` — Mapbox GL JS globe, species bar, sighting feed. Vanilla JS, no framework.
- **API**: Next.js 15 API route at `app/api/sightings/route.ts` — aggregates data, caches for 5 minutes.
- **Scanner**: `lib/scanner.ts` — fetches from 4 sources in parallel with 10s timeouts.
- **Deploy**: Vercel (serverless). Cache-Control `s-maxage=300` on API responses.

## Data Sources (4 active)

| Source | Type | Auth |
|--------|------|------|
| NewsAPI | REST API | `NEWS_API_KEY` (free tier: localhost only) |
| Google News | RSS | None |
| Bing News | RSS | None |
| Ocearch Tracker | REST API | None |

## Key Files

| File | Purpose |
|------|---------|
| `public/index.html` | Full frontend — map, stats, species bar, feed (~850 lines) |
| `app/api/sightings/route.ts` | API endpoint with in-memory + HTTP cache |
| `lib/scanner.ts` | Data fetchers + processing pipeline |
| `lib/types.ts` | `Sighting` and `SightingType` TypeScript interfaces |
| `next.config.ts` | Rewrites `/` → `index.html`, security headers |
| `TEST/` | Vitest test suite |

## Sighting Schema

```typescript
interface Sighting {
  id: string;        // Deterministic base64url of url+source
  title: string;
  date: string;      // ISO 8601
  location: string;
  lat: number;
  lon: number;
  type: "Attack" | "Warning" | "Sighting" | "Unknown";
  species: string;   // "Great White", "Tiger", "Unknown", etc.
  source: string;
  url: string;
}
```

## For AI Agents
- The user is non-technical. Make changes directly, explain briefly.
- Mobile-first. Most users check sightings on their phone.
- UI should feel like a polished consumer app, not a dashboard.
- Dark ocean theme (deep blues, teals, white text).
- Map is the centerpiece. Sighting cards are secondary.
- Keep it simple. No over-engineering.
- All external data must be HTML-escaped before rendering (`escapeHtml()`).
- URLs must be validated with `safeUrl()` before href injection.
- API keys live in `.env.local`, never hardcoded in source.
