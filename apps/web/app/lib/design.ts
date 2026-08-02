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
    /** Buttons, links, active states. */
    primary: '#FF4A4E',
    /** Supporting brand colour. */
    secondary: '#00A8E8',
    /** Highlights, badges, stars. */
    accent: '#FFB703',
    /** Deep tone for contrast blocks. */
    tertiary: '#1D3557',

    /** Page background. */
    bgPrimary: '#f8f7f6',
    /** Cards and raised surfaces. */
    bgSecondary: '#ffffff',
    /** Wells, skeletons, image placeholders. */
    bgTertiary: '#efefef',

    textPrimary: '#1a1a1a',
    textSecondary: '#666666',
    textTertiary: '#999999'
  },

  fonts: {
    /** Body copy. */
    body: "'Times New Roman', Georgia, serif",
    /** Headings and display type. */
    heading: "'Times New Roman', Georgia, serif"
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
  hamper: { ratio: 4 / 5, css: '4 / 5', export: '1200 × 1500' }
} as const;

/**
 * Fallback support details, used until the API answers.
 *
 * The live values come from Admin → Settings (`supportEmail`, `contactPhone`,
 * `businessAddress`, `socialLinks.instagram`). These are only what renders
 * before that request lands — keep them truthful, they ship in the HTML.
 */
export const SUPPORT = {
  email: 'support@flyfree.com',
  phone: '+91 98765 43210',
  address: 'Guwahati, Assam, India',
  instagram: 'https://instagram.com/flyfree'
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
