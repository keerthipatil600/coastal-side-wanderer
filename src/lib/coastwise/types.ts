export type TravelStyle = "budget" | "comfortable" | "luxury" | "backpacking";
export type Diet = "veg" | "nonveg";
export type Intensity = "relaxed" | "moderate" | "high";
export type TransportPreference = "bus" | "train" | "flight" | "taxi" | "rental";

export const INTEREST_OPTIONS = [
  "beaches",
  "temples",
  "food",
  "adventure",
  "culture",
  "photography",
  "trekking",
  "wildlife",
  "nature",
] as const;

export const COAST_TOWNS = [
  "Mangaluru",
  "Someshwara",
  "Surathkal",
  "Sasihithlu",
  "Mulki",
  "Kaup",
  "Udupi",
  "Manipal",
  "Malpe",
  "Kundapura",
  "Maravanthe",
  "Murudeshwar",
  "Honnavar",
  "Kumta",
  "Gokarna",
  "Yana",
  "Karwar",
] as const;

export interface TripInput {
  origin: string;
  destinations: string[];
  days: number;
  people: number;
  budgetInr: number;
  startDate?: string;
  style: TravelStyle;
  interests: string[];
  diet: Diet;
  transport: TransportPreference;
  hotelPreference: string;
  intensity: Intensity;
}

export interface Confidence {
  confidence: "approximate" | "live" | "unavailable";
  source?: string | null;
}

export interface ItineraryBlock extends Confidence {
  slot: "morning" | "afternoon" | "evening";
  title: string;
  town: string;
  description: string;
  travelTimeMin: number;
  distanceKm: number;
  durationMin: number;
  costInr: number;
  category: string;
  lat: number;
  lng: number;
}

export interface MapPoint {
  name: string;
  town: string;
  lat: number;
  lng: number;
}

export interface MealSuggestion extends Confidence {
  name: string;
  town: string;
  cuisine: string;
  vegType: string;
  dishes: string[];
  costPerPersonInr: number;
}

export interface StaySuggestion extends Confidence {
  name: string;
  town: string;
  style: string;
  pricePerNightInr: number;
  vegFriendly: boolean;
  notes?: string | null;
}

export interface ActivitySuggestion extends Confidence {
  name: string;
  town: string;
  type: string;
  intensity: string;
  costInr: number;
  durationMin: number;
  notes?: string | null;
}

export interface DayPlan {
  day: number;
  date?: string;
  base: string;
  headline: string;
  note: string;
  blocks: ItineraryBlock[];
  meals: MealSuggestion[];
  activities: ActivitySuggestion[];
  stay: StaySuggestion | null;
  travelLegs: TravelLeg[];
  dayCostInr: number;
}

export interface TravelLeg extends Confidence {
  fromTown: string;
  toTown: string;
  mode: string;
  costInr: number;
  durationMin: number;
  notes?: string | null;
}

export interface PlaceOnTheWay extends Confidence {
  name: string;
  town: string;
  category: string;
  detourNote: string;
  description: string;
}

export interface BudgetBreakdown {
  transportInr: number;
  hotelsInr: number;
  foodInr: number;
  activitiesInr: number;
  entryFeesInr: number;
  miscInr: number;
  totalInr: number;
  perPersonInr: number;
  perDayInr: number;
  remainingInr: number;
  overBudget: boolean;
  savingSuggestions: string[];
}

export interface TransportOption extends Confidence {
  mode: TransportPreference;
  label: string;
  costInr: number;
  durationMin: number;
  notes?: string | null;
  bookingKind: "bus" | "train" | "flight" | "stay" | "taxi";
}

export interface Itinerary {
  title: string;
  tagline: string;
  summary: string;
  routeOrder: string[];
  routeCoords: MapPoint[];
  days: DayPlan[];
  placesOnTheWay: PlaceOnTheWay[];
  stays: StaySuggestion[];
  restaurants: MealSuggestion[];
  activities: ActivitySuggestion[];
  hiddenGems: PlaceOnTheWay[];
  packingList: string[];
  localCuisine: string[];
  weatherNote: string;
  transportOptions: TransportOption[];
  retrievedKnowledge: { content: string; source: string | null; similarity?: number }[];
  aiUsed: boolean;
  generatedAt: string;
}

export interface PlanResult {
  input: TripInput;
  itinerary: Itinerary;
  budget: BudgetBreakdown;
}

export const DEMO_INPUT: TripInput = {
  origin: "Bengaluru",
  destinations: ["Udupi", "Mangaluru"],
  days: 3,
  people: 2,
  budgetInr: 10000,
  style: "budget",
  interests: ["beaches", "food", "culture"],
  diet: "veg",
  transport: "bus",
  hotelPreference: "budget",
  intensity: "moderate",
};
