'use client';

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, ChevronDown, CreditCard, Loader2, RefreshCw, Search, XCircle } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { apiService } from '../services/api';

type PaymentSession = {
  id: string;
  status: string;
  amount: number;
  razorpayOrderId: string;
  paymentId?: string | null;
  lastError?: string | null;
  paidAt?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; name?: string | null; email?: string | null; phone?: string | null };
  quote?: {
    items?: Array<{ productId: string; variantId: string; name: string; sku: string; price: number; quantity: number }>;
    address?: { name: string; phone: string; city: string; state: string; postalCode: string };
    subtotal?: number;
    discount?: number;
    shippingFee?: number;
    total?: number;
  };
};

const STATUS_FILTERS = ['ALL', 'OPEN', 'CAPTURED', 'COMPLETED', 'VERIFICATION_FAILED', 'RECOVERY_FAILED'];

function formatMoney(value: number) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

function statusClass(status: string) {
  if (status === 'COMPLETED') return 'bg-green-50 text-green-700 border-green-200';
  if (status === 'CAPTURED') return 'bg-blue-50 text-blue-700 border-blue-200';
  if (status.includes('FAILED')) return 'bg-red-50 text-red-700 border-red-200';
  return 'bg-amber-50 text-amber-700 border-amber-200';
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'COMPLETED') return <CheckCircle2 className="text-green-600" size={19} />;
  if (status.includes('FAILED')) return <XCircle className="text-red-600" size={19} />;
  if (status === 'CAPTURED') return <CreditCard className="text-blue-600" size={19} />;
  return <AlertTriangle className="text-amber-600" size={19} />;
}

