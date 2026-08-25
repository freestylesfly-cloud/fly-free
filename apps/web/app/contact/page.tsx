import Link from "next/link";
import { HelpCircle, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { getApiBaseUrl } from "../lib/api";

const API_BASE = getApiBaseUrl();

export const metadata = {
  title: "Contact Fly Free",
  description: "Contact Fly Free for orders, returns, custom designs, and influencer partnerships.",
};

export const dynamic = "force-dynamic";

async function getContactData() {
  try {
    const [pageResponse, homeResponse] = await Promise.all([
      fetch(`${API_BASE}/cms/pages/contact-us`, { cache: "no-store" }),
      fetch(`${API_BASE}/cms/home`, { cache: "no-store" })
    ]);
    const page = pageResponse.ok ? await pageResponse.json() : null;
    const home = homeResponse.ok ? await homeResponse.json() : null;
    return { page, settings: home?.settings || {} };
  } catch {
    return { page: null, settings: {} };
  }
}

export default async function ContactPage() {
  const { page, settings } = await getContactData();
  // Admin → Settings is the only source. A channel that is not configured is
  // left off the page instead of shown as a placeholder nobody answers.
  const email = String(settings.supportEmail || settings.contactEmail || "").trim();
  const phone = String(settings.contactPhone || "").trim();
  const address = String(settings.businessAddress || "").trim();
  const whatsapp = String(settings.socialLinks?.whatsapp || "").trim();
  const title = String(page?.title || "Contact Us").trim();
  const contactRows = [
    email && { icon: <Mail size={20} />, label: "Support Email", value: email, href: `mailto:${email}` },
    phone && { icon: <Phone size={20} />, label: "Customer Support Phone", value: phone, href: `tel:${phone.replace(/[^\d+]/g, "")}` },
    whatsapp && { icon: <MessageCircle size={20} />, label: "WhatsApp", value: "Chat with us", href: whatsappHref(whatsapp) },
    address && { icon: <MapPin size={20} />, label: "Business Address", value: address, href: "" }
  ].filter(Boolean) as Array<{ icon: React.ReactNode; label: string; value: string; href: string }>;

  return (
    <main style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}>
      <section className="border-b px-5 py-12 md:py-16" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-secondary)" }}>
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_380px] lg:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>Contact</p>
            <h1 className="mt-2 text-4xl font-black uppercase md:text-6xl">{title}</h1>
            {page?.content && (
              <div className="mt-5 max-w-2xl space-y-3 whitespace-pre-line text-base leading-8 md:text-lg" style={{ color: "var(--text-secondary)" }}>
                {page.content}
              </div>
            )}
          </div>

          <div className="border p-5" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-primary)" }}>
            <h2 className="text-xl font-black">Need order help?</h2>
            <p className="mt-2 text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
              Use Help & FAQs for returns, delivery, exchange questions, or to send a support request to admin.
            </p>
            <Link
              href="/help-faq"
              className="mt-5 inline-flex w-full items-center justify-center gap-2 px-4 py-3 text-sm font-black uppercase text-white"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              <HelpCircle size={18} />
              Open Help & FAQs
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-10 md:py-14">
        <h2 className="border-b pb-3 text-2xl font-black uppercase" style={{ borderColor: "var(--border-color)" }}>
          Fly Free Contact Details
        </h2>
        {contactRows.length > 0 ? (
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {contactRows.map((row) => {
              const content = (
                <div className="flex min-h-24 gap-4 border p-4 transition hover:-translate-y-0.5" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-secondary)" }}>
                  <span className="grid h-10 w-10 shrink-0 place-items-center" style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 12%, transparent)", color: "var(--color-primary)" }}>
                    {row.icon}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-black uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>{row.label}</span>
                    <span className="mt-1 block break-words text-base font-black" style={{ color: "var(--text-primary)" }}>{row.value}</span>
                  </span>
                </div>
              );

              return row.href ? (
                <a key={row.label} href={row.href} target={row.href.startsWith("http") ? "_blank" : undefined} rel={row.href.startsWith("http") ? "noreferrer" : undefined}>
                  {content}
                </a>
              ) : (
                <div key={row.label}>{content}</div>
              );
            })}
          </div>
        ) : (
          <p className="mt-5 font-semibold" style={{ color: "var(--text-secondary)" }}>
            Contact details are managed from Admin Settings.
          </p>
        )}
      </section>
    </main>
  );
}

function whatsappHref(value: string) {
  if (/^https?:\/\//i.test(value)) return value;
  const digits = value.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits.length === 10 ? `91${digits}` : digits}` : "#";
}
