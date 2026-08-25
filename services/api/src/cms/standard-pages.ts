/**
 * The content pages the storefront asks for by slug.
 *
 * This is the single source of truth. The storefront requests these exact
 * slugs, the admin Pages screen lists them, and the seed creates them — so a
 * typo can no longer silently leave a page falling back to hard-coded copy.
 *
 * `content` is starter text: legally generic, factually neutral, and meant to
 * be edited in Admin → Pages before launch.
 *
 * Formatting understood by the storefront renderer:
 *   `## Heading`   → section heading
 *   `- item`       → bullet
 *   blank line     → new paragraph
 */
export type StandardPage = {
  slug: string;
  title: string;
  /** Where it renders on the storefront, shown to the admin. */
  route: string;
  content: string;
};

export const STANDARD_PAGES: StandardPage[] = [
  {
    slug: "about-us",
    title: "About Fly Free",
    route: "/about",
    content: `Fly Free celebrates freedom, individuality, and self-expression through fashion.

Founded by Miss Sneha Jyoti Naiding Shah, Fly Free is rooted in the vibrant heritage of Northeast India. Every piece is created to feel comfortable, expressive, and wearable in everyday life.

## What we make
- Premium unisex tees, oversized fits, jerseys, polos, and hoodies
- Theme-led design drops built around culture and identity
- Custom and bulk apparel for teams, events, and gifting

## How we work
We keep collections small and considered, print on heavyweight combed cotton, and check every order before it ships.`
  },
  {
    slug: "terms-and-conditions",
    title: "Terms of Service",
    route: "/terms",
    content: `By using this website, placing an order, or contacting support, you agree to these terms.

## Your account
- Provide accurate account, contact, delivery, and payment details
- You are responsible for activity on your account
- We may suspend accounts used for fraud or abuse

## Products and pricing
- Photos, colours, sizes, prices, and availability may change as collections are updated
- Slight colour variation between screens and printed fabric is normal
- If a product is priced incorrectly we may cancel the order and refund you in full

## Orders
- An order is confirmed once payment is successful
- Custom and bulk orders are confirmed only after design, quantity, pricing, and delivery details are agreed in writing
- We may cancel an order if stock is unavailable, and will refund it in full

## Payments
Payments are processed by our payment partner. We do not store your card details.

## Contact
For support, returns, cancellations, or order questions, contact us with your order number.`
  },
  {
    slug: "privacy-policy",
    title: "Privacy Policy",
    route: "/privacy",
    content: `This policy explains what we collect, why, and what control you have.

## What we collect
- Name, email address, and phone number
- Delivery address and order history
- Payment status from our payment partner (never full card details)
- Messages you send us for support or custom design work

## Why we collect it
- To confirm purchases and deliver your order
- To send order and delivery updates
- To handle returns, exchanges, and support requests
- To prevent fraud and misuse

## Sharing
We share only what is needed with delivery partners and our payment provider. We do not sell your personal information.

## Your choices
- You can update or delete saved addresses from your account
- You can unsubscribe from marketing email at any time
- You can request a copy or deletion of your data by contacting support

## Retention
Order and invoice records are kept as long as required for tax and accounting.`
  },
  {
    slug: "return-exchange-policy",
    title: "Return & Exchange Policy",
    route: "/returns",
    content: `We want the fit to be right. If it is not, here is how to sort it.

## Exchange window
Request a size or fit exchange within 7 days of delivery.

## Condition
- Unworn and unwashed, with original tags attached
- In its original packaging
- Free of stains, odour, or damage

## What cannot be exchanged
- Custom and personalised products made to your design
- Items marked final sale
- Innerwear and socks, for hygiene reasons

## Returns and refunds
We do not offer returns or refunds.

## How to request
1. Contact support with your order number and the size you need
2. We confirm availability and share pickup or return details
3. Once the item reaches us and passes inspection, the exchange ships

## Refunds
Where a refund applies, it is issued to the original payment method after inspection. Banks usually take 5 to 7 working days to post it.

## Damaged or wrong item
Contact us within 48 hours of delivery with photos. We cover return shipping and send a replacement at no cost.`
  },
  {
    slug: "shipping-policy",
    title: "Shipping Policy",
    route: "/shipping",
    content: `## Dispatch
In-stock orders are dispatched within 2 to 3 working days. Custom and bulk orders follow the timeline agreed when the order is confirmed.

## Delivery time
- Metro cities: 3 to 5 working days after dispatch
- Rest of India: 5 to 8 working days after dispatch
- Remote pin codes may take longer

## Charges
Delivery charges are calculated at checkout and shown before payment. Free delivery applies above the threshold displayed in your cart.

## Tracking
You receive tracking details by email once the parcel is handed to the courier. You can also track from your account.

## Delivery address
We ship to the address saved on the order. We cannot change the address once the parcel is dispatched, so please check it at checkout.

## Failed delivery
If a parcel returns to us undelivered after repeated attempts, we contact you to arrange redelivery. Redelivery charges may apply.`
  },
  {
    slug: "contact-us",
    title: "Contact Us",
    route: "/contact",
    content: `Reach us for orders, returns, custom designs, bulk enquiries, and influencer partnerships.

We reply to support requests within one working day. Include your order number so we can help faster.`
  }
];

export const STANDARD_PAGE_SLUGS = STANDARD_PAGES.map((page) => page.slug);
