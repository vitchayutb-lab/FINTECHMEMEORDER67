"use client";

import type { MemeCoin, Portfolio } from "@/lib/types";
import { formatPercent, formatUsd } from "@/lib/format";

interface Props {
  portfolio: Portfolio;
  coins: MemeCoin[];
}

function StatCard({
  label,
  value,
  sub,
  tone = "neutral",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "neutral" | "gain" | "loss";
}) {
  const toneClass = tone === "gain" ? "text-gain" : tone === "loss" ? "text-loss" : "text-cream";
  return (
    <div className="border border-line bg-panel px-4 py-3.5">
      <div className="text-xs uppercase tracking-wider text-cream-dim">{label}</div>
      <div className={`font-mono text-xl tabular-nums mt-1 ${toneClass}`}>{value}</div>
      {sub && <div className={`text-xs mt-0.5 tabular-nums ${toneClass}`}>{sub}</div>}
    </div>
  );
}

export default function PortfolioSummary({ portfolio, coins }: Props) {
  const pricesById = new Map(coins.map((c) => [c.id, c.price]));
  const holdingsValue = portfolio.holdings.reduce((sum, h) => sum + h.quantity * (pricesById.get(h.coinId) ?? h.avgCost), 0);
  const equity = portfolio.cash + holdingsValue;
  const totalReturn = equity - portfolio.startingBalance;
  const totalReturnPct = (totalReturn / portfolio.startingBalance) * 100;

  const unrealizedPnl = portfolio.holdings.reduce((sum, h) => {
    const price = pricesById.get(h.coinId);
    if (price === undefined) return sum;
    return sum + (price - h.avgCost) * h.quantity;
  }, 0);

  const realizedPnl = portfolio.trades.reduce((sum, t) => sum + (t.realizedPnl ?? 0), 0);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard
        label="Total equity"
        value={formatUsd(equity)}
        sub={`${totalReturn >= 0 ? "+" : ""}${formatUsd(totalReturn)} (${formatPercent(totalReturnPct)})`}
        tone={totalReturn >= 0 ? "gain" : "loss"}
      />
      <StatCard label="Cash available" value={formatUsd(portfolio.cash)} />
      <StatCard
        label="Unrealized P&L"
        value={formatUsd(unrealizedPnl)}
        tone={unrealizedPnl > 0 ? "gain" : unrealizedPnl < 0 ? "loss" : "neutral"}
      />
      <StatCard
        label="Realized P&L"
        value={formatUsd(realizedPnl)}
        tone={realizedPnl > 0 ? "gain" : realizedPnl < 0 ? "loss" : "neutral"}
      />
    </div>
  );
}
