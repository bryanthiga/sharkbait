import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const lat = req.headers.get("x-vercel-ip-latitude");
  const lon = req.headers.get("x-vercel-ip-longitude");

  if (!lat || !lon) {
    return NextResponse.json(
      { available: false },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  }

  const cityHeader = req.headers.get("x-vercel-ip-city");
  const region = req.headers.get("x-vercel-ip-country-region");
  const country = req.headers.get("x-vercel-ip-country");

  return NextResponse.json(
    {
      available: true,
      lat: parseFloat(lat),
      lon: parseFloat(lon),
      city: cityHeader ? decodeURIComponent(cityHeader) : null,
      region,
      country,
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
