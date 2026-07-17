import { Boxes, ChartNoAxesCombined, PackageCheck, Users } from "lucide-react";
import { formatCurrency } from "@flyfree/utils";

const metrics = [
  { label: "Revenue", value: formatCurrency(124850), icon: ChartNoAxesCombined },
  { label: "Orders", value: "328", icon: PackageCheck },
  { label: "Products", value: "146", icon: Boxes },
  { label: "Users", value: "2,418", icon: Users }
];

const queues = ["Pending orders", "Low stock alerts", "Review approvals", "Custom design requests"];

export default function AdminPage() {
  return (
    <main className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-black/10 bg-white p-5 md:block">
        <h1 className="text-xl font-black uppercase">Fly Free Admin</h1>
        <nav className="mt-8 grid gap-2 text-sm font-bold">
          {["Dashboard", "Products", "Categories", "Orders", "Inventory", "Coupons", "Reviews", "CMS"].map((item) => (
            <a key={item} className="rounded px-3 py-2 hover:bg-paper" href="#">{item}</a>
          ))}
        </nav>
      </aside>
      <section className="md:ml-64">
        <header className="border-b border-black/10 bg-white px-5 py-4">
          <p className="text-sm font-bold text-coral">Operations</p>
          <h2 className="text-2xl font-black">Dashboard</h2>
        </header>
        <div className="grid gap-5 p-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map(({ label, value, icon: Icon }) => (
              <article key={label} className="rounded border border-black/10 bg-white p-5">
                <Icon size={22} />
                <p className="mt-5 text-sm font-bold text-black/55">{label}</p>
                <strong className="mt-1 block text-3xl">{value}</strong>
              </article>
            ))}
          </div>
          <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <section className="rounded border border-black/10 bg-white p-5">
              <h3 className="text-lg font-black">Catalog Pipeline</h3>
              <div className="mt-5 grid gap-3">
                {["Create product", "Manage variants", "Upload media", "Schedule hero banners"].map((item) => (
                  <button key={item} className="rounded border border-black/10 px-4 py-3 text-left font-bold hover:bg-mint">{item}</button>
                ))}
              </div>
            </section>
            <section className="rounded border border-black/10 bg-white p-5">
              <h3 className="text-lg font-black">Work Queues</h3>
              <div className="mt-5 grid gap-3">
                {queues.map((queue, index) => (
                  <div key={queue} className="flex items-center justify-between rounded bg-paper px-4 py-3">
                    <span className="font-bold">{queue}</span>
                    <span className="rounded bg-ink px-2 py-1 text-xs font-black text-white">{index + 3}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
