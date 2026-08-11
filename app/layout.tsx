import type { Metadata } from "next";
import "@fontsource-variable/space-grotesk";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";
import Nav from "@/components/Nav";
import TickerTape from "@/components/TickerTape";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "Paper Terminal — Meme Coin Trading Simulator",
  description:
    "Practice meme coin trading with live CoinMarketCap prices and a virtual $10,000 balance. No real money, ever.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <Providers>
          <TickerTape />
          <Nav />
          <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 py-6">{children}</main>
          <footer className="border-t border-line px-4 sm:px-6 py-4 text-xs text-cream-dim">
            <div className="max-w-[1400px] mx-auto flex flex-wrap items-center justify-between gap-2">
              <span>
                PAPER TERMINAL is a simulator. Prices are real (CoinMarketCap); money, positions, and fills
                are not.
              </span>
              <span>Meme coins are extremely volatile — this is practice, not investment advice.</span>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
