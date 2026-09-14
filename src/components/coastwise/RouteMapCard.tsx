import { useServerFn } from "@tanstack/react-start";
import { ExternalLink, Loader2, Navigation } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { TripMap } from "@/components/coastwise/TripMap";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { directionsLink } from "@/lib/coastwise/booking";
import { getRoute, type RouteResult } from "@/lib/coastwise/maps.functions";
import type { MapPoint } from "@/lib/coastwise/types";

export function RouteMapCard({
  title,
  subtitle,
  points,
  height = "h-80",
}: {
  title: string;
  subtitle?: string;
  points: MapPoint[];
  height?: string;
}) {
  const run = useServerFn(getRoute);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [loading, setLoading] = useState(false);

  const bounded = useMemo(() => points.slice(0, 10), [points]);
  const key = bounded.map((p) => `${p.lat},${p.lng}`).join("|");

  useEffect(() => {
    if (bounded.length < 2) return;
    let cancelled = false;
    setLoading(true);
    run({ data: { points: bounded.map((p) => ({ lat: p.lat, lng: p.lng })) } })
      .then((r) => {
        if (!cancelled) setRoute(r);
      })
      .catch(() => {
        if (!cancelled) setRoute(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (bounded.length === 0) return null;

  return (
    <Card className="rounded-3xl border-border/70">
      <CardHeader className="space-y-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="font-display text-xl">{title}</CardTitle>
          <div className="flex items-center gap-2">
            {loading ? (
              <Badge variant="secondary" className="rounded-full">
                <Loader2 className="mr-1 size-3 animate-spin" /> Routing
              </Badge>
            ) : route?.confidence === "live" && route.distanceKm ? (
              <Badge className="rounded-full">
                Live route · {route.distanceKm} km ·{" "}
                {Math.floor((route.durationMin ?? 0) / 60)}h {(route.durationMin ?? 0) % 60}m
              </Badge>
            ) : (
              <Badge variant="outline" className="rounded-full">
                Straight-line preview
              </Badge>
            )}
            <Button asChild size="sm" variant="outline" className="rounded-full">
              <a href={directionsLink(bounded)} target="_blank" rel="noreferrer noopener">
                <Navigation className="mr-1 size-3" /> Open in Maps
              </a>
            </Button>
          </div>
        </div>
        {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
      </CardHeader>
      <CardContent className="space-y-3">
        <TripMap points={bounded} polyline={route?.encodedPolyline ?? null} className={height} />
        <div className="flex flex-wrap gap-2">
          {bounded.map((p, i) => (
            <Button
              key={`${p.name}-${i}`}
              asChild
              size="sm"
              variant="secondary"
              className="rounded-full"
            >
              <a href={directionsLink([p])} target="_blank" rel="noreferrer noopener">
                {i + 1}. {p.name}
                <ExternalLink className="ml-1 size-3" />
              </a>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
