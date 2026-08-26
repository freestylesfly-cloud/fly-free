import { CmsTextPage } from "../components/CmsTextPage";

export const metadata = {
  title: "Terms of Service | Fly Free",
  description: "Terms for shopping, custom orders, payments, delivery, and use of Fly Free.",
};

export const dynamic = "force-dynamic";

export default function TermsPage() {
  return <CmsTextPage slug="terms-and-conditions-of-sale" />;
}
