"use client";

import { useState, useEffect, useCallback } from "react";
import type { MemeCoin, Portfolio } from "@/lib/types";

const CATEGORIES = ["All", "Meme", "Layer 1 / 2", "DeFi", "AI", "Gaming"];

export default function Home() {
  const [coins, setCoins] = useState<MemeCoin[]>([]);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Category State
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Trade Drawer State
  const [selectedCoin, setSelectedCoin] = useState<MemeCoin | null>(null);
  const [tradeSide, setTradeSide] = useState<"buy" | "sell">("buy");
  const [tradeMode, setTradeMode] = useState<"usd" | "quantity">("usd");
  const [tradeAmount, setTradeAmount] = useState<string>("");
  const [tradeLoading, setTradeLoading] = useState<boolean>(false);
  const [tradeError, setTradeError] = useState<string | null>(null);

  // 1. Fetch Price Data & Portfolio
  const fetchData = useCallback(async () => {
    try {
      const [pricesRes, portfolioRes] = await Promise.all([
        fetch("/api/prices"),
        fetch("/api/portfolio"),
      ]);

      if (!pricesRes.ok) throw new Error("Failed to load live prices");
      const pricesData = await pricesRes.json();
      setCoins(pricesData.coins || []);

      if (portfolioRes.ok) {
        const portfolioData = await portfolioRes.json();
        setPortfolio(portfolioData.portfolio || null);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30_000); // Auto-refresh prices every 30s
    return () => clearInterval(interval);
  }, [fetchData]);

  // 2. Reset Portfolio
  const handleResetPortfolio = async () => {
    if (!confirm("Are you sure you want to reset your paper portfolio to $10,000?")) return;
    try {
      const res = await fetch("/api/portfolio", { method: "DELETE" });
      if (res.ok) {
        const data = await res.json();
        setPortfolio(data.portfolio);
      }
    } catch {
      alert("Failed to reset portfolio.");
    }
  };

  // 3. Execute Trade Order
  const handleExecuteTrade = async () => {
    if (!selectedCoin || !tradeAmount || parseFloat(tradeAmount) <= 0) return;
    setTradeLoading(true);
    setTradeError(null);

    try {
      const res = await fetch("/api/trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          side: tradeSide,
          coinId: selectedCoin.id,
          symbol: selectedCoin.symbol,
          name: selectedCoin.name,
          price: selectedCoin.price,
          amount: parseFloat(tradeAmount),
          mode: tradeMode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Trade failed");
      }

      setPortfolio(data.portfolio);
      setTradeAmount("");
      setSelectedCoin(null); // Close Drawer
    } catch (err) {
      setTradeError(err instanceof Error ? err.message : "Trade failed");
    } finally {
      setTradeLoading(false);
    }
  };

  // 4. Client-side Safe In-Memory Filtering (No reload on search)
  const safeCoins = Array.isArray(coins) ? coins : [];
  const filteredCoins = safeCoins.filter((coin) => {
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

  // Calculate user holding for currently selected coin
  const userHolding = portfolio?.holdings?.find((h) => h.coinId === selectedCoin?.id);

  return (
    <div className="min-h-screen bg-black text-neutral-100 font-sans p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Bar */}
        <header className="flex flex-wrap justify-between items-center gap-4 pb-4 border-b border-neutral-800">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-amber-500">
              PAPER TERMINAL <span className="text-xs text-neutral-500 font-normal">SIM</span>
            </h1>
            <p className="text-xs text-neutral-400">
              Live prices from CoinMarketCap. Simulated paper trading terminal.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800 rounded">
              PAPER MODE
            </span>
            <button
              onClick={handleResetPortfolio}
              className="px-3 py-1 text-xs bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 rounded transition-colors"
            >
              Reset
            </button>
          </div>
        </header>

        {/* Error Alert */}
        {error && (
          <div className="p-3 text-sm bg-red-950/60 border border-red-800/80 text-red-300 rounded-lg">
            ⚠️ {error}
          </div>
        )}

        {/* Controls: Search Bar & Category Filter */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          {/* Search Input (In-Memory Filter) */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Filter by name or symbol..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-2.5 text-neutral-500 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Categories Tab */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 md:pb-0">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? "bg-amber-500 text-black font-bold"
                    : "bg-neutral-900 text-neutral-400 hover:bg-neutral-800 hover:text-white border border-neutral-800/60"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Main Table */}
        <div className="overflow-x-auto border border-neutral-800 rounded-xl bg-neutral-950">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-900/40 text-neutral-400 text-xs uppercase tracking-wider">
                <th className="py-3 px-4">Coin</th>
                <th className="py-3 px-4 text-right">Price</th>
                <th className="py-3 px-4 text-right">1h</th>
                <th className="py-3 px-4 text-right">24h</th>
                <th className="py-3 px-4 text-right">7d</th>
                <th className="py-3 px-4 text-right">Mkt Cap</th>
                <th className="py-3 px-4 text-center">Order</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/50 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-500">
                    Loading market prices...
                  </td>
                </tr>
              ) : filteredCoins.length > 0 ? (
                filteredCoins.map((coin) => (
                  <tr key={coin.id} className="hover:bg-neutral-900/50 transition-colors">
                    <td className="py-3 px-4 flex items-center gap-3">
                      <img
                        src={coin.logoUrl}
                        alt={coin.name}
                        className="w-6 h-6 rounded-full bg-neutral-800"
                      />
                      <div>
                        <span className="font-semibold text-white block">{coin.name}</span>
                        <span className="text-xs text-neutral-500 uppercase">{coin.symbol}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-white">
                      ${coin.price < 0.01 ? coin.price.toFixed(6) : coin.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className={`py-3 px-4 text-right font-mono text-xs ${(coin.percentChange1h ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {(coin.percentChange1h ?? 0) >= 0 ? "+" : ""}{coin.percentChange1h?.toFixed(2)}%
                    </td>
                    <td className={`py-3 px-4 text-right font-mono text-xs ${(coin.percentChange24h ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {(coin.percentChange24h ?? 0) >= 0 ? "+" : ""}{coin.percentChange24h?.toFixed(2)}%
                    </td>
                    <td className={`py-3 px-4 text-right font-mono text-xs ${(coin.percentChange7d ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {(coin.percentChange7d ?? 0) >= 0 ? "+" : ""}{coin.percentChange7d?.toFixed(2)}%
                    </td>
                    <td className="py-3 px-4 text-right text-neutral-400 font-mono text-xs">
                      ${((coin.marketCap ?? 0) / 1e9).toFixed(2)}B
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedCoin(coin);
                            setTradeSide("buy");
                          }}
                          className="px-2.5 py-1 text-xs bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 rounded border border-emerald-700/50 transition-colors"
                        >
                          Buy
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCoin(coin);
                            setTradeSide("sell");
                          }}
                          className="px-2.5 py-1 text-xs bg-rose-900/60 hover:bg-rose-800 text-rose-300 rounded border border-rose-700/50 transition-colors"
                        >
                          Sell
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-500">
                    No coins match "{searchQuery}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Trade Drawer / Modal */}
        {selectedCoin && (
          <div className="fixed inset-y-0 right-0 w-full max-w-md bg-neutral-900 border-l border-neutral-800 p-6 shadow-2xl z-50 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center pb-4 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <img src={selectedCoin.logoUrl} alt={selectedCoin.name} className="w-6 h-6 rounded-full" />
                  <h3 className="font-bold text-white">{selectedCoin.name} ({selectedCoin.symbol})</h3>
                </div>
                <button
                  onClick={() => setSelectedCoin(null)}
                  className="text-neutral-500 hover:text-white text-lg"
                >
                  ✕
                </button>
              </div>

              {/* Trade Side Selector */}
              <div className="grid grid-cols-2 gap-2 my-4">
                <button
                  onClick={() => setTradeSide("buy")}
                  className={`py-2 text-sm font-bold rounded-lg ${
                    tradeSide === "buy" ? "bg-emerald-600 text-white" : "bg-neutral-800 text-neutral-400"
                  }`}
                >
                  Buy
                </button>
                <button
                  onClick={() => setTradeSide("sell")}
                  className={`py-2 text-sm font-bold rounded-lg ${
                    tradeSide === "sell" ? "bg-rose-600 text-white" : "bg-neutral-800 text-neutral-400"
                  }`}
                >
                  Sell
                </button>
              </div>

              {/* Balance Specs */}
              <div className="text-xs text-neutral-400 space-y-1 mb-4">
                <div className="flex justify-between">
                  <span>Available cash:</span>
                  <span className="text-white font-mono">${portfolio?.cash?.toFixed(2) || "10,000.00"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Held quantity:</span>
                  <span className="text-white font-mono">
                    {userHolding ? userHolding.quantity : 0} {selectedCoin.symbol}
                  </span>
                </div>
              </div>

              {/* Input Amount */}
              <div className="space-y-2">
                <label className="text-xs text-neutral-400 block">Amount ({tradeMode.toUpperCase()})</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={tradeAmount}
                  onChange={(e) => setTradeAmount(e.target.value)}
                  className="w-full p-3 bg-black border border-neutral-800 rounded-lg text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              {tradeError && (
                <div className="mt-3 p-2.5 text-xs bg-red-950/80 border border-red-800 text-red-300 rounded">
                  {tradeError}
                </div>
              )}
            </div>

            {/* Submit Action Button */}
            <button
              onClick={handleExecuteTrade}
              disabled={tradeLoading || !tradeAmount || parseFloat(tradeAmount) <= 0}
              className={`w-full py-3 rounded-lg font-bold text-sm transition-colors ${
                tradeSide === "buy"
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white disabled:bg-neutral-800"
                  : "bg-rose-600 hover:bg-rose-500 text-white disabled:bg-neutral-800"
              }`}
            >
              {tradeLoading ? "Executing..." : `Fire ${tradeSide} order`}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}