import { Sighting, SightingType } from "./types";

// ─── Shared helpers ─────────────────────────────────────────

type RawArticle = {
  title: string;
  text: string;
  url: string;
  date: string;
  source: string;
};

type RawArticleWithCoords = RawArticle & {
  lat?: number;
  lon?: number;
  species?: string;
};

const FETCH_TIMEOUT_MS = 10_000;

function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = FETCH_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(id),
  );
}

function safeIsoDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString();
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

// Known shark-prone locations with pre-baked coordinates (skips geocoding)
// All coordinates point to shoreline/beach, never inland city centers
const KNOWN_LOCATIONS: Record<string, { lat: number; lon: number }> = {
  // US — East Coast (all on the waterfront)
  "new smyrna beach":   { lat: 29.0258, lon: -80.9270 },
  "daytona beach":      { lat: 29.2280, lon: -81.0050 },
  "cocoa beach":        { lat: 28.3200, lon: -80.6076 },
  "jacksonville beach": { lat: 30.2844, lon: -81.3939 },
  "miami beach":        { lat: 25.7907, lon: -80.1300 },
  "palm beach":         { lat: 26.7056, lon: -80.0364 },
  "key west":           { lat: 24.5551, lon: -81.7800 },
  "outer banks":        { lat: 35.5585, lon: -75.4665 },
  "myrtle beach":       { lat: 33.6891, lon: -78.8867 },
  "cape cod":           { lat: 41.6688, lon: -70.0800 },
  "chatham":            { lat: 41.6821, lon: -69.9597 },
  "nantucket":          { lat: 41.2835, lon: -70.0995 },
  "hilton head":        { lat: 32.1500, lon: -80.7700 },
  "florida keys":       { lat: 24.6615, lon: -81.5476 },
  "amelia island":      { lat: 30.6698, lon: -81.4426 },
  "clearwater":         { lat: 27.9780, lon: -82.8270 },
  "tampa bay":          { lat: 27.6100, lon: -82.7300 },
  // US — West Coast (all on the shoreline)
  "malibu":             { lat: 34.0259, lon: -118.7798 },
  "huntington beach":   { lat: 33.6553, lon: -118.0050 },
  "manhattan beach":    { lat: 33.8847, lon: -118.4109 },
  "san diego":          { lat: 32.7200, lon: -117.2540 },
  "la jolla":           { lat: 32.8500, lon: -117.2800 },
  "santa cruz":         { lat: 36.9630, lon: -122.0230 },
  "half moon bay":      { lat: 37.4636, lon: -122.4470 },
  "monterey bay":       { lat: 36.6100, lon: -121.8900 },
  "bolinas":            { lat: 37.9094, lon: -122.6867 },
  "pacifica":           { lat: 37.6138, lon: -122.5060 },
  "santa barbara":      { lat: 34.4050, lon: -119.6880 },
  "venice beach":       { lat: 33.9850, lon: -118.4730 },
  "san clemente":       { lat: 33.4200, lon: -117.6220 },
  "bodega bay":         { lat: 38.3333, lon: -123.0481 },
  "oregon coast":       { lat: 44.6368, lon: -124.0535 },
  // US — Hawaii (coastal points)
  "maui":               { lat: 20.7500, lon: -156.4500 },
  "oahu":               { lat: 21.2770, lon: -157.8290 },
  "north shore":        { lat: 21.5795, lon: -158.1044 },
  "waikiki":            { lat: 21.2766, lon: -157.8278 },
  "kauai":              { lat: 22.0700, lon: -159.5500 },
  "big island":         { lat: 19.7240, lon: -155.0850 },
  // US — States (mapped to main shark coast, NOT city centers)
  "california":         { lat: 33.9500, lon: -118.4700 },
  "florida":            { lat: 29.0200, lon: -80.9300 },
  "hawaii":             { lat: 21.2770, lon: -157.8290 },
  "north carolina":     { lat: 35.2300, lon: -75.6200 },
  "south carolina":     { lat: 32.7600, lon: -79.9300 },
  "texas":              { lat: 27.5800, lon: -97.2200 },
  "massachusetts":      { lat: 41.6690, lon: -70.0800 },
  "new jersey":         { lat: 39.3600, lon: -74.4300 },
  "new york":           { lat: 40.5775, lon: -73.9707 },
  // Australia (coastal points, not city centers)
  "sydney":             { lat: -33.8570, lon: 151.2870 },
  "bondi beach":        { lat: -33.8915, lon: 151.2767 },
  "byron bay":          { lat: -28.6437, lon: 153.6120 },
  "gold coast":         { lat: -28.0020, lon: 153.4310 },
  "perth":              { lat: -31.9900, lon: 115.7520 },
  "cottesloe":          { lat: -31.9920, lon: 115.7510 },
  "margaret river":     { lat: -33.9536, lon: 114.9727 },
  "esperance":          { lat: -33.8614, lon: 121.8919 },
  "ballina":            { lat: -28.8667, lon: 153.5667 },
  "newcastle":          { lat: -32.9280, lon: 151.7930 },
  "adelaide":           { lat: -35.0260, lon: 138.5000 },
  "port lincoln":       { lat: -34.7290, lon: 135.8584 },
  "brisbane":           { lat: -27.3700, lon: 153.4200 },
  "cairns":             { lat: -16.9186, lon: 145.7781 },
  "great barrier reef": { lat: -18.2871, lon: 147.6992 },
  "western australia":  { lat: -31.9900, lon: 115.7520 },
  "new south wales":    { lat: -33.8570, lon: 151.2870 },
  "queensland":         { lat: -27.3700, lon: 153.4200 },
  "south australia":    { lat: -35.0260, lon: 138.5000 },
  "australia":          { lat: -28.0020, lon: 153.4310 },
  // South Africa (coastal)
  "cape town":          { lat: -33.9050, lon: 18.3900 },
  "gansbaai":           { lat: -34.5808, lon: 19.3451 },
  "false bay":          { lat: -34.2000, lon: 18.6333 },
  "fish hoek":          { lat: -34.1366, lon: 18.4317 },
  "muizenberg":         { lat: -34.1094, lon: 18.4713 },
  "durban":             { lat: -29.8700, lon: 31.0500 },
  "port elizabeth":     { lat: -33.9608, lon: 25.6022 },
  "south africa":       { lat: -33.9050, lon: 18.3900 },
  // Other hotspots (coastal)
  "reunion island":     { lat: -21.1151, lon: 55.5364 },
  "bahamas":            { lat: 25.0343, lon: -77.3963 },
  "fiji":               { lat: -17.7134, lon: 178.0650 },
  "new zealand":        { lat: -36.8500, lon: 174.7800 },
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
  (a, b) => b[0].length - a[0].length,
);

