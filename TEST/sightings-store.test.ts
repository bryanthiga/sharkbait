import { describe, expect, it } from "vitest";
import { applyFilters } from "../lib/sightings-store";
import type { Sighting } from "../lib/types";

function sighting(overrides: Partial<Sighting> = {}): Sighting {
  return {
    id: "event-1",
    title: "Shark spotted near the pier - Local News",
    date: new Date().toISOString(),
    location: "Test Beach",
    lat: 34,
    lon: -118,
    type: "Sighting",
    species: "Great White",
    source: "Google News",
    url: "https://example.com/event-1",
    healthScore: 80,
    ...overrides,
  };
}

describe("applyFilters", () => {
  it("removes unknown and low-confidence records", () => {
    const rows = applyFilters([
      sighting(),
      sighting({ id: "unknown", type: "Unknown" }),
      sighting({ id: "low", healthScore: 20 }),
    ]);

    expect(rows.map((row) => row.id)).toEqual(["event-1"]);
  });

  it("deduplicates syndicated copies of the same headline", () => {
    const rows = applyFilters([
      sighting(),
      sighting({
        id: "event-2",
        title: "Shark spotted near the pier - Another Outlet",
        url: "https://example.net/event-2",
      }),
    ]);

    expect(rows).toHaveLength(1);
  });

  it("collapses same-day iNaturalist observations at the same location", () => {
    const rows = applyFilters([
      sighting({ source: "iNaturalist", title: "Great White observed" }),
      sighting({
        id: "event-2",
        source: "iNaturalist",
        title: "Great White observed again",
        lat: 34.003,
        lon: -118.004,
      }),
      sighting({
        id: "event-3",
        source: "iNaturalist",
        title: "Tiger Shark observed",
        species: "Tiger",
      }),
    ]);

    expect(rows.map((row) => row.id)).toEqual(["event-1", "event-3"]);
  });
});
