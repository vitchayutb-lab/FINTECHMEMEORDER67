"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { MemeCoin, Portfolio, Trade, TradeRequest } from "./types";

const PRICE_POLL_MS = 30_000;

// ---------------------------------------------------------------------------
// Prices context — single poller shared by the ticker tape, dashboard table,
// and order ticket so they never drift out of sync with each other.
// ---------------------------------------------------------------------------

interface PricesContextValue {
  coins: MemeCoin[];
  loading: boolean;
  error: string | null;
  keyless: boolean;
  keylessLimited: boolean;
  refresh: () => Promise<void>;
}

const PricesContext = createContext<PricesContextValue | null>(null);

export function PricesProvider({ children }: { children: ReactNode }) {
  const [coins, setCoins] = useState<MemeCoin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [keyless, setKeyless] = useState(false);
  const [keylessLimited, setKeylessLimited] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/prices");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load prices.");
      setCoins(json.coins);
      setKeyless(Boolean(json.keyless));
      setKeylessLimited(Boolean(json.keylessLimited));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load prices.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, PRICE_POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  return (
    <PricesContext.Provider value={{ coins, loading, error, keyless, keylessLimited, refresh }}>
      {children}
    </PricesContext.Provider>
  );
}

export function usePrices() {
  const ctx = useContext(PricesContext);
  if (!ctx) throw new Error("usePrices must be used within PricesProvider");
  return ctx;
}

// ---------------------------------------------------------------------------
// Portfolio context — cash, holdings, trade history. Every mutation (buy,
// sell, reset) updates context state immediately so all pages stay in sync
// without waiting for the next poll.
// ---------------------------------------------------------------------------

interface PortfolioContextValue {
  portfolio: Portfolio | null;
  loading: boolean;
  error: string | null;
  persistent: boolean;
  refresh: () => Promise<void>;
  reset: () => Promise<void>;
  placeOrder: (req: TradeRequest) => Promise<Trade>;
}

const PortfolioContext = createContext<PortfolioContextValue | null>(null);

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [persistent, setPersistent] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/portfolio");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load portfolio.");
      setPortfolio(json.portfolio);
      setPersistent(Boolean(json.persistent));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load portfolio.");
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(async () => {
    const res = await fetch("/api/portfolio", { method: "DELETE" });
    const json = await res.json();
    if (res.ok) setPortfolio(json.portfolio);
  }, []);

  const placeOrder = useCallback(async (req: TradeRequest) => {
    const res = await fetch("/api/trade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Order failed.");
    setPortfolio(json.portfolio);
    return json.trade as Trade;
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, PRICE_POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  return (
    <PortfolioContext.Provider value={{ portfolio, loading, error, persistent, refresh, reset, placeOrder }}>
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  const ctx = useContext(PortfolioContext);
  if (!ctx) throw new Error("usePortfolio must be used within PortfolioProvider");
  return ctx;
}
