/**
 * CoastWise rule-based recommendation, route optimization and budget engine.
 *
 * Pipeline: input -> candidate filtering -> rule-based scoring (interests,
 * diet, style, intensity, feedback signal) -> route optimization (nearest
 * neighbour over coastal coordinates) -> day assembly -> budget optimization.
 * The LLM only writes narrative copy on top of these retrieved records.
 */
import { chatJson, GatewayError } from "./ai.server";
import {
  loadFeedbackSignal,
  loadKnowledgeBase,
  retrieveKnowledge,
  type ActivityRow,
  type KnowledgeBase,
  type PlaceRow,
  type RestaurantRow,
  type StayRow,
  type TransportRow,
} from "./kb.server";
import type {
  ActivitySuggestion,
  BudgetBreakdown,
  DayPlan,
  Itinerary,
  ItineraryBlock,
  MealSuggestion,
  PlaceOnTheWay,
  PlanResult,
  StaySuggestion,
  TransportOption,
  TravelLeg,
  TripInput,
} from "./types";

const STYLE_BUDGET_FACTOR: Record<TripInput["style"], number> = {
  backpacking: 0.75,
  budget: 1,
  comfortable: 1.6,
  luxury: 2.8,
};

const STYLE_STAY_KEYWORDS: Record<TripInput["style"], string[]> = {
  backpacking: ["hostel", "homestay", "budget"],
  budget: ["budget", "homestay", "lodge", "hostel"],
  comfortable: ["hotel", "resort", "mid"],
  luxury: ["resort", "luxury", "beach resort"],
};

const BLOCKS: ItineraryBlock["slot"][] = ["morning", "afternoon", "evening"];

function km(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)) * 10) / 10;
}

function townCentroid(kb: KnowledgeBase, town: string) {
  const rows = kb.places.filter((p) => p.town === town);
  if (rows.length === 0) return { lat: 13.34, lng: 74.75 };
  return {
    lat: rows.reduce((s, r) => s + r.lat, 0) / rows.length,
    lng: rows.reduce((s, r) => s + r.lng, 0) / rows.length,
  };
}

/** Nearest-neighbour route optimization so the trip never backtracks. */
function optimizeRoute(kb: KnowledgeBase, towns: string[]): string[] {
  const unique = [...new Set(towns)].filter(Boolean);
  if (unique.length <= 2) return unique;
  const coords = new Map(unique.map((t) => [t, townCentroid(kb, t)]));
  // Coastal Karnataka runs south -> north; start from the southernmost stop.
  const ordered = [...unique].sort((a, b) => coords.get(a)!.lat - coords.get(b)!.lat);
  const route = [ordered[0]!];
  const pool = ordered.slice(1);
  while (pool.length) {
    const last = coords.get(route[route.length - 1]!)!;
    let bestIdx = 0;
    let bestDist = Infinity;
    pool.forEach((town, i) => {
      const d = km(last, coords.get(town)!);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    });
    route.push(pool.splice(bestIdx, 1)[0]!);
  }
  return route;
}

function scorePlace(place: PlaceRow, input: TripInput, feedback: Record<string, number>) {
  let score = 0;
  const interests = input.interests.map((i) => i.toLowerCase());
  score += place.interests.filter((i) => interests.includes(i.toLowerCase())).length * 6;
  if (interests.includes(place.category.toLowerCase())) score += 3;
  if (place.hidden_gem) score += 1.5;
  if (place.entry_fee_inr === 0 && (input.style === "budget" || input.style === "backpacking"))
    score += 1;
  if (input.intensity === "relaxed" && place.suggested_duration_min > 150) score -= 1.5;
  if (input.intensity === "high") score += place.suggested_duration_min > 120 ? 1 : 0;
  score += (feedback[place.town] ?? 0) * 0.4 + (feedback[place.name] ?? 0) * 0.6;
  return score;
}

