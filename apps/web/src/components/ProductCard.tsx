import { Shirt, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@flyfree/utils';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image?: string;
  tag?: string;
  slug: string;
}

export function ProductCard({ id, name, price, image, tag, slug }: ProductCardProps) {
  return (
    <article className="rounded-lg border border-black/10 bg-white p-4 hover:shadow-lg transition-all hover:-translate-y-1">
      {/* Image */}
      <Link href={`/products/${slug}`}>
        <div className="mb-4 flex aspect-[4/5] items-center justify-center rounded-lg bg-paper hover:bg-paper/80 transition cursor-pointer">
          {image ? (
            <img src={image} alt={name} className="w-full h-full object-cover rounded-lg" />
          ) : (
            <Shirt size={54} strokeWidth={1.5} className="text-ink/50" />
          )}
        </div>
      </Link>

      {/* Tag */}
      {tag && <span className="text-xs font-black uppercase text-coral">{tag}</span>}

      {/* Name */}
      <Link href={`/products/${slug}`}>
        <h3 className="mt-2 min-h-12 text-lg font-black hover:text-coral transition cursor-pointer line-clamp-2">
          {name}
        </h3>
      </Link>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between gap-2">
        <span className="font-black text-lg">{formatCurrency(price)}</span>
        <button className="flex-1 rounded-lg bg-ink px-3 py-2 text-sm font-bold text-white hover:bg-ink/90 transition flex items-center justify-center gap-2">
          <ShoppingCart size={16} />
          <span>Add</span>
        </button>
      </div>
    </article>
  );
}
