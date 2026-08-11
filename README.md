# Paper Terminal — Meme Coin Trading Simulator

A practice terminal for meme coin trading: live prices pulled from CoinMarketCap,
one-click buy/sell against a **$10,000 virtual balance**, a portfolio view with
an equity curve, and a full trade log.

**No real money, no real exchange, no real orders — everything is simulated.**

## Features

- **Dashboard** — searchable/sortable table of meme coins (CoinMarketCap's `memes`
  tag), live price + 1h/24h/7d change, scrolling ticker header, one-click order
  ticket.
- **Order ticket** — buy/sell in USD or in coin quantity, quick 25/50/75/MAX
  buttons, instant simulated fill at the current price.
- **Portfolio** — total equity, cash, unrealized/realized P&L, an equity curve
  that builds up as you trade, open positions with live valuation, and a full
  trade history.
- **Reset any time** — wipes paper cash/holdings/history back to $10,000.

## Requirements

- Node.js 20+
- A free [CoinMarketCap API key](https://pro.coinmarketcap.com/signup) (Basic
  plan — 15,000 credits/month, no card required). The app also runs with
  **zero setup** on CoinMarketCap's public keyless endpoint, just at a much
  lower rate limit — good for a first look, not for regular use.

## Setup

```bash
npm install
cp .env.local.example .env.local
# open .env.local and paste your CMC_API_KEY
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). If you skip the API key
step, the app still loads real prices via the keyless endpoint — you'll see a
banner on the dashboard reminding you to add a key once you hit its limits.

## How the simulation works

- Every wallet starts at **$10,000** in paper cash (`lib/store.ts`).
- Buys/sells fill instantly at whatever price `/api/prices` last returned —
  there's no order book, no slippage modeling, no partial fills.
- State (cash, holdings, trade history, equity curve) is written to
  `data/portfolio.json` on the server. It's a single shared simulation (no
  login/accounts) — fine for local/personal use, not built for multiple
  people trading the same instance.
- Prices are cached server-side for 30 seconds to stay well within the free
  API tier's rate limit.

## Project structure

```
app/
  page.tsx                Dashboard (price board)
  portfolio/page.tsx       Portfolio (positions, P&L, history)
  api/prices/route.ts      Proxies CoinMarketCap (server-side, key never
                            reaches the browser)
  api/portfolio/route.ts   Get/reset the paper portfolio
  api/trade/route.ts       Executes a simulated buy/sell
lib/
  cmc.ts                   CoinMarketCap client + caching
  store.ts                 Paper-trading engine (JSON file backed)
  hooks.tsx                Client-side data hooks/context
  types.ts, format.ts
components/                UI: ticker, price table, order ticket, charts…
```

## Pushing to your own GitHub repo

This folder is already a git repo with an initial commit. To push it:

```bash
git remote add origin https://github.com/<your-username>/<your-repo>.git
git branch -M main
git push -u origin main
```

(Create the empty repo on GitHub first — no README/license, since this folder
already has one — then run the commands above.)

## Deploying

Because the CMC API key must stay server-side, deploy somewhere that runs the
Next.js server (not a static host). The path of least resistance is
[Vercel](https://vercel.com): import the GitHub repo, add `CMC_API_KEY` as an
environment variable in the project settings, deploy. Any other Node host
(Railway, Render, Fly.io, your own server) works too via `npm run build && npm start`.

## Extending it

Ideas if you want to keep going:

- **Auto-trade rules** — a background check that fires a simulated buy/sell
  when a coin crosses a threshold you set (e.g. "buy $50 of BONK if it drops
  8%"). Not built yet; the trade engine in `lib/store.ts` is already set up
  to make this a fairly small addition.
- **Multi-user accounts** — swap the single JSON file for per-user rows in a
  real database if more than one person needs their own balance.
- **Real trading** — this project intentionally stops at simulation. Wiring
  up real order execution (via an exchange API or an on-chain DEX) is a much
  bigger step with real financial and security risk (custody of funds/keys),
  worth its own careful design rather than bolting onto a paper-trading demo.

## Disclaimer

Meme coins are extremely volatile and largely speculative. This tool is for
practicing the mechanics of trading, not financial advice, and the fact that
a strategy "worked" in paper trading is not a promise it will work with real
money.
