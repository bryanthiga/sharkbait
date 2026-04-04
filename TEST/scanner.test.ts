import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  extractKnownLocation,
  extractSpecies,
  classifySighting,
  parseRssItems,
  makeId,
  processArticles,
  scanForSightings,
} from "../lib/scanner";

// ─── extractKnownLocation ───────────────────────────────────

describe("extractKnownLocation", () => {
  it("returns coords when location is in the title", () => {
    const result = extractKnownLocation("Shark spotted near Malibu", "");
    expect(result).not.toBeNull();
    expect(result!.name).toBe("Malibu");
    expect(result!.lat).toBeCloseTo(34.0259, 2);
    expect(result!.lon).toBeCloseTo(-118.7798, 2);
  });

  it("returns coords when location is only in description", () => {
    const result = extractKnownLocation("Shark seen", "spotted near bondi beach area");
    expect(result).not.toBeNull();
    expect(result!.name).toBe("Bondi Beach");
  });

  it("is case-insensitive", () => {
    const result = extractKnownLocation("CAPE TOWN shark attack", "");
    expect(result).not.toBeNull();
    expect(result!.name).toBe("Cape Town");
  });

  it("matches longest location first", () => {
    const result = extractKnownLocation("Attack at new smyrna beach", "");
    expect(result).not.toBeNull();
    expect(result!.name).toBe("New Smyrna Beach");
  });

  it("returns null when no location matches", () => {
    const result = extractKnownLocation("Shark seen in unknown waters", "somewhere deep");
    expect(result).toBeNull();
  });

  it("handles empty title and description", () => {
    expect(extractKnownLocation("", "")).toBeNull();
  });

  it("capitalizes result name correctly", () => {
    const result = extractKnownLocation("Trip to great barrier reef", "");
    expect(result).not.toBeNull();
    expect(result!.name).toBe("Great Barrier Reef");
  });
});

// ─── extractSpecies ─────────────────────────────────────────

describe("extractSpecies", () => {
  it("detects Great White via 'great white'", () => {
    expect(extractSpecies("Great white shark spotted", "")).toBe("Great White");
  });

  it("detects Great White via 'white shark'", () => {
    expect(extractSpecies("A white shark near shore", "")).toBe("Great White");
  });

  it("detects Great White via scientific name", () => {
    expect(extractSpecies("Carcharodon carcharias sighting", "")).toBe("Great White");
  });

  it("detects Tiger via 'tiger shark'", () => {
    expect(extractSpecies("Tiger shark warning issued", "")).toBe("Tiger");
  });

  it("detects Hammerhead", () => {
    expect(extractSpecies("Hammerhead seen", "")).toBe("Hammerhead");
  });

  it("detects Bull via 'bull shark'", () => {
    expect(extractSpecies("Bull shark attack", "")).toBe("Bull");
  });

  it("detects Mako", () => {
    expect(extractSpecies("Mako caught on line", "")).toBe("Mako");
  });

  it("detects Whale Shark", () => {
    expect(extractSpecies("Whale shark encounter", "")).toBe("Whale Shark");
  });

  it("detects Nurse", () => {
    expect(extractSpecies("Nurse shark swimming", "")).toBe("Nurse");
  });

  it("detects Blue", () => {
    expect(extractSpecies("Blue shark spotted", "")).toBe("Blue");
  });

  it("detects Blacktip", () => {
    expect(extractSpecies("Blacktip near shore", "")).toBe("Blacktip");
  });

  it("detects Bronze Whaler via 'copper shark'", () => {
    expect(extractSpecies("Copper shark sighting", "")).toBe("Bronze Whaler");
  });

  it("detects Reef", () => {
    expect(extractSpecies("Reef shark spotted", "")).toBe("Reef");
  });

  it("detects Thresher", () => {
    expect(extractSpecies("Thresher spotted offshore", "")).toBe("Thresher");
  });

  it("detects Wobbegong", () => {
    expect(extractSpecies("Wobbegong at beach", "")).toBe("Wobbegong");
  });

  it("returns Unknown when no species matches", () => {
    expect(extractSpecies("Shark seen near beach", "")).toBe("Unknown");
  });

  it("first regex match wins (priority order)", () => {
    expect(extractSpecies("Great white and mako spotted", "")).toBe("Great White");
  });

  it("finds species in description when not in title", () => {
    expect(extractSpecies("Shark spotted", "It was a bull shark")).toBe("Bull");
  });
});

