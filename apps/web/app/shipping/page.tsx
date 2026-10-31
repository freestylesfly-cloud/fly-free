import { CmsTextPage } from "../components/CmsTextPage";

export const metadata = {
  title: "Shipping Policy",
  description: "Dispatch times, delivery estimates, charges, and tracking for Fly Free orders.",
};

export const dynamic = "force-dynamic";

export default function ShippingPage() {
  return <CmsTextPage slug="shipping-policy" />;
}
