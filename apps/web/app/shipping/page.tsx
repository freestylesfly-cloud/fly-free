import { CmsTextPage } from "../components/CmsTextPage";

export const metadata = {
  title: "Shipping Policy | Fly Free",
  description: "Dispatch times, delivery estimates, charges, and tracking for Fly Free orders.",
};

export const dynamic = "force-dynamic";

// Shown only until the page is created in Admin → Pages.
const fallbackContent = `In-stock orders are dispatched within 2 to 3 working days.

Delivery usually takes 3 to 5 working days to metro cities and 5 to 8 working days to the rest of India after dispatch.

Delivery charges are calculated at checkout and shown before payment.

Tracking details are emailed once the parcel is handed to the courier.`;

export default function ShippingPage() {
  return (
    <CmsTextPage slug="shipping-policy" fallbackTitle="Shipping Policy" fallbackContent={fallbackContent} />
  );
}
