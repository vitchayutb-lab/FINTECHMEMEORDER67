import "server-only";
import { promises as fs } from "fs";
import path from "path";
import type { Portfolio, Trade, TradeRequest } from "./types";

// ---------------------------------------------------------------------------
// Paper-trading portfolio store. This is a SIMULATION ONLY — no real funds,
// no real exchange, no real orders. State lives in a local JSON file, which
// is enough for a single-player practice terminal and keeps the project
// dependency-free (no database to install/host).
// ---------------------------------------------------------------------------

export const STARTING_BALANCE = 10_000;
const MAX_EQUITY_POINTS = 500;
const MAX_TRADES = 500;
const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "portfolio.json");

export class TradeError extends Error {}

function freshPortfolio(): Portfolio {
  const now = new Date().toISOString();
  return {
    startingBalance: STARTING_BALANCE,
    cash: STARTING_BALANCE,
    holdings: [],
    trades: [],
    equityHistory: [{ timestamp: now, equity: STARTING_BALANCE }],
    createdAt: now,
  };
}

// Simple in-process queue so concurrent requests (e.g. a double-clicked
// order button) can't read-modify-write the file at the same time.
let queue: Promise<unknown> = Promise.resolve();
function serialized<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.catch(() => undefined);
  return run;
}

async function readPortfolio(): Promise<Portfolio> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(raw) as Portfolio;
  } catch {
    const fresh = freshPortfolio();
    await writePortfolio(fresh);
    return fresh;
  }
}

async function writePortfolio(portfolio: Portfolio): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(portfolio, null, 2), "utf-8");
}

export async function getPortfolio(): Promise<Portfolio> {
  return serialized(readPortfolio);
}

export async function resetPortfolio(): Promise<Portfolio> {
  return serialized(async () => {
    const fresh = freshPortfolio();
    await writePortfolio(fresh);
    return fresh;
  });
}

/** Records an equity sample if the value has moved, capping history length. */
export async function sampleEquity(currentPricesById: Map<number, number>): Promise<Portfolio> {
  return serialized(async () => {
    const portfolio = await readPortfolio();
    const equity = computeEquity(portfolio, currentPricesById);
    const last = portfolio.equityHistory[portfolio.equityHistory.length - 1];
    if (!last || Math.abs(last.equity - equity) > 0.005) {
      portfolio.equityHistory.push({ timestamp: new Date().toISOString(), equity });
      if (portfolio.equityHistory.length > MAX_EQUITY_POINTS) {
        portfolio.equityHistory.splice(0, portfolio.equityHistory.length - MAX_EQUITY_POINTS);
      }
      await writePortfolio(portfolio);
    }
    return portfolio;
  });
}

export function computeEquity(portfolio: Portfolio, pricesById: Map<number, number>): number {
  const holdingsValue = portfolio.holdings.reduce((sum, h) => {
    const price = pricesById.get(h.coinId) ?? h.avgCost;
    return sum + h.quantity * price;
  }, 0);
  return portfolio.cash + holdingsValue;
}

function round(n: number, dp = 8): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

export async function executeTrade(req: TradeRequest): Promise<{ portfolio: Portfolio; trade: Trade }> {
  if (!Number.isFinite(req.price) || req.price <= 0) {
    throw new TradeError("Missing a live price for this coin — refresh and try again.");
  }
  if (!Number.isFinite(req.amount) || req.amount <= 0) {
    throw new TradeError("Enter an amount greater than zero.");
  }

  return serialized(async () => {
    const portfolio = await readPortfolio();
    const quantity = req.mode === "usd" ? req.amount / req.price : req.amount;
    const total = quantity * req.price;
    let realizedPnl: number | undefined;

    if (req.side === "buy") {
      if (round(total, 2) > round(portfolio.cash, 2)) {
        throw new TradeError(
          `Not enough paper cash. Buying ${quantity.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${req.symbol} costs $${total.toFixed(2)}, you have $${portfolio.cash.toFixed(2)}.`
        );
      }
      portfolio.cash = round(portfolio.cash - total, 2);
      const existing = portfolio.holdings.find((h) => h.coinId === req.coinId);
      if (existing) {
        const newQty = existing.quantity + quantity;
        existing.avgCost = round((existing.avgCost * existing.quantity + total) / newQty);
        existing.quantity = round(newQty);
      } else {
        portfolio.holdings.push({
          coinId: req.coinId,
          symbol: req.symbol,
          name: req.name,
          quantity: round(quantity),
          avgCost: round(req.price),
        });
      }
    } else {
      const existing = portfolio.holdings.find((h) => h.coinId === req.coinId);
      if (!existing || existing.quantity <= 0) {
        throw new TradeError(`You don't hold any ${req.symbol} to sell.`);
      }
      if (round(quantity, 8) > round(existing.quantity, 8)) {
        throw new TradeError(
          `You only hold ${existing.quantity.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${req.symbol}.`
        );
      }
      realizedPnl = round((req.price - existing.avgCost) * quantity, 2);
      portfolio.cash = round(portfolio.cash + total, 2);
      existing.quantity = round(existing.quantity - quantity);
      if (existing.quantity <= 1e-8) {
        portfolio.holdings = portfolio.holdings.filter((h) => h.coinId !== req.coinId);
      }
    }

    const trade: Trade = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      side: req.side,
      coinId: req.coinId,
      symbol: req.symbol,
      name: req.name,
      quantity: round(quantity),
      price: req.price,
      total: round(total, 2),
      ...(realizedPnl !== undefined ? { realizedPnl } : {}),
    };

    portfolio.trades.unshift(trade);
    if (portfolio.trades.length > MAX_TRADES) {
      portfolio.trades.length = MAX_TRADES;
    }

    const holdingsAtCost = portfolio.holdings.reduce((s, h) => s + h.quantity * h.avgCost, 0);
    portfolio.equityHistory.push({ timestamp: trade.timestamp, equity: portfolio.cash + holdingsAtCost });
    if (portfolio.equityHistory.length > MAX_EQUITY_POINTS) {
      portfolio.equityHistory.splice(0, portfolio.equityHistory.length - MAX_EQUITY_POINTS);
    }

    await writePortfolio(portfolio);
    return { portfolio, trade };
  });
}
