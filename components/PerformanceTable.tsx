"use client";

import { useMemo, useState } from "react";
import { ArrowUpDown } from "lucide-react";
import clsx from "clsx";
import type { SkuPerformance } from "@/lib/types";

type SortKey = "sku" | "category" | "revenueCurrent" | "pctChange";

export function PerformanceTable({ data }: { data: SkuPerformance[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("revenueCurrent");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sorted = useMemo(() => {
    const copy = [...data];
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp = typeof av === "string" ? av.localeCompare(String(bv)) : (av as number) - (bv as number);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [data, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const columns: { key: SortKey; label: string; align?: "right" }[] = [
    { key: "sku", label: "SKU" },
    { key: "category", label: "Category" },
    { key: "revenueCurrent", label: "Revenue", align: "right" },
    { key: "pctChange", label: "% Change", align: "right" },
  ];

  return (
    <div className="rounded-xl border border-hairline bg-panel overflow-hidden">
      <div className="px-5 py-4 border-b border-hairline flex items-center justify-between">
        <h3 className="font-display font-semibold text-sm">SKU Performance</h3>
        <span className="mono-label text-[10px] text-text-muted">{data.length} SKUs</span>
      </div>
      <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-panel-raised z-10">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => toggleSort(col.key)}
                  className={clsx(
                    "px-5 py-2.5 mono-label text-[10px] text-text-muted cursor-pointer select-none whitespace-nowrap",
                    col.align === "right" ? "text-right" : "text-left"
                  )}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    <ArrowUpDown className="w-3 h-3 opacity-50" />
                  </span>
                </th>
              ))}
              <th className="px-5 py-2.5 mono-label text-[10px] text-text-muted text-left">Trend</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr key={row.sku} className="border-t border-hairline hover:bg-panel-raised/60 transition-colors">
                <td className="px-5 py-2.5 font-mono text-xs text-text-primary">{row.sku}</td>
                <td className="px-5 py-2.5 text-text-primary/80">{row.category}</td>
                <td className="px-5 py-2.5 text-right font-mono text-xs text-text-primary">
                  ${row.revenueCurrent.toLocaleString()}
                </td>
                <td
                  className={clsx(
                    "px-5 py-2.5 text-right font-mono text-xs",
                    row.pctChange > 0 ? "text-positive" : row.pctChange < 0 ? "text-negative" : "text-text-muted"
                  )}
                >
                  {row.pctChange > 0 ? "+" : ""}
                  {row.pctChange}%
                </td>
                <td className="px-5 py-2.5">
                  <span
                    className={clsx(
                      "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wide",
                      row.trend === "top" && "bg-positive/10 text-positive border border-positive/25",
                      row.trend === "declining" && "bg-negative/10 text-negative border border-negative/25",
                      row.trend === "stable" && "bg-panel-raised text-text-muted border border-hairline"
                    )}
                  >
                    {row.trend}
                  </span>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-text-muted text-sm">
                  No SKUs match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
