import { Sighting, SightingType } from "./types";

// ─── Shared helpers ─────────────────────────────────────────

type RawArticle = {
  title: string;
  text: string;
  url: string;
  date: string;
  source: string;
};

// Pre-geocoded results — skip the article if we already have coords
type RawArticleWithCoords = RawArticle & {
  lat?: number;
  lon?: number;
  species?: string;
};

// Known shark-prone locations with pre-baked coordinates (skips geocoding)
const KNOWN_LOCATIONS: Record<string, { lat: number; lon: number }> = {
  // US — East Coast
  "new smyrna beach":   { lat: 29.0258, lon: -80.9270 },
  "daytona beach":      { lat: 29.2108, lon: -81.0228 },
  "cocoa beach":        { lat: 28.3200, lon: -80.6076 },
  "jacksonville beach": { lat: 30.2844, lon: -81.3939 },
  "miami beach":        { lat: 25.7907, lon: -80.1300 },
  "palm beach":         { lat: 26.7056, lon: -80.0364 },
  "key west":           { lat: 24.5551, lon: -81.7800 },
  "outer banks":        { lat: 35.5585, lon: -75.4665 },
  "myrtle beach":       { lat: 33.6891, lon: -78.8867 },
  "cape cod":           { lat: 41.6688, lon: -70.2962 },
  "chatham":            { lat: 41.6821, lon: -69.9597 },
  "nantucket":          { lat: 41.2835, lon: -70.0995 },
  "hilton head":        { lat: 32.2163, lon: -80.7526 },
  "florida keys":       { lat: 24.6615, lon: -81.5476 },
  "amelia island":      { lat: 30.6698, lon: -81.4426 },
  "clearwater":         { lat: 27.9659, lon: -82.8001 },
  "tampa bay":          { lat: 27.7634, lon: -82.5437 },
  // US — West Coast
  "malibu":             { lat: 34.0259, lon: -118.7798 },
  "huntington beach":   { lat: 33.6603, lon: -117.9992 },
  "manhattan beach":    { lat: 33.8847, lon: -118.4109 },
  "san diego":          { lat: 32.7157, lon: -117.1611 },
  "la jolla":           { lat: 32.8328, lon: -117.2713 },
  "santa cruz":         { lat: 36.9741, lon: -122.0308 },
  "half moon bay":      { lat: 37.4636, lon: -122.4286 },
  "monterey bay":       { lat: 36.8008, lon: -121.9473 },
  "bolinas":            { lat: 37.9094, lon: -122.6867 },
  "pacifica":           { lat: 37.6138, lon: -122.4869 },
  "santa barbara":      { lat: 34.4208, lon: -119.6982 },
  "venice beach":       { lat: 33.9850, lon: -118.4695 },
  "san clemente":       { lat: 33.4270, lon: -117.6120 },
  "bodega bay":         { lat: 38.3333, lon: -123.0481 },
  "oregon coast":       { lat: 44.6368, lon: -124.0535 },
  // US — Hawaii
  "maui":               { lat: 20.7984, lon: -156.3319 },
  "oahu":               { lat: 21.4389, lon: -158.0001 },
  "north shore":        { lat: 21.5795, lon: -158.1044 },
  "waikiki":            { lat: 21.2766, lon: -157.8278 },
  "kauai":              { lat: 22.0964, lon: -159.5261 },
  "big island":         { lat: 19.8968, lon: -155.5828 },
  // US — States (broad)
  "california":         { lat: 34.0522, lon: -118.2437 },
  "florida":            { lat: 27.6648, lon: -81.5158 },
  "hawaii":             { lat: 21.3069, lon: -157.8583 },
  "north carolina":     { lat: 34.2104, lon: -77.8868 },
  "south carolina":     { lat: 32.7765, lon: -79.9311 },
  "texas":              { lat: 27.8006, lon: -97.3964 },
  "massachusetts":      { lat: 41.6688, lon: -70.2962 },
  "new jersey":         { lat: 39.3643, lon: -74.4229 },
  "new york":           { lat: 40.5775, lon: -73.9707 },
  // Australia
  "sydney":             { lat: -33.8688, lon: 151.2093 },
  "bondi beach":        { lat: -33.8915, lon: 151.2767 },
  "byron bay":          { lat: -28.6437, lon: 153.6120 },
  "gold coast":         { lat: -28.0167, lon: 153.4000 },
  "perth":              { lat: -31.9505, lon: 115.8605 },
  "cottesloe":          { lat: -31.9920, lon: 115.7510 },
  "margaret river":     { lat: -33.9536, lon: 114.9727 },
  "esperance":          { lat: -33.8614, lon: 121.8919 },
  "ballina":            { lat: -28.8667, lon: 153.5667 },
  "newcastle":          { lat: -32.9283, lon: 151.7817 },
  "adelaide":           { lat: -34.9285, lon: 138.6007 },
  "port lincoln":       { lat: -34.7290, lon: 135.8584 },
  "brisbane":           { lat: -27.4698, lon: 153.0251 },
  "cairns":             { lat: -16.9186, lon: 145.7781 },
  "great barrier reef": { lat: -18.2871, lon: 147.6992 },
  "western australia":  { lat: -31.9505, lon: 115.8605 },
  "new south wales":    { lat: -33.8688, lon: 151.2093 },
  "queensland":         { lat: -27.4698, lon: 153.0251 },
  "south australia":    { lat: -34.9285, lon: 138.6007 },
  "australia":          { lat: -28.2744, lon: 153.5500 },
  // South Africa
  "cape town":          { lat: -33.9249, lon: 18.4241 },
  "gansbaai":           { lat: -34.5808, lon: 19.3451 },
  "false bay":          { lat: -34.2000, lon: 18.6333 },
  "fish hoek":          { lat: -34.1366, lon: 18.4317 },
  "muizenberg":         { lat: -34.1094, lon: 18.4713 },
  "durban":             { lat: -29.8587, lon: 31.0218 },
  "port elizabeth":     { lat: -33.9608, lon: 25.6022 },
  "south africa":       { lat: -33.9249, lon: 18.4241 },
  // Other hotspots
  "reunion island":     { lat: -21.1151, lon: 55.5364 },
  "bahamas":            { lat: 25.0343, lon: -77.3963 },
  "fiji":               { lat: -17.7134, lon: 178.0650 },
  "new zealand":        { lat: -36.8485, lon: 174.7633 },
  "egypt":              { lat: 27.2579, lon: 33.8116 },
  "red sea":            { lat: 27.2579, lon: 33.8116 },
  "sharm el sheikh":    { lat: 27.9158, lon: 34.3300 },
  "brazil":             { lat: -8.0476, lon: -34.8770 },
  "recife":             { lat: -8.0476, lon: -34.8770 },
  "mexico":             { lat: 23.6345, lon: -109.9613 },
  "cancun":             { lat: 21.1619, lon: -86.8515 },
  "guadalupe island":   { lat: 29.0302, lon: -118.2837 },
};

