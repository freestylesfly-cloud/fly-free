# Fly Free — Image Specification

Hand this to your designer. Every size below is taken from how the component
actually renders, not from guesswork. Export at **2x** so images stay sharp on
phones and Retina screens.

**Format:** WebP preferred, JPG acceptable for photos, PNG only when transparency
is required (logos).
**Colour:** sRGB.
**Upload:** Admin panel → the relevant section. All uploads go to the
`product-images` bucket via the API.

---

## Quick reference

| Where | Aspect | Export size (2x) | Max weight | Notes |
|---|---|---|---|---|
| Brand logo | any (16:9 today) | height 120px, width auto | 60 KB | PNG with transparency |
| Favicon | 1:1 | 512 × 512 | 30 KB | Generate the full set |
| Theme banner (hero) | 16:9 | **2400 × 1350** | 400 KB | Keep text clear of edges |
| Theme card image | 16:9 | **800 × 450** | 120 KB | Menu + theme cards |
| Product photo | 4:5 | **1200 × 1500** | 250 KB | 2+ per product |
| Hamper / gift box | 1:1 | **1000 × 1000** | 200 KB | 2 images per hamper |
| Instagram post | 3:4 | **900 × 1200** | 200 KB | Matches the IG feed row |
| Influencer photo | 1:1 | **800 × 800** | 150 KB | Face centred |
| Announcement image | 16:9 | **1200 × 675** | 150 KB | Optional |
| Review photo (customer) | any | max 2000px long edge | 5 MB | Uploaded by customers |

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
Full-bleed hero on the homepage carousel and at the top of each theme page.
A dark gradient overlays the bottom 60%, and the theme name sits bottom-left.
**Keep faces and key detail out of the lower-left third and away from all edges** —
the crop tightens significantly on phones.

### Theme card — 16:9, export 800 × 450
Used in the "Shop by theme" row and the Themes hover menu. Can be a tighter
crop of the banner.

### Product photo — 4:5, export 1200 × 1500
The single most important size. Product cards render a strict `4:5` box.
Upload **at least two**: the first is the default, the second shows on hover.
Shoot on a consistent plain background so the grid looks even.

### Hamper — 1:1, export 1000 × 1000
Homepage hamper cards and the product-page hamper picker are square.
Supply two: the closed box, and the box open showing contents.

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
   down with no visible benefit.
2. **Compress before uploading** (TinyPNG, Squoosh). Aim for the weight column above.
3. **Match the aspect ratio.** A mismatched image is cropped centrally, not
   letterboxed, so edges get cut off.
4. **Name files descriptively** — `spiderman-web-strike-front.webp`, not `IMG_2043.jpg`.
5. **Admin upload limit is 12 MB**; customer review uploads are capped at 5 MB.
