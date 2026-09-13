import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Compass,
  Database,
  MapPinned,
  Sparkle,
  WalletMinimal,
  WifiOff,
} from "lucide-react";

import heroImage from "@/assets/coast-hero.jpg";
import { Button } from "@/components/ui/button";
import { COAST_TOWNS } from "@/lib/coastwise/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CoastWise AI — Explore Coastal Karnataka without the planning headache" },
      {
        name: "description",
        content:
          "Plan Udupi, Mangaluru, Gokarna and Karwar trips in minutes. Day-by-day itineraries, honest budgets, local food and stays from a curated coastal knowledge base.",
      },
      {
        property: "og:title",
        content: "CoastWise AI — Explore Coastal Karnataka without the planning headache",
      },
      {
        property: "og:description",
        content:
          "AI itineraries for Coastal Karnataka with route optimisation, budget fitting and clearly labelled approximate costs.",
      },
    ],
  }),
  component: Index,
});

const pillars = [
  {
    icon: Database,
    title: "Grounded in real records",
    body: "Every place, stay, restaurant and activity comes from a curated Coastal Karnataka dataset with a source attached — the AI writes the words, not the facts.",
  },
  {
    icon: MapPinned,
    title: "Route built to flow",
    body: "Towns are ordered along the coast so you never double back, with Places on the Way for stops that need barely any detour.",
  },
  {
    icon: WalletMinimal,
    title: "Budget you can trust",
    body: "Transport, stays, food, activities and entry fees add up to a total, per person and per day — with cheaper swaps if you go over.",
  },
  {
    icon: WifiOff,
    title: "Works offline",
    body: "Save a trip for offline and keep the itinerary, places, food and costs on your phone. Live prices and weather still need internet.",
  },
];

function Index() {
  return (
    <main>
      <section className="relative isolate overflow-hidden">
        <img
          src={heroImage}
          alt="Golden-hour view of a Coastal Karnataka beach with fishing boats and palm trees"
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/80 to-background/40" />
        <div className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
          <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground backdrop-blur">
            <Sparkle className="size-3.5" /> Less planning. More exploring.
          </span>
          <h1 className="mt-6 max-w-3xl font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
            Explore Coastal Karnataka.
            <span className="block text-primary">Without the planning headache.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
            Tell CoastWise your days, budget and what you love. It builds a day-by-day coastal
            itinerary with beaches, temples, seafood, stays, travel legs and honest costs.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="rounded-full px-7 text-sm font-semibold uppercase tracking-wide">
              <Link to="/plan">Plan my trip</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full px-7">
              <Link to="/how-it-works">How it works</Link>
            </Button>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            Demo ready: Bengaluru → Udupi + Mangaluru · 3 days · 2 people · ₹10,000
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="font-display text-3xl font-semibold tracking-tight">
          Built for the Karnataka coast, not for everywhere
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {pillars.map((p) => (
            <article
              key={p.title}
              className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <span className="flex size-10 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
                <p.icon className="size-5" />
              </span>
              <h3 className="mt-4 font-display text-xl font-semibold">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="rounded-4xl border border-border/70 bg-sand p-8 text-sand-foreground sm:p-12">
          <h2 className="font-display text-3xl font-semibold tracking-tight">
            Towns and shorelines we cover
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            From Someshwara in the south to Karwar in the north, plus St. Mary's Island, Yana and
            the beaches in between.
          </p>
          <ul className="mt-6 flex flex-wrap gap-2">
            {COAST_TOWNS.map((town) => (
              <li
                key={town}
                className="rounded-full border border-border/70 bg-card px-3 py-1.5 text-sm font-medium"
              >
                {town}
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <Button asChild className="rounded-full">
              <Link to="/plan">
                <Compass className="mr-2 size-4" /> Start planning
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