const SORTED_LOCATIONS = Object.entries(KNOWN_LOCATIONS).sort(
  (a, b) => b[0].length - a[0].length
);

function extractKnownLocation(
  title: string,
  description: string
): { name: string; lat: number; lon: number } | null {
  const text = `${title} ${description || ""}`.toLowerCase();
  for (const [name, coords] of SORTED_LOCATIONS) {
    if (text.includes(name)) {
      return { name: name.replace(/\b\w/g, (c) => c.toUpperCase()), ...coords };
    }
  }
  return null;
}

function extractSpecies(title: string, description: string): string {
  const text = `${title} ${description || ""}`.toLowerCase();
  if (/great\s*white|white\s*shark|carcharodon/.test(text)) return "Great White";
  if (/tiger\s*shark|galeocerdo/.test(text)) return "Tiger";
  if (/hammerhead|sphyrna/.test(text)) return "Hammerhead";
  if (/bull\s*shark|zambezi|carcharhinus\s*leucas/.test(text)) return "Bull";
  if (/mako|isurus/.test(text)) return "Mako";
  if (/whale\s*shark|rhincodon/.test(text)) return "Whale Shark";
  if (/nurse\s*shark/.test(text)) return "Nurse";
  if (/blue\s*shark|prionace/.test(text)) return "Blue";
  if (/blacktip/.test(text)) return "Blacktip";
  if (/bronze\s*whaler|copper\s*shark/.test(text)) return "Bronze Whaler";
  if (/lemon\s*shark/.test(text)) return "Lemon";
  if (/reef\s*shark/.test(text)) return "Reef";
  if (/thresher/.test(text)) return "Thresher";
  if (/wobbegong/.test(text)) return "Wobbegong";
  return "Unknown";
}

