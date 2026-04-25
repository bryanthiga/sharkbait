export type SightingType = "Attack" | "Warning" | "Sighting" | "Unknown";

export interface Sighting {
  id: string;
  title: string;
  date: string;
  location: string;
  lat: number;
  lon: number;
  type: SightingType;
  species: string;
  source: string;
  url: string;
  healthScore?: number; // 0-100, Claude-assigned credibility (85+ verified, 65+ likely real, <40 low confidence)
}
