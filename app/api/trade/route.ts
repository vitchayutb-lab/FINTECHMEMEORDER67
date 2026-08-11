import { NextResponse } from "next/server";
import { executeTrade, TradeError } from "@/lib/store";
import type { TradeRequest } from "@/lib/types";

export async function POST(request: Request) {
  let body: Partial<TradeRequest>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { side, coinId, symbol, name, price, amount, mode } = body;
  if (
    (side !== "buy" && side !== "sell") ||
    typeof coinId !== "number" ||
    typeof symbol !== "string" ||
    typeof name !== "string" ||
    typeof price !== "number" ||
    typeof amount !== "number" ||
    (mode !== "usd" && mode !== "quantity")
  ) {
    return NextResponse.json({ error: "Malformed order." }, { status: 400 });
  }

  try {
    const result = await executeTrade({ side, coinId, symbol, name, price, amount, mode });
    return NextResponse.json(result);
  } catch (err) {
    console.error("POST /api/trade Error:", err);
    if (err instanceof TradeError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Order failed. Try again." }, { status: 500 });
  }
}