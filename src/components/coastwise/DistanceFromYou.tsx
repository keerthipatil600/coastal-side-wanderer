import { useServerFn } from "@tanstack/react-start";
import { Compass, Loader2, Navigation } from "lucide-react";
import { useState } from "react";

import { ConfidenceTag } from "@/components/coastwise/ConfidenceTag";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { directionsLink } from "@/lib/coastwise/booking";
import { getDistancesFromHere, type DistanceRow } from "@/lib/coastwise/maps.functions";
import type { MapPoint } from "@/lib/coastwise/types";

/**
 * Shows real driving distance + time from the traveller's current location to
 * every stop in the plan. Location is only read after an explicit tap.
 */
export function DistanceFromYou({ points }: { points: MapPoint[] }) {
  const run = useServerFn(getDistancesFromHere);
  const [rows, setRows] = useState<DistanceRow[] | null>(null);
  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const bounded = points.slice(0, 15);

  const locate = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setNote("This device does not support location sharing.");
      return;
    }
    setBusy(true);
    setNote(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const here = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setOrigin(here);
        try {
          const result = await run({
            data: {
              origin: here,
              destinations: bounded.map((p) => ({ name: p.name, lat: p.lat, lng: p.lng })),
            },
          });
          setRows(result.rows);
          setNote(result.message ?? null);
        } catch {
          setNote("Could not fetch distances right now.");
        } finally {
          setBusy(false);
        }
      },
      () => {
        setBusy(false);
        setNote("Location permission was declined, so distances from you are unavailable.");
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  };

  if (bounded.length === 0) return null;

  return (
    <Card className="rounded-3xl border-border/70">
      <CardHeader className="space-y-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="font-display text-xl">Distance from where you are</CardTitle>
          <Button size="sm" className="rounded-full" onClick={locate} disabled={busy}>
            {busy ? (
              <Loader2 className="mr-1 size-3 animate-spin" />
            ) : (
              <Compass className="mr-1 size-3" />
            )}
            {rows ? "Refresh" : "Use my location"}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Real driving distance and time from your current location to every stop on this trip.
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows ? (
          <div className="divide-y divide-border/60">
            {rows.map((r, i) => {
              const point = bounded[i];
              return (
                <div
                  key={`${r.name}-${i}`}
                  className="flex flex-wrap items-center gap-2 py-2.5 text-sm"
                >
                  <span className="font-medium">{r.name}</span>
                  {point ? (
                    <span className="text-xs text-muted-foreground">{point.town}</span>
                  ) : null}
                  <span className="text-muted-foreground">
                    {r.distanceKm !== null
                      ? `${r.distanceKm} km · ${Math.floor((r.durationMin ?? 0) / 60)}h ${
                          (r.durationMin ?? 0) % 60
                        }m drive`
                      : "distance unavailable"}
                  </span>
                  <ConfidenceTag confidence={r.confidence} />
                  {point && origin ? (
                    <Button asChild size="sm" variant="outline" className="ml-auto rounded-full">
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${point.lat},${point.lng}&travelmode=driving`}
                        target="_blank"
                        rel="noreferrer noopener"
                      >
                        <Navigation className="mr-1 size-3" /> Directions
                      </a>
                    </Button>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Tap “Use my location” to see how far each stop is from you right now. Your location is
            used only for this lookup and never stored.
          </p>
        )}
        {note ? <p className="text-xs text-muted-foreground">{note}</p> : null}
        <p className="text-xs text-muted-foreground">
          Or open the whole route:{" "}
          <a
            className="underline"
            href={directionsLink(bounded)}
            target="_blank"
            rel="noreferrer noopener"
          >
            full trip in Google Maps
          </a>
          .
        </p>
      </CardContent>
    </Card>
  );
}
