import Link from 'next/link';
import { IMAGE_WIDTH, storageImage } from '../lib/image';

type Style = { id: string; name: string; slug: string; imageUrl?: string | null; productCount: number };
type ProductType = { id: string; name: string; slug: string; imageUrl?: string | null; productCount: number; styles: Style[] };

/**
 * "What do you want to wear?" tiles under the hero. With one type in the shop
 * (T-Shirts today) the tiles are its styles; once Hoodies or Socks have
 * products, the tiles become one per type. Data is /catalog/filters, which only
 * lists types and styles with visible products, so a tile never leads nowhere.
 */
export function ShopByProduct({ productTypes }: { productTypes: ProductType[] }) {
  if (!productTypes.length) return null;

  const single = productTypes.length === 1 ? productTypes[0] : null;
  const tiles = single
    ? single.styles.map((style) => ({
        key: style.id,
        label: style.name,
        sub: `${style.productCount} ${single.name.toLowerCase()}`,
        href: `/products?type=${single.slug}&category=${style.slug}`,
        image: style.imageUrl,
      }))
    : productTypes.map((type) => ({
        key: type.id,
        label: type.name,
        sub: `${type.productCount} styles to pick from`,
        href: `/products?type=${type.slug}`,
        image: type.imageUrl || type.styles.find((style) => style.imageUrl)?.imageUrl,
      }));
  if (!tiles.length) return null;

  return (
    <section className="border-b px-4 py-10 sm:px-6 md:py-14" style={{ borderColor: 'var(--border-color)' }}>
      <div className="mb-5 flex items-end justify-between gap-4">
        <h2 className="text-xl font-black uppercase tracking-tight sm:text-3xl" style={{ color: 'var(--text-primary)' }}>
          {single ? `Pick your ${single.name.replace(/s$/, '').toLowerCase()} style` : 'Shop by product'}
        </h2>
        <Link
          href={single ? `/products?type=${single.slug}` : '/products'}
          className="shrink-0 text-sm font-bold underline underline-offset-4"
          style={{ color: 'var(--text-secondary)' }}
        >
          {single ? `All ${single.name}` : 'Everything'}
        </Link>
      </div>

      <div className="shop-by-grid" style={{ ['--tiles' as string]: Math.min(tiles.length, 4) }}>
        {tiles.map((tile) => (
          <Link key={tile.key} href={tile.href} className="shop-by-tile group">
            {tile.image && (
              <img
                src={storageImage(tile.image, IMAGE_WIDTH.card)}
                alt=""
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
              />
            )}
            <span className="shop-by-label">
              <span className="block text-2xl font-black uppercase leading-none sm:text-3xl" style={{ fontStretch: '78%' }}>
                {tile.label}
              </span>
              <span className="mt-1 block text-xs font-semibold opacity-80">{tile.sub}</span>
            </span>
            <span className="shop-by-arrow" aria-hidden="true">→</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
