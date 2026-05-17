/**
 * Field reference for the partner bulk upload (.csv / .xlsx) — shown in
 * “Review Product Listing Template” and kept aligned with `SUPPLIER_TEMPLATE_HEADERS`.
 */
export type ProductListingFieldSpec = {
  /** Column name in the spreadsheet (exact match required). */
  field: string;
  mandatory: boolean;
  optional: boolean;
  datatype: string;
  /** Format rules, examples, or validation hints. */
  notes: string;
};

export const PRODUCT_LISTING_TEMPLATE_FIELDS: ProductListingFieldSpec[] = [
  {
    field: "title",
    mandatory: true,
    optional: false,
    datatype: "Text",
    notes: "Product name shown on the swipe card. Keep it concise and searchable.",
  },
  {
    field: "description",
    mandatory: true,
    optional: false,
    datatype: "Text",
    notes: "Longer selling copy; plain text is fine.",
  },
  {
    field: "price",
    mandatory: true,
    optional: false,
    datatype: "Number (decimal)",
    notes: "Retail price in USD, e.g. 19.99 (no currency symbol in the cell).",
  },
  {
    field: "imageUrl",
    mandatory: true,
    optional: false,
    datatype: "URL (https)",
    notes: "Direct link to a public image (HTTPS). Square or portrait photos work best.",
  },
  {
    field: "stock",
    mandatory: true,
    optional: false,
    datatype: "Whole number",
    notes: "Units available to sell; must be zero or positive.",
  },
  {
    field: "parentCategory",
    mandatory: true,
    optional: false,
    datatype: "Text",
    notes: "Top-level category (e.g. Electronics, Kitchen).",
  },
  {
    field: "subCategory",
    mandatory: true,
    optional: false,
    datatype: "Text",
    notes: "Narrower shelf (e.g. Audio, Coffee Gear).",
  },
  {
    field: "attributes",
    mandatory: false,
    optional: true,
    datatype: "Text (list)",
    notes: "Optional tags. Separate with commas or semicolons (e.g. Wireless; Noise Cancelling).",
  },
  {
    field: "variants",
    mandatory: false,
    optional: true,
    datatype: "Text (list)",
    notes: "Optional variant labels (size, color bundle, etc.), comma or semicolon separated.",
  },
  {
    field: "unit",
    mandatory: true,
    optional: false,
    datatype: "Text",
    notes: "Sell unit: pair, set, lb, each, etc. Shoppers see this near price.",
  },
];
