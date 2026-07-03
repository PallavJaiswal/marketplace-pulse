import type { SalesRow, SkuPerformance, Trend } from "./types";

/**
 * Splits the dataset's date range into two equal halves (prior period vs. current period)
 * and ranks every SKU by period-over-period revenue % change. This is the standard
 * "top movers / decliners" comparison ops teams build manually every week.
 */
export function rankSkuPerformance(
  rows: SalesRow[],
  opts: { topThresholdPct?: number; decliningThresholdPct?: number } = {}
): SkuPerformance[] {
  const topThresholdPct = opts.topThresholdPct ?? 15;
  const decliningThresholdPct = opts.decliningThresholdPct ?? -15;

  if (rows.length === 0) return [];

  const dates = rows.map((r) => r.order_date).sort();
  const minDate = dates[0];
  const maxDate = dates[dates.length - 1];
  const minTime = new Date(minDate).getTime();
  const maxTime = new Date(maxDate).getTime();
  const midTime = minTime + (maxTime - minTime) / 2;

  interface Agg {
    category: string;
    brand: string;
    revenuePrior: number;
    revenueCurrent: number;
    unitsCurrent: number;
  }
  const bySku = new Map<string, Agg>();

  for (const r of rows) {
    if (!bySku.has(r.sku)) {
      bySku.set(r.sku, { category: r.category, brand: r.brand, revenuePrior: 0, revenueCurrent: 0, unitsCurrent: 0 });
    }
    const agg = bySku.get(r.sku)!;
    const t = new Date(r.order_date).getTime();
    if (t < midTime) {
      agg.revenuePrior += r.revenue;
    } else {
      agg.revenueCurrent += r.revenue;
      agg.unitsCurrent += r.units;
    }
  }

  const results: SkuPerformance[] = [];
  for (const [sku, agg] of bySku) {
    const pctChange =
      agg.revenuePrior > 0
        ? ((agg.revenueCurrent - agg.revenuePrior) / agg.revenuePrior) * 100
        : agg.revenueCurrent > 0
        ? 100
        : 0;

    let trend: Trend = "stable";
    if (pctChange >= topThresholdPct) trend = "top";
    else if (pctChange <= decliningThresholdPct) trend = "declining";

    results.push({
      sku,
      category: agg.category,
      brand: agg.brand,
      revenueCurrent: Math.round(agg.revenueCurrent * 100) / 100,
      revenuePrior: Math.round(agg.revenuePrior * 100) / 100,
      unitsCurrent: agg.unitsCurrent,
      pctChange: Math.round(pctChange * 10) / 10,
      trend,
    });
  }

  return results.sort((a, b) => b.revenueCurrent - a.revenueCurrent);
}
