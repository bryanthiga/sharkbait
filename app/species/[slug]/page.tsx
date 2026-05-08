import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCachedSightings, applyFilters } from "@/lib/sightings-store";
import { SPECIES, getSpeciesBySlug, matchesSpecies } from "@/lib/species";

interface Props {
  params: Promise<{ slug: string }>;
}

export const revalidate = 300;

export function generateStaticParams() {
  return SPECIES.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const sp = getSpeciesBySlug(slug);
  if (!sp) return {};
  const title = `${sp.name} sightings — Sharkbait`;
  const description = `Recent ${sp.name} shark sightings, attacks, and warnings on the Sharkbait live tracker.`;
  const url = `https://sharkbait.io/species/${sp.slug}`;
  const image = "https://sharkbait.io/sharkbait-og.png";
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function SpeciesPage({ params }: Props) {
  const { slug } = await params;
  const sp = getSpeciesBySlug(slug);
  if (!sp) notFound();

  const { sightings: all } = await getCachedSightings();
  const filtered = applyFilters(all, { days: 30, limit: 200 }).filter((s) =>
    matchesSpecies(s.species, sp),
  );

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <a href="/" className="text-sm text-ocean-400 hover:underline">
        ← Back to live map
      </a>
      <h1 className="mt-4 text-3xl font-bold">{sp.name} sightings</h1>
      <p className="mt-2 text-slate-400">
        {filtered.length} {sp.name} sighting{filtered.length === 1 ? "" : "s"}{" "}
        in the last 30 days.
      </p>
      <ul className="mt-8 space-y-3">
        {filtered.map((s) => (
          <li
            key={s.id}
            className="rounded-lg border border-ocean-800/60 bg-ocean-900/40 p-4"
          >
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="rounded-full bg-ocean-800/80 px-2 py-0.5">
                {s.type}
              </span>
              <span>•</span>
              <span>{new Date(s.date).toLocaleDateString()}</span>
              <span>•</span>
              <span>{s.location}</span>
            </div>
            <h2 className="mt-2 text-base font-medium">
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-ocean-400"
              >
                {s.title}
              </a>
            </h2>
            <div className="mt-1 text-xs text-slate-500">{s.source}</div>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="text-slate-500">
            No {sp.name} sightings reported in the last 30 days.
          </li>
        )}
      </ul>
    </main>
  );
}
