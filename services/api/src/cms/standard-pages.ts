/**
 * Storefront pages the website links to by slug.
 *
 * This file is only a route registry for Admin -> Pages and footer ordering.
 * It must not contain customer-facing fallback copy. Page content is stored in
 * the database and edited from Admin -> Pages.
 */
export type StandardPage = {
  slug: string;
  title: string;
  /** Where it renders on the storefront, shown to the admin. */
  route: string;
};

export const STANDARD_PAGES: StandardPage[] = [
  { slug: "about-us", title: "About Fly Free", route: "/about" },
  { slug: "terms-and-conditions", title: "Terms of Service", route: "/terms" },
  { slug: "privacy-policy", title: "Privacy Policy", route: "/privacy" },
  { slug: "return-exchange-policy", title: "Return & Exchange Policy", route: "/returns" },
  { slug: "shipping-policy", title: "Shipping Policy", route: "/shipping" },
  { slug: "contact-us", title: "Contact Us", route: "/contact" }
];

export const STANDARD_PAGE_SLUGS = STANDARD_PAGES.map((page) => page.slug);
