export interface RegionEntry {
  slug: string;
  name: string;
  bbox: { latMin: number; latMax: number; lonMin: number; lonMax: number };
}

// Bounding boxes are intentionally loose — they're for SEO landing-page
// filtering, not survey-grade geography. Coastal/island regions emphasized
// since that's where 99% of shark sightings happen.
export const REGIONS: RegionEntry[] = [
  {
    slug: "california",
    name: "California",
    bbox: { latMin: 32.5, latMax: 42.0, lonMin: -125, lonMax: -114 },
  },
  {
    slug: "florida",
    name: "Florida",
    bbox: { latMin: 24.5, latMax: 31.0, lonMin: -88, lonMax: -80 },
  },
  {
    slug: "hawaii",
    name: "Hawaii",
    bbox: { latMin: 18.5, latMax: 22.5, lonMin: -161, lonMax: -154 },
  },
  {
    slug: "north-carolina",
    name: "North Carolina",
    bbox: { latMin: 33.5, latMax: 36.6, lonMin: -85, lonMax: -75 },
  },
  {
    slug: "south-carolina",
    name: "South Carolina",
    bbox: { latMin: 32.0, latMax: 35.2, lonMin: -83.5, lonMax: -78.5 },
  },
  {
    slug: "texas",
    name: "Texas",
    bbox: { latMin: 25.5, latMax: 30.5, lonMin: -98, lonMax: -93 },
  },
  {
    slug: "new-york",
    name: "New York",
    bbox: { latMin: 40.4, latMax: 41.4, lonMin: -74.5, lonMax: -71.8 },
  },
  {
    slug: "new-jersey",
    name: "New Jersey",
    bbox: { latMin: 38.9, latMax: 41.0, lonMin: -75.6, lonMax: -73.9 },
  },
  {
    slug: "massachusetts",
    name: "Massachusetts",
    bbox: { latMin: 41.2, latMax: 42.9, lonMin: -71.3, lonMax: -69.9 },
  },
  {
    slug: "australia",
    name: "Australia",
    bbox: { latMin: -39.5, latMax: -10.0, lonMin: 113, lonMax: 154 },
  },
  {
    slug: "south-africa",
    name: "South Africa",
    bbox: { latMin: -35.0, latMax: -28.0, lonMin: 16, lonMax: 33 },
  },
  {
    slug: "bahamas",
    name: "Bahamas",
    bbox: { latMin: 20.9, latMax: 27.3, lonMin: -79.5, lonMax: -72.5 },
  },
  {
    slug: "mexico",
    name: "Mexico",
    bbox: { latMin: 14.5, latMax: 32.7, lonMin: -118, lonMax: -86 },
  },
  {
    slug: "brazil",
    name: "Brazil",
    bbox: { latMin: -34, latMax: -1, lonMin: -55, lonMax: -34 },
  },
];

export function getRegionBySlug(slug: string): RegionEntry | undefined {
  return REGIONS.find((r) => r.slug === slug);
}

export function inRegion(
  point: { lat: number; lon: number },
  r: RegionEntry,
): boolean {
  return (
    point.lat >= r.bbox.latMin &&
    point.lat <= r.bbox.latMax &&
    point.lon >= r.bbox.lonMin &&
    point.lon <= r.bbox.lonMax
  );
}
