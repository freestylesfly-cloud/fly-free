import { CmsTextPage } from "../components/CmsTextPage";

export const metadata = {
  title: "About Fly Free",
  description: "Fly Free brand story, founder, mission, and team.",
};

export const dynamic = "force-dynamic";

export default function AboutPage() {
  return <CmsTextPage slug="about-us" />;
}
