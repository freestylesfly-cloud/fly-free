'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity, BarChart3, IndianRupee, MapPin, MonitorSmartphone, MousePointerClick, Package, RefreshCw, Route, ShoppingCart, Users } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { useFetch } from '../hooks/useFetch';
import { apiService } from '../services/api';

type Row = { label: string; value: number };

const dayOptions = [7, 30, 90];

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const { data, loading, error, refetch } = useFetch<any>(() => apiService.getEventAnalytics(days));
  const funnel = (data?.funnel || []) as Array<Row & { event: string }>;
  const maxFunnel = Math.max(...funnel.map((item) => item.value), 1);
  const sales = data?.sales || {};

  useEffect(() => {
    refetch();
  }, [days, refetch]);

  const healthNotes = useMemo(() => {
    const notes: string[] = [];
    if ((sales.addToCartRate || 0) < 8) notes.push('Product pages are not converting strongly to cart.');
    if ((sales.checkoutRate || 0) < 35 && (data?.eventCounts?.add_to_cart || 0) > 0) notes.push('Cart to checkout is weak; inspect delivery fee, trust copy, and login friction.');
    if ((sales.paymentRate || 0) < 60 && (data?.eventCounts?.checkout_started || 0) > 0) notes.push('Checkout to payment success needs attention.');
    if (!notes.length) notes.push('No major funnel warning yet.');
    return notes;
  }, [data?.eventCounts?.add_to_cart, data?.eventCounts?.checkout_started, sales.addToCartRate, sales.checkoutRate, sales.paymentRate]);

  return (
    <ProtectedRoute>
      <DashboardLayout title="Analytics" subtitle="Ecommerce funnel, sales quality, region demand and customer movement">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex rounded-lg border border-black/10 bg-white p-1">
              {dayOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => setDays(option)}
                  className={`h-9 rounded-md px-4 text-sm font-black transition ${days === option ? 'bg-ink text-white' : 'text-black/60 hover:bg-black/5'}`}
                >
                  {option}d
                </button>
              ))}
            </div>
            <button onClick={() => refetch()} className="inline-flex h-10 items-center gap-2 rounded-lg border border-black/10 bg-white px-4 text-sm font-bold text-ink hover:bg-black/5">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="font-bold text-red-700">Analytics could not load</p>
              <p className="mt-1 text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <Metric title="Revenue" value={`Rs ${formatNumber(sales.revenue || 0)}`} icon={<IndianRupee size={22} />} />
            <Metric title="Paid Orders" value={formatNumber(sales.orders || 0)} icon={<BarChart3 size={22} />} />
            <Metric title="Avg Order" value={`Rs ${formatNumber(sales.averageOrderValue || 0)}`} icon={<ShoppingCart size={22} />} />
            <Metric title="Cart Rate" value={`${sales.addToCartRate || 0}%`} icon={<MousePointerClick size={22} />} />
            <Metric title="Pay Rate" value={`${sales.paymentRate || 0}%`} icon={<Activity size={22} />} />
          </div>

          <section className="rounded-lg border border-black/10 bg-white p-5">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Route size={20} className="text-coral" />
                <h2 className="text-lg font-black text-ink">Checkout Funnel</h2>
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-black text-black/55">
                <Badge label={`Cart ${sales.addToCartRate || 0}%`} />
                <Badge label={`Checkout ${sales.checkoutRate || 0}%`} />
                <Badge label={`Payment ${sales.paymentRate || 0}%`} />
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
              <div className="space-y-4">
                {loading ? (
                  <SkeletonRows rows={5} />
                ) : funnel.length === 0 ? (
                  <Empty label="No funnel events yet. Events begin collecting after deploy and migration." />
                ) : (
                  funnel.map((item, index) => {
                    const previous = index === 0 ? item.value : funnel[index - 1]?.value || 0;
                    const conversion = previous ? Math.round((item.value / previous) * 100) : 0;
                    return (
                      <div key={item.event}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="font-black text-ink">{item.label}</span>
                          <span className="font-bold text-black/55">{formatNumber(item.value)} {index > 0 ? `- ${conversion}%` : ''}</span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-black/5">
                          <div className="h-full rounded-full bg-coral" style={{ width: `${Math.max((item.value / maxFunnel) * 100, item.value ? 4 : 0)}%` }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="rounded-lg bg-black/[0.03] p-4">
                <p className="mb-3 text-xs font-black uppercase text-black/45">Action Signals</p>
                <div className="space-y-3">
                  {healthNotes.map((note) => (
                    <p key={note} className="text-sm font-bold leading-5 text-black/65">{note}</p>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <div className="grid gap-4 xl:grid-cols-[1.25fr_.75fr]">
            <ProductTable rows={data?.productPerformance || []} loading={loading} />
            <RegionTable rows={data?.regionPerformance || []} loading={loading} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <QualityTable title="Referrer Quality" icon={<MousePointerClick size={18} />} rows={data?.referrerPerformance || []} loading={loading} />
            <QualityTable title="Device Conversion" icon={<MonitorSmartphone size={18} />} rows={data?.devicePerformance || []} loading={loading} />
            <Panel title="Pincode Demand" icon={<MapPin size={18} />} rows={data?.byPincode || []} loading={loading} />
            <Panel title="Event Mix" icon={<BarChart3 size={18} />} rows={data?.byEvent || []} loading={loading} />
          </div>

          <CustomerTable rows={data?.customerActivity || []} loading={loading} />

          <section className="rounded-lg border border-black/10 bg-white p-5">
            <h2 className="mb-4 text-lg font-black text-ink">Recent Movement</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-left text-sm">
                <thead>
                  <tr className="border-b border-black/10 text-xs uppercase text-black/45">
                    <th className="py-2 font-black">Event</th>
                    <th className="py-2 font-black">Path</th>
                    <th className="py-2 font-black">Region</th>
                    <th className="py-2 font-black">Device</th>
                    <th className="py-2 font-black">Referrer</th>
                    <th className="py-2 font-black">When</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.recent || []).map((event: any) => (
                    <tr key={event.id} className="border-b border-black/5">
                      <td className="py-3 font-bold text-ink">{event.name}</td>
                      <td className="max-w-[240px] truncate py-3 text-black/60">{event.path || '-'}</td>
                      <td className="py-3 text-black/60">{event.state || event.pincodePrefix || '-'}</td>
                      <td className="py-3 capitalize text-black/60">{event.device || '-'}</td>
                      <td className="max-w-[180px] truncate py-3 text-black/60">{event.referrer || 'Direct'}</td>
                      <td className="py-3 text-black/60">{new Date(event.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function Metric({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-black/10 bg-white p-5">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-coral/10 text-coral">{icon}</div>
      <p className="text-sm font-bold text-black/50">{title}</p>
      <p className="mt-1 text-2xl font-black text-ink">{value}</p>
    </div>
  );
}

function ProductTable({ rows, loading }: { rows: any[]; loading: boolean }) {
  return (
    <section className="rounded-lg border border-black/10 bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <Package size={18} className="text-coral" />
        <h2 className="text-base font-black text-ink">Product Performance</h2>
      </div>
      {loading ? <SkeletonRows rows={6} /> : rows.length === 0 ? <Empty label="No product analytics yet." /> : (
        <ResponsiveTable columns={['Product', 'Views', 'Cart', 'Buy', 'Revenue']} rows={rows.map((row) => [
          row.name,
          formatNumber(row.views),
          `${formatNumber(row.adds)} / ${row.cartRate}%`,
          `${formatNumber(row.orders)} / ${row.buyRate}%`,
          `Rs ${formatNumber(row.revenue)}`
        ])} />
      )}
    </section>
  );
}

function RegionTable({ rows, loading }: { rows: any[]; loading: boolean }) {
  return (
    <section className="rounded-lg border border-black/10 bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <MapPin size={18} className="text-coral" />
        <h2 className="text-base font-black text-ink">Region Sales</h2>
      </div>
      {loading ? <SkeletonRows rows={6} /> : rows.length === 0 ? <Empty label="No checkout/order region data yet." /> : (
        <ResponsiveTable columns={['Region', 'Checkout', 'Orders', 'Revenue']} rows={rows.map((row) => [
          row.label,
          formatNumber(row.checkouts),
          `${formatNumber(row.orders)} / ${row.orderRate}%`,
          `Rs ${formatNumber(row.revenue)}`
        ])} />
      )}
    </section>
  );
}

function QualityTable({ title, icon, rows, loading }: { title: string; icon: React.ReactNode; rows: any[]; loading: boolean }) {
  return (
    <section className="rounded-lg border border-black/10 bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-coral">{icon}</span>
        <h2 className="text-base font-black text-ink">{title}</h2>
      </div>
      {loading ? <SkeletonRows rows={5} /> : rows.length === 0 ? <Empty label="No data yet." /> : (
        <ResponsiveTable columns={['Source', 'Views', 'Cart', 'Pay']} rows={rows.map((row) => [
          row.label,
          formatNumber(row.views),
          `${formatNumber(row.adds)} / ${row.cartRate}%`,
          `${formatNumber(row.payments)} / ${row.paymentRate}%`
        ])} />
      )}
    </section>
  );
}

function CustomerTable({ rows, loading }: { rows: any[]; loading: boolean }) {
  return (
    <section className="rounded-lg border border-black/10 bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <Users size={18} className="text-coral" />
        <h2 className="text-base font-black text-ink">Customer Activity</h2>
      </div>
      {loading ? <SkeletonRows rows={5} /> : rows.length === 0 ? <Empty label="No customer/session activity yet." /> : (
        <ResponsiveTable columns={['Customer', 'Events', 'Checkout', 'Orders', 'Revenue', 'Last Seen']} rows={rows.map((row) => [
          row.email || row.name || (row.userId ? `User ${String(row.userId).slice(-6)}` : `Guest ${String(row.sessionId || '').slice(0, 8)}`),
          formatNumber(row.events),
          formatNumber(row.checkouts),
          formatNumber(row.orders),
          `Rs ${formatNumber(row.revenue)}`,
          new Date(row.lastSeen).toLocaleString()
        ])} />
      )}
    </section>
  );
}

function Panel({ title, icon, rows, loading }: { title: string; icon: React.ReactNode; rows: Row[]; loading: boolean }) {
  const max = Math.max(...rows.map((row) => row.value), 1);
  return (
    <section className="rounded-lg border border-black/10 bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-coral">{icon}</span>
        <h2 className="text-base font-black text-ink">{title}</h2>
      </div>
      {loading ? (
        <SkeletonRows rows={4} />
      ) : rows.length === 0 ? (
        <Empty label="No data yet." />
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.label}>
              <div className="mb-1 flex justify-between gap-3 text-sm">
                <span className="truncate font-bold text-ink">{row.label}</span>
                <span className="font-bold text-black/50">{formatNumber(row.value)}</span>
              </div>
              <div className="h-2 rounded-full bg-black/5">
                <div className="h-2 rounded-full bg-ink" style={{ width: `${Math.max((row.value / max) * 100, 4)}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function ResponsiveTable({ columns, rows }: { columns: string[]; rows: Array<Array<string | number>> }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead>
          <tr className="border-b border-black/10 text-xs uppercase text-black/45">
            {columns.map((column) => <th key={column} className="py-2 pr-3 font-black">{column}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b border-black/5">
              {row.map((cell, index) => (
                <td key={`${rowIndex}-${index}`} className={`py-3 pr-3 ${index === 0 ? 'max-w-[260px] truncate font-bold text-ink' : 'text-black/65'}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Badge({ label }: { label: string }) {
  return <span className="rounded-full bg-black/5 px-3 py-1">{label}</span>;
}

function SkeletonRows({ rows }: { rows: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="h-8 animate-pulse rounded bg-black/5" />
      ))}
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return <p className="rounded-lg bg-black/5 p-4 text-sm font-bold text-black/45">{label}</p>;
}

function formatNumber(value: number) {
  return Number(value || 0).toLocaleString('en-IN');
}
