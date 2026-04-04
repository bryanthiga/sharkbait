import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const indexHtml = readFileSync(
  join(__dirname, "..", "public", "index.html"),
  "utf-8",
);

describe("Security: XSS prevention in index.html", () => {
  it("defines escapeHtml function", () => {
    expect(indexHtml).toContain("function escapeHtml(str)");
  });

  it("defines safeUrl function", () => {
    expect(indexHtml).toContain("function safeUrl(url)");
  });

  it("safeUrl validates protocol to http/https only", () => {
    expect(indexHtml).toContain('u.protocol === "http:"');
    expect(indexHtml).toContain('u.protocol === "https:"');
  });

  it("uses escapeHtml in feed card titles", () => {
    const feedSection = indexHtml.slice(
      indexHtml.indexOf("function updateFeed"),
      indexHtml.indexOf("function selectSighting"),
    );
    expect(feedSection).toContain("escapeHtml(s.title)");
    expect(feedSection).toContain("escapeHtml(s.location)");
    expect(feedSection).toContain("escapeHtml(s.source)");
    expect(feedSection).toContain("escapeHtml(s.type)");
  });

  it("uses escapeHtml in selectSighting popup", () => {
    const selectSection = indexHtml.slice(
      indexHtml.indexOf("function selectSighting"),
      indexHtml.indexOf("function render"),
    );
    expect(selectSection).toContain("escapeHtml(s.title");
    expect(selectSection).toContain("escapeHtml(s.location)");
    expect(selectSection).toContain("escapeHtml(s.species)");
  });

  it("uses safeUrl instead of raw encodeURI for article links", () => {
    expect(indexHtml).toContain("safeUrl(s.url)");
    const feedSection = indexHtml.slice(
      indexHtml.indexOf("function updateFeed"),
    );
    expect(feedSection).not.toContain("encodeURI(s.url)");
  });

  it("escapes species in species bar data attribute", () => {
    const speciesSection = indexHtml.slice(
      indexHtml.indexOf("function updateSpeciesBar"),
      indexHtml.indexOf("function updateMapData"),
    );
    expect(speciesSection).toContain('escapeHtml(sp)');
  });

  it("escapes species in getSharkIcon alt attribute", () => {
    const iconFn = indexHtml.slice(
      indexHtml.indexOf("function getSharkIcon"),
      indexHtml.indexOf("// ── Map"),
    );
    expect(iconFn).toContain("escapeHtml(species)");
  });
});

describe("Security: API error handling", () => {
  it("does not expose internal error details in API responses", async () => {
    const routeSource = readFileSync(
      join(__dirname, "..", "app", "api", "sightings", "route.ts"),
      "utf-8",
    );
    expect(routeSource).toContain('"Failed to fetch sightings"');
    expect(routeSource).toContain("console.error");
    expect(routeSource).not.toMatch(
      /NextResponse\.json\(\s*\{\s*error:\s*message\s*\}/,
    );
  });
});

describe("Security: Mapbox script tag", () => {
  it("does not use defer on Mapbox script (prevents race condition)", () => {
    const scriptTag = indexHtml.match(
      /<script[^>]*mapbox-gl\.js[^>]*>/,
    );
    expect(scriptTag).not.toBeNull();
    expect(scriptTag![0]).not.toContain("defer");
  });
});

describe("Security: response headers in next.config.ts", () => {
  it("configures security headers", () => {
    const config = readFileSync(
      join(__dirname, "..", "next.config.ts"),
      "utf-8",
    );
    expect(config).toContain("X-Content-Type-Options");
    expect(config).toContain("nosniff");
    expect(config).toContain("X-Frame-Options");
    expect(config).toContain("DENY");
    expect(config).toContain("Referrer-Policy");
  });
});
