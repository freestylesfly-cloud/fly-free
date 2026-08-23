import Link from 'next/link';
import { getApiBaseUrl } from '../lib/api';

const API_BASE = getApiBaseUrl();

interface Review {
  id: string;
  rating: number;
  title?: string;
  body?: string;
  mediaUrls?: string[];
  user?: { name?: string | null };
  product?: { name?: string | null; slug?: string | null };
}

function unwrap<T>(payload: any): T[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

async function getReviews() {
  try {
    const response = await fetch(`${API_BASE}/reviews/latest?limit=48`, { cache: 'no-store' });
    if (!response.ok) return [];
    return unwrap<Review>(await response.json());
  } catch {
    return [];
  }
}

export default async function ReviewsPage() {
  const reviews = await getReviews();
  const average = reviews.length
    ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length
    : 0;
  const photoReviews = reviews.filter((review) => review.mediaUrls?.length).length;

  return (
    <main style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <section className="border-b px-5 py-10 sm:px-10 lg:px-16 lg:py-14" style={{ borderColor: 'var(--border-color)' }}>
        <p className="text-sm font-black uppercase tracking-wide" style={{ color: 'var(--color-primary)' }}>
          Customer reviews
        </p>
        <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
          <div>
            <h1 className="max-w-5xl text-5xl font-black uppercase leading-[0.92] sm:text-7xl lg:text-8xl">
              Real fits, real feedback.
            </h1>
            <p className="mt-5 max-w-2xl text-base font-bold leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Approved reviews from Fly Free customers, linked back to the products they bought.
            </p>
          </div>
          <div className="grid grid-cols-3 border bg-white" style={{ borderColor: 'var(--border-color)' }}>
            <Metric value={reviews.length} label="Reviews" />
            <Metric value={average ? average.toFixed(1) : '-'} label="Avg rating" />
            <Metric value={photoReviews} label="With photos" />
          </div>
        </div>
      </section>

      {reviews.length > 0 ? (
        <section className="grid gap-px border-b bg-black/10 sm:grid-cols-2 lg:grid-cols-3" style={{ borderColor: 'var(--border-color)' }}>
          {reviews.map((review, index) => (
            <ReviewCard key={review.id} review={review} large={index === 0 || index === 5} />
          ))}
        </section>
      ) : (
        <section className="px-5 py-16 sm:px-10 lg:px-16">
          <div className="border bg-white p-8" style={{ borderColor: 'var(--border-color)' }}>
            <h2 className="text-2xl font-black uppercase">No reviews yet</h2>
            <p className="mt-2 font-bold" style={{ color: 'var(--text-secondary)' }}>
              Approved customer reviews will appear here after orders are reviewed.
            </p>
          </div>
        </section>
      )}
    </main>
  );
}

function ReviewCard({ review, large }: { review: Review; large?: boolean }) {
  const href = review.product?.slug ? `/products/${review.product.slug}#reviews` : '/products';
  const image = review.mediaUrls?.[0];

  return (
    <Link
      href={href}
      className={`group flex min-h-[330px] flex-col bg-white p-5 transition hover:-translate-y-1 hover:shadow-xl ${large ? 'lg:min-h-[440px]' : ''}`}
      style={{ color: 'var(--text-primary)' }}
    >
      {image && (
        <div className="mb-5 aspect-[4/3] overflow-hidden bg-black/5">
          <img src={image} alt="" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
        </div>
      )}
      <Stars rating={review.rating || 5} />
      <h2 className="mt-4 line-clamp-2 text-xl font-black uppercase leading-tight">
        {review.title || review.product?.name || 'Fly Free review'}
      </h2>
      {review.body && (
        <p className="mt-3 line-clamp-5 text-sm font-bold leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {review.body}
        </p>
      )}
      <div className="mt-auto pt-6">
        <p className="text-xs font-black uppercase" style={{ color: 'var(--text-tertiary)' }}>
          {review.user?.name || 'Verified customer'}
        </p>
        {review.product?.name && (
          <p className="mt-1 text-sm font-black uppercase" style={{ color: 'var(--color-primary)' }}>
            {review.product.name}
          </p>
        )}
      </div>
    </Link>
  );
}

function Metric({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="border-r p-4 last:border-r-0" style={{ borderColor: 'var(--border-color)' }}>
      <p className="text-2xl font-black">{value}</p>
      <p className="mt-1 text-[11px] font-black uppercase" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
    </div>
  );
}

function Stars({ rating }: { rating: number }) {
  const filled = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <div className="flex gap-1 text-sm font-black" aria-label={`${filled} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <span key={index} style={{ color: index < filled ? 'var(--color-accent)' : 'var(--text-tertiary)' }}>
          {index < filled ? '\u2605' : '\u2606'}
        </span>
      ))}
    </div>
  );
}
