"use client";

import { useState } from "react";
import ChatPanel from "@/components/chat-panel";
import ShopSelect from "@/components/shop-select";
import EmptyState from "@/components/empty-state";
import { useAccountShops } from "@/lib/account-shops";

export default function ChatPage() {
  const { loading, shops } = useAccountShops();
  const [shopName, setShopName] = useState("");
  const shop = shops.find((s) => s.name === shopName) ?? shops[0];

  if (loading) return null;
  if (!shop) return <EmptyState />;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">AI assistant</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Ask questions about your sales, stock and shop health.
          </p>
        </div>
        {shops.length > 1 && <ShopSelect shops={shops} value={shop.name} onChange={setShopName} />}
      </div>
      <ChatPanel key={shop.name} shop={shop} />
    </div>
  );
}