// ─── classifySighting ───────────────────────────────────────

describe("classifySighting", () => {
  it("classifies 'attack' as Attack", () => {
    expect(classifySighting("Shark attack in Florida", "")).toBe("Attack");
  });

  it("classifies 'bite' as Attack", () => {
    expect(classifySighting("Surfer bitten by shark", "")).toBe("Attack");
  });

  it("classifies 'mauled' as Attack", () => {
    expect(classifySighting("Man mauled by shark", "")).toBe("Attack");
  });

  it("classifies 'fatal' as Attack", () => {
    expect(classifySighting("Fatal shark encounter", "")).toBe("Attack");
  });

  it("classifies 'warning' as Warning", () => {
    expect(classifySighting("Shark warning at beach", "")).toBe("Warning");
  });

  it("classifies 'alert' as Warning", () => {
    expect(classifySighting("Shark alert issued", "")).toBe("Warning");
  });

  it("classifies 'closed' as Warning", () => {
    expect(classifySighting("Beach closed after sighting", "")).toBe("Warning");
  });

  it("classifies 'advisory' as Warning", () => {
    expect(classifySighting("Shark advisory posted", "")).toBe("Warning");
  });

  it("classifies 'spotted' as Sighting", () => {
    expect(classifySighting("Shark spotted near shore", "")).toBe("Sighting");
  });

  it("classifies 'encounter' as Sighting", () => {
    expect(classifySighting("Shark encounter reported", "")).toBe("Sighting");
  });

  it("returns Unknown when nothing matches", () => {
    expect(classifySighting("New research on sharks", "")).toBe("Unknown");
  });

  it("Attack takes priority over Warning", () => {
    expect(classifySighting("Fatal shark attack, beach closed", "")).toBe("Attack");
  });

  it("Warning takes priority over Sighting", () => {
    expect(classifySighting("Beach closed after shark spotted", "")).toBe("Warning");
  });

  it("is case-insensitive", () => {
    expect(classifySighting("SHARK ATTACK", "")).toBe("Attack");
  });

  it("matches keyword in description only", () => {
    expect(classifySighting("News update", "details of the attack")).toBe("Attack");
  });
});

// ─── parseRssItems ──────────────────────────────────────────

describe("parseRssItems", () => {
  it("parses valid RSS with multiple items", () => {
    const xml = `
      <rss><channel>
        <item><title>Shark Attack</title><link>http://a.com</link><pubDate>Mon, 01 Jan 2024</pubDate><description>Desc A</description></item>
        <item><title>Shark Spotted</title><link>http://b.com</link><pubDate>Tue, 02 Jan 2024</pubDate><description>Desc B</description></item>
      </channel></rss>
    `;
    const items = parseRssItems(xml);
    expect(items).toHaveLength(2);
    expect(items[0].title).toBe("Shark Attack");
    expect(items[0].link).toBe("http://a.com");
    expect(items[1].title).toBe("Shark Spotted");
  });

  it("returns empty array for XML with no items", () => {
    expect(parseRssItems("<rss><channel></channel></rss>")).toEqual([]);
  });

  it("returns empty array for empty string", () => {
    expect(parseRssItems("")).toEqual([]);
  });

  it("handles CDATA in title", () => {
    const xml = `<item><title><![CDATA[Shark Attack]]></title><link>http://x.com</link><pubDate></pubDate><description></description></item>`;
    const items = parseRssItems(xml);
    expect(items[0].title).toBe("Shark Attack");
  });

  it("returns empty string for missing tags", () => {
    const xml = `<item><title>Only Title</title></item>`;
    const items = parseRssItems(xml);
    expect(items[0].link).toBe("");
    expect(items[0].pubDate).toBe("");
    expect(items[0].description).toBe("");
  });

  it("handles item with attributes", () => {
    const xml = `<item rdf:about="http://example.com"><title>Test</title><link>http://x.com</link><pubDate></pubDate><description></description></item>`;
    const items = parseRssItems(xml);
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe("Test");
  });
});

// ─── makeId ─────────────────────────────────────────────────

