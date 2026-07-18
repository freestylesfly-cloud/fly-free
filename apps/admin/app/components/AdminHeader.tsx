'use client';

import { Bell, Search, Settings, User, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useFetch } from '../hooks/useFetch';
import { apiService } from '../services/api';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
}

export function AdminHeader({ title, subtitle }: AdminHeaderProps) {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { data: notificationsData, refetch: refetchNotifications } = useFetch<any>(
    () => apiService.getNotifications(),
    { skip: false }
  );
  const notifications = (notificationsData?.data || []).slice(0, 3);
  const unreadCount = (notificationsData?.data || []).filter((item: any) => item.status !== 'READ').length;

  const handleLogout = async () => {
    await logout();
    window.location.replace('/login');
  };

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-black/10">
      <div className="flex items-center justify-between px-5 py-4 gap-4">
        {/* Left: Title */}
        <div className="flex-1">
          <p className="text-xs font-bold text-coral uppercase tracking-wider">{subtitle || 'Dashboard'}</p>
          <h2 className="text-2xl font-black text-ink">{title}</h2>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="hidden sm:flex items-center gap-2">
            {searchOpen ? (
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && searchTerm.trim()) {
                    window.location.href = `/products?search=${encodeURIComponent(searchTerm.trim())}`;
                  }
                }}
                autoFocus
                onBlur={() => setSearchOpen(false)}
                className="px-4 py-2 rounded-lg border border-black/10 focus:outline-none focus:border-coral focus:ring-2 focus:ring-coral/30 transition-all"
              />
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 rounded-lg hover:bg-black/5 text-ink/70 hover:text-ink transition-all"
              >
                <Search size={20} />
              </button>
            )}
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => {
                setNotificationsOpen((value) => !value);
                setProfileOpen(false);
                void refetchNotifications();
              }}
              className="relative p-2 rounded-lg hover:bg-black/5 text-ink/70 hover:text-ink transition-all"
              aria-label="Open notifications"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 rounded-full bg-coral px-1.5 py-0.5 text-[10px] font-black text-white">
                  {Math.min(unreadCount, 9)}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute top-full right-0 mt-2 w-[min(360px,calc(100vw-24px))] rounded border border-black/10 bg-white shadow-xl z-50">
                <div className="flex items-center justify-between border-b border-black/10 p-3">
                  <p className="font-black text-ink">Notifications</p>
                  <Link href="/notifications" onClick={() => setNotificationsOpen(false)} className="text-xs font-bold text-coral">
                    View all
                  </Link>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="p-4 text-sm text-black/55">No notifications yet.</p>
                  ) : notifications.map((item: any) => (
                    <Link
                      key={item.id}
                      href={getNotificationHref(item)}
                      onClick={() => setNotificationsOpen(false)}
                      className="block border-b border-black/10 p-3 last:border-b-0 hover:bg-black/5"
                    >
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-ink">{item.title}</p>
                        {item.status !== 'READ' && <span className="h-2 w-2 rounded-full bg-coral" />}
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-black/60">{item.body}</p>
                      <p className="mt-2 text-xs text-black/40">{new Date(item.createdAt).toLocaleString()}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Settings */}
          <Link href="/settings" className="p-2 rounded-lg hover:bg-black/5 text-ink/70 hover:text-ink transition-all" aria-label="Open settings">
            <Settings size={20} />
          </Link>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-black/5 transition-all group"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-coral to-mint flex items-center justify-center">
                <User size={16} className="text-white" />
              </div>
              <span className="text-sm font-bold text-ink hidden sm:block group-hover:text-coral transition">
                {user?.email?.split('@')[0] || 'Admin'}
              </span>
            </button>

            {profileOpen && (
              <div className="absolute top-full right-0 mt-2 bg-white rounded-lg border border-black/10 shadow-lg overflow-hidden z-50 min-w-48">
                <div className="p-3 border-b border-black/10">
                  <p className="text-xs text-black/60">Logged in as</p>
                  <p className="text-sm font-bold text-ink">{user?.email || 'admin@flyfree.com'}</p>
                </div>
                <button
                  onClick={async () => {
                    setProfileOpen(false);
                    await handleLogout();
                  }}
                  className="w-full flex items-center gap-2 px-4 py-3 text-ink hover:bg-black/5 transition font-bold text-sm"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function getNotificationHref(item: any) {
  if (item.entityType === 'Order' && item.entityId) return `/orders/${item.entityId}`;
  if (item.entityType === 'User' && item.entityId) return `/users/${item.entityId}`;
  if (item.entityType === 'Influencer' && item.entityId) return '/influencers';
  return '/notifications';
}
