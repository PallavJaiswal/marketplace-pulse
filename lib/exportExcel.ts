import * as XLSX from "xlsx";
import type { PipelineResult } from "./types";

export function exportToExcel(result: PipelineResult) {
  const wb = XLSX.utils.book_new();

  const summaryData = [
    ["Marketplace Pulse — Report Summary"],
    ["Generated", new Date(result.uploadedAt).toLocaleString()],
    ["Source file", result.filename],
    [],
    ["KPI", "Value"],
    ["Total Revenue", result.kpis.totalRevenue],
    ["Total Units", result.kpis.totalUnits],
    ["Avg Order Value", result.kpis.avgOrderValue],
    ["MoM Growth %", result.kpis.momGrowthPct],
    ["Anomalies Detected", result.kpis.anomalyCount],
    ["Declining SKUs", result.kpis.decliningSkuCount],
    [],
    ["Executive Summary"],
    [result.narrative?.summary ?? "Not generated"],
    [],
    ["Recommendations"],
    ...(result.narrative?.recommendations.map((r) => [r]) ?? []),
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet["!cols"] = [{ wch: 28 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");

  const cleanedSheet = XLSX.utils.json_to_sheet(result.cleanedRows);
  XLSX.utils.book_append_sheet(wb, cleanedSheet, "Cleaned Data");

  const anomalySheet = XLSX.utils.json_to_sheet(
    result.anomalies.map((a) => ({
      sku: a.sku,
      category: a.category,
      date: a.date,
      type: a.type,
      value: a.value,
      expected: a.expected,
      z_score: a.zScore,
    }))
  );
  XLSX.utils.book_append_sheet(wb, anomalySheet, "Anomaly Log");

  const perfSheet = XLSX.utils.json_to_sheet(
    result.skuPerformance.map((p) => ({
      sku: p.sku,
      category: p.category,
      brand: p.brand,
      revenue_current: p.revenueCurrent,
      revenue_prior: p.revenuePrior,
      units_current: p.unitsCurrent,
      pct_change: p.pctChange,
      trend: p.trend,
    }))
  );
  XLSX.utils.book_append_sheet(wb, perfSheet, "SKU Performance");

  const cleaningLogSheet = XLSX.utils.json_to_sheet(
    result.cleaningSummary.issues.map((i) => ({
      row: i.rowIndex,
      field: i.field,
      issue: i.issue,
      action: i.action,
    }))
  );
  XLSX.utils.book_append_sheet(wb, cleaningLogSheet, "Cleaning Log");

  const filename = `marketplace-pulse-report-${result.uploadedAt.slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename);
}
