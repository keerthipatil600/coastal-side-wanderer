import { useEffect, useMemo, useRef, useState } from "react";

import type { MapPoint } from "@/lib/coastwise/types";

declare global {
  interface Window {
    google?: any;
    __coastwiseMapReady?: () => void;
  }
}

let loaderPromise: Promise<void> | null = null;

function loadMaps(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.google?.maps?.Map) return Promise.resolve();
  if (loaderPromise) return loaderPromise;

  const key = import.meta.env['VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY'] as
    | string
    | undefined;
  const channel = import.meta.env['VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID'] as
    | string
    | undefined;
  if (!key) return Promise.reject(new Error("Maps key missing"));

  loaderPromise = new Promise<void>((resolve, reject) => {
    window.__coastwiseMapReady = () => resolve();
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&loading=async&libraries=geometry&callback=__coastwiseMapReady${
      channel ? `&channel=${channel}` : ""
    }`;
    script.async = true;
    script.onerror = () => reject(new Error("Maps failed to load"));
    document.head.appendChild(script);
  });
  return loaderPromise;
}

export function TripMap({
  points,
  polyline,
  onSelect,
  className,
}: {
  points: MapPoint[];
  polyline?: string | null;
  onSelect?: (point: MapPoint) => void;
  className?: string;
}) {
  const container = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const overlays = useRef<any[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signature = useMemo(
    () => points.map((p) => `${p.name}:${p.lat},${p.lng}`).join("|") + `#${polyline ?? ""}`,
    [points, polyline],
  );

  useEffect(() => {
    let cancelled = false;
    loadMaps()
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready || !container.current || points.length === 0) return;
    const g = window.google!.maps;

    if (!mapRef.current) {
      mapRef.current = new g.Map(container.current, {
        center: { lat: points[0]!.lat, lng: points[0]!.lng },
        zoom: 9,
        clickableIcons: false,
        mapTypeControl: false,
        streetViewControl: false,
        styles: [{ featureType: "poi", stylers: [{ visibility: "off" }] }],
      });
    }
    const map = mapRef.current;

    overlays.current.forEach((o) => o.setMap(null));
    overlays.current = [];

    const bounds = new g.LatLngBounds();
    points.forEach((p, i) => {
      const marker = new g.Marker({
        position: { lat: p.lat, lng: p.lng },
        map,
        title: `${p.name} · ${p.town}`,
        label: points.length > 1 ? String(i + 1) : undefined,
      });
      marker.addListener("click", () => onSelect?.(p));
      overlays.current.push(marker);
      bounds.extend({ lat: p.lat, lng: p.lng });
    });

    const path = polyline
      ? g.geometry.encoding.decodePath(polyline)
      : points.map((p) => new g.LatLng(p.lat, p.lng));
    const line = new g.Polyline({
      path,
      map,
      strokeColor: "#1b6f8c",
      strokeOpacity: polyline ? 0.9 : 0.5,
      strokeWeight: 4,
      ...(polyline ? {} : { strokeOpacity: 0, icons: [{ icon: { path: "M 0,-1 0,1", strokeOpacity: 0.6, scale: 3 }, offset: "0", repeat: "12px" }] }),
    });
    overlays.current.push(line);
    path.forEach((p: any) => bounds.extend(p));

    map.fitBounds(bounds, 48);
  }, [ready, signature, onSelect, points, polyline]);

  if (error) {
    return (
      <div className={`flex items-center justify-center rounded-3xl border border-dashed border-border p-6 text-sm text-muted-foreground ${className ?? "h-72"}`}>
        Map unavailable right now — the itinerary, distances and booking links still work.
      </div>
    );
  }

  return <div ref={container} className={`w-full overflow-hidden rounded-3xl ${className ?? "h-72"}`} />;
}
