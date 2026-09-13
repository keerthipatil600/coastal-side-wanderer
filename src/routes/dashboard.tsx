import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Plus, Star, Trash2, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  addFeedback,
  deleteTrip,
  listFavorites,
  listFeedback,
  listTrips,
  type FeedbackEntry,
  type SavedTrip,
} from "@/lib/coastwise/storage";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "My trips — CoastWise AI" },
      {
        name: "description",
        content:
          "Your saved Coastal Karnataka itineraries, offline trips, favourites, past trips and trip feedback in one place.",
      },
      { property: "og:title", content: "My trips — CoastWise AI" },
      {
        property: "og:description",
        content: "Saved and offline Coastal Karnataka itineraries, favourites and feedback.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const [trips, setTrips] = useState<SavedTrip[]>([]);
  const [favorites, setFavorites] = useState<{ id: string; label: string; kind: string }[]>([]);
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);

  useEffect(() => {
    setTrips(listTrips());
    setFavorites(listFavorites());
    setFeedback(listFeedback());
  }, []);

  const now = Date.now();
  const offlineTrips = trips.filter((t) => t.offline);
  const pastTrips = trips.filter((t) => {
    const start = t.plan.input.startDate ? Date.parse(t.plan.input.startDate) : NaN;
    return Number.isFinite(start) && start + t.plan.input.days * 86400000 < now;
  });

  const remove = (id: string) => {
    deleteTrip(id);
    setTrips(listTrips());
    toast.success("Trip removed");
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-semibold tracking-tight">My trips</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Everything saved on this device. Offline trips keep the itinerary, places, stays, food
            and estimated costs — live prices, weather, traffic and ticket availability need
            internet.
          </p>
        </div>
        <Button asChild className="rounded-full">
          <Link to="/plan">
            <Plus className="mr-2 size-4" /> Plan new trip
          </Link>
        </Button>
      </header>

      <Tabs defaultValue="saved">
        <TabsList className="flex-wrap">
          <TabsTrigger value="saved">Saved ({trips.length})</TabsTrigger>
          <TabsTrigger value="offline">Offline ({offlineTrips.length})</TabsTrigger>
          <TabsTrigger value="favorites">Favourites ({favorites.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({pastTrips.length})</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>

        <TabsContent value="saved" className="mt-6">
          <TripList trips={trips} onDelete={remove} />
        </TabsContent>
        <TabsContent value="offline" className="mt-6">
          <TripList trips={offlineTrips} onDelete={remove} />
        </TabsContent>
        <TabsContent value="past" className="mt-6">
          <TripList trips={pastTrips} onDelete={remove} />
        </TabsContent>

        <TabsContent value="favorites" className="mt-6">
          {favorites.length === 0 ? (
            <EmptyState text="No favourites yet. Tap the heart on any place, stay or restaurant in an itinerary." />
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {favorites.map((f) => (
                <li
                  key={f.id}
                  className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-4"
                >
                  <Heart className="size-4 text-primary" />
                  <div>
                    <p className="text-sm font-semibold">{f.label}</p>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{f.kind}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="feedback" className="mt-6">
          <FeedbackSection
            trips={trips}
            entries={feedback}
            onSubmitted={() => setFeedback(listFeedback())}
          />
        </TabsContent>
      </Tabs>
    </main>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function TripList({ trips, onDelete }: { trips: SavedTrip[]; onDelete: (id: string) => void }) {
  if (trips.length === 0) {
    return <EmptyState text="Nothing here yet. Generate an itinerary and save it." />;
  }
  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {trips.map((t) => (
        <li key={t.id} className="rounded-3xl border border-border/70 bg-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold">{t.title}</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Saved {new Date(t.savedAt).toLocaleDateString()} ·{" "}
                {t.plan.input.destinations.join(", ")} · {t.plan.input.days} days ·{" "}
                {t.plan.input.people} people
              </p>
            </div>
            <Button variant="ghost" size="icon" aria-label="Delete trip" onClick={() => onDelete(t.id)}>
              <Trash2 className="size-4" />
            </Button>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{t.plan.itinerary.summary}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-secondary px-3 py-1 font-semibold text-secondary-foreground">
              ₹{t.plan.budget.totalInr.toLocaleString("en-IN")} total
            </span>
            <span className="rounded-full border border-border px-3 py-1">
              ₹{t.plan.budget.perPersonInr.toLocaleString("en-IN")} / person
            </span>
            {t.offline ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1">
                <WifiOff className="size-3" /> Offline
              </span>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

const usefulOptions = ["yes", "partially", "no"] as const;

function FeedbackSection({
  trips,
  entries,
  onSubmitted,
}: {
  trips: SavedTrip[];
  entries: FeedbackEntry[];
  onSubmitted: () => void;
}) {
  const [rating, setRating] = useState(4);
  const [useful, setUseful] = useState<(typeof usefulOptions)[number]>("yes");
  const [fields, setFields] = useState({
    destination: "",
    hotel: "",
    restaurant: "",
    activity: "",
    itinerary: "",
    comments: "",
  });
  const tripId = trips[0]?.id ?? "";

  const submit = () => {
    addFeedback({
      tripId,
      overallRating: rating,
      usefulness: useful,
      ...fields,
    });
    setFields({
      destination: "",
      hotel: "",
      restaurant: "",
      activity: "",
      itinerary: "",
      comments: "",
    });
    onSubmitted();
    toast.success("Thanks — your feedback will nudge future recommendations.");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="rounded-3xl border border-border/70 bg-card p-6">
        <h2 className="font-display text-xl font-semibold">How was the trip?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Feedback is used as a controlled ranking signal for recommendations — never to
          automatically retrain the model.
        </p>

        <div className="mt-5 space-y-5">
          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Overall rating
            </Label>
            <div className="mt-2 flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-label={`${n} star${n > 1 ? "s" : ""}`}
                  onClick={() => setRating(n)}
                  className="rounded-full p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={
                      n <= rating ? "size-6 fill-primary text-primary" : "size-6 text-muted-foreground"
                    }
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Was this itinerary useful?
            </Label>
            <div className="mt-2 flex gap-2">
              {usefulOptions.map((o) => (
                <Button
                  key={o}
                  type="button"
                  size="sm"
                  variant={useful === o ? "default" : "outline"}
                  className="rounded-full capitalize"
                  onClick={() => setUseful(o)}
                >
                  {o}
                </Button>
              ))}
            </div>
          </div>

          {(
            [
              ["destination", "Destinations"],
              ["hotel", "Stay"],
              ["restaurant", "Restaurants"],
              ["activity", "Activities"],
              ["itinerary", "Itinerary flow"],
              ["comments", "Anything else"],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <Label htmlFor={`fb-${key}`}>{label}</Label>
              <Textarea
                id={`fb-${key}`}
                rows={2}
                className="mt-1.5"
                value={fields[key]}
                onChange={(e) => setFields((f) => ({ ...f, [key]: e.target.value }))}
              />
            </div>
          ))}

          <Button className="rounded-full" onClick={submit}>
            Submit feedback
          </Button>
        </div>
      </div>

      <div className="rounded-3xl border border-border/70 bg-card p-6">
        <h3 className="font-display text-lg font-semibold">Your past feedback</h3>
        {entries.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Nothing submitted yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {entries.map((e) => (
              <li key={e.id} className="rounded-2xl border border-border/60 p-3 text-sm">
                <p className="font-semibold">
                  {e.overallRating}/5 · useful: {e.usefulness}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(e.createdAt).toLocaleString()}
                </p>
                {e.comments ? <p className="mt-2 text-muted-foreground">{e.comments}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
