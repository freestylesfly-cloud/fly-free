'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Package, Star, Send } from 'lucide-react';
import { useAuthStore } from '../../../stores/authStore';
import { getApiBaseUrl } from '../../../lib/api';
import { uploadImage } from '../../../lib/supabase';

const API_BASE = getApiBaseUrl();

interface OrderItem {
  id?: string;
  productId: string;
  name: string;
  productName?: string;
  productSlug?: string;
  productImage?: string;
  quantity: number;
  price: number;
}

interface Review {
  [productId: string]: {
    rating: number;
    title: string;
    message: string;
    images: File[];
    imageUrls: string[];
  };
}

export default function OrderReviewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const [order, setOrder] = useState<any>(null);
  const [reviews, setReviews] = useState<Review>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!token) {
      router.push(`/login?redirect=/orders/${params?.id}/review`);
      return;
    }

    async function loadOrder() {
      if (!params?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        const res = await fetch(`${API_BASE}/ecommerce/orders/${params.id}/track`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) {
          throw new Error('Order not found');
        }

        const data = await res.json();
        const orderData = data?.data || data;
        setOrder(orderData);

        // Initialize reviews object
        const initialReviews: Review = {};
        (orderData.items || []).forEach((item: OrderItem) => {
          initialReviews[item.productId] = {
            rating: 5,
            title: '',
            message: '',
            images: [],
            imageUrls: []
          };
        });
        setReviews(initialReviews);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load order');
      } finally {
        setLoading(false);
      }
    }

    void loadOrder();
  }, [params?.id, token, router]);

  async function handleImageUpload(productId: string, files: FileList) {
    const newImages = Array.from(files);
    const currentReview = reviews[productId];

    // Limit to 5 images per review
    const totalImages = (currentReview?.images?.length || 0) + newImages.length;
    if (totalImages > 5) {
      setError('Maximum 5 images per review');
      return;
    }

    setError('');

    // Create preview URLs
    const newUrls = newImages.map(file => URL.createObjectURL(file));

    setReviews((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        images: [...(prev[productId]?.images || []), ...newImages],
        imageUrls: [...(prev[productId]?.imageUrls || []), ...newUrls]
      }
    }));
  }

  function removeImage(productId: string, index: number) {
    setReviews((prev) => {
      const images = [...(prev[productId]?.images || [])];
      const urls = [...(prev[productId]?.imageUrls || [])];

      // Revoke the preview URL
      if (urls[index]) {
        URL.revokeObjectURL(urls[index]);
      }

      images.splice(index, 1);
      urls.splice(index, 1);

      return {
        ...prev,
        [productId]: {
          ...prev[productId],
          images,
          imageUrls: urls
        }
      };
    });
  }

  async function handleSubmitReview(productId: string) {
    if (!token) {
      setError('You must be logged in to submit a review');
      return;
    }

    const review = reviews[productId];
    if (!review.title.trim()) {
      setError('Please enter a review title');
      return;
    }
    if (!review.message.trim()) {
      setError('Please enter a review message');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // Upload images to Supabase storage first
      let imageUrls: string[] = [];
      if (review.images && review.images.length > 0) {
        imageUrls = await Promise.all(
          review.images.map((file) => uploadImage('products', file, 'reviews'))
        );
      }

      // Submit review with image URLs
      const res = await fetch(`${API_BASE}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          productId,
          orderId: params?.id,
          rating: review.rating,
          title: review.title,
          body: review.message,
          message: review.message,
          images: imageUrls
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData?.error || errData?.message || 'Failed to submit review');
      }

      setSuccess(`Review submitted for ${order.items.find((i: OrderItem) => i.productId === productId)?.name}!`);

      // Clear the review form
      setReviews((prev) => ({
        ...prev,
        [productId]: {
          rating: 5,
          title: '',
          message: '',
          images: [],
          imageUrls: []
        }
      }));

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <main className="min-h-screen px-4 py-12" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <section className="mx-auto max-w-xl rounded-lg border p-8 text-center" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
          <Package className="mx-auto mb-4 h-12 w-12" style={{ color: 'var(--text-secondary)' }} />
          <h1 className="text-2xl font-black">Sign in to review</h1>
          <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>You need to sign in to submit a review for your order.</p>
          <Link href={`/login?redirect=/orders/${params?.id}/review`} className="mt-6 inline-flex rounded px-5 py-3 text-sm font-black text-white" style={{ backgroundColor: 'var(--color-primary)' }}>
            Sign in
          </Link>
        </section>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--color-primary)' }} />
      </main>
    );
  }

  if (error && !order) {
    return (
      <main className="min-h-screen px-4 py-12" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <section className="mx-auto max-w-xl rounded-lg border p-8 text-center" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
          <Package className="mx-auto mb-4 h-12 w-12" style={{ color: 'var(--text-secondary)' }} />
          <h1 className="text-2xl font-black">Order not found</h1>
          <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>{error}</p>
          <Link href="/profile/orders" className="mt-6 inline-flex rounded px-5 py-3 text-sm font-black text-white" style={{ backgroundColor: 'var(--color-primary)' }}>
            Back to orders
          </Link>
        </section>
      </main>
    );
  }

  if (!order?.items || order.items.length === 0) {
    return (
      <main className="min-h-screen px-4 py-12" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <section className="mx-auto max-w-xl rounded-lg border p-8 text-center" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
          <Package className="mx-auto mb-4 h-12 w-12" style={{ color: 'var(--text-secondary)' }} />
          <h1 className="text-2xl font-black">No items to review</h1>
          <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>This order has no items.</p>
          <Link href="/profile/orders" className="mt-6 inline-flex rounded px-5 py-3 text-sm font-black text-white" style={{ backgroundColor: 'var(--color-primary)' }}>
            Back to orders
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-12 pb-20" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <div className="mx-auto max-w-4xl">
        <Link href="/profile/orders" className="mb-6 inline-flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--color-primary)' }}>
          <ArrowLeft size={16} /> Back to orders
        </Link>

        <div className="rounded-lg border p-6 mb-8" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
          <h1 className="text-3xl font-black mb-2">Review your order</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Order ID: {order.id}</p>
          <p style={{ color: 'var(--text-secondary)' }}>Placed on: {new Date(order.createdAt).toLocaleDateString()}</p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-green-700">
            ✓ {success}
          </div>
        )}

        <div className="space-y-6">
          {order.items.map((item: OrderItem) => (
            <div key={item.productId} className="rounded-lg border p-6" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
              <div className="mb-4 flex gap-4">
                {item.productImage && (
                  <img src={item.productImage} alt={item.name} className="h-24 w-24 rounded object-cover" />
                )}
                <div className="flex-1">
                  <Link href={item.productSlug ? `/products/${item.productSlug}` : '#'} className="font-black text-lg hover:opacity-70" style={{ color: 'var(--text-primary)' }}>
                    {item.name || item.productName}
                  </Link>
                  <p style={{ color: 'var(--text-secondary)' }}>Quantity: {item.quantity}</p>
                  <p className="font-bold" style={{ color: 'var(--color-primary)' }}>₹{item.price}</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Rating */}
                <div>
                  <label className="mb-2 block text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                    Rating
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setReviews((prev) => ({
                          ...prev,
                          [item.productId]: {
                            ...prev[item.productId],
                            rating: star
                          }
                        }))}
                        className="text-2xl transition hover:scale-110"
                        aria-label={`Rate ${star} stars`}
                      >
                        <Star
                          size={24}
                          className={star <= (reviews[item.productId]?.rating || 5) ? 'fill-current' : ''}
                          style={{
                            color: star <= (reviews[item.productId]?.rating || 5) ? 'var(--color-accent)' : 'var(--border-color)'
                          }}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="mb-2 block text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                    Review title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Great quality and fit!"
                    value={reviews[item.productId]?.title || ''}
                    onChange={(e) => setReviews((prev) => ({
                      ...prev,
                      [item.productId]: {
                        ...prev[item.productId],
                        title: e.target.value
                      }
                    }))}
                    className="w-full rounded-lg border px-4 py-2 font-normal" style={{ borderColor: 'var(--border-color)' }}
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="mb-2 block text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                    Your review *
                  </label>
                  <textarea
                    placeholder="Share your experience with this product..."
                    value={reviews[item.productId]?.message || ''}
                    onChange={(e) => setReviews((prev) => ({
                      ...prev,
                      [item.productId]: {
                        ...prev[item.productId],
                        message: e.target.value
                      }
                    }))}
                    rows={4}
                    className="w-full rounded-lg border px-4 py-2 font-normal resize-none" style={{ borderColor: 'var(--border-color)' }}
                  />
                </div>

                {/* Images Upload */}
                <div>
                  <label className="mb-2 block text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                    Add photos (optional, max 5)
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => e.target.files && handleImageUpload(item.productId, e.target.files)}
                    className="w-full rounded-lg border px-4 py-2"
                    style={{ borderColor: 'var(--border-color)' }}
                  />

                  {/* Image Previews */}
                  {reviews[item.productId]?.imageUrls && reviews[item.productId].imageUrls.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {reviews[item.productId].imageUrls.map((url, idx) => (
                        <div key={idx} className="relative">
                          <img
                            src={url}
                            alt={`Review image ${idx + 1}`}
                            className="h-24 w-24 rounded object-cover"
                          />
                          <button
                            onClick={() => removeImage(item.productId, idx)}
                            className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full text-white transition hover:opacity-90"
                            style={{ backgroundColor: 'var(--color-primary)' }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  onClick={() => handleSubmitReview(item.productId)}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-lg px-6 py-3 font-bold text-white transition hover:opacity-90 disabled:opacity-60"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  <Send size={16} />
                  Submit Review
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-lg border p-6 text-center" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Thank you for shopping with us! Your reviews help other customers and help us improve.</p>
        </div>
      </div>
    </main>
  );
}
