import "server-only";
import type { MemeCoin } from "./types";

// ---------------------------------------------------------------------------
// CoinMarketCap client. Server-side only — the API key must never reach the
// browser (CMC blocks client-side calls anyway to protect the key, so this
// isn't optional). Called only from app/api/prices/route.ts.
// ---------------------------------------------------------------------------

const AUTHED_BASE = "https://pro-api.coinmarketcap.com";
// Keyless base lets the app return real data with zero setup, at much lower
// rate limits. We use it automatically when CMC_API_KEY isn't set yet, so
// `npm run dev` shows live prices immediately; see README for upgrading.
const KEYLESS_BASE = "https://pro-api.coinmarketcap.com/trial-pro-api";

const LISTINGS_PATH = "/v1/cryptocurrency/listings/latest";

const CACHE_TTL_MS = 30_000; // matches CMC's ~1 min data refresh; keeps credit usage low

interface CmcListingsResponse {
  status: {
    error_code: number;
    error_message: string | null;
  };
  data: Array<{
    id: number;
    name: string;
    symbol: string;
    slug: string;
    cmc_rank: number | null;
    quote: {
      USD: {
        price: number;
        percent_change_1h: number | null;
        percent_change_24h: number | null;
        percent_change_7d: number | null;
        market_cap: number | null;
        volume_24h: number | null;
        last_updated: string;
      };
    };
  }>;
}

let cache: { data: MemeCoin[]; fetchedAt: number } | null = null;
let inFlight: Promise<MemeCoin[]> | null = null;

export class CmcError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.name = "CmcError";
    this.status = status;
  }
}

function logoUrl(id: number): string {
  return `https://s2.coinmarketcap.com/static/img/coins/64x64/${id}.png`;
}

function mapCoin(raw: CmcListingsResponse["data"][number]): MemeCoin {
  const usd = raw.quote.USD;
  return {
    id: raw.id,
    name: raw.name,
    symbol: raw.symbol,
    slug: raw.slug,
    rank: raw.cmc_rank,
    price: usd.price,
    percentChange1h: usd.percent_change_1h,
    percentChange24h: usd.percent_change_24h,
    percentChange7d: usd.percent_change_7d,
    marketCap: usd.market_cap,
    volume24h: usd.volume_24h,
    logoUrl: logoUrl(raw.id),
    lastUpdated: usd.last_updated,
  };
}

async function fetchFromCmc(): Promise<MemeCoin[]> {
  const apiKey = process.env.CMC_API_KEY?.trim();
  const base = apiKey ? AUTHED_BASE : KEYLESS_BASE;
  const url = new URL(base + LISTINGS_PATH);
  url.searchParams.set("tag", "memes");
  url.searchParams.set("limit", "100");
  url.searchParams.set("sort", "market_cap");
  url.searchParams.set("sort_dir", "desc");
  url.searchParams.set("convert", "USD");

  const headers: Record<string, string> = { Accept: "application/json" };
  if (apiKey) headers["X-CMC_PRO_API_KEY"] = apiKey;

  let res: Response;
  try {
    res = await fetch(url.toString(), { headers, cache: "no-store" });
  } catch {
    throw new CmcError(
      "Couldn't reach the CoinMarketCap API. Check your network connection and try again.",
      503
    );
  }

  if (res.status === 401 || res.status === 403) {
    throw new CmcError(
      "CoinMarketCap rejected the API key. Check CMC_API_KEY in .env.local.",
      401
    );
  }
  if (res.status === 429) {
    throw new CmcError(
      "CoinMarketCap rate limit hit (free tier). Prices will refresh again shortly.",
      429
    );
  }
  if (!res.ok) {
    throw new CmcError(`CoinMarketCap API error (HTTP ${res.status}).`, res.status);
  }

  const json = (await res.json()) as CmcListingsResponse;
  if (json.status.error_code !== 0) {
    throw new CmcError(json.status.error_message ?? "Unknown CoinMarketCap API error.");
  }

  return json.data.map(mapCoin).sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity));
}

/** Returns cached meme-coin listings, refetching at most once per CACHE_TTL_MS. */
export async function getMemeCoins(): Promise<MemeCoin[]> {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.data;
  }
  // Coalesce concurrent callers into a single upstream request.
  if (!inFlight) {
    inFlight = fetchFromCmc()
      .then((data) => {
        cache = { data, fetchedAt: Date.now() };
        return data;
      })
      .finally(() => {
        inFlight = null;
      });
  }
  try {
    return await inFlight;
  } catch (err) {
    // Serve stale cache rather than a hard failure, if we have anything at all.
    if (cache) return cache.data;
    throw err;
  }
}

export function isUsingKeylessMode(): boolean {
  return !process.env.CMC_API_KEY?.trim();
}
