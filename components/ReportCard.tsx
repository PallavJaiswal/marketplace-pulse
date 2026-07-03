"use client";

import { FileDown, FileSpreadsheet, Eye } from "lucide-react";
import type { PipelineResult } from "@/lib/types";
import { exportToExcel } from "@/lib/exportExcel";
import { exportToPdf } from "@/lib/exportPdf";

interface ReportCardProps {
  result: PipelineResult;
  onView: () => void;
}

export function ReportCard({ result, onView }: ReportCardProps) {
  const growth = result.kpis.momGrowthPct;

  return (
    <div className="rounded-xl border border-hairline bg-panel p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-display font-semibold text-sm">{result.filename}</p>
          <p className="text-xs text-text-muted mt-0.5">
            {new Date(result.uploadedAt).toLocaleString()}
          </p>
        </div>
        <span
          className={`mono-label text-[10px] px-2 py-1 rounded-full border ${
            growth >= 0
              ? "text-positive border-positive/25 bg-positive/10"
              : "text-negative border-negative/25 bg-negative/10"
          }`}
        >
          {growth >= 0 ? "+" : ""}
          {growth}% MoM
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="font-display font-semibold text-base">${result.kpis.totalRevenue.toLocaleString()}</p>
          <p className="mono-label text-[9px] text-text-muted mt-0.5">Revenue</p>
        </div>
        <div>
          <p className="font-display font-semibold text-base">{result.kpis.anomalyCount}</p>
          <p className="mono-label text-[9px] text-text-muted mt-0.5">Anomalies</p>
        </div>
        <div>
          <p className="font-display font-semibold text-base">{result.kpis.decliningSkuCount}</p>
          <p className="mono-label text-[9px] text-text-muted mt-0.5">Declining</p>
        </div>
      </div>

      <div className="flex gap-2 pt-2 border-t border-hairline">
        <button
          onClick={onView}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium rounded-lg border border-hairline hover:border-signal/50 hover:text-signal px-3 py-2 transition-colors"
        >
          <Eye className="w-3.5 h-3.5" /> View
        </button>
        <button
          onClick={() => exportToExcel(result)}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium rounded-lg border border-hairline hover:border-signal/50 hover:text-signal px-3 py-2 transition-colors"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
        </button>
        <button
          onClick={() => exportToPdf(result)}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium rounded-lg border border-hairline hover:border-signal/50 hover:text-signal px-3 py-2 transition-colors"
        >
          <FileDown className="w-3.5 h-3.5" /> PDF
        </button>
      </div>
    </div>
  );
}