function pickStay(
  kb: KnowledgeBase,
  town: string,
  input: TripInput,
  nightlyCap: number,
): StaySuggestion | null {
  const keywords = STYLE_STAY_KEYWORDS[input.style];
  const pref = input.hotelPreference.toLowerCase();
  const candidates = kb.stays
    .filter((s) => s.town === town)
    .filter((s) => (input.diet === "veg" ? true : true))
    .map((s) => {
      let score = 0;
      if (keywords.some((k) => s.style.toLowerCase().includes(k))) score += 4;
      if (pref && s.style.toLowerCase().includes(pref)) score += 3;
      if (input.diet === "veg" && s.veg_friendly) score += 2;
      if (s.approx_price_per_night_inr <= nightlyCap) score += 4;
      else score -= (s.approx_price_per_night_inr - nightlyCap) / Math.max(nightlyCap, 1);
      return { s, score };
    })
    .sort((a, b) => b.score - a.score);
  const chosen = candidates[0]?.s ?? kb.stays.find((s) => s.town === town);
  if (!chosen) return null;
  return staySuggestion(chosen);
}

function staySuggestion(s: StayRow): StaySuggestion {
  return {
    name: s.name,
    town: s.town,
    style: s.style,
    pricePerNightInr: s.approx_price_per_night_inr,
    vegFriendly: s.veg_friendly,
    notes: s.notes,
    confidence: (s.confidence as StaySuggestion["confidence"]) ?? "approximate",
    source: s.source_url,
  };
}

function mealSuggestion(r: RestaurantRow): MealSuggestion {
  return {
    name: r.name,
    town: r.town,
    cuisine: r.cuisine,
    vegType: r.veg_type,
    dishes: r.signature_dishes ?? [],
    costPerPersonInr: r.approx_cost_per_person_inr,
    confidence: (r.confidence as MealSuggestion["confidence"]) ?? "approximate",
    source: r.source_url,
  };
}

function activitySuggestion(a: ActivityRow): ActivitySuggestion {
  return {
    name: a.name,
    town: a.town,
    type: a.type,
    intensity: a.intensity,
    costInr: a.approx_cost_inr,
    durationMin: a.duration_min,
    notes: a.notes,
    confidence: (a.confidence as ActivitySuggestion["confidence"]) ?? "approximate",
    source: a.source_url,
  };
}

function placeOnTheWay(p: PlaceRow, detourNote: string): PlaceOnTheWay {
  return {
    name: p.name,
    town: p.town,
    category: p.category,
    detourNote,
    description: p.description,
    confidence: (p.confidence as PlaceOnTheWay["confidence"]) ?? "approximate",
    source: p.source_url,
  };
}

function findLeg(
  kb: KnowledgeBase,
  from: string,
  to: string,
  mode: string,
): TransportRow | undefined {
  return (
    kb.transport.find(
      (t) =>
        t.mode === mode &&
        ((t.from_town === from && t.to_town === to) || (t.from_town === to && t.to_town === from)),
    ) ??
    kb.transport.find(
      (t) => (t.from_town === from && t.to_town === to) || (t.from_town === to && t.to_town === from),
    )
  );
}

function travelLeg(kb: KnowledgeBase, from: string, to: string, mode: string): TravelLeg {
  const row = findLeg(kb, from, to, mode);
  if (row) {
    return {
      fromTown: row.from_town === from ? row.from_town : to,
      toTown: row.from_town === from ? row.to_town : from,
      mode: row.mode,
      costInr: row.approx_cost_inr,
      durationMin: row.approx_duration_min,
      notes: row.notes,
      confidence: (row.confidence as TravelLeg["confidence"]) ?? "approximate",
      source: row.source_url,
    };
  }
  const distance = km(townCentroid(kb, from), townCentroid(kb, to));
  return {
    fromTown: from,
    toTown: to,
    mode,
    costInr: Math.round(distance * 3),
    durationMin: Math.round((distance / 40) * 60),
    durationMinFallback: true,
    notes: "Estimated from straight-line distance — no curated route record.",
    confidence: "approximate",
    source: null,
  } as TravelLeg;
}

