"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";
import { ChartCard } from "../ChartCard";
import type { SalesRow } from "@/lib/types";

const PALETTE = ["#e8a33d", "#4c8bf5", "#34c29a", "#8992ac", "#e5636b", "#9b7ce8"];

export function CategoryShareChart({ rows }: { rows: SalesRow[] }) {
  const byCategory = new Map<string, number>();
  for (const r of rows) {
    byCategory.set(r.category, (byCategory.get(r.category) ?? 0) + r.revenue);
  }
  const data = Array.from(byCategory.entries())
    .map(([category, revenue]) => ({ category, revenue: Math.round(revenue) }))
    .sort((a, b) => b.revenue - a.revenue);

  return (
    <ChartCard title="Revenue by Category" subtitle="Share of total revenue" className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#263252" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: "#8992ac", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `$${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`}
          />
          <YAxis
            dataKey="category"
            type="category"
            tick={{ fill: "#ecEff6", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={110}
          />
          <Tooltip
            contentStyle={{ background: "#1a2438", border: "1px solid #263252", borderRadius: 8, fontSize: 12 }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(v: any) => [`$${Number(v).toLocaleString()}`, "Revenue"] as [string, string]}
            cursor={{ fill: "rgba(255,255,255,0.03)" }}
          />
          <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
