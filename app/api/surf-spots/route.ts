import { NextResponse } from "next/server";
import { surfSpots } from "@/lib/surf-spots";

// Cache aggressively — surf spots only change on deploy.
const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=86400",
};

// Client only needs the search-relevant fields. Strips tags/defaultRadiusMiles
// to keep payload small (those are server-only concerns).
export async function GET() {
  const spots = surfSpots.map((s) => ({
    slug: s.slug,
    name: s.name,
    region: s.region,
    country: s.country,
    lat: s.lat,
    lon: s.lon,
    aliases: s.aliases ?? [],
  }));
  return NextResponse.json({ spots }, { headers: CACHE_HEADERS });
}
