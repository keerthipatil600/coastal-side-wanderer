import { createFileRoute } from "@tanstack/react-router";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How CoastWise AI works — RAG, vector search & route optimisation" },
      {
        name: "description",
        content:
          "The CoastWise pipeline: query processing, RAG retrieval over a curated Coastal Karnataka knowledge base, vector search, rule-based ranking, budget and route optimisation, then LLM narrative.",
      },
      { property: "og:title", content: "How CoastWise AI works" },
      {
        property: "og:description",
        content:
          "Inside the retrieval-augmented Coastal Karnataka trip planner: embeddings, pgvector, rule-based ranking and budget optimisation.",
      },
    ],
  }),
  component: HowItWorks,
});

const steps = [
  {
    title: "1 · User input",
    body: "Origin, destinations, days, people, budget, dates, style, interests, diet, transport, hotel preference and activity intensity are captured as one typed request object.",
  },
  {
    title: "2 · Query processing",
    body: "The request is turned into a retrieval query and a set of hard filters (diet, style, intensity, towns) plus soft scoring weights.",
  },
  {
    title: "3 · RAG retrieval",
    body: "Curated notes are embedded and searched in Postgres with pgvector using cosine similarity; when embeddings are unavailable a keyword fallback keeps the demo working.",
  },
  {
    title: "4 · Knowledge base",
    body: "Places, beaches, temples, stays, restaurants, cuisine, activities and transport legs — each row keeps a source reference and an Approximate / Live / Unavailable confidence label.",
  },
  {
    title: "5 · Rule-based ranking",
    body: "Deterministic scoring on interest overlap, diet match, price fit to travel style, activity intensity, hidden-gem bonus and an aggregated feedback signal.",
  },
  {
    title: "6 · Route & budget optimisation",
    body: "A nearest-neighbour pass over coastal coordinates orders towns to avoid backtracking; the budget optimiser fits transport, stays, food, activities, entry fees and misc to the total and proposes cheaper swaps when it overruns.",
  },
  {
    title: "7 · LLM narrative",
    body: "The model writes only the titles, taglines, day headlines and notes over the already-selected records. It is instructed to use retrieved knowledge and never invent prices, ratings or schedules.",
  },
  {
    title: "8 · Feedback loop",
    body: "Ratings and per-category feedback are stored and used as a controlled ranking signal for future recommendations — never as automatic model retraining.",
  },
];

export default function noop() {}

function HowItWorks() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-4xl font-semibold tracking-tight">How it works</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        CoastWise is a retrieval-augmented planner. The knowledge comes from a curated Coastal
        Karnataka dataset; the language model only writes the wording around it.
      </p>

      <Card className="mt-8 overflow-x-auto rounded-3xl border-border/70">
        <CardHeader>
          <CardTitle className="font-display text-xl">Architecture</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="min-w-[640px] whitespace-pre text-[11px] leading-5 text-muted-foreground sm:text-xs">
{`  ┌──────────────┐    ┌────────────────┐    ┌──────────────────┐
  │  User input   │ →  │ Query process   │ →  │  RAG retrieval    │
  └──────────────┘    └────────────────┘    └────────┬─────────┘
                                                      │
                          ┌───────────────────────────▼──────────────┐
                          │  Coastal Karnataka knowledge base         │
                          │  places · stays · food · activities ·     │
                          │  transport · curated notes (+ sources)    │
                          └───────────────┬──────────────────────────┘
                                          │  pgvector cosine search
                          ┌───────────────▼──────────────┐
                          │  Rule-based ranking           │
                          │  interests · diet · style ·   │
                          │  intensity · feedback signal  │
                          └───────────────┬──────────────┘
                                          │
                     ┌────────────────────▼─────────────────────┐
                     │  Route optimisation + budget optimisation │
                     └────────────────────┬─────────────────────┘
                                          │
                              ┌───────────▼───────────┐
                              │  LLM narrative layer   │
                              └───────────┬───────────┘
                                          │
                        ┌─────────────────▼──────────────────┐
                        │  Personalised itinerary → feedback  │
                        │  feedback → ranking signal (loop)   │
                        └────────────────────────────────────┘`}
          </pre>
        </CardContent>
      </Card>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {steps.map((s) => (
          <Card key={s.title} className="rounded-3xl border-border/70">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-lg">{s.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{s.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-8 rounded-3xl border-border/70 bg-secondary/40">
        <CardHeader>
          <CardTitle className="font-display text-xl">What we never fake</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Hotel prices, ratings, transport schedules, opening hours and ticket availability are
            never invented. Anything not verified live is labelled Approximate, and unavailable data
            is labelled Unavailable.
          </p>
          <p>
            The architecture is modular so real Maps, Weather, Bus, Flight, Hotel and Restaurant
            APIs can replace the approximate layers later.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
