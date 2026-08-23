/**
 * Production bootstrap — NOT demo data.
 *
 *   npm run db:seed
 *
 * This creates only what the application cannot start without and what an admin
 * cannot create for themselves through the admin portal:
 *
 *   - the Admin role and one admin account (password set separately)
 *   - the `admin_settings` row, with every field blank so the storefront hides
 *     what has not been configured yet
 *   - the standard content pages the storefront looks up by slug
 *
 * Everything else — categories, themes, products, hampers, size guides,
 * announcements, influencers, Instagram posts — is real business data and is
 * entered in the admin portal. Nothing here fabricates it.
 *
 * The script is idempotent and never deletes: running it against a live
 * database adds what is missing and leaves existing rows untouched.
 */
import * as dotenv from 'dotenv';
import * as path from 'node:path';

// Run outside Nest, so nothing has loaded the env files yet.
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import { PrismaClient } from '@prisma/client';
import { STANDARD_PAGES } from '../src/cms/standard-pages';

const prisma = new PrismaClient();

const ADMIN_EMAIL = (process.env.SEED_ADMIN_EMAIL || 'admin@flyfree.com').trim().toLowerCase();
const ADMIN_NAME = process.env.SEED_ADMIN_NAME || 'Admin';

/**
 * Blank strings rather than samples: the footer, contact page and email
 * templates all skip a field they have no value for, so an unconfigured store
 * shows nothing instead of a placeholder address customers might write to.
 */
const DEFAULT_SETTINGS = {
  appName: 'Fly Free',
  appDescription: '',
  appLogo: '/brand/logo.png',
  appFavicon: '/favicon_io/favicon.ico',
  appTitle: 'Fly Free',
  seoTitle: 'Fly Free',
  seoDescription: '',
  contactEmail: '',
  contactPhone: '',
  supportEmail: '',
  businessName: 'Fly Free',
  ownerName: '',
  businessAddress: '',
  invoicePrefix: 'INV',
  orderPrefix: 'FF',
  gstNumber: '',
  gstPercent: 5,
  // Delivery is the only charge on top of the item total. Rupees.
  deliveryFee: 60,
  freeDeliveryAbove: 1000,
  footerText: '',
  newsletterTitle: '',
  newsletterText: '',
  newsletterSuccessMessage: '',
  whatsappMessage: '',
  homeHeroTitle: 'Wear Your Story',
  homeHeroSubtitle: 'Theme-led tees, custom prints, and everyday streetwear made for your mood.',
  homeHeroKicker: 'Fly Free',
  homeHeroCtaLabel: 'Shop now',
  homeHeroCtaHref: '/products',
  homeHeroImageUrl: 'https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=2400&q=85',
  homeAboutTitle: 'From Northeast Stories To Everyday Streetwear',
  homeAboutText: 'Fly Free brings culture, fandom, comfort, and custom design into tees people can wear every day.',
  homeAboutImageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=2400&q=85',
  homeCommunityTitle: 'Our Community',
  homeCommunityText: 'Bihu drop is live. Wear Northeast stories.',
  homeCommunityCtaLabel: 'Know more',
  homeCommunityCtaHref: '/about',
  socialLinks: {
    instagram: 'https://www.instagram.com/flyfree.ne/'
  } as Record<string, string>
};

const HOME_UI_KEYS = [
  'homeHeroTitle',
  'homeHeroSubtitle',
  'homeHeroKicker',
  'homeHeroCtaLabel',
  'homeHeroCtaHref',
  'homeHeroImageUrl',
  'homeAboutTitle',
  'homeAboutText',
  'homeAboutImageUrl',
  'homeCommunityTitle',
  'homeCommunityText',
  'homeCommunityCtaLabel',
  'homeCommunityCtaHref'
] as const;

async function seedAdmin() {
  const role = await prisma.role.upsert({
    where: { name: 'Admin' },
    update: {},
    create: {
      name: 'Admin',
      permissions: {
        create: [
          { action: 'manage_products' },
          { action: 'manage_orders' },
          { action: 'manage_users' },
          { action: 'view_analytics' },
          { action: 'manage_themes' }
        ]
      }
    }
  });

  const existing = await prisma.adminUser.findUnique({ where: { email: ADMIN_EMAIL } });
  if (existing) {
    console.log(`  admin account:  ${ADMIN_EMAIL} (already exists, left as is)`);
    return existing;
  }

  // passwordHash stays null: login rejects it until an operator runs
  // `npm run admin:set-password`, so a fresh deploy has no default credentials.
  const admin = await prisma.adminUser.create({
    data: { name: ADMIN_NAME, email: ADMIN_EMAIL, roleId: role.id }
  });

  console.log(`  admin account:  ${ADMIN_EMAIL} (created, no password yet)`);
  return admin;
}

async function seedSettings() {
  const existing = await prisma.appSetting.findUnique({ where: { key: 'admin_settings' } });

  if (existing) {
    // Fill in keys added since this row was written; never overwrite a value
    // an admin has already saved.
    const saved = existing.value as Record<string, any>;
    const merged = {
      ...DEFAULT_SETTINGS,
      ...saved,
      socialLinks: { ...DEFAULT_SETTINGS.socialLinks, ...(saved.socialLinks || {}) }
    };
    for (const key of HOME_UI_KEYS) {
      if (!String(merged[key] ?? '').trim()) {
        merged[key] = DEFAULT_SETTINGS[key];
      }
    }
    await prisma.appSetting.update({ where: { key: 'admin_settings' }, data: { value: merged } });
    console.log('  settings:       existing row kept, missing/blank Home UI keys filled in');
    return;
  }

  await prisma.appSetting.create({ data: { key: 'admin_settings', value: DEFAULT_SETTINGS } });
  console.log('  settings:       created (blank — fill these in at Admin → Settings)');
}

async function seedPages() {
  let created = 0;

  for (const page of STANDARD_PAGES) {
    const existing = await prisma.page.findFirst({ where: { slug: page.slug } });
    if (existing) continue;

    await prisma.page.create({
      data: {
        slug: page.slug,
        title: page.title,
        content: page.content,
        metaTitle: page.title,
        isPublished: true
      }
    });
    created += 1;
  }

  console.log(`  content pages:  ${created} created, ${STANDARD_PAGES.length - created} already present`);
}

async function main() {
  console.log('Bootstrapping Fly Free...\n');

  await seedAdmin();
  await seedSettings();
  await seedPages();

  console.log('\nBootstrap complete. Next steps:');
  console.log(`  1. npm run admin:set-password -- ${ADMIN_EMAIL} '<a real password>'`);
  console.log('  2. Admin → Settings: contact details, social links, delivery, GST');
  console.log('  3. Admin → Categories, Product Themes, Products: enter the real catalogue');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
