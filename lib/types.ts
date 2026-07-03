// Core shared types for the Marketplace Pulse pipeline.
// Every stage of the pipeline (clean -> detect -> rank -> forecast -> narrate)
// reads and writes these shapes, so the whole app stays in sync through one contract.

export type RawRow = Record<string, string>;

export interface ColumnMapping {
  order_date: string;
  sku: string;
  category: string;
  brand: string;
  marketplace: string;
  country: string;
  units: string;
  revenue: string;
}

export interface SalesRow {
  order_date: string; // ISO yyyy-mm-dd
  sku: string;
  category: string;
  brand: string;
  marketplace: string;
  country: string;
  units: number;
  revenue: number;
}

export interface CleaningIssue {
  rowIndex: number;
  field: string;
  issue: string;
  action: "imputed" | "dropped" | "flagged" | "normalized";
}

export interface CleaningSummary {
  totalRowsIn: number;
  totalRowsOut: number;
  duplicatesRemoved: number;
  missingValuesHandled: number;
  datesNormalized: number;
  issues: CleaningIssue[];
}

export type AnomalyType = "spike" | "drop";

export interface Anomaly {
  sku: string;
  category: string;
  date: string;
  type: AnomalyType;
  value: number;
  expected: number;
  zScore: number;
}

export type Trend = "top" | "declining" | "stable";

export interface SkuPerformance {
  sku: string;
  category: string;
  brand: string;
  revenueCurrent: number;
  revenuePrior: number;
  unitsCurrent: number;
  pctChange: number;
  trend: Trend;
}

export interface ForecastPoint {
  period: string;
  actual: number | null;
  forecast: number | null;
}

export interface ForecastResult {
  method: "moving_average" | "linear_trend";
  nextPeriodRevenue: number;
  confidence: "low" | "medium" | "high";
  series: ForecastPoint[];
}

export interface KpiSummary {
  totalRevenue: number;
  totalUnits: number;
  avgOrderValue: number;
  momGrowthPct: number;
  anomalyCount: number;
  decliningSkuCount: number;
}

export interface NarrativeResult {
  summary: string;
  recommendations: string[];
  generatedAt: string;
  model: string;
}

export interface PipelineResult {
  uploadedAt: string;
  filename: string;
  cleanedRows: SalesRow[];
  cleaningSummary: CleaningSummary;
  anomalies: Anomaly[];
  skuPerformance: SkuPerformance[];
  forecast: ForecastResult;
  kpis: KpiSummary;
  narrative: NarrativeResult | null;
  narrativeError: string | null;
}

export interface Filters {
  dateStart: string | null;
  dateEnd: string | null;
  marketplace: string | null;
  category: string | null;
  brand: string | null;
  country: string | null;
  sku: string | null;
}

export const EMPTY_FILTERS: Filters = {
  dateStart: null,
  dateEnd: null,
  marketplace: null,
  category: null,
  brand: null,
  country: null,
  sku: null,
};
