import { PrismaClient, ReviewStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * Catalog model used by this seed:
 * - Category  = fit / product type (Regular, Oversized, Jersey, Polo, Hoodie). Not gender.
 * - Theme     = design story (Spider-Man, Anime, Bihu, ...). A theme spans many fits,
 *               and a fit spans many themes. The relation emerges through products.
 * - Hamper    = gift box attached to a THEME. Any product in that theme can be bought
 *               on its own, or with the hamper box as a paid add-on.
 * Everything is unisex. There is no men/women split and no seasonal collections.
 */

const IMG = {
  regular: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=900&h=1100&fit=crop',
  oversized: 'https://images.unsplash.com/photo-1503341455253-b2b723bb12d5?w=900&h=1100&fit=crop',
  jersey: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=900&h=1100&fit=crop',
  polo: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=900&h=1100&fit=crop',
  hoodie: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=900&h=1100&fit=crop',
  alt1: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=900&h=1100&fit=crop',
  alt2: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=900&h=1100&fit=crop',
  alt3: 'https://images.unsplash.com/photo-1554568218-0f1715e72254?w=900&h=1100&fit=crop',
  alt4: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=900&h=1100&fit=crop',
  hamper: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=900&h=1100&fit=crop',
  hamperAlt: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=900&h=1100&fit=crop',
  banner: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1800&h=900&fit=crop',
};

const SIZES = ['XS', 'S', 'M', 'L', 'XL'];

async function wipe() {
  console.log('Clearing existing data...');
  await prisma.invoice.deleteMany();
  await prisma.referral.deleteMany();
  await prisma.orderStatusHistory.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.emailVerification.deleteMany();
  await prisma.review.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.influencer.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productHamper.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.theme.deleteMany();
  await prisma.category.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();
  await prisma.adminUser.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.newsletterSubscriber.deleteMany();
  await prisma.page.deleteMany();
  await prisma.appSetting.deleteMany();
  await prisma.websiteTheme.deleteMany();
  await prisma.sizeGuide.deleteMany();
  await prisma.instagramPost.deleteMany();
}

async function main() {
  await wipe();

  // ---------------------------------------------------------------- fits
  console.log('Creating fits (categories)...');
  const fitSpecs = [
    { name: 'Regular', slug: 'regular', imageUrl: IMG.regular, priority: 1 },
    { name: 'Oversized', slug: 'oversized', imageUrl: IMG.oversized, priority: 2 },
    { name: 'Jersey', slug: 'jersey', imageUrl: IMG.jersey, priority: 3 },
    { name: 'Polo', slug: 'polo', imageUrl: IMG.polo, priority: 4 },
    { name: 'Hoodie', slug: 'hoodie', imageUrl: IMG.hoodie, priority: 5 },
  ];
  const fits: Record<string, { id: string }> = {};
  for (const spec of fitSpecs) {
    fits[spec.slug] = await prisma.category.create({ data: spec });
  }

  // -------------------------------------------------------------- themes
  console.log('Creating themes...');
  const themeSpecs = [
    {
      name: 'Spider-Man', slug: 'spider-man', priority: 1, active: true,
      description: 'Web-slinger graphics with bold red and midnight blue.',
      story: 'Comic-panel linework and web textures printed on heavyweight cotton.',
      primaryColor: '#D32F2F', secondaryColor: '#1A237E', accentColor: '#FFC107',
    },
    {
      name: 'Anime', slug: 'anime', priority: 2, active: true,
      description: 'Nightblade cuts and shonen energy for everyday wear.',
      story: 'Hand-drawn panels inspired by late-night anime marathons.',
      primaryColor: '#7B1FA2', secondaryColor: '#00BCD4', accentColor: '#FF4081',
    },
    {
      name: 'Bihu', slug: 'bihu', priority: 3, active: true,
      description: 'Assamese heritage motifs, xorai patterns, and gamosa reds.',
      story: 'Northeast stories translated into wearable prints.',
      primaryColor: '#C62828', secondaryColor: '#F9A825', accentColor: '#2E7D32',
    },
    {
      name: 'Puja', slug: 'puja', priority: 4, active: true,
      description: 'Festival-ready prints in dhunuchi golds and alta reds.',
      story: 'Made for pandal hopping and family portraits.',
      primaryColor: '#E65100', secondaryColor: '#B71C1C', accentColor: '#FFD54F',
    },
    {
      name: 'Cricket', slug: 'cricket', priority: 5, active: true,
      description: 'Boundary-line jerseys and polos built for match day.',
      story: 'Breathable knits for the stands and the street.',
      primaryColor: '#1B5E20', secondaryColor: '#0D47A1', accentColor: '#FFEB3B',
    },
    {
      name: 'Retro', slug: 'retro', priority: 6, active: true,
      description: 'Static grain, faded gradients, and analogue nostalgia.',
      story: 'VHS artefacts and 90s colour palettes.',
      primaryColor: '#4527A0', secondaryColor: '#00838F', accentColor: '#FF7043',
    },
  ];
  const themes: Record<string, { id: string; name: string }> = {};
  for (const spec of themeSpecs) {
    themes[spec.slug] = await prisma.theme.create({
      data: { ...spec, imageUrl: IMG.banner, bannerImageUrl: IMG.banner },
    });
  }

  // ------------------------------------------------------------ products
  // Each theme spans several fits; each fit appears across several themes.
  console.log('Creating products...');
  const productSpecs: {
    name: string; theme: string; fit: string; price: number; mrp: number;
    images: string[]; featured?: boolean; trending?: boolean; newArrival?: boolean;
  }[] = [
    // Spider-Man
    { name: 'Web Strike Tee', theme: 'spider-man', fit: 'regular', price: 799, mrp: 1099, images: [IMG.regular, IMG.alt1], featured: true, newArrival: true },
    { name: 'Web Strike Oversized', theme: 'spider-man', fit: 'oversized', price: 899, mrp: 1299, images: [IMG.oversized, IMG.alt2], trending: true },
    { name: 'Spidey Match Jersey', theme: 'spider-man', fit: 'jersey', price: 1099, mrp: 1499, images: [IMG.jersey, IMG.alt3] },
    { name: 'Web Line Polo', theme: 'spider-man', fit: 'polo', price: 949, mrp: 1299, images: [IMG.polo, IMG.alt4] },

    // Anime
    { name: 'Nightblade Tee', theme: 'anime', fit: 'regular', price: 699, mrp: 999, images: [IMG.regular, IMG.alt2], featured: true },
    { name: 'Nightblade Oversized', theme: 'anime', fit: 'oversized', price: 849, mrp: 1199, images: [IMG.oversized, IMG.alt1], trending: true, newArrival: true },
    { name: 'Shonen Static Hoodie', theme: 'anime', fit: 'hoodie', price: 1399, mrp: 1899, images: [IMG.hoodie, IMG.alt3] },

    // Bihu
    { name: 'Bihu Xorai Tee', theme: 'bihu', fit: 'regular', price: 749, mrp: 1049, images: [IMG.regular, IMG.alt3], featured: true },
    { name: 'Bihu Xorai Jersey', theme: 'bihu', fit: 'jersey', price: 899, mrp: 1249, images: [IMG.jersey, IMG.alt1], newArrival: true },
    { name: 'Gamosa Stripe Polo', theme: 'bihu', fit: 'polo', price: 899, mrp: 1199, images: [IMG.polo, IMG.alt2] },

    // Puja
    { name: 'Festival Blessed Tee', theme: 'puja', fit: 'regular', price: 799, mrp: 1099, images: [IMG.regular, IMG.alt4], featured: true, newArrival: true },
    { name: 'Dhunuchi Oversized', theme: 'puja', fit: 'oversized', price: 949, mrp: 1349, images: [IMG.oversized, IMG.alt3], trending: true },
    { name: 'Pandal Nights Hoodie', theme: 'puja', fit: 'hoodie', price: 1449, mrp: 1999, images: [IMG.hoodie, IMG.alt1] },

    // Cricket
    { name: 'Boundary Polo', theme: 'cricket', fit: 'polo', price: 749, mrp: 1049, images: [IMG.polo, IMG.alt2], featured: true },
    { name: 'Match Day Jersey', theme: 'cricket', fit: 'jersey', price: 1149, mrp: 1599, images: [IMG.jersey, IMG.alt4], trending: true },
    { name: 'Twelfth Man Tee', theme: 'cricket', fit: 'regular', price: 699, mrp: 949, images: [IMG.regular, IMG.alt3] },

    // Retro
    { name: 'Retro Static Hoodie', theme: 'retro', fit: 'hoodie', price: 1299, mrp: 1799, images: [IMG.hoodie, IMG.alt2], featured: true, trending: true },
    { name: 'Analogue Grain Tee', theme: 'retro', fit: 'regular', price: 699, mrp: 999, images: [IMG.regular, IMG.alt1], newArrival: true },
    { name: 'VHS Oversized', theme: 'retro', fit: 'oversized', price: 899, mrp: 1249, images: [IMG.oversized, IMG.alt4] },
  ];

  const products: { id: string; slug: string; name: string; themeSlug: string }[] = [];

  for (const [index, spec] of productSpecs.entries()) {
    const slug = spec.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const skuBase = `FF-${spec.theme.toUpperCase().replace(/[^A-Z]/g, '')}-${index + 1}`;

    const product = await prisma.product.create({
      data: {
        name: spec.name,
        slug,
        sku: skuBase,
        description: `${spec.name} from the ${themes[spec.theme].name} drop. 220 GSM combed cotton with a DTG print that survives the wash. Unisex ${spec.fit} fit with taped shoulders.`,
        tags: [spec.theme, spec.fit, 'unisex'],
        material: '220 GSM combed cotton',
        washCare: 'Machine wash cold, inside out. Do not bleach. Tumble dry low.',
        price: spec.price * 100,
        mrp: spec.mrp * 100,
        discountPercent: Math.round(((spec.mrp - spec.price) / spec.mrp) * 100),
        gstPercent: 5,
        weightGrams: spec.fit === 'hoodie' ? 620 : 210,
        isVisible: true,
        isFeatured: Boolean(spec.featured),
        isTrending: Boolean(spec.trending),
        isNewArrival: Boolean(spec.newArrival),
        categoryId: fits[spec.fit].id,
        themeId: themes[spec.theme].id,
        images: {
          create: spec.images.map((url, i) => ({
            url,
            alt: `${spec.name} view ${i + 1}`,
            priority: i,
          })),
        },
      },
    });

    // one variant per size, all unisex, with stock
    for (const [sizeIndex, size] of SIZES.entries()) {
      const variant = await prisma.productVariant.create({
        data: {
          productId: product.id,
          sku: `${skuBase}-${size}`,
          color: 'Black',
          size,
          price: spec.price * 100,
        },
      });
      await prisma.inventory.create({
        data: {
          variantId: variant.id,
          stock: sizeIndex === 0 ? 4 : 25 - sizeIndex * 2,
          lowStockAlert: 5,
          warehouse: 'Guwahati',
        },
      });
    }

    products.push({ id: product.id, slug, name: spec.name, themeSlug: spec.theme });
  }

  // ------------------------------------------------------------- hampers
  // One gift box per theme. Any product in that theme can add it at checkout.
  console.log('Creating theme hampers...');
  const hamperSpecs = [
    { theme: 'spider-man', name: 'Spider-Man Gift Box', price: 500 },
    { theme: 'anime', name: 'Anime Collector Box', price: 450 },
    { theme: 'bihu', name: 'Bihu Festive Hamper', price: 550 },
    { theme: 'puja', name: 'Puja Gifting Hamper', price: 600 },
    { theme: 'cricket', name: 'Match Day Fan Box', price: 480 },
    { theme: 'retro', name: 'Retro Nostalgia Box', price: 520 },
  ];

  for (const [index, spec] of hamperSpecs.entries()) {
    await prisma.productHamper.create({
      data: {
        themeId: themes[spec.theme].id,
        name: spec.name,
        description: `Gift-ready box for the ${themes[spec.theme].name} drop. Your tee ships inside the box with themed extras.`,
        contents: [
          'Your selected tee',
          'Themed sticker pack',
          'Enamel keychain',
          'Mini lookbook card',
          'Reusable gift box + ribbon',
        ],
        imageUrl: IMG.hamper,
        images: [IMG.hamper, IMG.hamperAlt],
        sizeNote: 'Box fits one tee in any size (XS-XL).',
        price: spec.price * 100,
        gstPercent: 5,
        isActive: true,
        priority: index + 1,
      },
    });
  }

  // --------------------------------------------------------- size guides
  console.log('Creating size guides...');
  const sizeRows = [
    { size: 'XS', chest: '36"', shoulder: '16.5"', length: '26"', sleeve: '7.5"', priority: 1 },
    { size: 'S', chest: '38"', shoulder: '17.5"', length: '27"', sleeve: '8"', priority: 2 },
    { size: 'M', chest: '40"', shoulder: '18.5"', length: '28"', sleeve: '8.5"', priority: 3 },
    { size: 'L', chest: '42"', shoulder: '19.5"', length: '29"', sleeve: '9"', priority: 4 },
    { size: 'XL', chest: '44"', shoulder: '20.5"', length: '30"', sleeve: '9.5"', priority: 5 },
  ];
  for (const row of sizeRows) {
    await prisma.sizeGuide.create({ data: { ...row, active: true } });
  }

  // ------------------------------------------------------ website themes
  // These drive the site-wide CSS variables. One must always be active.
  console.log('Creating website themes...');
  const websiteTheme = await prisma.websiteTheme.create({
    data: {
      name: 'Fly Free Default',
      slug: 'fly-free-default',
      description: 'Core brand skin: red, blue, and gold on paper white.',
      primaryColor: '#FF4A4E',
      secondaryColor: '#00A8E8',
      accentColor: '#FFB703',
      backgroundColor: '#FFFFFF',
      textColor: '#111827',
      fontFamily: 'Inter, Arial, sans-serif',
      animationStyle: 'fade',
      priority: 1,
      isActive: true,
    },
  });

  await prisma.websiteTheme.create({
    data: {
      name: 'Festive Night',
      slug: 'festive-night',
      description: 'Darker festive skin for Puja and Bihu drops.',
      primaryColor: '#E65100',
      secondaryColor: '#B71C1C',
      accentColor: '#FFD54F',
      backgroundColor: '#12100E',
      textColor: '#F8F5F0',
      fontFamily: 'Inter, Arial, sans-serif',
      animationStyle: 'fade',
      priority: 2,
      isActive: false,
    },
  });

  // ------------------------------------------------------- announcements
  // These render as the scrolling marquee strip above the header.
  console.log('Creating announcements...');
  const announcements = [
    { title: 'New drop: Puja Edition', message: 'Festival-ready prints are live.', href: '/themes/puja', ctaLabel: 'Shop Puja' },
    { title: 'Bihu collection live', message: 'Wear Northeast stories.', href: '/themes/bihu', ctaLabel: 'Shop Bihu' },
    { title: 'Free shipping over ₹999', message: 'Applied automatically at checkout.', href: '/products', ctaLabel: 'Shop all' },
    { title: '30-day exchange', message: 'Easy size swaps on every order.', href: '/products', ctaLabel: 'Learn more' },
  ];
  for (const [index, item] of announcements.entries()) {
    await prisma.announcement.create({
      data: {
        ...item,
        type: 'EVENT',
        priority: index + 1,
        isActive: true,
        websiteThemeId: websiteTheme.id,
        startsAt: new Date(Date.now() - 86400000),
        endsAt: new Date(Date.now() + 86400000 * 60),
      },
    });
  }

  // ---------------------------------------------------------------- users
  console.log('Creating users...');
  const passwordHash = await bcrypt.hash('Password123', 10);
  const customers = await Promise.all([
    prisma.user.create({
      data: { name: 'Biswajit Das', email: 'dhrubajyotidas329@gmail.com', phone: '+919876543210', passwordHash, emailVerified: true, emailVerifiedAt: new Date() },
    }),
    prisma.user.create({
      data: { name: 'Priya Mehta', email: 'priya@example.com', phone: '+919876543211', passwordHash, emailVerified: true, emailVerifiedAt: new Date() },
    }),
    prisma.user.create({
      data: { name: 'Vikram Kalita', email: 'vikram@example.com', phone: '+919876543212', passwordHash, emailVerified: true, emailVerifiedAt: new Date() },
    }),
  ]);

  await prisma.address.create({
    data: {
      userId: customers[0].id,
      fullName: 'Biswajit Das',
      phone: '+919876543210',
      line1: 'House 21, Zoo Road',
      line2: 'Near RG Baruah Park',
      city: 'Guwahati',
      state: 'Assam',
      postalCode: '781024',
      country: 'India',
      isDefault: true,
    },
  });

  // --------------------------------------------------------------- admin
  console.log('Creating admin users...');
  const adminRole = await prisma.role.create({
    data: {
      name: 'Admin',
      permissions: {
        create: [
          { action: 'manage_products' },
          { action: 'manage_orders' },
          { action: 'manage_users' },
          { action: 'view_analytics' },
          { action: 'manage_themes' },
        ],
      },
    },
  });
  await prisma.adminUser.create({
    data: { name: 'Admin User', email: 'admin@flyfree.com', roleId: adminRole.id },
  });

  // --------------------------------------------------------- influencers
  console.log('Creating influencers...');
  const influencerSpecs = [
    { name: 'Aarav Sharma', email: 'aarav@example.com', code: 'AARAV10', handle: '@aarav.wears', followers: 48200, image: IMG.alt1 },
    { name: 'Maya Threads', email: 'maya@example.com', code: 'MAYA10', handle: '@maya.threads', followers: 91500, image: IMG.alt2 },
    { name: 'Rohit Baruah', email: 'rohit@example.com', code: 'ROHIT10', handle: '@rohit.fits', followers: 33800, image: IMG.alt3 },
    { name: 'Ananya Das', email: 'ananya@example.com', code: 'ANANYA10', handle: '@ananya.styles', followers: 65100, image: IMG.alt4 },
  ];
  for (const spec of influencerSpecs) {
    const themed = products.filter((p) => ['spider-man', 'bihu'].includes(p.themeSlug)).slice(0, 5);
    await prisma.influencer.create({
      data: {
        name: spec.name,
        email: spec.email,
        code: spec.code,
        imageUrl: spec.image,
        instagramUrl: `https://instagram.com/${spec.handle.replace('@', '')}`,
        socialHandle: spec.handle,
        followers: spec.followers,
        buyerDiscountPercent: 10,
        commissionRate: 5,
        isActive: true,
        products: { connect: themed.map((p) => ({ id: p.id })) },
      },
    });
  }

  // ------------------------------------------------------------- reviews
  console.log('Creating reviews...');
  const reviewSpecs = [
    { product: 0, user: 1, rating: 5, title: 'Print quality is unreal', body: 'Washed it four times and the web print has not cracked at all. Fit is true to size.' },
    { product: 1, user: 2, rating: 5, title: 'Perfect oversized drop', body: 'Shoulder seams sit exactly where they should. Fabric is heavy without being hot.' },
    { product: 4, user: 1, rating: 4, title: 'Great everyday tee', body: 'Colour is slightly deeper than the photos, which I actually prefer. Sizing runs a touch large.' },
    { product: 7, user: 2, rating: 5, title: 'Bought it for Bihu', body: 'The xorai detailing is beautiful and got compliments all day. Shipping to Guwahati was quick.' },
    { product: 13, user: 1, rating: 5, title: 'Match day sorted', body: 'Breathable enough for a full day in the stands. Collar has held its shape.' },
    { product: 16, user: 2, rating: 4, title: 'Cosy retro hoodie', body: 'Really warm and the gradient print looks exactly like the listing. Wish it had deeper pockets.' },
  ];
  for (const spec of reviewSpecs) {
    await prisma.review.create({
      data: {
        productId: products[spec.product].id,
        userId: customers[spec.user].id,
        rating: spec.rating,
        title: spec.title,
        body: spec.body,
        mediaUrls: [],
        status: ReviewStatus.APPROVED,
      },
    });
  }

  // ---------------------------------------------------- instagram posts
  console.log('Creating Instagram posts...');
  const instagramSpecs = [
    { imageUrl: IMG.regular, caption: 'Bihu drop is live. Wear Northeast stories.' },
    { imageUrl: IMG.oversized, caption: 'Puja gifting open. Gift-ready tees and hamper boxes.' },
    { imageUrl: IMG.alt1, caption: 'Spider-Man collection restocked in every size.' },
    { imageUrl: IMG.alt2, caption: 'Oversized fits that hit different. 220 GSM combed cotton.' },
    { imageUrl: IMG.alt3, caption: 'Anime drop back in stock. Nightblade in all sizes.' },
    { imageUrl: IMG.hoodie, caption: 'Retro static hoodie. Built for the cold season.' },
  ];
  for (const [index, spec] of instagramSpecs.entries()) {
    await prisma.instagramPost.create({
      data: {
        imageUrl: spec.imageUrl,
        caption: spec.caption,
        instagramLink: 'https://instagram.com/flyfree_styles',
        displayOrder: index + 1,
      },
    });
  }

  // ------------------------------------------------------------ settings
  console.log('Creating app settings...');
  await prisma.appSetting.create({
    data: { key: 'gst', value: { gstPercent: 5 } },
  });
  await prisma.appSetting.create({
    data: { key: 'shipping', value: { flatRate: 7900, freeAbove: 99900 } },
  });
  await prisma.appSetting.create({
    data: { key: 'branding', value: { appLogo: '/brand/logo.png', appFavicon: '/favicon_io/favicon.ico' } },
  });

  await prisma.page.create({
    data: {
      slug: 'size-chart',
      title: 'Size Chart',
      content: 'All measurements are in inches and taken flat. Unisex sizing across every fit.',
    },
  });

  console.log('\nSeed complete');
  console.log(`  fits:        ${fitSpecs.length}`);
  console.log(`  themes:      ${themeSpecs.length}`);
  console.log(`  products:    ${products.length}`);
  console.log(`  hampers:     ${hamperSpecs.length}`);
  console.log(`  reviews:     ${reviewSpecs.length}`);
  console.log(`  influencers: ${influencerSpecs.length}`);
  console.log('\n  admin login:    admin@flyfree.com');
  console.log('  customer login: dhrubajyotidas329@gmail.com / Password123');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
