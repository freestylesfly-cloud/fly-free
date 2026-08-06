'use client';

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { use, useState } from 'react';
import { ArrowLeft, Download, Mail, MessageSquare, ReceiptText, Send } from 'lucide-react';
import { DashboardLayout } from '../../components/DashboardLayout';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { useFetch } from '../../hooks/useFetch';
import { saveBlob } from '../../lib/download';
import { apiService } from '../../services/api';

export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: order, loading, error, refetch } = useFetch<any>(() => apiService.getOrder(id), { skip: false });
  const [statusNote, setStatusNote] = useState('');
  const [message, setMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [busyAction, setBusyAction] = useState('');

  /** Every action reports its own failure — these used to reject silently. */
  async function run(action: string, work: () => Promise<string>) {
    setBusyAction(action);
    setMessage('');
    setActionError('');
    try {
      setMessage(await work());
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusyAction('');
    }
  }

  function updateStatus(status: string) {
    return run('status', async () => {
      await apiService.updateOrderStatus(id, status, statusNote);
      setStatusNote('');
      refetch();
      return 'Order status updated and logged.';
    });
  }

  function sendInvoice() {
    return run('invoice', async () => {
      await apiService.sendInvoice(id);
      refetch();
      return 'Invoice email sent and saved on this order.';
    });
  }

  function downloadInvoice() {
    return run('download', async () => {
      const { blob, filename } = await apiService.downloadInvoice(id);
      saveBlob(blob, filename);
      return 'Invoice downloaded.';
    });
  }

  function sendReviewLink() {
    return run('review', async () => {
      await apiService.sendReviewRequest(order.id);
      refetch();
      return 'Review request link sent to the customer.';
    });
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
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <h2 className="text-lg font-black">Order {order.id}</h2>
                    <p className="text-sm text-black/60">{new Date(order.createdAt).toLocaleString()}</p>
                    {message && <p className="mt-2 rounded bg-mint/15 px-3 py-2 text-sm font-bold text-ink">{message}</p>}
                    {actionError && (
                      <p className="mt-2 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{actionError}</p>
                    )}
                  </div>
                  <div className="grid w-full gap-2 sm:w-auto sm:min-w-[520px] sm:grid-cols-[1fr_180px]">
                    <input
                      value={statusNote}
                      onChange={(event) => setStatusNote(event.target.value)}
                      placeholder="Status note for audit log"
                      className="rounded border border-black/10 px-3 py-2 text-sm"
                    />
                    <select
                      value={order.status}
                      disabled={busyAction === 'status'}
                      onChange={(event) => updateStatus(event.target.value)}
                      className="rounded border border-black/10 px-3 py-2 font-bold"
                    >
                      {['PLACED', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'].map((status) => <option key={status}>{status}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/invoices/${order.id}`} className="inline-flex items-center gap-2 rounded bg-black/5 px-4 py-2 font-bold text-ink hover:bg-black/10 border border-black/10">
                      <ReceiptText size={16} /> View invoice
                    </Link>
                    <button disabled={busyAction === 'download'} onClick={downloadInvoice} className="inline-flex items-center gap-2 rounded bg-ink px-4 py-2 font-bold text-white disabled:opacity-60">
                      <Download size={16} /> {busyAction === 'download' ? 'Preparing...' : 'Download invoice'}
                    </button>
                    <button disabled={busyAction === 'invoice'} onClick={sendInvoice} className="inline-flex items-center gap-2 rounded bg-coral px-4 py-2 font-bold text-white disabled:opacity-60">
                      <Mail size={16} /> Send invoice
                    </button>
                    <button disabled={busyAction === 'review'} onClick={sendReviewLink} className="inline-flex items-center gap-2 rounded border border-black/10 px-4 py-2 font-bold disabled:opacity-60">
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
                  <h2 className="mb-3 font-black">Delivery address</h2>
                  <ShippingAddress address={order.shippingAddress} />
                </section>
              </div>

              <div className="grid gap-5 xl:grid-cols-3">
                <section className="rounded border border-black/10 bg-white p-5">
                  <h2 className="mb-3 flex items-center gap-2 font-black"><ReceiptText size={18} /> Payment</h2>
                  <Info label="Provider" value={order.payment?.provider || 'RAZORPAY'} />
                  <Info label="Status" value={order.payment?.status || 'PENDING'} />
                  <Info label="Razorpay ID" value={order.payment?.providerPaymentId || 'Pending'} />
                  <Info label="Amount" value={`Rs ${Number(order.payment?.amount || order.total || 0).toLocaleString('en-IN')}`} />
                  <Info label="Paid at" value={order.payment?.paidAt ? new Date(order.payment.paidAt).toLocaleString() : 'Not paid yet'} />
                </section>

                <section className="rounded border border-black/10 bg-white p-5">
                  <h2 className="mb-3 flex items-center gap-2 font-black"><Download size={18} /> Invoice</h2>
                  <Info label="Number" value={order.invoice?.invoiceNumber || 'Generated on download'} />
                  <Info label="Status" value={order.invoice?.status || 'NOT_GENERATED'} />
                  <Info label="Sent at" value={order.invoice?.sentAt ? new Date(order.invoice.sentAt).toLocaleString() : 'Not sent'} />
                  <button
                    disabled={busyAction === 'download'}
                    onClick={downloadInvoice}
                    className="mt-3 inline-flex items-center gap-2 rounded bg-ink px-3 py-2 text-sm font-bold text-white disabled:opacity-60"
                  >
                    <Download size={15} /> {busyAction === 'download' ? 'Preparing...' : 'Download PDF'}
                  </button>
                </section>

                <section className="rounded border border-black/10 bg-white p-5">
                  <h2 className="mb-3 flex items-center gap-2 font-black"><MessageSquare size={18} /> Review workflow</h2>
                  <Info label="Request" value={order.reviewRequestSentAt ? `Sent ${new Date(order.reviewRequestSentAt).toLocaleString()}` : 'Not sent'} />
                  <Info label="Submission" value={order.reviewSubmittedAt ? `Submitted ${new Date(order.reviewSubmittedAt).toLocaleString()}` : order.reviews?.length ? 'Submitted' : 'Pending'} />
                  <Info label="Reviews" value={`${order.reviews?.length || 0}`} />
                </section>
              </div>

              {order.referrals?.length > 0 && (
                <section className="rounded border border-black/10 bg-white p-5">
                  <h2 className="mb-3 font-black">Influencer attribution</h2>
                  <div className="grid gap-3 md:grid-cols-2">
                    {order.referrals.map((referral: any) => (
                    <div key={referral.id} className="rounded bg-black/5 p-4">
                      <p className="font-bold">{referral.influencer?.name} - {referral.code}</p>
                      <p className="text-sm text-black/60">{referral.buyerDiscountPercent}% buyer discount, Rs {Number(referral.commissionAmount).toLocaleString('en-IN')} commission</p>
                      <p className="text-sm text-black/60">Link key: {referral.linkKey || referral.influencer?.linkKey || 'Not set'}</p>
                      {referral.influencer?.product && <Link href={`/products/${referral.influencer.product.id}`} className="text-sm font-bold text-coral">Assigned product: {referral.influencer.product.name}</Link>}
                    </div>
                    ))}
                  </div>
                </section>
              )}

              <section className="rounded border border-black/10 bg-white">
                <div className="border-b border-black/10 p-4 font-black">Items</div>
                {order.items?.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between border-b border-black/10 p-4 last:border-b-0">
                    <div>
                      <Link href={`/products/${item.productId}`} className="font-bold text-ink hover:text-coral">{item.name}</Link>
                      <p className="text-sm text-black/60">{item.sku} | Qty {item.quantity}</p>
                      {item.product?.slug && <p className="text-xs text-black/45">Store link: /products/{item.product.slug}</p>}
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

              <section className="rounded border border-black/10 bg-white p-5">
                <h2 className="mb-4 font-black">Status history</h2>
                {order.statusHistory?.length ? (
                  <div className="space-y-3">
                    {order.statusHistory.map((entry: any) => (
                      <div key={entry.id} className="grid gap-2 rounded bg-black/[0.03] p-3 sm:grid-cols-[170px_1fr]">
                        <p className="text-sm font-bold text-black/55">{new Date(entry.createdAt).toLocaleString()}</p>
                        <div>
                          <p className="font-bold">{entry.fromStatus || 'NEW'} to {entry.toStatus}</p>
                          {entry.note && <p className="text-sm text-black/60">{entry.note}</p>}
                          <p className="text-xs text-black/45">Changed by {entry.changedBy || 'admin'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-black/60">No status changes logged yet.</p>
                )}
              </section>
            </>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

/**
 * Where the parcel ships. This is a snapshot taken at checkout, not a live
 * lookup, so it still reads correctly after the customer edits or deletes the
 * address in their address book.
 */
function ShippingAddress({ address }: { address: any }) {
  if (!address) {
    return <p className="text-sm font-bold text-black/45">No delivery address on this order.</p>;
  }

  // Skip blank parts so the block never renders a stray comma.
  const region = [address.city, address.state].filter(Boolean).join(', ');
  const lines = [address.line1, address.line2, [region, address.postalCode].filter(Boolean).join(' '), address.country]
    .map((line) => String(line || '').trim())
    .filter(Boolean);

  return (
    <div className="space-y-0.5 text-sm">
      {address.fullName && <p className="font-bold text-ink">{address.fullName}</p>}
      {lines.map((line) => (
        <p key={line} className="text-black/60">{line}</p>
      ))}
      {address.phone && <p className="pt-1 font-bold text-ink">{address.phone}</p>}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-2">
      <p className="text-xs font-bold uppercase tracking-wide text-black/45">{label}</p>
      <p className="break-words text-sm font-bold text-ink">{value}</p>
    </div>
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
