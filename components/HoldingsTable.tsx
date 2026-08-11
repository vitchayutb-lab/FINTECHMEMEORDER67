"use client";

import Image from "next/image";
import type { MemeCoin, Portfolio } from "@/lib/types";
import { formatPercent, formatPrice, formatQty, formatUsd } from "@/lib/format";

interface Props {
  portfolio: Portfolio;
  coins: MemeCoin[];
  onSell: (coin: MemeCoin) => void;
}

export default function HoldingsTable({ portfolio, coins, onSell }: Props) {
  const coinsById = new Map(coins.map((c) => [c.id, c]));
  const holdings = portfolio.holdings.filter((h) => h.quantity > 0);

  if (holdings.length === 0) {
    return (
      <div className="border border-line bg-panel px-4 py-10 text-center text-sm text-cream-dim">
        No positions yet — head to the Dashboard and fire your first paper trade.
      </div>
    );
  }

  return (
    <div className="border border-line bg-panel overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wider text-cream-dim border-b border-line">
            <th className="px-4 py-2 font-normal">Coin</th>
            <th className="px-3 py-2 font-normal text-right">Quantity</th>
            <th className="px-3 py-2 font-normal text-right hidden sm:table-cell">Avg cost</th>
            <th className="px-3 py-2 font-normal text-right">Price</th>
            <th className="px-3 py-2 font-normal text-right">Value</th>
            <th className="px-3 py-2 font-normal text-right">Unrealized P&amp;L</th>
            <th className="px-4 py-2 font-normal text-right">Order</th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((h) => {
            const coin = coinsById.get(h.coinId);
            const price = coin?.price ?? h.avgCost;
            const value = h.quantity * price;
            const pnl = (price - h.avgCost) * h.quantity;
            const pnlPct = h.avgCost > 0 ? ((price - h.avgCost) / h.avgCost) * 100 : 0;
            const pnlTone = pnl > 0 ? "text-gain" : pnl < 0 ? "text-loss" : "text-cream-dim";

            return (
              <tr key={h.coinId} className="border-b border-line/60 hover:bg-panel-hover transition-colors">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2.5">
                    {coin ? (
                      <Image src={coin.logoUrl} alt="" width={22} height={22} className="rounded-full bg-void shrink-0" unoptimized />
                    ) : (
                      <div className="w-[22px] h-[22px] rounded-full bg-void shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="text-cream truncate max-w-[120px] sm:max-w-none">{h.name}</div>
                      <div className="text-cream-dim text-xs">{h.symbol}</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums text-cream">{formatQty(h.quantity)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-cream-dim hidden sm:table-cell">{formatPrice(h.avgCost)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-cream">{formatPrice(price)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-cream">{formatUsd(value)}</td>
                <td className={`px-3 py-2.5 text-right tabular-nums ${pnlTone}`}>
                  {formatUsd(pnl)}
                  <span className="text-xs ml-1 opacity-80">({formatPercent(pnlPct)})</span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <button
                    onClick={() => coin && onSell(coin)}
                    disabled={!coin}
                    title={coin ? undefined : "Price unavailable right now"}
                    className="px-2.5 py-1 text-xs font-display font-medium border border-loss-dim text-loss hover:bg-loss hover:text-void transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Sell
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
