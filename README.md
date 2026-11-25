# Sharkbait

Sharkbait is a map and report feed for shark sightings, attacks, and active flood alerts.

## Run locally

```bash
npm ci
cp .env.example .env.local
# Set NEXT_PUBLIC_MAPBOX_TOKEN in .env.local
npm run dev
```

Set a public Mapbox token to enable the map and freeform location search. The report lists and built-in surf spot search also work without it. The flood feed uses public NWS and GDACS data.

## Main components

- `public/index.template.html` is the map-first interface. `npm run dev` and `npm run build` generate the ignored `public/index.html` from this template.
- `app/api/sightings/route.ts` and `lib/scanner.ts` aggregate shark reports.
- `app/api/floods/route.ts` and `lib/floods.ts` serve active U.S. National Weather Service alerts and current global GDACS flood events.
- `app/api/surf-spots/route.ts` serves the surf location picker.
- `TEST/` contains the Vitest suite.

## Commands

```bash
npm run dev
npm test
npm run lint
npm run build
```

## Data notes

- Shark report availability depends on third-party feeds and the configured credentials in `.env.local`. The old OCEARCH, Shark Research Committee, and Dorsal endpoints no longer return usable machine-readable data. For tagged sharks, use the [official OCEARCH tracker](https://www.ocearch.org/research/track-sharks-with-us/).
- Complete flood responses are cached for five minutes. NWS supplies active U.S. alerts, and GDACS supplies recent events worldwide. NWS polygons show alert areas, and GDACS pins show approximate locations.
- External text is escaped before it is inserted into HTML, and external links pass through `safeUrl()`.