export function extractKnownLocation(
  title: string,
  description: string,
): { name: string; lat: number; lon: number } | null {
  const text = `${title} ${description || ""}`.toLowerCase();
  for (const [name, coords] of SORTED_LOCATIONS) {
    if (text.includes(name)) {
      return { name: name.replace(/\b\w/g, (c) => c.toUpperCase()), ...coords };
    }
  }
  return null;
}

export function extractSpecies(title: string, description: string): string {
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

export function classifySighting(title: string, description: string): SightingType {
  const text = `${title} ${description || ""}`.toLowerCase();
  if (/(attack|bite|bitten|mauled|fatal)/.test(text)) return "Attack";
  if (/(warning|alert|closed|advisory|ban|closure)/.test(text)) return "Warning";
  if (/(spotted|seen|sighting|encounter|swimming)/.test(text)) return "Sighting";
  return "Unknown";
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function makeId(url: string, source: string): string {
  return Buffer.from(url + source).toString("base64url").slice(0, 24);
}

export function parseRssItems(
  xml: string,
): { title: string; link: string; pubDate: string; description: string }[] {
  const items: { title: string; link: string; pubDate: string; description: string }[] = [];
  const itemBlocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) ?? [];
  for (const block of itemBlocks) {
    const tag = (name: string) => {
      const m = block.match(
        new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`, "i"),
      );
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

// ─── Source 1: NewsAPI (key required) ────────────────────────

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
    const res = await fetchWithTimeout(`${NEWS_API_URL}?${params}`);
    const data = await res.json();
    if (data.status !== "ok") return [];
    return (data.articles ?? [])
      .filter((a: { title: string; description: string }) =>
        SHARK_KEYWORDS_RE.test((a.title ?? "") + " " + (a.description ?? "")),
      )
      .map(
        (a: {
          title: string;
          description: string;
          url: string;
          publishedAt: string;
          source: { name: string };
        }) => ({
          title: a.title ?? "",
          text: a.description ?? "",
          url: a.url,
          date: safeIsoDate(a.publishedAt),
          source: a.source?.name ?? "NewsAPI",
        }),
      );
  } catch (err) {
    console.error("[scanner] NewsAPI failed:", err instanceof Error ? err.message : err);
    return [];
  }
}

// ─── Source 2: Google News RSS (free, no key) ────────────────

const GOOGLE_NEWS_QUERIES = [
  "shark+attack", "shark+sighting", "shark+spotted+beach",
  "shark+warning+beach+closure", "shark+bite",
  "shark+attack+Australia", "shark+attack+Florida",
  "shark+attack+South+Africa", "great+white+shark+California",
  "tiger+shark+Hawaii", "bull+shark+encounter",
];

async function fetchGoogleNews(): Promise<RawArticle[]> {
  const results: RawArticle[] = [];
  for (const q of GOOGLE_NEWS_QUERIES) {
    try {
      const res = await fetchWithTimeout(
        `https://news.google.com/rss/search?q=${q}&hl=en-US&gl=US&ceid=US:en`,
        { headers: { "User-Agent": "sharkbait-app/1.0" } },
      );
      if (!res.ok) continue;
      const xml = await res.text();
      for (const item of parseRssItems(xml)) {
        if (!SHARK_KEYWORDS_RE.test(item.title + " " + item.description)) continue;
        results.push({
          title: item.title,
          text: item.description,
          url: item.link,
          date: safeIsoDate(item.pubDate),
          source: "Google News",
        });
      }
      await delay(300);
    } catch (err) {
      console.error("[scanner] Google News query failed:", err instanceof Error ? err.message : err);
    }
  }
  return results;
}

// ─── Source 3: Bing News RSS (free, no key) ──────────────────

async function fetchBingNews(): Promise<RawArticle[]> {
  const results: RawArticle[] = [];
  try {
    const res = await fetchWithTimeout(
      "https://www.bing.com/news/search?q=shark+attack+OR+shark+sighting&format=rss",
      { headers: { "User-Agent": "sharkbait-app/1.0" } },
    );
    if (!res.ok) return [];
    const xml = await res.text();
    for (const item of parseRssItems(xml)) {
      if (!SHARK_KEYWORDS_RE.test(item.title + " " + item.description)) continue;
      results.push({
        title: item.title,
        text: item.description,
        url: item.link,
        date: safeIsoDate(item.pubDate),
        source: "Bing News",
      });
    }
  } catch (err) {
    console.error("[scanner] Bing News failed:", err instanceof Error ? err.message : err);
  }
  return results;
}

// ─── Source 3b: Reddit (free, no key) ───────────────────────

const REDDIT_QUERIES = ["shark attack", "shark sighting", "shark spotted"];

async function fetchReddit(): Promise<RawArticle[]> {
  const results: RawArticle[] = [];
  for (const q of REDDIT_QUERIES) {
    try {
      const res = await fetchWithTimeout(
        `https://www.reddit.com/search.json?q=${encodeURIComponent(q)}&sort=new&limit=15&t=week`,
        { headers: { "User-Agent": "sharkbait-app/1.0 (shark sighting tracker)" } },
      );
      if (!res.ok) continue;
      const data = await res.json();
      for (const post of (data?.data?.children ?? [])) {
        const p = post.data;
        const title: string = p.title ?? "";
        const text: string = p.selftext ?? "";
        if (!SHARK_KEYWORDS_RE.test(title + " " + text)) continue;
        results.push({
          title,
          text,
          url: `https://reddit.com${p.permalink}`,
          date: safeIsoDate(new Date((p.created_utc ?? 0) * 1000).toISOString()),
          source: `r/${p.subreddit ?? "sharks"}`,
        });
      }
      await delay(300);
    } catch (err) {
      console.error("[scanner] Reddit query failed:", err instanceof Error ? err.message : err);
    }
  }
  return results;
}

// ─── Source 3c: The Guardian sharks feed ────────────────────

async function fetchGuardian(): Promise<RawArticle[]> {
  try {
    const res = await fetchWithTimeout(
      "https://www.theguardian.com/environment/sharks/rss",
      { headers: { "User-Agent": "sharkbait-app/1.0" } },
    );
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRssItems(xml).map((item) => ({
      title: item.title,
      text: item.description,
      url: item.link,
      date: safeIsoDate(item.pubDate),
      source: "The Guardian",
    }));
  } catch (err) {
    console.error("[scanner] Guardian failed:", err instanceof Error ? err.message : err);
    return [];
  }
}

// ─── Source 3d: ABC News Australia regional feeds ────────────

const ABC_AU_FEEDS = [
  "https://www.abc.net.au/news/feed/51120/rss.xml",   // Science & Environment
  "https://www.abc.net.au/news/feed/2942460/rss.xml", // Western Australia
  "https://www.abc.net.au/news/feed/2578922/rss.xml", // Queensland
];

async function fetchABCAustralia(): Promise<RawArticle[]> {
  const results: RawArticle[] = [];
  for (const feedUrl of ABC_AU_FEEDS) {
    try {
      const res = await fetchWithTimeout(
        feedUrl,
        { headers: { "User-Agent": "sharkbait-app/1.0" } },
      );
      if (!res.ok) continue;
      const xml = await res.text();
      for (const item of parseRssItems(xml)) {
        if (!SHARK_KEYWORDS_RE.test(item.title + " " + item.description)) continue;
        results.push({
          title: item.title,
          text: item.description,
          url: item.link,
          date: safeIsoDate(item.pubDate),
          source: "ABC News AU",
        });
      }
      await delay(200);
    } catch (err) {
      console.error("[scanner] ABC AU feed failed:", err instanceof Error ? err.message : err);
    }
  }
  return results;
}

// ─── Source 3e: Florida Museum ISAF ─────────────────────────

async function fetchISAF(): Promise<RawArticle[]> {
  try {
    const res = await fetchWithTimeout(
      "https://www.floridamuseum.ufl.edu/shark-attacks/feed/",
      { headers: { "User-Agent": "sharkbait-app/1.0" } },
    );
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRssItems(xml).map((item) => ({
      title: item.title,
      text: item.description,
      url: item.link,
      date: safeIsoDate(item.pubDate),
      source: "Florida Museum ISAF",
    }));
  } catch (err) {
    console.error("[scanner] ISAF failed:", err instanceof Error ? err.message : err);
    return [];
  }
}

// ─── Source 3f: Shark Research Committee ────────────────────

async function fetchSRC(): Promise<RawArticle[]> {
  try {
    const res = await fetchWithTimeout(
      "https://www.sharkresearchcommittee.com/feed/",
      { headers: { "User-Agent": "sharkbait-app/1.0" } },
    );
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRssItems(xml).map((item) => ({
      title: item.title,
      text: item.description,
      url: item.link,
      date: safeIsoDate(item.pubDate),
      source: "Shark Research Committee",
    }));
  } catch (err) {
    console.error("[scanner] SRC failed:", err instanceof Error ? err.message : err);
    return [];
  }
}

// ─── Source 3g: Dorsal Watch AU ─────────────────────────────

async function fetchDorsal(): Promise<RawArticle[]> {
  try {
    const res = await fetchWithTimeout(
      "https://dorsal.org/feed/",
      { headers: { "User-Agent": "sharkbait-app/1.0" } },
    );
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRssItems(xml).map((item) => ({
      title: item.title,
      text: item.description,
      url: item.link,
      date: safeIsoDate(item.pubDate),
      source: "Dorsal Watch AU",
    }));
  } catch (err) {
    console.error("[scanner] Dorsal failed:", err instanceof Error ? err.message : err);
    return [];
  }
}

// ─── Source 4: Ocearch Shark Tracker (free, no key) ──────────

async function fetchOcearch(): Promise<RawArticleWithCoords[]> {
  const results: RawArticleWithCoords[] = [];
  try {
    const res = await fetchWithTimeout(
      "https://www.ocearch.org/tracker/ajax/animals",
      { headers: { "User-Agent": "sharkbait-app/1.0" } },
    );
    if (!res.ok) return [];
    const text = await res.text();
    if (text.length > 2 * 1024 * 1024) return [];
    const sharks = JSON.parse(text);
    const items = (Array.isArray(sharks) ? sharks : []).slice(0, 500);
    for (const shark of items) {
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
        date: safeIsoDate(pinged),
        source: "Ocearch Tracker",
        lat,
        lon,
        species: species || undefined,
      });
    }
  } catch (err) {
    console.error("[scanner] Ocearch failed:", err instanceof Error ? err.message : err);
  }
  return results;
}

