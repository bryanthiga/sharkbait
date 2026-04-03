import { NextResponse } from "next/server";
import { scanForSightings } from "@/lib/scanner";
import { Sighting } from "@/lib/types";

let cache: { sightings: Sighting[]; fetchedAt: number } | null = null;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export async function GET() {
  try {
    if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) {
      return NextResponse.json(cache.sightings);
    }

    const sightings = await scanForSightings();
    cache = { sightings, fetchedAt: Date.now() };

    return NextResponse.json(sightings);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch sightings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
