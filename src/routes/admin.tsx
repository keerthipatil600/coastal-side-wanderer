import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Database, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ingestKnowledge } from "@/lib/coastwise/plan.functions";
import { listFeedback, listTrips } from "@/lib/coastwise/storage";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — knowledge base & analytics — CoastWise AI" },
      {
        name: "description",
        content:
          "Upload CSV, JSON, PDF text or TXT sources, clean and chunk them, generate embeddings into the coastal knowledge base, and review feedback analytics.",
      },
      { property: "og:title", content: "Admin — CoastWise AI" },
      {
        property: "og:description",
        content: "Coastal Karnataka knowledge-base ingestion, embeddings and feedback analytics.",
      },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <h1 className="font-display text-4xl font-semibold tracking-tight">Admin</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Ingest curated, legally usable Coastal Karnataka sources into the vector knowledge base
          and review how travellers rate the itineraries.
        </p>
      </header>

      <Tabs defaultValue="ingest">
        <TabsList>
          <TabsTrigger value="ingest">Data ingestion</TabsTrigger>
          <TabsTrigger value="analytics">Feedback analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="ingest" className="mt-6">
          <IngestPanel />
        </TabsContent>
        <TabsContent value="analytics" className="mt-6">
          <AnalyticsPanel />
        </TabsContent>
      </Tabs>
    </main>
  );
}

function IngestPanel() {
  const [source, setSource] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ chunks: number; embedded: number } | null>(null);
  const ingest = useServerFn(ingestKnowledge);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    const content = await file.text();
    setText(content.slice(0, 400000));
    if (!source) setSource(file.name);
    toast.success(`${file.name} loaded — review, then ingest.`);
  };

  const run = async () => {
    setBusy(true);
    try {
      const res = await ingest({ data: { source, text } });
      setResult(res);
      toast.success(`${res.chunks} chunks stored, ${res.embedded} embedded`);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Ingestion failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="rounded-3xl border border-border/70 bg-card p-6">
        <h2 className="font-display text-xl font-semibold">Upload a source</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          CSV, JSON or TXT files are read directly. For a PDF, paste the extracted text. Content is
          cleaned, chunked, tagged with metadata, embedded and stored with pgvector.
        </p>

        <div className="mt-5 space-y-4">
          <div>
            <Label htmlFor="src">Source or reference</Label>
            <Input
              id="src"
              className="mt-1.5"
              placeholder="e.g. Karnataka Tourism — Udupi district notes"
              value={source}
              onChange={(e) => setSource(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="file">File (CSV / JSON / TXT)</Label>
            <Input
              id="file"
              type="file"
              accept=".csv,.json,.txt,.md"
              className="mt-1.5"
              onChange={(e) => void onFile(e.target.files?.[0])}
            />
          </div>

          <div>
            <Label htmlFor="text">Content</Label>
            <Textarea
              id="text"
              rows={12}
              className="mt-1.5 font-mono text-xs"
              placeholder="Paste dataset rows or reference text here…"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {text.length.toLocaleString()} characters
            </p>
          </div>

          <Button
            className="rounded-full"
            disabled={busy || source.trim().length < 2 || text.trim().length < 20}
            onClick={() => void run()}
          >
            <Upload className="mr-2 size-4" />
            {busy ? "Ingesting…" : "Clean, chunk & embed"}
          </Button>

          {result ? (
            <p className="text-sm text-muted-foreground">
              Stored {result.chunks} chunks · {result.embedded} with embeddings. Chunks without
              embeddings still work through keyword retrieval.
            </p>
          ) : null}
        </div>
      </div>

      <aside className="space-y-4">
        <div className="rounded-3xl border border-border/70 bg-sand p-5 text-sm text-sand-foreground">
          <span className="flex size-9 items-center justify-center rounded-2xl bg-card">
            <Database className="size-4" />
          </span>
          <h3 className="mt-3 font-display text-base font-semibold">Pipeline</h3>
          <ol className="mt-2 space-y-1 text-xs text-muted-foreground">
            <li>1. Upload / paste source</li>
            <li>2. Clean whitespace & noise</li>
            <li>3. Chunk to ~900 characters</li>
            <li>4. Attach source metadata</li>
            <li>5. Generate embeddings</li>
            <li>6. Store in Postgres + pgvector</li>
          </ol>
        </div>
        <div className="rounded-3xl border border-dashed border-border p-5 text-xs text-muted-foreground">
          Only add public or curated data you are allowed to use. Every chunk keeps its source so
          itineraries can cite where a fact came from.
        </div>
      </aside>
    </div>
  );
}

function AnalyticsPanel() {
  const feedback = typeof window === "undefined" ? [] : listFeedback();
  const trips = typeof window === "undefined" ? [] : listTrips();

  const avg =
    feedback.length > 0
      ? (feedback.reduce((s, f) => s + f.overallRating, 0) / feedback.length).toFixed(1)
      : "—";

  const counts = new Map<string, number>();
  for (const t of trips) {
    for (const d of t.plan.input.destinations) counts.set(d, (counts.get(d) ?? 0) + 1);
  }
  const popular = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);

  const interests = new Map<string, number>();
  for (const t of trips) {
    for (const i of t.plan.input.interests) interests.set(i, (interests.get(i) ?? 0) + 1);
  }
  const popularInterests = [...interests.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Trips planned (this device)" value={String(trips.length)} />
        <Stat label="Feedback entries" value={String(feedback.length)} />
        <Stat label="Average rating" value={avg} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ListCard title="Popular destinations" rows={popular} />
        <ListCard title="Popular interests" rows={popularInterests} />
      </div>

      <p className="text-xs text-muted-foreground">
        Analytics here reflect trips and feedback saved on this device. Feedback feeds recommendation
        ranking as a controlled signal only.
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-border/70 bg-card p-5">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold">{value}</p>
    </div>
  );
}

function ListCard({ title, rows }: { title: string; rows: [string, number][] }) {
  return (
    <div className="rounded-3xl border border-border/70 bg-card p-5">
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      {rows.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">No data yet.</p>
      ) : (
        <ul className="mt-3 space-y-2 text-sm">
          {rows.map(([name, n]) => (
            <li key={name} className="flex items-center justify-between">
              <span className="capitalize">{name}</span>
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
                {n}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
