# Marketplace Pulse — Project Context

## What This Is
An internal ops tool for e-commerce portfolio purposes. Upload a 
sales export → auto-clean → detect anomalies → rank top/declining 
SKUs → forecast next period → AI-written executive summary → 
dashboard → export to Excel/PDF.

Sibling project to Catalog Quality Auditor. Same design family, 
different accent color (amber "signal" vs teal).

## Status
BUILT AND DEPLOYED. This is a working app, not a fresh build. 
Treat requests as maintenance, bug fixes, and feature additions 
— not tutorial-style teaching.

## How I Want You To Work
- I am non-technical but have already learned the basics through 
  building this and a sibling project.
- Handle tasks directly. Don't ask me to copy-paste code — edit 
  the files yourself.
- After making changes, briefly summarize what you changed and 
  why, in plain English.
- Run `npm run build` yourself to verify nothing broke before 
  telling me it's done.
- Only ask me questions when something is genuinely ambiguous 
  (e.g. a design choice, not a technical detail).
- I will describe bugs/features in plain language — translate 
  that into the right technical change yourself.

## Tech Stack
Next.js 14 (App Router), TypeScript, Tailwind CSS v4, Recharts, 
papaparse + SheetJS (file parsing), jsPDF + jspdf-autotable + 
html2canvas (PDF export), AI narrative (server-side, via 
/api/narrative route — see AI Narrative Provider below).

No database — all processing is client-side in-browser. Report 
history saved to localStorage (last 5 runs).

## Folder Structure
- app/upload, app/dashboard, app/reports — the 3 pages
- app/api/narrative — server route calling Claude API for the 
  executive summary
- lib/ — all business logic (parsing, cleaning, anomalyDetection, 
  performance, forecasting, kpis, filters, exportExcel, exportPdf, 
  store.tsx for React Context state)
- components/ — UI pieces, components/charts/ for the 5 Recharts 
  visualizations

## Design System
Dark "instrument panel" theme. Colors defined as CSS variables in 
app/globals.css: --ink (background), --panel, --hairline, 
--signal (amber accent), --positive, --negative, --interactive. 
Fonts: Space Grotesk (display/numbers), Inter (body), IBM Plex 
Mono (data labels). Keep all new UI consistent with this system 
— pull colors from the CSS variables, don't hardcode new ones.

## AI Narrative Provider
/api/narrative auto-switches provider based on environment — no 
manual toggle:
- Local (npm run dev): calls Claude, using ANTHROPIC_API_KEY from 
  .env.local. Never set this key in Vercel.
- Deployed (Vercel sets VERCEL=1 automatically): calls Grok (xAI) 
  instead, using XAI_API_KEY. This keeps the Claude key completely 
  off the public deployment.
- The deployed/Grok path is capped at one AI summary per visitor 
  via a simple cookie (mp_demo_used) so the public demo can't run 
  up API costs. Clearing cookies/incognito resets it — an accepted 
  tradeoff for a portfolio demo, not meant to be airtight. Rest of 
  the app (dashboard, charts, exports) is never limited.
- NARRATIVE_PROVIDER env var can force "claude" or "grok" if ever 
  needed; normally leave unset.

## Deployment
Hosted on Vercel, connected to my GitHub repo. Pushing to main 
branch auto-deploys. XAI_API_KEY is set in Vercel's environment 
variables. ANTHROPIC_API_KEY only ever lives in local .env.local 
— it must never be added to Vercel or committed.

## Known Limitations / Roadmap
- No database — report history is local-only, browser-specific
- Duplicate SKU detection not applicable here (that's the 
  Catalog Auditor's job)
- V2 ideas: scheduled recurring reports, multi-file trend 
  tracking, chat-with-report interface