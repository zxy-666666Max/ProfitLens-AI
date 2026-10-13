// Heuristic scoring engine - the "mock" mode.
// Runs with zero GPU so the whole pipeline works before vLLM is up.
// Abdullah's /docs scoring rubric will replace/tune these weights later.

import type { ShopData, DimensionScore, HealthReport } from "./types";

const DIMENSIONS = [
  { key: "price", label: "Price Competitiveness", weight: 0.2 },
  { key: "reviews", label: "Review Quality", weight: 0.2 },
  { key: "salesTrend", label: "Sales Trend", weight: 0.2 },
  { key: "completeness", label: "Listing Completeness", weight: 0.15 },
  { key: "service", label: "Service Quality", weight: 0.15 },
  { key: "activity", label: "Recent Activity", weight: 0.1 },
] as const;

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

function scorePrice(shop: ShopData): DimensionScore {
  const mid = (shop.priceMin + shop.priceMax) / 2;
  const ref = shop.marketAvgPrice || mid;
  // Being cheaper than market avg is good; being way above is bad.
  const ratio = mid / ref; // 0.8 (cheap) .. 1.0 (at market) .. 1.3+ (expensive)
  const raw = clamp(100 - (ratio - 0.85) * 150);
  return {
    key: "price",
    label: "Price Competitiveness",
    score: Math.round(raw),
    weight: 0.2,
    detail: `Avg price ${mid.toFixed(2)} vs market ${ref.toFixed(2)} (${((ratio - 1) * 100).toFixed(1)}% vs market)`,
  };
}

function scoreReviews(shop: ShopData): DimensionScore {
  // Review avg scaled, with a small penalty when there are very few reviews.
  const base = (shop.reviewAvg / 5) * 100;
  const confidence = clamp(shop.reviewCount / 50, 0, 1); // full credit at 50+ reviews
  const raw = base * (0.7 + 0.3 * confidence);
  return {
    key: "reviews",
    label: "Review Quality",
    score: Math.round(raw),
    weight: 0.2,
    detail: `${shop.reviewAvg.toFixed(1)}/5 from ${shop.reviewCount} reviews`,
  };
}

function scoreSalesTrend(shop: ShopData): DimensionScore {
  const prev = shop.salesPrev30d;
  const cur = shop.sales30d;
  if (prev <= 0) {
    // No history: score by current volume alone.
    const raw = clamp(cur / 2); // 200 sales/mo = full marks
    return {
      key: "salesTrend",
      label: "Sales Trend",
      score: Math.round(raw),
      weight: 0.2,
      detail: `No prior-month data; ${cur} sales in last 30d`,
    };
  }
  const growth = (cur - prev) / prev; // -1 .. +inf
  const raw = clamp(50 + growth * 100); // flat trend = 50
  return {
    key: "salesTrend",
    label: "Sales Trend",
    score: Math.round(raw),
    weight: 0.2,
    detail: `${cur} vs ${prev} units (${growth >= 0 ? "+" : ""}${(growth * 100).toFixed(1)}% MoM)`,
  };
}

function scoreCompleteness(shop: ShopData): DimensionScore {
  const raw = shop.listingCount > 0
    ? (shop.listingsWithFullInfo / shop.listingCount) * 100
    : 0;
  return {
    key: "completeness",
    label: "Listing Completeness",
    score: Math.round(clamp(raw)),
    weight: 0.15,
    detail: `${shop.listingsWithFullInfo}/${shop.listingCount} listings fully described`,
  };
}

function scoreService(shop: ShopData): DimensionScore {
  // Response rate is good; refund rate is bad.
  const raw = clamp(shop.responseRate * 100 - shop.refundRate * 150);
  return {
    key: "service",
    label: "Service Quality",
    score: Math.round(raw),
    weight: 0.15,
    detail: `Response rate ${(shop.responseRate * 100).toFixed(0)}%, refund rate ${(shop.refundRate * 100).toFixed(1)}%`,
  };
}

function scoreActivity(shop: ShopData): DimensionScore {
  const d = shop.daysSinceLastSale;
  const raw = d <= 1 ? 100 : d <= 7 ? 80 : d <= 30 ? 50 : d <= 60 ? 25 : 10;
  return {
    key: "activity",
    label: "Recent Activity",
    score: raw,
    weight: 0.1,
    detail: `Last sale ${d} day${d === 1 ? "" : "s"} ago`,
  };
}

const SCORERS: Array<(s: ShopData) => DimensionScore> = [
  scorePrice,
  scoreReviews,
  scoreSalesTrend,
  scoreCompleteness,
  scoreService,
  scoreActivity,
];

export function buildMockReport(shop: ShopData): HealthReport {
  const dimensions = SCORERS.map((fn) => fn(shop));
  const overall = Math.round(
    dimensions.reduce((sum, d) => sum + d.score * d.weight, 0)
  );
  const verdict = overall >= 70 ? "healthy" : overall >= 45 ? "watch" : "critical";

  // Weakest 3 dimensions drive the recommendations.
  const weakest = [...dimensions].sort((a, b) => a.score - b.score).slice(0, 3);

  const advice: Record<string, string> = {
    price: "Revisit pricing: compare against market average and consider bundles or discounts to close the gap.",
    reviews: "Chase reviews right after delivery (follow-up message), and resolve negative ones publicly and quickly.",
    salesTrend: "Sales are sliding — refresh top listings, run a promotion, or test new keywords to restart momentum.",
    completeness: "Fill in missing photos, descriptions and specs on incomplete listings — complete listings convert better.",
    service: "Improve response speed and reduce refunds: set up quick replies and clarify product expectations upfront.",
    activity: "The shop looks dormant. Post new listings or run ads — inactivity itself drives ranking down.",
  };

  return {
    shopName: shop.name,
    overallScore: overall,
    verdict,
    dimensions,
    summary:
      verdict === "healthy"
        ? "This shop is in good shape overall. Keep the momentum and fix the weakest areas below."
        : verdict === "watch"
        ? "This shop shows warning signs. Fix the weakest areas below before they snowball."
        : "This shop is in trouble. The weakest areas below need immediate action.",
    recommendations: weakest.map((d) => advice[d.key] ?? "Review this dimension."),
    engine: "mock",
  };
}
