'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, MapPin, MessageCircle, Paintbrush, ShieldCheck, Sparkles, Truck } from 'lucide-react';
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

  const storyPages = pageLinks.filter((page) => ['about-us', 'contact-us'].includes(page.slug));
  const storySlugs = new Set(storyPages.map((page) => page.slug));
  const assistPages = pageLinks.filter((page) => !storySlugs.has(page.slug));
  const companyLinks = withRouteLinks(storyPages, [
    { route: '/blogs', title: 'Blogs', slug: 'blogs' },
    { route: '/community', title: 'Community', slug: 'community' }
  ]);
  const shopColumnLinks = withRouteLinks([
    { route: '/products', title: 'All products', slug: 'all-products' },
    ...shopLinks.slice(0, 6).map((category) => ({
      route: `/products?category=${encodeURIComponent(category.slug)}`,
      title: category.name,
      slug: category.slug
    }))
  ], []);
  const helpLinks = withRouteLinks(assistPages, [{ route: '/help-faq', title: 'Help & FAQs', slug: 'faqs' }]);
  const policies = assistPages;

  return (
    <footer style={{ backgroundColor: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)' }} className="mt-14 pb-20 md:pb-0">
      <div className="grid gap-7 px-5 py-10 text-center sm:grid-cols-2 lg:grid-cols-4 lg:px-10 lg:py-14" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <TrustFeature icon={<Truck size={28} />} title="Delivery Support" text="Shipping offers are applied when eligible, with order updates shared after dispatch." />
        <TrustFeature icon={<Paintbrush size={28} />} title="Custom Prints" text="Share your idea or reference and we will help turn it into a wearable design." />
        <TrustFeature icon={<Sparkles size={28} />} title="Made With Care" text="Every print is checked for clean artwork, comfortable fabric, and lasting finish." />
        <TrustFeature icon={<ShieldCheck size={28} />} title="Secure Payments" text="Online payments are processed through trusted, encrypted payment gateways." />
      </div>

      <div className="grid w-full gap-10 px-5 py-12 md:grid-cols-2 lg:grid-cols-[1.25fr_0.8fr_0.9fr_0.9fr_1.1fr] lg:gap-8 lg:px-10 lg:py-14 xl:px-16">
        <div className="min-w-0">
          <Link href="/" className="inline-flex items-center">
            <Logo size="lg" showText={false} />
          </Link>
          {support.footerText && (
            <p className="mt-3 max-w-sm text-base leading-7" style={{ color: 'var(--text-secondary)' }}>
              {support.footerText}
            </p>
          )}
          {support.address && (
            <div className="mt-2 flex gap-2 text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>
              <MapPin size={15} className="mt-1 shrink-0" />
              <span>{support.address}</span>
            </div>
          )}
          <SocialLinks links={support.socialLinks} whatsappMessage={support.whatsappMessage} />
        </div>

        <FooterLinkColumn title="Shop" links={shopColumnLinks} compact />

        <FooterLinkColumn title="Support" links={helpLinks} compact />

        <FooterLinkColumn title="Company" links={companyLinks} compact />

        <div className="min-w-0">
          <FooterHeading>{support.newsletterTitle || 'Newsletters'}</FooterHeading>
          {support.newsletterText && (
            <p className="mt-2 truncate text-sm leading-6" title={support.newsletterText} style={{ color: 'var(--text-secondary)' }}>
              {support.newsletterText}
            </p>
          )}
          <form onSubmit={handleSubscribe} className="mt-4 flex max-w-md border bg-white/30" style={{ borderColor: 'var(--text-tertiary)' }}>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email"
              className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm outline-none"
            />
            <button type="submit" disabled={loading} className="grid w-12 shrink-0 place-items-center transition hover:bg-black/5 disabled:opacity-60" aria-label="Subscribe">
              <ArrowRight size={18} />
            </button>
          </form>
          {message && <p className="mt-3 text-sm font-bold" style={{ color: 'var(--color-primary)' }}>{message}</p>}
        </div>
      </div>

      <div className="w-full overflow-hidden border-y" style={{ borderColor: 'var(--border-color)' }}>
        <p
          className="select-none whitespace-nowrap px-5 pb-3 pt-4 text-center font-black uppercase leading-none"
          style={{
            color: 'color-mix(in srgb, var(--color-primary) 42%, var(--text-primary))',
            fontSize: 'clamp(64px, 17vw, 220px)',
            letterSpacing: '0'
          }}
        >
          FlyFree
        </p>
      </div>

      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-7 text-sm sm:flex-row sm:items-center sm:justify-between lg:px-8" style={{ color: 'var(--text-secondary)' }}>
        <p>&copy; {currentYear} Fly Free | Northeast India</p>
        <div className="flex flex-wrap gap-x-2 gap-y-1 sm:justify-end">
          {policies.map((page, index) => (
            <span key={page.slug} className="inline-flex items-center gap-2">
              {index > 0 && <span aria-hidden>&middot;</span>}
              <Link href={page.route}>{page.title}</Link>
            </span>
          ))}
        </div>
      </div>

      <div className="px-5 py-8 text-center" style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 6%, var(--bg-primary))' }}>
        <p className="text-sm font-black uppercase tracking-wide">Completely safe and secure payment method</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <PaymentLogos />
        </div>
      </div>
    </footer>
  );
}

