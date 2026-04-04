"use client";

import { useEffect, useRef } from "react";
import { Sighting } from "@/lib/types";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

interface Props {
  sightings: Sighting[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export default function SharkMap({ sightings, selectedId, onSelect }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const readyRef = useRef(false);
  const pendingSightings = useRef<Sighting[]>([]);

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (!e.data?.type) return;

      if (e.data.type === "map-ready") {
        readyRef.current = true;
        iframeRef.current?.contentWindow?.postMessage(
          { type: "init", token: MAPBOX_TOKEN }, "*"
        );
        if (pendingSightings.current.length > 0) {
          iframeRef.current?.contentWindow?.postMessage(
            { type: "sightings", sightings: pendingSightings.current }, "*"
          );
        }
      }

      if (e.data.type === "marker-click") {
        onSelect(e.data.id);
      }
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [onSelect]);

  useEffect(() => {
    if (!readyRef.current) {
      pendingSightings.current = sightings;
      return;
    }
    iframeRef.current?.contentWindow?.postMessage(
      { type: "sightings", sightings }, "*"
    );
  }, [sightings]);

  useEffect(() => {
    if (!selectedId || !readyRef.current) return;
    iframeRef.current?.contentWindow?.postMessage(
      { type: "flyTo", id: selectedId, sightings }, "*"
    );
  }, [selectedId, sightings]);

  return (
    <iframe
      ref={iframeRef}
      src="/map.html"
      className="h-full w-full border-0"
      title="Shark sighting map"
      allow="geolocation"
    />
  );
}