interface LlmCopy {
  title?: string;
  tagline?: string;
  summary?: string;
  weatherNote?: string;
  packingList?: string[];
  days?: { day: number; headline?: string; note?: string }[];
}

export async function buildPlan(input: TripInput): Promise<PlanResult> {
  const [kb, feedback] = await Promise.all([loadKnowledgeBase(), loadFeedbackSignal()]);

  const query = `${input.days} day coastal Karnataka trip from ${input.origin} to ${input.destinations.join(", ")} for ${input.people} people, budget ₹${input.budgetInr}, ${input.style}, interests ${input.interests.join(", ")}, ${input.diet}, ${input.transport}`;
  const retrieved = await retrieveKnowledge(query, 10).catch(() => []);

  const routeOrder = optimizeRoute(kb, input.destinations);
  const days = Math.max(1, Math.min(14, input.days));
  const nights = Math.max(0, days - 1);

  // Assign days to towns along the optimized route.
  const dayTowns: string[] = [];
  for (let i = 0; i < days; i++) {
    dayTowns.push(routeOrder[Math.floor((i * routeOrder.length) / days)] ?? routeOrder[0]!);
  }

  const styleFactor = STYLE_BUDGET_FACTOR[input.style];
  const nightlyCap = Math.max(
    600,
    Math.round((input.budgetInr * 0.32) / Math.max(nights, 1) / Math.max(1, input.people / 2)),
  );

  const usedPlaces = new Set<string>();
  const usedRestaurants = new Set<string>();
  const usedActivities = new Set<string>();

  const dayPlans: DayPlan[] = [];

  for (let d = 0; d < days; d++) {
    const town = dayTowns[d]!;
    const nearby = [town, ...routeOrder.filter((t) => t !== town)];

    const ranked = kb.places
      .filter((p) => !usedPlaces.has(p.id))
      .map((p) => ({
        p,
        score:
          scorePlace(p, input, feedback) +
          (p.town === town ? 8 : nearby.indexOf(p.town) >= 0 ? 2 : 0) -
          km(townCentroid(kb, town), { lat: p.lat, lng: p.lng }) / 25,
      }))
      .sort((a, b) => b.score - a.score);

    const perDay = input.intensity === "relaxed" ? 2 : input.intensity === "high" ? 3 : 3;
    const chosen = ranked.slice(0, perDay).map((r) => r.p);
    chosen.forEach((p) => usedPlaces.add(p.id));

    const blocks: ItineraryBlock[] = chosen.map((p, i) => {
      const distanceKm = km(townCentroid(kb, town), { lat: p.lat, lng: p.lng });
      return {
        slot: BLOCKS[Math.min(i, 2)]!,
        title: p.name,
        town: p.town,
        description: p.description,
        travelTimeMin: Math.max(10, Math.round((distanceKm / 35) * 60)),
        distanceKm,
        durationMin: p.suggested_duration_min,
        costInr: p.entry_fee_inr * input.people,
        category: p.category,
        lat: p.lat,
        lng: p.lng,
        confidence: (p.confidence as ItineraryBlock["confidence"]) ?? "approximate",
        source: p.source_url,
      };
    });

    const meals = kb.restaurants
      .filter((r) => !usedRestaurants.has(r.id))
      .filter((r) => (input.diet === "veg" ? r.veg_type.toLowerCase() !== "nonveg" : true))
      .map((r) => ({
        r,
        score:
          (r.town === town ? 6 : 0) +
          (input.interests.includes("food") ? 2 : 0) +
          (r.approx_cost_per_person_inr <= 250 * styleFactor ? 3 : -1) +
          (feedback[r.name] ?? 0),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 2);
    meals.forEach((m) => usedRestaurants.add(m.r.id));

    const acts = kb.activities
      .filter((a) => !usedActivities.has(a.id))
      .map((a) => ({
        a,
        score:
          (a.town === town ? 6 : 0) +
          (a.intensity === input.intensity ? 3 : 0) +
          (input.interests.some((i) => a.type.toLowerCase().includes(i.toLowerCase())) ? 4 : 0) +
          (a.approx_cost_inr <= 800 * styleFactor ? 2 : -2) +
          (feedback[a.name] ?? 0),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, input.intensity === "relaxed" ? 1 : 2);
    acts.forEach((x) => usedActivities.add(x.a.id));

    const stay = d < days - 1 ? pickStay(kb, town, input, nightlyCap) : null;

    const legs: TravelLeg[] = [];
    if (d === 0) legs.push(travelLeg(kb, input.origin, town, input.transport));
    else if (dayTowns[d - 1] !== town) legs.push(travelLeg(kb, dayTowns[d - 1]!, town, "bus"));
    if (d === days - 1) legs.push(travelLeg(kb, town, input.origin, input.transport));

    const date = input.startDate
      ? new Date(new Date(input.startDate).getTime() + d * 86400000).toISOString().slice(0, 10)
      : undefined;

    const dayCost =
      blocks.reduce((s, b) => s + b.costInr, 0) +
      meals.reduce((s, m) => s + m.r.approx_cost_per_person_inr * input.people, 0) +
      acts.reduce((s, a) => s + a.a.approx_cost_inr * input.people, 0) +
      (stay ? stay.pricePerNightInr * Math.ceil(input.people / 2) : 0) +
      legs.reduce((s, l) => s + l.costInr * input.people, 0);

    dayPlans.push({
      day: d + 1,
      ...(date ? { date } : {}),
      base: town,
      headline: `${town} — ${chosen[0]?.name ?? "coastal exploring"}`,
      note: `Based around ${town}, tuned for a ${input.intensity} pace.`,
      blocks,
      meals: meals.map((m) => mealSuggestion(m.r)),
      activities: acts.map((a) => activitySuggestion(a.a)),
      stay,
      travelLegs: legs,
      dayCostInr: Math.round(dayCost),
    });
  }

  // Places on the way: near the route line but not already scheduled.
  const onTheWay = kb.places
    .filter((p) => !usedPlaces.has(p.id))
    .map((p) => {
      const detour = Math.min(
        ...routeOrder.map((t) => km(townCentroid(kb, t), { lat: p.lat, lng: p.lng })),
      );
      return { p, detour };
    })
    .filter((x) => x.detour < 45)
    .sort((a, b) => a.detour - b.detour)
    .slice(0, 6)
    .map((x) => placeOnTheWay(x.p, `About ${Math.round(x.detour)} km detour from your route.`));

  const hiddenGems = kb.places
    .filter((p) => p.hidden_gem)
    .slice(0, 5)
    .map((p) => placeOnTheWay(p, "Hidden gem — quiet, few crowds."));

  // Budget optimization.
  const transportInr = dayPlans.reduce(
    (s, d) => s + d.travelLegs.reduce((t, l) => t + l.costInr * input.people, 0),
    0,
  );
  const hotelsInr = dayPlans.reduce(
    (s, d) => s + (d.stay ? d.stay.pricePerNightInr * Math.ceil(input.people / 2) : 0),
    0,
  );
  const foodInr = dayPlans.reduce(
    (s, d) => s + d.meals.reduce((t, m) => t + m.costPerPersonInr * input.people, 0),
    0,
  );
  const activitiesInr = dayPlans.reduce(
    (s, d) => s + d.activities.reduce((t, a) => t + a.costInr * input.people, 0),
    0,
  );
  const entryFeesInr = dayPlans.reduce(
    (s, d) => s + d.blocks.reduce((t, b) => t + b.costInr, 0),
    0,
  );
  const subtotal = transportInr + hotelsInr + foodInr + activitiesInr + entryFeesInr;
  const miscInr = Math.round(subtotal * 0.08);
  const totalInr = subtotal + miscInr;

  const savingSuggestions: string[] = [];
  if (totalInr > input.budgetInr) {
    const cheaperStay = kb.stays
      .filter((s) => routeOrder.includes(s.town))
      .sort((a, b) => a.approx_price_per_night_inr - b.approx_price_per_night_inr)[0];
    if (cheaperStay)
      savingSuggestions.push(
        `Switch to ${cheaperStay.name} in ${cheaperStay.town} (~₹${cheaperStay.approx_price_per_night_inr}/night) to cut stay costs.`,
      );
    savingSuggestions.push("Travel by KSRTC/private bus instead of taxi or rental for long legs.");
    savingSuggestions.push(
      "Swap one paid activity for a free beach sunset — Malpe, Someshwara and Maravanthe cost nothing.",
    );
    savingSuggestions.push("Eat at local mess/hotel style restaurants — thali meals are ₹80–150.");
  }

  const budget: BudgetBreakdown = {
    transportInr,
    hotelsInr,
    foodInr,
    activitiesInr,
    entryFeesInr,
    miscInr,
    totalInr,
    perPersonInr: Math.round(totalInr / Math.max(1, input.people)),
    perDayInr: Math.round(totalInr / days),
    remainingInr: input.budgetInr - totalInr,
    overBudget: totalInr > input.budgetInr,
    savingSuggestions,
  };

  // Transport options for the origin -> first stop leg.
  const firstStop = routeOrder[0] ?? input.destinations[0] ?? "Udupi";
  const modes: { mode: TripInput["transport"]; label: string; kind: TransportOption["bookingKind"] }[] =
    [
      { mode: "bus", label: "Bus", kind: "bus" },
      { mode: "train", label: "Train", kind: "train" },
      { mode: "flight", label: "Flight", kind: "flight" },
      { mode: "taxi", label: "Taxi", kind: "taxi" },
      { mode: "rental", label: "Self-drive rental", kind: "taxi" },
    ];
  const transportOptions: TransportOption[] = modes.map(({ mode, label, kind }) => {
    const row = findLeg(kb, input.origin, firstStop, mode);
    if (row && row.mode === mode) {
      return {
        mode,
        label,
        costInr: row.approx_cost_inr,
        durationMin: row.approx_duration_min,
        notes: row.notes,
        bookingKind: kind,
        confidence: (row.confidence as TransportOption["confidence"]) ?? "approximate",
        source: row.source_url,
      };
    }
    return {
      mode,
      label,
      costInr: 0,
      durationMin: 0,
      notes: "No curated record for this mode on this route.",
      bookingKind: kind,
      confidence: "unavailable",
      source: null,
    };
  });

  // LLM narrative layer, strictly grounded in the records above.
  let copy: LlmCopy | null = null;
  let aiUsed = false;
  try {
    copy = await chatJson<LlmCopy>(
      [
        "You are CoastWise AI, a Coastal Karnataka travel writer.",
        "You will receive a fully computed itinerary built from a curated knowledge base.",
        "Write ONLY narrative copy. Never invent places, prices, ratings, schedules or opening hours.",
        "Never contradict the given data. Return JSON with keys:",
        'title, tagline, summary (2-3 sentences), weatherNote, packingList (6-10 short strings), days (array of {day, headline, note}).',
      ].join(" "),
      JSON.stringify({
        input,
        routeOrder,
        days: dayPlans.map((d) => ({
          day: d.day,
          base: d.base,
          places: d.blocks.map((b) => b.title),
          meals: d.meals.map((m) => m.name),
          activities: d.activities.map((a) => a.name),
          stay: d.stay?.name ?? null,
        })),
        budget,
        knowledge: retrieved.map((r) => r.content).slice(0, 8),
      }),
    );
    aiUsed = copy != null;
  } catch (error) {
    if (error instanceof GatewayError) {
      console.warn("[coastwise] AI copy unavailable", error.status, error.message);
    } else {
      console.warn("[coastwise] AI copy failed", error);
    }
  }

  const localCuisine = [
    ...new Set(kb.restaurants.flatMap((r) => r.signature_dishes ?? []).slice(0, 40)),
  ].slice(0, 12);

  const itinerary: Itinerary = {
    title: copy?.title ?? `${days} days along Coastal Karnataka`,
    tagline: copy?.tagline ?? "Less planning. More exploring.",
    summary:
      copy?.summary ??
      `A ${days}-day route from ${input.origin} through ${routeOrder.join(" → ")}, built for ${input.people} traveller(s) on a ₹${input.budgetInr.toLocaleString("en-IN")} budget.`,
    routeOrder,
    routeCoords: routeOrder.map((t) => {
      const c = townCentroid(kb, t);
      return { name: t, town: t, lat: c.lat, lng: c.lng };
    }),
    days: dayPlans.map((d) => {
      const c = copy?.days?.find((x) => x.day === d.day);
      return { ...d, headline: c?.headline ?? d.headline, note: c?.note ?? d.note };
    }),
    placesOnTheWay: onTheWay,
    stays: dayPlans.flatMap((d) => (d.stay ? [d.stay] : [])),
    restaurants: dayPlans.flatMap((d) => d.meals),
    activities: dayPlans.flatMap((d) => d.activities),
    hiddenGems,
    packingList:
      copy?.packingList ??
      [
        "Light cotton clothes",
        "Reef-safe sunscreen",
        "Sandals plus one dry pair",
        "Refillable water bottle",
        "Quick-dry towel",
        "Power bank",
        "Light rain shell (monsoon)",
        "Modest clothing for temples",
      ],
    localCuisine,
    weatherNote:
      copy?.weatherNote ??
      "Coastal Karnataka is humid year round; June–September brings heavy monsoon rain and rough seas. Live weather requires an internet connection and a connected weather API.",
    transportOptions,
    retrievedKnowledge: retrieved,
    aiUsed,
    generatedAt: new Date().toISOString(),
  };

  return { input, itinerary, budget };
}

/** Assistant refinement: interpret a natural request into structured input edits. */
export async function refineInput(
  input: TripInput,
  message: string,
): Promise<{ input: TripInput; reply: string }> {
  const parsed = await chatJson<{
    reply: string;
    changes?: Partial<TripInput>;
  }>(
    [
      "You are the CoastWise Assistant. You adjust a Coastal Karnataka trip request.",
      "Return JSON: { reply: string, changes: object }.",
      "changes may only contain these keys: days, people, budgetInr, style, interests, diet, transport, hotelPreference, intensity, destinations.",
      "Only include keys the user actually asked to change. Keep the reply to 1-2 friendly sentences.",
      "Valid style: budget|comfortable|luxury|backpacking. diet: veg|nonveg. intensity: relaxed|moderate|high.",
      "transport: bus|train|flight|taxi|rental.",
    ].join(" "),
    JSON.stringify({ current: input, request: message }),
  );

  const changes = parsed?.changes ?? {};
  const next: TripInput = {
    ...input,
    ...changes,
    days: clampNumber(changes.days ?? input.days, 1, 14),
    people: clampNumber(changes.people ?? input.people, 1, 20),
    budgetInr: clampNumber(changes.budgetInr ?? input.budgetInr, 1000, 2000000),
    destinations:
      Array.isArray(changes.destinations) && changes.destinations.length
        ? changes.destinations.slice(0, 8)
        : input.destinations,
    interests: Array.isArray(changes.interests) && changes.interests.length
      ? changes.interests.slice(0, 10)
      : input.interests,
  };

  return {
    input: next,
    reply: parsed?.reply ?? "I've updated the plan with your request.",
  };
}

function clampNumber(value: number, min: number, max: number) {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.round(n)));
}
