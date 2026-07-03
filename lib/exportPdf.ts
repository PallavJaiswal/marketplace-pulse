import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { PipelineResult } from "./types";

const INK = "#0b111e";
const SIGNAL = "#e8a33d";
const TEXT = "#1a1a1a";
const MUTED = "#666666";

export interface ChartImages {
  revenueTrend?: string; // base64 PNG data URLs, captured client-side via html2canvas
  forecast?: string;
}

export function exportToPdf(result: PipelineResult, chartImages: ChartImages = {}) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 48;
  let y = 0;

  // --- Header / title block ---
  doc.setFillColor(INK);
  doc.rect(0, 0, pageWidth, 110, "F");
  doc.setTextColor(SIGNAL);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("MARKETPLACE PULSE", margin, 40);
  doc.setTextColor("#ffffff");
  doc.setFontSize(20);
  doc.text("Weekly Executive Sales Report", margin, 66);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor("#c7ccda");
  doc.text(
    `Source file: ${result.filename}   |   Generated: ${new Date(result.uploadedAt).toLocaleString()}`,
    margin,
    88
  );

  y = 140;

  // --- KPI row ---
  const kpis: [string, string][] = [
    ["Total Revenue", `$${result.kpis.totalRevenue.toLocaleString()}`],
    ["Total Units", result.kpis.totalUnits.toLocaleString()],
    ["Avg Order Value", `$${result.kpis.avgOrderValue.toFixed(2)}`],
    ["MoM Growth", `${result.kpis.momGrowthPct > 0 ? "+" : ""}${result.kpis.momGrowthPct}%`],
    ["Anomalies", String(result.kpis.anomalyCount)],
    ["Declining SKUs", String(result.kpis.decliningSkuCount)],
  ];
  const kpiWidth = (pageWidth - margin * 2) / 3;
  kpis.forEach(([label, value], i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = margin + col * kpiWidth;
    const boxY = y + row * 56;
    doc.setDrawColor("#e5e5e5");
    doc.setFillColor("#fafafa");
    doc.roundedRect(x, boxY, kpiWidth - 10, 46, 4, 4, "FD");
    doc.setTextColor(MUTED);
    doc.setFontSize(8);
    doc.text(label.toUpperCase(), x + 10, boxY + 16);
    doc.setTextColor(TEXT);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(value, x + 10, boxY + 34);
    doc.setFont("helvetica", "normal");
  });

  y += 56 * 2 + 24;

  // --- Executive summary ---
  doc.setFillColor(SIGNAL);
  doc.rect(margin, y, 3, 16, "F");
  doc.setTextColor(TEXT);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Executive Summary", margin + 12, y + 12);
  y += 28;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor("#333333");
  const summaryText = result.narrative?.summary || "AI narrative was not generated for this report.";
  const summaryLines = doc.splitTextToSize(summaryText, pageWidth - margin * 2);
  doc.text(summaryLines, margin, y);
  y += summaryLines.length * 13 + 18;

  if (result.narrative?.recommendations?.length) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(TEXT);
    doc.text("Recommended Actions", margin, y);
    y += 16;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor("#333333");
    result.narrative.recommendations.forEach((rec) => {
      const lines = doc.splitTextToSize(`•  ${rec}`, pageWidth - margin * 2);
      doc.text(lines, margin, y);
      y += lines.length * 13 + 4;
    });
    y += 10;
  }

  // --- Chart images, if captured ---
  if (chartImages.revenueTrend) {
    if (y > 620) {
      doc.addPage();
      y = margin;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(TEXT);
    doc.text("Revenue Trend", margin, y);
    y += 10;
    const w = pageWidth - margin * 2;
    const h = w * 0.36;
    doc.addImage(chartImages.revenueTrend, "PNG", margin, y, w, h);
    y += h + 20;
  }

  if (chartImages.forecast) {
    if (y > 620) {
      doc.addPage();
      y = margin;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(TEXT);
    doc.text("Forecast vs. Actual", margin, y);
    y += 10;
    const w = pageWidth - margin * 2;
    const h = w * 0.36;
    doc.addImage(chartImages.forecast, "PNG", margin, y, w, h);
    y += h + 20;
  }

  // --- Top movers / decliners table ---
  doc.addPage();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(TEXT);
  doc.text("Top Movers & Decliners", margin, margin);

  const movers = result.skuPerformance.filter((p) => p.trend !== "stable").slice(0, 20);
  autoTable(doc, {
    startY: margin + 16,
    head: [["SKU", "Category", "Trend", "Revenue", "% Change"]],
    body: movers.map((p) => [
      p.sku,
      p.category,
      p.trend === "top" ? "▲ Top" : "▼ Declining",
      `$${p.revenueCurrent.toLocaleString()}`,
      `${p.pctChange > 0 ? "+" : ""}${p.pctChange}%`,
    ]),
    headStyles: { fillColor: [11, 17, 30] },
    styles: { fontSize: 9 },
    margin: { left: margin, right: margin },
  });

  // --- Anomaly log table ---
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const afterMovers = (doc as any).lastAutoTable.finalY + 30;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Anomalies Detected", margin, afterMovers);

  autoTable(doc, {
    startY: afterMovers + 16,
    head: [["SKU", "Date", "Type", "Actual", "Expected", "Z-Score"]],
    body: result.anomalies
      .slice(0, 15)
      .map((a) => [a.sku, a.date, a.type, `$${a.value}`, `$${a.expected}`, String(a.zScore)]),
    headStyles: { fillColor: [11, 17, 30] },
    styles: { fontSize: 9 },
    margin: { left: margin, right: margin },
  });

  // --- Footer on every page ---
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor("#999999");
    doc.text(
      `Marketplace Pulse — Automated Report`,
      margin,
      doc.internal.pageSize.getHeight() - 24
    );
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth - margin - 60,
      doc.internal.pageSize.getHeight() - 24
    );
  }

  doc.save(`marketplace-pulse-report-${result.uploadedAt.slice(0, 10)}.pdf`);
}
