# Fly Free Theme System Guide

## Overview

The Fly Free platform now has a comprehensive theme system with two distinct layers:

1. **UI Theme (Light/Dark Mode)** - User's interface appearance preference
2. **Content Theme (Admin-Controlled)** - The seasonal or special theme applied to the entire website

## UI Theme (Light/Dark Mode)

### User Preferences
- Users can toggle between **Light Mode**, **Dark Mode**, or **System** (follows OS preference)
- Toggle button is in the header (Sun/Moon icon)
- Preference is persisted in localStorage as `fly-free-theme`

### CSS Variables

#### Light Theme (Default)
```css
--bg-primary: #f7f3ea         /* Main background */
--bg-secondary: #ffffff        /* Secondary background */
--bg-tertiary: #efefef         /* Tertiary background */

--text-primary: #161616        /* Main text */
--text-secondary: #555555       /* Secondary text */
--text-tertiary: #888888        /* Tertiary text */

--border-color: #e0e0e0        /* Main border */
--border-light: #f0f0f0         /* Light border */

--accent-primary: #ff6b5b      /* Primary accent */
--accent-secondary: #4ecdc4    /* Secondary accent */
--accent-tertiary: #ffd700     /* Tertiary accent */
```

#### Dark Theme
```css
--bg-primary: #0f172a          /* Main background */
--bg-secondary: #1a1f3a        /* Secondary background */
--bg-tertiary: #2d3748         /* Tertiary background */

--text-primary: #f0f0f0        /* Main text */
--text-secondary: #b0b0b0      /* Secondary text */
--text-tertiary: #808080       /* Tertiary text */

--border-color: #2d3748        /* Main border */
--border-light: #1a1f3a        /* Light border */

/* Accent colors remain the same */
```

## Content Theme (Admin-Controlled)

### What is a Content Theme?

A **Content Theme** is a special theme that admins can activate for seasonal campaigns or special events. Examples:
- **Puja Collection** - Special design, colors, fonts for Durga Puja season
- **Bihu Collection** - Themed collection for Bihu festival
- **Winter Collection** - Winter-specific designs and colors
- **Spider-Man Collection** - Special collaboration theme

### Theme Configuration

Admins can manage themes via the API at `/api/admin/themes`:

#### Create a Theme
```bash
POST /api/admin/themes
{
  "name": "Puja Collection",
  "slug": "puja-2024",
  "description": "Traditional Puja designs",
  "story": "Celebrate the season with our exclusive Puja collection",
  "imageUrl": "https://...",
  "bannerImageUrl": "https://...",
  "primaryColor": "#d4af37",      # Gold
  "secondaryColor": "#8b0000",    # Deep red
  "accentColor": "#ffd700",       # Golden yellow
  "fontFamily": "Georgia, serif",  # Traditional serif
  "animationStyle": "fade",        # fade, slide, bounce, etc.
  "priority": 1,
  "active": true,
  "startsAt": "2024-10-01",
  "endsAt": "2024-11-15"
}
```

#### List All Themes
```bash
GET /api/admin/themes
```

#### Get Active/Seasonal Themes
```bash
GET /api/admin/themes/active
```
Returns only active themes within their date range.

#### Update Theme
```bash
PUT /api/admin/themes/{themeId}
{
  "primaryColor": "#new_color",
  "active": false,
  ...
}
```

#### Activate Theme
```bash
PUT /api/admin/themes/{themeId}/activate
```

#### Delete Theme
```bash
DELETE /api/admin/themes/{themeId}
```

### Theme Color Variables

When a content theme is active, these CSS variables are dynamically set:

```css
--color-primary: #d4af37       /* From theme.primaryColor */
--color-secondary: #8b0000     /* From theme.secondaryColor */
--color-accent: #ffd700        /* From theme.accentColor */
--font-family: "Georgia, serif" /* From theme.fontFamily */
```

## Frontend Implementation

### How Themes Work

