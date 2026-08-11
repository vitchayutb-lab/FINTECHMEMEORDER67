"use client";

import { useState } from "react";
import PortfolioSummary from "@/components/PortfolioSummary";
import EquityChart from "@/components/EquityChart";
import HoldingsTable from "@/components/HoldingsTable";
import TradeLog from "@/components/TradeLog";
import OrderTicket from "@/components/OrderTicket";
import { usePortfolio, usePrices } from "@/lib/hooks";
import type { MemeCoin, OrderSide } from "@/lib/types";

export default function PortfolioPage() {
  const { portfolio, loading } = usePortfolio();
  const { coins } = usePrices();
  const [order, setOrder] = useState<{ coin: MemeCoin; side: OrderSide } | null>(null);

  if (loading && !portfolio) {
    return <div className="border border-line bg-panel px-4 py-16 text-center text-cream-dim text-sm">Loading portfolio…</div>;
  }
  if (!portfolio) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-cream">Portfolio</h1>
        <p className="text-sm text-cream-dim mt-1">
          Started at $10,000 on {new Date(portfolio.createdAt).toLocaleDateString()}. Everything below is
          paper — reset any time from the top bar.
        </p>
      </div>

      <PortfolioSummary portfolio={portfolio} coins={coins} />
      <EquityChart portfolio={portfolio} />

      <div>
        <h2 className="font-display text-sm uppercase tracking-wider text-cream-dim mb-2">Open positions</h2>
        <HoldingsTable portfolio={portfolio} coins={coins} onSell={(coin) => setOrder({ coin, side: "sell" })} />
      </div>

      <div>
        <h2 className="font-display text-sm uppercase tracking-wider text-cream-dim mb-2">Trade log</h2>
        <TradeLog trades={portfolio.trades} />
      </div>

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
