import { NextRequest, NextResponse } from "next/server";
import { getCachedSightings, applyFilters } from "@/lib/sightings-store";

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
};

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

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const days = parseIntParam(url.searchParams.get("days"), 30, 365);
    const limit = parseIntParam(url.searchParams.get("limit"), 200, 1000);
    const includeRelated =
      url.searchParams.get("includeRelated") === "true";

    const { sightings: all, fetchedAtIso } = await getCachedSightings();
    const sightings = applyFilters(all, { days, limit, includeRelated });

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
