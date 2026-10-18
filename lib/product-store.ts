import { useMemo, useSyncExternalStore } from "react";
import { useSession, type Session } from "./auth";
import { isDemoSession } from "./account-shops";
import type { InventoryItem, StockStatus } from "./inventory";

export interface StoredProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  sold30d: number;
}

const keyFor = (email: string) => `profitlens_products:${email}`;
const EVENT = "product-change";

function readProducts(email: string): StoredProduct[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(keyFor(email)) ?? "[]");
    return Array.isArray(parsed) ? (parsed as StoredProduct[]) : [];
  } catch {
    return [];
  }
}

export function saveProducts(email: string, products: StoredProduct[]) {
  localStorage.setItem(keyFor(email), JSON.stringify(products));
  window.dispatchEvent(new Event(EVENT));
}

export function loadProducts(email: string): StoredProduct[] {
  return readProducts(email);
}

function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

// Demo account keeps its curated sample data, so it never stores products.
export function useAccountProducts(): { loading: boolean; isDemo: boolean; products: StoredProduct[] } {
  const session = useSession();
  const email = session?.email;
  const raw = useSyncExternalStore<string | null | undefined>(
    subscribe,
    () => (email ? localStorage.getItem(keyFor(email)) : null),
    () => undefined
  );

  return useMemo(() => {
    if (session === undefined || raw === undefined) {
      return { loading: true, isDemo: false, products: [] as StoredProduct[] };
    }
    if (isDemoSession(session)) return { loading: false, isDemo: true, products: [] };
    let products: StoredProduct[] = [];
    try {
      if (raw) products = readProducts(email!);
    } catch {}
    return { loading: false, isDemo: false, products };
  }, [session, raw, email]);
}

// Same rules as buildInventory in lib/inventory.ts so both sources rank alike.
export function classify(stock: number, sold30d: number): { daysLeft: number | null; status: StockStatus } {
  const daysLeft = sold30d > 0 ? stock / (sold30d / 30) : null;
  let status: StockStatus = "ok";
  if (stock === 0) status = "out";
  else if (daysLeft !== null && daysLeft <= 14) status = "reorder";
  else if (daysLeft === null || daysLeft >= 120) status = "slow";
  return { daysLeft, status };
}

export function toInventoryItem(p: StoredProduct): InventoryItem {
  return { id: p.id, name: p.name, price: p.price, stock: p.stock, sold30d: p.sold30d, ...classify(p.stock, p.sold30d) };
}

export function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `p_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
}

export interface CsvResult {
  products: StoredProduct[];
  skipped: number;
}

// Header row optional: name,price,stock,sold30d
export function parseProductsCsv(text: string): CsvResult {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const products: StoredProduct[] = [];
  let skipped = 0;
  for (const [i, line] of lines.entries()) {
    const parts = line.split(",").map((s) => s.trim());
    if (i === 0 && /^name/i.test(parts[0] ?? "")) continue;
    const name = parts[0];
    const price = Number(parts[1]);
    const stock = Number(parts[2]);
    const sold30d = Number(parts[3]);
    const valid =
      !!name && name.length <= 60 &&
      Number.isFinite(price) && price >= 0 && price <= 100000 &&
      Number.isInteger(stock) && stock >= 0 && stock <= 1000000 &&
      Number.isInteger(sold30d) && sold30d >= 0 && sold30d <= 100000;
    if (!valid) {
      skipped++;
      continue;
    }
    products.push({ id: newId(), name, price, stock, sold30d });
  }
  return { products, skipped };
}