function classifySighting(title: string, description: string): SightingType {
  const text = `${title} ${description || ""}`.toLowerCase();
  if (/(attack|bite|bitten|mauled|fatal)/.test(text)) return "Attack";
  if (/(warning|alert|closed|advisory|ban|closure)/.test(text)) return "Warning";
  if (/(spotted|seen|sighting|encounter|swimming)/.test(text)) return "Sighting";
  return "Unknown";
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

let idCounter = 0;
function makeId(url: string, source: string): string {
  const base = Buffer.from(url + source).toString("base64url").slice(0, 20);
  return `${base}_${idCounter++}`;
}

function parseRssItems(xml: string): { title: string; link: string; pubDate: string; description: string }[] {
  const items: { title: string; link: string; pubDate: string; description: string }[] = [];
  const itemBlocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) ?? [];
  for (const block of itemBlocks) {
    const tag = (name: string) => {
      const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`, "i"));
      return m ? m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim() : "";
    };
    items.push({
      title: tag("title"),
      link: tag("link"),
      pubDate: tag("pubDate"),
      description: tag("description"),
    });
  }
  return items;
}

const SHARK_KEYWORDS_RE =
  /shark.*(attack|sight|spot|warn|bite|encounter|seen)|great\s*white|bull\s*shark|tiger\s*shark|hammerhead/i;

// ─── Source 1: NewsAPI (key required — already have it) ─────

const NEWS_API_URL = "https://newsapi.org/v2/everything";
const NEWS_SEARCH_QUERY =
  '("shark attack" OR "shark sighting" OR "shark spotted" OR ' +
  '"shark warning" OR "shark bite" OR "shark encounter") ' +
  'NOT "pool shark" NOT "loan shark" NOT "card shark" NOT "shark tank"';

async function fetchNewsApi(): Promise<RawArticle[]> {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) return [];
  try {
    const from = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    const params = new URLSearchParams({
      q: NEWS_SEARCH_QUERY, from, sortBy: "publishedAt",
      language: "en", pageSize: "50", apiKey,
    });
    const res = await fetch(`${NEWS_API_URL}?${params}`);
    const data = await res.json();
    if (data.status !== "ok") return [];
    return (data.articles ?? []).map((a: { title: string; description: string; url: string; publishedAt: string; source: { name: string } }) => ({
      title: a.title ?? "", text: a.description ?? "",
      url: a.url, date: a.publishedAt, source: a.source?.name ?? "NewsAPI",
    }));
  } catch { return []; }
}

// ─── Source 2: Google News RSS (free, no key) ───────────────

const GOOGLE_NEWS_QUERIES = [
  "shark+attack", "shark+sighting", "shark+spotted+beach",
  "shark+warning+beach+closure", "shark+bite",
];

async function fetchGoogleNews(): Promise<RawArticle[]> {
  const results: RawArticle[] = [];
  for (const q of GOOGLE_NEWS_QUERIES) {
    try {
      const res = await fetch(
        `https://news.google.com/rss/search?q=${q}&hl=en-US&gl=US&ceid=US:en`,
        { headers: { "User-Agent": "sharkbait-app/1.0" } }
      );
      if (!res.ok) continue;
      const xml = await res.text();
      for (const item of parseRssItems(xml)) {
        if (!SHARK_KEYWORDS_RE.test(item.title + " " + item.description)) continue;
        results.push({
          title: item.title,
          text: item.description,
          url: item.link,
          date: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
          source: "Google News",
        });
      }
      await delay(300);
    } catch { /* non-fatal */ }
  }
  return results;
}

// ─── Source 3: Bing News RSS (free, no key) ─────────────────

