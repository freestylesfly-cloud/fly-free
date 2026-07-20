import { ExternalLink, Instagram, Share2, Star } from "lucide-react";
import { getApiBaseUrl } from "../lib/api";

const API_BASE = getApiBaseUrl();

export const metadata = {
  title: "Fly Free Influencers",
  description: "Creators and influencers working with Fly Free.",
};

export const dynamic = "force-dynamic";

async function getInfluencers() {
  try {
    const response = await fetch(`${API_BASE}/influencers`, { cache: "no-store" });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : data?.data || [];
  } catch {
    return [];
  }
}

export default async function InfluencersPage() {
  const influencers = await getInfluencers();

  return (
    <main style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}>
      <section className="border-b px-5 py-16" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-secondary)" }}>
        <div className="mx-auto max-w-7xl">
          <div className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-black" style={{ borderColor: "var(--border-color)", color: "var(--color-primary)" }}>
            <Share2 size={16} /> Creator circle
          </div>
          <h1 className="mt-5 text-4xl font-black md:text-6xl">Influencers</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8" style={{ color: "var(--text-secondary)" }}>
            Meet the creators sharing Fly Free drops, referral offers, styling ideas, and campaign stories.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {influencers.map((item: any) => (
            <article key={item.id} className="overflow-hidden rounded border" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-secondary)" }}>
              <div className="aspect-[4/3] bg-black/5">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Star size={40} style={{ color: "var(--text-tertiary)" }} />
                  </div>
                )}
              </div>
              <div className="space-y-4 p-5">
                <div>
                  <h2 className="text-xl font-black">{item.name}</h2>
                  <p className="text-sm font-bold" style={{ color: "var(--text-secondary)" }}>{item.socialHandle || item.email}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {item.code && <span className="rounded px-3 py-1 text-xs font-black text-white" style={{ backgroundColor: "var(--color-primary)" }}>{item.code}</span>}
                  {item.buyerDiscountPercent ? <span className="rounded px-3 py-1 text-xs font-black" style={{ backgroundColor: "var(--bg-tertiary)" }}>{item.buyerDiscountPercent}% off</span> : null}
                  {item.followers ? <span className="rounded px-3 py-1 text-xs font-black" style={{ backgroundColor: "var(--bg-tertiary)" }}>{Number(item.followers).toLocaleString()} followers</span> : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  {item.instagramUrl && (
                    <a href={item.instagramUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded border px-3 py-2 text-sm font-bold" style={{ borderColor: "var(--border-color)" }}>
                      <Instagram size={16} /> Instagram
                    </a>
                  )}
                  {item.linkKey && (
                    <a href={`/products?ref=${item.linkKey}`} className="inline-flex items-center gap-2 rounded border px-3 py-2 text-sm font-bold" style={{ borderColor: "var(--border-color)" }}>
                      <ExternalLink size={16} /> Shop link
                    </a>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
