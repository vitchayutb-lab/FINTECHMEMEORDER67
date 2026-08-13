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
- State (cash, holdings, trade history, equity curve) lives in Redis if
  `UPSTASH_REDIS_REST_URL`/`_TOKEN` are set, otherwise in a local
  `data/portfolio.json` file. Either way it's a single shared simulation (no
  login/accounts) — one balance for whoever opens the site, which is fine for
  personal use but not built for multiple people sharing one deployment.
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

## Deploying (so it works from any device, not just localhost)

Two things need to be true for the deployed site to work properly:

1. **The server has to keep running** — this isn't a static site, so it needs
   a host that runs the Next.js server (Vercel, in the steps below).
2. **The portfolio needs a real database** — locally, state is saved to a
   JSON file on disk. Most hosts (Vercel included) don't guarantee that file
   persists between requests, so without a database your paper balance can
   reset unexpectedly. The app already supports this — it just needs two
   environment variables to switch on.

Steps:

1. Push this repo to GitHub (see above).
2. Go to [vercel.com](https://vercel.com), sign in with GitHub, and import the repo. Keep the default build settings.
3. Before the first deploy (or after, in Project Settings → Environment Variables), add `CMC_API_KEY`.
4. In the Vercel dashboard, go to **Storage → Marketplace Database Providers → Upstash**, install it, and create a free Redis database. Vercel automatically adds `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to your project — no code changes needed, `lib/store.ts` picks them up automatically.
5. Redeploy (Vercel does this automatically when env vars change, or trigger it manually from the Deployments tab).

That's it — you'll get a `https://your-project.vercel.app` URL that works from
any device, with a paper balance that actually persists. Both Vercel Hobby
and Upstash's free Redis tier are free for personal projects (no card
required for Upstash; Vercel Hobby is free for non-commercial use).

If you'd rather not add a database, the app still deploys and runs — it just
falls back to the local file, so treat the balance as disposable (it can
reset on redeploys or when Vercel spins up a new instance).

Any other Node host works too (Railway, Render, Fly.io, your own server) via
`npm run build && npm start` — the same two env vars apply if the host's
filesystem isn't persistent; check its docs if you're unsure.

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
