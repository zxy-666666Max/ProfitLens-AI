export const metrics = [
  { label: "Revenue (30d)", value: "$12,480", change: "+8.2%", trend: "up" as const },
  { label: "Orders", value: "342", change: "+4.1%", trend: "up" as const },
  { label: "Avg. order value", value: "$36.50", change: "-2.3%", trend: "down" as const },
  { label: "Refund rate", value: "3.4%", change: "+0.6%", trend: "down" as const },
];

export const salesData = [
  { label: "May", sales: 8200 },
  { label: "Jun", sales: 9100 },
  { label: "Jul", sales: 8700 },
  { label: "Aug", sales: 10400 },
  { label: "Sep", sales: 11600 },
  { label: "Oct", sales: 12480 },
];

export const healthScore = {
  overall: 72,
  verdict: "healthy",
  dimensions: [
    { key: "price", label: "Price Competitiveness", score: 85 },
    { key: "reviews", label: "Review Quality", score: 78 },
    { key: "salesTrend", label: "Sales Trend", score: 70 },
    { key: "listings", label: "Listing Completeness", score: 55 },
    { key: "service", label: "Service Quality", score: 66 },
    { key: "activity", label: "Recent Activity", score: 92 },
  ],
};

export const alerts = [
  {
    id: 1,
    title: "Low stock: Ceramic mug set",
    description: "Only 6 units left, selling about 2 per day.",
    severity: "high" as const,
  },
  {
    id: 2,
    title: "Refund rate is rising",
    description: "Refunds went up from 2.8% to 3.4% this month.",
    severity: "medium" as const,
  },
  {
    id: 3,
    title: "9 listings missing photos",
    description: "Adding 3+ photos usually improves conversion.",
    severity: "low" as const,
  },
];