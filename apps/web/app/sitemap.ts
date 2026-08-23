import type { MetadataRoute } from 'next';
import { getApiBaseUrl } from './lib/api';
import { SITE_URL } from './lib/site';

type SitemapItem = {
  url: string;
  lastModified?: string | Date;
  changeFrequency?: MetadataRoute.Sitemap[number]['changeFrequency'];
  priority?: number;
};

const staticRoutes: SitemapItem[] = [
  { url: '/', changeFrequency: 'daily', priority: 1 },
  { url: '/products', changeFrequency: 'daily', priority: 0.95 },
  { url: '/about', changeFrequency: 'monthly', priority: 0.7 },
  { url: '/contact', changeFrequency: 'monthly', priority: 0.65 },
  { url: '/shipping', changeFrequency: 'monthly', priority: 0.5 },
  { url: '/returns', changeFrequency: 'monthly', priority: 0.5 },
  { url: '/terms', changeFrequency: 'yearly', priority: 0.35 },
  { url: '/privacy', changeFrequency: 'yearly', priority: 0.35 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, themes, footer] = await Promise.all([
    getJson<any[]>('/catalog/products').catch(() => []),
    getJson<any[]>('/cms/themes').catch(() => []),
    getJson<any>('/cms/footer').catch(() => null),
  ]);

  const categoryRoutes: SitemapItem[] = (footer?.categories || [])
    .filter((category: any) => category?.slug)
    .map((category: any) => ({
      url: `/products?category=${encodeURIComponent(category.slug)}`,
      changeFrequency: 'weekly',
      priority: 0.75,
    }));

  const themeRoutes: SitemapItem[] = toArray(themes)
    .filter((theme: any) => theme?.slug)
    .map((theme: any) => ({
      url: `/themes/${theme.slug}`,
      lastModified: theme.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

  const productRoutes: SitemapItem[] = toArray(products)
    .filter((product: any) => product?.slug)
    .map((product: any) => ({
      url: `/products/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: 'weekly',
      priority: product.isFeatured || product.isTrending ? 0.9 : 0.75,
    }));

  const routes = uniqueByUrl([...staticRoutes, ...categoryRoutes, ...themeRoutes, ...productRoutes]);

  return routes.map((item) => ({
    url: absoluteUrl(item.url),
    lastModified: item.lastModified ? new Date(item.lastModified) : new Date(),
    changeFrequency: item.changeFrequency,
    priority: item.priority,
  }));
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Could not load ${path}`);
  return response.json();
}

function absoluteUrl(path: string) {
  const url = new URL(path, SITE_URL);
  url.pathname = url.pathname
    .split('/')
    .map((segment) => encodeURIComponent(safeDecode(segment)))
    .join('/');
  return url.toString();
}

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function uniqueByUrl(items: SitemapItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const url = absoluteUrl(item.url);
    if (seen.has(url)) return false;
    seen.add(url);
    return true;
  });
}

function toArray(value: any) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  return [];
}
