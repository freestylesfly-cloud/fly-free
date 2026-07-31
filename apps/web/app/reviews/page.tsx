'use client';

import Link from 'next/link';
import { Star, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getApiBaseUrl } from '../lib/api';

const API_BASE = getApiBaseUrl();

interface Review {
  id?: string;
  author: string;
  rating: number;
  text: string;
  date?: string;
  source?: 'google' | 'app';
  productName?: string;
  createdAt?: string;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReviews() {
      try {
        // Fetch app reviews from database
        const appReviewsRes = await fetch(`${API_BASE}/reviews?limit=50`, {
          cache: 'no-store',
        });
        const appReviewsData = appReviewsRes.ok ? await appReviewsRes.json() : [];
        const appReviews = (Array.isArray(appReviewsData) ? appReviewsData : appReviewsData.data || []).map((r: any) => ({
          id: r.id,
          author: r.user?.name || 'Customer',
          rating: r.rating || 5,
          text: r.message || r.body || '',
          date: r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }) : 'Recently',
          source: 'app' as const,
          productName: r.product?.name,
          createdAt: r.createdAt,
        }));

        setReviews(appReviews);
      } catch (error) {
        console.error('Failed to load reviews:', error);
        setReviews([]);
      } finally {
        setLoading(false);
      }
    }

    loadReviews();
  }, []);

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum: number, r: Review) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0';

  return (
    <main className="min-h-screen pb-28 lg:pb-0" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <section
        className="border-b px-4 py-8 md:py-12"
        style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
      >
        <div className="max-w-6xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-bold mb-6"
            style={{ color: 'var(--color-primary)' }}
          >
            <ArrowLeft size={16} /> Back to home
          </Link>

          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div>
              <h1 className="text-4xl md:text-5xl font-black" style={{ color: 'var(--text-primary)' }}>
                Reviews
              </h1>
              <p className="mt-3 text-lg" style={{ color: 'var(--text-secondary)' }}>
                See what our customers say about Fly Free
              </p>
            </div>

            {/* Rating Card */}
            <div
              className="rounded-lg p-8 border"
              style={{
                backgroundColor: 'var(--bg-primary)',
                borderColor: 'var(--border-color)',
              }}
            >
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={32} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4 mb-6">
                    <div>
                      <div className="text-5xl font-black" style={{ color: 'var(--text-primary)' }}>
                        {averageRating}
                      </div>
                      <div className="text-xs font-bold uppercase mt-1" style={{ color: 'var(--text-secondary)' }}>
                        Average rating
                      </div>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={24}
                          className="fill-current"
                          style={{ color: 'var(--color-primary)' }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                    Based on {reviews.length} verified customer reviews
                  </div>

                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Grid */}
      <section className="px-4 py-12 md:py-16">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={32} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-16">
              <p style={{ color: 'var(--text-secondary)' }}>No reviews yet. Be the first to review!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      {reviews.length > 0 && (
        <section
          className="px-4 py-12 md:py-16 border-t"
          style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
        >
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-3xl font-black mb-4" style={{ color: 'var(--text-primary)' }}>
              Love Fly Free?
            </h2>
            <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
              Continue shopping for more amazing designs and collections
            </p>

            <Link
              href="/products"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-white rounded-lg transition hover:opacity-90"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              Continue Shopping <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div
      className="rounded-lg p-6 md:p-8 border"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-color)',
      }}
    >
      {/* Rating Stars & Source Badge */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={18}
              className={`${i < review.rating ? 'fill-current' : ''}`}
              style={{
                color: i < review.rating ? 'var(--color-primary)' : 'var(--border-color)',
              }}
            />
          ))}
        </div>
        {review.source === 'google' && (
          <span className="text-xs font-black px-2 py-1 rounded" style={{ backgroundColor: '#4285F4', color: 'white' }}>
            Google
          </span>
        )}
      </div>

      {/* Author & Date */}
      <div className="mb-4">
        <h3 className="font-black text-lg" style={{ color: 'var(--text-primary)' }}>
          {review.author}
        </h3>
        {review.date && (
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
            {review.date}
          </p>
        )}
      </div>

      {/* Product Name */}
      {review.productName && (
        <p className="text-xs mb-2" style={{ color: 'var(--text-tertiary)' }}>
          📦 {review.productName}
        </p>
      )}

      {/* Review Text */}
      <p className="text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        "{review.text}"
      </p>

      {/* Rating Label */}
      <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
        <span className="text-xs font-bold uppercase" style={{ color: 'var(--text-tertiary)' }}>
          ★ {review.rating}.0 Rating • Verified Purchase
        </span>
      </div>
    </div>
  );
}
