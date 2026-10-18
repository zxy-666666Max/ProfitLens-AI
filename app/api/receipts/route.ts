import { NextResponse } from "next/server";
import { chatCompletion, llmConfigured } from "@/lib/llm-client";

const PROMPT = `You read shop receipts. Reply with ONLY a JSON object, no markdown, in this shape:
{"date":"YYYY-MM-DD or null","total":number or null,"items":[{"name":"item name","price":unit price as number,"quantity":number}]}
Use null for anything you cannot read. If the image is not a receipt, return {"date":null,"total":null,"items":[]}.`;

const IMAGE_TYPES = ["image/png", "image/jpeg"];

function parseReceipt(text: string) {
  try {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    const obj = JSON.parse(text.slice(start, end + 1));
    const items = (Array.isArray(obj.items) ? obj.items : [])
      .filter((i: { name?: unknown; price?: unknown }) => typeof i?.name === "string" && Number.isFinite(Number(i?.price)))
      .map((i: { name: string; price: unknown; quantity?: unknown }) => ({
        name: i.name.trim(),
        price: Number(i.price),
        quantity: Number(i.quantity) > 0 ? Number(i.quantity) : 1,
      }));
    const date = typeof obj.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(obj.date) ? obj.date : null;
    const total = Number.isFinite(Number(obj.total)) && obj.total !== null ? Number(obj.total) : null;
    return { date, total, items };
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  if (!llmConfigured(true)) {
    return NextResponse.json(
      { error: "The AI model is not configured." },
      { status: 503 }
    );
  }

  const form = await req.formData();
  const files = form.getAll("receipts").filter((f): f is File => f instanceof File).slice(0, 10);
  if (files.length === 0) return NextResponse.json({ error: "No files uploaded" }, { status: 400 });

  const receipts = [];
  const skipped: string[] = [];

  for (const file of files) {
    if (!IMAGE_TYPES.includes(file.type)) {
      skipped.push(`${file.name} (only PNG or JPG images are supported)`);
      continue;
    }
    const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
    const text = await chatCompletion(
      [
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: `data:${file.type};base64,${base64}` } },
            { type: "text", text: PROMPT },
          ],
        },
      ],
      { vision: true, maxTokens: 1000, temperature: 0 }
    );
    const parsed = text ? parseReceipt(text) : null;
    if (!parsed || parsed.items.length === 0) {
      skipped.push(`${file.name} (could not be read)`);
      continue;
    }
    receipts.push({ fileName: file.name, ...parsed });
  }

  return NextResponse.json({ receipts, skipped });
}