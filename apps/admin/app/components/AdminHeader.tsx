'use client';

import { Bell, Search, Settings, User, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../stores/authStore';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
}

export function AdminHeader({ title, subtitle }: AdminHeaderProps) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-black/10 md:ml-64">
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
          <button className="relative p-2 rounded-lg hover:bg-black/5 text-ink/70 hover:text-ink transition-all group">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-coral rounded-full animate-pulse"></span>
            <div className="absolute top-full right-0 mt-2 hidden group-hover:block bg-white rounded-lg border border-black/10 shadow-lg p-3 w-72 z-50">
              <p className="font-bold text-ink mb-2">Recent Notifications</p>
              <div className="space-y-2 text-sm">
                <p className="text-black/60">3 new orders awaiting processing</p>
                <p className="text-black/60">Low stock alert: Product #12</p>
                <p className="text-black/60">Custom design review pending</p>
              </div>
            </div>
          </button>

          {/* Settings */}
          <button className="p-2 rounded-lg hover:bg-black/5 text-ink/70 hover:text-ink transition-all">
            <Settings size={20} />
          </button>

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
                  onClick={() => {
                    handleLogout();
                    setProfileOpen(false);
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
