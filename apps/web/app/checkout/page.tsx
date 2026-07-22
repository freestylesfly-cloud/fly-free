'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Loader2, MapPin, ShoppingBag } from 'lucide-react';
import { useCartStore } from '../stores/cartStore';
import { useAuthStore } from '../stores/authStore';
import { getApiBaseUrl } from '../lib/api';

const API_URL = getApiBaseUrl();

export default function CheckoutPage() {
  const cartItems = useCartStore((state) => state.items);
  const getTotal = useCartStore((state) => state.getTotal);
  const getSubtotal = useCartStore((state) => state.getSubtotal);
  const getTax = useCartStore((state) => state.getTax);
  const clearCart = useCartStore((state) => state.clearCart);
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);

  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({
    fullName: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India'
  });
  const [addingAddress, setAddingAddress] = useState(false);

  useEffect(() => {
    if (!user || !token) {
      window.location.href = '/auth/login?next=/checkout';
      return;
    }

    async function loadAddresses() {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/ecommerce/addresses`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const addrs = data.data || data;
          setAddresses(Array.isArray(addrs) ? addrs : []);
          if (addrs.length > 0) setSelectedAddress(addrs[0].id);
        }
      } catch (err) {
        console.error('Failed to load addresses');
      } finally {
        setLoading(false);
      }
    }

    loadAddresses();
  }, [user, token]);

  if (cartItems.length === 0) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <ShoppingBag size={48} className="mx-auto mb-4 opacity-30" />
          <h1 className="text-2xl font-black mb-4">Your cart is empty</h1>
          <Link href="/products" className="inline-block px-6 py-3 bg-primary text-white font-bold rounded-lg hover:opacity-90">
            Continue Shopping
          </Link>
        </div>
      </main>
    );
  }

  async function handleCheckout() {
    if (!selectedAddress) {
      setError('Please select an address');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      const orderRes = await fetch(`${API_URL}/ecommerce/checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: cartItems.map(item => ({
            variantId: item.variantId,
            quantity: item.quantity,
            hamperId: item.hamperId || undefined
          })),
          shippingAddressId: selectedAddress
        })
      });

      if (!orderRes.ok) {
        const err = await orderRes.json();
        throw new Error(err.error || 'Failed to create order');
      }

      const order = await orderRes.json();
      const orderData = order.data || order;

      if (typeof window !== 'undefined' && (window as any).Razorpay) {
        const razorpay = new (window as any).Razorpay({
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: orderData.amount,
          currency: 'INR',
          name: 'Fly Free',
          description: `Order for ${cartItems.length} item(s)`,
          order_id: orderData.razorpayOrderId,
          prefill: {
            email: user?.email || '',
            contact: user?.phone || ''
          },
          theme: {
            color: 'var(--color-primary)'
          },
          handler: async (response: any) => {
            await verifyPayment(response, orderData.orderId);
          }
        });
        razorpay.open();
      } else {
        throw new Error('Razorpay not loaded');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
      setProcessing(false);
    }
  }

  async function handleAddAddress() {
    if (!addressForm.fullName || !addressForm.phone || !addressForm.line1 || !addressForm.city || !addressForm.state || !addressForm.postalCode) {
      setError('Please fill all required fields');
      return;
    }

    setAddingAddress(true);
    try {
      const res = await fetch(`${API_URL}/ecommerce/addresses`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(addressForm)
      });

      if (!res.ok) throw new Error('Failed to add address');

      const data = await res.json();
      const newAddr = data.data || data;
      setAddresses([...addresses, newAddr]);
      setSelectedAddress(newAddr.id);
      setShowAddressForm(false);
      setAddressForm({
        fullName: '',
        phone: '',
        line1: '',
        line2: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India'
      });
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add address');
    } finally {
      setAddingAddress(false);
    }
  }

  async function verifyPayment(response: any, orderId: string) {
    try {
      const verifyRes = await fetch(`${API_URL}/ecommerce/payment/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId,
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature
        })
      });

      if (verifyRes.ok) {
        clearCart();
        window.location.href = `/order-success?orderId=${orderId}`;
      } else {
        window.location.href = `/order-failed?orderId=${orderId}`;
      }
    } catch (err) {
      window.location.href = `/order-failed?orderId=${orderId}`;
    }
  }

  const subtotal = getSubtotal();
  const tax = getTax();
  const total = getTotal();

  return (
    <main className="min-h-screen pb-20 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-black mb-8">Checkout</h1>

        <div className="grid md:grid-cols-[1.5fr_1fr] gap-8">
          <div>
            <div className="bg-white border border-black/10 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-black mb-4 flex items-center gap-2">
                <MapPin size={20} />
                Shipping Address
              </h2>

              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : showAddressForm ? (
                <form className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Full Name *"
                      value={addressForm.fullName}
                      onChange={(e) => setAddressForm({...addressForm, fullName: e.target.value})}
                      className="col-span-2 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 transition"
                      style={{
                        borderWidth: '1px',
                        borderColor: 'var(--border-color)',
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-primary)'
                      }}
                    />
                    <input
                      type="tel"
                      placeholder="Phone *"
                      value={addressForm.phone}
                      onChange={(e) => setAddressForm({...addressForm, phone: e.target.value})}
                      className="col-span-2 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 transition"
                      style={{
                        borderWidth: '1px',
                        borderColor: 'var(--border-color)',
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-primary)'
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Address Line 1 *"
                      value={addressForm.line1}
                      onChange={(e) => setAddressForm({...addressForm, line1: e.target.value})}
                      className="col-span-2 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 transition"
                      style={{
                        borderWidth: '1px',
                        borderColor: 'var(--border-color)',
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-primary)'
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Address Line 2"
                      value={addressForm.line2}
                      onChange={(e) => setAddressForm({...addressForm, line2: e.target.value})}
                      className="col-span-2 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 transition"
                      style={{
                        borderWidth: '1px',
                        borderColor: 'var(--border-color)',
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-primary)'
                      }}
                    />
                    <input
                      type="text"
                      placeholder="City *"
                      value={addressForm.city}
                      onChange={(e) => setAddressForm({...addressForm, city: e.target.value})}
                      className="px-4 py-2 rounded-lg focus:outline-none focus:ring-2 transition"
                      style={{
                        borderWidth: '1px',
                        borderColor: 'var(--border-color)',
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-primary)'
                      }}
                    />
                    <input
                      type="text"
                      placeholder="State *"
                      value={addressForm.state}
                      onChange={(e) => setAddressForm({...addressForm, state: e.target.value})}
                      className="px-4 py-2 rounded-lg focus:outline-none focus:ring-2 transition"
                      style={{
                        borderWidth: '1px',
                        borderColor: 'var(--border-color)',
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-primary)'
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Postal Code *"
                      value={addressForm.postalCode}
                      onChange={(e) => setAddressForm({...addressForm, postalCode: e.target.value})}
                      className="px-4 py-2 rounded-lg focus:outline-none focus:ring-2 transition"
                      style={{
                        borderWidth: '1px',
                        borderColor: 'var(--border-color)',
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-primary)'
                      }}
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleAddAddress}
                      disabled={addingAddress}
                      className="flex-1 py-2 text-white font-bold rounded-lg hover:opacity-90 disabled:opacity-50"
                      style={{ backgroundColor: 'var(--color-primary)' }}
                    >
                      {addingAddress ? 'Adding...' : 'Save Address'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddressForm(false)}
                      className="flex-1 py-2 border border-black/10 font-bold rounded-lg hover:bg-black/5"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : addresses.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-black/60 mb-4">No addresses saved</p>
                  <button
                    onClick={() => setShowAddressForm(true)}
                    className="text-primary font-bold hover:underline"
                  >
                    Add address now
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((addr) => (
                    <button
                      key={addr.id}
                      onClick={() => setSelectedAddress(addr.id)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition ${
                        selectedAddress === addr.id
                          ? 'border-primary bg-primary/5'
                          : 'border-black/10 hover:border-primary/50'
                      }`}
                    >
                      <p className="font-bold">{addr.fullName}</p>
                      <p className="text-sm text-black/60">{addr.line1}{addr.line2 && `, ${addr.line2}`}</p>
                      <p className="text-sm text-black/60">{addr.city}, {addr.state} {addr.postalCode}</p>
                      <p className="text-sm text-black/60 mt-2">{addr.phone}</p>
                    </button>
                  ))}
                  <button
                    onClick={() => setShowAddressForm(true)}
                    className="w-full py-3 border-2 border-dashed border-primary text-primary font-bold rounded-lg hover:bg-primary/5"
                  >
                    + Add Another Address
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white border border-black/10 rounded-lg p-6">
              <h2 className="text-xl font-black mb-4">Order Items ({cartItems.length})</h2>
              <div className="space-y-4">
                {cartItems.map((item, idx) => (
                  <div key={idx} className="border-b border-black/10 pb-4 last:border-0">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <p className="font-bold">{item.productName}</p>
                        <p className="text-sm text-black/60">{item.color} • {item.size} • Qty: {item.quantity}</p>
                        {item.hamperName && (
                          <p className="text-sm text-primary font-bold mt-1">+ {item.hamperName}</p>
                        )}
                      </div>
                      <p className="font-bold">₹{(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="sticky top-8 h-fit">
            <div className="bg-white border border-black/10 rounded-lg p-6 space-y-4">
              <h2 className="text-xl font-black">Order Summary</h2>

              <div className="space-y-3 py-4 border-y border-black/10">
                <div className="flex justify-between text-black/60">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-black/60">
                  <span>GST (18%)</span>
                  <span>₹{tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-black/60">
                  <span>Shipping</span>
                  <span>FREE</span>
                </div>
              </div>

              <div className="flex justify-between text-xl font-black pb-4 border-b border-black/10">
                <span>Total</span>
                <span>₹{total.toLocaleString()}</span>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm font-bold">
                  {error}
                </div>
              )}

              <button
                onClick={handleCheckout}
                disabled={processing || !selectedAddress}
                className="w-full py-4 rounded-lg font-black text-white text-lg transition flex items-center justify-center gap-2"
                style={{
                  backgroundColor: processing || !selectedAddress ? 'var(--border-color)' : 'var(--color-primary)',
                  opacity: processing || !selectedAddress ? 0.5 : 1,
                  cursor: processing || !selectedAddress ? 'not-allowed' : 'pointer'
                }}
              >
                {processing ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Pay ₹{total.toLocaleString()} with Razorpay
                    <ArrowRight size={20} />
                  </>
                )}
              </button>

              <p className="text-xs text-center text-black/50">
                By placing your order, you agree to our terms and conditions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
