# Fly Free — Image Specification

Hand this to your designer. Every size below is taken from how the component
actually renders, not from guesswork. Export at **2x** so images stay sharp on
phones and Retina screens.

**Format:** WebP preferred, JPG acceptable for photos, PNG only when transparency
is required (logos).
**Colour:** sRGB.
**Upload:** Admin panel → the relevant section. All uploads go to the
`product-images` bucket via the API.

**You do not have to crop by hand.** Every image field in the admin opens a crop
box locked to the ratio below — drag to reposition, zoom to fill, and the file is
written to Supabase as WebP at exactly the export size in this table. The sizes
below are what to *shoot and supply* so the crop box has pixels to work with;
anything smaller than half the export width is flagged as too soft.

---

## Quick reference

| Where | Aspect | Export size | Supply at least | Notes |
|---|---|---|---|---|
| Brand logo | any (16:9 today) | height 120px, width auto | — | PNG with transparency, not cropped by the admin |
| Favicon | 1:1 | 512 × 512 | — | Generate the full set |
| **Theme banner (hero)** | **16:9** | **2400 × 1350** | 1600 × 900 | Homepage carousel + theme page hero |
| **Theme card image** | **16:9** | **800 × 450** | 800 × 450 | Shop-by-theme row + Themes menu |
| **Product photo** | **4:5** | **1200 × 1500** | 1000 × 1250 | 2+ per product |
| **Hamper / gift box** | **4:5** | **1200 × 1500** | 1000 × 1250 | Same frame as a product — they share the gallery |
| Category (fit/type) tile | 1:1 | **800 × 800** | 600 × 600 | Fit and type pickers |
| Announcement image | 16:5 | **1600 × 500** | 1200 × 375 | Optional wide strip |
| Instagram post | 3:4 | **900 × 1200** | 900 × 1200 | Matches the IG feed row |
| Influencer photo | 1:1 | **800 × 800** | 800 × 800 | Face centred |
| Review photo (customer) | any | max 2000px long edge | — | Uploaded by customers |

Hard limit on any upload: **12 MB** before cropping.

There are only **three** frames to design against: **16:9** for anything theme-level,
**4:5** for anything you can buy (products and hampers), and **1:1** for small
tiles. The ratios live in `apps/web/app/lib/design.ts` (`MEDIA`) and are read by
both the storefront and the admin crop box.

---

## Detail

### Brand logo
Rendered at **42px tall in the navbar**, 38px in the admin sidebar, width
follows the aspect ratio automatically.

Your current file is `1920 × 1080` — a 16:9 canvas. That works, but a logo on a
16:9 canvas carries a lot of empty space, so the mark itself appears small.
**Recommended:** re-export cropped tight to the mark, roughly `600 × 200`
(3:1), transparent PNG. It will then fill the navbar height properly.

- File: `apps/web/public/brand/logo.png` and `apps/admin/public/brand/logo.png`

### Favicon
Already generated in `public/favicon_io/`: 16×16, 32×32, 180×180 (Apple),
192×192 and 512×512 (Android), plus `favicon.ico`.
To replace, run a new set through a favicon generator from a **square 512×512**
source and drop it in the same folder.

### Theme banner — 16:9, export 2400 × 1350
Hero on the homepage carousel and at the top of each theme page.

**One image, every screen.** The frame is **full-bleed** — edge to edge, no
side gutters, no height cap — and locked to **16:9 at every width**. On a 16:9
monitor that means the hero fills the viewport; on a phone it is the full width
by 9/16 of it. Because the ratio never changes, **the phone and the desktop show
exactly the same picture area.** Nothing is ever cut off.

**Safe area: keep faces and key detail in the LOWER HALF.**
The theme name, tag and button are overlaid across the **top** of the image on
every screen size, under a dark gradient covering the top two-thirds. The slider
dots sit centred at the very bottom, so leave the bottom ~40px quiet too.

That single rule is all a designer needs — there is no separate mobile crop and
no per-breakpoint exception.

### Theme card — 16:9, export 800 × 450
Used in the "Shop by theme" row and the Themes hover menu. Can be a tighter
crop of the banner. The theme name is overlaid bottom-left, so leave that corner
reasonably quiet. If no card image is set the banner is used as a fallback.

### Product photo — 4:5, export 1200 × 1500
The single most important size. Product cards render a strict `4:5` box.
Upload **at least two**: the first is the default, the second shows on hover.
Shoot on a consistent plain background so the grid looks even.

### Hamper — 4:5, export 1200 × 1500
**Identical to a product photo, on purpose.** Hamper images are appended to the
product gallery on the product page, so a hamper shot at any other ratio makes
the gallery jump as the customer swipes. The homepage hamper cards and the
product-page hamper picker use the same 4:5 box.

Supply two: the closed box, and the box open showing contents. Shoot them on the
same background as the product photos.

### Instagram post — 3:4, export 900 × 1200
The homepage feed renders `300 × 400` upright cards. Use the real post crop.

### Influencer photo — 1:1, export 800 × 800
Square avatar in the creator carousel. Centre the face; the card crops to a
square regardless of what you upload.

### Customer review photos
Uploaded by customers, so nothing to design. The app accepts JPG, PNG, WebP and
GIF up to **5 MB each, 5 per review**, and stores them under
`product-images/reviews/`.

---

## Rules that apply everywhere

1. **Never upload above 2500px on the long edge.** Larger files slow the page
   down with no visible benefit, and the crop box downsizes them anyway.
2. **Compress before uploading** (TinyPNG, Squoosh). The admin re-encodes to
   WebP, but a smaller source uploads faster.
3. **Supply extra room around the subject.** The crop box only ever crops
   *inward* — it cannot invent pixels outside your frame.
4. **Name files descriptively** — `spiderman-web-strike-front.webp`, not `IMG_2043.jpg`.
5. **Admin upload limit is 12 MB**; customer review uploads are capped at 5 MB.

---

## Where the brand itself is defined

Colours, fonts and motion are **not** images and are **not** in the database.
They are constants in **`apps/web/app/lib/design.ts`** (`BRAND`). Edit that file
and redeploy to change the site-wide look — for Puja, Bihu, monsoon, winter or a
game event. There is no admin screen for it, by design.

Seasonal *artwork* still comes from the admin: create a Product Theme, upload its
16:9 banner, mark it active, and it becomes a slide in the homepage hero and a
tile in the Shop-by-theme row.
