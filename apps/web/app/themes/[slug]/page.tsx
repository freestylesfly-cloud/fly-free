import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getApiBaseUrl } from "../../lib/api";
import { ThemeProductGrid } from "./ThemeProductGrid";

const API_BASE = getApiBaseUrl();

export default async function ThemePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let response: Response;

  try {
    response = await fetch(`${API_BASE}/cms/themes/${slug}`, { cache: "no-store" });
  } catch (error) {
    console.error(`Error fetching theme ${slug}:`, error);
    notFound();
  }

  if (!response.ok) notFound();

  const theme = await response.json();
  if (!theme?.id) notFound();

  const products = theme.products || [];

  return (
    <main style={{ backgroundColor: "var(--bg-primary)" }}>
      {/* THEME BANNER HERO */}
      <section
        className="relative flex min-h-[420px] items-end overflow-hidden md:min-h-[520px]"
        style={{
          backgroundImage: theme.bannerImageUrl ? `url('${theme.bannerImageUrl}')` : undefined,
          backgroundColor: theme.primaryColor || "var(--color-primary)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0" style={{ background: "linear-gradient(0deg, rgba(0,0,0,.75), rgba(0,0,0,.15) 70%)" }} />

        <div className="relative z-10 mx-auto w-full max-w-7xl px-5 py-14">
          <nav className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-white/70">
            <Link href="/" className="hover:text-white">Home</Link>
            <span>/</span>
            <Link href="/products" className="hover:text-white">Themes</Link>
            <span>/</span>
            <span className="text-white">{theme.name}</span>
          </nav>

          <h1 className="text-5xl font-black uppercase leading-none text-white md:text-7xl">{theme.name}</h1>

          {(theme.story || theme.description) && (
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/85 md:text-lg">
              {theme.story || theme.description}
            </p>
          )}

          <a
            href="#collection"
            className="mt-8 inline-flex items-center gap-2 rounded-lg px-7 py-4 text-sm font-black uppercase tracking-wide text-white transition hover:opacity-90"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            Explore Collection <ArrowRight size={18} />
          </a>
        </div>
      </section>

      {/* PRODUCTS */}
      <section id="collection" className="mx-auto max-w-7xl px-5 py-14 md:py-20">
        <h2 className="mb-8 text-3xl font-black uppercase" style={{ color: "var(--text-primary)" }}>
          Products in this theme
        </h2>

        {products.length === 0 ? (
          <div
            className="rounded-lg border p-12 text-center"
            style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-secondary)" }}
          >
            <p className="font-bold" style={{ color: "var(--text-primary)" }}>No products in this theme yet</p>
            <Link
              href="/products"
              className="mt-6 inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-black text-white"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              Browse all products <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <ThemeProductGrid products={products} />
        )}
      </section>
    </main>
  );
}
