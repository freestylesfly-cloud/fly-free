import { Mail, MessageCircle, Phone } from 'lucide-react';
import { getApiBaseUrl } from '../lib/api';
import { HelpRequestForm } from './HelpRequestForm';

type FaqItem = {
  id: string;
  category: string;
  question: string;
  answer: string;
};

const API_BASE = getApiBaseUrl();

export const metadata = {
  title: 'Help & FAQs | Fly Free',
  description: 'Get help with Fly Free orders, delivery, exchanges, payments, offers, and support.',
};

export const dynamic = 'force-dynamic';

async function getHelpData() {
  try {
    const [faqResponse, footerResponse] = await Promise.all([
      fetch(`${API_BASE}/cms/faqs`, { cache: 'no-store' }),
      fetch(`${API_BASE}/cms/footer`, { cache: 'no-store' }),
    ]);
    return {
      faqs: faqResponse.ok ? await faqResponse.json() : [],
      settings: footerResponse.ok ? (await footerResponse.json())?.settings || {} : {},
    };
  } catch {
    return { faqs: [], settings: {} };
  }
}

export default async function HelpFaqPage() {
  const { faqs, settings } = await getHelpData();
  const rows = Array.isArray(faqs) ? (faqs as FaqItem[]) : [];
  const grouped = groupFaqs(rows);
  const email = String(settings.supportEmail || settings.contactEmail || '').trim();
  const phone = String(settings.contactPhone || '').trim();
  const whatsapp = String(settings.socialLinks?.whatsapp || '').trim();

  return (
    <main style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <section className="border-b px-5 py-12 md:py-16" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-black uppercase tracking-wide" style={{ color: 'var(--color-primary)' }}>Support</p>
          <h1 className="mt-2 text-4xl font-black uppercase md:text-6xl">Help & FAQs</h1>
          <p className="mt-4 max-w-2xl text-base leading-7" style={{ color: 'var(--text-secondary)' }}>
            Send a support request or find answers for delivery, exchanges, payments, and offers.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-7 px-5 py-10 lg:grid-cols-[360px_1fr]">
        <aside className="h-fit border p-5" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
          <h2 className="text-xl font-black uppercase">Need Help?</h2>
          <p className="mt-2 text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>
            Your message creates an admin notification, so the team can follow up with you.
          </p>
          <div className="mt-5 space-y-3 border-b pb-5 text-sm font-semibold" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
            {phone && <a className="flex gap-3" href={`tel:${phone.replace(/[^\d+]/g, '')}`}><Phone size={18} /> <span>Customer Support: {phone}</span></a>}
            {email && <a className="flex gap-3" href={`mailto:${email}`}><Mail size={18} /> <span>{email}</span></a>}
            {whatsapp && <a className="flex gap-3" href={whatsappHref(whatsapp)} target="_blank" rel="noreferrer"><MessageCircle size={18} /> <span>WhatsApp support</span></a>}
          </div>

          <HelpRequestForm />
        </aside>

        <div className="space-y-8">
          {grouped.length === 0 ? (
            <div className="border p-6" style={{ borderColor: 'var(--border-color)' }}>
              <h2 className="text-2xl font-black">FAQs are coming soon.</h2>
              <p className="mt-2 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                Add questions from Admin &gt; Help & FAQs.
              </p>
            </div>
          ) : grouped.map((group) => (
            <section key={group.category}>
              <h2 className="border-b pb-4 text-2xl font-black uppercase" style={{ borderColor: 'var(--border-color)' }}>{group.category}</h2>
              <div>
                {group.items.map((item) => (
                  <details key={item.id} className="group border-b py-5" style={{ borderColor: 'var(--border-color)' }}>
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-black">
                      {item.question}
                      <span className="text-2xl group-open:rotate-45">+</span>
                    </summary>
                    <p className="mt-3 whitespace-pre-line leading-7" style={{ color: 'var(--text-secondary)' }}>{item.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}

function groupFaqs(items: FaqItem[]) {
  const byCategory = new Map<string, FaqItem[]>();
  items.forEach((item) => {
    const category = item.category || 'Support';
    byCategory.set(category, [...(byCategory.get(category) || []), item]);
  });
  return [...byCategory.entries()].map(([category, groupItems]) => ({ category, items: groupItems }));
}

function whatsappHref(value: string) {
  if (/^https?:\/\//i.test(value)) return value;
  const digits = value.replace(/\D/g, '');
  return digits ? `https://wa.me/${digits.length === 10 ? `91${digits}` : digits}` : '#';
}
