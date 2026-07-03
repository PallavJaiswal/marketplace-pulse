"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { cleanSalesRows } from "./cleaning";
import { detectAnomalies } from "./anomalyDetection";
import { rankSkuPerformance } from "./performance";
import { forecastNextPeriod } from "./forecasting";
import { computeKpis } from "./kpis";
import { generateNarrative } from "./claude";
import type { ColumnMapping, Filters, PipelineResult, RawRow } from "./types";
import { EMPTY_FILTERS as EMPTY_FILTERS_VALUE } from "./types";

export type PipelineStage =
  | "idle"
  | "cleaning"
  | "anomalies"
  | "ranking"
  | "forecasting"
  | "narrative"
  | "done"
  | "error";

export const PIPELINE_STAGES: { key: PipelineStage; label: string }[] = [
  { key: "cleaning", label: "Cleaning data" },
  { key: "anomalies", label: "Detecting anomalies" },
  { key: "ranking", label: "Ranking SKUs" },
  { key: "forecasting", label: "Forecasting" },
  { key: "narrative", label: "Writing report" },
];

const HISTORY_KEY = "marketplace-pulse:report-history";
const MAX_HISTORY = 5;

interface AppDataContextValue {
  result: PipelineResult | null;
  stage: PipelineStage;
  error: string | null;
  filters: Filters;
  setFilters: (f: Filters) => void;
  resetFilters: () => void;
  history: PipelineResult[];
  runPipeline: (rawRows: RawRow[], mapping: ColumnMapping, filename: string) => Promise<void>;
  loadFromHistory: (uploadedAt: string) => void;
  clearHistory: () => void;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [stage, setStage] = useState<PipelineStage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<Filters>(EMPTY_FILTERS_VALUE);
  const [history, setHistory] = useState<PipelineResult[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from localStorage on mount, not a render loop
      if (raw) setHistory(JSON.parse(raw));
    } catch {
      // ignore corrupted local storage
    }
  }, []);

  const persistHistory = useCallback((next: PipelineResult[]) => {
    setHistory(next);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    } catch {
      // storage full or unavailable — non-fatal, history just won't persist
    }
  }, []);

  const setFilters = useCallback((f: Filters) => setFiltersState(f), []);
  const resetFilters = useCallback(() => setFiltersState(EMPTY_FILTERS_VALUE), []);

  const runPipeline = useCallback(
    async (rawRows: RawRow[], mapping: ColumnMapping, filename: string) => {
      setError(null);
      setResult(null);
      resetFilters();

      try {
        setStage("cleaning");
        await tick();
        const { rows: cleanedRows, summary: cleaningSummary } = cleanSalesRows(rawRows, mapping);
        if (cleanedRows.length === 0) {
          throw new Error(
            "No usable rows remained after cleaning. Check your column mapping and file contents."
          );
        }

        setStage("anomalies");
        await tick();
        const anomalies = detectAnomalies(cleanedRows);

        setStage("ranking");
        await tick();
        const skuPerformance = rankSkuPerformance(cleanedRows);

        setStage("forecasting");
        await tick();
        const forecast = forecastNextPeriod(cleanedRows);
        const kpis = computeKpis(cleanedRows, anomalies, skuPerformance);

        setStage("narrative");
        let narrative = null;
        let narrativeError: string | null = null;
        try {
          narrative = await generateNarrative(cleaningSummary, kpis, anomalies, skuPerformance, forecast);
        } catch (narrativeErr) {
          // Non-fatal: the rest of the pipeline still works without the AI narrative.
          console.error("Narrative generation failed:", narrativeErr);
          narrativeError = (narrativeErr as Error).message;
        }

        const pipelineResult: PipelineResult = {
          uploadedAt: new Date().toISOString(),
          filename,
          cleanedRows,
          cleaningSummary,
          anomalies,
          skuPerformance,
          forecast,
          kpis,
          narrative,
          narrativeError,
        };

        setResult(pipelineResult);
        setStage("done");

        const nextHistory = [pipelineResult, ...history].slice(0, MAX_HISTORY);
        persistHistory(nextHistory);
      } catch (err) {
        setError((err as Error).message);
        setStage("error");
      }
    },
    [history, persistHistory, resetFilters]
  );

  const loadFromHistory = useCallback(
    (uploadedAt: string) => {
      const found = history.find((h) => h.uploadedAt === uploadedAt);
      if (found) {
        setResult(found);
        setStage("done");
        resetFilters();
      }
    },
    [history, resetFilters]
  );

  const clearHistory = useCallback(() => {
    persistHistory([]);
  }, [persistHistory]);

  return (
    <AppDataContext.Provider
      value={{
        result,
        stage,
        error,
        filters,
        setFilters,
        resetFilters,
        history,
        runPipeline,
        loadFromHistory,
        clearHistory,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}

// Small yield so the ProcessingSteps UI can actually paint each stage transition
// instead of the whole pipeline resolving synchronously in one tick.
function tick(ms = 450): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
