"use client";

import { useMemo, useState } from "react";
import MetricCard from "@/components/metric-card";
import ShopSelect from "@/components/shop-select";
import EmptyState from "@/components/empty-state";
import { useAccountShops } from "@/lib/account-shops";
import { buildInventory, type StockStatus } from "@/lib/inventory";

const statusMeta: Record<StockStatus, { label: string; className: string }> = {
  out: { label: "Out of stock", className: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300" },
  reorder: { label: "Reorder soon", className: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
  slow: { label: "Slow mover", className: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300" },
  ok: { label: "Healthy", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" },
};

const urgency: Record<StockStatus, number> = { out: 0, reorder: 1, slow: 2, ok: 3 };

const filters = [
  { key: "all", label: "All" },
  { key: "reorder", label: "Needs reorder" },
  { key: "slow", label: "Slow movers" },
  { key: "best", label: "Best sellers" },
] as const;
type FilterKey = (typeof filters)[number]["key"];

export default function InventoryPage() {
  const { loading, shops } = useAccountShops();
  const [shopName, setShopName] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");

  const shop = shops.find((s) => s.name === shopName) ?? shops[0];
  const items = useMemo(() => (shop ? buildInventory(shop) : []), [shop]);

  if (loading) return null;
  if (!shop) return <EmptyState />;

  const needsReorder = items.filter((i) => i.status === "out" || i.status === "reorder");
  const outCount = items.filter((i) => i.status === "out").length;
  const slowCount = items.filter((i) => i.status === "slow").length;
  const unitsInStock = items.reduce((sum, i) => sum + i.stock, 0);
  const stockValue = items.reduce((sum, i) => sum + i.stock * i.price, 0);

  let visible = [...items].sort(
    (a, b) => urgency[a.status] - urgency[b.status] || (a.daysLeft ?? 9999) - (b.daysLeft ?? 9999)
  );
  if (filter === "reorder") visible = visible.filter((i) => i.status === "out" || i.status === "reorder");
  if (filter === "slow") visible = visible.filter((i) => i.status === "slow");
  if (filter === "best") visible = [...items].sort((a, b) => b.sold30d - a.sold30d).slice(0, 5);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Inventory insights</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Stock levels, fast sellers and items to reorder for {shop.name}.
          </p>
        </div>
        {shops.length > 1 && <ShopSelect shops={shops} value={shop.name} onChange={setShopName} />}
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          This shop has no products yet.
        </div>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Products"
              value={String(items.length)}
              change={`${shop.listingCount} total listings`}
              trend="up"
            />
            <MetricCard
              label="Units in stock"
              value={unitsInStock.toLocaleString()}
              change={`Worth $${Math.round(stockValue).toLocaleString()}`}
              trend="up"
            />
            <MetricCard
              label="Needs reorder"
              value={String(needsReorder.length)}
              change={`${outCount} out of stock`}
              trend={needsReorder.length === 0 ? "up" : "down"}
            />
            <MetricCard
              label="Slow movers"
              value={String(slowCount)}
              change="Overstocked or not selling"
              trend={slowCount <= 1 ? "up" : "down"}
            />
          </section>

          <section className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex flex-wrap gap-2 border-b border-zinc-100 p-4 dark:border-zinc-900">
              {filters.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    filter === f.key
                      ? "bg-zinc-900 text-white dark:bg-white dark:text-black"
                      : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="text-xs uppercase text-zinc-500 dark:text-zinc-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Product</th>
                    <th className="px-4 py-3 font-medium">Price</th>
                    <th className="px-4 py-3 font-medium">In stock</th>
                    <th className="px-4 py-3 font-medium">Sold (30d)</th>
                    <th className="px-4 py-3 font-medium">Days left</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
                  {visible.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 font-medium">{item.name}</td>
                      <td className="px-4 py-3">${item.price.toFixed(2)}</td>
                      <td className="px-4 py-3">{item.stock}</td>
                      <td className="px-4 py-3">{item.sold30d}</td>
                      <td className="px-4 py-3">
                        {item.daysLeft === null ? "-" : item.daysLeft > 999 ? "999+" : Math.round(item.daysLeft)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusMeta[item.status].className}`}>
                          {statusMeta[item.status].label}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {visible.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400">
                        Nothing in this category.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}