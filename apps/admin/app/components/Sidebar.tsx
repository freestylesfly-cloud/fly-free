'use client';

import { Bell, FileText, LayoutGrid, Mail, Package, ShoppingCart, Sparkles, Tags, Users, Palette, Sliders, LogOut, Menu, X, MessageSquare, Share2 } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';

const menuItems = [
  {
    label: 'Store',
    items: [
      { label: 'Dashboard', href: '/', icon: LayoutGrid },
      { label: 'Products', href: '/products', icon: Package },
      { label: 'Categories', href: '/categories', icon: Tags },
      { label: 'Orders', href: '/orders', icon: ShoppingCart },
      { label: 'Users', href: '/users', icon: Users },
    ],
  },
  {
    label: 'Growth',
    items: [
      { label: 'Influencers', href: '/influencers', icon: Share2 },
      { label: 'Reviews', href: '/reviews', icon: MessageSquare },
      { label: 'Notifications', href: '/notifications', icon: Bell },
      { label: 'Email', href: '/email', icon: Mail },
    ],
  },
  {
    label: 'Website',
    items: [
      { label: 'Pages', href: '/pages', icon: FileText },
      { label: 'Product Themes', href: '/themes', icon: Palette },
      { label: 'Website Themes', href: '/website-themes', icon: Sparkles },
      { label: 'Settings', href: '/settings', icon: Sliders },
    ],
  },
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
        className={`fixed inset-y-0 left-0 w-64 border-r border-black/10 bg-white z-40 md:z-0 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="border-b border-black/10 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded border border-ink bg-ink flex items-center justify-center">
              <span className="text-lg font-black text-white">FF</span>
            </div>
            <div>
              <h1 className="text-sm font-black uppercase tracking-wide">Fly Free</h1>
              <p className="text-xs text-black/40">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="h-[calc(100vh-196px)] overflow-y-auto px-3 py-4">
          <div className="space-y-5">
            {menuItems.map((group) => (
              <div key={group.label}>
                <p className="px-3 pb-2 text-[11px] font-black uppercase tracking-wide text-black/35">{group.label}</p>
                <div className="space-y-1">
                  {group.items.map(({ label, href, icon: Icon }) => {
                    const isActive = href === '/' ? pathname === href : pathname.startsWith(href);
                    return (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded font-bold transition ${
                          isActive
                            ? 'bg-ink text-white'
                            : 'text-black/70 hover:bg-black/5 hover:text-ink'
                        }`}
                      >
                        <Icon size={18} />
                        <span>{label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-black/10 bg-white p-4 space-y-3">
          <div className="px-3 py-2 rounded bg-black/5">
            <p className="text-xs font-bold text-black/60">Logged in as</p>
            <p className="text-sm font-black text-ink">{user?.email?.split('@')[0] || 'Admin'}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded bg-ink text-white font-bold hover:bg-ink/90 transition-all group"
          >
            <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
