import { CmsTextPage } from "../components/CmsTextPage";

export const metadata = {
  title: "Terms of Service | Fly Free",
  description: "Terms for shopping, custom orders, payments, delivery, and use of Fly Free.",
};

export const dynamic = "force-dynamic";

const fallbackContent = `Welcome to Fly Free. By using our website, placing an order, or requesting a custom design, you agree to use our services honestly and provide accurate contact, delivery, and payment details.

Product photos, colors, sizes, prices, and availability may change as we improve collections or update stock. Custom and bulk orders are confirmed only after design, quantity, pricing, and delivery details are accepted by Fly Free.

Payments must be completed through the supported checkout methods. Orders may be cancelled or delayed if payment fails, delivery details are incomplete, or the requested product is unavailable.

Fly Free designs, content, brand assets, and campaign themes are owned by Fly Free or used with permission. Customers may not copy or resell our content without written approval.

For support, returns, cancellations, or order questions, contact Fly Free support with your order details.`;

export default function TermsPage() {
  return (
    <CmsTextPage
      slug="terms-and-conditions"
      fallbackTitle="Terms of Service"
      fallbackContent={fallbackContent}
    />
  );
}
