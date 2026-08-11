"use client";

import type { ReactNode } from "react";
import { PricesProvider, PortfolioProvider } from "@/lib/hooks";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <PricesProvider>
      <PortfolioProvider>{children}</PortfolioProvider>
    </PricesProvider>
  );
}
