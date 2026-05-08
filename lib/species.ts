export interface SpeciesEntry {
  slug: string;
  name: string;
  matchers: string[];
}

export const SPECIES: SpeciesEntry[] = [
  { slug: "great-white", name: "Great White", matchers: ["great white"] },
  { slug: "tiger-shark", name: "Tiger Shark", matchers: ["tiger"] },
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
