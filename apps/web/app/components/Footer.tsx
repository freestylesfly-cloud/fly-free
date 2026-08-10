'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Facebook, Instagram, Mail, MapPin, MessageCircle, Phone, Twitter, Youtube } from 'lucide-react';
import { Logo } from './Logo';
import { getApiBaseUrl } from '../lib/api';
import { SUPPORT } from '../lib/design';

type FooterSupport = typeof SUPPORT & {
  footerText: string;
  newsletterTitle: string;
  newsletterText: string;
  newsletterSuccessMessage: string;
  whatsappMessage: string;
  socialLinks: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
    whatsapp?: string;
  };
};

const DEFAULT_FOOTER_TEXT = 'Freedom, culture, comfort, and self-expression through premium tees and custom-crafted apparel.';
const DEFAULT_NEWSLETTER_TITLE = 'Ready to wear your fandom?';
const DEFAULT_NEWSLETTER_TEXT = 'Get first access to new theme drops, restocks, and subscriber-only offers.';
const DEFAULT_NEWSLETTER_SUCCESS_MESSAGE = 'Thanks. You are on the drop list.';
const WHATSAPP_MESSAGE = 'Hi Fly Free, I would like more information about your products.';

export function Footer() {
  const currentYear = new Date().getFullYear();
  const linkStyle = { color: 'var(--text-secondary)' };
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  // Same source the Contact page reads, so the two can never disagree.
  const [support, setSupport] = useState<FooterSupport>({
    ...SUPPORT,
    footerText: DEFAULT_FOOTER_TEXT,
    newsletterTitle: DEFAULT_NEWSLETTER_TITLE,
    newsletterText: DEFAULT_NEWSLETTER_TEXT,
    newsletterSuccessMessage: DEFAULT_NEWSLETTER_SUCCESS_MESSAGE,
    whatsappMessage: WHATSAPP_MESSAGE,
    socialLinks: {}
  });

  useEffect(() => {
    fetch(`${getApiBaseUrl()}/cms/home`)
      .then((response) => (response.ok ? response.json() : null))
      .then((home) => {
        const settings = home?.settings || {};
        setSupport({
          email: settings.supportEmail || settings.contactEmail || SUPPORT.email,
          phone: settings.contactPhone || SUPPORT.phone,
          address: settings.businessAddress || SUPPORT.address,
          instagram: settings.socialLinks?.instagram || SUPPORT.instagram,
          footerText: settings.footerText || settings.appDescription || DEFAULT_FOOTER_TEXT,
          newsletterTitle: settings.newsletterTitle || DEFAULT_NEWSLETTER_TITLE,
          newsletterText: settings.newsletterText || DEFAULT_NEWSLETTER_TEXT,
          newsletterSuccessMessage: settings.newsletterSuccessMessage || DEFAULT_NEWSLETTER_SUCCESS_MESSAGE,
          whatsappMessage: settings.whatsappMessage || WHATSAPP_MESSAGE,
          socialLinks: settings.socialLinks || {}
        });
      })
      .catch(() => {
        /* Keep the compiled-in defaults. */
      });
  }, []);

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

      setMessage(support.newsletterSuccessMessage);
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
              {support.newsletterTitle}
            </h2>
            <p className="mt-3 max-w-md text-sm" style={{ color: 'var(--text-secondary)' }}>
              {support.newsletterText}
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
              {support.footerText}
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
              <li><Link href="/returns" style={linkStyle}>Returns &amp; exchange</Link></li>
              <li><Link href="/shipping" style={linkStyle}>Shipping</Link></li>
              <li><Link href="/terms" style={linkStyle}>Terms</Link></li>
              <li><Link href="/privacy" style={linkStyle}>Privacy</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-black uppercase tracking-wide" style={{ color: 'var(--text-primary)' }}>Support</h3>
            {/* Every row comes from Admin → Settings. Anything unset is omitted
                rather than rendered as a dead link. */}
            <ul className="mt-4 space-y-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
              {support.email && (
                <li className="flex gap-2"><Mail size={16} /> <a href={`mailto:${support.email}`}>{support.email}</a></li>
              )}
              {support.phone && (
                <li className="flex gap-2"><Phone size={16} /> <a href={`tel:${support.phone.replace(/[^\d+]/g, '')}`}>{support.phone}</a></li>
              )}
              {support.address && (
                <li className="flex gap-2"><MapPin size={16} /> <span>{support.address}</span></li>
              )}
              <SocialLinks links={support.socialLinks} whatsappMessage={support.whatsappMessage} />
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

function SocialLinks({ links, whatsappMessage }: { links: FooterSupport['socialLinks']; whatsappMessage: string }) {
  const items = [
    { key: 'instagram', label: 'Instagram', href: cleanUrl(links.instagram), icon: <Instagram size={16} /> },
    { key: 'facebook', label: 'Facebook', href: cleanUrl(links.facebook), icon: <Facebook size={16} /> },
    { key: 'whatsapp', label: 'WhatsApp', href: whatsappHref(links.whatsapp, whatsappMessage), icon: <MessageCircle size={16} /> },
    { key: 'twitter', label: 'Twitter', href: cleanUrl(links.twitter), icon: <Twitter size={16} /> },
    { key: 'youtube', label: 'YouTube', href: cleanUrl(links.youtube), icon: <Youtube size={16} /> }
  ].filter((item) => item.href);

  if (!items.length) return null;

  return (
    <li className="flex flex-wrap gap-2 pt-1">
      {items.map((item) => (
        <a
          key={item.key}
          href={item.href || '#'}
          target="_blank"
          rel="noreferrer"
          aria-label={item.label}
          title={item.label}
          className="inline-flex h-10 w-10 items-center justify-center transition hover:opacity-75"
          style={{ border: '2px solid var(--border-color)', color: 'var(--text-primary)' }}
        >
          {item.icon}
        </a>
      ))}
    </li>
  );
}

function cleanUrl(value?: string) {
  const trimmed = String(value || '').trim();
  return trimmed || null;
}

function whatsappHref(value?: string, message = WHATSAPP_MESSAGE) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return null;

  const textValue = String(message || WHATSAPP_MESSAGE).trim() || WHATSAPP_MESSAGE;
  const text = encodeURIComponent(textValue);

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      if (!url.searchParams.has('text')) {
        url.searchParams.set('text', textValue);
      }
      return url.toString();
    } catch {
      return trimmed;
    }
  }

  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return null;
  const phone = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${phone}?text=${text}`;
}
