/**
 * The single source of truth for order statuses in the admin app.
 *
 * These must mirror the `OrderStatus` enum in prisma/schema.prisma. They were
 * previously hardcoded in four separate places in the orders list and again in
 * the order detail page, and the copies drifted: the list page knew only five of
 * the seven statuses, so setting an order to PACKED from the detail page made
 * the whole list crash on `statusColors[value].bg`.
 */

export const ORDER_STATUSES = [
  "PLACED",
  "CONFIRMED",
  "PACKED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED"
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

type StatusStyle = { bg: string; text: string };

const STATUS_STYLES: Record<OrderStatus, StatusStyle> = {
  PLACED: { bg: "bg-yellow-100", text: "text-yellow-700" },
  CONFIRMED: { bg: "bg-blue-100", text: "text-blue-700" },
  PACKED: { bg: "bg-indigo-100", text: "text-indigo-700" },
  SHIPPED: { bg: "bg-purple-100", text: "text-purple-700" },
  DELIVERED: { bg: "bg-green-100", text: "text-green-700" },
  CANCELLED: { bg: "bg-red-100", text: "text-red-700" },
  REFUNDED: { bg: "bg-orange-100", text: "text-orange-700" }
};

/** Neutral styling for a status the API has but this build does not know yet. */
const UNKNOWN_STATUS: StatusStyle = { bg: "bg-black/5", text: "text-black/60" };

/**
 * Never throws. A status added to the schema but not yet to this file renders in
 * neutral grey rather than taking down the page it appears on.
 */
export function orderStatusStyle(status: string | null | undefined): StatusStyle {
  if (!status) return UNKNOWN_STATUS;
  return STATUS_STYLES[status.toUpperCase() as OrderStatus] ?? UNKNOWN_STATUS;
}

/** "PLACED" -> "Placed", for dropdown labels. */
export function orderStatusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}
