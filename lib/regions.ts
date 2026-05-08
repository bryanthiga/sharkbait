export interface RegionEntry {
  slug: string;
  name: string;
  bbox: { latMin: number; latMax: number; lonMin: number; lonMax: number };
}

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
