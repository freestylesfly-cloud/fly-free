import { Gift } from "lucide-react";
import { getApiBaseUrl } from "../lib/api";

const API_BASE = getApiBaseUrl();

export const dynamic = "force-dynamic";

export default async function GiftingPage() {
  let page = null;
  let home = { giftOptions: [] };

  try {
    const [pageResponse, homeResponse] = await Promise.all([
      fetch(`${API_BASE}/cms/pages/gifting`, { cache: "no-store" }),
      fetch(`${API_BASE}/cms/home`, { cache: "no-store" })
    ]);
    page = pageResponse.ok ? await pageResponse.json() : null;
    home = homeResponse.ok ? await homeResponse.json() : { giftOptions: [] };
  } catch (error) {
    console.error("Error fetching gifting data:", error);
  }

  return (
    <main>
      <section className="bg-ink text-white">
        <div className="mx-auto max-w-7xl px-5 py-20">
          <Gift size={36} />
          <h1 className="mt-4 text-5xl font-black">Gifting</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-white/75">{page?.content || "Gift-ready tees, custom cards, festival packaging, and company bulk gifting."}</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14">
        <div className="grid gap-4 md:grid-cols-3">
          {(home.giftOptions || []).map((item: any) => (
            <article key={item.id} className="rounded border border-black/10 bg-white p-4">
              {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="mb-4 h-44 w-full rounded object-cover" />}
              <h2 className="text-xl font-black">{item.name}</h2>
              <p className="mt-2 leading-7 text-ink/65">{item.description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
