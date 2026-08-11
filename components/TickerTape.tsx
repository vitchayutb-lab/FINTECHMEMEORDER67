"use client";

import { usePrices } from "@/lib/hooks";
import { formatPercent, formatPrice } from "@/lib/format";

export default function TickerTape() {
  const { coins, loading, error } = usePrices();

  if (error && coins.length === 0) {
    return (
      <div className="bg-panel border-b border-line px-4 py-2 text-xs text-loss font-mono">
        ⚠ {error}
      </div>
    );
  }

  if (loading && coins.length === 0) {
    return (
      <div className="bg-panel border-b border-line px-4 py-2 text-xs text-cream-dim font-mono">
        connecting to CoinMarketCap<span className="cursor-blink">▋</span>
      </div>
    );
  }

  const strip = coins.slice(0, 24);
  const items = [...strip, ...strip]; // duplicated for seamless -50% loop

  return (
    <div className="crt-scanlines bg-panel border-b border-line overflow-hidden whitespace-nowrap">
      <div className="ticker-track inline-flex w-max">
        {items.map((c, i) => (
          <span key={`${c.id}-${i}`} className="inline-flex items-center gap-2 px-4 py-2 text-xs border-r border-line/60">
            <span className="text-cream-dim">{c.symbol}</span>
            <span className="text-cream tabular-nums">{formatPrice(c.price)}</span>
            <span
              className={
                "tabular-nums " +
                (c.percentChange24h === null
                  ? "text-cream-dim"
                  : c.percentChange24h >= 0
                    ? "text-gain"
                    : "text-loss")
              }
            >
              {formatPercent(c.percentChange24h)}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