function TrustFeature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="mx-auto flex h-full max-w-[270px] flex-col items-center">
      <div className="flex h-12 w-12 items-center justify-center" style={{ color: 'var(--text-primary)' }}>
        {icon}
      </div>
      <h3 className="mt-4 min-h-7 text-lg font-black uppercase leading-tight sm:text-xl" style={{ color: 'var(--text-primary)' }}>{title}</h3>
      <p className="mt-2 text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>{text}</p>
    </div>
  );
}

function FooterLinkColumn({ title, links, compact = false }: { title: string; links: Array<{ route: string; title: string; slug: string }>; compact?: boolean }) {
  return (
    <div>
      <FooterHeading>{title}</FooterHeading>
      <ul className={compact ? 'mt-4 grid grid-cols-2 gap-x-5 gap-y-2 text-sm sm:grid-cols-1' : 'mt-5 space-y-3 text-lg'}>
        {links.map((link) => (
          <li key={link.slug}>
            <Link href={link.route} className="transition hover:opacity-70" style={{ color: 'var(--text-secondary)' }}>{link.title}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FooterHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
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
    { key: 'instagram', label: 'Instagram', href: cleanUrl(links.instagram), icon: <SocialIcon name="instagram" /> },
    { key: 'facebook', label: 'Facebook', href: cleanUrl(links.facebook), icon: <SocialIcon name="facebook" /> },
    { key: 'whatsapp', label: 'WhatsApp', href: whatsappHref(links.whatsapp, whatsappMessage), icon: <MessageCircle size={16} /> },
    { key: 'twitter', label: 'Twitter', href: cleanUrl(links.twitter), icon: <SocialIcon name="x" /> },
    { key: 'youtube', label: 'YouTube', href: cleanUrl(links.youtube), icon: <SocialIcon name="youtube" /> }
  ].filter((item) => item.href);

  if (!items.length) return null;

  return (
    <div className="mt-8 flex flex-wrap gap-3">
      {items.map((item) => (
        <a
          key={item.key}
          href={item.href || '#'}
          target="_blank"
          rel="noreferrer"
          aria-label={item.label}
          title={item.label}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full transition hover:opacity-75"
          style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
        >
          {item.icon}
        </a>
      ))}
    </div>
  );
}

function SocialIcon({ name }: { name: 'facebook' | 'instagram' | 'x' | 'youtube' }) {
  if (name === 'facebook') {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
        <path d="M14 8.4V6.7c0-.8.6-1 1.1-1H17V2.4c-.9-.1-1.8-.2-2.7-.2-2.7 0-4.5 1.7-4.5 4.7v1.5H7v3.7h2.8V22H14v-9.9h2.8l.5-3.7H14Z" />
      </svg>
    );
  }

  if (name === 'instagram') {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  if (name === 'youtube') {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
        <path d="M21.6 7.2a3 3 0 0 0-2.1-2.1C17.7 4.6 12 4.6 12 4.6s-5.7 0-7.5.5a3 3 0 0 0-2.1 2.1A31 31 0 0 0 2 12a31 31 0 0 0 .4 4.8 3 3 0 0 0 2.1 2.1c1.8.5 7.5.5 7.5.5s5.7 0 7.5-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 22 12a31 31 0 0 0-.4-4.8ZM10 15.4V8.6l6 3.4-6 3.4Z" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
      <path d="M13.9 10.5 21.3 2h-1.8l-6.4 7.3L8 2H2l7.8 11.3L2 22h1.8l6.8-7.7L16 22h6l-8.1-11.5Zm-2.4 2.7-.8-1.1L4.4 3.3h2.8l5 7 .8 1.1 6.6 9.3h-2.8l-5.3-7.5Z" />
    </svg>
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
    <>
      {logos.map((logo) => (
        <span key={logo.src} className="grid h-9 w-16 place-items-center bg-white shadow-sm ring-1 ring-black/5">
          <img src={logo.src} alt={logo.alt} className="max-h-5 max-w-12 object-contain" />
        </span>
      ))}
     
    </>
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

function withRouteLinks(baseLinks: FooterPage[], extraLinks: FooterPage[]) {
  const existing = new Set(baseLinks.flatMap((link) => [link.slug, link.route, link.title.toLowerCase()]));
  return [
    ...baseLinks,
    ...extraLinks.filter((link) => !existing.has(link.slug) && !existing.has(link.route) && !existing.has(link.title.toLowerCase()))
  ];
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
