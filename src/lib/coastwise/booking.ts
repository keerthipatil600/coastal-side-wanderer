/**
 * Booking deep links. CoastWise never claims live availability — these links
 * hand the user to the operator's own official site with the route and date
 * pre-filled where the site supports it.
 */

const slug = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function ddMonYyyy(date?: string) {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${String(d.getDate()).padStart(2, "0")}-${months[d.getMonth()]}-${d.getFullYear()}`;
}

export type BookingKind = "bus" | "train" | "flight" | "taxi" | "stay";

export function bookingLink(
  kind: BookingKind,
  from: string,
  to: string,
  date?: string,
): { url: string; provider: string } {
  const onward = ddMonYyyy(date);
  switch (kind) {
    case "bus":
      return {
        provider: "redBus",
        url: `https://www.redbus.in/bus-tickets/${slug(from)}-to-${slug(to)}?fromCityName=${encodeURIComponent(
          from,
        )}&toCityName=${encodeURIComponent(to)}${onward ? `&onward=${encodeURIComponent(onward)}` : ""}`,
      };
    case "train":
      return {
        provider: "IRCTC",
        url: `https://www.irctc.co.in/nget/train-search?fromStation=${encodeURIComponent(
          from,
        )}&toStation=${encodeURIComponent(to)}`,
      };
    case "flight":
      return {
        provider: "Google Flights",
        url: `https://www.google.com/travel/flights?q=${encodeURIComponent(
          `Flights from ${from} to ${to}${date ? ` on ${date}` : ""}`,
        )}`,
      };
    case "taxi":
      return {
        provider: "Operator search",
        url: `https://www.google.com/search?q=${encodeURIComponent(
          `taxi or self drive rental ${from} to ${to} booking`,
        )}`,
      };
    case "stay":
    default:
      return {
        provider: "Google Hotels",
        url: `https://www.google.com/travel/hotels/${encodeURIComponent(to)}`,
      };
  }
}

/** Google Maps directions link for a single place or a full day route. */
export function directionsLink(points: { name?: string; lat: number; lng: number }[]) {
  if (points.length === 0) return "https://www.google.com/maps";
  if (points.length === 1) {
    const p = points[0]!;
    return `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`;
  }
  const origin = points[0]!;
  const destination = points[points.length - 1]!;
  const waypoints = points
    .slice(1, -1)
    .map((p) => `${p.lat},${p.lng}`)
    .join("|");
  return `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${
    destination.lat
  },${destination.lng}${waypoints ? `&waypoints=${encodeURIComponent(waypoints)}` : ""}&travelmode=driving`;
}
