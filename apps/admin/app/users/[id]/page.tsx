'use client';

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { use } from 'react';
import { ArrowLeft, Heart, Mail, MapPin, Package, Star } from 'lucide-react';
import { DashboardLayout } from '../../components/DashboardLayout';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { useFetch } from '../../hooks/useFetch';
import { apiService } from '../../services/api';

export default function UserDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: user, loading, error } = useFetch<any>(() => apiService.getUser(id), { skip: false });
  const totalSpent = (user?.orders || []).reduce((sum: number, order: any) => sum + Number(order.total || 0), 0);

  return (
    <ProtectedRoute>
      <DashboardLayout title="User Details" subtitle={id}>
        <div className="space-y-5">
          <Link href="/users" className="inline-flex items-center gap-2 text-sm font-bold text-black/60 hover:text-ink">
            <ArrowLeft size={16} /> Back to users
          </Link>

          {error && <div className="rounded border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}
          {loading || !user ? (
            <div className="rounded border border-black/10 bg-white p-5">Loading user...</div>
          ) : (
            <>
              <section className="rounded border border-black/10 bg-white p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded bg-coral text-2xl font-black text-white">
                      {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-xl font-black">{user.name || 'No name'}</h2>
                      <p className="text-black/60">{user.email}</p>
                      <p className="text-black/60">{user.phone}</p>
                    </div>
                  </div>
                  <button onClick={() => apiService.sendEmailToUser(user.id, 'Hello from Fly Free support.')} className="inline-flex items-center gap-2 rounded bg-coral px-4 py-2 font-bold text-white">
                    <Mail size={16} /> Send email
                  </button>
                </div>
              </section>

              <div className="grid gap-4 md:grid-cols-4">
                <Metric icon={<Package size={18} />} label="Orders" value={String(user.orders?.length || 0)} />
                <Metric icon={<Heart size={18} />} label="Wishlist" value={String(user.wishlistItems?.length || 0)} />
                <Metric icon={<Star size={18} />} label="Reviews" value={String(user.reviews?.length || 0)} />
                <Metric icon={<Package size={18} />} label="Lifetime value" value={`Rs ${totalSpent.toLocaleString('en-IN')}`} />
              </div>

              <section className="rounded border border-black/10 bg-white">
                <div className="border-b border-black/10 p-4 font-black">Orders</div>
                {(user.orders || []).map((order: any) => (
                  <Link key={order.id} href={`/orders/${order.id}`} className="flex items-center justify-between border-b border-black/10 p-4 last:border-b-0 hover:bg-black/5">
                    <div>
                      <p className="font-bold">{order.id}</p>
                      <p className="text-sm text-black/60">{new Date(order.createdAt).toLocaleDateString()} | {order.status}</p>
                    </div>
                    <p className="font-black">Rs {Number(order.total || 0).toLocaleString('en-IN')}</p>
                  </Link>
                ))}
                {(!user.orders || user.orders.length === 0) && <p className="p-4 text-black/60">No orders yet.</p>}
              </section>

              <div className="grid gap-5 lg:grid-cols-2">
                <section className="rounded border border-black/10 bg-white">
                  <div className="border-b border-black/10 p-4 font-black">Addresses</div>
                  {(user.addresses || []).map((address: any) => (
                    <div key={address.id} className="border-b border-black/10 p-4 last:border-b-0">
                      <p className="flex items-center gap-2 font-bold"><MapPin size={16} /> {address.fullName}</p>
                      <p className="text-sm text-black/60">{address.line1}</p>
                      <p className="text-sm text-black/60">{address.city}, {address.state} {address.postalCode}</p>
                    </div>
                  ))}
                </section>
                <section className="rounded border border-black/10 bg-white">
                  <div className="border-b border-black/10 p-4 font-black">Wishlist</div>
                  {(user.wishlistItems || []).map((item: any) => (
                    <div key={item.id} className="border-b border-black/10 p-4 last:border-b-0">
                      <p className="font-bold">{item.product?.name}</p>
                      <p className="text-sm text-black/60">Rs {Number(item.product?.price || 0).toLocaleString('en-IN')}</p>
                    </div>
                  ))}
                </section>
              </div>
            </>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded border border-black/10 bg-white p-4">
      <div className="mb-2 text-coral">{icon}</div>
      <p className="text-sm text-black/60">{label}</p>
      <p className="font-black text-ink">{value}</p>
    </div>
  );
}
