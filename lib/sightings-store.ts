import { scanForSightings } from "./scanner";
import { getConfidenceLabel, scoreSightings } from "./scorer";
import { Sighting } from "./types";
import { isRelatedMarine } from "./species";
import { milesBetween } from "./geo";

interface CacheEntry {
  sightings: Sighting[];
  fetchedAt: number;
  fetchedAtIso: string;
}

let cache: CacheEntry | null = null;
let fetchInProgress: Promise<Sighting[]> | null = null;
const CACHE_TTL = 5 * 60 * 1000;

export async function getCachedSightings(): Promise<{
  sightings: Sighting[];
  fetchedAtIso: string;
}> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) {
    return { sightings: cache.sightings, fetchedAtIso: cache.fetchedAtIso };
  }
  if (!fetchInProgress) {
    fetchInProgress = (async () => {
      const raw = await scanForSightings();
      const scored = await scoreSightings(raw);
      return scored.map((s) => ({
        ...s,
        confidence: getConfidenceLabel(s.healthScore),
      }));
    })().finally(() => {
      fetchInProgress = null;
    });
  }
  const sightings = await fetchInProgress;
  const fetchedAtIso = new Date().toISOString();
  cache = { sightings, fetchedAt: Date.now(), fetchedAtIso };
  return { sightings, fetchedAtIso };
}

export interface FilterOptions {
  days?: number;
  limit?: number;
  includeRelated?: boolean;
  near?: { lat: number; lon: number; radiusMiles: number };
}

export type SightingWithDistance = Sighting & { distanceMiles?: number };

export function applyFilters(
  sightings: Sighting[],
  opts: FilterOptions = {},
): SightingWithDistance[] {
  const days = opts.days ?? 30;
  const limit = opts.limit ?? 200;
  const includeRelated = opts.includeRelated ?? false;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

  let filtered: SightingWithDistance[] = sightings
    .filter((s) => {
      const t = Date.parse(s.date);
      return !isNaN(t) && t >= cutoff;
    })
    .filter((s) => includeRelated || !isRelatedMarine(s.species));

  if (opts.near) {
    const center = { lat: opts.near.lat, lon: opts.near.lon };
    const radius = opts.near.radiusMiles;
    filtered = filtered
      .map((s) => ({ ...s, distanceMiles: milesBetween(center, s) }))
      .filter((s) => (s.distanceMiles as number) <= radius);
  }

  return filtered
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
    .slice(0, limit);
}
