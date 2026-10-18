
import type { ShopData, DimensionScore, HealthReport } from "./types";
import { buildMockReport } from "./scorer";
import { chatCompletion } from "./llm-client";



const SYSTEM_PROMPT = `You are an e-commerce shop health analyst. You receive shop metrics as JSON and must reply with ONLY a JSON object, no markdown fences, no extra text, in this exact shape:

{
  "summary": "2-3 sentence overall assessment of the shop",
  "dimensions": [{ "key": "price", "comment": "1 sentence analysis of this dimension" }],
  "recommendations": ["actionable recommendation 1", "actionable recommendation 2", "actionable recommendation 3"]
}

The "dimensions" array must cover exactly these keys, one comment each:
price, reviews, salesTrend, listings, service, activity.

Rules:
- Write in clear, simple English.
- Every recommendation must be concrete and actionable for a small shop owner.
- Output the JSON object and nothing else.`;

// Strip markdown code fences some models add despite instructions.
function extractJson(text: string): unknown {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) throw new Error("no JSON object in reply");
  return JSON.parse(cleaned.slice(start, end + 1));
}

interface LlmReply {
  summary?: unknown;
  dimensions?: unknown;
  recommendations?: unknown;
}

export async function buildLlmReport(shop: ShopData): Promise<HealthReport | null> {
  const content = await chatCompletion(
    [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: JSON.stringify(shop) },
    ],
    { maxTokens: 700 }
  );
  if (!content) return null;

  let reply: LlmReply;
  try {
    reply = extractJson(content) as LlmReply;
  } catch {
    return null;
  }

  // Start from the mock report: it owns the numeric scores, weights, verdict.
  const base = buildMockReport(shop);
  if (base.engine !== "mock") return null;

  const summary = typeof reply.summary === "string" && reply.summary.trim() ? reply.summary.trim() : null;
  const recommendations =
    Array.isArray(reply.recommendations) &&
    reply.recommendations.every((r) => typeof r === "string")
      ? (reply.recommendations as string[]).filter((r) => r.trim()).slice(0, 5)
      : null;

  const comments = new Map<string, string>();
  if (Array.isArray(reply.dimensions)) {
    for (const d of reply.dimensions) {
      if (
        d &&
        typeof d === "object" &&
        "key" in d &&
        "comment" in d &&
        typeof (d as { key: unknown }).key === "string" &&
        typeof (d as { comment: unknown }).comment === "string"
      ) {
        const { key, comment } = d as { key: string; comment: string };
        comments.set(key, comment);
      }
    }
  }

  // If the LLM contributed nothing usable, treat the whole call as failed.
  if (!summary && !recommendations && comments.size === 0) return null;

  const dimensions: DimensionScore[] = base.dimensions.map((d) => ({
    ...d,
    detail: comments.get(d.key) ?? d.detail,
  }));

  return {
    ...base,
    engine: "llm",
    summary: summary ?? base.summary,
    dimensions,
    recommendations: recommendations && recommendations.length > 0 ? recommendations : base.recommendations,
  };
}
