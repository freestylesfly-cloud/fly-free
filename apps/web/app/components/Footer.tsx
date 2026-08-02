'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Instagram, Mail, MapPin, Phone } from 'lucide-react';
import { Logo } from './Logo';

export function Footer() {
  const currentYear = new Date().getFullYear();
  const linkStyle = { color: 'var(--text-secondary)' };
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubscribe(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), source: 'footer' })
      });
      const data = await parseNewsletterResponse(response);

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Could not subscribe right now');
      }

      setMessage('Thanks. You are on the drop list.');
      setEmail('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not subscribe right now');
    } finally {
      setLoading(false);
    }
  }

  return (
    <footer style={{ backgroundColor: 'var(--bg-secondary)', borderTop: '2px solid var(--border-color)' }} className="mt-16 pb-16 md:pb-0">
      <div className="mx-auto max-w-7xl px-5 py-10 md:py-12">
        <div className="grid items-end gap-6 pb-8 md:grid-cols-2 md:pb-10" style={{ borderBottom: '2px solid var(--border-color)' }}>
          <div>
            <h2 className="text-3xl font-black uppercase leading-tight tracking-tight md:text-4xl" style={{ color: 'var(--text-primary)' }}>
              Ready to wear your fandom?
            </h2>
            <p className="mt-3 max-w-md text-sm" style={{ color: 'var(--text-secondary)' }}>
              Get first access to new theme drops, restocks, and subscriber-only offers.
            </p>
          </div>

          <form onSubmit={handleSubscribe} className="flex items-stretch">
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@email.com"
              className="min-w-0 flex-1 px-4 py-3.5 text-base outline-none"
              style={{ border: '2px solid var(--border-color)', borderRight: 'none', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            />
            <button
              type="submit"
              disabled={loading}
              className="whitespace-nowrap px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-white transition hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              {loading ? 'Joining...' : 'Subscribe'}
            </button>
          </form>

          {message && <p className="text-sm font-bold md:col-span-2" style={{ color: 'var(--color-primary)' }}>{message}</p>}
        </div>

        <div className="grid gap-8 py-10 md:grid-cols-[1.3fr_1fr_1fr_1.2fr]">
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <Logo size="lg" showText={false} />
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>
              Freedom, culture, comfort, and self-expression through premium tees and custom-crafted apparel.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-black uppercase tracking-wide" style={{ color: 'var(--text-primary)' }}>Shop</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="/products" style={linkStyle}>All products</Link></li>
              <li><Link href="/products?category=regular" style={linkStyle}>Regular</Link></li>
              <li><Link href="/products?category=oversized" style={linkStyle}>Oversized</Link></li>
              <li><Link href="/products?category=jersey" style={linkStyle}>Jersey</Link></li>
              <li><Link href="/products?category=polo" style={linkStyle}>Polo</Link></li>
              <li><Link href="/products?category=hoodie" style={linkStyle}>Hoodie</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-black uppercase tracking-wide" style={{ color: 'var(--text-primary)' }}>Company</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="/about" style={linkStyle}>About us</Link></li>
              <li><Link href="/contact" style={linkStyle}>Contact us</Link></li>
              <li><Link href="/terms" style={linkStyle}>Terms</Link></li>
              <li><Link href="/privacy" style={linkStyle}>Privacy</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-black uppercase tracking-wide" style={{ color: 'var(--text-primary)' }}>Support</h3>
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

        <div className="w-full overflow-hidden" style={{ borderTop: '2px solid var(--border-color)' }}>
          <div
            className="font-black uppercase leading-none whitespace-nowrap"
            style={{
              fontSize: 'clamp(72px, 16vw, 220px)',
              color: 'var(--text-primary)',
              //color black code: #000000
              
              fontWeight: 900,
              letterSpacing: '0',
              padding: '8px 0 var(--space-4, 16px)',
              marginTop: '-8px'
            }}
          >
            FlyFree
          </div>
        </div>

        <div className="flex flex-col gap-2 pb-6 text-xs uppercase tracking-wide sm:flex-row sm:items-center sm:justify-between" style={{ color: 'var(--text-tertiary)' }}>
          <span>&copy; {currentYear} Fly Free. All rights reserved.</span>
          <span>Secure checkout &middot; 30-day exchange support</span>
        </div>
      </div>
    </footer>
  );
}

async function parseNewsletterResponse(response: Response) {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  return { error: await response.text() };
}
