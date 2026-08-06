import { Mail, MapPin, Phone } from "lucide-react";
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

  return (
    <main style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}>
      <section className="border-b px-5 py-16" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-secondary)" }}>
        <div className="mx-auto max-w-5xl">
          <h1 className="text-4xl font-black md:text-6xl">Contact Us</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8" style={{ color: "var(--text-secondary)" }}>
            {page?.content || "Contact Fly Free for orders, returns, custom designs, bulk orders, and influencer partnerships."}
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-4 px-5 py-12 md:grid-cols-3">
        {email && (
          <a href={`mailto:${email}`} className="rounded border p-5 transition hover:-translate-y-1" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-secondary)" }}>
            <Mail size={24} style={{ color: "var(--color-primary)" }} />
            <h2 className="mt-4 font-black">Email</h2>
            <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>{email}</p>
          </a>
        )}
        {phone && (
          <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="rounded border p-5 transition hover:-translate-y-1" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-secondary)" }}>
            <Phone size={24} style={{ color: "var(--color-primary)" }} />
            <h2 className="mt-4 font-black">Phone</h2>
            <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>{phone}</p>
          </a>
        )}
        {address && (
          <div className="rounded border p-5" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-secondary)" }}>
            <MapPin size={24} style={{ color: "var(--color-primary)" }} />
            <h2 className="mt-4 font-black">Address</h2>
            <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>{address}</p>
          </div>
        )}
      </section>
    </main>
  );
}
