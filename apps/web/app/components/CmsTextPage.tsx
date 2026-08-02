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

/**
 * Renders a content page written in Admin → Pages.
 *
 * The editor is a plain textarea, so the supported formatting is deliberately
 * minimal — enough to write a readable policy, with nothing to escape wrongly:
 *   `## Heading`  → section heading
 *   `- item`      → bullet
 *   `1. item`     → numbered step
 *   blank line    → new paragraph
 */
export async function CmsTextPage({ slug, fallbackTitle, fallbackContent }: CmsTextPageProps) {
  const page = await getCmsPage(slug);
  const title = page?.title || fallbackTitle;
  const content = page?.content || fallbackContent;

  return (
    <main style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}>
      <section
        className="border-b px-5 py-12 md:py-16"
        style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-secondary)" }}
      >
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-black uppercase md:text-5xl">{title}</h1>
          {page?.metaDesc && (
            <p className="mt-4 max-w-2xl text-base" style={{ color: "var(--text-secondary)" }}>
              {page.metaDesc}
            </p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-10 md:py-14">
        <div className="space-y-4 leading-7">{renderBlocks(content)}</div>
      </section>
    </main>
  );
}

type Block =
  | { kind: "heading"; text: string }
  | { kind: "list"; ordered: boolean; items: string[] }
  | { kind: "paragraph"; text: string };

/** Groups consecutive lines into headings, lists and paragraphs. */
function toBlocks(content: string): Block[] {
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push({ kind: "paragraph", text: paragraph.join(" ") });
      paragraph = [];
    }
  };
  const flushList = () => {
    if (list) {
      blocks.push({ kind: "list", ordered: list.ordered, items: list.items });
      list = null;
    }
  };

  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    const heading = /^#{1,3}\s+(.*)$/.exec(line);
    if (heading) {
      flushParagraph();
      flushList();
      blocks.push({ kind: "heading", text: heading[1] });
      continue;
    }

    const bullet = /^[-*•]\s+(.*)$/.exec(line);
    const numbered = /^\d+[.)]\s+(.*)$/.exec(line);
    if (bullet || numbered) {
      flushParagraph();
      const ordered = Boolean(numbered);
      const item = (bullet || numbered)![1];
      if (list && list.ordered === ordered) {
        list.items.push(item);
      } else {
        flushList();
        list = { ordered, items: [item] };
      }
      continue;
    }

    flushList();
    paragraph.push(line);
  }

  flushParagraph();
  flushList();
  return blocks;
}

function renderBlocks(content: string) {
  return toBlocks(content).map((block, index) => {
    if (block.kind === "heading") {
      return (
        <h2 key={index} className="pt-4 text-lg font-black uppercase md:text-xl">
          {block.text}
        </h2>
      );
    }

    if (block.kind === "list") {
      const items = block.items.map((item, itemIndex) => <li key={itemIndex}>{item}</li>);
      return block.ordered ? (
        <ol key={index} className="ml-5 list-decimal space-y-1.5" style={{ color: "var(--text-secondary)" }}>
          {items}
        </ol>
      ) : (
        <ul key={index} className="ml-5 list-disc space-y-1.5" style={{ color: "var(--text-secondary)" }}>
          {items}
        </ul>
      );
    }

    return (
      <p key={index} style={{ color: "var(--text-secondary)" }}>
        {block.text}
      </p>
    );
  });
}
