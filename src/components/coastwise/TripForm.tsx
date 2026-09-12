import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { COAST_TOWNS, INTEREST_OPTIONS, type TripInput } from "@/lib/coastwise/types";

interface Props {
  value: TripInput;
  onChange: (next: TripInput) => void;
  onSubmit: () => void;
  loading: boolean;
}

export function TripForm({ value, onChange, onSubmit, loading }: Props) {
  const set = <K extends keyof TripInput>(key: K, v: TripInput[K]) =>
    onChange({ ...value, [key]: v });

  const toggleList = (key: "destinations" | "interests", item: string) => {
    const list = value[key];
    const next = list.includes(item) ? list.filter((i) => i !== item) : [...list, item];
    set(key, next);
  };

  return (
    <Card className="rounded-3xl border-border/70 shadow-soft">
      <CardHeader>
        <CardTitle className="font-display text-2xl">Tell us about your trip</CardTitle>
      </CardHeader>
      <CardContent className="space-y-7">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="origin">Starting location</Label>
            <Input
              id="origin"
              value={value.origin}
              onChange={(e) => set("origin", e.target.value)}
              placeholder="Bengaluru"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="startDate">Start date (optional)</Label>
            <Input
              id="startDate"
              type="date"
              value={value.startDate ?? ""}
              onChange={(e) => set("startDate", e.target.value || undefined)}
            />
          </div>
        </div>

        <div className="space-y-3">
          <Label>Destinations along the coast</Label>
          <div className="flex flex-wrap gap-2">
            {COAST_TOWNS.map((town) => {
              const active = value.destinations.includes(town);
              return (
                <button
                  key={town}
                  type="button"
                  onClick={() => toggleList("destinations", town)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm transition-colors",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground",
                  )}
                >
                  {town}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Days · {value.days}</Label>
            <Slider
              min={1}
              max={14}
              step={1}
              value={[value.days]}
              onValueChange={([v]) => set("days", v ?? 1)}
            />
          </div>
          <div className="space-y-2">
            <Label>Travellers · {value.people}</Label>
            <Slider
              min={1}
              max={20}
              step={1}
              value={[value.people]}
              onValueChange={([v]) => set("people", v ?? 1)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="budget">Total budget (₹)</Label>
            <Input
              id="budget"
              type="number"
              min={1000}
              step={500}
              value={value.budgetInr}
              onChange={(e) => set("budgetInr", Number(e.target.value) || 1000)}
            />
          </div>
        </div>

        <div className="space-y-3">
          <Label>Interests</Label>
          <div className="flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map((interest) => {
              const active = value.interests.includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleList("interests", interest)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm capitalize transition-colors",
                    active
                      ? "border-accent bg-accent text-accent-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-accent/60 hover:text-foreground",
                  )}
                >
                  {interest}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Travel style">
            <Select value={value.style} onValueChange={(v) => set("style", v as TripInput["style"])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="backpacking">Backpacking</SelectItem>
                <SelectItem value="budget">Budget</SelectItem>
                <SelectItem value="comfortable">Comfortable</SelectItem>
                <SelectItem value="luxury">Luxury</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Food preference">
            <Select value={value.diet} onValueChange={(v) => set("diet", v as TripInput["diet"])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="veg">Vegetarian</SelectItem>
                <SelectItem value="nonveg">Non-vegetarian</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Transport preference">
            <Select
              value={value.transport}
              onValueChange={(v) => set("transport", v as TripInput["transport"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bus">Bus</SelectItem>
                <SelectItem value="train">Train</SelectItem>
                <SelectItem value="flight">Flight</SelectItem>
                <SelectItem value="taxi">Taxi</SelectItem>
                <SelectItem value="rental">Rental vehicle</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Hotel preference">
            <Input
              value={value.hotelPreference}
              onChange={(e) => set("hotelPreference", e.target.value)}
              placeholder="beach resort, homestay, budget…"
            />
          </Field>
          <Field label="Activity intensity">
            <Select
              value={value.intensity}
              onValueChange={(v) => set("intensity", v as TripInput["intensity"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relaxed">Relaxed</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>

        <Button
          size="lg"
          className="w-full rounded-full text-base"
          onClick={onSubmit}
          disabled={loading || value.destinations.length === 0}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" /> Building your itinerary…
            </>
          ) : (
            "Generate my itinerary"
          )}
        </Button>
        {value.destinations.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground">
            Pick at least one destination to continue.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
