import type { RawRow } from "./types";

// Deterministic pseudo-random so the demo dataset looks the same every time it's generated.
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(42);

interface SkuDef {
  sku: string;
  category: string;
  brand: string;
  basePrice: number;
  baseUnitsPerDay: number;
  pattern: "stable" | "growing" | "declining" | "seasonal";
}

const SKU_CATALOG: SkuDef[] = [
  { sku: "AB-1001", category: "Kitchen", brand: "Northfield", basePrice: 24.99, baseUnitsPerDay: 18, pattern: "growing" },
  { sku: "AB-1002", category: "Kitchen", brand: "Northfield", basePrice: 34.5, baseUnitsPerDay: 9, pattern: "stable" },
  { sku: "AB-1010", category: "Kitchen", brand: "Cedar & Co", basePrice: 19.99, baseUnitsPerDay: 22, pattern: "declining" },
  { sku: "EL-2001", category: "Electronics", brand: "Vantix", basePrice: 59.0, baseUnitsPerDay: 14, pattern: "stable" },
  { sku: "EL-2002", category: "Electronics", brand: "Vantix", basePrice: 129.0, baseUnitsPerDay: 6, pattern: "growing" },
  { sku: "EL-2015", category: "Electronics", brand: "Orbiq", basePrice: 22.5, baseUnitsPerDay: 27, pattern: "seasonal" },
  { sku: "HB-3001", category: "Home & Beauty", brand: "Lumen", basePrice: 14.99, baseUnitsPerDay: 31, pattern: "stable" },
  { sku: "HB-3005", category: "Home & Beauty", brand: "Lumen", basePrice: 27.0, baseUnitsPerDay: 11, pattern: "declining" },
  { sku: "HB-3020", category: "Home & Beauty", brand: "Verdette", basePrice: 9.99, baseUnitsPerDay: 40, pattern: "growing" },
  { sku: "SP-4001", category: "Sports & Outdoors", brand: "Ridgeway", basePrice: 44.0, baseUnitsPerDay: 8, pattern: "seasonal" },
  { sku: "SP-4002", category: "Sports & Outdoors", brand: "Ridgeway", basePrice: 89.0, baseUnitsPerDay: 4, pattern: "stable" },
  { sku: "TY-5001", category: "Toys", brand: "Kindle & Pip", basePrice: 17.5, baseUnitsPerDay: 20, pattern: "stable" },
  { sku: "TY-5010", category: "Toys", brand: "Kindle & Pip", basePrice: 29.99, baseUnitsPerDay: 12, pattern: "growing" },
  { sku: "OF-6001", category: "Office", brand: "Rowan Supply", basePrice: 12.99, baseUnitsPerDay: 25, pattern: "declining" },
  { sku: "OF-6002", category: "Office", brand: "Rowan Supply", basePrice: 8.5, baseUnitsPerDay: 33, pattern: "stable" },
];

const MARKETPLACES = ["Amazon", "Walmart", "Shopify"];
const COUNTRIES = ["US", "CA", "UK"];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

/**
 * Generates ~90 days of realistic multi-marketplace order-level data with:
 * - a genuine growth trend on a few SKUs
 * - a genuinely declining SKU (HB-3005, OF-6001) for the "declining products" story
 * - two deliberate anomaly spikes/drops for the anomaly-detection demo
 * - normal day-to-day noise
 */
export function generateSampleSalesRows(days = 90): RawRow[] {
  const rows: RawRow[] = [];
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - days);

  for (let d = 0; d < days; d++) {
    const date = new Date(start);
    date.setDate(date.getDate() + d);
    const dateStr = date.toISOString().slice(0, 10);
    const progress = d / days; // 0 -> 1 across the window

    for (const item of SKU_CATALOG) {
      // Not every SKU sells every day — that's realistic and also exercises "missing" handling.
      if (rand() > 0.82) continue;

      let unitsToday = item.baseUnitsPerDay * (0.75 + rand() * 0.5);

      if (item.pattern === "growing") unitsToday *= 1 + progress * 0.9;
      if (item.pattern === "declining") unitsToday *= 1 - progress * 0.65;
      if (item.pattern === "seasonal") {
        const weekPhase = Math.sin((d / 7) * Math.PI * 2);
        unitsToday *= 1 + weekPhase * 0.4;
      }

      // Deliberate anomaly: a sharp one-day spike for EL-2015 around day 30 (promo event)
      if (item.sku === "EL-2015" && d === 30) unitsToday *= 5.5;
      // Deliberate anomaly: a sharp one-day drop for AB-1001 around day 60 (stockout / listing suppression)
      if (item.sku === "AB-1001" && d === 60) unitsToday *= 0.08;

      const units = Math.max(0, Math.round(unitsToday));
      if (units === 0) continue;

      const priceJitter = item.basePrice * (0.97 + rand() * 0.06);
      const revenue = Math.round(units * priceJitter * 100) / 100;

      rows.push({
        order_date: dateStr,
        sku: item.sku,
        category: item.category,
        brand: item.brand,
        marketplace: pick(MARKETPLACES),
        country: pick(COUNTRIES),
        units: String(units),
        revenue: revenue.toFixed(2),
      });
    }
  }

  // Sprinkle in a handful of messy rows so the "AI cleaning" step has real work to do.
  const messyCount = Math.round(rows.length * 0.03);
  for (let i = 0; i < messyCount; i++) {
    const idx = Math.floor(rand() * rows.length);
    const messType = rand();
    if (messType < 0.3) rows[idx].revenue = ""; // missing revenue
    else if (messType < 0.6) rows[idx].units = ""; // missing units
    else if (messType < 0.85) rows[idx].order_date = rows[idx].order_date.replace(/-/g, "/"); // inconsistent date format
    else rows.push({ ...rows[idx] }); // exact duplicate row
  }

  return rows;
}

export function sampleFileName(): string {
  return "sample_marketplace_sales.csv";
}
