"use client";

import { Sighting, SightingType } from "@/lib/types";

const typeBadge: Record<SightingType, { emoji: string; style: string }> = {
  Attack: {
    emoji: "🔴",
    style: "bg-rose-500/20 text-rose-200 ring-rose-400/40",
  },
  Warning: {
    emoji: "🟠",
    style: "bg-amber-500/20 text-amber-100 ring-amber-400/40",
  },
  Sighting: {
    emoji: "🟢",
    style: "bg-emerald-500/15 text-emerald-100 ring-emerald-400/30",
  },
  Unknown: {
    emoji: "🔵",
    style: "bg-blue-500/15 text-blue-100 ring-blue-400/30",
  },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

interface Props {
  sightings: Sighting[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export default function SightingFeed({
  sightings,
  selectedId,
  onSelect,
}: Props) {
  return (
    <ul className="space-y-2">
      {sightings.map((s, idx) => {
        const badge = typeBadge[s.type];
        const active = s.id === selectedId;
        return (
          <li key={`${s.id}-${idx}`}>
            <button
              onClick={() => onSelect(active ? null : s.id)}
              className={`w-full rounded-xl p-3 text-left transition ring-1 ${
                active
                  ? "bg-ocean-700/80 ring-teal-400/40"
                  : "bg-ocean-800/60 ring-white/5 hover:bg-ocean-800/90"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium leading-snug text-white line-clamp-2">
                  {s.title}
                </p>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${badge.style}`}
                >
                  {badge.emoji} {s.type}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400">{s.location}</p>
              <div className="mt-1.5 flex flex-wrap gap-x-3 text-[11px] text-slate-500">
                <span>{timeAgo(s.date)}</span>
                <span>{s.source}</span>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
