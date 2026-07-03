import type { Anomaly, KpiSummary, SalesRow, SkuPerformance } from "./types";

export function computeKpis(
  rows: SalesRow[],
  anomalies: Anomaly[],
  performance: SkuPerformance[]
): KpiSummary {
  if (rows.length === 0) {
    return {
      totalRevenue: 0,
      totalUnits: 0,
      avgOrderValue: 0,
      momGrowthPct: 0,
      anomalyCount: 0,
      decliningSkuCount: 0,
    };
  }

  const totalRevenue = rows.reduce((sum, r) => sum + r.revenue, 0);
  const totalUnits = rows.reduce((sum, r) => sum + r.units, 0);
  const avgOrderValue = totalRevenue / rows.length;

  const priorRevenue = performance.reduce((s, p) => s + p.revenuePrior, 0);
  const currentRevenue = performance.reduce((s, p) => s + p.revenueCurrent, 0);
  const momGrowthPct = priorRevenue > 0 ? ((currentRevenue - priorRevenue) / priorRevenue) * 100 : 0;

  const decliningSkuCount = performance.filter((p) => p.trend === "declining").length;

  return {
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalUnits: Math.round(totalUnits),
    avgOrderValue: Math.round(avgOrderValue * 100) / 100,
    momGrowthPct: Math.round(momGrowthPct * 10) / 10,
    anomalyCount: anomalies.length,
    decliningSkuCount,
  };
}
