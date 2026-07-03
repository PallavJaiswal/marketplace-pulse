import { TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import type { Anomaly } from "@/lib/types";

export function AnomalyList({ anomalies }: { anomalies: Anomaly[] }) {
  return (
    <div className="rounded-xl border border-hairline bg-panel overflow-hidden">
      <div className="px-5 py-4 border-b border-hairline flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-signal" strokeWidth={2} />
          <h3 className="font-display font-semibold text-sm">Anomalies Detected</h3>
        </div>
        <span className="mono-label text-[10px] text-text-muted">{anomalies.length} flagged</span>
      </div>
      <div className="max-h-[420px] overflow-y-auto divide-y divide-hairline">
        {anomalies.length === 0 && (
          <p className="px-5 py-8 text-center text-text-muted text-sm">
            No statistically significant anomalies in this period.
          </p>
        )}
        {anomalies.slice(0, 25).map((a, i) => (
          <div key={i} className="px-5 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {a.type === "spike" ? (
                <TrendingUp className="w-4 h-4 text-positive shrink-0" strokeWidth={2} />
              ) : (
                <TrendingDown className="w-4 h-4 text-negative shrink-0" strokeWidth={2} />
              )}
              <div className="min-w-0">
                <p className="text-sm font-mono text-text-primary truncate">{a.sku}</p>
                <p className="text-xs text-text-muted">
                  {a.category} · {a.date}
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-mono text-text-primary">${a.value.toLocaleString()}</p>
              <p className="text-xs text-text-muted">expected ${a.expected.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
