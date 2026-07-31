'use client';

import { Star, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
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

export function ReviewsSection() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReviews() {
      try {
        // Fetch app reviews from database
        const appReviewsRes = await fetch(`${API_BASE}/reviews?limit=6`, {
          cache: 'no-store',
        });
        const appReviewsData = appReviewsRes.ok ? await appReviewsRes.json() : [];
        const appReviews = (Array.isArray(appReviewsData) ? appReviewsData : appReviewsData.data || []).map((r: any) => ({
          id: r.id,
          author: r.user?.name || 'Customer',
          rating: r.rating || 5,
          text: r.message || r.body || '',
          date: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'Recently',
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

  if (loading) {
    return (
      <section className="py-12 md:py-16 px-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="max-w-6xl mx-auto flex items-center justify-center py-16">
          <Loader2 size={32} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
        </div>
      </section>
    );
  }

  if (reviews.length === 0) {
    return null; // Don't show section if no reviews
  }

  const averageRating = (reviews.reduce((sum: number, r: Review) => sum + r.rating, 0) / reviews.length).toFixed(1);
  const totalReviews = reviews.length;

  return (
    <section className="py-12 md:py-16 px-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-10 md:mb-14">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-black" style={{ color: 'var(--text-primary)' }}>
                Customer Reviews
              </h2>
              <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
                Loved by {totalReviews}+ customers
              </p>
            </div>
            <Link
              href="/reviews"
              className="inline-flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-black text-white transition hover:opacity-90"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              See All <ArrowRight size={16} />
            </Link>
          </div>

          {/* Rating Summary */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={20}
                    className="fill-current"
                    style={{ color: 'var(--color-primary)' }}
                  />
                ))}
              </div>
              <span className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
                {averageRating}
              </span>
            </div>
            <div style={{ color: 'var(--text-secondary)' }}>
              <p className="text-sm font-bold">{totalReviews} verified reviews</p>
            </div>
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {reviews.slice(0, 4).map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>

      </div>
    </section>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div
      className="rounded-lg p-6 border"
      style={{
        backgroundColor: 'var(--bg-primary)',
        borderColor: 'var(--border-color)',
      }}
    >
      {/* Rating */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={16}
              className={`${i < review.rating ? 'fill-current' : ''}`}
              style={{ color: i < review.rating ? 'var(--color-primary)' : 'var(--border-color)' }}
            />
          ))}
        </div>
        {review.source === 'google' && (
          <span className="text-xs font-black px-2 py-1 rounded" style={{ backgroundColor: '#4285F4', color: 'white' }}>
            Google
          </span>
        )}
      </div>

      {/* Author */}
      <p className="font-black text-sm mb-2" style={{ color: 'var(--text-primary)' }}>
        {review.author}
      </p>

      {/* Date */}
      <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
        {review.date}
      </p>

      {/* Product Name */}
      {review.productName && (
        <p className="text-xs mb-2" style={{ color: 'var(--text-tertiary)' }}>
          📦 {review.productName}
        </p>
      )}

      {/* Review Text */}
      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        "{review.text}"
      </p>
    </div>
  );
}
