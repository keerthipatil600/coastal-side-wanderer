import { Bus, Clock, Coffee, MapPin, Route as RouteIcon, Sparkles, Utensils, Waves } from "lucide-react";

import { ConfidenceTag } from "@/components/coastwise/ConfidenceTag";
import { inr } from "@/components/coastwise/BudgetPanel";
import { RouteMapCard } from "@/components/coastwise/RouteMapCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { bookingLink } from "@/lib/coastwise/booking";
import type { MapPoint, PlanResult } from "@/lib/coastwise/types";

export function ItineraryView({ plan }: { plan: PlanResult }) {
  const { itinerary } = plan;
  const firstStop = itinerary.routeOrder[0] ?? plan.input.destinations[0] ?? "Udupi";
  const dayPoints = (day: PlanResult["itinerary"]["days"][number]): MapPoint[] =>
    day.blocks
      .filter((b) => Number.isFinite(b.lat) && Number.isFinite(b.lng))
      .map((b) => ({ name: b.title, town: b.town, lat: b.lat, lng: b.lng }));

  return (
    <div className="space-y-6">
      <Card className="rounded-3xl border-border/70 bg-gradient-to-br from-secondary/70 to-background shadow-soft">
        <CardHeader className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="rounded-full">
              <Waves className="mr-1 size-3" /> Coastal Karnataka
            </Badge>
            <Badge variant="outline" className="rounded-full">
              {itinerary.aiUsed ? "AI narrative + curated data" : "Curated data (offline mode)"}
            </Badge>
          </div>
          <CardTitle className="font-display text-3xl leading-tight">{itinerary.title}</CardTitle>
          <p className="text-muted-foreground">{itinerary.tagline}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed text-foreground/80">{itinerary.summary}</p>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <RouteIcon className="size-4" />
            {itinerary.routeOrder.join(" → ")}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="days">
        <TabsList className="flex w-full flex-wrap justify-start rounded-full">
          <TabsTrigger value="days">Day by day</TabsTrigger>
          <TabsTrigger value="map">Map & routes</TabsTrigger>
          <TabsTrigger value="way">On the way</TabsTrigger>
          <TabsTrigger value="stays">Stays & food</TabsTrigger>
          <TabsTrigger value="travel">Travel</TabsTrigger>
          <TabsTrigger value="extras">Extras</TabsTrigger>
        </TabsList>

        <TabsContent value="days" className="space-y-5 pt-5">
          {itinerary.days.map((day) => (
            <Card key={day.day} className="rounded-3xl border-border/70">
              <CardHeader className="space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="font-display text-xl">
                    Day {day.day} · {day.headline}
                  </CardTitle>
                  <span className="text-sm font-medium text-muted-foreground">
                    {day.date ? `${day.date} · ` : ""}
                    {inr(day.dayCostInr)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Base: {day.base} · {day.note}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {day.travelLegs.map((leg, i) => (
                  <div
                    key={`${leg.fromTown}-${leg.toTown}-${i}`}
                    className="flex flex-wrap items-center gap-2 rounded-2xl bg-secondary/50 px-4 py-2 text-sm"
                  >
                    <Bus className="size-4 text-primary" />
                    <span className="font-medium">
                      {leg.fromTown} → {leg.toTown}
                    </span>
                    <span className="text-muted-foreground">
                      {leg.mode} · ~{Math.round(leg.durationMin / 60)}h {leg.durationMin % 60}m ·{" "}
                      {inr(leg.costInr)}
                    </span>
                    <ConfidenceTag confidence={leg.confidence} source={leg.source} />
                  </div>
                ))}

                <div className="grid gap-3 md:grid-cols-3">
                  {day.blocks.map((block, i) => (
                    <div
                      key={`${block.title}-${i}`}
                      className="rounded-2xl border border-border/60 p-4"
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                        {block.slot}
                      </p>
                      <p className="mt-1 font-display text-lg font-semibold leading-snug">
                        {block.title}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="size-3" /> {block.town} · {block.category}
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">{block.description}</p>
                      <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                        <p className="flex items-center gap-1">
                          <Clock className="size-3" /> stay ~{block.durationMin} min · travel ~
                          {block.travelTimeMin} min · {block.distanceKm} km
                        </p>
                        <p>Estimated cost: {inr(block.costInr)}</p>
                      </div>
                      <div className="mt-3">
                        <ConfidenceTag confidence={block.confidence} source={block.source} />
                      </div>
                    </div>
                  ))}
                </div>

                {day.meals.length ? (
                  <>
                    <Separator />
                    <div className="grid gap-3 sm:grid-cols-2">
                      {day.meals.map((meal, i) => (
                        <div key={`${meal.name}-${i}`} className="rounded-2xl bg-secondary/40 p-4">
                          <p className="flex items-center gap-1.5 font-semibold">
                            <Utensils className="size-4 text-accent" /> {meal.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {meal.town} · {meal.cuisine} · {meal.vegType}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {meal.dishes.join(", ")}
                          </p>
                          <p className="mt-1 text-sm font-medium">
                            ~{inr(meal.costPerPersonInr)} per person
                          </p>
                          <div className="mt-2">
                            <ConfidenceTag confidence={meal.confidence} source={meal.source} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : null}

                {day.activities.length ? (
                  <div className="flex flex-wrap gap-2">
                    {day.activities.map((a, i) => (
                      <Badge key={`${a.name}-${i}`} variant="outline" className="rounded-full">
                        {a.name} · {inr(a.costInr)}
                      </Badge>
                    ))}
                  </div>
                ) : null}

                {day.stay ? (
                  <div className="rounded-2xl border border-dashed border-border p-4 text-sm">
                    <p className="font-semibold">Stay: {day.stay.name}</p>
                    <p className="text-muted-foreground">
                      {day.stay.town} · {day.stay.style} · ~{inr(day.stay.pricePerNightInr)}/night
                      {day.stay.vegFriendly ? " · veg-friendly kitchen" : ""}
                    </p>
                    <div className="mt-2">
                      <ConfidenceTag confidence={day.stay.confidence} source={day.stay.source} />
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="way" className="space-y-4 pt-5">
          <SectionGrid
            title="Places on the way"
            items={itinerary.placesOnTheWay}
            empty="No low-detour stops found for this route."
          />
          <SectionGrid
            title="Hidden gems"
            items={itinerary.hiddenGems}
            empty="No hidden gems matched your interests."
          />
        </TabsContent>

        <TabsContent value="stays" className="grid gap-4 pt-5 md:grid-cols-2">
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle className="font-display text-xl">Recommended stays</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {itinerary.stays.map((s) => (
                <div key={s.name} className="rounded-2xl border border-border/60 p-3 text-sm">
                  <p className="font-semibold">{s.name}</p>
                  <p className="text-muted-foreground">
                    {s.town} · {s.style} · ~{inr(s.pricePerNightInr)}/night
                  </p>
                  {s.notes ? <p className="mt-1 text-muted-foreground">{s.notes}</p> : null}
                  <div className="mt-2 flex items-center justify-between">
                    <ConfidenceTag confidence={s.confidence} source={s.source} />
                    <Button asChild size="sm" variant="outline" className="rounded-full">
                      <a
                        href={bookingLink("stay", plan.input.origin, s.town, plan.input.startDate).url}
                        target="_blank"
                        rel="noreferrer noopener"
                      >
                        Book stay
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle className="font-display text-xl">Where to eat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {itinerary.restaurants.map((r) => (
                <div key={r.name} className="rounded-2xl border border-border/60 p-3 text-sm">
                  <p className="font-semibold">{r.name}</p>
                  <p className="text-muted-foreground">
                    {r.town} · {r.cuisine} · {r.vegType} · ~{inr(r.costPerPersonInr)} pp
                  </p>
                  <p className="mt-1 text-muted-foreground">{r.dishes.join(", ")}</p>
                  <div className="mt-2">
                    <ConfidenceTag confidence={r.confidence} source={r.source} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="travel" className="space-y-3 pt-5">
          <div className="grid gap-3 sm:grid-cols-2">
            {itinerary.transportOptions.map((t) => (
              <Card key={t.label} className="rounded-3xl">
                <CardContent className="space-y-2 p-5">
                  <p className="font-display text-lg font-semibold capitalize">{t.mode}</p>
                  <p className="text-sm text-muted-foreground">{t.label}</p>
                  <p className="text-sm">
                    ~{inr(t.costInr)} · ~{Math.floor(t.durationMin / 60)}h {t.durationMin % 60}m
                  </p>
                  {t.notes ? <p className="text-xs text-muted-foreground">{t.notes}</p> : null}
                  <p className="text-xs text-muted-foreground">
                    {plan.input.origin} → {firstStop}
                    {plan.input.startDate ? ` · ${plan.input.startDate}` : ""}
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <ConfidenceTag confidence={t.confidence} source={t.source} />
                    <Button asChild size="sm" className="rounded-full">
                      <a
                        href={
                          bookingLink(
                            t.bookingKind,
                            plan.input.origin,
                            firstStop,
                            plan.input.startDate,
                          ).url
                        }
                        target="_blank"
                        rel="noreferrer noopener"
                      >
                        Book on{" "}
                        {
                          bookingLink(
                            t.bookingKind,
                            plan.input.origin,
                            firstStop,
                            plan.input.startDate,
                          ).provider
                        }
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Booking buttons open the operator's own site. CoastWise never shows live seat or room
            availability.
          </p>
        </TabsContent>

        <TabsContent value="extras" className="grid gap-4 pt-5 md:grid-cols-2">
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle className="font-display text-xl">Packing assistant</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {itinerary.packingList.map((p) => (
                  <li key={p}>• {p}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle className="font-display text-xl">Local cuisine to try</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {itinerary.localCuisine.map((c) => (
                  <Badge key={c} variant="secondary" className="rounded-full">
                    <Coffee className="mr-1 size-3" />
                    {c}
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">{itinerary.weatherNote}</p>
            </CardContent>
          </Card>
          <Card className="rounded-3xl md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display text-xl">
                <Sparkles className="size-4 text-primary" /> Knowledge used for this plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {itinerary.retrievedKnowledge.length ? (
                itinerary.retrievedKnowledge.map((k, i) => (
                  <div key={i} className="rounded-2xl bg-secondary/40 p-3 text-sm">
                    <p className="text-muted-foreground">{k.content}</p>
                    {k.source ? (
                      <p className="mt-1 text-xs text-muted-foreground">Source: {k.source}</p>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No knowledge chunks were retrieved for this query.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SectionGrid({
  title,
  items,
  empty,
}: {
  title: string;
  items: {
    name: string;
    town: string;
    category: string;
    detourNote: string;
    description: string;
    confidence: string;
    source?: string | null;
  }[];
  empty: string;
}) {
  return (
    <Card className="rounded-3xl">
      <CardHeader>
        <CardTitle className="font-display text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {items.map((p) => (
              <div key={p.name} className="rounded-2xl border border-border/60 p-4 text-sm">
                <p className="font-semibold">{p.name}</p>
                <p className="text-xs text-muted-foreground">
                  {p.town} · {p.category}
                </p>
                <p className="mt-1 text-muted-foreground">{p.description}</p>
                <p className="mt-1 text-xs font-medium text-primary">{p.detourNote}</p>
                <div className="mt-2">
                  <ConfidenceTag confidence={p.confidence} source={p.source} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{empty}</p>
        )}
      </CardContent>
    </Card>
  );
}
