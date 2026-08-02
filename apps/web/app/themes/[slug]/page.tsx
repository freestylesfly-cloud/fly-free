import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getApiBaseUrl } from "../../lib/api";
import { HERO_MAX_WIDTH, MEDIA } from "../../lib/design";
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
      {/* THEME BANNER HERO — same 16:9 frame as the homepage carousel, so one
          uploaded crop reads identically on phone and desktop. */}
      <section className="relative">
        <div className="mx-auto w-full" style={{ maxWidth: `${HERO_MAX_WIDTH}px` }}>
          <div
            className="relative w-full overflow-hidden"
            style={{
              aspectRatio: MEDIA.themeBanner.css,
              backgroundColor: theme.primaryColor || "var(--color-primary)",
            }}
          >
            {theme.bannerImageUrl && (
              <img
                src={theme.bannerImageUrl}
                alt={theme.name}
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}
            <div
              className="absolute inset-0 hidden md:block"
              style={{ background: "linear-gradient(0deg, rgba(0,0,0,.75), rgba(0,0,0,.15) 70%)" }}
            />

            <div className="absolute inset-0 z-10 hidden flex-col justify-end px-8 py-10 md:flex">
              <ThemeBannerCopy theme={theme} onDark />
            </div>
          </div>

          {/* Phones read the copy under the banner rather than over it. */}
          <div className="px-5 py-8 md:hidden" style={{ backgroundColor: "var(--bg-secondary)" }}>
            <ThemeBannerCopy theme={theme} />
          </div>
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

function ThemeBannerCopy({ theme, onDark = false }: { theme: any; onDark?: boolean }) {
  const muted = onDark ? "rgba(255,255,255,.85)" : "var(--text-secondary)";

  return (
    <>
      <nav
        className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wide"
        style={{ color: onDark ? "rgba(255,255,255,.7)" : "var(--text-secondary)" }}
      >
        <Link href="/" className="hover:opacity-100">Home</Link>
        <span>/</span>
        <Link href="/products" className="hover:opacity-100">Themes</Link>
        <span>/</span>
        <span style={{ color: onDark ? "#fff" : "var(--text-primary)" }}>{theme.name}</span>
      </nav>

      <h1
        className="text-4xl font-black uppercase leading-none md:text-6xl"
        style={{ color: onDark ? "#fff" : "var(--text-primary)" }}
      >
        {theme.name}
      </h1>

      {(theme.story || theme.description) && (
        <p className="mt-4 max-w-2xl text-base leading-relaxed md:text-lg" style={{ color: muted }}>
          {theme.story || theme.description}
        </p>
      )}

      <a
        href="#collection"
        className="mt-6 inline-flex items-center gap-2 rounded-lg px-6 py-3.5 text-sm font-black uppercase tracking-wide text-white transition hover:opacity-90"
        style={{ backgroundColor: "var(--color-primary)" }}
      >
        Explore Collection <ArrowRight size={18} />
      </a>
    </>
  );
}