export default function PaymentReconciliationPage() {
  const [sessions, setSessions] = useState<PaymentSession[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [recovering, setRecovering] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      const result = await apiService.getPaymentReconciliation({ search, status });
      setSessions(result || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load payment sessions');
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 250);
    return () => clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    const timer = setInterval(() => void load(), 15000);
    return () => clearInterval(timer);
  }, [load]);

  async function recover(session: PaymentSession) {
    if (!session.paymentId || recovering) return;
    setRecovering(session.razorpayOrderId);
    setError('');
    setNotice('');
    try {
      await apiService.recoverPayment(session.razorpayOrderId);
      setNotice(`Payment ${session.paymentId} recovered successfully.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment recovery failed');
      await load();
    } finally {
      setRecovering(null);
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout title="Payment Recovery" subtitle="Find captured Razorpay payments and confirm their orders">
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <Summary label="Showing" value={sessions.length} />
            <Summary label="Needs attention" value={sessions.filter((item) => item.status.includes('FAILED') || item.status === 'CAPTURED').length} tone="warn" />
            <Summary label="Completed" value={sessions.filter((item) => item.status === 'COMPLETED').length} tone="good" />
          </div>

          {error && <div className="rounded border border-red-200 bg-red-50 p-4 font-bold text-red-700">{error}</div>}
          {notice && <div className="rounded border border-green-200 bg-green-50 p-4 font-bold text-green-700">{notice}</div>}

          <div className="flex flex-col gap-3 rounded border border-black/10 bg-white p-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 text-black/35" size={19} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search payment ID, Razorpay order ID, or customer email"
                className="w-full rounded border border-black/10 py-2 pl-10 pr-3"
              />
            </div>
            <div className="flex flex-wrap gap-1">
              {STATUS_FILTERS.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatus(filter)}
                  className={`rounded px-3 py-2 text-xs font-black ${status === filter ? 'bg-ink text-white' : 'border border-black/10 text-black/60 hover:bg-black/5'}`}
                >
                  {filter.replaceAll('_', ' ')}
                </button>
              ))}
            </div>
            <button onClick={() => void load()} className="inline-flex items-center justify-center gap-2 rounded border border-black/10 px-4 py-2 text-sm font-bold">
              <RefreshCw size={15} /> Refresh
            </button>
          </div>

          <div className="overflow-hidden rounded border border-black/10 bg-white">
            <div className="flex items-center justify-between border-b border-black/10 p-4">
              <div>
                <h2 className="font-black">Checkout sessions</h2>
                <p className="text-sm text-black/50">Captured payments remain visible until their order is completed.</p>
              </div>
              {loading && <Loader2 className="animate-spin text-black/40" size={18} />}
            </div>

            {sessions.length === 0 && !loading ? (
              <p className="p-10 text-center font-bold text-black/50">No payment sessions match this filter.</p>
            ) : (
              <div className="divide-y divide-black/5">
                {sessions.map((session) => {
                  const items = session.quote?.items || [];
                  const canRecover = Boolean(session.paymentId) && ['CAPTURED', 'RECOVERY_FAILED', 'VERIFICATION_FAILED'].includes(session.status);
                  return (
                    <div key={session.id}>
                      <button onClick={() => setExpanded(expanded === session.id ? null : session.id)} className="flex w-full items-center gap-3 p-4 text-left hover:bg-black/[0.02]">
                        <StatusIcon status={session.status} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`rounded border px-2 py-0.5 text-[11px] font-black ${statusClass(session.status)}`}>{session.status.replaceAll('_', ' ')}</span>
                            <span className="font-black">{formatMoney(session.amount)}</span>
                            <span className="text-sm text-black/50">{items.length} item{items.length === 1 ? '' : 's'}</span>
                          </div>
                          <p className="mt-1 truncate font-mono text-xs text-black/55">{session.paymentId || 'No payment ID'} · {session.razorpayOrderId}</p>
                        </div>
                        <div className="hidden text-right text-xs text-black/45 md:block">
                          <p>{session.user?.email || 'Unknown customer'}</p>
                          <p>{new Date(session.updatedAt).toLocaleString()}</p>
                        </div>
                        <ChevronDown className={`shrink-0 transition-transform ${expanded === session.id ? 'rotate-180' : ''}`} size={18} />
                      </button>

                      {expanded === session.id && (
                        <div className="border-t border-black/5 bg-black/[0.02] p-4">
                          <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
                            <div className="space-y-4 text-sm">
                              <div className="grid gap-2 sm:grid-cols-2">
                                <Detail label="Customer" value={session.user?.name || '—'} />
                                <Detail label="Email" value={session.user?.email || '—'} />
                                <Detail label="Razorpay order" value={session.razorpayOrderId} mono />
                                <Detail label="Payment ID" value={session.paymentId || '—'} mono />
                                <Detail label="Paid at" value={session.paidAt ? new Date(session.paidAt).toLocaleString() : '—'} />
                                <Detail label="Last error" value={session.lastError || '—'} />
                              </div>
                              <div>
                                <h3 className="mb-2 font-black">Purchased items</h3>
                                <div className="overflow-x-auto rounded border border-black/10 bg-white">
                                  <table className="w-full min-w-[560px] text-left text-sm">
                                    <thead className="border-b border-black/10 text-xs uppercase text-black/45"><tr><th className="p-3">Product</th><th className="p-3">SKU / size</th><th className="p-3">Qty</th><th className="p-3">Price</th></tr></thead>
                                    <tbody>{items.map((item) => <tr key={`${item.variantId}-${item.sku}`} className="border-b border-black/5 last:border-0"><td className="p-3 font-bold">{item.name}<span className="block text-xs font-normal text-black/45">{item.productId}</span></td><td className="p-3 font-mono text-xs">{item.sku}<span className="block font-sans text-black/50">variant {item.variantId}</span></td><td className="p-3">{item.quantity}</td><td className="p-3">{formatMoney(item.price)}</td></tr>)}</tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-start lg:justify-end">
                              {canRecover && <button onClick={() => void recover(session)} disabled={recovering === session.razorpayOrderId} className="inline-flex items-center gap-2 rounded bg-ink px-4 py-2 text-sm font-black text-white disabled:opacity-50">{recovering === session.razorpayOrderId && <Loader2 className="animate-spin" size={15} />} Recover order</button>}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function Summary({ label, value, tone = 'normal' }: { label: string; value: number; tone?: 'normal' | 'warn' | 'good' }) {
  return <div className={`rounded border p-4 ${tone === 'warn' ? 'border-amber-200 bg-amber-50' : tone === 'good' ? 'border-green-200 bg-green-50' : 'border-black/10 bg-white'}`}><p className="text-sm font-bold text-black/50">{label}</p><p className="mt-1 text-2xl font-black">{value}</p></div>;
}

function Detail({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return <div><p className="text-xs font-black uppercase text-black/40">{label}</p><p className={`mt-1 break-all font-bold ${mono ? 'font-mono text-xs' : ''}`}>{value}</p></div>;
}