async function fetchBingNews(): Promise<RawArticle[]> {
  const results: RawArticle[] = [];
  try {
    const res = await fetch(
      "https://www.bing.com/news/search?q=shark+attack+OR+shark+sighting&format=rss",
      { headers: { "User-Agent": "sharkbait-app/1.0" } }
    );
    if (!res.ok) return [];
    const xml = await res.text();
    for (const item of parseRssItems(xml)) {
      if (!SHARK_KEYWORDS_RE.test(item.title + " " + item.description)) continue;
      results.push({
        title: item.title,
        text: item.description,
        url: item.link,
        date: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
        source: "Bing News",
      });
    }
  } catch { /* non-fatal */ }
  return results;
}

// ─── Source 4: Ocearch Shark Tracker (free, no key) ─────────
// Real GPS-tagged sharks — these already have coordinates!

async function fetchOcearch(): Promise<RawArticleWithCoords[]> {
  const results: RawArticleWithCoords[] = [];
  try {
    const res = await fetch("https://www.ocearch.org/tracker/ajax/animals", {
      headers: { "User-Agent": "sharkbait-app/1.0" },
    });
    if (!res.ok) return [];
    const sharks = await res.json();
    for (const shark of Array.isArray(sharks) ? sharks : []) {
      const lat = parseFloat(shark.lat ?? shark.latitude ?? "");
      const lon = parseFloat(shark.lng ?? shark.lon ?? shark.longitude ?? "");
      if (isNaN(lat) || isNaN(lon)) continue;
      const name = shark.name ?? "Unknown shark";
      const species = shark.species ?? shark.species_common ?? "";
      const pinged = shark.pings?.[0]?.datetime ?? shark.last_ping ?? "";
      results.push({
        title: `${name} (${species}) — tracked by Ocearch`,
        text: `GPS-tagged ${species} "${name}" last pinged at this location.`,
        url: `https://www.ocearch.org/tracker/detail/${shark.id ?? shark.slug ?? ""}`,
        date: pinged ? new Date(pinged).toISOString() : new Date().toISOString(),
        source: "Ocearch Tracker",
        lat, lon,
        species: species || undefined,
      });
    }
  } catch { /* non-fatal */ }
  return results;
}

// ─── Processing pipeline ────────────────────────────────────

async function processArticles(
  articles: RawArticleWithCoords[],
  seenUrls: Set<string>
): Promise<Sighting[]> {
  const sightings: Sighting[] = [];

  for (const article of articles) {
    if (seenUrls.has(article.url)) continue;
    seenUrls.add(article.url);

    const species = article.species || extractSpecies(article.title, article.text);

    // If source already provided coords (Ocearch), use them directly
    if (article.lat != null && article.lon != null) {
      sightings.push({
        id: makeId(article.url, article.source),
        title: article.title,
        date: article.date,
        location: article.text.slice(0, 60),
        lat: article.lat,
        lon: article.lon,
        type: classifySighting(article.title, article.text),
        species,
        source: article.source,
        url: article.url,
      });
      continue;
    }

    // Try known locations first (instant, no API call)
    const known = extractKnownLocation(article.title, article.text);
    if (known) {
      sightings.push({
        id: makeId(article.url, article.source),
        title: article.title,
        date: article.date,
        location: known.name,
        lat: known.lat,
        lon: known.lon,
        type: classifySighting(article.title, article.text),
        species,
        source: article.source,
        url: article.url,
      });
      continue;
    }

    // Skip articles we can't place on the map instantly
    // (Nominatim geocoding is too slow — 1 sec per request)
    continue;
  }

  return sightings;
}

// ─── Main export ────────────────────────────────────────────

export async function scanForSightings(): Promise<Sighting[]> {
  // Fast sources only — all fire in parallel, ~5 sec total
  const [newsApi, googleNews, bingNews, ocearch] = await Promise.all([
    fetchNewsApi(),
    fetchGoogleNews(),
    fetchBingNews(),
    fetchOcearch(),
  ]);

  const allArticles: RawArticleWithCoords[] = [
    ...newsApi,
    ...googleNews,
    ...bingNews,
    ...ocearch,
  ];

  const seenUrls = new Set<string>();
  const sightings = await processArticles(allArticles, seenUrls);

  sightings.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return sightings;
}
