import { getApiBaseUrl } from "../lib/api";

interface CmsPage {
  title: string;
  content: string;
  metaDesc?: string | null;
}

interface CmsTextPageProps {
  slug: string;
  fallbackTitle: string;
  fallbackContent: string;
}

async function getCmsPage(slug: string): Promise<CmsPage | null> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/cms/pages/${slug}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch {
    return null;
  }
}

export async function CmsTextPage({ slug, fallbackTitle, fallbackContent }: CmsTextPageProps) {
  const page = await getCmsPage(slug);
  const title = page?.title || fallbackTitle;
  const content = page?.content || fallbackContent;
  const paragraphs = content.split(/\n{2,}/).map((section) => section.trim()).filter(Boolean);

  return (
    <main className="bg-paper text-ink">
      <section className="border-b border-black/10 bg-ink px-5 py-14 text-white">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-black md:text-5xl">{title}</h1>
          {page?.metaDesc && <p className="mt-4 max-w-2xl text-white/70">{page.metaDesc}</p>}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-12">
        <div className="space-y-5 rounded border border-black/10 bg-white p-6 leading-7 shadow-sm">
          {paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </section>
    </main>
  );
}
