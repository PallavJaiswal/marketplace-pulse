import type { ForecastPoint, ForecastResult, SalesRow } from "./types";

function toWeekKey(dateStr: string): string {
  const d = new Date(dateStr);
  // Monday-anchored ISO week key, e.g. 2026-W23
  const target = new Date(d.valueOf());
  const dayNr = (d.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 3);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((target.getTime() - firstThursday.getTime()) / 86400000 - 3) / 7);
  return `${target.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/**
 * Aggregates revenue into weekly buckets, then forecasts the next period using
 * a linear trend fit over the last N weeks (falls back to a simple moving average
 * if there isn't enough history for a stable trend line).
 */
export function forecastNextPeriod(rows: SalesRow[]): ForecastResult {
  if (rows.length === 0) {
    return { method: "moving_average", nextPeriodRevenue: 0, confidence: "low", series: [] };
  }

  const weekly = new Map<string, number>();
  for (const r of rows) {
    const key = toWeekKey(r.order_date);
    weekly.set(key, (weekly.get(key) ?? 0) + r.revenue);
  }

  const sortedWeeks = Array.from(weekly.keys()).sort();
  const values = sortedWeeks.map((w) => weekly.get(w)!);

  let forecastValue: number;
  let method: ForecastResult["method"];
  let confidence: ForecastResult["confidence"];

  if (values.length >= 4) {
    // Simple linear regression over week index -> revenue
    const n = values.length;
    const xs = values.map((_, i) => i);
    const xMean = xs.reduce((a, b) => a + b, 0) / n;
    const yMean = values.reduce((a, b) => a + b, 0) / n;
    let num = 0;
    let den = 0;
    for (let i = 0; i < n; i++) {
      num += (xs[i] - xMean) * (values[i] - yMean);
      den += (xs[i] - xMean) ** 2;
    }
    const slope = den === 0 ? 0 : num / den;
    const intercept = yMean - slope * xMean;
    const predicted = intercept + slope * n;
    forecastValue = Math.max(0, predicted);
    method = "linear_trend";
    confidence = n >= 8 ? "high" : "medium";
  } else {
    forecastValue = values.reduce((a, b) => a + b, 0) / values.length;
    method = "moving_average";
    confidence = "low";
  }

  const series: ForecastPoint[] = sortedWeeks.map((w, i) => ({
    period: w,
    actual: values[i],
    forecast: null,
  }));
  series.push({
    period: "Next period",
    actual: null,
    forecast: Math.round(forecastValue),
  });

  return {
    method,
    nextPeriodRevenue: Math.round(forecastValue * 100) / 100,
    confidence,
    series,
  };
}
