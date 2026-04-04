import { NextResponse } from "next/server";
import { scanForSightings } from "@/lib/scanner";
import { Sighting } from "@/lib/types";

function getPinnedSightings(): Sighting[] {
  return [
    {
      id: "pinned-malibu-attack",
      title: "Shark attack reported near Malibu Beach",
      date: new Date().toISOString(),
      location: "Malibu, CA",
      lat: 34.0259,
      lon: -118.7798,
      type: "Attack",
      species: "Great White",
      source: "Manual report",
      url: "https://sharkbait.app",
    },
  ];
}

let cache: { sightings: Sighting[]; fetchedAt: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes — aligned with s-maxage

let fetchInProgress: Promise<Sighting[]> | null = null;

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
};

export async function GET() {
  try {
    if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) {
      return NextResponse.json(cache.sightings, { headers: CACHE_HEADERS });
    }

    if (!fetchInProgress) {
      fetchInProgress = scanForSightings().finally(() => {
        fetchInProgress = null;
      });
    }

    const scanned = await fetchInProgress;
    const sightings = [...getPinnedSightings(), ...scanned];
    cache = { sightings, fetchedAt: Date.now() };

    return NextResponse.json(sightings, { headers: CACHE_HEADERS });
  } catch (error) {
    console.error("[api/sightings] Scan failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch sightings" },
      { status: 500 },
    );
  }
}
