import { NextResponse } from "next/server";
import { getFloodReports } from "@/lib/floods";

const FLOOD_CACHE = "public, s-maxage=300, stale-while-revalidate=600";
const UNAVAILABLE = "Flood reports are temporarily unavailable";

export async function GET() {
  try {
    const data = await getFloodReports();
    const { nws, gdacs } = data.sources;
    const available = nws.available || gdacs.available;
    return NextResponse.json(available ? data : { ...data, error: UNAVAILABLE }, {
      status: available ? 200 : 503,
      headers: { "Cache-Control": nws.available && gdacs.available ? FLOOD_CACHE : "no-store" },
    });
  } catch (error) {
    console.error("[api/floods] Fetch failed:", error);
    return NextResponse.json(
      {
        reports: [],
        updatedAt: new Date().toISOString(),
        sources: {
          nws: { available: false, count: 0 },
          gdacs: { available: false, count: 0 },
        },
        error: UNAVAILABLE,
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
