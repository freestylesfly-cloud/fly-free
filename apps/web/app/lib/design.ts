/**
 * Fly Free design system — the single source of truth for the storefront's
 * look. Edit this file to change the brand; there is no admin screen and no
 * database table behind it.
 *
 * Colours and fonts here are emitted as CSS custom properties by
 * `designTokensCss()`, which `app/layout.tsx` injects into <head>. Anything in
 * `globals.css` is a fallback that these values override.
 *
 * Seasonal moods (Puja, Bihu, monsoon, winter, game events) are handled by
 * swapping BRAND below — commit the change and deploy. Per-drop artwork stays
 * where it belongs: on Product Themes, which supply the hero banners.
 */

export const BRAND = {
  colors: {
    // "Ink + signal": black does the work (buttons, active states) so the
    // printed tees carry the colour; one signal orange marks what matters most
    // (main call to action, highlights, stars). Cool concrete background.
    /** Buttons, links, active states. */
    primary: '#121212',
    /** Sale and urgency only. */
    secondary: '#E11D48',
    /** Signal orange: the one loud colour. Pair with ink text for small type. */
    accent: '#FF4D1A',
    /** Dark contrast blocks (announcement bar, story). */
    tertiary: '#121212',

    /** Page background — cool concrete. */
    bgPrimary: '#F3F3F1',
    /** Cards and raised surfaces. */
    bgSecondary: '#ffffff',
    /** Wells, skeletons, image placeholders. */
    bgTertiary: '#E8E8E5',

    textPrimary: '#121212',
    textSecondary: '#52525B',
    textTertiary: '#71717A'
  },

  fonts: {
    /** Body copy. */
    body: 'var(--font-archivo), Arial, sans-serif',
    /** Headings and display type. */
    heading: 'var(--font-archivo), Arial, sans-serif'
  },

  /** Section reveal style: 'fade' | 'rise' | 'none'. */
  motion: 'fade' as const
} satisfies BrandTokens;

type BrandTokens = {
  colors: Record<string, string>;
  fonts: { body: string; heading: string };
  motion: 'fade' | 'rise' | 'none';
};

/**
 * Media frames. Every ratio is fixed — the same number drives the admin crop
 * box and the storefront box, so one uploaded crop looks identical on desktop
 * and mobile. Change a ratio here and re-crop the affected images.
 */
export const MEDIA = {
  /** Homepage hero carousel + theme page banner. */
  themeBanner: { ratio: 16 / 9, css: '16 / 9', export: '2400 × 1350' },
  /** Shop-by-theme cards and the Themes menu. */
  themeCard: { ratio: 16 / 9, css: '16 / 9', export: '800 × 450' },
  /** Product photos and hampers share one frame so galleries never jump. */
  product: { ratio: 4 / 5, css: '4 / 5', export: '1200 × 1500' },
  hamper: { ratio: 4 / 5, css: '4 / 5', export: '1200 × 1500' },
  /** Partner sponsorship banner. Matches the crop in Admin → Sponsorships. */
  sponsorBanner: { ratio: 16 / 9, css: '16 / 9', export: '1600 × 900' }
} as const;

/**
 * Placeholders shown only until the API answers.
 *
 * The real values live in Admin → Settings (`supportEmail`, `contactPhone`,
 * `businessAddress`, `socialLinks.*`) and are fetched at runtime. Nothing here
 * is a real contact detail or a real link: anything left blank is simply not
 * rendered, so an unconfigured store never ships a dead address to customers.
 */
export const SUPPORT = {
  email: '',
  phone: '',
  address: '',
  instagram: ''
};

/** Copy shown over the hero when a theme supplies no description of its own. */
export const HERO_FALLBACK = {
  tag: 'New drop',
  ctaLabel: 'Shop the drop',
  ctaHref: '/products'
};

/** Renders BRAND as a `:root` block for injection into <head>. */
export function designTokensCss() {
  const { colors, fonts, motion } = BRAND;

  return `:root{
--color-primary:${colors.primary};
--color-secondary:${colors.secondary};
--color-accent:${colors.accent};
--color-tertiary:${colors.tertiary};
--accent-primary:${colors.primary};
--accent-secondary:${colors.secondary};
--accent-tertiary:${colors.accent};
--bg-primary:${colors.bgPrimary};
--bg-secondary:${colors.bgSecondary};
--bg-tertiary:${colors.bgTertiary};
--text-primary:${colors.textPrimary};
--text-secondary:${colors.textSecondary};
--text-tertiary:${colors.textTertiary};
--text-muted:${colors.textTertiary};
--border-color:color-mix(in srgb, ${colors.textPrimary} 15%, transparent);
--border-light:color-mix(in srgb, ${colors.textPrimary} 8%, transparent);
--campaign-gradient:linear-gradient(135deg, ${colors.primary}, ${colors.accent});
--gradient-primary-secondary:linear-gradient(135deg, ${colors.primary}, ${colors.secondary});
--gradient-accent:linear-gradient(45deg, ${colors.accent}, ${colors.primary});
--font-family:${fonts.body};
--font-body:${fonts.body};
--font-heading:${fonts.heading};
}
[data-campaign-motion]{--campaign-motion:${motion};}`;
}
