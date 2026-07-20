'use client';

import { useEffect, useState } from 'react';
import { useCartStore } from '../stores/cartStore';
import { useAuthStore } from '../stores/authStore';
import { ArrowLeft, ChevronRight, Loader2, MapPin } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@flyfree/utils';
import { useRouter } from 'next/navigation';
import { getApiBaseUrl, readApiResponse } from '../lib/api';

interface Address {
  id: string;
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const getSubtotal = useCartStore((state) => state.getSubtotal);
  const getTax = useCartStore((state) => state.getTax);
  const getTotal = useCartStore((state) => state.getTotal);

  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);

  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponMessage, setCouponMessage] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    street: '',
    city: '',
    state: '',
    pincode: '',
  });

  // Check authentication on mount
  useEffect(() => {
    if (!token || !user) {
      setShowLoginPrompt(true);
    }
  }, [token, user]);

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0 && !showLoginPrompt) {
      router.push('/cart');
    }
  }, [items.length, router, showLoginPrompt]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = () => {
    if (
      !formData.name ||
      !formData.phone ||
      !formData.street ||
      !formData.city ||
      !formData.state ||
      !formData.pincode
    ) {
      alert('Please fill in all fields');
      return false;
    }
    if (formData.phone.length !== 10 || !/^\d+$/.test(formData.phone)) {
      alert('Please enter a valid 10-digit phone number');
      return false;
    }
    if (formData.pincode.length !== 6 || !/^\d+$/.test(formData.pincode)) {
      alert('Please enter a valid 6-digit pincode');
      return false;
    }
    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) return;

    setIsProcessing(true);
    try {
      const API_URL = getApiBaseUrl();

      // Create order
      const orderResponse = await fetch(`${API_URL}/commerce/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            size: item.size,
            color: item.color,
          })),
          address: formData,
          couponCode: couponCode || undefined,
          total: getTotal(),
        }),
      });

      const orderData = await readApiResponse(orderResponse);
      if (!orderResponse.ok) throw new Error(orderData?.error || 'Failed to create order');

      if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
        alert('Razorpay key is not configured. Order was created as pending payment.');
        router.push(`/orders/${orderData.data.id}`);
        return;
      }

      // Initialize Razorpay payment
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        const options: any = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: orderData.data.amount,
          currency: 'INR',
          name: 'Fly Free',
          description: `Order #${orderData.data.id}`,
          order_id: orderData.data.razorpayOrderId,
          handler: async (response: any) => {
            try {
              // Verify payment
              const verifyResponse = await fetch(`${API_URL}/commerce/checkout/verify`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                  orderId: orderData.data.id,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                }),
              });

              if (!verifyResponse.ok) throw new Error('Payment verification failed');

              // Clear cart and redirect
              useCartStore.setState({ items: [] });
              router.push(`/orders/${orderData.data.id}`);
            } catch (error) {
              console.error('Payment verification error:', error);
              alert('Payment verification failed. Please contact support.');
            }
          },
          prefill: {
            name: formData.name,
            contact: formData.phone,
            email: user?.email || '',
          },
          theme: {
            color: '#FF6B6B',
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      };
      document.body.appendChild(script);
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to process order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponMessage('Enter a coupon or influencer code.');
      setCouponDiscount(0);
      return;
    }

    try {
      const response = await fetch(`${getApiBaseUrl()}/ecommerce/coupons/${encodeURIComponent(couponCode.trim())}`);
      const data = await readApiResponse(response);

      if (!response.ok || !data?.valid) {
        setCouponDiscount(0);
        setCouponMessage(data?.message || 'Code is invalid or expired.');
        return;
      }

      const discount = data.discountPercent ? Math.round(getSubtotal() * (data.discountPercent / 100)) : data.discountAmount || 0;
      setCouponDiscount(discount);
      setCouponMessage(`Code applied: ${data.discountPercent ? `${data.discountPercent}% off` : formatCurrency(discount)}.`);
    } catch {
      setCouponDiscount(0);
      setCouponMessage('Could not validate this code.');
    }
  };

  if (showLoginPrompt) {
    return (
      <div className="min-h-screen bg-white dark:bg-ink flex items-center justify-center">
        <div className="bg-paper dark:bg-ink/50 rounded-lg p-8 max-w-md w-full mx-4 text-center space-y-6">
          <div>
            <h2 className="text-2xl font-black dark:text-white mb-2">Sign In Required</h2>
            <p className="text-ink/60 dark:text-white/60">Please log in to complete your purchase</p>
          </div>

          <div className="space-y-3">
            <Link
              href="/auth/login"
              className="block w-full bg-coral text-white py-3 rounded-lg font-bold hover:bg-coral/90 transition"
            >
              Sign In
            </Link>
            <p className="text-ink/60 dark:text-white/60 text-sm">
              Don't have an account?{' '}
              <Link href="/auth/signup" className="text-coral hover:underline font-bold">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white dark:bg-ink flex items-center justify-center">
        <div className="text-center space-y-6">
          <h1 className="text-3xl font-black dark:text-white">Your cart is empty</h1>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-coral text-white px-8 py-3 rounded-lg font-bold hover:bg-coral/90 transition"
          >
            <ArrowLeft size={18} />
            Back to Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-ink">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/cart" className="inline-flex items-center gap-2 text-coral hover:underline font-bold mb-4">
            <ArrowLeft size={18} />
            Back to Cart
          </Link>
          <h1 className="text-4xl font-black dark:text-white">Checkout</h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Shipping Address */}
            <section className="bg-paper dark:bg-ink/50 rounded-lg p-6 space-y-4">
              <h2 className="text-2xl font-black dark:text-white flex items-center gap-2">
                <MapPin size={24} className="text-coral" />
                Shipping Address
              </h2>

              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="name"
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={handleFormChange}
                    className="px-4 py-3 rounded-lg border border-black/10 dark:border-white/10 dark:bg-ink/30 dark:text-white focus:outline-none focus:ring-2 focus:ring-coral"
                  />
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Phone Number"
                    value={formData.phone}
                    onChange={handleFormChange}
                    className="px-4 py-3 rounded-lg border border-black/10 dark:border-white/10 dark:bg-ink/30 dark:text-white focus:outline-none focus:ring-2 focus:ring-coral"
                  />
                </div>

                <input
                  type="text"
                  name="street"
                  placeholder="Street Address"
                  value={formData.street}
                  onChange={handleFormChange}
                  className="w-full px-4 py-3 rounded-lg border border-black/10 dark:border-white/10 dark:bg-ink/30 dark:text-white focus:outline-none focus:ring-2 focus:ring-coral"
                />

                <div className="grid sm:grid-cols-3 gap-4">
                  <input
                    type="text"
                    name="city"
                    placeholder="City"
                    value={formData.city}
                    onChange={handleFormChange}
                    className="px-4 py-3 rounded-lg border border-black/10 dark:border-white/10 dark:bg-ink/30 dark:text-white focus:outline-none focus:ring-2 focus:ring-coral"
                  />
                  <input
                    type="text"
                    name="state"
                    placeholder="State"
                    value={formData.state}
                    onChange={handleFormChange}
                    className="px-4 py-3 rounded-lg border border-black/10 dark:border-white/10 dark:bg-ink/30 dark:text-white focus:outline-none focus:ring-2 focus:ring-coral"
                  />
                  <input
                    type="text"
                    name="pincode"
                    placeholder="Pincode"
                    value={formData.pincode}
                    onChange={handleFormChange}
                    className="px-4 py-3 rounded-lg border border-black/10 dark:border-white/10 dark:bg-ink/30 dark:text-white focus:outline-none focus:ring-2 focus:ring-coral"
                  />
                </div>
              </div>
            </section>

            {/* Order Items Preview */}
            <section className="bg-paper dark:bg-ink/50 rounded-lg p-6 space-y-4">
              <h2 className="text-2xl font-black dark:text-white">Order Items</h2>
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={`${item.productId}-${item.size}-${item.color}`}
                    className="flex justify-between items-center py-3 border-b border-black/10 dark:border-white/10 last:border-b-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-bold dark:text-white truncate">{item.productName}</p>
                      <p className="text-sm text-ink/60 dark:text-white/60">
                        {item.size} • {item.color} • Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="text-coral font-bold ml-4 flex-shrink-0">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-paper dark:bg-ink/50 rounded-lg p-6 sticky top-20 space-y-6">
              <h2 className="text-2xl font-black dark:text-white">Order Summary</h2>

              <div className="rounded-lg border border-black/10 bg-white/60 p-3 dark:border-white/10 dark:bg-white/5">
                <p className="mb-2 text-sm font-black dark:text-white">Coupon / Influencer code</p>
                <div className="flex gap-2">
                  <input
                    value={couponCode}
                    onChange={(event) => {
                      setCouponCode(event.target.value.toUpperCase());
                      setCouponMessage('');
                      setCouponDiscount(0);
                    }}
                    placeholder="SNEHA10"
                    className="min-w-0 flex-1 rounded border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-ink/30 dark:text-white"
                  />
                  <button type="button" onClick={applyCoupon} className="rounded bg-ink px-3 py-2 text-sm font-black text-white dark:bg-white dark:text-ink">
                    Apply
                  </button>
                </div>
                {couponMessage && <p className={`mt-2 text-xs font-bold ${couponDiscount ? 'text-green-700 dark:text-green-300' : 'text-red-600 dark:text-red-300'}`}>{couponMessage}</p>}
              </div>

              <div className="space-y-3 pb-6 border-b border-black/10 dark:border-white/10">
                <div className="flex justify-between text-ink/70 dark:text-white/70">
                  <span>Subtotal</span>
                  <span>{formatCurrency(getSubtotal())}</span>
                </div>
                <div className="flex justify-between text-ink/70 dark:text-white/70">
                  <span>GST (18%)</span>
                  <span>{formatCurrency(getTax())}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-green-700 dark:text-green-300">
                    <span>Discount</span>
                    <span>-{formatCurrency(couponDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-ink/70 dark:text-white/70">
                  <span>Shipping</span>
                  <span className="text-coral font-bold">FREE</span>
                </div>
              </div>

              <div className="flex justify-between text-2xl font-black dark:text-white">
                <span>Total</span>
                <span className="text-coral">{formatCurrency(Math.max(getTotal() - couponDiscount, 0))}</span>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={isProcessing}
                className="w-full bg-coral text-white py-3 rounded-lg font-bold hover:bg-coral/90 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Pay with Razorpay
                    <ChevronRight size={18} />
                  </>
                )}
              </button>

              <p className="text-xs text-ink/60 dark:text-white/60 text-center">
                Your payment is secure and encrypted
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
