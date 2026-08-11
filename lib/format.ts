export function formatPrice(price: number): string {
  if (price === 0) return "$0.00";
  if (price >= 1) return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  // Meme coins routinely trade at fractions of a cent — show enough
  // significant digits to be useful instead of rounding to $0.00.
  const decimals = price >= 0.01 ? 4 : price >= 0.0001 ? 6 : 10;
  return `$${price.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}

export function formatCompact(n: number | null): string {
  if (n === null || !Number.isFinite(n)) return "—";
  return new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 2 }).format(n);
}

export function formatUsd(n: number): string {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

export function formatQty(n: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: n < 1 ? 6 : 4 });
}

export function formatPercent(n: number | null): string {
  if (n === null || !Number.isFinite(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
