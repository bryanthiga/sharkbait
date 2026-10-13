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
const MAX_EVENT_AGE_DAYS = 365;
const TRUSTED_SOCIAL_SOURCES = new Set([
  "r/sharks",
  "r/SharkAttacks",
  "r/marinebiology",
]);

function isCredibleEvent(sighting: Sighting): boolean {
  if (sighting.type === "Unknown") return false;
  if (sighting.source.startsWith("r/") && !TRUSTED_SOCIAL_SOURCES.has(sighting.source)) {
    return false;
  }
  return sighting.healthScore == null || sighting.healthScore >= 40;
}

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
      const oldestAllowed = Date.now() - MAX_EVENT_AGE_DAYS * 24 * 60 * 60 * 1000;
      const current = raw.filter((s) => {
        const timestamp = Date.parse(s.date);
        return Number.isFinite(timestamp) && timestamp >= oldestAllowed;
      });
      const scored = await scoreSightings(current);
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

function dedupeKey(sighting: Sighting): string {
  const day = sighting.date.slice(0, 10);
  if (sighting.source === "iNaturalist") {
    return [
      "inat",
      sighting.species.toLowerCase(),
      sighting.lat.toFixed(2),
      sighting.lon.toFixed(2),
      day,
    ].join("|");
  }

  const headline = sighting.title
    .toLowerCase()
    .replace(/\s+[-|]\s+.*/, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  return `news|${headline}`;
}

function dedupeSightings(sightings: SightingWithDistance[]): SightingWithDistance[] {
  const seen = new Set<string>();
  return sightings.filter((sighting) => {
    const key = dedupeKey(sighting);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

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
    .filter((s) => includeRelated || !isRelatedMarine(s.species))
    .filter(isCredibleEvent);

  if (opts.near) {
    const center = { lat: opts.near.lat, lon: opts.near.lon };
    const radius = opts.near.radiusMiles;
    filtered = filtered
      .map((s) => ({ ...s, distanceMiles: milesBetween(center, s) }))
      .filter((s) => (s.distanceMiles as number) <= radius);
  }

  filtered.sort((a, b) => Date.parse(b.date) - Date.parse(a.date));

  return dedupeSightings(filtered)
    .slice(0, limit);
}
