"use client";

import { useCallback, useRef, useState } from "react";
import { UploadCloud, FileSpreadsheet } from "lucide-react";
import clsx from "clsx";

interface FileDropZoneProps {
  onFileSelected: (file: File) => void;
  selectedFileName?: string | null;
}

export function FileDropZone({ onFileSelected, selectedFileName }: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) onFileSelected(file);
    },
    [onFileSelected]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={clsx(
        "relative rounded-xl border-2 border-dashed cursor-pointer transition-colors",
        "flex flex-col items-center justify-center gap-3 py-14 px-6 text-center",
        isDragging ? "border-signal bg-signal/5" : "border-hairline bg-panel hover:border-text-muted"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.tsv,.txt,.xlsx,.xls"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileSelected(file);
        }}
      />
      {selectedFileName ? (
        <>
          <FileSpreadsheet className="w-8 h-8 text-positive" strokeWidth={1.75} />
          <p className="font-medium text-sm text-text-primary">{selectedFileName}</p>
          <p className="text-xs text-text-muted">Click to choose a different file</p>
        </>
      ) : (
        <>
          <UploadCloud className="w-8 h-8 text-text-muted" strokeWidth={1.75} />
          <p className="font-medium text-sm text-text-primary">
            Drop your sales export here, or click to browse
          </p>
          <p className="text-xs text-text-muted">Supports .csv, .tsv, and .xlsx</p>
        </>
      )}
    </div>
  );
}
