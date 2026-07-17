import { ShoppingBag, Sparkles, Shirt, Gift } from "lucide-react";
import { formatCurrency } from "@flyfree/utils";

const collections = ["Anime", "Assam", "Oversized", "Premium", "Marvel", "Minimal"];

const products = [
  { name: "Apex Drive Oversized Tee", price: 799, tag: "Trending" },
  { name: "Highland Legacy Tee", price: 899, tag: "Assam Drop" },
  { name: "Elite Mentality Tee", price: 749, tag: "New Arrival" },
  { name: "Custom Print Tee", price: 999, tag: "Customize" }
];

export default function HomePage() {
  return (
    <main>
      <section className="bg-ink text-white">
        <div className="mx-auto grid min-h-[82vh] max-w-7xl items-center gap-10 px-5 py-12 md:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold">
              <Sparkles size={16} /> Assam born streetwear
            </p>
            <h1 className="max-w-3xl text-5xl font-black leading-none md:text-7xl">Fly Free</h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-white/75">
              A production-ready storefront foundation for drops, collections, variants, offers, carts, and custom design requests.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a className="rounded bg-coral px-5 py-3 font-bold text-white" href="#shop">Shop drops</a>
              <a className="rounded border border-white/30 px-5 py-3 font-bold" href="#customize">Start custom design</a>
            </div>
          </div>
          <div className="grid gap-3">
            {collections.map((collection) => (
              <div key={collection} className="flex items-center justify-between border-b border-white/15 py-4">
                <span className="text-2xl font-black">{collection}</span>
                <span className="text-sm text-white/60">Dynamic collection</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="shop" className="mx-auto max-w-7xl px-5 py-14">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black">Trending Products</h2>
            <p className="mt-2 text-ink/65">Ready for API-backed catalog data.</p>
          </div>
          <a className="font-bold text-leaf" href="/products">View all</a>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <article key={product.name} className="rounded border border-black/10 bg-white p-4">
              <div className="mb-4 flex aspect-[4/5] items-center justify-center rounded bg-paper">
                <Shirt size={54} strokeWidth={1.5} />
              </div>
              <span className="text-xs font-black uppercase text-coral">{product.tag}</span>
              <h3 className="mt-2 min-h-12 text-lg font-black">{product.name}</h3>
              <div className="mt-4 flex items-center justify-between">
                <span className="font-black">{formatCurrency(product.price)}</span>
                <button className="rounded bg-ink px-3 py-2 text-sm font-bold text-white">Add</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="customize" className="border-y border-black/10 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-14 md:grid-cols-[0.8fr_1.2fr]">
          <div>
            <Gift size={32} />
            <h2 className="mt-4 text-3xl font-black">Custom Design Requests</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {["Upload PNG/SVG/PSD/PDF", "Choose front, back, sleeve", "Admin approval workflow", "Pay after approval"].map((item) => (
              <div key={item} className="rounded border border-black/10 p-5 font-bold">{item}</div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
