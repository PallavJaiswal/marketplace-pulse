import type { Anomaly, SalesRow } from "./types";

interface DailyPoint {
  date: string;
  revenue: number;
}

function groupBySkuDay(rows: SalesRow[]): Map<string, DailyPoint[]> {
  const bySku = new Map<string, Map<string, number>>();
  for (const r of rows) {
    if (!bySku.has(r.sku)) bySku.set(r.sku, new Map());
    const dayMap = bySku.get(r.sku)!;
    dayMap.set(r.order_date, (dayMap.get(r.order_date) ?? 0) + r.revenue);
  }
  const result = new Map<string, DailyPoint[]>();
  for (const [sku, dayMap] of bySku) {
    const points = Array.from(dayMap.entries())
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));
    result.set(sku, points);
  }
  return result;
}

function mean(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / (values.length || 1);
}

function stdDev(values: number[], m: number): number {
  if (values.length < 2) return 0;
  const variance = values.reduce((sum, v) => sum + (v - m) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

/**
 * Flags SKU-days whose revenue deviates significantly (|z| > threshold) from that
 * SKU's own rolling mean/stdev — i.e. genuine outliers relative to the SKU's normal
 * pattern, not just "biggest number in the dataset".
 */
export function detectAnomalies(
  rows: SalesRow[],
  opts: { zThreshold?: number; minHistory?: number } = {}
): Anomaly[] {
  const zThreshold = opts.zThreshold ?? 2.2;
  const minHistory = opts.minHistory ?? 5;

  const skuCategory = new Map<string, string>();
  for (const r of rows) skuCategory.set(r.sku, r.category);

  const bySku = groupBySkuDay(rows);
  const anomalies: Anomaly[] = [];

  for (const [sku, points] of bySku) {
    if (points.length < minHistory) continue;

    const values = points.map((p) => p.revenue);

    points.forEach((point, i) => {
      // Use all *other* points as the baseline so the point being tested doesn't inflate its own stdev.
      const others = values.filter((_, j) => j !== i);
      if (others.length < minHistory - 1) return;
      const m = mean(others);
      const sd = stdDev(others, m);
      if (sd === 0) return;

      const z = (point.revenue - m) / sd;
      if (Math.abs(z) >= zThreshold) {
        anomalies.push({
          sku,
          category: skuCategory.get(sku) ?? "Uncategorized",
          date: point.date,
          type: z > 0 ? "spike" : "drop",
          value: Math.round(point.revenue * 100) / 100,
          expected: Math.round(m * 100) / 100,
          zScore: Math.round(z * 100) / 100,
        });
      }
    });
  }

  return anomalies.sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore));
}