// ─── Processing pipeline ────────────────────────────────────

export async function processArticles(
  articles: RawArticleWithCoords[],
  seenUrls: Set<string>,
): Promise<Sighting[]> {
  const sightings: Sighting[] = [];

  for (const article of articles) {
    if (article.url && seenUrls.has(article.url)) continue;
    if (article.url) seenUrls.add(article.url);

    const species =
      article.species || extractSpecies(article.title, article.text);

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
    }
  }

  return sightings;
}

// ─── Main export ────────────────────────────────────────────

export async function scanForSightings(): Promise<Sighting[]> {
  const [
    newsApi, googleNews, bingNews, ocearch,
    reddit, guardian, abcAU, isaf, src, dorsal,
  ] = await Promise.all([
    fetchNewsApi(),
    fetchGoogleNews(),
    fetchBingNews(),
    fetchOcearch(),
    fetchReddit(),
    fetchGuardian(),
    fetchABCAustralia(),
    fetchISAF(),
    fetchSRC(),
    fetchDorsal(),
  ]);

  const allArticles: RawArticleWithCoords[] = [
    ...newsApi,
    ...googleNews,
    ...bingNews,
    ...ocearch,
    ...reddit,
    ...guardian,
    ...abcAU,
    ...isaf,
    ...src,
    ...dorsal,
  ];

  const seenUrls = new Set<string>();
  const sightings = await processArticles(allArticles, seenUrls);

  sightings.sort((a, b) => {
    const ta = new Date(a.date).getTime();
    const tb = new Date(b.date).getTime();
    if (isNaN(ta) && isNaN(tb)) return 0;
    if (isNaN(ta)) return 1;
    if (isNaN(tb)) return -1;
    return tb - ta;
  });

  return sightings;
}
