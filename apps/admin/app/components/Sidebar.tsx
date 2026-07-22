'use client';

import { Bell, FileText, LayoutGrid, Mail, Package, ShoppingCart, Sparkles, Tags, Users, Sliders, LogOut, Menu, X, MessageSquare, Share2, Ruler, Gift } from 'lucide-react';
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
      { label: 'Product Themes', href: '/product-themes', icon: Sparkles },
      { label: 'Hampers', href: '/hampers', icon: Gift },
      { label: 'Size Guides', href: '/size-guides', icon: Ruler },
      { label: 'Orders', href: '/orders', icon: ShoppingCart },
      { label: 'Users', href: '/users', icon: Users },
    ],
  },
  {
    label: 'Marketing',
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
      { label: 'Announcements', href: '/announcements', icon: Bell },
      { label: 'Pages', href: '/pages', icon: FileText },
      { label: 'Appearance', href: '/website-themes', icon: Sparkles },
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
            <img
              src="/logo.png"
              alt="Fly Free logo"
              className="w-10 h-10 rounded border border-black/10 bg-white object-contain"
            />
            <div>
              <h1 className="text-sm font-black uppercase tracking-wide">Fly Free</h1>
              <p className="text-xs text-black/40">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="h-[calc(100vh-150px)] overflow-y-auto px-3 py-4">
          <div className="space-y-5">
            {menuItems.map((group, groupIndex) => (
              <div key={`${group.label ?? 'group'}-${groupIndex}`}>
                {group.label ? (
                  <p className="px-3 pb-2 text-[11px] font-black uppercase tracking-wide text-black/35">{group.label}</p>
                ) : null}
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
