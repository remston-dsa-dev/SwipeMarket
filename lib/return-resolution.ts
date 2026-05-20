export type ReturnRequestStatus = "requested" | "resolved" | "cancelled";

export type ReturnResolution =
  | "pending"
  | "accept_full_refund"
  | "accept_partial_refund"
  | "deny_full_refund"
  | "deny_partial_refund"
  | "accept_no_refund"
  | "deny_no_refund";

export type RefundKind = "none" | "partial" | "full";

/** Supplier-facing choices when resolving a return request. */
export const SUPPLIER_RETURN_RESOLUTIONS: {
  value: Exclude<ReturnResolution, "pending">;
  label: string;
  description: string;
  returnAccepted: boolean;
  refundKind: RefundKind;
}[] = [
  {
    value: "accept_full_refund",
    label: "Return accepted · Full refund",
    description: "Approve the return and refund the full line amount.",
    returnAccepted: true,
    refundKind: "full",
  },
  {
    value: "accept_partial_refund",
    label: "Return accepted · Partial refund",
    description: "Approve the return and refund a custom amount.",
    returnAccepted: true,
    refundKind: "partial",
  },
  {
    value: "deny_full_refund",
    label: "Return denied · Full refund",
    description: "Decline the return but issue a full goodwill refund.",
    returnAccepted: false,
    refundKind: "full",
  },
  {
    value: "deny_partial_refund",
    label: "Return denied · Partial refund",
    description: "Decline the return but issue a partial refund.",
    returnAccepted: false,
    refundKind: "partial",
  },
  {
    value: "accept_no_refund",
    label: "Return accepted · No refund",
    description: "Approve the return with no money back (e.g. exchange).",
    returnAccepted: true,
    refundKind: "none",
  },
  {
    value: "deny_no_refund",
    label: "Return denied · No refund",
    description: "Decline the return and issue no refund.",
    returnAccepted: false,
    refundKind: "none",
  },
];

export function returnResolutionLabel(resolution: ReturnResolution): string {
  const match = SUPPLIER_RETURN_RESOLUTIONS.find((r) => r.value === resolution);
  if (match) return match.label;
  if (resolution === "pending") return "Pending review";
  return resolution;
}

export function returnRequestStatusLabel(status: ReturnRequestStatus): string {
  switch (status) {
    case "requested":
      return "Pending";
    case "resolved":
      return "Resolved";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

export function formatRefundCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
