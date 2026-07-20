'use client';

import Link from 'next/link';
import { AlertCircle, Home, Search } from 'lucide-react';
import { useState } from 'react';

export default function NotFound() {
  const [searchQuery, setSearchQuery] = useState('');

  const suggestedRoutes = [
    { label: 'Dashboard', href: '/', icon: Home },
    { label: 'Products', href: '/products', icon: Search },
    { label: 'Orders', href: '/orders', icon: Search },
    { label: 'Users', href: '/users', icon: Search },
  ];

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
            <AlertCircle size={40} style={{ color: 'var(--color-primary)' }} />
          </div>
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <h1 className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>
            404
          </h1>
          <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            Page Not Found
          </p>
          <p style={{ color: 'var(--text-secondary)' }} className="text-sm">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        {/* Search */}
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Search or type URL..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border-2 font-bold"
            style={{ borderColor: 'var(--border-color)' }}
          />
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Type a route or search for a page
          </p>
        </div>

        {/* Suggested Routes */}
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase" style={{ color: 'var(--text-muted)' }}>
            Quick Navigation
          </p>
          <div className="grid grid-cols-2 gap-2">
            {suggestedRoutes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className="px-3 py-2 rounded-lg font-bold text-sm transition"
                style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
              >
                {route.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Back to Home */}
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-bold text-white transition"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <Home size={18} />
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
