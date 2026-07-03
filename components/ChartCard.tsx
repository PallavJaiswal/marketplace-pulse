import { forwardRef } from "react";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

export const ChartCard = forwardRef<HTMLDivElement, ChartCardProps>(
  ({ title, subtitle, children, className }, ref) => {
    return (
      <div
        ref={ref}
        className={`rounded-xl border border-hairline bg-panel p-5 flex flex-col ${className ?? ""}`}
      >
        <div className="mb-4">
          <h3 className="font-display font-semibold text-sm">{title}</h3>
          {subtitle && <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex-1 min-h-0">{children}</div>
      </div>
    );
  }
);
ChartCard.displayName = "ChartCard";
