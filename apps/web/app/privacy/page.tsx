import { CmsTextPage } from "../components/CmsTextPage";

export const metadata = {
  title: "Privacy Policy | Fly Free",
  description: "How Fly Free collects and uses customer information for orders, support, and account services.",
};

export const dynamic = "force-dynamic";

export default function PrivacyPage() {
  return <CmsTextPage slug="privacy-policy" />;
}
