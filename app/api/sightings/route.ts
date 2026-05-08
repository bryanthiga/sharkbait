import { NextRequest, NextResponse } from "next/server";
import {
  getCachedSightings,
  applyFilters,
  type FilterOptions,
} from "@/lib/sightings-store";
import { getSurfSpotBySlug } from "@/lib/surf-spots";

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
};

const DEFAULT_RADIUS_MILES = 25;
const MIN_RADIUS_MILES = 1;
const MAX_RADIUS_MILES = 100;

function parseIntParam(
  value: string | null,
  fallback: number,
  max: number,
): number {
  if (!value) return fallback;
  const n = parseInt(value, 10);
  if (isNaN(n) || n < 1) return fallback;
  return Math.min(n, max);
}

function parseFloatParam(value: string | null): number | null {
  if (value == null) return null;
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const days = parseIntParam(url.searchParams.get("days"), 30, 365);
    const limit = parseIntParam(url.searchParams.get("limit"), 200, 1000);
    const includeRelated =
      url.searchParams.get("includeRelated") === "true";

    let near: FilterOptions["near"] | undefined;
    const spotSlug = url.searchParams.get("spot");
    const radiusParam = parseFloatParam(url.searchParams.get("radius"));

    if (spotSlug) {
      const spot = getSurfSpotBySlug(spotSlug);
      if (spot) {
        const radiusMiles = clamp(
          radiusParam ?? spot.defaultRadiusMiles,
          MIN_RADIUS_MILES,
          MAX_RADIUS_MILES,
        );
        near = { lat: spot.lat, lon: spot.lon, radiusMiles };
      }
    } else {
      const lat = parseFloatParam(url.searchParams.get("lat"));
      const lon = parseFloatParam(url.searchParams.get("lon"));
      if (lat != null && lon != null) {
        const radiusMiles = clamp(
          radiusParam ?? DEFAULT_RADIUS_MILES,
          MIN_RADIUS_MILES,
          MAX_RADIUS_MILES,
        );
        near = { lat, lon, radiusMiles };
      }
    }

    const { sightings: all, fetchedAtIso } = await getCachedSightings();
    const sightings = applyFilters(all, {
      days,
      limit,
      includeRelated,
      near,
    });

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
