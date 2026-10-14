// Heuristic scoring engine - the "mock" mode.
// Runs with zero GPU so the whole pipeline works before vLLM is up.
// Implements Abdullah's rubric v0.2 exactly: doc/scoring-rubric.md

import type { ShopData, DimensionScore, HealthReport } from "./types";

const DIMENSIONS = [
  { key: "price", label: "Price Competitiveness", weight: 0.2 },
  { key: "reviews", label: "Review Quality", weight: 0.2 },
  { key: "salesTrend", label: "Sales Trend", weight: 0.2 },
  { key: "listings", label: "Listing Completeness", weight: 0.1 },
  { key: "service", label: "Service Quality", weight: 0.2 },
  { key: "activity", label: "Recent Activity", weight: 0.1 },
] as const;

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

// Piecewise-linear interpolation through (x, y) anchor points, flat outside the ends.
function interpolate(x: number, points: Array<[number, number]>): number {
  if (x <= points[0][0]) return points[0][1];
  const last = points[points.length - 1];
  if (x >= last[0]) return last[1];
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    if (x <= x1) return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
  }
  return last[1]; // unreachable
}

function scorePrice(shop: ShopData): { raw: number; detail: string } {
  const mid = (shop.priceMin + shop.priceMax) / 2;
  const market = shop.marketAvgPrice;
  if (mid <= 0 || market <= 0) {
    return { raw: 50, detail: "Pricing data missing — cannot assess" };
  }
  const r = mid / market;
  let raw = interpolate(r, [
    [0.4, 20],
    [0.6, 55],
    [0.85, 100],
    [1.1, 100],
    [1.3, 60],
    [1.6, 20],
  ]);
  let bonus = "";
  // Justified premium: loved by customers and few refunds.
  if (r > 1.1 && shop.reviewAvg >= 4.6 && shop.refundRate <= 0.05) {
    raw = clamp(raw + 10);
    bonus = ", +10 justified-premium bonus (high rating, low refunds)";
  }
  return {
    raw,
    detail: `Avg price ${mid.toFixed(2)} vs market ${market.toFixed(2)} (${((r - 1) * 100).toFixed(1)}% vs market)${bonus}`,
  };
}

function scoreReviews(shop: ShopData): { raw: number; detail: string } {
  if (shop.reviewCount <= 0) {
    return { raw: 50, detail: "No reviews yet" };
  }
  const ratingScore = clamp(((shop.reviewAvg - 3.0) / 1.8) * 100); // 4.8 -> 100, 3.0 -> 0
  const volumeScore = clamp((Math.log10(shop.reviewCount + 1) / 3) * 100); // ~1000 reviews -> 100
  const base = 0.7 * ratingScore + 0.3 * volumeScore;
  const c = Math.min(1, shop.reviewCount / 30); // trust in the rating
  return {
    raw: c * base + (1 - c) * 50,
    detail: `${shop.reviewAvg.toFixed(1)}/5 from ${shop.reviewCount} reviews`,
  };
}

function scoreSalesTrend(shop: ShopData): { raw: number; detail: string } {
  const prev = shop.salesPrev30d;
  const cur = shop.sales30d;
  if (prev <= 0) {
    if (cur <= 0) {
      return { raw: 0, detail: "No sales in either 30-day window" };
    }
    return { raw: 60, detail: `No prior-month data; ${cur} sales in last 30d (just starting)` };
  }
  const g = cur / prev - 1;
  const raw = interpolate(g, [
    [-0.5, 0],
    [-0.25, 20],
    [-0.1, 45],
    [0, 65],
    [0.1, 85],
    [0.25, 100],
  ]);
  return {
    raw,
    detail: `${cur} vs ${prev} units (${g >= 0 ? "+" : ""}${(g * 100).toFixed(1)}% MoM)`,
  };
}

function scoreListings(shop: ShopData): { raw: number; detail: string } {
  if (shop.listingCount <= 0) {
    return { raw: 0, detail: "No listings" };
  }
  const fullShare = shop.listingsWithFullInfo / shop.listingCount;
  const raw = clamp(
    0.85 * fullShare * 100 + 0.15 * clamp((shop.listingCount / 10) * 100)
  );
  return {
    raw,
    detail: `${shop.listingsWithFullInfo}/${shop.listingCount} listings fully described`,
  };
}

