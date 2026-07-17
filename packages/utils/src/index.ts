export function formatCurrency(amount: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(amount);
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function calculateDiscountPercent(mrp: number, price: number) {
  if (mrp <= 0 || price >= mrp) {
    return 0;
  }

  return Math.round(((mrp - price) / mrp) * 100);
}
