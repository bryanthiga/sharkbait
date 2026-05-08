import { scanForSightings } from "./scanner";
import { getConfidenceLabel, scoreSightings } from "./scorer";
import { Sighting } from "./types";
import { isRelatedMarine } from "./species";

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
}

export function applyFilters(
  sightings: Sighting[],
  opts: FilterOptions = {},
): Sighting[] {
  const days = opts.days ?? 30;
  const limit = opts.limit ?? 200;
  const includeRelated = opts.includeRelated ?? false;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

  return sightings
    .filter((s) => {
      const t = Date.parse(s.date);
      return !isNaN(t) && t >= cutoff;
    })
    .filter((s) => includeRelated || !isRelatedMarine(s.species))
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
    .slice(0, limit);
}
