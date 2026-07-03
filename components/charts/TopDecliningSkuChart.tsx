"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell, ReferenceLine } from "recharts";
import { ChartCard } from "../ChartCard";
import type { SkuPerformance } from "@/lib/types";

export function TopDecliningSkuChart({ performance }: { performance: SkuPerformance[] }) {
  const top = performance
    .filter((p) => p.trend === "top")
    .sort((a, b) => b.pctChange - a.pctChange)
    .slice(0, 4);
  const declining = performance
    .filter((p) => p.trend === "declining")
    .sort((a, b) => a.pctChange - b.pctChange)
    .slice(0, 4);

  const data = [...top, ...declining].map((p) => ({ sku: p.sku, pctChange: p.pctChange }));

  return (
    <ChartCard title="Top Movers & Decliners" subtitle="Period-over-period revenue % change" className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#263252" vertical={false} />
          <XAxis dataKey="sku" tick={{ fill: "#8992ac", fontSize: 10 }} tickLine={false} axisLine={{ stroke: "#263252" }} />
          <YAxis tick={{ fill: "#8992ac", fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
          <ReferenceLine y={0} stroke="#263252" />
          <Tooltip
            contentStyle={{ background: "#1a2438", border: "1px solid #263252", borderRadius: 8, fontSize: 12 }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(v: any) => [`${Number(v) > 0 ? "+" : ""}${v}%`, "Change"] as [string, string]}
            cursor={{ fill: "rgba(255,255,255,0.03)" }}
          />
          <Bar dataKey="pctChange" radius={[4, 4, 4, 4]}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.pctChange >= 0 ? "#34c29a" : "#e5636b"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
