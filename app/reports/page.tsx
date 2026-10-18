"use client";

import { useEffect, useState } from "react";
import ShopSelect from "@/components/shop-select";
import { getHealthReport } from "@/lib/api";
import { expected } from "@/lib/shops";
import type { HealthReport } from "@/lib/types";
import { useAccountShops } from "@/lib/account-shops";
import EmptyState from "@/components/empty-state";

const verdictStyles = {
  healthy: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  watch: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  critical: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
} as const;

function barColor(score: number) {
  if (score >= 70) return "bg-emerald-500";
  if (score >= 50) return "bg-amber-500";
  return "bg-red-500";
}

export default function ReportsPage() {
const { loading: shopsLoading, shops } = useAccountShops();
const [shopName, setShopName] = useState("");
const [run, setRun] = useState(0);
const [result, setResult] = useState<{
  key: string;
  report: HealthReport | null;
  error: string;
} | null>(null);

const shop = shops.find((s) => s.name === shopName) ?? shops[0];
const ref = shop ? expected[shop.name] : undefined;

const key = shop ? `${shop.name}:${run}` : "";
const current = result?.key === key ? result : null;
const loading = shopsLoading || (shop ? current === null : false);
const report = current?.report ?? null;
const error = current?.error ?? "";

useEffect(() => {
  if (!shop) return;
  let cancelled = false;
  getHealthReport(shop)
    .then((r) => {
      if (!cancelled) setResult({ key, report: r, error: "" });
    })
    .catch(() => {
      if (!cancelled)
        setResult({ key, report: null, error: "Could not load the report. Please try again." });
    });
  return () => {
    cancelled = true;
  };
}, [shop, key]);

if (!shopsLoading && !shop) return <EmptyState />;

  const inRange =
    report && ref
      ? report.overallScore >= ref.expectedOverallRange[0] && report.overallScore <= ref.expectedOverallRange[1]
      : null;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Business health report</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Scores, analysis and recommendations for your shop.
          </p>
        </div>
        <div className="flex gap-3">
          {shops.length > 1 && (
  <ShopSelect shops={shops} value={shop?.name ?? ""} onChange={setShopName} />
)}
          <button
            onClick={() => setRun((n) => n + 1)}
            disabled={loading}
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
          >
            {loading ? "Analyzing..." : "Re-run"}
          </button>
        </div>
      </div>

      {loading && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Analyzing {shop.name}. This can take up to a minute with the AI model...
        </p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {report && (
        <>
          <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-5xl font-semibold tracking-tight">{report.overallScore}</span>
              <span className="text-sm text-zinc-500 dark:text-zinc-400">/ 100</span>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${verdictStyles[report.verdict]}`}>
                {report.verdict}
              </span>
              <span className="ml-auto rounded-full border border-zinc-200 px-2.5 py-1 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                {report.engine === "llm" ? "AI analysis" : "Rule-based analysis"}
              </span>
            </div>
            <p className="mt-4 text-sm leading-6">{report.summary}</p>
            {ref && (
              <p className={`mt-3 text-xs ${inRange ? "text-emerald-600" : "text-amber-600"}`}>
                Reference: {ref.referenceOverall} (expected {ref.expectedOverallRange[0]}-{ref.expectedOverallRange[1]},{" "}
                {ref.expectedVerdict}) · {inRange ? "within range" : "outside expected range"}
              </p>
            )}
          </section>

          <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="mb-4 text-base font-semibold">Dimensions</h2>
            <ul className="flex flex-col gap-5">
              {report.dimensions.map((d) => (
                <li key={d.key}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium">{d.label}</span>
                    <span className="text-zinc-500 dark:text-zinc-400">
                      {d.score}
                      {ref?.referenceDimensions[d.key] !== undefined && (
                        <span className="ml-1 text-xs">(ref {ref.referenceDimensions[d.key]})</span>
                      )}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div className={`h-full rounded-full ${barColor(d.score)}`} style={{ width: `${d.score}%` }} />
                  </div>
                  <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">{d.detail}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="mb-3 text-base font-semibold">Recommendations</h2>
            <ul className="list-disc space-y-2 pl-5 text-sm">
              {report.recommendations.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}