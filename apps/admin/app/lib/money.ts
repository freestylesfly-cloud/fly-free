/**
 * Money is stored in the database as paise (integer). Every admin form and
 * table works in rupees so the numbers match what customers see on the site.
 * Convert at the UI boundary only — never store rupees.
 */

/** Paise from the API -> rupees for display or a form field. */
export function toRupees(paise: number | null | undefined): number {
  return Math.round(Number(paise || 0) / 100);
}

/** Rupees typed by an admin -> paise for the API. */
export function toPaise(rupees: number | string | null | undefined): number {
  return Math.round(Number(rupees || 0) * 100);
}

/** Paise -> "₹1,299" for tables and summaries. */
export function formatRupees(paise: number | null | undefined): string {
  return `₹${toRupees(paise).toLocaleString('en-IN')}`;
}
