"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Portfolio } from "@/lib/types";
import { formatTime, formatUsd } from "@/lib/format";

interface Props {
  portfolio: Portfolio;
}

export default function EquityChart({ portfolio }: Props) {
  const points = portfolio.equityHistory.map((p) => ({
    time: p.timestamp,
    equity: p.equity,
  }));

  if (points.length < 2) {
    return (
      <div className="border border-line bg-panel px-4 py-10 text-center text-sm text-cream-dim">
        Equity curve fills in as you trade this session — place an order to get started.
      </div>
    );
  }

  const isUp = points[points.length - 1].equity >= points[0].equity;
  const lineColor = isUp ? "#8bc34a" : "#ef6c4d";

  return (
    <div className="border border-line bg-panel px-2 sm:px-4 py-4">
      <div className="text-xs uppercase tracking-wider text-cream-dim px-2 mb-2">Equity curve · this session</div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={points} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={lineColor} stopOpacity={0.35} />
              <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="time"
            tickFormatter={formatTime}
            stroke="#372c1e"
            tick={{ fill: "#96876e", fontSize: 11 }}
            minTickGap={40}
          />
          <YAxis
            domain={["auto", "auto"]}
            stroke="#372c1e"
            tick={{ fill: "#96876e", fontSize: 11 }}
            tickFormatter={(v) => formatUsd(v)}
            width={70}
          />
          <Tooltip
            contentStyle={{
              background: "#1c1812",
              border: "1px solid #372c1e",
              borderRadius: 0,
              fontFamily: "var(--font-mono)",
              fontSize: 12,
            }}
            labelFormatter={(v) => formatTime(String(v))}
            formatter={(value) => [formatUsd(Number(value)), "Equity"]}
          />
          <Area type="monotone" dataKey="equity" stroke={lineColor} strokeWidth={1.5} fill="url(#equityFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
