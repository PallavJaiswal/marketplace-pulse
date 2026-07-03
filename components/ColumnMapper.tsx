"use client";

import type { ColumnMapping } from "@/lib/types";

const FIELD_DEFS: { key: keyof ColumnMapping; label: string; required: boolean }[] = [
  { key: "order_date", label: "Order Date", required: true },
  { key: "sku", label: "SKU", required: true },
  { key: "category", label: "Category", required: false },
  { key: "brand", label: "Brand", required: false },
  { key: "marketplace", label: "Marketplace", required: false },
  { key: "country", label: "Country", required: false },
  { key: "units", label: "Units Sold", required: true },
  { key: "revenue", label: "Revenue", required: true },
];

interface ColumnMapperProps {
  headers: string[];
  mapping: ColumnMapping;
  onChange: (mapping: ColumnMapping) => void;
}

// Best-effort auto-mapping based on common header naming conventions.
export function guessMapping(headers: string[]): ColumnMapping {
  const find = (candidates: string[]) => {
    const lower = headers.map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ""));
    for (const c of candidates) {
      const idx = lower.indexOf(c);
      if (idx !== -1) return headers[idx];
    }
    return "";
  };

  return {
    order_date: find(["orderdate", "date", "saledate", "transactiondate"]),
    sku: find(["sku", "asin", "productid", "itemid"]),
    category: find(["category", "producttype", "cat"]),
    brand: find(["brand", "manufacturer"]),
    marketplace: find(["marketplace", "channel", "platform", "store"]),
    country: find(["country", "region", "market"]),
    units: find(["units", "unitssold", "qty", "quantity"]),
    revenue: find(["revenue", "sales", "amount", "totalrevenue", "grossrevenue"]),
  };
}

export function ColumnMapper({ headers, mapping, onChange }: ColumnMapperProps) {
  return (
    <div className="rounded-xl border border-hairline bg-panel p-5">
      <div className="mb-4">
        <h3 className="font-display font-semibold text-sm">Map your columns</h3>
        <p className="text-xs text-text-muted mt-1">
          We auto-detected likely matches — adjust anything that looks wrong.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {FIELD_DEFS.map(({ key, label, required }) => (
          <div key={key} className="flex flex-col gap-1.5">
            <label className="mono-label text-[10px] text-text-muted">
              {label}
              {required && <span className="text-signal"> *</span>}
            </label>
            <select
              value={mapping[key]}
              onChange={(e) => onChange({ ...mapping, [key]: e.target.value })}
              className="bg-panel-raised border border-hairline rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-signal"
            >
              <option value="">— Not mapped —</option>
              {headers.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}

export function isMappingComplete(mapping: ColumnMapping): boolean {
  return Boolean(mapping.order_date && mapping.sku && mapping.units && mapping.revenue);
}
