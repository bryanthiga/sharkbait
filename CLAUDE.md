# Sharkbait project notes

Sharkbait is a map and report feed for shark activity and current flood alerts. The app is a Next.js 15 project deployed on Vercel, with a vanilla JavaScript interface in `public/index.template.html`.

## Working rules

- Make changes directly and keep the mobile experience usable first.
- Generate `public/index.html` through `scripts/inject-env.js`; edit the template, never the generated file.
- Keep API keys in `.env.local`; do not commit tokens or secrets.
- Escape external text with `escapeHtml()` and validate external links with `safeUrl()` before rendering them.
- Run `npm test`, `npm run lint`, and `npm run build` after changes that affect the app.

## Architecture

- `public/index.template.html`: map, filters, stats, feed, mobile bottom sheet, and client-side API calls.
- `app/api/sightings/route.ts` + `lib/scanner.ts`: shark report aggregation.
- `app/api/floods/route.ts` + `lib/floods.ts`: NWS active flood alerts and current GDACS global events.
- `app/api/surf-spots/route.ts`: surf spot picker data.
- `TEST/`: Vitest suite.

Flood alert geometries may be absent from the upstream feed. Mark event points as approximate, preserve source links, and never imply that an alert polygon shows flood depth.
