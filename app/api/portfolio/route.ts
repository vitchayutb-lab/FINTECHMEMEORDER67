import { NextResponse } from "next/server";
import { getPortfolio, resetPortfolio, sampleEquity } from "@/lib/store";
import { getMemeCoins } from "@/lib/cmc";

export async function GET() {
  try {
    // Piggyback a fresh equity sample onto normal polling so the equity
    // curve on the Portfolio page fills in over the session without a
    // separate background job.
    const coins = await getMemeCoins().catch(() => []);
    const pricesById = new Map(coins.map((c) => [c.id, c.price]));
    const portfolio = coins.length ? await sampleEquity(pricesById) : await getPortfolio();
    return NextResponse.json({ portfolio });
  } catch {
    return NextResponse.json({ error: "Failed to load portfolio." }, { status: 500 });
  }
}

export async function DELETE() {
  const portfolio = await resetPortfolio();
  return NextResponse.json({ portfolio });
}