function scoreService(shop: ShopData): { raw: number; detail: string } {
  const responseScore = interpolate(shop.responseRate, [
    [0.25, 0],
    [0.5, 30],
    [0.8, 70],
    [0.95, 100],
  ]);
  const refundScore = interpolate(shop.refundRate, [
    [0.02, 100],
    [0.05, 70],
    [0.1, 30],
    [0.15, 0],
  ]);
  return {
    raw: 0.5 * responseScore + 0.5 * refundScore,
    detail: `Response rate ${(shop.responseRate * 100).toFixed(0)}%, refund rate ${(shop.refundRate * 100).toFixed(1)}%`,
  };
}

function scoreActivity(shop: ShopData): { raw: number; detail: string } {
  const d = shop.daysSinceLastSale;
  const raw = interpolate(d, [
    [0, 100],
    [2, 100],
    [7, 80],
    [14, 65],
    [30, 40],
    [60, 15],
    [90, 0],
  ]);
  return {
    raw,
    detail: `Last sale ${d} day${d === 1 ? "" : "s"} ago`,
  };
}

const SCORERS: Array<(s: ShopData) => { raw: number; detail: string }> = [
  scorePrice,
  scoreReviews,
  scoreSalesTrend,
  scoreListings,
  scoreService,
  scoreActivity,
];

export function buildMockReport(shop: ShopData): HealthReport {
  // Keep raw float scores for the overall; round only for display.
  const raws = SCORERS.map((fn) => fn(shop));
  const overallRaw = raws.reduce((sum, r, i) => sum + r.raw * DIMENSIONS[i].weight, 0);

  let overall = Math.round(overallRaw);
  const caps: string[] = [];
  // Dormant cap: no recent sales should not look fine because old reviews are good.
  if (shop.daysSinceLastSale >= 60 && overall > 40) {
    overall = 40;
    caps.push("dormant (no sales in 60+ days)");
  }
  // No track record cap: a new shop cannot be "healthy" yet.
  if ((shop.reviewCount < 10 || shop.salesPrev30d === 0) && overall > 69) {
    overall = 69;
    caps.push("no track record yet (few reviews or no prior-month sales)");
  }

  const verdict = overall >= 70 ? "healthy" : overall >= 50 ? "watch" : "critical";

  const dimensions: DimensionScore[] = DIMENSIONS.map((d, i) => ({
    key: d.key,
    label: d.label,
    score: Math.round(raws[i].raw),
    weight: d.weight,
    detail: raws[i].detail,
  }));

  // Weakest 3 dimensions drive the recommendations.
  const weakest = [...dimensions].sort((a, b) => a.score - b.score).slice(0, 3);

  const advice: Record<string, string> = {
    price: "Revisit pricing: compare against market average and consider bundles or discounts to close the gap.",
    reviews: "Chase reviews right after delivery (follow-up message), and resolve negative ones publicly and quickly.",
    salesTrend: "Sales are sliding — refresh top listings, run a promotion, or test new keywords to restart momentum.",
    listings: "Fill in missing photos, descriptions and specs on incomplete listings — complete listings convert better.",
    service: "Improve response speed and reduce refunds: set up quick replies and clarify product expectations upfront.",
    activity: "The shop looks dormant. Post new listings or run ads — inactivity itself drives ranking down.",
  };

  const summaryBase =
    verdict === "healthy"
      ? "This shop is in good shape overall. Keep the momentum and fix the weakest areas below."
      : verdict === "watch"
      ? "This shop shows warning signs. Fix the weakest areas below before they snowball."
      : "This shop is in trouble. The weakest areas below need immediate action.";
  const summary = caps.length
    ? `${summaryBase} Capped because: ${caps.join("; ")}.`
    : summaryBase;

  return {
    shopName: shop.name,
    overallScore: overall,
    verdict,
    dimensions,
    summary,
    recommendations: weakest.map((d) => advice[d.key] ?? "Review this dimension."),
    engine: "mock",
  };
}
