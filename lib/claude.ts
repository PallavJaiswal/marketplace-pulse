import type { Anomaly, CleaningSummary, ForecastResult, KpiSummary, NarrativeResult, SkuPerformance } from "./types";

/**
 * Builds a compact, aggregated summary (never raw row-level data) and asks the
 * server-side /api/narrative route to have Claude write the executive report narrative.
 * Keeping the payload aggregated is deliberate: cheaper, faster, and avoids sending
 * potentially large raw datasets through the model.
 */
export async function generateNarrative(
  cleaningSummary: CleaningSummary,
  kpis: KpiSummary,
  anomalies: Anomaly[],
  performance: SkuPerformance[],
  forecast: ForecastResult
): Promise<NarrativeResult> {
  const topAnomalies = anomalies.slice(0, 6).map((a) => ({
    sku: a.sku,
    category: a.category,
    date: a.date,
    type: a.type,
    value: a.value,
    expected: a.expected,
  }));

  const topSkus = performance
    .filter((p) => p.trend === "top")
    .slice(0, 5)
    .map((p) => ({ sku: p.sku, category: p.category, pctChange: p.pctChange, revenueCurrent: p.revenueCurrent }));

  const decliningSkus = performance
    .filter((p) => p.trend === "declining")
    .slice(0, 5)
    .map((p) => ({ sku: p.sku, category: p.category, pctChange: p.pctChange, revenueCurrent: p.revenueCurrent }));

  const res = await fetch("/api/narrative", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      cleaningSummary: {
        totalRowsIn: cleaningSummary.totalRowsIn,
        totalRowsOut: cleaningSummary.totalRowsOut,
        duplicatesRemoved: cleaningSummary.duplicatesRemoved,
        missingValuesHandled: cleaningSummary.missingValuesHandled,
      },
      kpis,
      topAnomalies,
      topSkus,
      decliningSkus,
      forecast: {
        nextPeriodRevenue: forecast.nextPeriodRevenue,
        confidence: forecast.confidence,
        method: forecast.method,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error || `Narrative request failed (${res.status})`);
  }

  return res.json();
}
