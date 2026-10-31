export function formatCurrency(amount: number): string {
  // Whole rupees print as "₹1,299", not "₹1,299.00"; paise still show when present.
  const whole = Number.isInteger(Math.round(amount * 100) / 100);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

const SIZE_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', 'XXXL', '4XL', '5XL'];

/**
 * Apparel sizes smallest first (S, M, L, XL…). Sizes outside the standard list
 * (Free size, UK 6-8…) keep the order they arrived in, after the standard ones.
 */
export function sortSizes(sizes: string[]): string[] {
  const rank = (size: string) => {
    const index = SIZE_ORDER.indexOf(size.trim().toUpperCase());
    return index === -1 ? SIZE_ORDER.length : index;
  };
  return sizes
    .map((size, index) => ({ size, index }))
    .sort((a, b) => rank(a.size) - rank(b.size) || a.index - b.index)
    .map(({ size }) => size);
}

export function truncate(text: string, length: number): string {
  return text.length > length ? text.substring(0, length) + '...' : text;
}

export function calculateDiscount(original: number, discount: number): number {
  return original - discount;
}

export function calculateTax(amount: number, taxRate: number = 0.18): number {
  return amount * taxRate;
}