1. **Page Load**:
   - App initializes and reads saved UI theme from localStorage
   - Applies UI theme (light/dark) via `data-theme` attribute
   - Fetches active content theme from `/api/admin/themes/active`
   - Applies admin theme colors via CSS variables

2. **User Toggles Dark/Light Mode**:
   - themeStore updates `resolvedUiTheme`
   - DOM updates `data-theme` attribute
   - All colors transition smoothly

3. **Admin Activates New Content Theme**:
   - Admin updates theme via API
   - Frontend polls or receives push notification (if implemented)
   - CSS variables automatically update
   - New colors apply to entire website

### Using Theme Colors in Components

#### Option 1: CSS Classes
```css
.button {
  background-color: var(--color-primary);
  color: var(--text-primary);
  border-color: var(--border-color);
}
```

#### Option 2: Inline Styles (React)
```tsx
<button style={{ 
  backgroundColor: 'var(--color-primary)',
  color: 'var(--text-primary)',
  borderColor: 'var(--border-color)'
}}>
  Click Me
</button>
```

#### Option 3: Tailwind CSS
```tsx
<div className="bg-primary text-primary border-primary">
  Content
</div>
```

(Requires Tailwind config to be updated with CSS variable mappings)

## File Locations

### Frontend Theme System
- `apps/web/src/store/themeStore.ts` - Main theme state management
- `apps/web/app/globals.css` - CSS variables definitions
- `apps/web/app/layout.tsx` - Root layout with theme setup
- `apps/web/app/providers.tsx` - Theme initialization
- `apps/web/app/components/Header.tsx` - Theme toggle button
- `apps/web/app/components/Footer.tsx` - Uses theme variables

### Backend Theme System
- `services/api/src/theme/theme.service.ts` - Theme business logic
- `services/api/src/theme/theme.controller.ts` - API endpoints
- `services/api/src/theme/theme.module.ts` - NestJS module

### Database
- Prisma Model: `Theme` table
- Stores: name, slug, colors, fonts, animations, date range, active status

## Best Practices

1. **Always use CSS variables** - Never hardcode colors
2. **Test both light and dark modes** - Components should look good in both
3. **Smooth transitions** - Use `transition: color 0.3s ease;` for color changes
4. **Accessibility** - Ensure sufficient contrast between text and background
5. **Theme colors as accents** - Use content theme colors for buttons, links, highlights
6. **Respect system preferences** - Default to 'system' theme when no user preference

## User Experience Flow

### First Visit
1. User lands on website
2. System checks OS dark mode preference
3. UI applies appropriate light/dark theme
4. Frontend fetches active content theme
5. Colors update to reflect seasonal theme

### Theme Toggle
1. User clicks Sun/Moon icon
2. Theme instantly switches
3. All components update colors
4. Preference saved to localStorage

### Admin Updates Theme
1. Admin activates new theme via API
2. Current visitors see new colors apply gradually
3. New visitors see theme immediately on load

## Example: Puja Theme Activation

### Admin Action
```bash
# Activate Puja theme
PUT /api/admin/themes/puja-2024/activate

# Or create and activate
POST /api/admin/themes
{
  "name": "Puja 2024",
  "slug": "puja-2024",
  "primaryColor": "#d4af37",
  "secondaryColor": "#8b0000",
  "accentColor": "#ffd700",
  "active": true,
  "startsAt": "2024-10-01",
  "endsAt": "2024-11-15"
}
```

### User Experience
- All primary CTAs (buttons, links) turn golden (#d4af37)
- Accents become deep red (#8b0000)
- Website feels festive and themed
- Can still toggle dark/light mode
- Preferences persist across sessions

## Future Enhancements

1. **Real-time Theme Updates** - WebSocket to push theme changes
2. **Theme Preview** - Admin can preview before activating
3. **Multi-brand Support** - Different themes for different regions
4. **Custom CSS** - Allow admins to upload custom CSS per theme
5. **A/B Testing** - Test themes with different user segments
6. **Theme Analytics** - Track which theme drives most conversions
