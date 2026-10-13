// POST /api/check - main scoring endpoint.
// Body: ShopData JSON. Tries the LLM engine when vLLM is configured,
// falls back to the built-in rule-based scorer on any failure.

import { type NextRequest } from "next/server";
import { buildMockReport } from "@/lib/scorer";
import { buildLlmReport } from "@/lib/llm";

export async function POST(request: NextRequest) {
  let shop: unknown;
  try {
    shop = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (
    typeof shop !== "object" ||
    shop === null ||
    typeof (shop as { name?: unknown }).name !== "string" ||
    (shop as { name: string }).name.trim() === ""
  ) {
    return Response.json(
      { error: "Body must be a shop object with at least a 'name' field." },
      { status: 400 }
    );
  }

  const report =
    (await buildLlmReport(shop as Parameters<typeof buildMockReport>[0])) ??
    buildMockReport(shop as Parameters<typeof buildMockReport>[0]);

  return Response.json(report);
}
