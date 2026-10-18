import { NextResponse } from "next/server";
import type { ShopData } from "@/lib/types";
import { buildMockReport } from "@/lib/scorer";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function systemPrompt(shop: ShopData) {
  const report = buildMockReport(shop);
  const scores = report.dimensions.map((d) => `${d.label}: ${d.score}/100`).join(", ");
  return `You are a friendly business assistant for a small online shop owner.

Shop data (JSON): ${JSON.stringify(shop)}
Health: overall ${report.overallScore}/100 (${report.verdict}). ${scores}.

Rules:
- Answer only from the data above. If something is not in it (for example per-product stock), say you don't have that information.
- Never invent numbers.
- Use clear, simple English, under 120 words, with concrete next steps when useful.`;
}

async function askLlm(shop: ShopData, messages: ChatMessage[]): Promise<string | null> {
  const baseUrl = process.env.VLLM_BASE_URL;
  if (!baseUrl) return null;

  try {
    const res = await fetch(`${baseUrl.replace(/\/+$/, "")}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.VLLM_MODEL ?? "Qwen/Qwen3-4B",
        messages: [{ role: "system", content: systemPrompt(shop) }, ...messages],
        temperature: 0.4,
        max_tokens: 500,
        chat_template_kwargs: { enable_thinking: false },
      }),
      signal: AbortSignal.timeout(60_000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const raw = data.choices?.[0]?.message?.content ?? "";
    const text = raw.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
    return text || null;
  } catch {
    return null;
  }
}

// Used when vLLM is not configured or not reachable
function fallbackReply(shop: ShopData, question: string): string {
  const q = question.toLowerCase();
  const report = buildMockReport(shop);
  const pick = (key: string) => {
    const d = report.dimensions.find((x) => x.key === key);
    return d ? `${d.label} scores ${d.score}/100. ${d.detail}` : "";
  };

  if (/sale|revenue|trend|grow/.test(q)) return pick("salesTrend");
  if (/price|pricing|expensive|cheap/.test(q)) return pick("price");
  if (/review|rating/.test(q)) return pick("reviews");
  if (/refund|service|respon|support/.test(q)) return pick("service");
  if (/listing|photo|description/.test(q)) return pick("listings");
  if (/stock|inventory|reorder/.test(q)) {
    return "I don't have per-product stock in the shop summary yet. The Inventory page shows the product-level view.";
  }
  if (/improve|recommend|advice|should|fix|tip|next/.test(q)) {
    return `Here is what I would do first:\n- ${report.recommendations.slice(0, 3).join("\n- ")}`;
  }
  return `${report.summary}\n\nOverall score: ${report.overallScore}/100 (${report.verdict}).`;
}

export async function POST(req: Request) {
  let body: { shop?: ShopData; messages?: ChatMessage[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { shop, messages } = body;
  const valid =
    shop &&
    typeof shop.name === "string" &&
    Array.isArray(messages) &&
    messages.length > 0 &&
    messages[messages.length - 1].role === "user" &&
    messages.every(
      (m) =>
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.length <= 1000
    );
  if (!valid) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const recent = messages.slice(-10);
  const llmReply = await askLlm(shop, recent);

  return NextResponse.json(
    llmReply
      ? { reply: llmReply, engine: "llm" }
      : { reply: fallbackReply(shop, recent[recent.length - 1].content), engine: "mock" }
  );
}