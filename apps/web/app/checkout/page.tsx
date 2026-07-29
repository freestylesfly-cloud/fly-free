'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MapPin, ShoppingBag, Plus, Edit2, Loader2, Tag, Check, AlertCircle } from 'lucide-react';
import { useCartStore } from '../stores/cartStore';
import { useAuthStore } from '../stores/authStore';

export default function CheckoutPage() {
  const router = useRouter();
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
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addingAddress, setAddingAddress] = useState(false);

  // Coupon system
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponMessage, setCouponMessage] = useState('');
  const [couponValid, setCouponValid] = useState(false);

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

  useEffect(() => {
    if (!user || !token) {
      window.location.href = '/auth/login?next=/checkout';
      return;
    }
    loadAddresses();
  }, [user, token]);

  async function loadAddresses() {
    try {
      setLoading(true);
      const res = await fetch(`/api/ecommerce/addresses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const addrs = data.data || data;
        setAddresses(Array.isArray(addrs) ? addrs : []);
        if (addrs.length > 0 && !selectedAddress) {
          setSelectedAddress(addrs[0].id);
        }
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }

  // Validate coupon
  async function validateCoupon() {
    if (!couponCode.trim()) {
      setCouponMessage('Enter a coupon code');
      return;
    }

    setCouponLoading(true);
    setCouponMessage('');
    setCouponValid(false);
    setAppliedCoupon(null);

    try {
      const cartProductIds = cartItems.map(item => item.productId);
      const res = await fetch(`/api/ecommerce/coupons/${couponCode}?productIds=${cartProductIds.join(',')}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        if (data.valid) {
          setAppliedCoupon(data);
          setCouponValid(true);
          if (data.type === 'INFLUENCER') {
            setCouponMessage(`✓ ${data.influencer.name}'s code applied! 10% off eligible products`);
          } else {
            setCouponMessage(`✓ Coupon applied! ${data.discountPercent}% off`);
          }
        } else {
          setCouponMessage(`✕ ${data.message}`);
          setCouponValid(false);
        }
      } else {
        const err = await res.json();
        setCouponMessage(`✕ ${err.message || 'Invalid coupon'}`);
      }
    } catch (err) {
      setCouponMessage('✕ Error validating coupon');
      console.error('Error:', err);
    } finally {
      setCouponLoading(false);
    }
  }

  // Calculate discount
  const subtotal = getSubtotal();
  const baseDiscount = appliedCoupon?.discountPercent ? Math.round((subtotal * appliedCoupon.discountPercent) / 100) : 0;
  const tax = getTax();
  const total = getTotal() - baseDiscount;

  async function handleCheckout() {
    if (!selectedAddress) {
      setError('Please select an address');
      return;
    }

    const address = addresses.find(a => a.id === selectedAddress);
    if (!address) {
      setError('Address not found');
      return;
    }

    if (processing) return;
    setProcessing(true);
    setError('');

    try {
      const payload = {
        items: cartItems.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity
        })),
        address: {
          name: address.fullName,
          phone: address.phone,
          street: address.line1,
          city: address.city,
          state: address.state,
          pincode: address.postalCode
        },
        couponCode: appliedCoupon?.code || undefined
      };

      console.log('📤 Checkout payload:', payload);

      const orderRes = await fetch(`/api/commerce/checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!orderRes.ok) {
        const err = await orderRes.json();
        console.error('❌ Checkout error:', err);
        throw new Error(err.message || 'Checkout failed');
      }

      const order = await orderRes.json();
      const orderData = order.data || order;

      if (typeof window !== 'undefined' && (window as any).Razorpay) {
        const amountInPaise = Math.round((total || orderData.amount) * 100);

        const razorpay = new (window as any).Razorpay({
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: amountInPaise,
          currency: 'INR',
          name: 'Fly Free',
          description: `${cartItems.length} item(s)`,
          order_id: orderData.razorpayOrderId,
          prefill: {
            email: user?.email || '',
            contact: user?.phone || ''
          },
          handler: async (response: any) => {
            await verifyPayment(response, orderData.orderId);
          },
          modal: {
            ondismiss: () => {
              setProcessing(false);
              setError('Payment cancelled');
            }
          }
        });
        razorpay.open();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
      setProcessing(false);
    }
  }

  async function verifyPayment(response: any, orderId: string) {
    try {
      const verifyRes = await fetch(`/api/commerce/checkout/verify`, {
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
        setProcessing(false);
        setError('Payment verification failed');
      }
    } catch (err) {
      setProcessing(false);
      setError('Payment error');
      console.error('Error:', err);
    }
  }

  async function handleAddAddress() {
    if (!addressForm.fullName || !addressForm.phone || !addressForm.line1 || !addressForm.city || !addressForm.state || !addressForm.postalCode) {
      setError('Fill all fields');
      return;
    }

    setAddingAddress(true);
    try {
      const res = await fetch(`/api/ecommerce/addresses`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(addressForm)
      });

      if (res.ok) {
        const data = await res.json();
        setAddresses([...addresses, data.data || data]);
        setSelectedAddress((data.data || data).id);
        setShowAddressForm(false);
        setAddressForm({ fullName: '', phone: '', line1: '', line2: '', city: '', state: '', postalCode: '', country: 'India' });
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setAddingAddress(false);
    }
  }

  if (cartItems.length === 0) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <ShoppingBag size={48} className="mx-auto mb-4 opacity-30" />
          <h1 className="text-2xl font-black mb-4">Cart is empty</h1>
          <Link href="/products" className="inline-block px-6 py-3 bg-primary text-white font-bold rounded-lg hover:opacity-90">
            Continue Shopping
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-black mb-8">Checkout</h1>

        <div className="grid md:grid-cols-[2fr_1fr] gap-8">
          {/* Left: Address & Summary */}
          <div className="space-y-6">
            {/* Address Section */}
            <div className="border border-slate-200 rounded-xl p-6">
              <h2 className="text-xl font-black mb-4 flex items-center gap-2">
                <MapPin size={20} />
                Delivery Address
              </h2>

              {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm font-semibold">✕ {error}</div>}

              {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
              ) : addresses.length === 0 && !showAddressForm ? (
                <div className="text-center py-8">
                  <p className="text-slate-600 mb-4">No addresses saved</p>
                  <button
                    onClick={() => setShowAddressForm(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white font-bold rounded-lg"
                  >
                    <Plus size={18} />
                    Add Address
                  </button>
                </div>
              ) : showAddressForm ? (
                <div className="space-y-3">
                  <input type="text" placeholder="Full Name" value={addressForm.fullName} onChange={(e) => setAddressForm({...addressForm, fullName: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm" />
                  <input type="tel" placeholder="Phone" value={addressForm.phone} onChange={(e) => setAddressForm({...addressForm, phone: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm" />
                  <input type="text" placeholder="Street Address" value={addressForm.line1} onChange={(e) => setAddressForm({...addressForm, line1: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm" />
                  <input type="text" placeholder="Apartment (optional)" value={addressForm.line2} onChange={(e) => setAddressForm({...addressForm, line2: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm" />
                  <div className="grid grid-cols-3 gap-3">
                    <input type="text" placeholder="City" value={addressForm.city} onChange={(e) => setAddressForm({...addressForm, city: e.target.value})} className="px-4 py-2 border border-slate-300 rounded-lg text-sm" />
                    <input type="text" placeholder="State" value={addressForm.state} onChange={(e) => setAddressForm({...addressForm, state: e.target.value})} className="px-4 py-2 border border-slate-300 rounded-lg text-sm" />
                    <input type="text" placeholder="Pincode" value={addressForm.postalCode} onChange={(e) => setAddressForm({...addressForm, postalCode: e.target.value})} className="px-4 py-2 border border-slate-300 rounded-lg text-sm" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleAddAddress} disabled={addingAddress} className="flex-1 px-4 py-2 bg-primary text-white font-bold rounded-lg text-sm hover:opacity-90">
                      {addingAddress ? <Loader2 size={16} className="inline animate-spin" /> : 'Save'}
                    </button>
                    <button onClick={() => setShowAddressForm(false)} className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {addresses.map((addr) => (
                    <div key={addr.id} className={`border-2 rounded-lg p-4 cursor-pointer transition ${selectedAddress === addr.id ? 'border-primary bg-primary/5' : 'border-slate-200'}`} onClick={() => setSelectedAddress(addr.id)}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-sm">{addr.fullName}</p>
                          <p className="text-xs text-slate-600 mt-1">{addr.line1}, {addr.city} {addr.postalCode}</p>
                          <p className="text-xs text-slate-600">📞 {addr.phone}</p>
                        </div>
                        {selectedAddress === addr.id && <Check size={20} className="text-primary" />}
                      </div>
                    </div>
                  ))}
                  <button onClick={() => setShowAddressForm(true)} className="w-full px-4 py-2 border-2 border-dashed border-slate-300 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-100">
                    + Add Another
                  </button>
                </div>
              )}
            </div>

            {/* Coupon Section */}
            <div className="border border-slate-200 rounded-xl p-6">
              <h2 className="text-xl font-black mb-4 flex items-center gap-2">
                <Tag size={20} />
                Promo Code
              </h2>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Enter influencer/coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  disabled={couponValid}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm disabled:bg-slate-100"
                />
                <button
                  onClick={validateCoupon}
                  disabled={couponLoading || couponValid}
                  className="px-4 py-2 bg-slate-700 text-white font-bold rounded-lg text-sm hover:opacity-90 disabled:opacity-50"
                >
                  {couponLoading ? <Loader2 size={16} className="inline animate-spin" /> : 'Apply'}
                </button>
                {couponValid && (
                  <button onClick={() => { setAppliedCoupon(null); setCouponValid(false); setCouponCode(''); }} className="px-4 py-2 text-red-600 border border-red-300 rounded-lg text-sm hover:bg-red-50">
                    Remove
                  </button>
                )}
              </div>
              {couponMessage && (
                <div className={`text-sm font-semibold p-2 rounded ${couponValid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {couponMessage}
                </div>
              )}
              {appliedCoupon?.type === 'INFLUENCER' && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
                  💡 10% discount applied only to eligible products from {appliedCoupon.influencer.name}
                </div>
              )}
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="border border-slate-200 rounded-xl p-6 h-fit sticky top-8">
            <h2 className="text-lg font-black mb-4">Order Summary</h2>

            <div className="space-y-3 mb-6 pb-6 border-b border-slate-200">
              {cartItems.map((item) => (
                <div key={item.productId} className="flex justify-between text-sm">
                  <span className="text-slate-600">{item.productName} x {item.quantity}</span>
                  <span className="font-bold">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              {baseDiscount > 0 && (
                <div className="flex justify-between text-sm text-green-700 font-bold">
                  <span>Discount ({appliedCoupon?.discountPercent}%)</span>
                  <span>-₹{baseDiscount}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">GST (18%)</span>
                <span>₹{tax}</span>
              </div>
              <div className="flex justify-between text-lg font-black border-t border-slate-200 pt-3">
                <span>Total</span>
                <span className="text-primary">₹{total}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={processing || !selectedAddress}
              className="w-full px-6 py-3 bg-primary text-white font-black rounded-lg hover:opacity-90 disabled:opacity-50 text-sm"
            >
              {processing ? <Loader2 size={18} className="inline animate-spin mr-2" /> : ''}
              {processing ? 'Processing...' : 'Proceed to Payment'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
