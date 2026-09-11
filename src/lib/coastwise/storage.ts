/** Local (offline-first) persistence for trips, favourites and feedback. */
import type { PlanResult } from "./types";

const TRIPS = "coastwise.trips";
const FAVS = "coastwise.favorites";
const FEEDBACK = "coastwise.feedback";

export interface SavedTrip {
  id: string;
  title: string;
  savedAt: string;
  offline: boolean;
  plan: PlanResult;
}

export interface FeedbackEntry {
  id: string;
  tripId: string;
  createdAt: string;
  overallRating: number;
  usefulness: "yes" | "partially" | "no";
  destination: string;
  hotel: string;
  restaurant: string;
  activity: string;
  itinerary: string;
  comments: string;
}

function read<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(key) ?? "[]") as T[];
  } catch {
    return [];
  }
}

function write<T>(key: string, value: T[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function listTrips(): SavedTrip[] {
  return read<SavedTrip>(TRIPS);
}

export function saveTrip(plan: PlanResult, offline: boolean): SavedTrip {
  const trips = listTrips();
  const trip: SavedTrip = {
    id: crypto.randomUUID(),
    title: plan.itinerary.title,
    savedAt: new Date().toISOString(),
    offline,
    plan,
  };
  write(TRIPS, [trip, ...trips].slice(0, 40));
  return trip;
}

export function deleteTrip(id: string) {
  write(
    TRIPS,
    listTrips().filter((t) => t.id !== id),
  );
}

export function listFavorites(): { id: string; label: string; kind: string }[] {
  return read(FAVS);
}

export function toggleFavorite(label: string, kind: string) {
  const favs = listFavorites();
  const existing = favs.find((f) => f.label === label && f.kind === kind);
  if (existing) {
    write(
      FAVS,
      favs.filter((f) => f !== existing),
    );
    return false;
  }
  write(FAVS, [{ id: crypto.randomUUID(), label, kind }, ...favs]);
  return true;
}

export function listFeedback(): FeedbackEntry[] {
  return read<FeedbackEntry>(FEEDBACK);
}

export function addFeedback(entry: Omit<FeedbackEntry, "id" | "createdAt">) {
  write(FEEDBACK, [
    { ...entry, id: crypto.randomUUID(), createdAt: new Date().toISOString() },
    ...listFeedback(),
  ]);
}
