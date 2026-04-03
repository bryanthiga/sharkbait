"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Sighting, SightingType } from "@/lib/types";
import StatsBar from "@/components/StatsBar";
import SightingFeed from "@/components/SightingFeed";

const SharkMap = dynamic(() => import("@/components/SharkMap"), { ssr: false });

const typeFilters: { label: string; value: SightingType | "All" }[] = [
  { label: "All", value: "All" },
  { label: "🔴 Attacks", value: "Attack" },
  { label: "🟠 Warnings", value: "Warning" },
  { label: "🟢 Sightings", value: "Sighting" },
];

export default function Home() {
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<SightingType | "All">("All");

  const fetchSightings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/sightings");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Fetch failed");
      setSightings(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSightings();
  }, [fetchSightings]);

  const filtered =
    filter === "All" ? sightings : sightings.filter((s) => s.type === filter);

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      {/* ---- Map ---- */}
      <main className="relative min-h-[55dvh] flex-1 bg-ocean-950 md:min-h-dvh">
        {sightings.length > 0 && (
          <SharkMap
            sightings={filtered}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        )}

        {/* Loading / empty overlay */}
        {(loading || sightings.length === 0) && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-ocean-950/60">
            {loading ? (
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-400 border-t-transparent" />
                <p className="text-sm text-slate-400">
                  Scanning for shark sightings…
                </p>
              </div>
            ) : error ? (
              <div className="rounded-2xl bg-ocean-900/90 px-6 py-5 text-center ring-1 ring-white/10">
                <p className="text-sm text-rose-300">{error}</p>
                <button
                  onClick={fetchSightings}
                  className="mt-3 rounded-lg bg-teal-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-teal-500"
                >
                  Retry
                </button>
              </div>
            ) : null}
          </div>
        )}

        {/* Logo chip */}
        <div className="absolute left-3 top-3 z-10 flex items-center gap-2 rounded-xl bg-ocean-900/80 px-3 py-2 shadow-lg ring-1 ring-white/10 backdrop-blur-md">
          <span className="text-lg">🦈</span>
          <span className="text-sm font-semibold text-white">Sharkbait</span>
        </div>
      </main>

      {/* ---- Sidebar / bottom sheet ---- */}
      <aside className="flex max-h-[45dvh] flex-col border-t border-white/10 bg-ocean-900/95 shadow-[0_-8px_32px_rgba(0,0,0,0.4)] backdrop-blur-md md:max-h-none md:w-[380px] md:border-l md:border-t-0 md:shadow-none">
        {/* Stats */}
        <StatsBar sightings={filtered} />

        {/* Filter pills */}
        <div className="flex gap-1.5 border-b border-white/10 px-3 pb-2">
          {typeFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                filter === f.value
                  ? "bg-teal-500/20 text-teal-300 ring-1 ring-teal-400/40"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Feed */}
        <div className="flex-1 overflow-y-auto p-3">
          {loading ? (
            <div className="flex flex-col items-center gap-2 py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-400 border-t-transparent" />
              <p className="text-xs text-slate-500">Loading sightings…</p>
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-500">
              No sightings found — try a different filter
            </p>
          ) : (
            <SightingFeed
              sightings={filtered}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          )}
        </div>

        {/* Refresh button */}
        <div className="border-t border-white/10 px-3 py-2">
          <button
            onClick={fetchSightings}
            disabled={loading}
            className="w-full rounded-xl bg-teal-600/80 py-2.5 text-xs font-semibold text-white transition hover:bg-teal-500 disabled:opacity-40"
          >
            {loading ? "Scanning…" : "🔄 Refresh sightings"}
          </button>
        </div>
      </aside>
    </div>
  );
}
