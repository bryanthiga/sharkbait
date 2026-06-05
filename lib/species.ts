export interface SpeciesEntry {
  slug: string;
  name: string;
  matchers: string[];
}

// Mirror of SHARK_IMAGES in public/index.html — keep these in sync.
// Matchers are lowercase substrings; the longest match wins because of
// SPECIES order (sub-species before generics).
export const SPECIES: SpeciesEntry[] = [
  { slug: "great-white", name: "Great White", matchers: ["great white"] },
  { slug: "tiger-shark", name: "Tiger Shark", matchers: ["tiger shark", "tiger"] },
  { slug: "hammerhead", name: "Hammerhead", matchers: ["hammerhead", "sphyrna"] },
  { slug: "bull-shark", name: "Bull Shark", matchers: ["bull shark", "zambezi"] },
  { slug: "mako", name: "Mako", matchers: ["mako", "isurus"] },
  { slug: "whale-shark", name: "Whale Shark", matchers: ["whale shark", "rhincodon"] },
  { slug: "blacktip", name: "Blacktip", matchers: ["blacktip"] },
  { slug: "blue-shark", name: "Blue Shark", matchers: ["blue shark", "prionace"] },
  { slug: "nurse-shark", name: "Nurse Shark", matchers: ["nurse shark"] },
  { slug: "reef-shark", name: "Reef Shark", matchers: ["reef shark"] },
];

const RELATED_MARINE_TERMS = ["ray", "skate", "guitarfish", "sawfish", "manta"];

export function getSpeciesBySlug(slug: string): SpeciesEntry | undefined {
  return SPECIES.find((s) => s.slug === slug);
}

export function isRelatedMarine(species: string): boolean {
  const s = species.toLowerCase();
  return RELATED_MARINE_TERMS.some((t) => s.includes(t));
}

export function matchesSpecies(species: string, entry: SpeciesEntry): boolean {
  const s = species.toLowerCase();
  return entry.matchers.some((m) => s.includes(m));
}
