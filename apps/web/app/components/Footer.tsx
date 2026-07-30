'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Instagram, Mail, MapPin, Phone } from 'lucide-react';
import { Logo } from './Logo';

export function Footer() {
  const currentYear = new Date().getFullYear();
  const linkStyle = { color: 'var(--text-secondary)' };
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setEmail('');
  };

  return (
    <footer style={{ backgroundColor: 'var(--bg-secondary)', borderTop: '2px solid var(--border-color)' }} className="mt-16 pb-16 md:pb-0">
      <div className="mx-auto max-w-7xl px-5 py-10 md:py-12">
        {/* Newsletter */}
        <div
          className="grid gap-6 md:grid-cols-2 items-end pb-8 md:pb-10"
          style={{ borderBottom: '2px solid var(--border-color)' }}
        >
          <div>
            <h2 className="text-3xl md:text-4xl font-black uppercase leading-tight tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Ready to wear your fandom?
            </h2>
            <p className="mt-3 max-w-md text-sm" style={{ color: 'var(--text-secondary)' }}>
              Get first access to new theme drops and restocks.
            </p>
          </div>
          <form onSubmit={handleSubscribe} className="flex items-stretch">
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@email.com"
              className="flex-1 px-4 py-3.5 text-base outline-none"
              style={{ border: '2px solid var(--border-color)', borderRight: 'none', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            />
            <button
              type="submit"
              className="px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-white transition hover:opacity-90 whitespace-nowrap"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              Subscribe
            </button>
          </form>
          {subscribed && (
            <p className="md:col-span-2 text-sm font-bold" style={{ color: 'var(--color-primary)' }}>
              Thanks — you&apos;re on the list.
            </p>
          )}
        </div>

        <div className="grid gap-8 py-10 md:grid-cols-[1.3fr_1fr_1fr_1.2fr]">
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <Logo size="md" showText={false} />
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>
              Freedom, culture, comfort, and self-expression through premium tees and custom-crafted apparel.
            </p>
          </div>

          <div>
            <h3 className="font-black text-sm uppercase tracking-wide" style={{ color: 'var(--text-primary)' }}>Shop</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="/products" style={linkStyle}>All products</Link></li>
              <li><Link href="/search" style={linkStyle}>Search</Link></li>
              <li><Link href="/products?gender=MEN" style={linkStyle}>Men</Link></li>
              <li><Link href="/products?gender=WOMEN" style={linkStyle}>Women</Link></li>
              <li><Link href="/products?gender=UNISEX" style={linkStyle}>Unisex</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-black text-sm uppercase tracking-wide" style={{ color: 'var(--text-primary)' }}>Company</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="/about" style={linkStyle}>About us</Link></li>
              <li><Link href="/influencers" style={linkStyle}>Influencers</Link></li>
              <li><Link href="/contact" style={linkStyle}>Contact us</Link></li>
              <li><Link href="/terms" style={linkStyle}>Terms</Link></li>
              <li><Link href="/privacy" style={linkStyle}>Privacy</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-black text-sm uppercase tracking-wide" style={{ color: 'var(--text-primary)' }}>Support</h3>
            <ul className="mt-4 space-y-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <li className="flex gap-2"><Mail size={16} /> <a href="mailto:support@flyfree.com">support@flyfree.com</a></li>
              <li className="flex gap-2"><Phone size={16} /> <a href="tel:+919876543210">+91 98765 43210</a></li>
              <li className="flex gap-2"><MapPin size={16} /> <span>Guwahati, Assam, India</span></li>
              <li>
                <a
                  href="https://instagram.com/flyfree"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 font-bold"
                  style={{ border: '2px solid var(--border-color)', color: 'var(--text-primary)' }}
                >
                  <Instagram size={16} /> Instagram
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Oversized outline wordmark */}
        <div className="w-full overflow-hidden" style={{ borderTop: '2px solid var(--border-color)' }}>
          <div
            className="font-black leading-none whitespace-nowrap"
            style={{
              fontSize: 'clamp(72px, 16vw, 220px)',
              letterSpacing: '-0.03em',
              color: 'transparent',
              WebkitTextStroke: '1.5px var(--text-primary)',
              padding: '8px 0 var(--space-4, 16px)',
              marginTop: '-8px'
            }}
          >
            flyfree
          </div>
        </div>

        <div
          className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs uppercase tracking-wide pb-6"
          style={{ color: 'var(--text-tertiary)' }}
        >
          <span>&copy; {currentYear} Fly Free. All rights reserved.</span>
          <span>Secure checkout &nbsp;&middot;&nbsp; 30-day return or exchange support</span>
        </div>
      </div>
    </footer>
  );
}
