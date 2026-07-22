import { notFound } from "next/navigation";
import { Shirt } from "lucide-react";
import { formatCurrency } from "../../lib/utils";
import { getApiBaseUrl } from "../../lib/api";

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
  if (!theme) notFound();

  return (
    <main>
      <section
        className="text-white"
        style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`, fontFamily: theme.fontFamily }}
      >
        <div className="mx-auto max-w-7xl px-5 py-20">
          <p className="text-sm font-black uppercase tracking-widest opacity-80">Fly Free theme drop</p>
          <h1 className="mt-3 text-5xl font-black md:text-7xl">{theme.name}</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 opacity-85">{theme.story || theme.description}</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14">
        <h2 className="mb-6 text-3xl font-black">Products in this theme</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {theme.products?.map((product: any) => (
            <article key={product.id} className="rounded border border-black/10 bg-white p-4">
              <div className="mb-4 flex aspect-[4/5] items-center justify-center overflow-hidden rounded bg-paper">
                {product.images?.[0]?.url ? (
                  <img src={product.images[0].url} alt={product.images[0].alt || product.name} className="h-full w-full object-cover" />
                ) : (
                  <Shirt size={54} strokeWidth={1.5} />
                )}
              </div>
              <h3 className="font-black">{product.name}</h3>
              <div className="mt-4 flex items-center justify-between">
                <span className="font-black">{formatCurrency(Math.round((product.price || 0) / 100))}</span>
                <a href={`/products/${product.slug}`} className="rounded bg-ink px-3 py-2 text-sm font-bold text-white">View</a>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
