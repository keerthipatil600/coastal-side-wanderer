import { Badge } from "@/components/ui/badge";

const label: Record<string, string> = {
  approximate: "Approximate",
  live: "Live",
  unavailable: "Unavailable",
};

export function ConfidenceTag({
  confidence,
  source,
}: {
  confidence: string;
  source?: string | null;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Badge
        variant={confidence === "live" ? "default" : confidence === "unavailable" ? "outline" : "secondary"}
        className="rounded-full text-[10px] font-semibold uppercase tracking-wide"
      >
        {label[confidence] ?? confidence}
      </Badge>
      {source ? (
        <a
          href={source}
          target="_blank"
          rel="noreferrer noopener"
          className="text-[11px] text-muted-foreground underline decoration-dotted hover:text-foreground"
        >
          source
        </a>
      ) : null}
    </span>
  );
}
