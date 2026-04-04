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
}
