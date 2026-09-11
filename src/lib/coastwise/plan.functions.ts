import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import type { PlanResult, TripInput } from "./types";

const tripInputSchema = z.object({
  origin: z.string().min(2).max(80),
  destinations: z.array(z.string().min(2).max(60)).min(1).max(8),
  days: z.number().int().min(1).max(14),
  people: z.number().int().min(1).max(20),
  budgetInr: z.number().int().min(1000).max(2000000),
  startDate: z.string().optional(),
  style: z.enum(["budget", "comfortable", "luxury", "backpacking"]),
  interests: z.array(z.string().min(2).max(40)).max(12),
  diet: z.enum(["veg", "nonveg"]),
  transport: z.enum(["bus", "train", "flight", "taxi", "rental"]),
  hotelPreference: z.string().max(60),
  intensity: z.enum(["relaxed", "moderate", "high"]),
});

export const planTrip = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => tripInputSchema.parse(data))
  .handler(async ({ data }): Promise<PlanResult> => {
    const { buildPlan } = await import("./engine.server");
    return buildPlan(data as TripInput);
  });

const assistantSchema = z.object({
  input: tripInputSchema,
  message: z.string().min(2).max(500),
});

export const askAssistant = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => assistantSchema.parse(data))
  .handler(async ({ data }): Promise<{ reply: string; plan: PlanResult }> => {
    const { buildPlan, refineInput } = await import("./engine.server");
    const { input, reply } = await refineInput(data.input as TripInput, data.message);
    const plan = await buildPlan(input);
    return { reply, plan };
  });

const ingestSchema = z.object({
  source: z.string().min(2).max(200),
  text: z.string().min(20).max(400000),
});

/** Admin ingestion: clean -> chunk -> embed -> store in pgvector. */
export const ingestKnowledge = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => ingestSchema.parse(data))
  .handler(async ({ data }): Promise<{ chunks: number; embedded: number }> => {
    const { embed } = await import("./ai.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const clean = data.text.replace(/\r/g, "").replace(/[ \t]+/g, " ").trim();
    const paragraphs = clean.split(/\n{2,}/).map((p) => p.trim()).filter((p) => p.length > 40);
    const chunks: string[] = [];
    let buffer = "";
    for (const p of paragraphs) {
      if ((buffer + " " + p).length > 900) {
        if (buffer) chunks.push(buffer.trim());
        buffer = p;
      } else {
        buffer = buffer ? `${buffer}\n\n${p}` : p;
      }
    }
    if (buffer) chunks.push(buffer.trim());

    let embedded = 0;
    for (const content of chunks.slice(0, 60)) {
      let embedding: string | null = null;
      try {
        const vector = await embed(content);
        embedding = JSON.stringify(vector);
        embedded += 1;
      } catch (error) {
        console.warn("[coastwise] embedding failed for chunk", error);
      }
      await supabaseAdmin.from("kb_chunks").insert({
        content,
        source: data.source,
        embedding,
        metadata: { ingested_at: new Date().toISOString(), source: data.source },
      });
    }

    return { chunks: chunks.length, embedded };
  });
