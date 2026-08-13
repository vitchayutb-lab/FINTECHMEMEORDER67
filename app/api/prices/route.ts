import { NextResponse } from "next/server";
import { getMemeCoins, isUsingKeylessMode, CmcError } from "@/lib/cmc";

export async function GET() {
  try {
    const { coins, keylessLimited } = await getMemeCoins();
    return NextResponse.json({ coins, keyless: isUsingKeylessMode(), keylessLimited });
  } catch (err) {
    const message = err instanceof CmcError ? err.message : "Failed to load prices.";
    const status = err instanceof CmcError ? err.status : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
