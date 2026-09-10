import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";

import { embed } from "./ai.server";

/** Read-only server client using the publishable key — RLS applies as anon. */
export function publicServerClient() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Missing Supabase server environment variables");
  return createClient<Database>(url, key, {
    global: { fetch: (input, init) => fetch(input, { ...init, headers: withKey(init?.headers, key) }) },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function withKey(headers: HeadersInit | undefined, key: string) {
  const h = new Headers(headers);
  h.delete("Authorization");
  h.set("apikey", key);
  return h;
}

export type PlaceRow = Database["public"]["Tables"]["places"]["Row"];
export type StayRow = Database["public"]["Tables"]["stays"]["Row"];
export type RestaurantRow = Database["public"]["Tables"]["restaurants"]["Row"];
export type ActivityRow = Database["public"]["Tables"]["activities"]["Row"];
export type TransportRow = Database["public"]["Tables"]["transport_routes"]["Row"];

export interface KnowledgeBase {
  places: PlaceRow[];
  stays: StayRow[];
  restaurants: RestaurantRow[];
  activities: ActivityRow[];
  transport: TransportRow[];
}

export async function loadKnowledgeBase(): Promise<KnowledgeBase> {
  const supabase = publicServerClient();
  const [places, stays, restaurants, activities, transport] = await Promise.all([
    supabase.from("places").select("*"),
    supabase.from("stays").select("*"),
    supabase.from("restaurants").select("*"),
    supabase.from("activities").select("*"),
    supabase.from("transport_routes").select("*"),
  ]);

  const firstError =
    places.error || stays.error || restaurants.error || activities.error || transport.error;
  if (firstError) throw new Error(`Knowledge base read failed: ${firstError.message}`);

  return {
    places: places.data ?? [],
    stays: stays.data ?? [],
    restaurants: restaurants.data ?? [],
    activities: activities.data ?? [],
    transport: transport.data ?? [],
  };
}

export interface RetrievedChunk {
  content: string;
  source: string | null;
  similarity?: number;
}

/**
 * RAG retrieval: vector search over kb_chunks when embeddings exist,
 * falling back to keyword overlap so the demo works before ingestion.
 */
export async function retrieveKnowledge(query: string, limit = 8): Promise<RetrievedChunk[]> {
  const supabase = publicServerClient();

  try {
    const vector = await embed(query);
    const { data, error } = await supabase.rpc("match_kb_chunks", {
      query_embedding: vector as unknown as string,
      match_count: limit,
    });
    if (!error && data && data.length > 0) {
      return data.map((row) => ({
        content: row.content,
        source: row.source,
        similarity: row.similarity ?? undefined,
      }));
    }
  } catch (error) {
    console.warn("[coastwise] vector search unavailable, falling back to keyword retrieval", error);
  }

  const { data } = await supabase.from("kb_chunks").select("content, source").limit(200);
  const terms = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 3);

  return (data ?? [])
    .map((row) => {
      const text = row.content.toLowerCase();
      const score = terms.reduce((acc, term) => (text.includes(term) ? acc + 1 : acc), 0);
      return { content: row.content, source: row.source, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ content, source }) => ({ content, source }));
}

/** Feedback signal used as a controlled ranking boost (never LLM training). */
export async function loadFeedbackSignal(): Promise<Record<string, number>> {
  const supabase = publicServerClient();
  const { data } = await supabase.from("feedback").select("ranking_signal, overall_rating").limit(500);
  const signal: Record<string, number> = {};
  for (const row of data ?? []) {
    const entries = (row.ranking_signal ?? {}) as Record<string, unknown>;
    for (const [label, value] of Object.entries(entries)) {
      const numeric = typeof value === "number" ? value : Number(value);
      if (Number.isFinite(numeric)) {
        signal[label] = (signal[label] ?? 0) + numeric;
      }
    }
  }
  return signal;
}
