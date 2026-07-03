"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard } from "../ChartCard";
import type { SalesRow } from "@/lib/types";

const MARKETPLACE_COLORS: Record<string, string> = {
  Amazon: "#e8a33d",
  Walmart: "#4c8bf5",
  Shopify: "#34c29a",
};

export function MarketplaceComparisonChart({ rows }: { rows: SalesRow[] }) {
  // Weekly buckets, revenue per marketplace
  const weekOf = (dateStr: string) => {
    const d = new Date(dateStr);
    const day = d.getUTCDay();
    const monday = new Date(d);
    monday.setUTCDate(d.getUTCDate() - ((day + 6) % 7));
    return monday.toISOString().slice(0, 10);
  };

  const marketplaces = Array.from(new Set(rows.map((r) => r.marketplace))).sort();
  const byWeek = new Map<string, Record<string, number>>();

  for (const r of rows) {
    const week = weekOf(r.order_date);
    if (!byWeek.has(week)) byWeek.set(week, {});
    const bucket = byWeek.get(week)!;
    bucket[r.marketplace] = (bucket[r.marketplace] ?? 0) + r.revenue;
  }

  const data = Array.from(byWeek.entries())
    .map(([week, values]) => ({ week, ...values }))
    .sort((a, b) => a.week.localeCompare(b.week));

  return (
    <ChartCard
      title="Marketplace Comparison"
      subtitle="Weekly revenue split across channels"
      className="h-80 md:col-span-2"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#263252" vertical={false} />
          <XAxis dataKey="week" tick={{ fill: "#8992ac", fontSize: 10 }} tickLine={false} axisLine={{ stroke: "#263252" }} />
          <YAxis
            tick={{ fill: "#8992ac", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `$${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`}
          />
          <Tooltip
            contentStyle={{ background: "#1a2438", border: "1px solid #263252", borderRadius: 8, fontSize: 12 }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(v: any) => `$${Number(v).toLocaleString()}`}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: "#8992ac" }} />
          {marketplaces.map((m) => (
            <Bar key={m} dataKey={m} stackId="a" fill={MARKETPLACE_COLORS[m] ?? "#8992ac"} radius={[0, 0, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
