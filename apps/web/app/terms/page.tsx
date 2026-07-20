import { CmsTextPage } from "../components/CmsTextPage";

export const metadata = {
  title: "Terms of Service | Fly Free",
  description: "Terms for shopping, custom orders, payments, delivery, and use of Fly Free.",
};

export const dynamic = "force-dynamic";

const fallbackContent = `Welcome to Fly Free. By using our website, placing an order, or requesting support, you agree to provide accurate account, contact, delivery, and payment details.

Product photos, colors, sizes, prices, and availability may change as collections are updated. Custom and bulk orders are confirmed only after design, quantity, pricing, and delivery details are accepted by Fly Free.

For support, returns, cancellations, or order questions, contact Fly Free support with your order details.`;

export default function TermsPage() {
  return <CmsTextPage slug="terms-and-conditions" fallbackTitle="Terms of Service" fallbackContent={fallbackContent} />;
}
