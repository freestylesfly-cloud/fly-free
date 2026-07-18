'use client';

import { LayoutGrid, Package, ShoppingCart, Users, Palette, Sliders, LogOut, Menu, X, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';

const menuItems = [
  { label: 'Dashboard', href: '/', icon: LayoutGrid },
  { label: 'Products', href: '/products', icon: Package },
  { label: 'Orders', href: '/orders', icon: ShoppingCart },
  { label: 'Users', href: '/users', icon: Users },
  { label: 'Reviews', href: '/reviews', icon: MessageSquare },
  { label: 'Themes', href: '/themes', icon: Palette },
  { label: 'Settings', href: '/settings', icon: Sliders },
];

export function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    window.location.replace('/login');
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-5 left-5 z-50 p-2 rounded-lg bg-ink text-white hover:bg-ink/90 transition"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 border-r border-black/10 bg-gradient-to-b from-white to-paper z-40 md:z-0 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="border-b border-black/10 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-coral to-mint flex items-center justify-center">
              <span className="text-lg font-black text-white">FF</span>
            </div>
            <div>
              <h1 className="text-sm font-black uppercase tracking-wide">Fly Free</h1>
              <p className="text-xs text-black/40">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1">
          {menuItems.map(({ label, href, icon: Icon }) => {
            const isActive = href === '/' ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg font-bold transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-coral to-coral/90 text-white shadow-lg scale-105'
                    : 'text-black/70 hover:bg-black/5 hover:translate-x-1'
                }`}
              >
                <Icon size={18} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-5 left-5 right-5 pt-5 border-t border-black/10 space-y-3">
          <div className="px-3 py-2 rounded-lg bg-paper">
            <p className="text-xs font-bold text-black/60">Logged in as</p>
            <p className="text-sm font-black text-ink">{user?.email?.split('@')[0] || 'Admin'}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-ink text-white font-bold hover:bg-ink/90 transition-all group"
          >
            <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
