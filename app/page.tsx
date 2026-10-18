"use client";

import { useState } from "react";
import Link from "next/link";
import MetricCard from "@/components/metric-card";
import SalesChart from "@/components/sales-chart";
import ShopSelect from "@/components/shop-select";
import { expected, deriveMetrics, deriveAlerts, DIMENSION_LABELS } from "@/lib/shops";
import { useAccountShops } from "@/lib/account-shops";
import EmptyState from "@/components/empty-state";

const severityStyles = {
  high: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  low: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
} as const;

function scoreColor(score: number) {
  if (score >= 70) return "bg-emerald-500";
  if (score >= 50) return "bg-amber-500";
  return "bg-red-500";
}

export default function DashboardPage() {
const { loading, shops } = useAccountShops();
const [shopName, setShopName] = useState("");
const shop = shops.find((s) => s.name === shopName) ?? shops[0];

if (loading) return null;
if (!shop) return <EmptyState />;

const metrics = deriveMetrics(shop);
const alerts = deriveAlerts(shop);
const ref = expected[shop.name];
const salesData = [
  { label: "Previous 30d", sales: shop.salesPrev30d },
  { label: "Last 30d", sales: shop.sales30d },
];

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            A quick look at how {shop.name} is doing.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {shops.length > 1 && (
  <ShopSelect shops={shops} value={shop.name} onChange={setShopName} />
)}
          <Link
            href="/upload"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            Upload receipt
          </Link>
          <Link
            href="/reports"
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900"
          >
            View report
          </Link>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((m) => (
          <MetricCard key={m.label} {...m} />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950 lg:col-span-2">
          <h2 className="text-base font-semibold">Sales trend</h2>
          <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">Previous 30 days vs last 30 days</p>
          <SalesChart data={salesData} />
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-base font-semibold">Business health</h2>
          {ref ? (
            <>
              <div className="mt-4 flex items-end gap-2">
                <span className="text-5xl font-semibold tracking-tight">{ref.referenceOverall}</span>
                <span className="pb-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                  / 100 · {ref.expectedVerdict}
                </span>
              </div>
              <ul className="mt-6 flex flex-col gap-4">
                {Object.entries(ref.referenceDimensions).map(([key, score]) => (
                  <li key={key}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span>{DIMENSION_LABELS[key] ?? key}</span>
                      <span className="text-zinc-500 dark:text-zinc-400">{score}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                      <div className={`h-full rounded-full ${scoreColor(score)}`} style={{ width: `${score}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
              No reference scores for this shop. Open the Reports page to score it.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-4 text-base font-semibold">Needs your attention</h2>
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-900">
          {alerts.map((a) => (
            <li key={a.id} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
              <div>
                <p className="text-sm font-medium">{a.title}</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{a.description}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${severityStyles[a.severity]}`}>
                {a.severity}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}