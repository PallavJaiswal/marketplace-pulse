"use client";

import { SlidersHorizontal, RotateCcw } from "lucide-react";
import type { Filters, SalesRow } from "@/lib/types";
import { uniqueValues } from "@/lib/filters";

interface FiltersSidebarProps {
  rows: SalesRow[];
  filters: Filters;
  onChange: (f: Filters) => void;
  onReset: () => void;
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | null;
  options: string[];
  onChange: (v: string | null) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="mono-label text-[10px] text-text-muted">{label}</label>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        className="bg-panel-raised border border-hairline rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-signal"
      >
        <option value="">All</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

export function FiltersSidebar({ rows, filters, onChange, onReset }: FiltersSidebarProps) {
  return (
    <aside className="w-full lg:w-64 shrink-0 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-text-primary">
          <SlidersHorizontal className="w-4 h-4 text-signal" strokeWidth={2} />
          <h3 className="font-display font-semibold text-sm">Filters</h3>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-1 text-xs text-text-muted hover:text-signal transition-colors"
        >
          <RotateCcw className="w-3 h-3" /> Reset
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="mono-label text-[10px] text-text-muted">Date Range</label>
        <div className="flex gap-2">
          <input
            type="date"
            value={filters.dateStart ?? ""}
            onChange={(e) => onChange({ ...filters, dateStart: e.target.value || null })}
            className="w-full bg-panel-raised border border-hairline rounded-lg px-2 py-2 text-xs text-text-primary focus:outline-none focus:border-signal"
          />
          <input
            type="date"
            value={filters.dateEnd ?? ""}
            onChange={(e) => onChange({ ...filters, dateEnd: e.target.value || null })}
            className="w-full bg-panel-raised border border-hairline rounded-lg px-2 py-2 text-xs text-text-primary focus:outline-none focus:border-signal"
          />
        </div>
      </div>

      <Select
        label="Marketplace"
        value={filters.marketplace}
        options={uniqueValues(rows, "marketplace")}
        onChange={(v) => onChange({ ...filters, marketplace: v })}
      />
      <Select
        label="Category"
        value={filters.category}
        options={uniqueValues(rows, "category")}
        onChange={(v) => onChange({ ...filters, category: v })}
      />
      <Select
        label="Brand"
        value={filters.brand}
        options={uniqueValues(rows, "brand")}
        onChange={(v) => onChange({ ...filters, brand: v })}
      />
      <Select
        label="Country"
        value={filters.country}
        options={uniqueValues(rows, "country")}
        onChange={(v) => onChange({ ...filters, country: v })}
      />

      <div className="flex flex-col gap-1.5">
        <label className="mono-label text-[10px] text-text-muted">SKU Search</label>
        <input
          type="text"
          placeholder="e.g. AB-1001"
          value={filters.sku ?? ""}
          onChange={(e) => onChange({ ...filters, sku: e.target.value || null })}
          className="bg-panel-raised border border-hairline rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-signal"
        />
      </div>
    </aside>
  );
}
