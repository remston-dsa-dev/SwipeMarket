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

export function buildSupplierTemplateCsv(): string {
  const sampleRows = [
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

  const header = SUPPLIER_TEMPLATE_HEADERS.join(",");
  const body = sampleRows
    .map((row) =>
      SUPPLIER_TEMPLATE_HEADERS.map((key) => csvEscape((row as Record<string, string>)[key] ?? "")).join(","),
    )
    .join("\n");
  return `${header}\n${body}\n`;
}

export function parseSupplierCsv(csvContent: string): Omit<Product, "id">[] {
  const report = parseSupplierCsvWithReport(csvContent);
  if (report.failedRows.length > 0) {
    throw new Error(report.failedRows.map((row) => `Row ${row.rowNumber}: ${row.reason}`).join("\n"));
  }
  return report.successRows;
}

export type SupplierImportFailure = {
  rowNumber: number;
  reason: string;
};

export type SupplierImportReport = {
  successRows: Omit<Product, "id">[];
  failedRows: SupplierImportFailure[];
};

export function parseSupplierCsvWithReport(csvContent: string): SupplierImportReport {
  const lines = csvContent
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) return { successRows: [], failedRows: [] };

  const headerLine = lines[0] ?? "";
  const dataLines = lines.slice(1);
  const headers = parseCsvLine(headerLine).map((h) => h.trim());
  const requiredHeaders = [...SUPPLIER_TEMPLATE_HEADERS];
  const missing = requiredHeaders.filter((header) => !headers.includes(header));
  if (missing.length > 0) {
    throw new Error(`Missing required columns: ${missing.join(", ")}`);
  }

  const successRows: Omit<Product, "id">[] = [];
  const failedRows: SupplierImportFailure[] = [];

  dataLines.forEach((line, rowIdx) => {
    const values = parseCsvLine(line);
    const get = (column: typeof SUPPLIER_TEMPLATE_HEADERS[number]) =>
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

function splitMulti(value: string): string[] {
  return value
    .split(/[;,]/)
    .map((part) => part.trim())
    .filter(Boolean);
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
