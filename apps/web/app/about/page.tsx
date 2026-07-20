import { CmsTextPage } from "../components/CmsTextPage";

export const metadata = {
  title: "About Fly Free",
  description: "Fly Free brand story, founder, mission, and team.",
};

export const dynamic = "force-dynamic";

const fallbackContent = `Fly Free celebrates freedom, individuality, and self-expression through fashion.

Founded by Miss Sneha Jyoti Naiding Shah, Fly Free is rooted in the vibrant heritage of Northeast India. Every piece is created to feel comfortable, expressive, and wearable in everyday life.

Our team builds collections around culture, identity, quality, and custom-crafted apparel that lets people wear what they love without limitations.`;

export default function AboutPage() {
  return <CmsTextPage slug="about-us" fallbackTitle="About Fly Free" fallbackContent={fallbackContent} />;
}
