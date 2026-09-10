const GATEWAY = "https://ai.gateway.lovable.dev/v1";
export const CHAT_MODEL = "openai/gpt-6-astra";
export const EMBEDDING_MODEL = "google/gemini-embedding-2";

function apiKey(): string {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  return key;
}

export class GatewayError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** Chat completion that returns a parsed JSON object. Never throws on parse — returns null. */
export async function chatJson<T>(system: string, user: string): Promise<T | null> {
  const res = await fetch(`${GATEWAY}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey(),
    },
    body: JSON.stringify({
      model: CHAT_MODEL,
      reasoning_effort: "low",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new GatewayError(res.status, body.slice(0, 500));
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = data.choices?.[0]?.message?.content ?? "";
  try {
    return JSON.parse(text) as T;
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]) as T;
    } catch {
      return null;
    }
  }
}

export async function embed(input: string): Promise<number[]> {
  const res = await fetch(`${GATEWAY}/embeddings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey(),
    },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new GatewayError(res.status, body.slice(0, 500));
  }
  const data = (await res.json()) as { data?: { embedding: number[] }[] };
  const vector = data.data?.[0]?.embedding;
  if (!vector) throw new GatewayError(500, "Embedding response contained no vector");
  return vector;
}

export function gatewayMessage(error: unknown): string {
  if (error instanceof GatewayError) {
    if (error.status === 402) return "The AI credits for this workspace are used up.";
    if (error.status === 429) return "The AI service is rate limited right now. Try again in a moment.";
    if (error.status === 401 || error.status === 403) return "The AI service is not available for this app.";
    return "The AI service returned an error.";
  }
  return "The AI service could not be reached.";
}
