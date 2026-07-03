# Marketplace Pulse

**Sales & Revenue Intelligence + Auto-Reporting Engine.**

Upload a raw sales/order export and Marketplace Pulse automatically cleans it, detects
anomalies, ranks your top and declining SKUs, forecasts next period's revenue, writes an
AI executive summary, and generates board-ready PDF and Excel reports — the full pipeline,
not just a dashboard.

```
Upload File → Clean Data → Detect Anomalies → Rank SKUs → Forecast → AI Narrative → Dashboard → Export
```

## Features

- **Drag-and-drop upload** for CSV, TSV, or Excel (.xlsx) sales exports, with a column-mapper
  that auto-detects your headers.
- **Auditable data cleaning** — normalizes dates/currency, imputes missing units/revenue from
  category medians, dedupes exact duplicates, and logs every change (nothing is a black box).
- **Statistical anomaly detection** — per-SKU rolling z-score flags genuine spikes/drops.
- **Top mover & decliner ranking** — period-over-period revenue comparison per SKU.
- **Revenue forecasting** — linear-trend/moving-average forecast for next period.
- **AI-written executive summary** — a real call to the Claude API (server-side, your own key)
  turns the aggregated results into a 4-6 sentence narrative plus concrete recommendations.
- **Interactive dashboard** — 6 KPI cards, 5 charts (Recharts), filterable/sortable SKU table,
  anomaly log, and a live functional filter sidebar (date range, marketplace, category, brand,
  country, SKU search).
- **One-click exports** — a multi-tab Excel workbook (summary, cleaned data, anomaly log, SKU
  performance, cleaning log) and a polished, multi-page PDF executive report with embedded
  chart images.
- **Report history** — every processed file is saved locally (last 5 runs) so you can revisit
  and re-export past reports.
- **Sample dataset button** — generates a realistic 90-day, 3-marketplace dataset with a
  deliberate spike, a deliberate drop, a genuinely declining SKU, and messy rows — so the whole
  pipeline can be demoed instantly without a real file.

## Tech Stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS v4 · Recharts · papaparse · SheetJS (xlsx)
· jsPDF + jspdf-autotable · html2canvas · Claude API (Anthropic)

No database is required for the MVP — all processing happens client-side in the browser, and
report history is kept in `localStorage`. This keeps setup to "install and run" with nothing
to provision. See **Roadmap** below for how to add Supabase for multi-user persistence.

## Getting Started

```bash
npm install
cp .env.example .env.local
# then add your Anthropic API key to .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — it redirects straight to `/upload`.

Click **"Load sample dataset"** to try the full pipeline immediately without any file of your
own.

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | For AI narratives | Server-side only — used by `/api/narrative`. Get one at [console.anthropic.com](https://console.anthropic.com/settings/keys). Without it, the rest of the pipeline still works; the AI summary card just explains it's not configured. |
| `CLAUDE_NARRATIVE_MODEL` | No | Overrides the model used for the executive narrative. Defaults to `claude-sonnet-5`. |

## Deploying for Free

1. Push this project to a GitHub repo.
2. Import it into [Vercel](https://vercel.com/new) (free tier is plenty for a demo).
3. Add the `ANTHROPIC_API_KEY` environment variable in the Vercel project settings.
4. Deploy — you'll get a live URL you can share or demo directly in an interview.

## Project Structure

```
marketplace-pulse/
├── app/
│   ├── upload/page.tsx          # Upload, column mapping, sample data, pipeline trigger
│   ├── dashboard/page.tsx       # KPIs, AI summary, charts, filters, tables, export
│   ├── reports/page.tsx         # Report history
│   ├── api/narrative/route.ts   # Server-side Claude API call
│   └── layout.tsx               # Fonts, design tokens, nav shell
├── components/
│   ├── charts/                  # RevenueTrend, CategoryShare, TopDeclining, Forecast, MarketplaceComparison
│   ├── FileDropZone.tsx, ColumnMapper.tsx, ProcessingSteps.tsx
│   ├── KpiCard.tsx, ExecutiveSummaryCard.tsx, FiltersSidebar.tsx
│   ├── PerformanceTable.tsx, AnomalyList.tsx, ReportCard.tsx
│   └── NavRail.tsx
├── lib/
│   ├── parsing.ts        # CSV/XLSX parsing
│   ├── cleaning.ts        # Data cleaning + audit trail
│   ├── anomalyDetection.ts  # Rolling z-score anomaly detection
│   ├── performance.ts     # Top/declining SKU ranking
│   ├── forecasting.ts     # Linear-trend forecasting
│   ├── kpis.ts / filters.ts
│   ├── claude.ts          # Client-side call to /api/narrative
│   ├── exportExcel.ts / exportPdf.ts / captureChart.ts
│   ├── sampleData.ts      # Realistic demo dataset generator
│   ├── store.tsx          # React context orchestrating the full pipeline
│   └── types.ts
└── .env.example
```

## Design

A dark "instrument panel" system — deep navy base, a signature signal-amber accent (the
"pulse"), with Space Grotesk for display/numerals, Inter for body text, and IBM Plex Mono for
data labels. The processing screen's animated pulse bar is the signature element: it makes the
five-stage automation chain (clean → detect → rank → forecast → report) visible and literal,
not just a spinner.

## How This Fits a Portfolio

This is one of four related internal-tool builds (Inventory, Catalog, Sales/Reporting, and
Pricing) designed to demonstrate real e-commerce/marketplace operations expertise — see the
companion planning docs (`portfolio.md` and `portfolio-top4-blueprints.md`) for the other
three and how to present all four together.

**Suggested interview flow:** load the sample dataset live, narrate each pipeline stage as it
runs, land on the AI-written executive summary, then click "Export PDF" to show the finished
report. Emphasize that the cleaning step is auditable (open the "Data cleaning audit trail" on
the dashboard) — it's AI-assisted, not a black box.

## Roadmap

- **V2:** Scheduled recurring reports (cron + email delivery), multi-file historical trend
  tracking across uploads, a "chat with this report" interface powered by Claude.
- **V3:** Supabase for multi-user accounts and persistent server-side storage (replacing
  localStorage), multi-source blending (ad spend, returns) for full P&L-style reporting,
  white-label reports for agencies managing multiple seller accounts.
