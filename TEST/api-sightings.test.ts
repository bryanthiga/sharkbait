import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

function request(query = "") {
  return new NextRequest(`http://localhost/api/sightings${query}`);
}

describe("GET /api/sightings", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("returns 500 with generic error when scanner throws (no cache)", async () => {
    vi.doMock("@/lib/scanner", () => ({
      scanForSightings: vi.fn().mockRejectedValue(new Error("External API down")),
    }));
    const { GET } = await import("../app/api/sightings/route");
    const response = await GET(request());
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe("Failed to fetch sightings");
    expect(data.error).not.toContain("External API down");
  });

  it("does not leak internal error messages", async () => {
    vi.doMock("@/lib/scanner", () => ({
      scanForSightings: vi.fn().mockRejectedValue(new Error("ECONNREFUSED 10.0.0.1:443")),
    }));
    const { GET } = await import("../app/api/sightings/route");
    const response = await GET(request());
    const data = await response.json();
    expect(data.error).toBe("Failed to fetch sightings");
  });

  it("returns recent sightings using the current response contract", async () => {
    vi.doMock("@/lib/scanner", () => ({
      scanForSightings: vi.fn().mockResolvedValue([
        {
          id: "test-1",
          title: "Test Sighting",
          date: new Date().toISOString(),
          location: "Test Beach",
          lat: 30,
          lon: -80,
          type: "Sighting",
          species: "Unknown",
          source: "Test",
          url: "http://test.com",
        },
      ]),
    }));
    const { GET } = await import("../app/api/sightings/route");
    const response = await GET(request());
    const data = await response.json();
    expect(Array.isArray(data.sightings)).toBe(true);
    expect(data.sightings).toHaveLength(1);
    expect(data.sightings[0].id).toBe("test-1");
    expect(data.fetchedAt).toEqual(expect.any(String));
  });

  it("returns Cache-Control headers", async () => {
    vi.doMock("@/lib/scanner", () => ({
      scanForSightings: vi.fn().mockResolvedValue([]),
    }));
    const { GET } = await import("../app/api/sightings/route");
    const response = await GET(request());
    expect(response.headers.get("Cache-Control")).toBe(
      "public, s-maxage=300, stale-while-revalidate=600",
    );
  });

  it("filters old events from the default 30-day feed", async () => {
    vi.doMock("@/lib/scanner", () => ({
      scanForSightings: vi.fn().mockResolvedValue([
        {
          id: "old-event",
          title: "Old shark sighting",
          date: "2024-01-01T00:00:00Z",
          location: "Old Beach",
          lat: 30,
          lon: -80,
          type: "Sighting",
          species: "Unknown",
          source: "Test",
          url: "https://example.com/old",
        },
      ]),
    }));
    const { GET } = await import("../app/api/sightings/route");
    const response = await GET(request());
    const data = await response.json();
    expect(data.sightings).toEqual([]);
  });
});
