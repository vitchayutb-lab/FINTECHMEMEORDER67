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

// Fallback filter used ONLY when keyless mode's `tag` param gets rejected
// (see fetchFromCmc). Not authoritative — once a real CMC_API_KEY is set,
// the actual `tag=memes` filter takes over and this list is unused.
const MEME_SYMBOLS = new Set([
  "DOGE", "SHIB", "PEPE", "BONK", "WIF", "FLOKI", "FARTCOIN", "PENGU", "SPX",
  "BRETT", "POPCAT", "MOG", "TURBO", "MEME", "BOME", "NEIRO", "PNUT", "GOAT",
  "ACT", "TRUMP", "WOJAK", "MEW", "DEGEN", "TOSHI", "BABYDOGE", "ELON",
  "HOGE", "SAMO", "COQ", "MYRO", "GIGA", "MOODENG", "PONKE", "SLERF",
  "CHILLGUY", "KISHU", "LADYS", "AIDOGE", "TREMP", "MAGA", "BODEN", "RETARDIO",
]);

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

let cache: { data: MemeCoin[]; keylessLimited: boolean; fetchedAt: number } | null = null;
let inFlight: Promise<{ coins: MemeCoin[]; keylessLimited: boolean }> | null = null;

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

async function requestListings(
  base: string,
  params: Record<string, string>,
  apiKey: string | undefined
): Promise<Response> {
  const url = new URL(base + LISTINGS_PATH);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const headers: Record<string, string> = { Accept: "application/json" };
  if (apiKey) headers["X-CMC_PRO_API_KEY"] = apiKey;
  return fetch(url.toString(), { headers, cache: "no-store" });
}

async function fetchFromCmc(): Promise<{ coins: MemeCoin[]; keylessLimited: boolean }> {
  const apiKey = process.env.CMC_API_KEY?.trim();
  const base = apiKey ? AUTHED_BASE : KEYLESS_BASE;
  const fullParams = { tag: "memes", limit: "100", sort: "market_cap", sort_dir: "desc", convert: "USD" };

  let res: Response;
  try {
    res = await requestListings(base, fullParams, apiKey);
  } catch {
    throw new CmcError(
      "Couldn't reach the CoinMarketCap API. Check your network connection and try again.",
      503
    );
  }

  // The keyless trial tier only documents `limit`/`convert` — `tag` and
  // `sort` are not guaranteed supported there and can come back as a plain
  // 400. Rather than surface that raw error, retry once with the minimal
  // param set so the board still loads (just not meme-filtered/sorted).
  let keylessLimited = false;
  if (!apiKey && res.status === 400) {
    keylessLimited = true;
    try {
      res = await requestListings(base, { limit: "100", convert: "USD" }, apiKey);
    } catch {
      throw new CmcError(
        "Couldn't reach the CoinMarketCap API. Check your network connection and try again.",
        503
      );
    }
  }

  if (res.status === 401 || res.status === 403) {
    throw new CmcError(
      apiKey
        ? "CoinMarketCap rejected the API key. Check CMC_API_KEY in your environment variables."
        : "CoinMarketCap's keyless endpoint refused the request. Add a free CMC_API_KEY — see the README.",
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

  let coins = json.data.map(mapCoin);
  if (keylessLimited) {
    // No `tag` filter came through, so this is a general top-coins list —
    // narrow it down client-side so the board still reads as "meme coins".
    coins = coins.filter((c) => MEME_SYMBOLS.has(c.symbol.toUpperCase()));
  }
  coins.sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity));
  return { coins, keylessLimited };
}

/** Returns cached meme-coin listings, refetching at most once per CACHE_TTL_MS. */
export async function getMemeCoins(): Promise<{ coins: MemeCoin[]; keylessLimited: boolean }> {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < CACHE_TTL_MS) {
    return { coins: cache.data, keylessLimited: cache.keylessLimited };
  }
  // Coalesce concurrent callers into a single upstream request.
  if (!inFlight) {
    inFlight = fetchFromCmc()
      .then((result) => {
        cache = { data: result.coins, keylessLimited: result.keylessLimited, fetchedAt: Date.now() };
        return result;
      })
      .finally(() => {
        inFlight = null;
      });
  }
  try {
    return await inFlight;
  } catch (err) {
    // Serve stale cache rather than a hard failure, if we have anything at all.
    if (cache) return { coins: cache.data, keylessLimited: cache.keylessLimited };
    throw err;
  }
}

export function isUsingKeylessMode(): boolean {
  return !process.env.CMC_API_KEY?.trim();
}
