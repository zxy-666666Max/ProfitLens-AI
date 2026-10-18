"use client";

import type { ShopData } from "@/lib/types";

export default function ShopSelect({
  shops,
  value,
  onChange,
}: {
  shops: ShopData[];
  value: string;
  onChange: (name: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
    >
      {shops.map((s) => (
        <option key={s.name} value={s.name}>
          {s.name}
        </option>
      ))}
    </select>
  );
}