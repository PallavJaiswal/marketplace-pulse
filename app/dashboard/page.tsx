"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { DollarSign, Package, Receipt, TrendingUp, AlertTriangle, TrendingDown, FileDown, FileSpreadsheet, UploadCloud } from "lucide-react";
import { useAppData } from "@/lib/store";
import { applyFilters } from "@/lib/filters";
import { rankSkuPerformance } from "@/lib/performance";
import { detectAnomalies } from "@/lib/anomalyDetection";
import { forecastNextPeriod } from "@/lib/forecasting";
import { computeKpis } from "@/lib/kpis";
import { exportToExcel } from "@/lib/exportExcel";
import { exportToPdf } from "@/lib/exportPdf";
import { captureElementAsPng } from "@/lib/captureChart";
import { KpiCard } from "@/components/KpiCard";
import { ExecutiveSummaryCard } from "@/components/ExecutiveSummaryCard";
import { FiltersSidebar } from "@/components/FiltersSidebar";
import { RevenueTrendChart } from "@/components/charts/RevenueTrendChart";
import { CategoryShareChart } from "@/components/charts/CategoryShareChart";
import { TopDecliningSkuChart } from "@/components/charts/TopDecliningSkuChart";
import { ForecastChart } from "@/components/charts/ForecastChart";
import { MarketplaceComparisonChart } from "@/components/charts/MarketplaceComparisonChart";
import { PerformanceTable } from "@/components/PerformanceTable";
import { AnomalyList } from "@/components/AnomalyList";

