"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { X, Zap, Check } from "lucide-react";
import type { MemeCoin, OrderSide } from "@/lib/types";
import { usePortfolio } from "@/lib/hooks";
import { formatPrice, formatQty, formatUsd } from "@/lib/format";

interface Props {
  coin: MemeCoin;
  side: OrderSide;
  onSideChange: (side: OrderSide) => void;
  onClose: () => void;
}

type AmountMode = "usd" | "quantity";

const QUICK_FRACTIONS = [0.25, 0.5, 0.75, 1];

export default function OrderTicket({ coin, side, onSideChange, onClose }: Props) {
  const { portfolio, placeOrder } = usePortfolio();
  const [mode, setMode] = useState<AmountMode>(side === "buy" ? "usd" : "quantity");
  const [raw, setRaw] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filled, setFilled] = useState<{ quantity: number; total: number } | null>(null);

  const holding = portfolio?.holdings.find((h) => h.coinId === coin.id) ?? null;
  const cash = portfolio?.cash ?? 0;

  useEffect(() => {
    setMode(side === "buy" ? "usd" : "quantity");
    setRaw("");
    setError(null);
    setFilled(null);
  }, [side, coin.id]);

  const amount = parseFloat(raw);
  const validAmount = Number.isFinite(amount) && amount > 0;

  const estQuantity = useMemo(() => {
    if (!validAmount) return 0;
    return mode === "usd" ? amount / coin.price : amount;
  }, [amount, mode, coin.price, validAmount]);

  const estTotal = useMemo(() => {
    if (!validAmount) return 0;
    return mode === "usd" ? amount : amount * coin.price;
  }, [amount, mode, coin.price, validAmount]);

  const maxForSide = side === "buy" ? (mode === "usd" ? cash : cash / coin.price) : mode === "quantity" ? (holding?.quantity ?? 0) : (holding?.quantity ?? 0) * coin.price;

  function applyFraction(frac: number) {
    const value = maxForSide * frac;
    setRaw(value > 0 ? (mode === "usd" ? value.toFixed(2) : value.toFixed(6)) : "0");
  }

  async function handleSubmit() {
    if (!validAmount || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const trade = await placeOrder({
        side,
        coinId: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        price: coin.price,
        amount,
        mode,
      });
      setFilled({ quantity: trade.quantity, total: trade.total });
      setRaw("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Order failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex justify-end">
      <button aria-label="Close order ticket" onClick={onClose} className="absolute inset-0 bg-void/70 backdrop-blur-sm" />
      <div className="relative w-full sm:w-[400px] h-full bg-panel border-l border-line-bright flex flex-col">
        <div className="flex items-center justify-between border-b border-line px-4 py-3.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <Image src={coin.logoUrl} alt="" width={26} height={26} className="rounded-full bg-void shrink-0" unoptimized />
            <div className="min-w-0">
              <div className="font-display text-cream leading-tight truncate">{coin.name}</div>
              <div className="text-xs text-cream-dim tabular-nums">
                {coin.symbol} · {formatPrice(coin.price)}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-cream-dim hover:text-cream p-1">
            <X size={18} />
          </button>
        </div>

        {filled ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="w-12 h-12 rounded-full border-2 border-gain flex items-center justify-center">
              <Check size={22} className="text-gain" />
            </div>
            <div className="font-display text-lg text-cream">Order filled</div>
            <p className="text-sm text-cream-dim font-mono">
              {side === "buy" ? "Bought" : "Sold"} {formatQty(filled.quantity)} {coin.symbol} for{" "}
              {formatUsd(filled.total)}
            </p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setFilled(null)}
                className="px-3 py-1.5 text-xs border border-line hover:border-amber-dim text-cream-dim hover:text-amber transition-colors"
              >
                Place another
              </button>
              <button
                onClick={onClose}
                className="px-3 py-1.5 text-xs border border-amber-dim bg-amber text-void font-medium"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 border-b border-line">
              <button
                onClick={() => onSideChange("buy")}
                className={
                  "py-3 font-display font-medium text-sm transition-colors " +
                  (side === "buy" ? "bg-gain/15 text-gain border-b-2 border-gain" : "text-cream-dim hover:text-cream")
                }
              >
                Buy
              </button>
              <button
                onClick={() => onSideChange("sell")}
                className={
                  "py-3 font-display font-medium text-sm transition-colors " +
                  (side === "sell" ? "bg-loss/15 text-loss border-b-2 border-loss" : "text-cream-dim hover:text-cream")
                }
              >
                Sell
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              <div className="flex items-center justify-between text-xs text-cream-dim font-mono">
                <span>
                  {side === "buy" ? "Available cash" : `${coin.symbol} held`}
                </span>
                <span className="tabular-nums text-cream">
                  {side === "buy" ? formatUsd(cash) : `${formatQty(holding?.quantity ?? 0)} ${coin.symbol}`}
                </span>
              </div>

              <div className="flex border border-line w-fit text-xs">
                <button
                  onClick={() => setMode("usd")}
                  className={`px-3 py-1.5 font-display ${mode === "usd" ? "bg-amber text-void" : "text-cream-dim hover:text-cream"}`}
                >
                  USD
                </button>
                <button
                  onClick={() => setMode("quantity")}
                  className={`px-3 py-1.5 font-display border-l border-line ${mode === "quantity" ? "bg-amber text-void" : "text-cream-dim hover:text-cream"}`}
                >
                  {coin.symbol}
                </button>
              </div>

              <div>
                <div className="flex items-center border border-line-bright bg-void px-3 py-2.5">
                  <span className="text-cream-dim mr-2">{mode === "usd" ? "$" : ""}</span>
                  <input
                    autoFocus
                    inputMode="decimal"
                    value={raw}
                    onChange={(e) => setRaw(e.target.value.replace(/[^0-9.]/g, ""))}
                    placeholder="0.00"
                    className="bg-transparent outline-none w-full font-mono text-lg tabular-nums text-cream placeholder:text-cream-dim/40"
                  />
                  <span className="text-cream-dim ml-2 text-sm">{mode === "quantity" ? coin.symbol : "USD"}</span>
                </div>
                <div className="flex gap-1.5 mt-2">
                  {QUICK_FRACTIONS.map((f) => (
                    <button
                      key={f}
                      onClick={() => applyFraction(f)}
                      className="flex-1 py-1 text-xs border border-line hover:border-amber-dim text-cream-dim hover:text-amber transition-colors font-mono"
                    >
                      {f === 1 ? "MAX" : `${f * 100}%`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-line pt-3 space-y-1.5 text-sm font-mono">
                <div className="flex justify-between text-cream-dim">
                  <span>Est. quantity</span>
                  <span className="tabular-nums text-cream">{formatQty(estQuantity)} {coin.symbol}</span>
                </div>
                <div className="flex justify-between text-cream-dim">
                  <span>Est. total</span>
                  <span className="tabular-nums text-cream">{formatUsd(estTotal)}</span>
                </div>
              </div>

              {error && <p className="text-xs text-loss font-mono">⚠ {error}</p>}
            </div>

            <div className="border-t border-line p-4">
              <button
                onClick={handleSubmit}
                disabled={!validAmount || submitting}
                className={
                  "w-full flex items-center justify-center gap-2 py-3 font-display font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed " +
                  (side === "buy" ? "bg-gain text-void hover:bg-gain/90" : "bg-loss text-void hover:bg-loss/90")
                }
              >
                <Zap size={16} />
                {submitting ? "Firing…" : `Fire ${side === "buy" ? "buy" : "sell"} order`}
              </button>
              <p className="text-[10px] text-cream-dim text-center mt-2">
                Simulated fill at the current price. No real order is sent anywhere.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
