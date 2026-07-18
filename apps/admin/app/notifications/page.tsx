'use client';

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { Bell, Check, RefreshCw } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { useFetch } from '../hooks/useFetch';
import { apiService } from '../services/api';

type NotificationItem = {
  id: string;
  type?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  title: string;
  body: string;
  status: string;
  createdAt: string;
};

export default function NotificationsPage() {
  const { data, loading, error, refetch } = useFetch<any>(() => apiService.getNotifications(), { skip: false });
  const notifications = (data?.data || []) as NotificationItem[];

  async function markRead(id: string) {
    if (id.includes('-')) return;
    await apiService.markNotificationRead(id);
    refetch();
  }

  return (
    <ProtectedRoute>
      <DashboardLayout title="Notifications" subtitle="Real operational events from orders, users, stock, and influencer sales">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-black/60">{notifications.length} notifications loaded from API</p>
            <button onClick={() => refetch()} className="inline-flex items-center gap-2 rounded bg-ink px-4 py-2 font-bold text-white">
              <RefreshCw size={16} /> Refresh
            </button>
          </div>

          {error && <div className="rounded border border-red-200 bg-red-50 p-3 text-red-700">{error}</div>}

          <div className="overflow-hidden rounded border border-black/10 bg-white">
            {loading ? (
              <div className="p-5 text-black/60">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="p-5 text-black/60">No notifications yet.</div>
            ) : notifications.map((item) => (
              <div key={item.id} className="flex flex-col gap-3 border-b border-black/10 p-4 last:border-b-0 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex gap-3">
                  <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded bg-coral/10 text-coral">
                    <Bell size={18} />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-black text-ink">{item.title}</h2>
                      <span className="rounded bg-black/5 px-2 py-1 text-xs font-bold text-black/60">{item.type || 'INFO'}</span>
                      {item.status !== 'READ' && <span className="rounded bg-coral/10 px-2 py-1 text-xs font-bold text-coral">Unread</span>}
                    </div>
                    <p className="mt-1 text-sm text-black/70">{item.body}</p>
                    <p className="mt-2 text-xs text-black/50">{new Date(item.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {item.entityType === 'Order' && item.entityId && <Link href={`/orders/${item.entityId}`} className="rounded border border-black/10 px-3 py-2 text-sm font-bold">Open order</Link>}
                  {item.entityType === 'User' && item.entityId && <Link href={`/users/${item.entityId}`} className="rounded border border-black/10 px-3 py-2 text-sm font-bold">Open user</Link>}
                  {!item.id.includes('-') && item.status !== 'READ' && (
                    <button onClick={() => markRead(item.id)} className="inline-flex items-center gap-2 rounded bg-mint px-3 py-2 text-sm font-bold text-ink">
                      <Check size={16} /> Read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
