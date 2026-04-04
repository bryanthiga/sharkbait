import { NextResponse } from "next/server";
import { scanForSightings } from "@/lib/scanner";
import { Sighting } from "@/lib/types";

const pinnedSightings: Sighting[] = [
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

let cache: { sightings: Sighting[]; fetchedAt: number } | null = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export async function GET() {
  try {
    if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) {
      return NextResponse.json(cache.sightings);
    }

    const scanned = await scanForSightings();
    const sightings = [...pinnedSightings, ...scanned];
    cache = { sightings, fetchedAt: Date.now() };

    return NextResponse.json(sightings);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch sightings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
