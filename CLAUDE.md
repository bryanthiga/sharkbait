# Sharkbait

Shark sighting tracker — monitors and displays shark sightings from around the world.

## Quick Start

```bash
bash scripts/setup.sh   # First time only
bash scripts/dev.sh     # Start the app
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

## Architecture

- **Frontend**: Interactive map + sighting feed. Mobile-first responsive design.
- **Data**: Shark sighting data from multiple sources (APIs, RSS, news feeds).
- **Design**: Ocean/dark theme. Map is the hero element.

## Key Features
- Real-time shark sighting map
- Sighting feed with species, location, date, danger level
- Multiple data source aggregation
- Mobile-friendly (bottom sheet pattern)
- Desktop sidebar + map layout

## Potential Data Sources
- Shark Research Committee
- Global Shark Attack File (GSAF)
- Dorsal (Australia)
- Ocearch shark tracker
- NOAA fisheries
- News APIs (shark-related articles)
- Florida Museum International Shark Attack File
- Beach patrol social feeds

## For AI Agents
- The user is non-technical. Make changes directly, explain briefly.
- Mobile-first. Most users check sightings on their phone.
- UI should feel like a polished consumer app, not a dashboard.
- Dark ocean theme (deep blues, teals, white text).
- Map is the centerpiece. Sighting cards are secondary.
- Keep it simple. No over-engineering.
