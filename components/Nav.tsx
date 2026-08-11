"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { usePortfolio } from "@/lib/hooks";
import { formatUsd } from "@/lib/format";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/portfolio", label: "Portfolio" },
];

export default function Nav() {
  const pathname = usePathname();
  const { portfolio, reset } = usePortfolio();

  async function handleReset() {
    if (
      window.confirm(
        "Reset the simulation? This wipes your paper balance, holdings, and trade history back to $10,000."
      )
    ) {
      await reset();
    }
  }

  return (
    <header className="border-b border-line bg-void/95 backdrop-blur sticky top-0 z-20">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center gap-6">
        <Link href="/" className="flex items-baseline gap-2 shrink-0">
          <span className="font-display font-bold text-lg tracking-tight text-cream">
            PAPER<span className="text-amber">TERMINAL</span>
          </span>
          <span className="hidden sm:inline text-[10px] uppercase tracking-widest text-cream-dim border border-line px-1.5 py-0.5">
            sim
          </span>
        </Link>

        <nav className="flex items-center gap-1 font-display text-sm">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={
                  "px-3 py-1.5 transition-colors " +
                  (active ? "text-amber border-b-2 border-amber" : "text-cream-dim hover:text-cream")
                }
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <span className="hidden md:inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-gain border border-gain-dim px-2 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-gain cursor-blink" /> Paper mode
          </span>
          {portfolio && (
            <span className="font-mono text-sm tabular-nums text-cream" title="Cash balance">
              {formatUsd(portfolio.cash)}
            </span>
          )}
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-cream-dim hover:text-amber border border-line hover:border-amber-dim px-2.5 py-1.5 transition-colors"
            title="Reset simulation to $10,000"
          >
            <RotateCcw size={13} />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>
    </header>
  );
}
