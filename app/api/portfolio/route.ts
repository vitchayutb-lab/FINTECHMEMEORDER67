import { NextResponse } from "next/server";
import { getPortfolio, resetPortfolio, sampleEquity } from "@/lib/store";
import { getMemeCoins } from "@/lib/cmc";

export async function GET() {
  try {
    const coins = await getMemeCoins().catch(() => []);
    const pricesById = new Map(coins.map((c) => [c.id, c.price]));
    const portfolio = coins.length ? await sampleEquity(pricesById) : await getPortfolio();
    return NextResponse.json({ portfolio });
  } catch (err) {
    console.error("GET /api/portfolio Error:", err);
    // หากเกิดข้อผิดพลาด ให้คืนค่าพอร์ตเริ่มต้น $10,000 เพื่อไม่ให้หน้าบ้านพัง
    const fallbackPortfolio = await resetPortfolio();
    return NextResponse.json({ portfolio: fallbackPortfolio });
  }
}

export async function DELETE() {
  try {
    const portfolio = await resetPortfolio();
    return NextResponse.json({ portfolio });
  } catch (err) {
    console.error("DELETE /api/portfolio Error:", err);
    return NextResponse.json({ error: "Failed to reset portfolio." }, { status: 500 });
  }
}