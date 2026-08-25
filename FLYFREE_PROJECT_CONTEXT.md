# Fly Free Project Context

This note keeps the product direction visible for future work.

## Current Direction
- The storefront should feel modern, mobile-first, fast, trustworthy, and fully database/admin-driven.
- Avoid hardcoded customer-facing copy. Pages, footer text, support details, FAQ content, theme copy, SEO text, and marketing content should be managed from Admin.
- Product data, product types/categories, themes, reviews, Instagram posts, influencers, coupons, and size charts should come from APIs/database.
- Size guides are image-first by fit type: Regular, Oversized, Polo. No storefront measurement table.

## Completed Recently
- SizeGuide database changed to one record per fit type with chart image and note.
- Admin Size Guides changed to chart cards.
- Storefront size drawer uses fit tabs and default product fit.
- Standard page hardcoded body content removed from storefront fallback paths.
- Admin Pages registry is now slug/title/route only.
- FAQ database model and admin/public routes added.
- Footer uses database categories/pages/settings and keeps the large FlyFree wordmark.

## Next Work Queue
- Checkout offers: improve first-order, influencer, coupon, delivery-charge offer UI and show coupon attribution in admin orders.
- Influencer system: connect Instagram/community posts to influencer profiles and products.
- Blog/SEO system: DB model, admin editor, SEO tags, cover images/videos, related products/themes.
- Analytics/recommendations: track product views, searches, cart actions, coupon use, clicks, purchases, and feed trending products/themes.
- AI/support chat: build a Fly Free support widget using product/order/site data, rate limits, handoff rules, and admin review.
- Trust layer: help page, FAQs, reviews, delivery tracking, payment badges, contact forms, policies, and support details.
- Dynamic theme system: admin-controlled colors, banners, background images, seasonal themes, and campaign sections.
- Video/media: upload and display product/community videos with mute, pause, and mobile-friendly playback.
- Scaling: caching, rate limiting, indexing, queueing, horizontal API scaling, and CDN image/video delivery.
