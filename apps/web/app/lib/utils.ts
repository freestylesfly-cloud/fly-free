export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
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
