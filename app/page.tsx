"use client";

import { useState, useMemo, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import PriceTable from "@/components/PriceTable";
import OrderTicket from "@/components/OrderTicket";
import { usePrices } from "@/lib/hooks";
import type { MemeCoin, OrderSide, Portfolio } from "@/lib/types";

const CATEGORIES = ["All", "Meme", "Layer 1 / 2", "DeFi", "AI", "Gaming"];
const PORTFOLIO_STORAGE_KEY = "paper_terminal_portfolio";

export default function DashboardPage() {
  const { coins = [], loading, error, keyless } = usePrices();
  const [order, setOrder] = useState<{ coin: MemeCoin; side: OrderSide } | null>(null);

  // 1. ช่องค้นหาหลักเพียงช่องเดียว + Category State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // 2. ดึง/บันทึกพอร์ตลง LocalStorage ป้องกันเงิน Demo $10,000 Reset
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(PORTFOLIO_STORAGE_KEY);
      if (saved) {
        setPortfolio(JSON.parse(saved));
      }
    } catch {
      // Ignore
    }
  }, []);

  const handlePortfolioUpdate = (newPortfolio: Portfolio) => {
    setPortfolio(newPortfolio);
    try {
      localStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(newPortfolio));
    } catch {
      // Ignore
    }
  };

  // 3. กรองข้อมูลเหรียญใน Memory ฝั่ง Client (ไม่ทำให้หน้าเว็บ Reload)
  const filteredCoins = useMemo(() => {
    const safeCoins = Array.isArray(coins) ? coins : [];
    return safeCoins.filter((coin) => {
      if (!coin) return false;

      const matchesCategory =
        selectedCategory === "All" || (coin.category || "General") === selectedCategory;

      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        q === "" ||
        (coin.name && coin.name.toLowerCase().includes(q)) ||
        (coin.symbol && coin.symbol.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [coins, searchQuery, selectedCategory]);

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

      {/* แถบควบคุมหลัก: ช่อง Search เดียว + ปุ่ม Category */}
      {!isInitialLoading && (
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
          {/* ช่องค้นหาเพียงช่องเดียว */}
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

      {/* ตารางแสดงผล */}
      {isInitialLoading ? (
        <div className="border border-line bg-panel px-4 py-16 text-center text-cream-dim text-sm">
          Loading meme coin board…
        </div>
      ) : (
        <PriceTable
          coins={filteredCoins}
          onOrder={(coin, side) => setOrder({ coin, side })}
        />
      )}

      {order && (
        <OrderTicket
          coin={order.coin}
          side={order.side}
          currentPortfolio={portfolio}
          onPortfolioUpdate={handlePortfolioUpdate}
          onSideChange={(side) => setOrder({ coin: order.coin, side })}
          onClose={() => setOrder(null)}
        />
      )}
    </div>
  );
}