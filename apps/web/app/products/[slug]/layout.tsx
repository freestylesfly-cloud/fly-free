import type { Metadata } from 'next';
import { getApiBaseUrl } from '../../lib/api';
import { IMAGE_WIDTH, storageImage } from '../../lib/image';
import { SITE_NAME, SITE_URL } from '../../lib/site';

/**
 * The product page itself is a client component, so its title, description,
 * canonical URL and share image are set here on the server — otherwise every
 * product shares the site's default title in search results and link previews.
 */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetch(`${getApiBaseUrl()}/catalog/products/${encodeURIComponent(slug)}`, { next: { revalidate: 300 } })
    .then((response) => (response.ok ? response.json() : null))
    .catch(() => null);
  if (!product) return { title: 'Product not found', robots: { index: false } };

  const path = `/products/${encodeURIComponent(product.slug)}`;
  const rupees = Math.round((product.price || 0) / 100);
  const style = [product.category?.name, product.category?.productType?.name?.replace(/s$/, '')].filter(Boolean).join(' ');
  const description = trim(
    product.seoDescription ||
      `${product.name} — ${style || 'Fly Free original'}${product.theme?.name ? ` from the ${product.theme.name} drop` : ''}. ₹${rupees.toLocaleString('en-IN')}. Printed in Northeast India, shipped across India by India Post.`
  );
  const image = product.images?.[0]?.url;
  // Absolute, optimised share image: crawlers read it once through the CDN.
  const ogImage = image ? `${SITE_URL}${storageImage(image, IMAGE_WIDTH.detail)}` : `${SITE_URL}/brand/logo.png`;

  return {
    title: product.seoTitle || product.name,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      url: `${SITE_URL}${path}`,
      siteName: SITE_NAME,
      title: product.name,
      description,
      images: [{ url: ogImage, alt: product.name }],
    },
    twitter: { card: 'summary_large_image', title: product.name, description, images: [ogImage] },
  };
}

function trim(text: string) {
  const clean = String(text).replace(/\s+/g, ' ').trim();
  return clean.length > 160 ? `${clean.slice(0, 157).trimEnd()}…` : clean;
}

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return children;
}
