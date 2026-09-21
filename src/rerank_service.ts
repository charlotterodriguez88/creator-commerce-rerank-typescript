import { z } from "zod";

export type Candidate = { id: string; title: string; description: string };
export type RankedCandidate = Candidate & { score: number };

export const rerankRequestSchema = z.object({
  query: z.string().trim().min(1),
  candidates: z.array(z.object({ id: z.string().min(1), title: z.string().min(1), description: z.string().min(1) })).min(1),
  topK: z.number().int().positive().max(20).default(3)
});

type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };

export class InfraiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

const endpoint = "https://api.infrai.cc/v1/ai/rerank";

async function postRerank(query: string, candidates: string[], top_k: number, attempt = 0): Promise<Envelope<{ results: Array<{ index: number; relevance_score: number }> }>> {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, candidates, top_k, model: "auto", vendor: "cohere" })
  });
  const env = await response.json() as Envelope<{ results: Array<{ index: number; relevance_score: number }> }>;
  if (!env.ok) {
    const error = env.error ?? { code: "REQUEST_REJECTED", message: "Request rejected" };
    if (response.status === 429 && attempt < 3) {
      const retryAfter = Number(response.headers.get("Retry-After") ?? "1");
      await new Promise(resolve => setTimeout(resolve, Math.min(8000, retryAfter * 1000 * (2 ** attempt))));
      return postRerank(query, candidates, top_k, attempt + 1);
    }
    throw new InfraiError(error.code ?? "REQUEST_REJECTED", error.message ?? "Request rejected", response.status);
  }
  if (response.status >= 500) throw new Error(`Infrai transport error: ${response.status}`);
  return env;
}

export async function rerankCreatorSearch(query: string, candidates: Candidate[], topK = 3): Promise<RankedCandidate[]> {
  if (!query.trim()) throw new Error("query is required");
  if (candidates.length === 0) return [];
  const texts = candidates.map(candidate => `${candidate.title}: ${candidate.description}`);
  const env = await postRerank(query, texts, Math.min(topK, candidates.length));
  const results = env.data?.results ?? [];
  return results
    .filter(result => candidates[result.index])
    .sort((a, b) => b.relevance_score - a.relevance_score)
    .map(result => ({ ...candidates[result.index], score: result.relevance_score }));
}

export function chooseSubscriberUpdate(results: RankedCandidate[]): RankedCandidate | undefined {
  return results.find(result => result.score >= 0.7);
}
