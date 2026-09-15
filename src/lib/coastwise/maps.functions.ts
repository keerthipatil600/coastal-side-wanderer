import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const pointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

const routeSchema = z.object({
  points: z.array(pointSchema).min(2).max(10),
});

export interface RouteResult {
  encodedPolyline: string | null;
  distanceKm: number | null;
  durationMin: number | null;
  legs: { distanceKm: number; durationMin: number }[];
  confidence: "live" | "unavailable";
  message?: string;
}

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";

/**
 * Real driving route for an ordered list of stops, via the Google Routes API.
 * Bounded to 10 stops per call to keep Maps usage predictable.
 */
export const getRoute = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => routeSchema.parse(data))
  .handler(async ({ data }): Promise<RouteResult> => {
    const lovableKey = process.env["LOVABLE_API_KEY"];
    const mapsKey = process.env["GOOGLE_MAPS_API_KEY"];
    const empty: RouteResult = {
      encodedPolyline: null,
      distanceKm: null,
      durationMin: null,
      legs: [],
      confidence: "unavailable",
    };
    if (!lovableKey || !mapsKey) {
      return { ...empty, message: "Map routing is not connected yet." };
    }

    const points = data.points;
    const origin = points[0]!;
    const destination = points[points.length - 1]!;
    const intermediates = points.slice(1, -1);

    try {
      const response = await fetch(`${GATEWAY_URL}/routes/directions/v2:computeRoutes`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableKey}`,
          "X-Connection-Api-Key": mapsKey,
          "Content-Type": "application/json",
          "X-Goog-FieldMask":
            "routes.polyline.encodedPolyline,routes.distanceMeters,routes.duration,routes.legs.distanceMeters,routes.legs.duration",
        },
        body: JSON.stringify({
          origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
          destination: {
            location: { latLng: { latitude: destination.lat, longitude: destination.lng } },
          },
          intermediates: intermediates.map((p) => ({
            location: { latLng: { latitude: p.lat, longitude: p.lng } },
          })),
          travelMode: "DRIVE",
          routingPreference: "TRAFFIC_UNAWARE",
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        console.error(`Routes API failed [${response.status}]: ${body}`);
        return { ...empty, message: "Live routing is unavailable right now." };
      }

      const json = (await response.json()) as {
        routes?: {
          polyline?: { encodedPolyline?: string };
          distanceMeters?: number;
          duration?: string;
          legs?: { distanceMeters?: number; duration?: string }[];
        }[];
      };
      const route = json.routes?.[0];
      if (!route) return { ...empty, message: "No driving route found for these stops." };

      const secs = (v?: string) => (v ? Number.parseInt(v.replace("s", ""), 10) || 0 : 0);

      return {
        encodedPolyline: route.polyline?.encodedPolyline ?? null,
        distanceKm: route.distanceMeters ? Math.round(route.distanceMeters / 100) / 10 : null,
        durationMin: Math.round(secs(route.duration) / 60),
        legs: (route.legs ?? []).map((l) => ({
          distanceKm: Math.round((l.distanceMeters ?? 0) / 100) / 10,
          durationMin: Math.round(secs(l.duration) / 60),
        })),
        confidence: "live",
      };
    } catch (error) {
      console.error("Routes API error", error);
      return { ...empty, message: "Live routing is unavailable right now." };
    }
  });

const matrixSchema = z.object({
  origin: pointSchema,
  destinations: z.array(pointSchema.extend({ name: z.string().max(120) })).min(1).max(15),
});

export interface DistanceRow {
  name: string;
  distanceKm: number | null;
  durationMin: number | null;
  confidence: "live" | "unavailable";
}

export interface DistanceMatrixResult {
  rows: DistanceRow[];
  message?: string;
}

/**
 * Driving distance + time from the traveller's current location to each stop,
 * via the Google Routes distance-matrix API. Bounded to 15 stops per call.
 */
export const getDistancesFromHere = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => matrixSchema.parse(data))
  .handler(async ({ data }): Promise<DistanceMatrixResult> => {
    const lovableKey = process.env["LOVABLE_API_KEY"];
    const mapsKey = process.env["GOOGLE_MAPS_API_KEY"];
    const fallback = (message: string): DistanceMatrixResult => ({
      rows: data.destinations.map((d) => ({
        name: d.name,
        distanceKm: null,
        durationMin: null,
        confidence: "unavailable" as const,
      })),
      message,
    });
    if (!lovableKey || !mapsKey) return fallback("Map routing is not connected yet.");

    try {
      const response = await fetch(`${GATEWAY_URL}/routes/distanceMatrix/v2:computeRouteMatrix`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableKey}`,
          "X-Connection-Api-Key": mapsKey,
          "Content-Type": "application/json",
          "X-Goog-FieldMask":
            "originIndex,destinationIndex,distanceMeters,duration,condition",
        },
        body: JSON.stringify({
          origins: [
            {
              waypoint: {
                location: {
                  latLng: { latitude: data.origin.lat, longitude: data.origin.lng },
                },
              },
            },
          ],
          destinations: data.destinations.map((d) => ({
            waypoint: { location: { latLng: { latitude: d.lat, longitude: d.lng } } },
          })),
          travelMode: "DRIVE",
          routingPreference: "TRAFFIC_UNAWARE",
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        console.error(`Route matrix failed [${response.status}]: ${body}`);
        return fallback("Live distances are unavailable right now.");
      }

      const json = (await response.json()) as {
        destinationIndex?: number;
        distanceMeters?: number;
        duration?: string;
        condition?: string;
      }[];

      const rows: DistanceRow[] = data.destinations.map((d) => ({
        name: d.name,
        distanceKm: null,
        durationMin: null,
        confidence: "unavailable" as const,
      }));

      for (const element of Array.isArray(json) ? json : []) {
        const i = element.destinationIndex ?? -1;
        const row = rows[i];
        if (!row || element.condition === "ROUTE_NOT_FOUND") continue;
        row.distanceKm = element.distanceMeters
          ? Math.round(element.distanceMeters / 100) / 10
          : null;
        row.durationMin = element.duration
          ? Math.round((Number.parseInt(element.duration.replace("s", ""), 10) || 0) / 60)
          : null;
        row.confidence = row.distanceKm === null ? "unavailable" : "live";
      }

      return { rows };
    } catch (error) {
      console.error("Route matrix error", error);
      return fallback("Live distances are unavailable right now.");
    }
  });
