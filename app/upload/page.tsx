"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, AlertCircle } from "lucide-react";
import { FileDropZone } from "@/components/FileDropZone";
import { ColumnMapper, guessMapping, isMappingComplete } from "@/components/ColumnMapper";
import { ProcessingSteps } from "@/components/ProcessingSteps";
import { parseFile } from "@/lib/parsing";
import { generateSampleSalesRows, sampleFileName } from "@/lib/sampleData";
import { useAppData } from "@/lib/store";
import type { ColumnMapping, RawRow } from "@/lib/types";

const EMPTY_MAPPING: ColumnMapping = {
  order_date: "",
  sku: "",
  category: "",
  brand: "",
  marketplace: "",
  country: "",
  units: "",
  revenue: "",
};

export default function UploadPage() {
  const router = useRouter();
  const { stage, error, runPipeline } = useAppData();

  const [filename, setFilename] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<RawRow[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>(EMPTY_MAPPING);
  const [parseError, setParseError] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const isProcessing = hasSubmitted && stage !== "idle" && stage !== "done" && stage !== "error";

  useEffect(() => {
    // `stage` lives in the app-wide provider and stays "done" from whatever report
    // was last generated, even across navigating back to this page. Only redirect
    // when a run was actually submitted from *this* visit to the page — otherwise
    // simply revisiting /upload after a prior report immediately bounces back to
    // /dashboard before the new file can be mapped or processed.
    if (hasSubmitted && stage === "done") {
      router.push("/dashboard");
    }
  }, [hasSubmitted, stage, router]);

  async function handleFile(file: File) {
    setParseError(null);
    try {
      const parsed = await parseFile(file);
      setFilename(parsed.filename);
      setHeaders(parsed.headers);
      setRows(parsed.rows);
      setMapping(guessMapping(parsed.headers));
    } catch (err) {
      setParseError((err as Error).message);
    }
  }

  function loadSampleData() {
    const sampleRows = generateSampleSalesRows();
    const sampleHeaders = Object.keys(sampleRows[0]);
    setFilename(sampleFileName());
    setHeaders(sampleHeaders);
    setRows(sampleRows);
    // Sample data keys already match our expected field names exactly.
    setMapping({
      order_date: "order_date",
      sku: "sku",
      category: "category",
      brand: "brand",
      marketplace: "marketplace",
      country: "country",
      units: "units",
      revenue: "revenue",
    });
  }

  function handleProcess() {
    if (!filename || rows.length === 0) return;
    setHasSubmitted(true);
    runPipeline(rows, mapping, filename);
  }

  if (isProcessing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <p className="mono-label text-[11px] text-signal mb-2">Running automation pipeline</p>
        <h2 className="font-display font-semibold text-xl mb-1">Processing {filename}</h2>
        <p className="text-sm text-text-muted mb-4">
          This runs entirely in your browser — cleaning, detection, and ranking are instant;
          the AI narrative takes a few seconds.
        </p>
        <ProcessingSteps currentStage={stage} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="mb-8">
        <p className="mono-label text-[11px] text-signal mb-2">Step 1 of 1</p>
        <h1 className="font-display font-semibold text-2xl tracking-tight">
          Upload your sales export
        </h1>
        <p className="text-sm text-text-muted mt-2 max-w-xl">
          Drop a raw sales/order CSV or Excel export. We&apos;ll clean it, detect anomalies,
          rank your winners and decliners, forecast next period, and write the executive
          report — automatically.
        </p>
      </div>

      <FileDropZone onFileSelected={handleFile} selectedFileName={filename} />

      <div className="flex items-center gap-3 my-6">
        <div className="h-px flex-1 bg-hairline" />
        <span className="mono-label text-[10px] text-text-muted">or</span>
        <div className="h-px flex-1 bg-hairline" />
      </div>

      <button
        onClick={loadSampleData}
        className="w-full flex items-center justify-center gap-2 rounded-xl border border-signal/25 bg-signal/[0.06] hover:bg-signal/10 px-4 py-3 text-sm font-medium text-signal transition-colors"
      >
        <Sparkles className="w-4 h-4" /> Load sample dataset (90 days, 3 marketplaces, deliberate anomalies)
      </button>

      {parseError && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-negative/25 bg-negative/10 px-4 py-3 text-sm text-negative">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{parseError}</span>
        </div>
      )}
      {hasSubmitted && error && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-negative/25 bg-negative/10 px-4 py-3 text-sm text-negative">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {headers.length > 0 && (
        <div className="mt-8 flex flex-col gap-6">
          <ColumnMapper headers={headers} mapping={mapping} onChange={setMapping} />

          <div className="rounded-lg border border-hairline bg-panel px-4 py-3 flex items-center justify-between text-sm">
            <span className="text-text-muted">
              <span className="font-mono text-text-primary">{rows.length.toLocaleString()}</span> rows
              detected in <span className="text-text-primary">{filename}</span>
            </span>
          </div>

          <button
            onClick={handleProcess}
            disabled={!isMappingComplete(mapping)}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-signal text-ink font-semibold px-4 py-3.5 text-sm transition-opacity disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
          >
            Process &amp; Generate Report <ArrowRight className="w-4 h-4" />
          </button>
          {!isMappingComplete(mapping) && (
            <p className="text-xs text-text-muted -mt-3 text-center">
              Map at least Order Date, SKU, Units, and Revenue to continue.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
