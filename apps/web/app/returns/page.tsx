import { CmsTextPage } from "../components/CmsTextPage";

export const metadata = {
  title: "Return & Exchange Policy | Fly Free",
  description: "How to exchange a size or fit issue, and what Fly Free covers on damaged or wrong deliveries.",
};

export const dynamic = "force-dynamic";

export default function ReturnsPage() {
  return <CmsTextPage slug="return-exchange-policy" />;
}
