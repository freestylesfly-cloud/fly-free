'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { MapPin, ShoppingBag, Plus, Loader2, Tag, Check, Truck, ShieldCheck, RotateCcw, Headphones, CreditCard, Mail, PackageCheck, Percent, X } from 'lucide-react';
import { useCartStore } from '../stores/cartStore';
import { useAuthStore } from '../stores/authStore';
import { trackEvent } from '../lib/analytics';

export default function CheckoutPage() {
  const router = useRouter();
  const cartItems = useCartStore((state) => state.items);
  const getTotal = useCartStore((state) => state.getTotal);
  const getSubtotal = useCartStore((state) => state.getSubtotal);
  const getShippingFee = useCartStore((state) => state.getShippingFee);
  const getAmountToFreeDelivery = useCartStore((state) => state.getAmountToFreeDelivery);
  const loadDeliverySettings = useCartStore((state) => state.loadDeliverySettings);
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
  const [firstOrderOffer, setFirstOrderOffer] = useState<any>(null);
  const [showOfferDialog, setShowOfferDialog] = useState(false);
  const [pricePulse, setPricePulse] = useState(false);

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

  const selectedAddressData = addresses.find((addr) => addr.id === selectedAddress);

  function formatMoney(value: number) {
    return value.toLocaleString('en-IN');
  }

  function formatDeliveryDate(date: Date) {
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  }

  function getDeliveryWindow(address?: any) {
    const state = String(address?.state || '').trim().toLowerCase();
    const postalCode = String(address?.postalCode || address?.pincode || '').trim();
    const firstPinDigit = postalCode.charAt(0);
    const northeastStates = ['assam', 'arunachal pradesh', 'manipur', 'meghalaya', 'mizoram', 'nagaland', 'sikkim', 'tripura'];
    const isNortheast = northeastStates.includes(state) || ['7', '8'].includes(firstPinDigit);
    const minDays = isNortheast ? 3 : 4;
    const maxDays = isNortheast ? 6 : 8;
    const start = new Date();
    const end = new Date();
    start.setDate(start.getDate() + minDays);
    end.setDate(end.getDate() + maxDays);
    return `${formatDeliveryDate(start)}-${formatDeliveryDate(end)}`;
  }

  const deliveryEstimate = selectedAddressData
    ? `Deliver by ${getDeliveryWindow(selectedAddressData)}`
    : 'Select an address for delivery estimate';

  useEffect(() => {
    if (!user || !token) {
      window.location.href = '/auth/login?next=/checkout';
      return;
    }
    loadAddresses();
    void loadDeliverySettings();
    void loadFirstOrderOffer();
  }, [user, token]);

  async function loadFirstOrderOffer() {
    try {
      const res = await fetch(`/api/ecommerce/first-order-offer`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data?.eligible && data?.code) {
        setFirstOrderOffer(data);
        setCouponCode(String(data.code).toUpperCase());
        const dialogKey = `flyfree_offer_dialog_${data.code}`;
        if (typeof window !== 'undefined' && window.sessionStorage.getItem(dialogKey) !== 'seen') {
          setShowOfferDialog(true);
          window.sessionStorage.setItem(dialogKey, 'seen');
        }
      }
    } catch {
      // Optional marketing offer; checkout still works without it.
    }
  }

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
  async function validateCoupon(nextCode?: string) {
    const codeToApply = String(nextCode || couponCode).trim().toUpperCase();
    if (!codeToApply) {
      setCouponMessage('Enter a coupon code');
      return;
    }

    setCouponLoading(true);
    setCouponCode(codeToApply);
    setCouponMessage('');
    setCouponValid(false);
    setAppliedCoupon(null);

    try {
      const cartProductIds = cartItems.map(item => item.productId);
      const res = await fetch(`/api/ecommerce/coupons/${codeToApply}?productIds=${cartProductIds.join(',')}`, {
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
  const shipping = getShippingFee();
  const toFreeDelivery = getAmountToFreeDelivery();
  const total = getTotal() - baseDiscount;
  const couponFeedbackText = couponValid && appliedCoupon
    ? appliedCoupon.type === 'INFLUENCER'
      ? `${appliedCoupon.influencer?.name || 'Influencer'} code applied. Discount added to eligible products.`
      : `Coupon applied. ${appliedCoupon.discountPercent}% off.`
    : couponMessage
      ? couponMessage.replace(/^â\S+\s*/, '').trim()
      : '';

  useEffect(() => {
    if (!couponValid || !appliedCoupon) return;
    setPricePulse(true);
    toast.success('Coupon applied', {
      description: appliedCoupon.type === 'INFLUENCER'
        ? 'Influencer discount added to eligible products.'
        : `${appliedCoupon.discountPercent}% off. Total updated.`,
    });
    const timer = window.setTimeout(() => setPricePulse(false), 1200);
    return () => window.clearTimeout(timer);
  }, [couponValid, appliedCoupon?.code]);

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
      const pincode = String(address.postalCode || address.pincode || '');
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

      const checkoutAnalytics = {
        state: address.state,
        pincodePrefix: pincode.slice(0, 3),
        metadata: {
          itemCount: cartItems.length,
          quantity: cartItems.reduce((sum, item) => sum + item.quantity, 0),
          subtotal,
          total,
          couponCode: appliedCoupon?.code || undefined,
          productIds: cartItems.map((item) => item.productId).join(',')
        }
      };
      trackEvent('checkout_started', checkoutAnalytics);

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
      const checkout = order.data || order;

      if (typeof window === 'undefined' || !(window as any).Razorpay) {
        throw new Error('Payment library failed to load. Please refresh and try again.');
      }

      // Prefer the key the API used to create this order; a mismatch between
      // the two is what produces "Authentication key was missing".
      const razorpayKey = checkout.razorpayKeyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      if (!razorpayKey || !checkout.razorpayOrderId) {
        throw new Error('Payments are not configured. Please contact support.');
      }

      const razorpay = new (window as any).Razorpay({
        key: razorpayKey,
        // The API priced this; sending our own number risks a mismatch.
        amount: Math.round(checkout.amount * 100),
        currency: 'INR',
        name: 'Fly Free',
        description: `${cartItems.length} item(s)`,
        order_id: checkout.razorpayOrderId,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || ''
        },
        // The order is created here, by the API, only once payment lands. The
        // quote token carries the price we were just charged, signed by the
        // server, so the order is billed at exactly that.
        handler: async (response: any) => {
          await verifyPayment(response, checkout.quoteToken);
        },
        modal: {
          ondismiss: () => {
            releaseCheckoutUi();
            setError('Payment cancelled. Nothing was charged and no order was placed — press Place Order to try again.');
          }
        }
      });

      razorpay.on('payment.failed', (event: any) => {
        releaseCheckoutUi();
        setError(
          `${event?.error?.description || 'Payment failed'}. Nothing was charged and no order was placed — press Place Order to try again.`
        );
      });

      trackEvent('payment_opened', checkoutAnalytics);
      razorpay.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
      releaseCheckoutUi();
    }
  }

  /**
   * Razorpay locks body scroll while its modal is open and occasionally leaves
   * the lock behind when it is dismissed, which makes the page feel frozen.
   */
  function releaseCheckoutUi() {
    setProcessing(false);
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.height = '';
      document.documentElement.style.overflow = '';
    }
  }

  /**
   * The API creates the order here, after checking the payment signature, the
   * quote signature, and what Razorpay actually collected.
   */
  async function verifyPayment(response: any, quoteToken: string) {
    try {
      const verifyRes = await fetch(`/api/commerce/checkout/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          quoteToken,
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature
        })
      });

      const body = await verifyRes.json().catch(() => null);

      if (verifyRes.ok) {
        const created = body?.data || body;
        trackEvent('payment_success', {
          orderId: created?.id,
          metadata: {
            total: created?.total,
            orderNumber: created?.orderNumber
          }
        });
        clearCart();
        window.location.href = `/order-success?orderId=${created?.id ?? ''}`;
        return;
      }

      releaseCheckoutUi();
      setError(
        body?.message ||
          body?.error ||
          'We could not confirm your payment. If money was deducted it will be refunded automatically.'
      );
    } catch (err) {
      releaseCheckoutUi();
      setError('We could not confirm your payment. If money was deducted it will be refunded automatically.');
      console.error('Payment verification error:', err);
    }
  }

  async function handleAddAddress() {
    if (!addressForm.fullName || !addressForm.phone || !addressForm.line1 || !addressForm.city || !addressForm.state || !addressForm.postalCode) {
      setError('Fill all fields');
      return;
    }

    setAddingAddress(true);
    setError('');
    try {
      const res = await fetch(`/api/ecommerce/addresses`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(addressForm)
      });

      if (res.status === 401 || res.status === 403) {
        throw new Error('Your session expired. Please login again.');
      }

      // Never fail silently here: the customer is mid-checkout and needs to
      // know the address was not stored.
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || body?.error || 'Could not save the address. Please try again.');
      }

      const data = await res.json();
      const saved = data.data || data;
      setAddresses([...addresses, saved]);
      setSelectedAddress(saved.id);
      setShowAddressForm(false);
      setAddressForm({ fullName: '', phone: '', line1: '', line2: '', city: '', state: '', postalCode: '', country: 'India' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the address. Please try again.');
    } finally {
      setAddingAddress(false);
    }
  }

  if (cartItems.length === 0) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 pb-28 md:pb-0" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-center">
          <ShoppingBag size={48} className="mx-auto mb-4" style={{ color: 'var(--text-tertiary)' }} />
          <h1 className="text-2xl font-black mb-4" style={{ color: 'var(--text-primary)' }}>Cart is empty</h1>
          <Link href="/products" className="inline-block px-6 py-3 text-white font-bold rounded-lg hover:opacity-90 transition" style={{ backgroundColor: 'var(--color-primary)' }}>
            Continue Shopping
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen py-8 px-4 pb-28 md:pb-0" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-black mb-4" style={{ color: 'var(--text-primary)' }}>Checkout</h1>
          <div className="flex items-center gap-2 text-xs font-black uppercase" style={{ color: 'var(--text-secondary)' }}>
            <span className="rounded-full px-3 py-1" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', borderWidth: '1px' }}>Cart</span>
            <span>--</span>
            <span className="rounded-full px-3 py-1" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', borderWidth: '1px' }}>Address</span>
            <span>--</span>
            <span className="rounded-full px-3 py-1 text-white" style={{ backgroundColor: 'var(--color-primary)' }}>Payment</span>
          </div>
        </div>

        <div className="grid md:grid-cols-[2fr_1fr] gap-8">
          {/* Left: Address & Summary */}
          <div className="space-y-6">
            {/* Address Section */}
            <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', borderWidth: '1px' }}>
              <h2 className="text-xl font-black mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <MapPin size={20} />
                Delivery Address
              </h2>

              {error && <div className="mb-4 rounded-lg bg-red-100 p-3 text-sm font-semibold text-red-700">✕ {error}</div>}

              {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
              ) : addresses.length === 0 && !showAddressForm ? (
                <div className="text-center py-8">
                  <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>No addresses saved</p>
                  <button
                    onClick={() => setShowAddressForm(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-white font-bold rounded-lg hover:opacity-90 transition"
                    style={{ backgroundColor: 'var(--color-primary)' }}
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
                    <button onClick={handleAddAddress} disabled={addingAddress} className="flex-1 px-4 py-3 text-white font-bold rounded-lg text-sm hover:opacity-90 disabled:opacity-60 transition" style={{ backgroundColor: 'var(--color-primary)' }}>
                      {addingAddress ? <Loader2 size={16} className="inline animate-spin" /> : 'Save'}
                    </button>
                    <button onClick={() => setShowAddressForm(false)} className="flex-1 px-4 py-3 font-bold rounded-lg text-sm hover:opacity-80 transition" style={{ borderColor: 'var(--border-color)', borderWidth: '1px', color: 'var(--text-primary)' }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {addresses.map((addr) => (
                    <div key={addr.id} className={`border-2 rounded-lg p-4 cursor-pointer transition ${selectedAddress === addr.id ? 'border-primary bg-primary/5' : 'border-slate-200'}`} onClick={() => setSelectedAddress(addr.id)}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{addr.fullName}</p>
                          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{addr.line1}, {addr.city} {addr.postalCode}</p>
                          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{addr.phone}</p>
                        </div>
                        {selectedAddress === addr.id && <Check size={20} className="text-primary" />}
                      </div>
                    </div>
                  ))}
                  <button onClick={() => setShowAddressForm(true)} className="w-full px-4 py-2 border-2 border-dashed rounded-lg text-sm font-bold hover:opacity-80" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)', backgroundColor: 'transparent' }}>
                    + Add Another
                  </button>
                </div>
              )}
            </div>

            <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', borderWidth: '1px' }}>
              <h2 className="text-xl font-black mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Truck size={20} />
                Delivery & Updates
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border p-4" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
                  <p className="text-xs font-black uppercase" style={{ color: 'var(--text-secondary)' }}>Estimated arrival</p>
                  <p className="mt-1 text-base font-black" style={{ color: 'var(--text-primary)' }}>{deliveryEstimate}</p>
                  <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>Final tracking is shared after dispatch.</p>
                </div>
                <div className="rounded-lg border p-4" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
                  <p className="text-xs font-black uppercase" style={{ color: 'var(--text-secondary)' }}>Email updates</p>
                  <p className="mt-1 text-base font-black break-all" style={{ color: 'var(--text-primary)' }}>{user?.email || 'Your account email'}</p>
                  <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>Confirmation, shipping, and delivery updates are sent automatically.</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', borderWidth: '1px' }}>
              <h2 className="text-xl font-black mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <CreditCard size={20} />
                Payment Method
              </h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3 rounded-lg border-2 p-4" style={{ borderColor: 'var(--color-primary)', backgroundColor: 'rgba(255, 107, 91, 0.08)' }}>
                  <CreditCard size={20} className="mt-0.5 shrink-0" style={{ color: 'var(--color-primary)' }} />
                  <div>
                    <p className="font-black" style={{ color: 'var(--text-primary)' }}>Pay online securely</p>
                    <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>UPI, cards, net banking, and wallets through Razorpay.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Coupon Section */}
            <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', borderWidth: '1px' }}>
              <h2 className="text-xl font-black mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Tag size={20} />
                Have a coupon?
              </h2>
              {firstOrderOffer?.eligible && !couponValid && (
                <div className="mb-3 rounded-lg border p-3" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>{firstOrderOffer.title || 'First order offer'}</p>
                      <p className="mt-1 text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>First purchase only. Code {firstOrderOffer.code} is checked again before payment.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => validateCoupon(firstOrderOffer.code)}
                      disabled={couponLoading}
                      className="rounded px-4 py-2 text-xs font-black text-white transition hover:opacity-90 disabled:opacity-60"
                      style={{ backgroundColor: 'var(--color-primary)' }}
                    >
                      Apply offer
                    </button>
                  </div>
                </div>
              )}
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  disabled={couponValid}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm disabled:bg-slate-100"
                />
                <button
                  onClick={() => validateCoupon()}
                  disabled={couponLoading || couponValid}
                  className="px-4 py-2 text-white font-bold rounded-lg text-sm hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  {couponLoading ? <Loader2 size={16} className="inline animate-spin" /> : 'Apply'}
                </button>
                {couponValid && (
                  <button onClick={() => { setAppliedCoupon(null); setCouponValid(false); setCouponCode(''); setCouponMessage('Coupon removed.'); toast('Coupon removed', { description: 'Your total has been updated.' }); }} className="px-4 py-2 border rounded-lg text-sm hover:opacity-80 transition" style={{ borderColor: '#dc2626', color: '#dc2626' }}>
                    Remove
                  </button>
                )}
              </div>
              {couponFeedbackText && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-center gap-2 rounded-lg p-3 text-sm font-bold ${couponValid ? 'bg-green-50 text-green-700 ring-1 ring-green-200' : 'bg-yellow-50 text-yellow-800 ring-1 ring-yellow-200'}`}
                >
                  {couponValid ? <Check size={16} /> : <Tag size={16} />}
                  {couponFeedbackText}
                </motion.div>
              )}
              {appliedCoupon?.type === 'INFLUENCER' && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
                  Influencer discount applied only to eligible products from {appliedCoupon.influencer.name}.
                </div>
              )}
              {!couponFeedbackText && (
                <p className="mt-2 text-xs" style={{ color: 'var(--text-secondary)' }}>Have an influencer or first-order code? Enter it here.</p>
              )}
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="rounded-xl p-6 h-fit sticky top-8" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', borderWidth: '1px' }}>
            <h2 className="text-lg font-black mb-4" style={{ color: 'var(--text-primary)' }}>Order Summary</h2>

            <div className="space-y-4 mb-6 pb-6" style={{ borderBottomColor: 'var(--border-color)', borderBottomWidth: '1px' }}>
              {cartItems.map((item) => (
                <div key={`${item.productId}-${item.variantId || item.size}-${item.color}`} className="flex gap-3 text-sm">
                  <div className="h-20 w-16 shrink-0 overflow-hidden rounded-lg border" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
                    {item.image ? (
                      <img src={item.image} alt={item.productName} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <ShoppingBag size={22} style={{ color: 'var(--text-tertiary)' }} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-black leading-snug" style={{ color: 'var(--text-primary)' }}>{item.productName}</p>
                    <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                      Size: {item.size || 'Selected'} {item.color ? `| Color: ${item.color}` : ''} | Qty: {item.quantity}
                    </p>
                    {item.offerLabel && <p className="mt-1 text-xs font-bold" style={{ color: 'var(--color-secondary)' }}>{item.offerLabel}</p>}
                  </div>
                  <span className="shrink-0 font-bold" style={{ color: 'var(--text-primary)' }}>&#8377;{formatMoney(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
                <span style={{ color: 'var(--text-primary)' }}>&#8377;{formatMoney(subtotal)}</span>
              </div>
              <AnimatePresence>
                {baseDiscount > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -8 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -8 }}
                    className="flex justify-between rounded-lg px-3 py-2 text-sm font-black"
                    style={{ color: '#15803d', backgroundColor: '#f0fdf4' }}
                  >
                    <span>Discount ({appliedCoupon?.discountPercent}%)</span>
                    <span>-&#8377;{formatMoney(baseDiscount)}</span>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-secondary)' }}>Delivery</span>
                <span style={{ color: shipping === 0 ? 'var(--color-secondary)' : 'var(--text-primary)' }}>
                  {shipping === 0 ? 'FREE' : <>&#8377;{formatMoney(shipping)}</>}
                </span>
              </div>
              {toFreeDelivery > 0 && (
                <p className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                  Add &#8377;{formatMoney(toFreeDelivery)} more to get free delivery.
                </p>
              )}
              <div className={`flex justify-between rounded-lg pt-3 text-lg font-black transition duration-500 ${pricePulse ? 'px-3 pb-3 ring-2 ring-green-200' : ''}`} style={{ borderTopColor: 'var(--border-color)', borderTopWidth: '1px', backgroundColor: pricePulse ? '#f0fdf4' : 'transparent' }}>
                <span style={{ color: 'var(--text-primary)' }}>Total</span>
                <span style={{ color: 'var(--color-primary)' }}>&#8377;{formatMoney(total)}</span>
              </div>
            </div>

            <div className="mb-5 grid grid-cols-2 gap-2 text-xs font-bold sm:grid-cols-4" style={{ color: 'var(--text-secondary)' }}>
              <div className="flex items-center gap-1"><ShieldCheck size={15} style={{ color: 'var(--color-secondary)' }} /> Secure</div>
              <div className="flex items-center gap-1"><Truck size={15} style={{ color: 'var(--color-secondary)' }} /> Free delivery</div>
              <div className="flex items-center gap-1"><RotateCcw size={15} style={{ color: 'var(--color-secondary)' }} /> 7-day exchange</div>
              <div className="flex items-center gap-1"><PackageCheck size={15} style={{ color: 'var(--color-secondary)' }} /> Quality checked</div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={processing || !selectedAddress}
              className="w-full px-6 py-4 text-white font-black rounded-lg text-base hover:opacity-90 disabled:opacity-50 transition"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              {processing ? <Loader2 size={18} className="inline animate-spin mr-2" /> : ''}
              {processing ? 'Processing...' : 'Proceed to Payment'}
            </button>

            {processing && (
              <p className="mt-3 text-center text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                Opening Razorpay. Please do not close this screen.
              </p>
            )}

            <div className="mt-4 space-y-2 text-center text-sm">
              <Link href="/contact" className="inline-flex items-center justify-center gap-2 font-bold hover:opacity-80" style={{ color: 'var(--color-primary)' }}>
                <Headphones size={16} />
                Need help? Contact us
              </Link>
              <p className="flex items-center justify-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                <Mail size={14} />
                Order updates will be sent by email.
              </p>
            </div>
          </div>
        </div>
      </div>

      {showOfferDialog && firstOrderOffer?.eligible && !couponValid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-2xl" style={{ color: 'var(--text-primary)' }}>
            <button
              type="button"
              onClick={() => setShowOfferDialog(false)}
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border transition hover:bg-black/5"
              style={{ borderColor: 'var(--border-color)' }}
              aria-label="Close offer"
            >
              <X size={18} />
            </button>
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full text-white shadow-lg" style={{ backgroundColor: 'var(--color-primary)' }}>
              <Percent size={38} />
            </div>
            <h2 className="mt-5 text-2xl font-black">{firstOrderOffer.title || 'Special Offer Unlocked'}</h2>
            <p className="mx-auto mt-3 max-w-sm text-base leading-7" style={{ color: 'var(--text-secondary)' }}>
              Apply code <span className="font-black" style={{ color: 'var(--text-primary)' }}>{firstOrderOffer.code}</span> on this first order before payment.
            </p>
            <div className="mt-6 grid grid-cols-[1fr_1.4fr] gap-3">
              <button
                type="button"
                onClick={() => setShowOfferDialog(false)}
                className="rounded border px-4 py-3 text-sm font-black"
                style={{ borderColor: 'var(--border-color)' }}
              >
                Later
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowOfferDialog(false);
                  void validateCoupon(firstOrderOffer.code);
                }}
                className="rounded px-4 py-3 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                Apply offer
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
