'use client';

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { use } from 'react';
import { ArrowLeft, Download, Mail, Send } from 'lucide-react';
import { DashboardLayout } from '../../components/DashboardLayout';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { useFetch } from '../../hooks/useFetch';
import { apiService } from '../../services/api';

export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: order, loading, error, refetch } = useFetch<any>(() => apiService.getOrder(id), { skip: false });

  async function updateStatus(status: string) {
    await apiService.updateOrderStatus(id, status);
    refetch();
  }

  async function sendInvoice() {
    await apiService.sendInvoice(id);
    refetch();
  }

  return (
    <ProtectedRoute>
      <DashboardLayout title="Order Details" subtitle={id}>
        <div className="space-y-5">
          <Link href="/orders" className="inline-flex items-center gap-2 text-sm font-bold text-black/60 hover:text-ink">
            <ArrowLeft size={16} /> Back to orders
          </Link>

          {error && <div className="rounded border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}
          {loading || !order ? (
            <div className="rounded border border-black/10 bg-white p-5">Loading order...</div>
          ) : (
            <>
              <div className="grid gap-4 lg:grid-cols-4">
                <Metric label="Status" value={order.status} />
                <Metric label="Payment" value={order.payment?.status || 'PENDING'} />
                <Metric label="Total" value={`Rs ${Number(order.total || 0).toLocaleString('en-IN')}`} />
              <Metric label="Invoice" value={order.invoice?.invoiceNumber || 'Not generated'} />
              </div>

              <section className="rounded border border-black/10 bg-white p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-black">Order {order.id}</h2>
                    <p className="text-sm text-black/60">{new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <select value={order.status} onChange={(event) => updateStatus(event.target.value)} className="rounded border border-black/10 px-3 py-2 font-bold">
                      {['PLACED', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'].map((status) => <option key={status}>{status}</option>)}
                    </select>
                    <a href={apiService.generateInvoice(order.id)} target="_blank" className="inline-flex items-center gap-2 rounded bg-ink px-4 py-2 font-bold text-white">
                      <Download size={16} /> Download invoice
                    </a>
                    <button onClick={sendInvoice} className="inline-flex items-center gap-2 rounded bg-coral px-4 py-2 font-bold text-white">
                      <Mail size={16} /> Send invoice
                    </button>
                    <button onClick={() => apiService.sendReviewRequest(order.id)} className="inline-flex items-center gap-2 rounded border border-black/10 px-4 py-2 font-bold">
                      <Send size={16} /> Review link
                    </button>
                  </div>
                </div>
              </section>

              <div className="grid gap-5 lg:grid-cols-2">
                <section className="rounded border border-black/10 bg-white p-5">
                  <h2 className="mb-3 font-black">Customer</h2>
                  <p className="font-bold">{order.user?.name || 'No name'}</p>
                  <p className="text-black/60">{order.user?.email}</p>
                  <p className="text-black/60">{order.user?.phone}</p>
                  {order.user?.id && <Link href={`/users/${order.user.id}`} className="mt-3 inline-block font-bold text-coral">Open user profile</Link>}
                </section>
                <section className="rounded border border-black/10 bg-white p-5">
                  <h2 className="mb-3 font-black">Shipping address</h2>
                  <p>{order.shippingAddress?.fullName}</p>
                  <p className="text-black/60">{order.shippingAddress?.line1}</p>
                  <p className="text-black/60">{order.shippingAddress?.line2}</p>
                  <p className="text-black/60">{order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.postalCode}</p>
                </section>
              </div>

              {order.referrals?.length > 0 && (
                <section className="rounded border border-black/10 bg-white p-5">
                  <h2 className="mb-3 font-black">Influencer attribution</h2>
                  {order.referrals.map((referral: any) => (
                    <div key={referral.id} className="rounded bg-black/5 p-3">
                      <p className="font-bold">{referral.influencer?.name} - {referral.code}</p>
                      <p className="text-sm text-black/60">{referral.buyerDiscountPercent}% buyer discount, Rs {Number(referral.commissionAmount).toLocaleString('en-IN')} commission</p>
                    </div>
                  ))}
                </section>
              )}

              <section className="rounded border border-black/10 bg-white">
                <div className="border-b border-black/10 p-4 font-black">Items</div>
                {order.items?.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between border-b border-black/10 p-4 last:border-b-0">
                    <div>
                      <p className="font-bold">{item.name}</p>
                      <p className="text-sm text-black/60">{item.sku} | Qty {item.quantity}</p>
                    </div>
                    <p className="font-black">Rs {Number(item.price * item.quantity).toLocaleString('en-IN')}</p>
                  </div>
                ))}
                <div className="space-y-2 p-4 text-sm">
                  <Row label="Subtotal" value={order.subtotal} />
                  <Row label="Discount" value={order.discount} />
                  <Row label="Shipping" value={order.shippingFee} />
                  <Row label="Tax" value={order.tax} />
                  <Row label="Total" value={order.total} strong />
                </div>
              </section>
            </>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-black/10 bg-white p-4">
      <p className="text-sm text-black/60">{label}</p>
      <p className="mt-1 font-black text-ink">{value}</p>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? 'border-t border-black/10 pt-2 text-lg font-black' : ''}`}>
      <span>{label}</span>
      <span>Rs {Number(value || 0).toLocaleString('en-IN')}</span>
    </div>
  );
}
