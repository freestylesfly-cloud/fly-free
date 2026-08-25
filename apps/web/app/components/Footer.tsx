'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Facebook, Instagram, Mail, MapPin, MessageCircle, Phone, Send, Twitter, Youtube } from 'lucide-react';
import { Logo } from './Logo';
import { getApiBaseUrl } from '../lib/api';

type FooterSupport = {
  email: string;
  phone: string;
  address: string;
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

type FooterCategory = {
  id?: string;
  name: string;
  slug: string;
};

type FooterPage = {
  id?: string;
  slug: string;
  title: string;
  route: string;
};

export function Footer() {
  const currentYear = new Date().getFullYear();
  const linkStyle = { color: 'var(--text-secondary)' };
  const [shopLinks, setShopLinks] = useState<FooterCategory[]>([]);
  const [pageLinks, setPageLinks] = useState<FooterPage[]>([]);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [support, setSupport] = useState<FooterSupport>({
    email: '',
    phone: '',
    address: '',
    footerText: '',
    newsletterTitle: '',
    newsletterText: '',
    newsletterSuccessMessage: '',
    whatsappMessage: '',
    socialLinks: {}
  });

  useEffect(() => {
    fetch(`${getApiBaseUrl()}/cms/footer`, { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : null))
      .then((footer) => {
        const settings = footer?.settings || {};
        setSupport({
          email: settings.supportEmail || settings.contactEmail || '',
          phone: settings.contactPhone || '',
          address: settings.businessAddress || '',
          footerText: settings.footerText || settings.appDescription || '',
          newsletterTitle: settings.newsletterTitle || '',
          newsletterText: settings.newsletterText || '',
          newsletterSuccessMessage: settings.newsletterSuccessMessage || '',
          whatsappMessage: settings.whatsappMessage || '',
          socialLinks: settings.socialLinks || {}
        });
        setShopLinks(Array.isArray(footer?.categories) ? footer.categories.filter(hasLinkNameAndSlug) : []);
        setPageLinks(Array.isArray(footer?.pages) ? footer.pages.filter(hasPageRoute) : []);
      })
      .catch(() => {
        /* Admin-managed fields stay blank if CMS is unavailable. */
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

      setMessage(data.message || support.newsletterSuccessMessage || '');
      setEmail('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not subscribe right now');
    } finally {
      setLoading(false);
    }
  }

  const pageBySlug = new Map(pageLinks.map((page) => [page.slug, page]));
  const assistPages = [
    pageBySlug.get('return-exchange-policy'),
    pageBySlug.get('terms-and-conditions'),
    pageBySlug.get('privacy-policy'),
    pageBySlug.get('shipping-policy')
  ].filter(Boolean) as FooterPage[];
  const storyPages = [
    pageBySlug.get('about-us'),
    pageBySlug.get('contact-us')
  ].filter(Boolean) as FooterPage[];

  return (
    <footer style={{ backgroundColor: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)' }} className="mt-14 pb-16 md:pb-0">
      <div className="mx-auto max-w-7xl px-5 py-8 md:py-10">
        <div
          className="grid gap-6 p-5 md:grid-cols-[0.8fr_1.2fr] md:p-7"
          style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-tertiary))', color: 'var(--bg-secondary)' }}
        >
          <div className="flex flex-col justify-between gap-4">
            <Link href="/" className="inline-flex items-center gap-3">
              <Logo size="lg" showText={false} />
            </Link>
            {support.footerText && (
              <p className="max-w-sm text-sm leading-6 text-white/70">
                {support.footerText}
              </p>
            )}
          </div>

          <div>
            {support.newsletterTitle && (
              <h2 className="text-2xl font-black leading-tight md:text-4xl">
                {support.newsletterTitle}
              </h2>
            )}
            {support.newsletterText && (
              <p className="mt-2 max-w-xl text-sm text-white/70">
                {support.newsletterText}
              </p>
            )}
            <form onSubmit={handleSubscribe} className="mt-5 grid gap-2 sm:grid-cols-[1fr_auto]">
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@email.com"
                className="min-w-0 px-4 py-3 text-base outline-none"
                style={{ border: '1px solid rgba(255,255,255,0.26)', backgroundColor: 'rgba(255,255,255,0.12)', color: 'white' }}
              />
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap px-5 py-3 text-sm font-bold uppercase tracking-wide transition hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: 'white', color: 'var(--color-primary)' }}
              >
                <Send size={16} />
                {loading ? 'Joining...' : 'Subscribe'}
              </button>
            </form>
            {message && <p className="mt-3 text-sm font-bold text-white">{message}</p>}
          </div>
        </div>

        <div className="grid gap-8 py-9 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <FooterHeading>Shop</FooterHeading>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link href="/products" style={linkStyle}>All products</Link></li>
              {shopLinks.map((category) => (
                <li key={category.id || category.slug}>
                  <Link href={`/products?category=${encodeURIComponent(category.slug)}`} style={linkStyle}>
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <FooterHeading>Support</FooterHeading>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link href="/help-faq" style={linkStyle}>Help & FAQs</Link></li>
              {assistPages.map((page) => (
                <li key={page.id || page.slug}>
                  <Link href={page.route} style={linkStyle}>{assistLabel(page)}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <FooterHeading>Company</FooterHeading>
            <ul className="mt-3 space-y-2 text-sm">
              {storyPages.map((page) => (
                <li key={page.id || page.slug}>
                  <Link href={page.route} style={linkStyle}>{page.title}</Link>
                </li>
              ))}
              <li><Link href="/blogs" style={linkStyle}>Blogs</Link></li>
              <li><Link href="/community" style={linkStyle}>Community</Link></li>
            </ul>
          </div>

          <div>
            <FooterHeading>Get in Touch</FooterHeading>
            <ul className="mt-3 space-y-3 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
              {support.phone && (
                <li className="flex gap-2"><Phone size={16} /> <a href={`tel:${support.phone.replace(/[^\d+]/g, '')}`}>{support.phone}</a></li>
              )}
              {support.email && (
                <li className="flex gap-2"><Mail size={16} /> <a href={`mailto:${support.email}`}>{support.email}</a></li>
              )}
              {support.address && (
                <li className="flex gap-2"><MapPin size={16} /> <span>{support.address}</span></li>
              )}
              <SocialLinks links={support.socialLinks} whatsappMessage={support.whatsappMessage} />
            </ul>
          </div>
        </div>

        <div className="w-full overflow-hidden" style={{ borderTop: '1px solid var(--border-color)' }}>
          <div
            className="font-black uppercase leading-none whitespace-nowrap"
            style={{
              fontSize: 'clamp(72px, 16vw, 220px)',
              color: 'color-mix(in srgb, var(--color-primary) 18%, var(--text-primary))',
              fontWeight: 900,
              letterSpacing: '0',
              padding: '0 0 10px',
              marginTop: '-4px'
            }}
          >
            FlyFree
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 pb-5 text-xs uppercase tracking-wide sm:flex-row sm:items-center sm:justify-between" style={{ color: 'var(--text-tertiary)' }}>
          <span>&copy; {currentYear} Fly Free. All rights reserved.</span>
          <PaymentLogos />
        </div>
      </div>
    </footer>
  );
}

function FooterHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="border-b pb-2 text-sm font-black uppercase tracking-wide" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
      {children}
    </h3>
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
          style={{ border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
        >
          {item.icon}
        </a>
      ))}
    </li>
  );
}

function PaymentLogos() {
  const logos = [
    { src: '/payments/visa.svg', alt: 'Visa' },
    { src: '/payments/mastercard.svg', alt: 'Mastercard' },
    { src: '/payments/upi.svg', alt: 'UPI' },
    { src: '/payments/gpay.svg', alt: 'Google Pay' },
    { src: '/payments/razorpay.svg', alt: 'Razorpay' }
  ];

  return (
    <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
      {logos.map((logo) => (
        <span key={logo.src} className="grid h-7 w-14 place-items-center rounded bg-white shadow-sm ring-1 ring-black/5">
          <img src={logo.src} alt={logo.alt} className="max-h-4 max-w-11 object-contain" />
        </span>
      ))}
    </div>
  );
}

function cleanUrl(value?: string) {
  const trimmed = String(value || '').trim();
  return trimmed || null;
}

function hasLinkNameAndSlug(item: any): item is FooterCategory {
  return Boolean(String(item?.name || '').trim() && String(item?.slug || '').trim());
}

function hasPageRoute(item: any): item is FooterPage {
  return Boolean(String(item?.title || '').trim() && String(item?.route || '').trim().startsWith('/'));
}

function assistLabel(page: FooterPage) {
  if (page.slug === 'return-exchange-policy') return 'Returns, Exchanges, and Cancellations';
  if (page.slug === 'terms-and-conditions') return 'Terms of Sale';
  return page.title;
}

function whatsappHref(value?: string, message = '') {
  const trimmed = String(value || '').trim();
  if (!trimmed) return null;

  const textValue = String(message || '').trim();

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      if (textValue && !url.searchParams.has('text')) {
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
  return textValue ? `https://wa.me/${phone}?text=${encodeURIComponent(textValue)}` : `https://wa.me/${phone}`;
}
