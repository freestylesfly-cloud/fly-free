'use client';

import { Shirt, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@flyfree/utils';
import { useCartStore } from '../stores/cartStore';
import { useState } from 'react';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image?: string;
  tag?: string;
  slug: string;
}

export function ProductCard({ id, name, price, image, tag, slug }: ProductCardProps) {
  const [isAdding, setIsAdding] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsAdding(true);
    addItem({
      productId: id,
      productName: name,
      price,
      quantity: 1,
      size: 'M',
      color: 'Black',
      image,
    });
    setTimeout(() => setIsAdding(false), 500);
  };

  return (
    <article
      className="rounded-lg p-4 hover:shadow-lg transition-all hover:-translate-y-1"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-color)',
        borderWidth: '1px'
      }}
    >
      {/* Image */}
      <Link href={`/products/${slug}`}>
        <div
          className="mb-4 flex aspect-[4/5] items-center justify-center rounded-lg transition cursor-pointer"
          style={{ backgroundColor: 'var(--bg-tertiary)' }}
        >
          {image ? (
            <img src={image} alt={name} className="w-full h-full object-cover rounded-lg" />
          ) : (
            <Shirt size={54} strokeWidth={1.5} style={{ color: 'var(--text-tertiary)' }} />
          )}
        </div>
      </Link>

      {/* Tag */}
      {tag && <span className="text-xs font-black uppercase" style={{ color: 'var(--accent-primary)' }}>{tag}</span>}

      {/* Name */}
      <Link href={`/products/${slug}`}>
        <h3
          className="mt-2 min-h-12 text-lg font-black transition cursor-pointer line-clamp-2 hover:opacity-80"
          style={{ color: 'var(--text-primary)' }}
        >
          {name}
        </h3>
      </Link>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between gap-2">
        <span className="font-black text-lg" style={{ color: 'var(--text-primary)' }}>{formatCurrency(price)}</span>
        <button
          onClick={handleAddToCart}
          disabled={isAdding}
          className="flex-1 rounded-lg px-3 py-2 text-sm font-bold transition flex items-center justify-center gap-2 disabled:opacity-50"
          style={{
            backgroundColor: 'var(--color-primary)',
            color: 'white'
          }}
        >
          <ShoppingCart size={16} />
          <span>{isAdding ? 'Adding...' : 'Add'}</span>
        </button>
      </div>
    </article>
  );
}
