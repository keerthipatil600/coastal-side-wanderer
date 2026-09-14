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
