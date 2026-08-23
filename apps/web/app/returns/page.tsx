import { CmsTextPage } from "../components/CmsTextPage";

export const metadata = {
  title: "Return & Exchange Policy | Fly Free",
  description: "How to exchange a size or fit issue, and what Fly Free covers on damaged or wrong deliveries.",
};

export const dynamic = "force-dynamic";

// Shown only until the page is created in Admin → Pages.
const fallbackContent = `Request a size or fit exchange within 7 days of delivery.

Items must be unworn, unwashed, with original tags attached and in their original packaging.

Custom and personalised products cannot be exchanged.

We do not offer returns or refunds.

For a damaged or incorrect item, contact support within 48 hours of delivery with photos and we will replace it at no cost.`;

export default function ReturnsPage() {
  return (
    <CmsTextPage
      slug="return-exchange-policy"
      fallbackTitle="Return & Exchange Policy"
      fallbackContent={fallbackContent}
    />
  );
}
