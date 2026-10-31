import type { Metadata } from 'next';

// The shop page is a client component; its search metadata lives here.
export const metadata: Metadata = {
  title: 'Shop T-Shirts — Oversized, Regular & Polo',
  description:
    'Shop Fly Free t-shirts: oversized, regular and polo fits with theme drops from Northeast India. Prepaid, shipped across India by India Post.',
  alternates: { canonical: '/products' },
};

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