export default function DashboardPage() {
  const { result, filters, setFilters, resetFilters } = useAppData();
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const revenueChartRef = useRef<HTMLDivElement>(null);
  const forecastChartRef = useRef<HTMLDivElement>(null);

  const filteredRows = useMemo(() => {
    if (!result) return [];
    return applyFilters(result.cleanedRows, filters);
  }, [result, filters]);

  // Re-derive analytics on the *filtered* subset so the whole dashboard responds to filters,
  // not just the raw table.
  const performance = useMemo(() => rankSkuPerformance(filteredRows), [filteredRows]);
  const anomalies = useMemo(() => detectAnomalies(filteredRows), [filteredRows]);
  const forecast = useMemo(() => forecastNextPeriod(filteredRows), [filteredRows]);
  const kpis = useMemo(() => computeKpis(filteredRows, anomalies, performance), [filteredRows, anomalies, performance]);

  if (!result) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <UploadCloud className="w-10 h-10 text-text-muted mb-4" strokeWidth={1.5} />
        <h2 className="font-display font-semibold text-lg mb-2">No report loaded yet</h2>
        <p className="text-sm text-text-muted max-w-sm mb-6">
          Upload a sales export (or load the sample dataset) to generate your first automated report.
        </p>
        <Link
          href="/upload"
          className="rounded-xl bg-signal text-ink font-semibold px-5 py-3 text-sm hover:opacity-90 transition-opacity"
        >
          Go to Upload
        </Link>
      </div>
    );
  }

  async function handlePdfExport() {
    if (!result) return;
    setIsExportingPdf(true);
    try {
      const [revenueTrend, forecastImg] = await Promise.all([
        captureElementAsPng(revenueChartRef.current),
        captureElementAsPng(forecastChartRef.current),
      ]);
      exportToPdf(result, { revenueTrend, forecast: forecastImg });
    } finally {
      setIsExportingPdf(false);
    }
  }

  return (
    <div className="px-6 lg:px-8 py-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <p className="mono-label text-[10px] text-text-muted mb-1">
            {result.filename} · uploaded {new Date(result.uploadedAt).toLocaleString()}
          </p>
          <h1 className="font-display font-semibold text-2xl tracking-tight">Revenue Intelligence Dashboard</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => exportToExcel(result)}
            className="flex items-center gap-2 rounded-lg border border-hairline hover:border-signal/50 hover:text-signal px-4 py-2.5 text-sm font-medium transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" /> Excel
          </button>
          <button
            onClick={handlePdfExport}
            disabled={isExportingPdf}
            className="flex items-center gap-2 rounded-lg bg-signal text-ink px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <FileDown className="w-4 h-4" /> {isExportingPdf ? "Building PDF…" : "Export PDF"}
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <FiltersSidebar rows={result.cleanedRows} filters={filters} onChange={setFilters} onReset={resetFilters} />

        <div className="flex-1 min-w-0 flex flex-col gap-8">
          {/* KPI row */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            <KpiCard label="Total Revenue" value={`$${kpis.totalRevenue.toLocaleString()}`} icon={DollarSign} accent="signal" />
            <KpiCard label="Units Sold" value={kpis.totalUnits.toLocaleString()} icon={Package} />
            <KpiCard label="Avg Order Value" value={`$${kpis.avgOrderValue.toFixed(2)}`} icon={Receipt} />
            <KpiCard
              label="MoM Growth"
              value={`${kpis.momGrowthPct > 0 ? "+" : ""}${kpis.momGrowthPct}%`}
              icon={TrendingUp}
              accent={kpis.momGrowthPct >= 0 ? "positive" : "negative"}
            />
            <KpiCard label="Anomalies" value={String(kpis.anomalyCount)} icon={AlertTriangle} accent={kpis.anomalyCount > 0 ? "signal" : "default"} />
            <KpiCard label="Declining SKUs" value={String(kpis.decliningSkuCount)} icon={TrendingDown} accent={kpis.decliningSkuCount > 0 ? "negative" : "default"} />
          </div>

          <ExecutiveSummaryCard narrative={result.narrative} narrativeError={result.narrativeError} />

          {/* Charts grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <RevenueTrendChart rows={filteredRows} ref={revenueChartRef} />
            <CategoryShareChart rows={filteredRows} />
            <TopDecliningSkuChart performance={performance} />
            <ForecastChart forecast={forecast} ref={forecastChartRef} />
            <MarketplaceComparisonChart rows={filteredRows} />
          </div>

          {/* Tables */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <PerformanceTable data={performance} />
            <AnomalyList anomalies={anomalies} />
          </div>

          {/* Cleaning audit trail */}
          <details className="rounded-xl border border-hairline bg-panel p-5">
            <summary className="cursor-pointer font-display font-semibold text-sm">
              Data cleaning audit trail ({result.cleaningSummary.issues.length} actions)
            </summary>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <p className="font-display font-semibold text-lg">{result.cleaningSummary.totalRowsIn}</p>
                <p className="mono-label text-[9px] text-text-muted mt-1">Rows In</p>
              </div>
              <div>
                <p className="font-display font-semibold text-lg">{result.cleaningSummary.totalRowsOut}</p>
                <p className="mono-label text-[9px] text-text-muted mt-1">Rows Out</p>
              </div>
              <div>
                <p className="font-display font-semibold text-lg">{result.cleaningSummary.duplicatesRemoved}</p>
                <p className="mono-label text-[9px] text-text-muted mt-1">Duplicates Removed</p>
              </div>
              <div>
                <p className="font-display font-semibold text-lg">{result.cleaningSummary.missingValuesHandled}</p>
                <p className="mono-label text-[9px] text-text-muted mt-1">Values Imputed</p>
              </div>
            </div>
            {result.cleaningSummary.issues.length > 0 && (
              <div className="mt-4 max-h-56 overflow-y-auto divide-y divide-hairline text-xs font-mono">
                {result.cleaningSummary.issues.slice(0, 100).map((issue, i) => (
                  <div key={i} className="py-1.5 flex gap-3 text-text-muted">
                    <span className="text-text-primary/70 w-16 shrink-0">row {issue.rowIndex}</span>
                    <span className="w-20 shrink-0">{issue.field}</span>
                    <span>{issue.issue}</span>
                  </div>
                ))}
              </div>
            )}
          </details>
        </div>
      </div>
    </div>
  );
}
