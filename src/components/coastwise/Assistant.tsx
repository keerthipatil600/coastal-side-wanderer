import { Loader2, Send } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const suggestions = [
  "Make this trip cheaper.",
  "Add more beaches.",
  "Remove temples.",
  "Add water sports.",
  "Give me vegetarian restaurants.",
  "Reduce travel time.",
  "Add one more day.",
];

export interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

export function Assistant({
  messages,
  onSend,
  busy,
}: {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  busy: boolean;
}) {
  const [draft, setDraft] = useState("");

  const send = (text: string) => {
    const value = text.trim();
    if (!value || busy) return;
    onSend(value);
    setDraft("");
  };

  return (
    <Card className="rounded-3xl border-border/70 shadow-soft">
      <CardHeader>
        <CardTitle className="font-display text-2xl">CoastWise Assistant</CardTitle>
        <p className="text-sm text-muted-foreground">
          Ask for changes in plain language — the assistant rebuilds the itinerary from the same
          curated knowledge base.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-h-80 space-y-3 overflow-y-auto">
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No messages yet. Try one of the suggestions below.
            </p>
          ) : null}
          {messages.map((m, i) => (
            <div
              key={i}
              className={cn(
                "text-sm leading-relaxed",
                m.role === "user" ? "flex justify-end" : "text-foreground",
              )}
            >
              <span
                className={cn(
                  m.role === "user"
                    ? "max-w-[85%] rounded-2xl bg-primary px-4 py-2 text-primary-foreground"
                    : "block",
                )}
              >
                {m.text}
              </span>
            </div>
          ))}
          {busy ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Replanning…
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              disabled={busy}
              onClick={() => send(s)}
              className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex items-end gap-2">
          <Textarea
            rows={2}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="e.g. Swap one temple day for water sports in Malpe"
            className="rounded-2xl"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(draft);
              }
            }}
          />
          <Button
            size="icon"
            className="size-10 shrink-0 rounded-full"
            onClick={() => send(draft)}
            disabled={busy || !draft.trim()}
            aria-label="Send message"
          >
            <Send className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
