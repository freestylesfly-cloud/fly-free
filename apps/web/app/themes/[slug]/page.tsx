import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getApiBaseUrl } from "../../lib/api";
import { MEDIA } from "../../lib/design";
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
      {/* THEME BANNER — identical treatment to the homepage hero: full-bleed
          16:9, copy overlaid at the top on every breakpoint. */}
      <section
        className="relative w-full overflow-hidden"
        style={{
          aspectRatio: MEDIA.themeBanner.css,
          backgroundColor: theme.primaryColor || "var(--color-primary)",
        }}
      >
        {theme.bannerImageUrl && (
          <img src={theme.bannerImageUrl} alt={theme.name} className="absolute inset-0 h-full w-full object-cover" />
        )}
        <div
          className="absolute inset-x-0 top-0 h-2/3"
          style={{ background: "linear-gradient(180deg, rgba(0,0,0,.7), rgba(0,0,0,0))" }}
        />
        <div className="absolute inset-x-0 top-0 z-10 px-4 pt-4 sm:px-10 sm:pt-10 lg:px-16 lg:pt-14">
          <ThemeBannerCopy theme={theme} />
        </div>
      </section>

      {/* The story is dropped from the phone banner to keep the art clean. */}
      {(theme.story || theme.description) && (
        <div className="px-4 pt-6 sm:hidden">
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {theme.story || theme.description}
          </p>
        </div>
      )}

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

function ThemeBannerCopy({ theme }: { theme: any }) {
  return (
    <>
      <nav className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-white/70 sm:mb-4 sm:text-xs">
        <Link href="/" className="hover:text-white">Home</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-white">Themes</Link>
        <span>/</span>
        <span className="text-white">{theme.name}</span>
      </nav>

      <h1
        className="max-w-3xl font-black uppercase leading-[0.95] text-white"
        style={{ fontSize: "clamp(20px, 5.5vw, 68px)", letterSpacing: "-0.02em" }}
      >
        {theme.name}
      </h1>

      {/* Story is long — phones get the banner clean and read it below. */}
      {(theme.story || theme.description) && (
        <p className="mt-4 hidden max-w-xl text-base leading-relaxed text-white/85 sm:block lg:text-lg">
          {theme.story || theme.description}
        </p>
      )}

      <a
        href="#collection"
        className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 text-[11px] font-black uppercase tracking-wide text-white transition hover:opacity-90 sm:mt-6 sm:px-6 sm:py-3.5 sm:text-sm"
        style={{ backgroundColor: "var(--color-primary)" }}
      >
        Explore <ArrowRight size={14} />
      </a>
    </>
  );
}
