import type { ShopData } from "./types";
import shopsJson from "@/data/test-shops.json";
import expectedJson from "@/data/test-shops.expected.json";

export interface ExpectedEntry {
  profile: string;
  expectedOverallRange: [number, number];
  expectedVerdict: "healthy" | "watch" | "critical";
  referenceDimensions: Record<string, number>;
  referenceOverall: number;
}

export const shops = shopsJson as ShopData[];
export const expected = expectedJson as unknown as Record<string, ExpectedEntry>;

export const DIMENSION_LABELS: Record<string, string> = {
  price: "Price Competitiveness",
  reviews: "Review Quality",
  salesTrend: "Sales Trend",
  listings: "Listing Completeness",
  service: "Service Quality",
  activity: "Recent Activity",
};

export function deriveMetrics(shop: ShopData) {
  const pct = shop.salesPrev30d > 0 ? (shop.sales30d / shop.salesPrev30d - 1) * 100 : null;
  const fullShare = shop.listingCount > 0 ? shop.listingsWithFullInfo / shop.listingCount : 0;

  return [
    {
      label: "Sales (30d)",
      value: shop.sales30d.toLocaleString(),
      change: pct === null ? "No previous period" : `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}% vs previous 30d`,
      trend: shop.sales30d >= shop.salesPrev30d ? ("up" as const) : ("down" as const),
    },
    {
      label: "Rating",
      value: `${shop.reviewAvg.toFixed(1)} / 5`,
      change: `${shop.reviewCount.toLocaleString()} reviews`,
      trend: shop.reviewAvg >= 4 ? ("up" as const) : ("down" as const),
    },
    {
      label: "Refund rate",
      value: `${(shop.refundRate * 100).toFixed(1)}%`,
      change: "Target: under 5%",
      trend: shop.refundRate <= 0.05 ? ("up" as const) : ("down" as const),
    },
    {
      label: "Complete listings",
      value: `${shop.listingsWithFullInfo} / ${shop.listingCount}`,
      change: `${Math.round(fullShare * 100)}% have full info`,
      trend: fullShare >= 0.8 ? ("up" as const) : ("down" as const),
    },
  ];
}

type Alert = { id: number; title: string; description: string; severity: "high" | "medium" | "low" };

export function deriveAlerts(shop: ShopData): Alert[] {
  const alerts: Omit<Alert, "id">[] = [];
  const fullShare = shop.listingCount > 0 ? shop.listingsWithFullInfo / shop.listingCount : 0;

  if (shop.daysSinceLastSale >= 30) {
    alerts.push({ title: "No recent sales", description: `Last sale was ${shop.daysSinceLastSale} days ago.`, severity: "high" });
  } else if (shop.daysSinceLastSale >= 7) {
    alerts.push({ title: "Sales have slowed", description: `Last sale was ${shop.daysSinceLastSale} days ago.`, severity: "medium" });
  }
  if (shop.salesPrev30d > 0 && shop.sales30d / shop.salesPrev30d < 0.8) {
    alerts.push({ title: "Sales are dropping", description: "Sales fell more than 20% compared with the previous 30 days.", severity: "high" });
  }
  if (shop.refundRate > 0.05) {
    alerts.push({
      title: "Refund rate is high",
      description: `${(shop.refundRate * 100).toFixed(1)}% of orders are refunded.`,
      severity: shop.refundRate > 0.1 ? "high" : "medium",
    });
  }
  if (shop.responseRate < 0.8) {
    alerts.push({ title: "Slow customer responses", description: `Only ${Math.round(shop.responseRate * 100)}% of messages get a reply.`, severity: "medium" });
  }
  if (shop.reviewCount >= 10 && shop.reviewAvg < 4) {
    alerts.push({ title: "Low review rating", description: `Average rating is ${shop.reviewAvg.toFixed(1)} out of 5.`, severity: "medium" });
  }
  if (shop.listingCount > 0 && fullShare < 0.7) {
    alerts.push({
      title: "Incomplete listings",
      description: `${shop.listingCount - shop.listingsWithFullInfo} listings are missing information.`,
      severity: "low",
    });
  }
  if (alerts.length === 0) {
    alerts.push({ title: "All clear", description: "Nothing needs your attention right now.", severity: "low" });
  }
  return alerts.map((a, i) => ({ ...a, id: i }));
}