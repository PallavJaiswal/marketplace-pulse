"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileStack, Trash2, UploadCloud } from "lucide-react";
import { useAppData } from "@/lib/store";
import { ReportCard } from "@/components/ReportCard";

export default function ReportsPage() {
  const { history, loadFromHistory, clearHistory } = useAppData();
  const router = useRouter();

  if (history.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <FileStack className="w-10 h-10 text-text-muted mb-4" strokeWidth={1.5} />
        <h2 className="font-display font-semibold text-lg mb-2">No reports generated yet</h2>
        <p className="text-sm text-text-muted max-w-sm mb-6">
          Every file you process is saved here (up to your last 5 runs) so you can revisit or
          re-export past reports.
        </p>
        <Link
          href="/upload"
          className="flex items-center gap-2 rounded-xl bg-signal text-ink font-semibold px-5 py-3 text-sm hover:opacity-90 transition-opacity"
        >
          <UploadCloud className="w-4 h-4" /> Process a file
        </Link>
      </div>
    );
  }

  return (
    <div className="px-6 lg:px-8 py-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="mono-label text-[10px] text-text-muted mb-1">Report History</p>
          <h1 className="font-display font-semibold text-2xl tracking-tight">Past Reports</h1>
        </div>
        <button
          onClick={clearHistory}
          className="flex items-center gap-1.5 text-xs text-text-muted hover:text-negative transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" /> Clear history
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {history.map((r) => (
          <ReportCard
            key={r.uploadedAt}
            result={r}
            onView={() => {
              loadFromHistory(r.uploadedAt);
              router.push("/dashboard");
            }}
          />
        ))}
      </div>
    </div>
  );
}