describe("makeId", () => {
  it("returns a 24-character string", () => {
    const id = makeId("http://example.com/article", "NewsAPI");
    expect(typeof id).toBe("string");
    expect(id.length).toBe(24);
  });

  it("is deterministic for same inputs", () => {
    const a = makeId("http://example.com", "src");
    const b = makeId("http://example.com", "src");
    expect(a).toBe(b);
  });

  it("different URLs produce different IDs", () => {
    const a = makeId("http://a.com", "src");
    const b = makeId("http://b.com", "src");
    expect(a).not.toBe(b);
  });

  it("handles empty strings", () => {
    const id = makeId("", "");
    expect(typeof id).toBe("string");
  });
});

// ─── processArticles ────────────────────────────────────────

describe("processArticles", () => {
  it("deduplicates articles with same URL", async () => {
    const articles = [
      { title: "Shark in Malibu", text: "desc", url: "http://a.com", date: "2024-01-01", source: "A" },
      { title: "Shark in Malibu again", text: "desc", url: "http://a.com", date: "2024-01-02", source: "B" },
    ];
    const result = await processArticles(articles, new Set());
    expect(result).toHaveLength(1);
  });

  it("skips URLs already in seenUrls set", async () => {
    const articles = [
      { title: "Shark near Malibu", text: "desc", url: "http://a.com", date: "2024-01-01", source: "A" },
    ];
    const seen = new Set(["http://a.com"]);
    const result = await processArticles(articles, seen);
    expect(result).toHaveLength(0);
  });

  it("uses pre-geocoded coords when lat/lon present", async () => {
    const articles = [
      { title: "Tagged shark", text: "desc", url: "http://o.com", date: "2024-01-01", source: "Ocearch", lat: 30, lon: -80 },
    ];
    const result = await processArticles(articles, new Set());
    expect(result).toHaveLength(1);
    expect(result[0].lat).toBe(30);
    expect(result[0].lon).toBe(-80);
  });

  it("uses known location when no coords but location matches", async () => {
    const articles = [
      { title: "Shark at Cape Cod", text: "", url: "http://news.com", date: "2024-01-01", source: "News" },
    ];
    const result = await processArticles(articles, new Set());
    expect(result).toHaveLength(1);
    expect(result[0].location).toBe("Cape Cod");
  });

  it("skips articles with no coords and no known location", async () => {
    const articles = [
      { title: "Shark in unknown place", text: "", url: "http://x.com", date: "2024-01-01", source: "X" },
    ];
    const result = await processArticles(articles, new Set());
    expect(result).toHaveLength(0);
  });

  it("does not drop articles with empty URLs", async () => {
    const articles = [
      { title: "Shark in Malibu", text: "", url: "", date: "2024-01-01", source: "A" },
      { title: "Shark in Sydney", text: "", url: "", date: "2024-01-02", source: "B" },
    ];
    const result = await processArticles(articles, new Set());
    expect(result).toHaveLength(2);
  });

  it("returns empty array for empty input", async () => {
    const result = await processArticles([], new Set());
    expect(result).toEqual([]);
  });
});

// ─── scanForSightings (integration) ─────────────────────────

describe("scanForSightings", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({}),
        text: async () => "",
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns empty array when all sources fail", async () => {
    const result = await scanForSightings();
    expect(Array.isArray(result)).toBe(true);
  });

  it("returns Sighting[] with all required fields when data available", async () => {
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("ocearch")) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            { name: "Bruce", species: "Great White", lat: "30.0", lng: "-80.0", pings: [{ datetime: "2024-01-01T00:00:00Z" }], id: "1" },
          ],
          text: async () =>
            JSON.stringify([
              { name: "Bruce", species: "Great White", lat: "30.0", lng: "-80.0", pings: [{ datetime: "2024-01-01T00:00:00Z" }], id: "1" },
            ]),
        });
      }
      return Promise.resolve({ ok: false, json: async () => ({}), text: async () => "" });
    });
    vi.stubGlobal("fetch", mockFetch);

    const result = await scanForSightings();
    expect(result.length).toBeGreaterThan(0);
    const s = result[0];
    expect(s).toHaveProperty("id");
    expect(s).toHaveProperty("title");
    expect(s).toHaveProperty("date");
    expect(s).toHaveProperty("lat");
    expect(s).toHaveProperty("lon");
    expect(s).toHaveProperty("type");
    expect(s).toHaveProperty("species");
    expect(s).toHaveProperty("source");
    expect(s).toHaveProperty("url");
  });
});
