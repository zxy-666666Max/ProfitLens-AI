import type { ShopData } from "./types";

export type StockStatus = "out" | "reorder" | "slow" | "ok";

export interface InventoryItem {
  id: string;
  name: string;
  price: number;
  stock: number;
  sold30d: number;
  daysLeft: number | null; // null = not selling
  status: StockStatus;
}

const STEMS = [
  "Classic", "Premium", "Mini", "Deluxe", "Travel", "Starter",
  "Bundle", "Limited", "Everyday", "Pro", "Gift", "Basic",
];
const DAYS_OPTIONS = [0, 4, 9, 12, 25, 40, 60, 100, 200]; // gives a realistic mix of stock levels
const MAX_ITEMS = 12;

function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// SAMPLE DATA: replace with real products from the backend when available.
export function buildInventory(shop: ShopData): InventoryItem[] {
  const n = Math.min(shop.listingCount, MAX_ITEMS);
  if (n <= 0) return [];

  const rand = mulberry32(hash(shop.name));
  const label = shop.category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const weights = Array.from({ length: n }, () => 0.2 + rand());
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  return weights.map((w, i) => {
    const sold30d = Math.round((w / totalWeight) * shop.sales30d);
    const price = Math.round((shop.priceMin + rand() * (shop.priceMax - shop.priceMin)) * 100) / 100;
    const days = DAYS_OPTIONS[Math.floor(rand() * DAYS_OPTIONS.length)];
    const stock = sold30d > 0 ? Math.round((sold30d / 30) * days) : Math.round(5 + rand() * 35);
    const daysLeft = sold30d > 0 ? stock / (sold30d / 30) : null;

    let status: StockStatus = "ok";
    if (stock === 0) status = "out";
    else if (daysLeft !== null && daysLeft <= 14) status = "reorder";
    else if (daysLeft === null || daysLeft >= 120) status = "slow";

    return { id: String(i), name: `${STEMS[i % STEMS.length]} ${label}`, price, stock, sold30d, daysLeft, status };
  });
}