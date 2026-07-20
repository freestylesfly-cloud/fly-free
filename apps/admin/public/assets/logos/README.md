# Logo Setup

## Using Default Logo
The app includes a default SVG logo. To use your own logo:

1. Replace these files with your logo:
   - `logo.png` (transparent PNG recommended, min 64x64px)
   
2. Supported formats:
   - PNG (recommended)
   - JPG
   - SVG
   - GIF

3. Logo will load from:
   - Public folder: `/assets/logos/logo.png` (instant, no lag)
   - API (optional): `GET /api/settings/logo` → `{ logoUrl: "..." }`

## How it Works
1. App shows local logo immediately from `/assets/logos/logo.png`
2. If API has logo URL, it fetches in background (1s timeout)
3. If API fails or timeout, keeps showing local logo
4. No loading delay - user sees logo instantly!

## Notes
- Local logo loads instantly (no waiting)
- API fetch is optional and non-blocking
- Timeout is 1 second to prevent lag
- Fallback is automatic
