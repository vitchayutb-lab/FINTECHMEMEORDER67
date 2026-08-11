// Shared types for the paper-trading simulator.
// Kept in one place so the API routes, store, and UI all agree on shape.

export interface MemeCoin {
  id: number; // CoinMarketCap numeric ID — stable, prefer over symbol for lookups
  name: string;
  symbol: string;
  slug: string;
  rank: number | null;
  price: number;
  percentChange1h: number | null;
  percentChange24h: number | null;
  percentChange7d: number | null;
  marketCap: number | null;
  volume24h: number | null;
  logoUrl: string;
  lastUpdated: string;
}

export type OrderSide = "buy" | "sell";

export interface Trade {
  id: string;
  timestamp: string;
  side: OrderSide;
  coinId: number;
  symbol: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
  /** Only present on sell trades — realized profit/loss for this fill. */
  realizedPnl?: number;
}

export interface Holding {
  coinId: number;
  symbol: string;
  name: string;
  quantity: number;
  avgCost: number; // weighted average cost basis in USD
}

export interface Portfolio {
  startingBalance: number;
  cash: number;
  holdings: Holding[];
  trades: Trade[];
  /** Sampled (timestamp, total equity) points, used to draw the equity curve. Capped in store.ts. */
  equityHistory: { timestamp: string; equity: number }[];
  createdAt: string;
}

export interface TradeRequest {
  side: OrderSide;
  coinId: number;
  symbol: string;
  name: string;
  price: number;
  /** USD amount for buys, coin quantity for sells — see `mode`. */
  amount: number;
  mode: "usd" | "quantity";
}

export interface ApiError {
  error: string;
}
