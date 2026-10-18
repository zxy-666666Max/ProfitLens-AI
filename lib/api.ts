import type { ShopData, HealthReport } from "./types";
import type { ExtractedReceipt } from "./receipts";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
// Sends receipt files to the backend.
// With no NEXT_PUBLIC_API_URL set, it fakes a 1s upload so the UI works without a backend.
export async function uploadReceipts(
  files: File[]
): Promise<{ receipts: ExtractedReceipt[]; skipped: string[] }> {
  const body = new FormData();
  files.forEach((file) => body.append("receipts", file));

  const res = await fetch(`${API_URL ?? ""}/api/receipts`, { method: "POST", body });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error ?? `Upload failed (${res.status})`);
  }
  return res.json();
}



export async function getHealthReport(shop: ShopData): Promise<HealthReport> {
  const res = await fetch(`${API_URL ?? ""}/api/report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(shop),
  });
  if (!res.ok) throw new Error(`Report failed (${res.status})`);
  return res.json();
}

export type ChatMessage = { role: "user" | "assistant"; content: string };

export async function sendChat(
  shop: ShopData,
  messages: ChatMessage[]
): Promise<{ reply: string; engine: "llm" | "mock" }> {
  const res = await fetch(`${API_URL ?? ""}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ shop, messages }),
  });
  if (!res.ok) throw new Error(`Chat failed (${res.status})`);
  return res.json();
}