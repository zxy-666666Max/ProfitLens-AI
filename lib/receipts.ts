import type { ShopData } from "./types";
import { saveAccountShop, sampleShop } from "./account-shops";

export interface ReceiptItem {
  name: string;
  price: number;
  quantity: number;
}
export interface ExtractedReceipt {
  fileName: string;
  date: string | null;
  total: number | null;
  items: ReceiptItem[];
}

const key = (email: string) => `profitlens_receipts:${email}`;
const DAY = 86_400_000;
const round2 = (n: number) => Math.round(n * 100) / 100;

function readReceipts(email: string): ExtractedReceipt[] {
  try {
    return JSON.parse(localStorage.getItem(key(email)) ?? "[]");
  } catch {
    return [];
  }
}

// Sales, prices, listing count and last-sale date come from receipts.
// Reviews, response rate, refund rate and listing completeness can't be read from
// receipts, so they keep placeholder values from sampleShop().
export function shopFromReceipts(shopName: string, receipts: ExtractedReceipt[]): ShopData {
  const base = sampleShop(shopName);
  const now = Date.now();

  const sold = receipts.flatMap((r) => {
    const t = r.date ? new Date(r.date).getTime() : now;
    return r.items.map((i) => ({ ...i, t: Number.isNaN(t) ? now : t }));
  });
  if (sold.length === 0) return base;

  const units = (filter: (t: number) => boolean) =>
    sold.filter((s) => filter(s.t)).reduce((sum, s) => sum + s.quantity, 0);
  const prices = sold.map((s) => s.price);
  const names = new Set(sold.map((s) => s.name.toLowerCase()));
  const latest = Math.max(...sold.map((s) => s.t));

  return {
    ...base,
    priceMin: round2(Math.min(...prices)),
    priceMax: round2(Math.max(...prices)),
    marketAvgPrice: round2(prices.reduce((a, b) => a + b, 0) / prices.length),
    sales30d: units((t) => t > now - 30 * DAY),
    salesPrev30d: units((t) => t > now - 60 * DAY && t <= now - 30 * DAY),
    listingCount: names.size,
    listingsWithFullInfo: Math.round((names.size * 2) / 3),
    daysSinceLastSale: Math.max(0, Math.floor((now - latest) / DAY)),
  };
}

export function addReceipts(email: string, shopName: string, incoming: ExtractedReceipt[]) {
  const valid = incoming.filter((r) => r.items.length > 0);
  if (valid.length === 0) return;
  const all = [...readReceipts(email), ...valid];
  localStorage.setItem(key(email), JSON.stringify(all));
  saveAccountShop(email, shopFromReceipts(shopName, all));
}