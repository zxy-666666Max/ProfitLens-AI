"use client";

import { useMemo, useRef, useState } from "react";
import MetricCard from "@/components/metric-card";
import ShopSelect from "@/components/shop-select";
import EmptyState from "@/components/empty-state";
import { useAccountShops } from "@/lib/account-shops";
import { useSession } from "@/lib/auth";
import { buildInventory, type InventoryItem } from "@/lib/inventory";
import {
  newId,
  parseProductsCsv,
  saveProducts,
  toInventoryItem,
  useAccountProducts,
  type StoredProduct,
} from "@/lib/product-store";

const statusMeta: Record<InventoryItem["status"], { label: string; className: string }> = {
  out: { label: "Out of stock", className: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300" },
  reorder: { label: "Reorder soon", className: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
  slow: { label: "Slow mover", className: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300" },
  ok: { label: "Healthy", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" },
};

const urgency: Record<InventoryItem["status"], number> = { out: 0, reorder: 1, slow: 2, ok: 3 };

const filters = [
  { key: "all", label: "All" },
  { key: "reorder", label: "Needs reorder" },
  { key: "slow", label: "Slow movers" },
  { key: "best", label: "Best sellers" },
] as const;
type FilterKey = (typeof filters)[number]["key"];

interface FormState {
  name: string;
  price: string;
  stock: string;
  sold30d: string;
}

const emptyForm: FormState = { name: "", price: "", stock: "", sold30d: "" };

function ProductForm({
  editingId,
  form,
  setForm,
  error,
  onSubmit,
  onCancel,
}: {
  editingId: string | null;
  form: FormState;
  setForm: (f: FormState) => void;
  error: string | null;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  const field =
    "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900";

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="text-sm font-semibold">{editingId ? "Edit product" : "Add a product"}</h2>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        {editingId
          ? "Update the product's details."
          : "Enter products you actually sell — this is your own data, kept in your browser."}
      </p>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Product name</span>
          <input
            value={form.name}
            maxLength={60}
            placeholder="e.g. Ceramic vase"
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={field}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Price ($)</span>
          <input
            value={form.price}
            type="number"
            min={0}
            step="0.01"
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className={field}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">In stock</span>
          <input
            value={form.stock}
            type="number"
            min={0}
            onChange={(e) => setForm({ ...form, stock: e.target.value })}
            className={field}
          />
        </label>
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Sold in last 30 days</span>
          <input
            value={form.sold30d}
            type="number"
            min={0}
            onChange={(e) => setForm({ ...form, sold30d: e.target.value })}
            className={field}
          />
        </label>
      </div>
      {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
      <div className="mt-4 flex gap-3">
        <button
          onClick={onSubmit}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-black dark:hover:bg-zinc-300"
        >
          {editingId ? "Save changes" : "Add product"}
        </button>
        <button
          onClick={onCancel}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          Cancel
        </button>
      </div>
    </section>
  );
}

export default function InventoryPage() {
  const { loading: shopsLoading, shops } = useAccountShops();
  const { loading: productsLoading, isDemo, products } = useAccountProducts();
  const session = useSession();
  const email = session?.email;
  const [shopName, setShopName] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [csvNote, setCsvNote] = useState<string | null>(null);
  const csvRef = useRef<HTMLInputElement>(null);

  const loading = shopsLoading || productsLoading;
  const shop = shops.find((s) => s.name === shopName) ?? shops[0];

  const items = useMemo<InventoryItem[]>(() => {
    if (isDemo) return shop ? buildInventory(shop) : [];
    return products.map(toInventoryItem);
  }, [isDemo, shop, products]);

  function resetForm() {
    setFormOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
  }

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setFormOpen(true);
  }

  function openEdit(p: StoredProduct) {
    setEditingId(p.id);
    setForm({ name: p.name, price: String(p.price), stock: String(p.stock), sold30d: String(p.sold30d) });
    setFormError(null);
    setFormOpen(true);
  }

  function submitForm() {
    if (!email) return;
    const name = form.name.trim();
    const price = Number(form.price);
    const stock = Number(form.stock);
    const sold30d = Number(form.sold30d);
    if (!name) {
      setFormError("Please enter the product name.");
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      setFormError("Price must be a number of 0 or more.");
      return;
    }
    if (!Number.isInteger(stock) || stock < 0) {
      setFormError("In stock must be a whole number of 0 or more.");
      return;
    }
    if (!Number.isInteger(sold30d) || sold30d < 0) {
      setFormError("Sold in last 30 days must be a whole number of 0 or more.");
      return;
    }
    const next = editingId
      ? products.map((p) => (p.id === editingId ? { ...p, name, price, stock, sold30d } : p))
      : [{ id: newId(), name, price, stock, sold30d }, ...products];
    saveProducts(email, next);
    resetForm();
  }

  function deleteProduct(id: string) {
    if (!email) return;
    saveProducts(email, products.filter((p) => p.id !== id));
    if (editingId === id) resetForm();
  }

  function importCsv(file: File) {
    if (!email) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      const { products: imported, skipped } = parseProductsCsv(text);
      if (imported.length === 0) {
        setCsvNote("No valid rows found in that file.");
        return;
      }
      saveProducts(email, [...imported, ...products]);
      setCsvNote(
        `Imported ${imported.length} product(s)${skipped ? `, skipped ${skipped} invalid row(s)` : ""}.`
      );
    };
    reader.readAsText(file);
  }

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
            {isDemo
              ? `Stock levels, fast sellers and items to reorder for ${shop.name}.`
              : `Your products for ${shop.name} — add, edit and track stock levels.`}
          </p>
        </div>
        {shops.length > 1 && <ShopSelect shops={shops} value={shop.name} onChange={setShopName} />}
      </div>

      {!isDemo && (
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={openAdd}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-black dark:hover:bg-zinc-300"
          >
            Add product
          </button>
          <button
            onClick={() => csvRef.current?.click()}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            Import CSV
          </button>
          <input
            ref={csvRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importCsv(f);
              e.target.value = "";
            }}
          />
          {csvNote && <span className="text-xs text-zinc-500 dark:text-zinc-400">{csvNote}</span>}
        </div>
      )}

      {formOpen && !isDemo && (
        <ProductForm
          editingId={editingId}
          form={form}
          setForm={setForm}
          error={formError}
          onSubmit={submitForm}
          onCancel={resetForm}
        />
      )}

      {items.length === 0 ? (
        isDemo ? (
          <div className="rounded-xl border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            This shop has no products yet.
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-zinc-300 p-10 text-center dark:border-zinc-700">
            <p className="font-medium">No products yet — add your first one.</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
              Enter products you sell (or import a CSV) and ProfitLens will rank what to reorder.
            </p>
            <button
              onClick={openAdd}
              className="mt-4 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-black dark:hover:bg-zinc-300"
            >
              Add your first product
            </button>
          </div>
        )
      ) : (
        <>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Products"
              value={String(items.length)}
              change={isDemo ? `${shop.listingCount} total listings` : "Your entered products"}
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
                    {!isDemo && <th className="px-4 py-3 font-medium" aria-label="Actions" />}
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
                      {!isDemo && (
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => {
                              const p = products.find((x) => x.id === item.id);
                              if (p) openEdit(p);
                            }}
                            className="text-sm font-medium text-zinc-600 hover:underline dark:text-zinc-400"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteProduct(item.id)}
                            className="ml-3 text-sm font-medium text-red-600 hover:underline dark:text-red-400"
                          >
                            Delete
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {visible.length === 0 && (
                    <tr>
                      <td colSpan={isDemo ? 6 : 7} className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400">
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
