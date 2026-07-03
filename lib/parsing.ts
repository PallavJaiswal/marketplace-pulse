import Papa from "papaparse";
import * as XLSX from "xlsx";
import type { RawRow } from "./types";

export interface ParsedFile {
  headers: string[];
  rows: RawRow[];
  filename: string;
}

/**
 * Parses a File (csv, tsv, or xlsx) into raw string rows keyed by header.
 * Everything stays as strings here — normalization/typing happens in cleaning.ts.
 */
export async function parseFile(file: File): Promise<ParsedFile> {
  const name = file.name.toLowerCase();

  if (name.endsWith(".csv") || name.endsWith(".tsv") || name.endsWith(".txt")) {
    return parseDelimited(file);
  }
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    return parseExcel(file);
  }
  throw new Error(
    `Unsupported file type for "${file.name}". Please upload a .csv, .tsv, or .xlsx file.`
  );
}

function parseDelimited(file: File): Promise<ParsedFile> {
  return new Promise((resolve, reject) => {
    Papa.parse<RawRow>(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: (results) => {
        const headers = results.meta.fields ?? [];
        resolve({ headers, rows: results.data, filename: file.name });
      },
      error: (err: Error) => reject(err),
    });
  });
}

async function parseExcel(file: File): Promise<ParsedFile> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const json = XLSX.utils.sheet_to_json<RawRow>(sheet, { defval: "", raw: false });
  const headers = json.length > 0 ? Object.keys(json[0]) : [];
  return { headers, rows: json, filename: file.name };
}
