export type FloodGeometry =
  | { type: "Point"; coordinates: number[] }
  | { type: "Polygon"; coordinates: number[][][] }
  | { type: "MultiPolygon"; coordinates: number[][][][] };

export interface FloodReport {
  id: string;
  title: string;
  date: string;
  location: string;
  lat: number | null;
  lon: number | null;
  geometry: FloodGeometry | null;
  severity: string;
  source: "NWS" | "GDACS";
  url: string;
  description: string;
}

type SourceResult = {
  reports: FloodReport[];
  available: boolean;
};

const TIMEOUT_MS = 8_000;
const USER_AGENT = "Sharkbait/1.0 (https://sharkbait.io)";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function asText(value: unknown, fallback = ""): string {
  return (typeof value === "string" && value.trim()) || fallback;
}

function validPosition(value: unknown): value is number[] {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    Number.isFinite(value[0]) &&
    Number.isFinite(value[1]) &&
    value[0] >= -180 && value[0] <= 180 &&
    value[1] >= -90 && value[1] <= 90
  );
}

function validPolygon(value: unknown): value is number[][][] {
  return Array.isArray(value) && value.length > 0 && value.every((ring) => {
    if (!Array.isArray(ring) || ring.length < 4 || !ring.every(validPosition)) return false;
    const first = ring[0];
    const last = ring[ring.length - 1];
    return first[0] === last[0] && first[1] === last[1];
  });
}

function normalizeGeometry(value: unknown): FloodGeometry | null {
  const geometry = asRecord(value);
  const coordinates = geometry.coordinates;
  if (geometry.type === "Point" && validPosition(coordinates)) {
    return { type: "Point", coordinates };
  }
  if (geometry.type === "Polygon" && validPolygon(coordinates)) {
    return { type: "Polygon", coordinates };
  }
  if (geometry.type === "MultiPolygon" && Array.isArray(coordinates) &&
      coordinates.length > 0 && coordinates.every(validPolygon)) {
    return { type: "MultiPolygon", coordinates };
  }
  return null;
}

function getCenter(geometry: FloodGeometry | null): { lat: number; lon: number } | null {
  if (!geometry) return null;
  if (geometry.type === "Point") return { lon: geometry.coordinates[0], lat: geometry.coordinates[1] };
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  let west = 180;
  let east = -180;
  let south = 90;
  let north = -90;
  for (const [outer] of polygons) {
    for (const [lon, lat] of outer) {
      west = Math.min(west, lon);
      east = Math.max(east, lon);
      south = Math.min(south, lat);
      north = Math.max(north, lat);
    }
  }
  return {
    lon: (west + east) / 2,
    lat: (south + north) / 2,
  };
}

async function fetchFeatures(url: string): Promise<unknown[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/geo+json, application/json",
        "User-Agent": USER_AGENT,
      },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Upstream returned ${response.status}`);
    const data = asRecord(await response.json());
    if (!Array.isArray(data.features)) throw new Error("Upstream did not return a feature collection");
    return data.features;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchNwsFloodReports(): Promise<SourceResult> {
  const events = [
    "Flood Warning",
    "Flash Flood Warning",
    "Flood Watch",
    "Flash Flood Watch",
    "Flood Advisory",
    "Coastal Flood Warning",
    "Coastal Flood Watch",
    "Coastal Flood Advisory",
  ];
  const url = new URL("https://api.weather.gov/alerts/active");
  url.searchParams.set("event", events.join(","));

  try {
    const features = await fetchFeatures(url.toString());
    const reports = features.flatMap((item: unknown): FloodReport[] => {
      const feature = asRecord(item);
      const properties = asRecord(feature.properties);
      const geometry = normalizeGeometry(feature.geometry);
      const event = asText(properties.event);
      if (!/flood/i.test(event)) return [];
      const center = getCenter(geometry);
      const sent = asText(properties.effective, asText(properties.sent));
      const id = asText(properties.id, asText(properties["@id"]));
      if (!id || !Number.isFinite(Date.parse(sent))) return [];
      return [{
        id: `nws:${id}`,
        title: asText(properties.headline, event),
        date: sent,
        location: asText(properties.areaDesc, "United States"),
        lat: center?.lat ?? null,
        lon: center?.lon ?? null,
        geometry,
        severity: asText(properties.severity, "Unknown"),
        source: "NWS",
        url: asText(properties.web, asText(properties["@id"])),
        description: asText(properties.description, asText(properties.instruction)).slice(0, 1600),
      }];
    });
    return { reports, available: true };
  } catch (error) {
    console.error("[floods] NWS request failed:", error instanceof Error ? error.message : error);
    return { reports: [], available: false };
  }
}

async function fetchGdacsFloodReports(): Promise<SourceResult> {
  const now = new Date();
  const from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const to = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const url = new URL("https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH");
  url.searchParams.set("eventlist", "FL");
  url.searchParams.set("fromdate", from.toISOString().slice(0, 10));
  url.searchParams.set("todate", to.toISOString().slice(0, 10));
  url.searchParams.set("alertlevel", "red;orange;green;reg");

  try {
    const features = await fetchFeatures(url.toString());
    const reports = features.flatMap((item: unknown): FloodReport[] => {
      const feature = asRecord(item);
      const properties = asRecord(feature.properties);
      if (properties.iscurrent === false) return [];
      const geometry = normalizeGeometry(feature.geometry);
      const center = getCenter(geometry);
      const eventId = asText(String(properties.eventid ?? ""));
      const episodeId = asText(String(properties.episodeid ?? ""));
      const date = asText(properties.datemodified, asText(properties.todate, asText(properties.fromdate)));
      if (!eventId || !Number.isFinite(Date.parse(date))) return [];
      const links = asRecord(properties.url);
      return [{
        id: `gdacs:${eventId}:${episodeId}`,
        title: asText(properties.name, asText(properties.description, "Flood event")),
        date,
        location: asText(properties.country, "Global"),
        lat: center?.lat ?? null,
        lon: center?.lon ?? null,
        geometry,
        severity: asText(properties.alertlevel, "Current"),
        source: "GDACS",
        url: asText(links.report),
        description: asText(properties.description, asText(properties.htmldescription)).slice(0, 1600),
      }];
    });
    return { reports, available: true };
  } catch (error) {
    console.error("[floods] GDACS request failed:", error instanceof Error ? error.message : error);
    return { reports: [], available: false };
  }
}

export async function getFloodReports() {
  const [nws, gdacs] = await Promise.all([
    fetchNwsFloodReports(),
    fetchGdacsFloodReports(),
  ]);
  const reports = [...nws.reports, ...gdacs.reports].sort(
    (a, b) => Date.parse(b.date) - Date.parse(a.date),
  );
  return {
    reports,
    updatedAt: new Date().toISOString(),
    sources: {
      nws: { available: nws.available, count: nws.reports.length },
      gdacs: { available: gdacs.available, count: gdacs.reports.length },
    },
  };
}
