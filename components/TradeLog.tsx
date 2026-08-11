"use client";

import type { Trade } from "@/lib/types";
import { formatDateTime, formatPrice, formatQty, formatUsd } from "@/lib/format";

interface Props {
  trades: Trade[];
}

export default function TradeLog({ trades }: Props) {
  if (trades.length === 0) {
    return (
      <div className="border border-line bg-panel px-4 py-10 text-center text-sm text-cream-dim">
        No fills yet. Your trade log fills in the moment you place an order.
      </div>
    );
  }

  return (
    <div className="border border-line bg-panel overflow-x-auto max-h-[420px] overflow-y-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-panel">
          <tr className="text-left text-xs uppercase tracking-wider text-cream-dim border-b border-line">
            <th className="px-4 py-2 font-normal">Time</th>
            <th className="px-3 py-2 font-normal">Side</th>
            <th className="px-3 py-2 font-normal">Coin</th>
            <th className="px-3 py-2 font-normal text-right">Quantity</th>
            <th className="px-3 py-2 font-normal text-right">Price</th>
            <th className="px-3 py-2 font-normal text-right">Total</th>
            <th className="px-4 py-2 font-normal text-right">Realized P&amp;L</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((t) => (
            <tr key={t.id} className="border-b border-line/60">
              <td className="px-4 py-2 text-cream-dim text-xs whitespace-nowrap">{formatDateTime(t.timestamp)}</td>
              <td className="px-3 py-2">
                <span
                  className={
                    "text-[10px] uppercase tracking-wider px-1.5 py-0.5 border " +
                    (t.side === "buy" ? "text-gain border-gain-dim" : "text-loss border-loss-dim")
                  }
                >
                  {t.side}
                </span>
              </td>
              <td className="px-3 py-2 text-cream whitespace-nowrap">{t.symbol}</td>
              <td className="px-3 py-2 text-right tabular-nums text-cream">{formatQty(t.quantity)}</td>
              <td className="px-3 py-2 text-right tabular-nums text-cream-dim">{formatPrice(t.price)}</td>
              <td className="px-3 py-2 text-right tabular-nums text-cream">{formatUsd(t.total)}</td>
              <td className="px-4 py-2 text-right tabular-nums">
                {t.realizedPnl !== undefined ? (
                  <span className={t.realizedPnl >= 0 ? "text-gain" : "text-loss"}>{formatUsd(t.realizedPnl)}</span>
                ) : (
                  <span className="text-cream-dim">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
