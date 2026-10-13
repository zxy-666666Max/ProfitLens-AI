// Shop Health Checker - shared types
// Abdullah's scoring dimensions doc (/docs) will refine these; keep names stable.

export interface ShopData {
  name: string;
  category: string;
  priceMin: number;
  priceMax: number;
  marketAvgPrice: number;
  reviewAvg: number; // 0-5
  reviewCount: number;
  sales30d: number;
  salesPrev30d: number;
  listingCount: number;
  listingsWithFullInfo: number;
  responseRate: number; // 0-1
  refundRate: number; // 0-1
  daysSinceLastSale: number;
}

export interface DimensionScore {
  key: string;
  label: string;
  score: number; // 0-100
  weight: number;
  detail: string;
}

export interface HealthReport {
  shopName: string;
  overallScore: number; // 0-100
  verdict: "healthy" | "watch" | "critical";
  dimensions: DimensionScore[];
  summary: string;
  recommendations: string[];
  engine: "mock" | "llm";
}
