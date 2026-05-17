import * as XLSX from "xlsx";
import type { Product } from "@/types/product";

export const SUPPLIER_TEMPLATE_HEADERS = [
  "title",
  "description",
  "price",
  "imageUrl",
  "stock",
  "parentCategory",
  "subCategory",
  "attributes",
  "variants",
  "unit",
] as const;

const SAMPLE_TEMPLATE_ROWS: Record<(typeof SUPPLIER_TEMPLATE_HEADERS)[number], string>[] = [
  {
    title: "Wireless Earbuds Pro",
    description: "Active noise-cancelling earbuds with 30h battery and multipoint pairing.",
    price: "129.00",
    imageUrl: "https://picsum.photos/id/367/900/1200",
    stock: "30",
    parentCategory: "Electronics",
    subCategory: "Audio",
    attributes: "Wireless,Noise Cancelling",
    variants: "ANC,30h Battery",
    unit: "pair",
  },
  {
    title: "Ceramic Pour-Over Set",
    description: "Hand-thrown ceramic dripper and carafe set.",
    price: "62.00",
    imageUrl: "https://picsum.photos/id/225/900/1200",
    stock: "20",
    parentCategory: "Kitchen",
    subCategory: "Coffee Gear",
    attributes: "Handmade,Ceramic",
    variants: "2 Mugs,Bone White",
    unit: "set",
  },
];

/** Comma-separated template (same columns as `.xlsx`). */
export function buildSupplierTemplateCsv(): string {
  const header = SUPPLIER_TEMPLATE_HEADERS.join(",");
  const body = SAMPLE_TEMPLATE_ROWS.map((row) =>
    SUPPLIER_TEMPLATE_HEADERS.map((k) => csvEscape(row[k] ?? "")).join(","),
  ).join("\n");
  return `${header}\n${body}\n`;
}

/** Base64 `.xlsx` workbook (single sheet “Products”) for sharing / writing to disk. */
export function buildSupplierTemplateXlsxBase64(): string {
  const header = [...SUPPLIER_TEMPLATE_HEADERS];
  const aoa: string[][] = [header];
  for (const row of SAMPLE_TEMPLATE_ROWS) {
    aoa.push(SUPPLIER_TEMPLATE_HEADERS.map((k) => row[k] ?? ""));
  }
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Products");
  return XLSX.write(wb, { type: "base64", bookType: "xlsx" });
}

export type SupplierImportFailure = {
  rowNumber: number;
  reason: string;
};

export type SupplierImportReport = {
  successRows: Omit<Product, "id">[];
  failedRows: SupplierImportFailure[];
};

function splitMulti(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function mapDataRowsToReport(headers: string[], cellRows: string[][]): SupplierImportReport {
  const requiredHeaders = [...SUPPLIER_TEMPLATE_HEADERS];
  const missing = requiredHeaders.filter((header) => !headers.includes(header));
  if (missing.length > 0) {
    throw new Error(`Missing required columns: ${missing.join(", ")}`);
  }

  const successRows: Omit<Product, "id">[] = [];
  const failedRows: SupplierImportFailure[] = [];

  cellRows.forEach((values, rowIdx) => {
    const get = (column: (typeof SUPPLIER_TEMPLATE_HEADERS)[number]) =>
      values[headers.indexOf(column)]?.trim() ?? "";

    const title = get("title");
    const description = get("description");
    const priceText = get("price");
    const imageUrl = get("imageUrl");
    const stockText = get("stock");
    const parentCategory = get("parentCategory");
    const subCategory = get("subCategory");
    const unit = get("unit");
    const attributes = splitMulti(get("attributes"));
    const variants = splitMulti(get("variants"));

    if (!title || !description || !priceText || !imageUrl || !stockText || !parentCategory || !subCategory || !unit) {
      failedRows.push({ rowNumber: rowIdx + 2, reason: "required fields are missing" });
      return;
    }

    const price = Number.parseFloat(priceText);
    const stock = Number.parseInt(stockText, 10);
    if (!Number.isFinite(price) || price <= 0) {
      failedRows.push({ rowNumber: rowIdx + 2, reason: `invalid price "${priceText}"` });
      return;
    }
    if (!Number.isFinite(stock) || stock < 0) {
      failedRows.push({ rowNumber: rowIdx + 2, reason: `invalid stock "${stockText}"` });
      return;
    }

    successRows.push({
      title,
      description,
      priceLabel: `$${price.toFixed(2)}`,
      unitPriceCents: Math.round(price * 100),
      imageUrl,
      stock,
      parentCategory,
      subCategory,
      category: parentCategory,
      attributes,
      variants,
      unit,
      qtyAllocated: 0,
    });
  });

  return { successRows, failedRows };
}

/** Parse first sheet of an `.xlsx` file read as base64 (Expo `FileSystem` encoding). */
export function parseSupplierXlsxWithReport(base64: string): SupplierImportReport {
  const workbook = XLSX.read(base64, { type: "base64" });
  const first = workbook.SheetNames[0];
  if (!first) return { successRows: [], failedRows: [] };
  const sheet = workbook.Sheets[first];
  if (!sheet) return { successRows: [], failedRows: [] };

  const aoa = XLSX.utils.sheet_to_json<(string | number | boolean | null | undefined)[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  }) as unknown[][];

  if (!aoa.length) return { successRows: [], failedRows: [] };

  const headers = (aoa[0] ?? []).map((c) => String(c ?? "").trim());
  const requiredHeaders = [...SUPPLIER_TEMPLATE_HEADERS];
  const missing = requiredHeaders.filter((header) => !headers.includes(header));
  if (missing.length > 0) {
    throw new Error(`Missing required columns: ${missing.join(", ")}`);
  }

  const alignedRows = aoa.slice(1).map((row) =>
    SUPPLIER_TEMPLATE_HEADERS.map((h) => {
      const idx = headers.indexOf(h);
      if (idx < 0) return "";
      return String(row[idx] ?? "").trim();
    }),
  );

  return mapDataRowsToReport([...SUPPLIER_TEMPLATE_HEADERS], alignedRows);
}

/** Parse UTF-8 CSV (header row + data rows). */
export function parseSupplierCsvWithReport(csvContent: string): SupplierImportReport {
  const lines = csvContent
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) return { successRows: [], failedRows: [] };

  const headers = parseCsvLine(lines[0] ?? "").map((h) => h.trim());
  const cellRows = lines.slice(1).map((line) => parseCsvLine(line));
  return mapDataRowsToReport(headers, cellRows);
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, "\"\"")}"`;
  }
  return value;
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === "\"") {
      const nextChar = line[i + 1];
      if (inQuotes && nextChar === "\"") {
        current += "\"";
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  values.push(current);
  return values;
}

/** Guess CSV vs Excel from picker metadata (extension wins). */
export function isCsvImportAsset(fileName?: string | null, mimeType?: string | null): boolean {
  const name = fileName?.toLowerCase() ?? "";
  if (name.endsWith(".csv")) return true;
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) return false;
  const mime = mimeType?.toLowerCase() ?? "";
  if (mime.includes("csv") || mime === "text/comma-separated-values") return true;
  if (
    mime.includes("spreadsheetml") ||
    mime.includes("ms-excel") ||
    mime.includes("application/vnd.ms-excel")
  ) {
    return false;
  }
  return false;
}
