import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Download, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Assistant, type ChatMessage } from "@/components/coastwise/Assistant";
import { BudgetPanel } from "@/components/coastwise/BudgetPanel";
import { ItineraryView } from "@/components/coastwise/ItineraryView";
import { TripForm } from "@/components/coastwise/TripForm";
import { Button } from "@/components/ui/button";
import { askAssistant, planTrip } from "@/lib/coastwise/plan.functions";
import { saveTrip } from "@/lib/coastwise/storage";
import { DEMO_INPUT, type PlanResult, type TripInput } from "@/lib/coastwise/types";

export const Route = createFileRoute("/plan")({
  head: () => ({
    meta: [
      { title: "Plan a Coastal Karnataka trip — CoastWise AI" },
      {
        name: "description",
        content:
          "Enter your budget, dates, interests and travel style to generate a day-by-day Coastal Karnataka itinerary with costs, stays, food and travel legs.",
      },
      { property: "og:title", content: "Plan a Coastal Karnataka trip — CoastWise AI" },
      {
        property: "og:description",
        content:
          "A personalised Udupi, Mangaluru, Gokarna and Karwar itinerary built from a curated coastal knowledge base.",
      },
    ],
  }),
  component: PlanPage,
});

function PlanPage() {
  const [input, setInput] = useState<TripInput>(DEMO_INPUT);
  const [plan, setPlan] = useState<PlanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [chatBusy, setChatBusy] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const runPlan = useServerFn(planTrip);
  const runAssistant = useServerFn(askAssistant);

  const generate = async (next?: TripInput) => {
    const payload = next ?? input;
    setLoading(true);
    try {
      const result = await runPlan({ data: payload });
      setPlan(result);
      setInput(result.input);
      toast.success("Itinerary ready");
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Could not build the itinerary. Please retry.",
      );
    } finally {
      setLoading(false);
    }
  };

  const send = async (text: string) => {
    setMessages((m) => [...m, { role: "user", text }]);
    setChatBusy(true);
    try {
      const result = await runAssistant({ data: { input, message: text } });
      setPlan(result.plan);
      setInput(result.plan.input);
      setMessages((m) => [...m, { role: "assistant", text: result.reply }]);
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error ? error.message : "The assistant is unavailable right now.";
      setMessages((m) => [...m, { role: "assistant", text: message }]);
      toast.error(message);
    } finally {
      setChatBusy(false);
    }
  };

  const save = (offline: boolean) => {
    if (!plan) return;
    saveTrip(plan, offline);
    toast.success(
      offline
        ? "Saved for offline use. Live prices, weather and availability still need internet."
        : "Trip saved to My trips",
    );
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <h1 className="font-display text-4xl font-semibold tracking-tight">Plan my trip</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          The planner retrieves curated Coastal Karnataka records, ranks them against your
          interests, orders the route to avoid backtracking, then fits everything to your budget.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-8">
          <TripForm value={input} onChange={setInput} onSubmit={() => generate()} loading={loading} />
          {plan ? <ItineraryView plan={plan} /> : null}
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          {plan ? (
            <>
              <BudgetPanel budget={plan.budget} input={plan.input} />
              <div className="flex flex-col gap-2">
                <Button variant="outline" className="rounded-full" onClick={() => save(false)}>
                  <Save className="mr-2 size-4" /> Save trip
                </Button>
                <Button variant="secondary" className="rounded-full" onClick={() => save(true)}>
                  <Download className="mr-2 size-4" /> Save for offline
                </Button>
              </div>
            </>
          ) : (
            <div className="rounded-3xl border border-dashed border-border p-6 text-sm text-muted-foreground">
              Your budget breakdown, saving suggestions and offline save appear here once the
              itinerary is generated.
            </div>
          )}
          <Assistant messages={messages} onSend={send} busy={chatBusy || loading} />
        </aside>
      </div>
    </main>
  );
}
