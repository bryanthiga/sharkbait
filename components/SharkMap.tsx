"use client";

import { useEffect, useRef, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Sighting } from "@/lib/types";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

const typeColors: Record<string, string> = {
  Attack: "#ef4444",
  Warning: "#f59e0b",
  Sighting: "#10b981",
  Unknown: "#3b82f6",
};

interface Props {
  sightings: Sighting[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export default function SharkMap({ sightings, selectedId, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [-40, 20],
      zoom: 2,
      projection: "mercator",
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  const handleMarkerClick = useCallback(
    (id: string) => {
      onSelect(id);
    },
    [onSelect]
  );

  // Sync markers with sightings
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const currentMarkers = markersRef.current;
    const incomingIds = new Set(sightings.map((s) => s.id));

    // Remove stale markers
    for (const [id, marker] of currentMarkers) {
      if (!incomingIds.has(id)) {
        marker.remove();
        currentMarkers.delete(id);
      }
    }

    // Add or update markers
    for (const s of sightings) {
      if (currentMarkers.has(s.id)) continue;

      const color = typeColors[s.type] ?? typeColors.Unknown;

      const el = document.createElement("div");
      el.className = "shark-marker";
      el.style.cssText = `
        width: 14px; height: 14px; border-radius: 50%;
        background: ${color}; border: 2px solid #fff;
        cursor: pointer; box-shadow: 0 0 8px ${color}88;
        transition: transform 0.15s ease;
      `;
      el.addEventListener("mouseenter", () => {
        el.style.transform = "scale(1.6)";
      });
      el.addEventListener("mouseleave", () => {
        el.style.transform = selectedId === s.id ? "scale(1.6)" : "scale(1)";
      });

      const popup = new mapboxgl.Popup({
        offset: 12,
        closeButton: false,
        maxWidth: "260px",
      }).setHTML(`
        <div style="font-family: system-ui; padding: 4px 0;">
          <p style="margin:0 0 4px;font-weight:600;font-size:13px;color:#1a1a2e;">${s.title.slice(0, 80)}</p>
          <p style="margin:0;font-size:11px;color:#555;">
            ${s.location} · ${s.type} · ${s.source}
          </p>
        </div>
      `);

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([s.lon, s.lat])
        .setPopup(popup)
        .addTo(map);

      el.addEventListener("click", () => handleMarkerClick(s.id));

      currentMarkers.set(s.id, marker);
    }
  }, [sightings, selectedId, handleMarkerClick]);

  // Fly to selected sighting
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedId) return;

    const s = sightings.find((s) => s.id === selectedId);
    if (!s) return;

    map.flyTo({ center: [s.lon, s.lat], zoom: 8, duration: 1200 });

    const marker = markersRef.current.get(selectedId);
    if (marker) marker.togglePopup();
  }, [selectedId, sightings]);

  return <div ref={containerRef} className="h-full w-full" />;
}
