"use client";

import { forwardRef } from "react";
import { Line, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Scatter } from "recharts";
import { ChartCard } from "../ChartCard";
import type { ForecastResult } from "@/lib/types";

interface ForecastChartProps {
  forecast: ForecastResult;
}

export const ForecastChart = forwardRef<HTMLDivElement, ForecastChartProps>(({ forecast }, ref) => {
  const data = forecast.series.map((p) => ({
    period: p.period,
    actual: p.actual,
    forecast: p.forecast,
  }));

  // Bridge the last actual point into the forecast point so the line connects visually.
  const lastActualIdx = [...data].reverse().findIndex((d) => d.actual !== null);
  if (lastActualIdx !== -1) {
    const idx = data.length - 1 - lastActualIdx;
    if (data[idx + 1]) data[idx + 1].forecast = data[idx + 1].forecast ?? null;
    data[idx] = { ...data[idx] };
  }

  return (
    <ChartCard
      ref={ref}
      title="Forecast vs. Actual"
      subtitle={`Next period revenue: $${forecast.nextPeriodRevenue.toLocaleString()} (${forecast.confidence} confidence)`}
      className="h-80"
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#263252" vertical={false} />
          <XAxis dataKey="period" tick={{ fill: "#8992ac", fontSize: 10 }} tickLine={false} axisLine={{ stroke: "#263252" }} />
          <YAxis
            tick={{ fill: "#8992ac", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `$${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`}
          />
          <Tooltip
            contentStyle={{ background: "#1a2438", border: "1px solid #263252", borderRadius: 8, fontSize: 12 }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(v: any, name: any) => [v ? `$${Number(v).toLocaleString()}` : "—", name === "actual" ? "Actual" : "Forecast"] as [string, string]}
          />
          <Line type="monotone" dataKey="actual" stroke="#4c8bf5" strokeWidth={2} dot={{ r: 3, fill: "#4c8bf5" }} connectNulls />
          <Scatter dataKey="forecast" fill="#e8a33d" shape="diamond" />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  );
});
ForecastChart.displayName = "ForecastChart";
