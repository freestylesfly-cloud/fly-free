import { CmsTextPage } from "../components/CmsTextPage";

export const metadata = {
  title: "Privacy Policy | Fly Free",
  description: "How Fly Free collects and uses customer information for orders, support, and account services.",
};

export const dynamic = "force-dynamic";

const fallbackContent = `Fly Free collects the information needed to create accounts, process orders, deliver products, provide customer support, and improve the shopping experience.

This may include your name, email address, phone number, delivery address, order history, payment status, and messages you send to us for custom designs or support.

We use this information to confirm purchases, send order updates, manage returns, prevent fraud, and share important service messages. Marketing messages are sent only when allowed by law or your preferences.

We do not sell customer personal information. Trusted service providers such as payment, delivery, email, analytics, and hosting partners may process information only for operating Fly Free services.

You can contact Fly Free support to request help with your account information, privacy questions, or communication preferences.`;

export default function PrivacyPage() {
  return (
    <CmsTextPage
      slug="privacy-policy"
      fallbackTitle="Privacy Policy"
      fallbackContent={fallbackContent}
    />
  );
}
