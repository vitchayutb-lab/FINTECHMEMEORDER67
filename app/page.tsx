"use client";

import { useState, useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import PriceTable from "@/components/PriceTable";
import OrderTicket from "@/components/OrderTicket";
import { usePrices } from "@/lib/hooks";
import type { MemeCoin, OrderSide } from "@/lib/types";

const CATEGORIES = ["All", "Meme", "Layer 1 / 2", "DeFi", "AI", "Gaming"];

export default function DashboardPage() {
  const { coins = [], loading, error, keyless } = usePrices();
  const [order, setOrder] = useState<{ coin: MemeCoin; side: OrderSide } | null>(null);

  // 1. เก็บ State ช่องค้นหา และ หมวดหมู่ไว้ที่ DashboardPage เพื่อไม่ให้โดน Reset
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // 2. กรองข้อมูลเหรียญด้วย useMemo (Client-side In-Memory Filtering)
  const filteredCoins = useMemo(() => {
    const safeCoins = Array.isArray(coins) ? coins : [];
    return safeCoins.filter((coin) => {
      if (!coin) return false;

      // กรองหมวดหมู่ (หากมีฟิลด์ category)
      const matchesCategory =
        selectedCategory === "All" || (coin.category || "General") === selectedCategory;

      // กรองชื่อเหรียญ หรือ สัญลักษณ์ (Symbol)
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        q === "" ||
        (coin.name && coin.name.toLowerCase().includes(q)) ||
        (coin.symbol && coin.symbol.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [coins, searchQuery, selectedCategory]);

  // เช็กว่าเป็นการโหลดข้อมูลครั้งแรกสุดหรือไม่ (เพื่อไม่ให้ unmount ตารางตอน re-fetch)
  const isInitialLoading = loading && coins.length === 0;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-cream">Meme coin board</h1>
        <p className="text-sm text-cream-dim mt-1">
          Live prices from CoinMarketCap. Every buy and sell here is simulated against a $10,000 paper
          balance — fire away.
        </p>
      </div>

      {keyless && (
        <div className="flex items-start gap-2 border border-amber-dim bg-amber/10 px-3 py-2.5 text-xs text-amber-soft">
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          <span>
            Running on CoinMarketCap&rsquo;s free keyless endpoint (low rate limit). Add a free
            <code className="mx-1 px-1 bg-void/40">CMC_API_KEY</code> to <code className="px-1 bg-void/40">.env.local</code> for
            smoother refreshes — see the README.
          </span>
        </div>
      )}

      {error && coins.length === 0 && (
        <div className="flex items-start gap-2 border border-loss-dim bg-loss/10 px-3 py-2.5 text-xs text-loss">
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* แถบควบคุม Search & Category Filter */}
      {!isInitialLoading && (
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
          {/* ช่องค้นหา */}
          <div className="relative flex-1 max-w-xs">
            <input
              type="text"
              placeholder="Filter by name or symbol..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-1.5 bg-void border border-line text-xs text-cream placeholder-cream-dim focus:outline-none focus:border-amber-soft"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1.5 text-cream-dim hover:text-cream text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* ปุ่มสลับหมวดหมู่ */}
          <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 text-xs whitespace-nowrap border transition-colors ${
                  selectedCategory === cat
                    ? "border-amber bg-amber/20 text-amber font-semibold"
                    : "border-line bg-panel text-cream-dim hover:text-cream hover:border-line-bright"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* แสดงตารางเหรียญที่ผ่านการกรองแล้ว */}
      {isInitialLoading ? (
        <div className="border border-line bg-panel px-4 py-16 text-center text-cream-dim text-sm">
          Loading meme coin board…
        </div>
      ) : (
        <PriceTable coins={filteredCoins} onOrder={(coin, side) => setOrder({ coin, side })} />
      )}

      {order && (
        <OrderTicket
          coin={order.coin}
          side={order.side}
          onSideChange={(side) => setOrder({ coin: order.coin, side })}
          onClose={() => setOrder(null)}
        />
      )}
    </div>
  );
}