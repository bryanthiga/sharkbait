import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "../app/api/floods/route";

afterEach(() => vi.unstubAllGlobals());

describe("GET /api/floods", () => {
  it("returns a noncacheable 503 when both sources fail", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ message: "Unusable payload" })));

    const response = await GET();

    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toMatchObject({ reports: [], sources: {
      nws: { available: false }, gdacs: { available: false },
    } });
  });

  it("preserves reports without map geometry when one source is unavailable", async () => {
    const alert = {
      properties: { id: "test-alert", event: "Flood Warning", sent: "2026-11-24T12:00:00Z" },
      geometry: { type: "Polygon", coordinates: [[[-80, 28], [-79, 29]]] },
    };
    vi.stubGlobal("fetch", vi.fn(async (url: string) => url.includes("weather.gov")
      ? Response.json({ features: [alert] })
      : new Response(null, { status: 503 }),
    ));

    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toMatchObject({
      reports: [{ title: "Flood Warning", geometry: null, lat: null, lon: null }],
      sources: { nws: { available: true, count: 1 }, gdacs: { available: false, count: 0 } },
    });
  });

  it("caches a valid empty response when both sources answer", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ features: [] })));

    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("s-maxage=300");
    expect(await response.json()).toMatchObject({ reports: [] });
  });
});
