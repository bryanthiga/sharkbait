import { MetadataRoute } from "next";
import { REGIONS } from "@/lib/regions";
import { SPECIES } from "@/lib/species";

const BASE = "https://sharkbait.io";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${BASE}/`, lastModified: now, priority: 1.0, changeFrequency: "hourly" },
    ...REGIONS.map((r) => ({
      url: `${BASE}/sightings/${r.slug}`,
      lastModified: now,
      priority: 0.7,
      changeFrequency: "daily" as const,
    })),
    ...SPECIES.map((s) => ({
      url: `${BASE}/species/${s.slug}`,
      lastModified: now,
      priority: 0.7,
      changeFrequency: "daily" as const,
    })),
  ];
}
