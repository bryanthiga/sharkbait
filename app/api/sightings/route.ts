import { NextResponse } from "next/server";
import { scanForSightings } from "@/lib/scanner";
import { scoreSightings } from "@/lib/scorer";
import { Sighting } from "@/lib/types";

interface CacheEntry {
  sightings: Sighting[];
  fetchedAt: number;
  fetchedAtIso: string;
}

let cache: CacheEntry | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

let fetchInProgress: Promise<Sighting[]> | null = null;

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
};

export async function GET() {
  try {
    if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) {
      return NextResponse.json(
        { sightings: cache.sightings, fetchedAt: cache.fetchedAtIso },
        { headers: CACHE_HEADERS },
      );
    }

    if (!fetchInProgress) {
      fetchInProgress = (async () => {
        const raw = await scanForSightings();
        return await scoreSightings(raw);
      })().finally(() => { fetchInProgress = null; });
    }

    const sightings = await fetchInProgress;
    const fetchedAtIso = new Date().toISOString();
    cache = { sightings, fetchedAt: Date.now(), fetchedAtIso };

    return NextResponse.json(
      { sightings, fetchedAt: fetchedAtIso },
      { headers: CACHE_HEADERS },
    );
  } catch (error) {
    console.error("[api/sightings] Scan failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch sightings" },
      { status: 500 },
    );
  }
}
