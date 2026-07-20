import { CmsTextPage } from "../components/CmsTextPage";

export const metadata = {
  title: "Privacy Policy | Fly Free",
  description: "How Fly Free collects and uses customer information for orders, support, and account services.",
};

export const dynamic = "force-dynamic";

const fallbackContent = `Fly Free collects the information needed to create accounts, process orders, deliver products, provide customer support, and improve the shopping experience.

This may include your name, email address, phone number, delivery address, order history, payment status, and messages you send to us for custom designs or support.

We use this information to confirm purchases, send order updates, manage returns, prevent fraud, and share important service messages.`;

export default function PrivacyPage() {
  return <CmsTextPage slug="privacy-policy" fallbackTitle="Privacy Policy" fallbackContent={fallbackContent} />;
}
