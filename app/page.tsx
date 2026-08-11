import "server-only";

import crypto from "crypto";

import type { MemeCoin } from "./types";



const AUTHED_BASE = "https://pro-api.coinmarketcap.com";

const KEYLESS_BASE = "https://pro-api.coinmarketcap.com/trial-pro-api";

const LISTINGS_PATH = "/v1/cryptocurrency/listings/latest";

const CACHE_TTL_MS = 30_000;



// แผนผังจัดหมวดหมู่เหรียญตามประเภท

const CATEGORY_MAP: Record<string, string[]> = {

  Meme: [

    "DOGE", "SHIB", "PEPE", "WIF", "BONK", "FLOKI", "POPCAT", "MOG",

    "BOME", "MEW", "NEIRO", "TURBO", "MEME", "BRETT", "DEGEN", "MYRO", "PENGU"

  ],

  "Layer 1 / 2": [

    "BTC", "ETH", "SOL", "BNB", "XRP", "ADA", "AVAX", "NEAR", "SUI",

    "TON", "DOT", "ATOM", "MATIC", "POL", "APT", "OP", "ARB", "LTC", "BCH"

  ],

  DeFi: [

    "UNI", "AAVE", "LINK", "MKR", "LDO", "CRV", "PENDLE", "RUNE",

    "INJ", "SNX", "CAKE", "COMP", "DYDX", "RAY"

  ],

  AI: [

    "NEAR", "TAO", "RENDER", "FET", "WLD", "AKT", "GRT", "THETA", "AGIX"

  ],

  Gaming: [

    "AXS", "GALA", "SAND", "MANA", "IMX", "BEAM", "PRIME", "PIXEL"

  ]

};



function detectCategory(symbol: string): string {

  const sym = symbol.toUpperCase();

  for (const [category, symbols] of Object.entries(CATEGORY_MAP)) {

    if (symbols.includes(sym)) return category;

  }

  return "General";

}



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

    category: detectCategory(raw.symbol),

  };

}



async function fetchFromCmc(): Promise<MemeCoin[]> {

  const apiKey = process.env.CMC_API_KEY?.trim();

  const base = apiKey ? AUTHED_BASE : KEYLESS_BASE;

  const url = new URL(base + LISTINGS_PATH);



  url.searchParams.set("limit", "200");

  url.searchParams.set("sort", "market_cap");

  url.searchParams.set("sort_dir", "desc");

  url.searchParams.set("convert", "USD");



  const headers: Record<string, string> = { Accept: "application/json" };

  if (apiKey) headers["X-CMC_PRO_API_KEY"] = apiKey;



  let res: Response;

  try {

    res = await fetch(url.toString(), { headers, cache: "no-store" });

  } catch {

    throw new CmcError("Couldn't reach CoinMarketCap API.", 503);

  }



  if (!res.ok) {

    const errorText = await res.text().catch(() => "");

    console.error(`[CMC Error ${res.status}]:`, errorText);

    throw new CmcError(`CMC API Error (HTTP ${res.status})`, res.status);

  }



  const json = (await res.json()) as CmcListingsResponse;

  if (json.status.error_code !== 0) {

    throw new CmcError(json.status.error_message ?? "Unknown CMC Error.");

  }



  return json.data.map(mapCoin).sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity));

}



export async function getMemeCoins(): Promise<MemeCoin[]> {

  const now = Date.now();

  if (cache && now - cache.fetchedAt < CACHE_TTL_MS) {

    return cache.data;

  }

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

    if (cache) return cache.data;

    throw err;

  }

}



export function isUsingKeylessMode(): boolean {

  return !process.env.CMC_API_KEY?.trim();

} 

