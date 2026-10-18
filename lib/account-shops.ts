import { useMemo, useSyncExternalStore } from "react";
import type { ShopData } from "./types";
import { shops as testShops } from "./shops";
import { DEMO_USER, useSession, type Session } from "./auth";

const keyFor = (email: string) => `profitlens_shop:${email}`;

export function isDemoSession(s: Session | null | undefined) {
  return s?.email === DEMO_USER.email;
}

export function saveAccountShop(email: string, shop: ShopData) {
  localStorage.setItem(keyFor(email), JSON.stringify(shop));
  window.dispatchEvent(new Event("shop-change"));
}

// Placeholder numbers used only while the backend is mocked
export function sampleShop(name: string): ShopData {
  return {
    name,
    category: "general",
    priceMin: 10,
    priceMax: 40,
    marketAvgPrice: 25,
    reviewAvg: 4.4,
    reviewCount: 36,
    sales30d: 120,
    salesPrev30d: 95,
    listingCount: 15,
    listingsWithFullInfo: 10,
    responseRate: 0.9,
    refundRate: 0.03,
    daysSinceLastSale: 2,
  };
}

function subscribe(callback: () => void) {
  window.addEventListener("shop-change", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("shop-change", callback);
    window.removeEventListener("storage", callback);
  };
}

// Demo account: all test shops. Any other account: only its own shop (or none yet).
export function useAccountShops() {
  const session = useSession();
  const email = session?.email;
  const raw = useSyncExternalStore<string | null | undefined>(
    subscribe,
    () => (email ? localStorage.getItem(keyFor(email)) : null),
    () => undefined
  );

  return useMemo(() => {
    if (session === undefined || raw === undefined) {
      return { loading: true, isDemo: false, shops: [] as ShopData[] };
    }
    if (isDemoSession(session)) return { loading: false, isDemo: true, shops: testShops };
    let own: ShopData[] = [];
    try {
      if (raw) own = [JSON.parse(raw) as ShopData];
    } catch {}
    return { loading: false, isDemo: false, shops: own };
  }, [session, raw]);
}