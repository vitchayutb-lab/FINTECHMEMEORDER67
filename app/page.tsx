"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import PriceTable from "@/components/PriceTable";
import OrderTicket from "@/components/OrderTicket";
import { usePrices, usePortfolio } from "@/lib/hooks";
import type { MemeCoin, OrderSide } from "@/lib/types";

export default function DashboardPage() {
  const { coins, loading, error, keyless } = usePrices();
  const { persistent } = usePortfolio();
  const [order, setOrder] = useState<{ coin: MemeCoin; side: OrderSide } | null>(null);

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

      {!persistent && (
        <div className="flex items-start gap-2 border border-amber-dim bg-amber/10 px-3 py-2.5 text-xs text-amber-soft">
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          <span>
            Portfolio is saved to a local file, not a database — fine for <code className="mx-1 px-1 bg-void/40">npm run dev</code>,
            but it won&rsquo;t reliably survive on most hosting. Add Upstash Redis before deploying — see the README.
          </span>
        </div>
      )}

      {error && coins.length === 0 && (
        <div className="flex items-start gap-2 border border-loss-dim bg-loss/10 px-3 py-2.5 text-xs text-loss">
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {loading && coins.length === 0 ? (
        <div className="border border-line bg-panel px-4 py-16 text-center text-cream-dim text-sm">
          Loading meme coin board…
        </div>
      ) : (
        <PriceTable coins={coins} onOrder={(coin, side) => setOrder({ coin, side })} />
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
