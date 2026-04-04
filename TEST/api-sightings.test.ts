import { describe, it, expect, vi, beforeEach } from "vitest";

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
    const response = await GET();
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
    const response = await GET();
    const data = await response.json();
    expect(data.error).toBe("Failed to fetch sightings");
  });

  it("returns JSON array including pinned sightings on success", async () => {
    vi.doMock("@/lib/scanner", () => ({
      scanForSightings: vi.fn().mockResolvedValue([
        {
          id: "test-1",
          title: "Test Sighting",
          date: "2024-01-01T00:00:00Z",
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
    const response = await GET();
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(2);
    expect(data[0].id).toBe("pinned-malibu-attack");
  });

  it("returns Cache-Control headers", async () => {
    vi.doMock("@/lib/scanner", () => ({
      scanForSightings: vi.fn().mockResolvedValue([]),
    }));
    const { GET } = await import("../app/api/sightings/route");
    const response = await GET();
    expect(response.headers.get("Cache-Control")).toBe(
      "public, s-maxage=300, stale-while-revalidate=600",
    );
  });

  it("pinned sighting has today's date", async () => {
    vi.doMock("@/lib/scanner", () => ({
      scanForSightings: vi.fn().mockResolvedValue([]),
    }));
    const { GET } = await import("../app/api/sightings/route");
    const response = await GET();
    const data = await response.json();
    const pinned = data.find(
      (s: { id: string }) => s.id === "pinned-malibu-attack",
    );
    expect(pinned).toBeDefined();
    const pinnedDate = new Date(pinned.date);
    const now = new Date();
    expect(Math.abs(now.getTime() - pinnedDate.getTime())).toBeLessThan(5000);
  });
});
