import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { BudgetBreakdown, TripInput } from "@/lib/coastwise/types";

export const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

export function BudgetPanel({
  budget,
  input,
}: {
  budget: BudgetBreakdown;
  input: TripInput;
}) {
  const rows = [
    ["Transport", budget.transportInr],
    ["Stays", budget.hotelsInr],
    ["Food", budget.foodInr],
    ["Activities", budget.activitiesInr],
    ["Entry fees", budget.entryFeesInr],
    ["Miscellaneous", budget.miscInr],
  ] as const;

  const used = Math.min(100, Math.round((budget.totalInr / Math.max(1, input.budgetInr)) * 100));

  return (
    <Card className="rounded-3xl border-border/70 shadow-soft">
      <CardHeader>
        <CardTitle className="font-display text-2xl">Budget</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <div className="flex items-baseline justify-between">
            <span className="font-display text-3xl font-semibold">{inr(budget.totalInr)}</span>
            <span className="text-sm text-muted-foreground">of {inr(input.budgetInr)}</span>
          </div>
          <Progress value={used} className="mt-3" />
          <p
            className={
              budget.overBudget
                ? "mt-2 text-sm font-medium text-destructive"
                : "mt-2 text-sm text-muted-foreground"
            }
          >
            {budget.overBudget
              ? `Over budget by ${inr(Math.abs(budget.remainingInr))}`
              : `${inr(budget.remainingInr)} left over`}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <Stat label="Per person" value={inr(budget.perPersonInr)} />
          <Stat label="Per day" value={inr(budget.perDayInr)} />
        </div>

        <ul className="divide-y divide-border/60 text-sm">
          {rows.map(([label, amount]) => (
            <li key={label} className="flex items-center justify-between py-2">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-medium">{inr(amount)}</span>
            </li>
          ))}
        </ul>

        {budget.savingSuggestions.length ? (
          <div className="rounded-2xl bg-secondary/60 p-4">
            <p className="text-sm font-semibold">Ways to spend less</p>
            <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
              {budget.savingSuggestions.map((s) => (
                <li key={s}>• {s}</li>
              ))}
            </ul>
          </div>
        ) : null}
        <p className="text-xs text-muted-foreground">
          All amounts are approximate estimates from the curated knowledge base — not live fares or
          room rates.
        </p>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-lg font-semibold">{value}</p>
    </div>
  );
}
