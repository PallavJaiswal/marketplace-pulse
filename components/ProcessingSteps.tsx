"use client";

import clsx from "clsx";
import { Check } from "lucide-react";
import { PIPELINE_STAGES, type PipelineStage } from "@/lib/store";

interface ProcessingStepsProps {
  currentStage: PipelineStage;
}

export function ProcessingSteps({ currentStage }: ProcessingStepsProps) {
  const currentIndex = PIPELINE_STAGES.findIndex((s) => s.key === currentStage);

  return (
    <div className="w-full max-w-2xl mx-auto py-10">
      <div className="relative flex items-center justify-between">
        {/* connecting line */}
        <div className="absolute left-0 right-0 top-4 h-px bg-hairline" />
        <div
          className="absolute left-0 top-4 h-px bg-signal transition-all duration-700 ease-out"
          style={{
            width:
              currentIndex < 0
                ? "0%"
                : `${(Math.max(currentIndex, 0) / (PIPELINE_STAGES.length - 1)) * 100}%`,
          }}
        />

        {PIPELINE_STAGES.map((stage, i) => {
          const isDone = currentIndex > i;
          const isActive = currentIndex === i;
          return (
            <div key={stage.key} className="relative z-10 flex flex-col items-center gap-3 flex-1">
              <div
                className={clsx(
                  "w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-300",
                  isDone && "bg-positive border-positive",
                  isActive && "bg-signal border-signal animate-pulse-sweep",
                  !isDone && !isActive && "bg-panel border-hairline"
                )}
              >
                {isDone ? (
                  <Check className="w-4 h-4 text-ink" strokeWidth={3} />
                ) : (
                  <span
                    className={clsx(
                      "text-[11px] font-mono font-semibold",
                      isActive ? "text-ink" : "text-text-muted"
                    )}
                  >
                    {i + 1}
                  </span>
                )}
              </div>
              <span
                className={clsx(
                  "mono-label text-[10px] text-center leading-tight",
                  isActive ? "text-signal" : isDone ? "text-positive" : "text-text-muted"
                )}
              >
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
