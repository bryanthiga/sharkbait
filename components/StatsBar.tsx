"use client";

import { Sighting } from "@/lib/types";

const stats = [
  { key: "total", label: "Total", color: "from-ocean-800 to-ocean-700" },
  { key: "Attack", label: "Attacks", color: "from-rose-900/80 to-rose-700/80" },
  { key: "Warning", label: "Warnings", color: "from-amber-900/70 to-amber-700/70" },
  { key: "Sighting", label: "Sightings", color: "from-emerald-900/70 to-emerald-700/70" },
] as const;

export default function StatsBar({ sightings }: { sightings: Sighting[] }) {
  const counts: Record<string, number> = {
    total: sightings.length,
    Attack: sightings.filter((s) => s.type === "Attack").length,
    Warning: sightings.filter((s) => s.type === "Warning").length,
    Sighting: sightings.filter((s) => s.type === "Sighting").length,
  };

  return (
    <div className="grid grid-cols-4 gap-2 px-3 py-2">
      {stats.map((s) => (
        <div
          key={s.key}
          className={`rounded-xl bg-gradient-to-br ${s.color} px-3 py-2 text-center ring-1 ring-white/5`}
        >
          <p className="text-lg font-bold text-white">{counts[s.key]}</p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-white/70">
            {s.label}
          </p>
        </div>
      ))}
    </div>
  );
}
