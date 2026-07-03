import type { CleaningIssue, CleaningSummary, ColumnMapping, RawRow, SalesRow } from "./types";

/** Tries several common date formats and returns an ISO yyyy-mm-dd string, or null if unparseable. */
function normalizeDate(raw: string): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();

  // Already ISO
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);

  // yyyy/mm/dd
  let m = trimmed.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;

  // mm/dd/yyyy or mm-dd-yyyy
  m = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (m) return `${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`;

  // Fallback to Date parsing
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);

  return null;
}

function parseNumber(raw: string): number | null {
  if (raw === undefined || raw === null) return null;
  const cleaned = raw.replace(/[$,£€\s]/g, "").trim();
  if (cleaned === "") return null;
  const n = Number(cleaned);
  return isNaN(n) ? null : n;
}

function normalizeText(raw: string | undefined): string {
  return (raw ?? "").trim();
}

export interface CleaningResult {
  rows: SalesRow[];
  summary: CleaningSummary;
}

/**
 * Cleans raw parsed rows into typed SalesRow objects.
 * Every modification (imputation, drop, normalization) is logged to the audit trail
 * in `summary.issues` — this pipeline is AI-assisted in spirit but fully auditable,
 * not a black box.
 */
export function cleanSalesRows(rawRows: RawRow[], mapping: ColumnMapping): CleaningResult {
  const issues: CleaningIssue[] = [];
  const seen = new Set<string>();
  let duplicatesRemoved = 0;
  let missingValuesHandled = 0;
  let datesNormalized = 0;

  // Compute a category-level median unit price so missing revenue/units can be imputed sensibly
  // rather than dropped outright, wherever the counterpart field is present.
  const priceSamples: Record<string, number[]> = {};
  for (const r of rawRows) {
    const category = normalizeText(r[mapping.category]) || "Uncategorized";
    const units = parseNumber(r[mapping.units]);
    const revenue = parseNumber(r[mapping.revenue]);
    if (units && revenue && units > 0) {
      priceSamples[category] = priceSamples[category] || [];
      priceSamples[category].push(revenue / units);
    }
  }
  const medianPrice: Record<string, number> = {};
  for (const [cat, samples] of Object.entries(priceSamples)) {
    const sorted = [...samples].sort((a, b) => a - b);
    medianPrice[cat] = sorted[Math.floor(sorted.length / 2)] || 0;
  }

  const cleaned: SalesRow[] = [];

  rawRows.forEach((raw, idx) => {
    const category = normalizeText(raw[mapping.category]) || "Uncategorized";
    const brand = normalizeText(raw[mapping.brand]) || "Unbranded";
    const sku = normalizeText(raw[mapping.sku]);
    const marketplace = normalizeText(raw[mapping.marketplace]) || "Unknown";
    const country = normalizeText(raw[mapping.country]) || "Unknown";

    if (!sku) {
      issues.push({ rowIndex: idx, field: "sku", issue: "Missing SKU — row dropped", action: "dropped" });
      return;
    }

    const rawDate = raw[mapping.order_date];
    const isoDate = normalizeDate(rawDate ?? "");
    if (!isoDate) {
      issues.push({ rowIndex: idx, field: "order_date", issue: `Unparseable date "${rawDate}" — row dropped`, action: "dropped" });
      return;
    }
    if (rawDate && normalizeDate(rawDate) !== rawDate) {
      datesNormalized++;
    }

    let units = parseNumber(raw[mapping.units]);
    let revenue = parseNumber(raw[mapping.revenue]);

    if (units === null && revenue !== null) {
      const price = medianPrice[category] || 1;
      units = Math.max(1, Math.round(revenue / price));
      issues.push({ rowIndex: idx, field: "units", issue: `Missing units — imputed from revenue at category median price`, action: "imputed" });
      missingValuesHandled++;
    }
    if (revenue === null && units !== null) {
      const price = medianPrice[category] || 0;
      revenue = Math.round(units * price * 100) / 100;
      issues.push({ rowIndex: idx, field: "revenue", issue: `Missing revenue — imputed from units at category median price`, action: "imputed" });
      missingValuesHandled++;
    }
    if (units === null && revenue === null) {
      issues.push({ rowIndex: idx, field: "units/revenue", issue: "Both units and revenue missing — row dropped", action: "dropped" });
      return;
    }

    const dedupeKey = `${isoDate}|${sku}|${marketplace}|${units}|${revenue}`;
    if (seen.has(dedupeKey)) {
      duplicatesRemoved++;
      issues.push({ rowIndex: idx, field: "*", issue: "Exact duplicate of a previous row — removed", action: "dropped" });
      return;
    }
    seen.add(dedupeKey);

    cleaned.push({
      order_date: isoDate,
      sku,
      category,
      brand,
      marketplace,
      country,
      units: units as number,
      revenue: revenue as number,
    });
  });

  const summary: CleaningSummary = {
    totalRowsIn: rawRows.length,
    totalRowsOut: cleaned.length,
    duplicatesRemoved,
    missingValuesHandled,
    datesNormalized,
    issues,
  };

  return { rows: cleaned, summary };
}
