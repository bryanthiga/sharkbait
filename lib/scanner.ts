import { Sighting, SightingType } from "./types";

const NEWS_API_URL = "https://newsapi.org/v2/everything";

const SEARCH_QUERY =
  '("shark attack" OR "shark sighting" OR "shark spotted" OR ' +
  '"shark warning" OR "shark bite" OR "shark encounter") ' +
  'NOT "pool shark" NOT "loan shark" NOT "card shark" NOT "shark tank"';

const LOCATION_PATTERNS = [
  /(?:in|near|off|at|along)\s+(?:the\s+)?(?:coast\s+of\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:,\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)?)/g,
  /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:beach|coast|shore|bay|island|harbor|harbour|pier|reef)/g,
  /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*(?:[A-Z]{2,3}|[A-Z][a-z]+))\s/g,
];

const STOP_WORDS = new Set([
  "the", "a", "an", "new", "great", "this", "that", "shark", "white",
  "bull", "tiger", "after", "before", "more", "most", "first", "last",
]);

function extractLocation(title: string, description: string): string | null {
  const text = `${title} ${description || ""}`;

  for (const pattern of LOCATION_PATTERNS) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      const candidate = match[1].trim().replace(/\.$/, "");
      if (!STOP_WORDS.has(candidate.toLowerCase()) && candidate.length > 2) {
        return candidate;
      }
    }
  }

  const cityState = text.match(
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*[A-Z][A-Za-z\s]+)/
  );
  if (cityState) return cityState[1].trim();

  return null;
}

function classifySighting(title: string, description: string): SightingType {
  const text = `${title} ${description || ""}`.toLowerCase();
  if (/(attack|bite|bitten|mauled|fatal)/.test(text)) return "Attack";
  if (/(warning|alert|closed|advisory|ban)/.test(text)) return "Warning";
  if (/(spotted|seen|sighting|encounter|swimming)/.test(text)) return "Sighting";
  return "Unknown";
}

interface NominatimResult {
  lat: string;
  lon: string;
}

async function geocode(
  locationName: string
): Promise<{ lat: number; lon: number } | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName)}&limit=1`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "sharkbait-app/1.0" },
    });
    const data: NominatimResult[] = await res.json();
    if (data.length > 0) {
      return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
    }

    const coastalRes = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName + " beach")}&limit=1`,
      { headers: { "User-Agent": "sharkbait-app/1.0" } }
    );
    const coastalData: NominatimResult[] = await coastalRes.json();
    if (coastalData.length > 0) {
      return {
        lat: parseFloat(coastalData[0].lat),
        lon: parseFloat(coastalData[0].lon),
      };
    }
  } catch {
    /* geocoding failure is non-fatal */
  }

  return null;
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

interface NewsArticle {
  url: string;
  title: string;
  description: string;
  publishedAt: string;
  source: { name: string };
}

export async function scanForSightings(): Promise<Sighting[]> {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) throw new Error("NEWS_API_KEY not configured");

  const fromDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const params = new URLSearchParams({
    q: SEARCH_QUERY,
    from: fromDate,
    sortBy: "publishedAt",
    language: "en",
    pageSize: "30",
    apiKey,
  });

  const res = await fetch(`${NEWS_API_URL}?${params}`);
  const data = await res.json();
  if (data.status !== "ok") throw new Error(data.message ?? "NewsAPI error");

  const articles: NewsArticle[] = data.articles ?? [];
  const sightings: Sighting[] = [];
  const seenUrls = new Set<string>();

  for (const article of articles) {
    if (seenUrls.has(article.url)) continue;
    seenUrls.add(article.url);

    const locationName = extractLocation(
      article.title ?? "",
      article.description ?? ""
    );
    if (!locationName) continue;

    const coords = await geocode(locationName);
    if (!coords) continue;

    sightings.push({
      id: Buffer.from(article.url).toString("base64url").slice(0, 16),
      title: article.title,
      date: article.publishedAt,
      location: locationName,
      lat: coords.lat,
      lon: coords.lon,
      type: classifySighting(article.title, article.description),
      source: article.source?.name ?? "Unknown",
      url: article.url,
    });

    // Nominatim rate limit: 1 request per second
    await delay(1100);
  }

  sightings.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return sightings;
}
