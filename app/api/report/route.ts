import { NextResponse } from "next/server";
import type { ShopData } from "@/lib/types";
import { buildLlmReport } from "@/lib/llm";
import { buildMockReport } from "@/lib/scorer";

export async function POST(req: Request) {
  let shop: ShopData;
  try {
    shop = (await req.json()) as ShopData;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!shop || typeof shop.name !== "string" || typeof shop.marketAvgPrice !== "number") {
    return NextResponse.json({ error: "Invalid shop data" }, { status: 400 });
  }

  // LLM first; if vLLM is down, not configured, or replies badly, use the rule-based scorer.
  const report = (await buildLlmReport(shop)) ?? buildMockReport(shop);
  return NextResponse.json(report);
}