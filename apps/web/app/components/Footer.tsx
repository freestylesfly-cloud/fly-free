'use client';

import Link from 'next/link';
import { Instagram, Mail, MapPin, Phone } from 'lucide-react';
import { Logo } from './Logo';

export function Footer() {
  const currentYear = new Date().getFullYear();
  const linkStyle = { color: 'var(--text-secondary)' };

  return (
    <footer className="mt-16 pb-16 md:pb-0" style={{ backgroundColor: 'var(--bg-secondary)', borderTopColor: 'var(--border-color)', borderTopWidth: '1px' }}>
      <div className="mx-auto max-w-7xl px-5 py-12">
        <div className="grid gap-8 md:grid-cols-[1.3fr_1fr_1fr_1.2fr]">
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <Logo size="md" showText={false} />
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>
              Freedom, culture, comfort, and self-expression through premium tees and custom-crafted apparel.
            </p>
          </div>

          <div>
            <h3 className="font-black text-lg">Shop</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="/products" style={linkStyle}>All products</Link></li>
              <li><Link href="/search" style={linkStyle}>Search</Link></li>
              <li><Link href="/products?gender=MEN" style={linkStyle}>Men</Link></li>
              <li><Link href="/products?gender=WOMEN" style={linkStyle}>Women</Link></li>
              <li><Link href="/products?gender=UNISEX" style={linkStyle}>Unisex</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-black text-lg">Company</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="/about" style={linkStyle}>About us</Link></li>
              <li><Link href="/influencers" style={linkStyle}>Influencers</Link></li>
              <li><Link href="/contact" style={linkStyle}>Contact us</Link></li>
              <li><Link href="/terms" style={linkStyle}>Terms</Link></li>
              <li><Link href="/privacy" style={linkStyle}>Privacy</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-black text-lg">Support</h3>
            <ul className="mt-4 space-y-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <li className="flex gap-2"><Mail size={16} /> <a href="mailto:support@flyfree.com">support@flyfree.com</a></li>
              <li className="flex gap-2"><Phone size={16} /> <a href="tel:+919876543210">+91 98765 43210</a></li>
              <li className="flex gap-2"><MapPin size={16} /> <span>Guwahati, Assam, India</span></li>
              <li>
                <a href="https://instagram.com/flyfree" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded border px-3 py-2 font-bold" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                  <Instagram size={16} /> Instagram
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t pt-6 text-xs" style={{ borderColor: 'var(--border-color)', color: 'var(--text-tertiary)' }}>
          <p>Copyright {currentYear} Fly Free. All rights reserved.</p>
          <p className="mt-2">Secure checkout, order updates, and 30-day return or exchange support for eligible products.</p>
        </div>
      </div>
    </footer>
  );
}
