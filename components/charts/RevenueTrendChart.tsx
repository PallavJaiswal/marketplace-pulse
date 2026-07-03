"use client";

import { forwardRef } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { ChartCard } from "../ChartCard";
import type { SalesRow } from "@/lib/types";

interface RevenueTrendChartProps {
  rows: SalesRow[];
}

export const RevenueTrendChart = forwardRef<HTMLDivElement, RevenueTrendChartProps>(
  ({ rows }, ref) => {
    const byDate = new Map<string, number>();
    for (const r of rows) {
      byDate.set(r.order_date, (byDate.get(r.order_date) ?? 0) + r.revenue);
    }
    const data = Array.from(byDate.entries())
      .map(([date, revenue]) => ({ date, revenue: Math.round(revenue) }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return (
      <ChartCard ref={ref} title="Revenue Trend" subtitle="Daily revenue across the uploaded period" className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#263252" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: "#8992ac", fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: "#263252" }}
              minTickGap={30}
            />
            <YAxis
              tick={{ fill: "#8992ac", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `$${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`}
            />
            <Tooltip
              contentStyle={{ background: "#1a2438", border: "1px solid #263252", borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: "#ecEff6" }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(v: any) => [`$${Number(v).toLocaleString()}`, "Revenue"] as [string, string]}
            />
            <Line type="monotone" dataKey="revenue" stroke="#e8a33d" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    );
  }
);
RevenueTrendChart.displayName = "RevenueTrendChart";
