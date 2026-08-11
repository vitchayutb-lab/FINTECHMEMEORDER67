"use client";

import { useState } from "react";
import type { MemeCoin, Portfolio } from "@/lib/types";

const CATEGORIES = ["All", "Meme", "Layer 1 / 2", "DeFi", "AI", "Gaming"];

interface Props {
  initialCoins: MemeCoin[];
  portfolio: Portfolio;
}

export default function MemeCoinBoard({ initialCoins, portfolio }: Props) {
  // 1. เก็บ State คำค้นหา และ Category ไว้ใน Memory ฝั่ง Browser (Client-side) 100%
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // 2. กรองข้อมูลจาก Array โดยตรง ไม่ส่ง Request กลับไปเซิร์ฟเวอร์
  const filteredCoins = initialCoins.filter((coin) => {
    // กรองหมวดหมู่
    const matchesCategory =
      selectedCategory === "All" || coin.category === selectedCategory;

    // กรองช่อง Search
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      q === "" ||
      coin.name.toLowerCase().includes(q) ||
      coin.symbol.toLowerCase().includes(q);

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="w-full">
      {/* ส่วนควบคุม: Search และ Category Tabs */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between items-stretch md:items-center">
        
        {/* ช่อง Search: ใช้ <div> ไม่ใช้ <form> เพื่อกันการ Reload หน้าเว็บ */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Filter by name or symbol..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)} // กรองข้อมูลเรียลไทม์
            className="w-full px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-yellow-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2.5 text-neutral-500 hover:text-white text-sm"
            >
              ✕
            </button>
          )}
        </div>

        {/* ปุ่มสลับหมวดหมู่ Category */}
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? "bg-yellow-500 text-black font-bold"
                  : "bg-neutral-900 text-neutral-400 hover:bg-neutral-800 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ตารางแสดงผลเหรียญที่กรองแล้ว (filteredCoins) */}
      <div className="overflow-x-auto border border-neutral-800 rounded-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-neutral-800 bg-neutral-900/50 text-neutral-400 text-xs uppercase tracking-wider">
              <th className="py-3 px-4">Coin</th>
              <th className="py-3 px-4">Price</th>
              <th className="py-3 px-4">24h</th>
              <th className="py-3 px-4">Market Cap</th>
              <th className="py-3 px-4 text-right">Order</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/50 text-sm">
            {filteredCoins.length > 0 ? (
              filteredCoins.map((coin) => (
                <tr key={coin.id} className="hover:bg-neutral-900/40 transition-colors">
                  <td className="py-3 px-4 flex items-center gap-3">
                    <img src={coin.logoUrl} alt={coin.name} className="w-6 h-6 rounded-full" />
                    <div>
                      <span className="font-semibold text-white block">{coin.name}</span>
                      <span className="text-xs text-neutral-500 uppercase">{coin.symbol}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-white font-mono">
                    ${coin.price < 0.01 ? coin.price.toFixed(6) : coin.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className={`py-3 px-4 font-mono ${(coin.percentChange24h ?? 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {(coin.percentChange24h ?? 0) >= 0 ? "+" : ""}{coin.percentChange24h?.toFixed(2)}%
                  </td>
                  <td className="py-3 px-4 text-neutral-400 font-mono">
                    ${((coin.marketCap ?? 0) / 1e9).toFixed(2)}B
                  </td>
                  <td className="py-3 px-4 text-right">
                    {/* ปุ่ม Buy / Sell เปิด Drawer ตามปกติ */}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-12 text-center text-neutral-500">
                  No coins match "{searchQuery}"
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}