import { CmsTextPage } from "../components/CmsTextPage";

export const dynamic = "force-dynamic";

export default async function DynamicCmsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <CmsTextPage slug={slug} />;
}
