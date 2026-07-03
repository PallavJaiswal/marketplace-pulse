import clsx from "clsx";
import type { LucideIcon } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string;
  icon?: LucideIcon;
  trend?: { value: string; positive: boolean } | null;
  accent?: "signal" | "positive" | "negative" | "default";
}

export function KpiCard({ label, value, icon: Icon, trend, accent = "default" }: KpiCardProps) {
  const accentColor = {
    signal: "text-signal",
    positive: "text-positive",
    negative: "text-negative",
    default: "text-text-primary",
  }[accent];

  return (
    <div className="relative rounded-xl border border-hairline bg-panel px-5 py-4 overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <span className="mono-label text-[10px] text-text-muted">{label}</span>
        {Icon && <Icon className="w-3.5 h-3.5 text-text-muted" strokeWidth={2} />}
      </div>
      <div className="flex items-baseline gap-2">
        <span className={clsx("font-display font-semibold text-2xl tracking-tight", accentColor)}>
          {value}
        </span>
        {trend && (
          <span
            className={clsx(
              "text-xs font-mono",
              trend.positive ? "text-positive" : "text-negative"
            )}
          >
            {trend.positive ? "▲" : "▼"} {trend.value}
          </span>
        )}
      </div>
    </div>
  );
}
