import type { Filters, SalesRow } from "./types";

export function applyFilters(rows: SalesRow[], filters: Filters): SalesRow[] {
  return rows.filter((r) => {
    if (filters.dateStart && r.order_date < filters.dateStart) return false;
    if (filters.dateEnd && r.order_date > filters.dateEnd) return false;
    if (filters.marketplace && r.marketplace !== filters.marketplace) return false;
    if (filters.category && r.category !== filters.category) return false;
    if (filters.brand && r.brand !== filters.brand) return false;
    if (filters.country && r.country !== filters.country) return false;
    if (filters.sku && !r.sku.toLowerCase().includes(filters.sku.toLowerCase())) return false;
    return true;
  });
}

export function uniqueValues(rows: SalesRow[], field: keyof SalesRow): string[] {
  return Array.from(new Set(rows.map((r) => String(r[field])))).sort();
}
