"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ArrowUpDown } from "lucide-react";
import type { MemeCoin, OrderSide } from "@/lib/types";
import { formatCompact, formatPercent, formatPrice } from "@/lib/format";
import { usePortfolio } from "@/lib/hooks";

type SortKey = "rank" | "price" | "percentChange1h" | "percentChange24h" | "percentChange7d" | "marketCap" | "volume24h";

interface Props {
  coins: MemeCoin[];
  onOrder: (coin: MemeCoin, side: OrderSide) => void;
}

function PercentCell({ value }: { value: number | null }) {
  const color = value === null ? "text-cream-dim" : value >= 0 ? "text-gain" : "text-loss";
  return <span className={`tabular-nums ${color}`}>{formatPercent(value)}</span>;
}

export default function PriceTable({ coins, onOrder }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [sortDir, setSortDir] = useState<1 | -1>(1);
  const [flashes, setFlashes] = useState<Record<number, "gain" | "loss">>({});
  const prevPrices = useRef<Map<number, number>>(new Map());
  const { portfolio } = usePortfolio();

  const heldIds = useMemo(
    () => new Set((portfolio?.holdings ?? []).filter((h) => h.quantity > 0).map((h) => h.coinId)),
    [portfolio]
  );

  // Flash a row green/red for ~900ms whenever its price moves between polls.
  useEffect(() => {
    const next: Record<number, "gain" | "loss"> = {};
    for (const c of coins) {
      const prev = prevPrices.current.get(c.id);
      if (prev !== undefined && prev !== c.price) {
        next[c.id] = c.price > prev ? "gain" : "loss";
      }
      prevPrices.current.set(c.id, c.price);
    }
    if (Object.keys(next).length > 0) {
      setFlashes(next);
      const t = setTimeout(() => setFlashes({}), 900);
      return () => clearTimeout(t);
    }
  }, [coins]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 1 ? -1 : 1));
    } else {
      setSortKey(key);
      setSortDir(key === "rank" ? 1 : -1);
    }
  }

  // เรียงลำดับรายการเหรียญตามที่ผู้ใช้เลือกคลิกที่หัวตาราง
  const sortedCoins = useMemo(() => {
    return [...coins].sort((a, b) => {
      const av = a[sortKey] ?? -Infinity;
      const bv = b[sortKey] ?? -Infinity;
      return av < bv ? -1 * sortDir : av > bv ? 1 * sortDir : 0;
    });
  }, [coins, sortKey, sortDir]);

  const headers: { key: SortKey; label: string; className?: string }[] = [
    { key: "rank", label: "#", className: "w-10" },
    { key: "price", label: "Price" },
    { key: "percentChange1h", label: "1h", className: "hidden sm:table-cell" },
    { key: "percentChange24h", label: "24h" },
    { key: "percentChange7d", label: "7d", className: "hidden md:table-cell" },
    { key: "marketCap", label: "Mkt Cap", className: "hidden lg:table-cell" },
    { key: "volume24h", label: "Vol 24h", className: "hidden lg:table-cell" },
  ];

  return (
    <div className="border border-line bg-panel">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-cream-dim border-b border-line">
              <th className="px-4 py-2 font-normal">Coin</th>
              {headers.map((h) => (
                <th key={h.key} className={`px-3 py-2 font-normal text-right ${h.className ?? ""}`}>
                  <button
                    onClick={() => toggleSort(h.key)}
                    className="inline-flex items-center gap-1 hover:text-amber transition-colors"
                  >
                    {h.label}
                    <ArrowUpDown size={11} className={sortKey === h.key ? "text-amber" : "opacity-40"} />
                  </button>
                </th>
              ))}
              <th className="px-4 py-2 font-normal text-right">Order</th>
            </tr>
          </thead>
          <tbody>
            {sortedCoins.map((c) => (
              <tr
                key={c.id}
                className={
                  "border-b border-line/60 hover:bg-panel-hover transition-colors " +
                  (flashes[c.id] === "gain" ? "flash-gain" : flashes[c.id] === "loss" ? "flash-loss" : "")
                }
              >
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <Image
                      src={c.logoUrl}
                      alt=""
                      width={22}
                      height={22}
                      className="rounded-full bg-void shrink-0"
                      unoptimized
                    />
                    <div className="min-w-0">
                      <div className="text-cream truncate max-w-[140px] sm:max-w-none">{c.name}</div>
                      <div className="text-cream-dim text-xs">{c.symbol}</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums text-cream">{formatPrice(c.price)}</td>
                <td className="px-3 py-2.5 text-right hidden sm:table-cell">
                  <PercentCell value={c.percentChange1h} />
                </td>
                <td className="px-3 py-2.5 text-right">
                  <PercentCell value={c.percentChange24h} />
                </td>
                <td className="px-3 py-2.5 text-right hidden md:table-cell">
                  <PercentCell value={c.percentChange7d} />
                </td>
                <td className="px-3 py-2.5 text-right hidden lg:table-cell tabular-nums text-cream-dim">
                  ${formatCompact(c.marketCap)}
                </td>
                <td className="px-3 py-2.5 text-right hidden lg:table-cell tabular-nums text-cream-dim">
                  ${formatCompact(c.volume24h)}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => onOrder(c, "buy")}
                      className="px-2.5 py-1 text-xs font-display font-medium border border-gain-dim text-gain hover:bg-gain hover:text-void transition-colors"
                    >
                      Buy
                    </button>
                    <button
                      onClick={() => onOrder(c, "sell")}
                      disabled={!heldIds.has(c.id)}
                      className="px-2.5 py-1 text-xs font-display font-medium border border-loss-dim text-loss hover:bg-loss hover:text-void transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-loss disabled:cursor-not-allowed"
                    >
                      Sell
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {sortedCoins.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-cream-dim text-sm">
                  No coins found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}