import { PrismaClient } from '@prisma/client';

declare const process: { exit(code?: number): never };

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data (order matters due to foreign keys)
  await prisma.invoice.deleteMany();
  await prisma.referral.deleteMany();
  await prisma.influencer.deleteMany();
  await prisma.orderStatusHistory.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.emailVerification.deleteMany();
  await prisma.review.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.inventory.deleteMany(); // Delete inventory before variants
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.theme.deleteMany();
  await prisma.category.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();
  await prisma.adminUser.deleteMany(); // Delete adminUser before role
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.page.deleteMany();
  await prisma.appSetting.deleteMany();
  await prisma.customizationRequest.deleteMany();
  await prisma.websiteTheme.deleteMany();

  // Delete size guides
  try {
    // @ts-ignore - Type checking may lag behind schema
    await prisma.sizeGuide.deleteMany();
  } catch (error) {
    console.log('ℹ️  SizeGuide table not yet available');
  }

  // Create Categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Men',
        slug: 'men',
        priority: 1,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Women',
        slug: 'women',
        priority: 2,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Unisex',
        slug: 'unisex',
        priority: 3,
      },
    }),
  ]);

  // Create Themes
  const themeStory = 'A merch theme is a storytelling drop: visual direction, campaign colors, animation feel, and product grouping. It is separate from the customer dark/light mode preference.';
  const themes = await Promise.all([
    prisma.theme.create({ data: { name: 'Anime', slug: 'anime', description: 'Bold anime-inspired drops for fans.', story: `${themeStory} Anime focuses on energetic art, expressive poses, and fandom confidence.`, primaryColor: '#ff4f8b', secondaryColor: '#111827', accentColor: '#ffd166', fontFamily: 'Poppins, Arial, sans-serif', animationStyle: 'snap-slide', priority: 1, active: true, imageUrl: 'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=900', bannerImageUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1600' } }),
    prisma.theme.create({ data: { name: 'Bihu', slug: 'bihu', description: 'Assam heritage and festival expression.', story: 'Rooted in the vibrant heritage of Northeast India, this drop celebrates Bihu, culture, rhythm, and everyday pride through wearable stories.', primaryColor: '#8b1e16', secondaryColor: '#f2c14e', accentColor: '#2f6f4e', fontFamily: 'Georgia, serif', animationStyle: 'soft-wave', priority: 2, active: true, imageUrl: 'https://images.unsplash.com/photo-1600694446265-358f7fabc2c6?w=900', bannerImageUrl: 'https://images.unsplash.com/photo-1602848597941-0d3d3a2c1241?w=1600' } }),
    prisma.theme.create({ data: { name: 'Puja Festival', slug: 'puja-festival', description: 'Festive gifting and family-ready tees.', story: 'A celebratory drop for Puja season with warm palettes, gift-ready styling, and pieces made for family, friends, and mass orders.', primaryColor: '#b42318', secondaryColor: '#f97316', accentColor: '#facc15', fontFamily: 'Inter, Arial, sans-serif', animationStyle: 'glow', priority: 3, active: true, imageUrl: 'https://images.unsplash.com/photo-1607861716497-e65ab29fc7ac?w=900', bannerImageUrl: 'https://images.unsplash.com/photo-1604608678051-64d46d8f20df?w=1600' } }),
    prisma.theme.create({ data: { name: 'Spider-Man', slug: 'spider-man', description: 'Red-blue superhero inspired energy.', story: `${themeStory} Spider-Man is a high-motion campaign for web-slinger fans, comic style, and bold color-block graphics.`, primaryColor: '#d90429', secondaryColor: '#0057b8', accentColor: '#ffffff', fontFamily: 'Arial Black, Arial, sans-serif', animationStyle: 'web-swing', priority: 4, active: true, imageUrl: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=900', bannerImageUrl: 'https://images.unsplash.com/photo-1636487658580-04eeffec7d7d?w=1600' } }),
    prisma.theme.create({ data: { name: 'Minimal', slug: 'minimal', description: 'Clean essentials for everyday wear.', story: 'A comfort-first theme for simple, premium basics with careful fabric, fit, and no compromise in quality.', primaryColor: '#111111', secondaryColor: '#f5f5f5', accentColor: '#777777', fontFamily: 'Inter, Arial, sans-serif', animationStyle: 'fade', priority: 5, active: true } }),
    prisma.theme.create({ data: { name: 'Graphic', slug: 'graphic', description: 'Art-led graphic apparel.', story: 'A creative playground for expressive artwork, bold prints, and custom crafted visuals.', primaryColor: '#ff006e', secondaryColor: '#00d9ff', accentColor: '#8338ec', fontFamily: 'Bebas Neue, Arial, sans-serif', animationStyle: 'pop', priority: 6, active: true } }),
    prisma.theme.create({ data: { name: 'Gaming', slug: 'gaming', description: 'Game culture and esports-inspired tees.', story: 'Fast, electric, and playful pieces for gamers and creators.', primaryColor: '#00ff41', secondaryColor: '#0d0221', accentColor: '#ff00ff', fontFamily: 'Courier New, monospace', animationStyle: 'pulse', priority: 7, active: true } }),
  ]);

  // Create Collections
  const collections = await Promise.all([
    prisma.collection.create({
      data: { name: 'Summer', slug: 'summer', priority: 1 },
    }),
    prisma.collection.create({
      data: { name: 'Winter', slug: 'winter', priority: 2 },
    }),
    prisma.collection.create({
      data: { name: 'Festive', slug: 'festive', priority: 3 },
    }),
    prisma.collection.create({
      data: { name: 'New Arrival', slug: 'new-arrival', priority: 4 },
    }),
  ]);

  // Create Size Guides
  await Promise.all([
    prisma.sizeGuide.create({
      data: {
        size: 'S',
        chest: '44"',
        shoulder: '20.5"',
        length: '28"',
        sleeve: '8.5"',
        priority: 1,
        active: true,
      },
    }),
    prisma.sizeGuide.create({
      data: {
        size: 'M',
        chest: '46"',
        shoulder: '21.5"',
        length: '29"',
        sleeve: '9"',
        priority: 2,
        active: true,
      },
    }),
    prisma.sizeGuide.create({
      data: {
        size: 'L',
        chest: '48"',
        shoulder: '22.5"',
        length: '30"',
        sleeve: '9.5"',
        priority: 3,
        active: true,
      },
    }),
    prisma.sizeGuide.create({
      data: {
        size: 'XL',
        chest: '51"',
        shoulder: '23.5"',
        length: '30.5"',
        sleeve: '10"',
        priority: 4,
        active: true,
      },
    }),
  ]);

  // Sample Products Data
  const productsData = [
    // Anime Collection
    {
      name: 'Naruto Power',
      slug: 'naruto-power',
      sku: 'NARUTO-001',
      description: 'Epic Naruto ninja design - Perfect for anime lovers',
      categoryId: categories[2].id,
      themeId: themes[0].id,
      collectionId: collections[3].id,
      price: 49900,
      mrp: 79900,
      discountPercent: 38,
      color: 'Black',
      tags: ['anime', 'naruto', 'trending'],
      isFeatured: true,
      isTrending: true,
    },
    {
      name: 'One Piece Adventure',
      slug: 'one-piece-adventure',
      sku: 'ONEPIECE-001',
      description: 'Luffy and crew sailing the seas',
      categoryId: categories[0].id,
      themeId: themes[0].id,
      collectionId: collections[3].id,
      price: 49900,
      mrp: 79900,
      discountPercent: 38,
      color: 'Navy',
      tags: ['anime', 'one-piece'],
      isFeatured: false,
      isTrending: true,
    },
    {
      name: 'Dragon Ball Z Goku',
      slug: 'dragon-ball-z-goku',
      sku: 'DBZ-001',
      description: 'Powerful Goku Kamehameha pose',
      categoryId: categories[0].id,
      themeId: themes[0].id,
      collectionId: collections[3].id,
      price: 44900,
      mrp: 74900,
      discountPercent: 40,
      color: 'Orange',
      tags: ['anime', 'dbz'],
      isFeatured: true,
      isTrending: false,
    },

    // Marvel Collection
    {
      name: 'Iron Man Classic',
      slug: 'iron-man-classic',
      sku: 'IRONMAN-001',
      description: 'Classic Iron Man armor design',
      categoryId: categories[0].id,
      themeId: themes[3].id,
      collectionId: collections[3].id,
      price: 54900,
      mrp: 89900,
      discountPercent: 39,
      color: 'Red',
      tags: ['marvel', 'ironman', 'superhero'],
      isFeatured: true,
      isTrending: true,
    },
    {
      name: 'Captain America Shield',
      slug: 'captain-america-shield',
      sku: 'CAPAMERICA-001',
      description: 'Classic Captain America shield design',
      categoryId: categories[1].id,
      themeId: themes[3].id,
      collectionId: collections[3].id,
      price: 49900,
      mrp: 79900,
      discountPercent: 37,
      color: 'Blue',
      tags: ['marvel', 'captain-america'],
      isFeatured: false,
      isTrending: true,
    },
    {
      name: 'Thor Mjolnir',
      slug: 'thor-mjolnir',
      sku: 'THOR-001',
      description: 'Thunder God Thor with Mjolnir',
      categoryId: categories[0].id,
      themeId: themes[3].id,
      collectionId: collections[3].id,
      price: 52900,
      mrp: 84900,
      discountPercent: 38,
      color: 'Gold',
      tags: ['marvel', 'thor'],
      isFeatured: false,
      isTrending: false,
    },

    // Spider-Man Collection
    {
      name: 'Spider-Man Red Suit',
      slug: 'spider-man-red-suit',
      sku: 'SPIDERMAN-001',
      description: 'Amazing Spider-Man iconic red suit',
      categoryId: categories[0].id,
      themeId: themes[3].id,
      collectionId: collections[3].id,
      price: 49900,
      mrp: 79900,
      discountPercent: 38,
      color: 'Red',
      tags: ['marvel', 'spider-man', 'superhero'],
      isFeatured: true,
      isTrending: true,
    },
    {
      name: 'Spider-Man Black Suit',
      slug: 'spider-man-black-suit',
      sku: 'SPIDERMAN-002',
      description: 'Symbiote Black Suit Spider-Man',
      categoryId: categories[0].id,
      themeId: themes[3].id,
      collectionId: collections[3].id,
      price: 49900,
      mrp: 79900,
      discountPercent: 38,
      color: 'Black',
      tags: ['marvel', 'spider-man'],
      isFeatured: false,
      isTrending: false,
    },

    // Assam Collection
    {
      name: 'Bihu Festival',
      slug: 'bihu-festival',
      sku: 'BIHU-001',
      description: 'Celebrate Bihu with this cultural design',
      categoryId: categories[2].id,
      themeId: themes[1].id,
      collectionId: collections[2].id,
      price: 39900,
      mrp: 64900,
      discountPercent: 38,
      color: 'White',
      tags: ['assam', 'cultural', 'festive'],
      isFeatured: true,
      isTrending: false,
    },
    {
      name: 'Assam Pride',
      slug: 'assam-pride',
      sku: 'ASSAM-001',
      description: 'Proud Assamese heritage tee',
      categoryId: categories[1].id,
      themeId: themes[1].id,
      collectionId: collections[2].id,
      price: 39900,
      mrp: 64900,
      discountPercent: 38,
      color: 'Maroon',
      tags: ['assam', 'cultural'],
      isFeatured: false,
      isTrending: false,
    },

    // Minimal Collection
    {
      name: 'Pure Black Minimal',
      slug: 'pure-black-minimal',
      sku: 'MINIMAL-001',
      description: 'Classic minimal black tee',
      categoryId: categories[2].id,
      themeId: themes[4].id,
      collectionId: collections[0].id,
      price: 29900,
      mrp: 49900,
      discountPercent: 40,
      color: 'Black',
      tags: ['minimal', 'classic'],
      isFeatured: true,
      isTrending: true,
    },
    {
      name: 'Pure White Minimal',
      slug: 'pure-white-minimal',
      sku: 'MINIMAL-002',
      description: 'Clean white essential tee',
      categoryId: categories[2].id,
      themeId: themes[4].id,
      collectionId: collections[0].id,
      price: 29900,
      mrp: 49900,
      discountPercent: 40,
      color: 'White',
      tags: ['minimal', 'classic'],
      isFeatured: false,
      isTrending: false,
    },

    // Graphic Collection
    {
      name: 'Geometric Vibes',
      slug: 'geometric-vibes',
      sku: 'GRAPHIC-001',
      description: 'Modern geometric design',
      categoryId: categories[1].id,
      themeId: themes[5].id,
      collectionId: collections[0].id,
      price: 39900,
      mrp: 64900,
      discountPercent: 38,
      color: 'Pink',
      tags: ['graphic', 'modern'],
      isFeatured: true,
      isTrending: true,
    },
    {
      name: 'Abstract Art',
      slug: 'abstract-art',
      sku: 'GRAPHIC-002',
      description: 'Abstract artistic print',
      categoryId: categories[0].id,
      themeId: themes[5].id,
      collectionId: collections[0].id,
      price: 39900,
      mrp: 64900,
      discountPercent: 38,
      color: 'Cyan',
      tags: ['graphic', 'art'],
      isFeatured: false,
      isTrending: false,
    },

    // Gaming Collection
    {
      name: 'Gamer Power',
      slug: 'gamer-power',
      sku: 'GAMING-001',
      description: 'Level up your gaming style',
      categoryId: categories[0].id,
      themeId: themes[6].id,
      collectionId: collections[0].id,
      price: 44900,
      mrp: 74900,
      discountPercent: 40,
      color: 'Green',
      tags: ['gaming', 'esports'],
      isFeatured: true,
      isTrending: true,
    },
    {
      name: 'Console Legend',
      slug: 'console-legend',
      sku: 'GAMING-002',
      description: 'For the gaming legends',
      categoryId: categories[1].id,
      themeId: themes[6].id,
      collectionId: collections[0].id,
      price: 44900,
      mrp: 74900,
      discountPercent: 40,
      color: 'Magenta',
      tags: ['gaming'],
      isFeatured: false,
      isTrending: false,
    },
  ];

  // Create Products
  console.log(`📦 Creating ${productsData.length} products...`);
  for (const productData of productsData) {
    const product = await prisma.product.create({
      data: {
        name: productData.name,
        slug: productData.slug,
        sku: productData.sku,
        description: productData.description,
        categoryId: productData.categoryId,
        themeId: productData.themeId,
        collectionId: productData.collectionId,
        price: productData.price,
        mrp: productData.mrp,
        discountPercent: productData.discountPercent,
        tags: productData.tags,
        isFeatured: productData.isFeatured,
        isTrending: productData.isTrending,
        isNewArrival: false,
        isVisible: false,
        seoTitle: `${productData.name} - Fly Free`,
        seoDescription: productData.description,
      },
    });

    // Create product images for gallery and color switching
    const imageUrls = [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=900&h=1100&fit=crop',
      'https://images.unsplash.com/photo-1554521666-7deae28e1168?w=900&h=1100&fit=crop',
      'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=900&h=1100&fit=crop',
      'https://images.unsplash.com/photo-1503341455253-b2b723bb12d5?w=900&h=1100&fit=crop',
    ];

    await prisma.productImage.createMany({
      data: [
        {
          productId: product.id,
          color: productData.color,
          url: imageUrls[0],
          alt: `${product.name} front view`,
          priority: 0,
        },
        {
          productId: product.id,
          color: 'Black',
          url: imageUrls[1],
          alt: `${product.name} black color`,
          priority: 1,
        },
        {
          productId: product.id,
          color: 'White',
          url: imageUrls[2],
          alt: `${product.name} white color`,
          priority: 2,
        },
        {
          productId: product.id,
          color: productData.color,
          url: imageUrls[3],
          alt: `${product.name} print detail`,
          priority: 3,
        },
      ],
    });

    // Create product variants (colors & sizes)
    const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
    const colors = ['Black', 'White', 'Navy', 'Red', 'Blue', 'Green'];

    for (const size of sizes) {
      for (const color of colors) {
        const variant = await prisma.productVariant.create({
          data: {
            productId: product.id,
            sku: `${product.sku}-${size}-${color}`,
            color,
            size,
          },
        });

        // Create inventory
        await prisma.inventory.create({
          data: {
            variantId: variant.id,
            stock: Math.floor(Math.random() * 100) + 10,
            lowStockAlert: 5,
          },
        });
      }
    }
  }

  // Create Coupons
  console.log('🎟️ Creating coupons...');
  const coupons = await Promise.all([
    prisma.coupon.create({
      data: {
        code: 'WELCOME10',
        description: '10% off on first order',
        discountPercent: 10,
        minOrderAmount: 0,
        isActive: true,
      },
    }),
    prisma.coupon.create({
      data: {
        code: 'FLY100',
        description: 'Flat ₹100 off',
        discountAmount: 10000,
        minOrderAmount: 50000,
        isActive: true,
      },
    }),
    prisma.coupon.create({
      data: {
        code: 'BUY2GET10',
        description: '10% off on 2+ items',
        discountPercent: 10,
        minOrderAmount: 0,
        isActive: true,
      },
    }),
    prisma.coupon.create({
      data: {
        code: 'SUMMER20',
        description: '20% off on summer collection',
        discountPercent: 20,
        minOrderAmount: 0,
        isActive: true,
      },
    }),
  ]);

  // Create Test Users
  console.log('👥 Creating test users...');
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'john@example.com',
        name: 'John Doe',
        phone: '9876543210',
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        email: 'jane@example.com',
        name: 'Jane Smith',
        phone: '9876543211',
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        phone: '9876543212',
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    }),
  ]);

  // Create Addresses for Users
  console.log('📍 Creating addresses...');
  const addresses = await Promise.all([
    prisma.address.create({
      data: {
        userId: users[0].id,
        fullName: 'John Doe',
        phone: '9876543210',
        line1: '123 Main Street',
        line2: 'Apt 4B',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400001',
        country: 'India',
      },
    }),
    prisma.address.create({
      data: {
        userId: users[0].id,
        fullName: 'John Doe',
        phone: '9876543210',
        line1: '456 Park Avenue',
        city: 'Bangalore',
        state: 'Karnataka',
        postalCode: '560001',
        country: 'India',
      },
    }),
    prisma.address.create({
      data: {
        userId: users[1].id,
        fullName: 'Jane Smith',
        phone: '9876543211',
        line1: '789 Ocean Drive',
        city: 'Chennai',
        state: 'Tamil Nadu',
        postalCode: '600001',
        country: 'India',
      },
    }),
  ]);

  // Create Admin Roles
  console.log('🔐 Creating admin roles...');
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

  // Create Admin Users
  console.log('👨‍💼 Creating admin users...');
  const admins = await Promise.all([
    prisma.adminUser.create({
      data: {
        name: 'Admin User',
        email: 'admin@flyfree.com',
        roleId: adminRole.id,
      },
    }),
    prisma.adminUser.create({
      data: {
        name: 'Manager User',
        email: 'manager@flyfree.com',
        roleId: adminRole.id,
      },
    }),
  ]);

  // Create Sample Orders
  console.log('📦 Creating sample orders...');
  const products = await prisma.product.findMany({ take: 16 });
  const variants = await prisma.productVariant.findMany({ take: 6 });

  const orders = await Promise.all([
    prisma.order.create({
      data: {
        userId: users[0].id,
        shippingAddressId: addresses[0].id,
        status: 'DELIVERED',
        reviewRequestSentAt: new Date(),
        reviewSubmittedAt: new Date(),
        subtotal: 99800,
        discount: 10000,
        shippingFee: 0,
        tax: 14970,
        total: 104770,
        items: {
          create: [
            {
              productId: products[0].id,
              variantId: variants[0].id,
              name: products[0].name,
              sku: variants[0].sku,
              price: 49900,
              quantity: 2,
            },
          ],
        },
      },
    }),
    prisma.order.create({
      data: {
        userId: users[1].id,
        shippingAddressId: addresses[2].id,
        status: 'SHIPPED',
        reviewRequestSentAt: new Date(),
        subtotal: 49900,
        discount: 5000,
        shippingFee: 0,
        tax: 6735,
        total: 51635,
        items: {
          create: [
            {
              productId: products[1].id,
              variantId: variants[1].id,
              name: products[1].name,
              sku: variants[1].sku,
              price: 49900,
              quantity: 1,
            },
          ],
        },
      },
    }),
    prisma.order.create({
      data: {
        userId: users[2].id,
        shippingAddressId: addresses[0].id,
        status: 'CONFIRMED',
        subtotal: 149700,
        discount: 15000,
        shippingFee: 50,
        tax: 20220,
        total: 154970,
        items: {
          create: [
            {
              productId: products[2].id,
              variantId: variants[2].id,
              name: products[2].name,
              sku: variants[2].sku,
              price: 44900,
              quantity: 3,
            },
          ],
        },
      },
    }),
  ]);

  // Create payments, influencers, referral attribution, and invoices
  await Promise.all([
    prisma.payment.create({
      data: {
        orderId: orders[0].id,
        status: 'PAID',
        amount: orders[0].total,
        providerPaymentId: 'rzp_demo_delivered_001',
        paidAt: new Date(),
      },
    }),
    prisma.payment.create({
      data: {
        orderId: orders[1].id,
        status: 'PAID',
        amount: orders[1].total,
        providerPaymentId: 'rzp_demo_shipped_002',
        paidAt: new Date(),
      },
    }),
    prisma.payment.create({
      data: {
        orderId: orders[2].id,
        status: 'PENDING',
        amount: orders[2].total,
      },
    }),
  ]);

  const influencers = await Promise.all([
    prisma.influencer.create({
      data: {
        name: 'Aarav Style',
        email: 'aarav.influencer@example.com',
        code: 'AARAV20',
        linkKey: 'AARAVSTYLE',
        imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
        instagramUrl: 'https://instagram.com/aaravstyle',
        facebookUrl: 'https://facebook.com/aaravstyle',
        xUrl: 'https://x.com/aaravstyle',
        socialHandle: '@aaravstyle',
        followers: 82000,
        buyerDiscountPercent: 20,
        commissionRate: 8,
        totalEarnings: 8382,
        totalReferrals: 1,
        productId: products[0].id,
      },
    }),
    prisma.influencer.create({
      data: {
        name: 'Maya Threads',
        email: 'maya.threads@example.com',
        code: 'MAYA15',
        linkKey: 'MAYATHREADS',
        imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
        instagramUrl: 'https://instagram.com/mayathreads',
        facebookUrl: 'https://facebook.com/mayathreads',
        xUrl: 'https://x.com/mayathreads',
        socialHandle: '@mayathreads',
        followers: 54000,
        buyerDiscountPercent: 15,
        commissionRate: 6,
        totalEarnings: 3100,
        totalReferrals: 1,
        productId: products[3].id,
      },
    }),
  ]);

  await Promise.all([
    prisma.referral.create({
      data: {
        influencerId: influencers[0].id,
        orderId: orders[0].id,
        code: influencers[0].code,
        linkKey: influencers[0].linkKey,
        clicks: 128,
        conversions: 1,
        buyerDiscountPercent: 20,
        commissionAmount: 8382,
        totalEarnings: 8382,
        convertedAt: orders[0].createdAt,
      },
    }),
    prisma.referral.create({
      data: {
        influencerId: influencers[1].id,
        orderId: orders[1].id,
        code: influencers[1].code,
        linkKey: influencers[1].linkKey,
        clicks: 74,
        conversions: 1,
        buyerDiscountPercent: 15,
        commissionAmount: 3100,
        totalEarnings: 3100,
        convertedAt: orders[1].createdAt,
      },
    }),
  ]);

  await Promise.all([
    prisma.invoice.create({
      data: { orderId: orders[0].id, invoiceNumber: 'INV-2026-00001', status: 'SENT', sentAt: new Date() },
    }),
    prisma.invoice.create({
      data: { orderId: orders[1].id, invoiceNumber: 'INV-2026-00002', status: 'GENERATED' },
    }),
  ]);

  await Promise.all([
    prisma.orderStatusHistory.createMany({
      data: [
        { orderId: orders[0].id, fromStatus: null, toStatus: 'PLACED', note: 'Order created after Razorpay payment success.', changedBy: 'system' },
        { orderId: orders[0].id, fromStatus: 'PLACED', toStatus: 'CONFIRMED', note: 'Admin accepted the order.', changedBy: admins[0].email },
        { orderId: orders[0].id, fromStatus: 'CONFIRMED', toStatus: 'PACKED', note: 'Packed at warehouse.', changedBy: admins[0].email },
        { orderId: orders[0].id, fromStatus: 'PACKED', toStatus: 'SHIPPED', note: 'Shipment handed to courier.', changedBy: admins[1].email },
        { orderId: orders[0].id, fromStatus: 'SHIPPED', toStatus: 'DELIVERED', note: 'Delivery completed.', changedBy: 'system' },
      ],
    }),
    prisma.orderStatusHistory.createMany({
      data: [
        { orderId: orders[1].id, fromStatus: null, toStatus: 'PLACED', note: 'Influencer order created after Razorpay payment success.', changedBy: 'system' },
        { orderId: orders[1].id, fromStatus: 'PLACED', toStatus: 'CONFIRMED', note: 'Admin accepted the order.', changedBy: admins[0].email },
        { orderId: orders[1].id, fromStatus: 'CONFIRMED', toStatus: 'PACKED', note: 'Packed and ready to ship.', changedBy: admins[1].email },
        { orderId: orders[1].id, fromStatus: 'PACKED', toStatus: 'SHIPPED', note: 'Tracking shared with customer.', changedBy: admins[1].email },
      ],
    }),
    prisma.orderStatusHistory.createMany({
      data: [
        { orderId: orders[2].id, fromStatus: null, toStatus: 'PLACED', note: 'Order created, payment pending.', changedBy: 'system' },
        { orderId: orders[2].id, fromStatus: 'PLACED', toStatus: 'CONFIRMED', note: 'Admin accepted pending-payment order.', changedBy: admins[0].email },
      ],
    }),
  ]);

  // Create Reviews
  console.log('⭐ Creating product reviews...');
  await Promise.all([
    prisma.review.create({
      data: {
        userId: users[0].id,
        productId: products[0].id,
        orderId: orders[0].id,
        rating: 5,
        title: 'Absolutely amazing!',
        body: 'Great quality and fit. Will definitely buy again!',
        status: 'APPROVED',
      },
    }),
    prisma.review.create({
      data: {
        userId: users[1].id,
        productId: products[0].id,
        orderId: orders[1].id,
        rating: 4,
        title: 'Good quality',
        body: 'Nice t-shirt, sizing runs a bit small',
        status: 'APPROVED',
      },
    }),
    prisma.review.create({
      data: {
        userId: users[0].id,
        productId: products[1].id,
        rating: 5,
        title: 'Perfect design',
        body: 'The anime design is exactly as shown',
        status: 'APPROVED',
      },
    }),
    prisma.review.create({
      data: {
        userId: users[2].id,
        productId: products[2].id,
        rating: 3,
        title: 'Average',
        body: 'Okay product, nothing special',
        status: 'PENDING',
      },
    }),
  ]);

  // Create Wishlist Items
  console.log('❤️ Creating wishlist items...');
  await Promise.all([
    prisma.wishlist.create({
      data: {
        userId: users[0].id,
        productId: products[3].id,
      },
    }),
    prisma.wishlist.create({
      data: {
        userId: users[0].id,
        productId: products[4].id,
      },
    }),
    prisma.wishlist.create({
      data: {
        userId: users[1].id,
        productId: products[5].id,
      },
    }),
  ]);

  // Create Cart Items
  console.log('🛒 Creating cart items...');
  const cart1 = await prisma.cart.create({
    data: { userId: users[0].id },
  });

  const cart2 = await prisma.cart.create({
    data: { userId: users[1].id },
  });

  await Promise.all([
    prisma.cartItem.create({
      data: {
        cartId: cart1.id,
        variantId: variants[0].id,
        quantity: 1,
      },
    }),
    prisma.cartItem.create({
      data: {
        cartId: cart1.id,
        variantId: variants[1].id,
        quantity: 2,
      },
    }),
    prisma.cartItem.create({
      data: {
        cartId: cart2.id,
        variantId: variants[2].id,
        quantity: 1,
      },
    }),
  ]);

  // Create Custom Design samples
  console.log('🎨 Creating custom design samples...');
  try {
    await (prisma as any).customDesign.createMany({
      data: [
        {
          userId: users[0].id,
          title: 'My Anime Design',
          description: 'Custom anime character design for personal use',
          images: ['https://via.placeholder.com/300x300/111827/ffffff?text=Anime+Design'],
          size: 'M',
          color: 'black',
          placement: 'front',
          notes: 'High quality print preferred',
          status: 'APPROVED',
          price: 59900
        },
        {
          userId: users[1].id,
          title: 'Custom Logo Tee',
          description: 'Custom logo design for team',
          images: ['https://via.placeholder.com/300x300/ff6b5b/ffffff?text=Logo+Design'],
          size: 'L',
          color: 'white',
          placement: 'front',
          notes: 'For team event',
          status: 'PENDING',
          price: null
        }
      ]
    });
  } catch (error) {
    console.log('⚠️ CustomDesign seeding skipped (model may not exist yet)');
  }

  const websiteThemes = await Promise.all([
    prisma.websiteTheme.create({
      data: {
        name: 'Puja Festival Website',
        slug: 'puja-festival-website',
        description: 'Global festive site skin with warm colors, hero banner, and Puja gifting mood.',
        primaryColor: '#111827',
        secondaryColor: '#b42318',
        backgroundColor: '#f7f3ea',
        textColor: '#161616',
        accentColor: '#facc15',
        fontFamily: 'Inter, Arial, sans-serif',
        animationStyle: 'glow',
        heroTitle: 'Fly Free Puja Festival',
        heroSubtitle: 'Gift-ready tees, bold festive graphics, and comfortable custom apparel for family, friends, and bulk celebration orders.',
        heroDesktopImageUrl: 'https://images.unsplash.com/photo-1604608678051-64d46d8f20df?w=1600',
        heroMobileImageUrl: 'https://images.unsplash.com/photo-1607861716497-e65ab29fc7ac?w=900',
        heroCtaLabel: 'Shop Puja styles',
        heroHref: '/themes/puja-festival',
        priority: 1,
        isActive: true,
      },
    }),
    prisma.websiteTheme.create({
      data: {
        name: 'Winter Street Website',
        slug: 'winter-street-website',
        description: 'Cool winter campaign skin for hoodies, dark tees, and seasonal comfort drops.',
        primaryColor: '#0f172a',
        secondaryColor: '#38bdf8',
        backgroundColor: '#f8fafc',
        textColor: '#0f172a',
        accentColor: '#e0f2fe',
        fontFamily: 'Inter, Arial, sans-serif',
        animationStyle: 'snow',
        heroTitle: 'Winter Street Drop',
        heroSubtitle: 'Layer-ready colors, soft cotton fits, and limited cold-weather graphics.',
        heroDesktopImageUrl: 'https://images.unsplash.com/photo-1483664852095-d6cc6870702d?w=1600',
        heroMobileImageUrl: 'https://images.unsplash.com/photo-1483664852095-d6cc6870702d?w=900',
        heroCtaLabel: 'Explore winter',
        heroHref: '/products',
        priority: 2,
        isActive: false,
      },
    }),
    prisma.websiteTheme.create({
      data: {
        name: 'Game Night Website',
        slug: 'game-night-website',
        description: 'Electric global skin for gaming and creator-led product moments.',
        primaryColor: '#111827',
        secondaryColor: '#00ff41',
        backgroundColor: '#0d0221',
        textColor: '#ffffff',
        accentColor: '#ff00ff',
        fontFamily: 'Courier New, monospace',
        animationStyle: 'game-pulse',
        heroTitle: 'Game Night Graphics',
        heroSubtitle: 'Fast, electric tees for gamers, creators, and fans of loud graphic energy.',
        heroDesktopImageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1600',
        heroMobileImageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=900',
        heroCtaLabel: 'Shop gaming',
        heroHref: '/themes/gaming',
        priority: 3,
        isActive: false,
      },
    }),
  ]);

  // Create app settings, editable pages, and admin notifications
  const aboutContent = `Fly Free was founded by Miss Sneha Jyoti Naiding Shah with a simple yet powerful vision: to celebrate freedom, individuality, and self-expression through fashion. The name Fly Free reflects our belief that everyone deserves the confidence and freedom to wear what they love without limitations.

At Fly Free, we are more than a clothing brand. We are a movement that encourages people to embrace their unique identity, culture, and personal style. Every piece we create is designed with the idea that fashion should feel empowering, comfortable, and liberating.

Rooted deeply in the vibrant heritage of Northeast India, our collections transform everyday apparel into wearable stories, celebrating rich diversity while making it affordable for all.

We believe true style is a balance of creativity and comfort. Our focus goes beyond striking visuals: every garment is thoughtfully made with no compromise in quality and custom crafted for everyday wear.

Meet the Team
Founder and Designer: Sneha Jyoti Naiding Shah
Management Team: Mr Abidul Islam, Mr Sourav Das
Graphic Designer: Mr Ghanshyam Deka
Website Developer: Fly Free Web Team

Together, our team is committed to building a brand that inspires, connects, and empowers individuals through meaningful fashion.`;

  const missionContent = `Fly Free is not just about clothing. It is about self-expression, flexible creation, customisation, and quality without compromise. We create fashion that lets you celebrate who you are. We also support company bulk orders at special pricing and keep the brand running with emotion, effort, and care.`;

  await prisma.appSetting.create({
    data: {
      key: 'admin_settings',
      value: {
        appName: 'Fly Free',
        appTitle: 'Fly Free - Custom T-shirts',
        appDescription: 'Freedom, individuality, and self-expression through fashion.',
        appLogo: '/brand/flyfree-logo.png',
        appFavicon: '/favicon.ico',
        seoTitle: 'Fly Free - Custom T-shirts',
        seoDescription: 'Shop Fly Free custom, anime, Bihu, Puja, gaming, Assam, and graphic t-shirts.',
        seoKeywords: 'custom t-shirts, anime tees, bihu t-shirts, puja t-shirts, assam t-shirts, gifting',
        contactEmail: 'support@flyfree.com',
        supportEmail: 'support@flyfree.com',
        contactPhone: '9876543210',
        businessName: 'Fly Free',
        ownerName: 'Sneha Jyoti Naiding Shah',
        founderName: 'Sneha Jyoti Naiding Shah',
        teamName: 'Sneha Jyoti Naiding Shah, Abidul Islam, Sourav Das, Ghanshyam Deka',
        businessAddress: 'Guwahati, Assam, India',
        gstNumber: 'GSTIN-DEMO-UPDATE-IN-ADMIN',
        invoicePrefix: 'INV',
        taxRate: 18,
        footerText: 'Fly Free: freedom, comfort, culture, and self-expression.',
        brandStory: aboutContent,
        mission: missionContent,
        socialLinks: {
          instagram: 'https://instagram.com/flyfree',
          facebook: 'https://facebook.com/flyfree',
          twitter: 'https://x.com/flyfree',
          youtube: 'https://youtube.com/@flyfree',
          whatsapp: 'https://wa.me/919876543210',
        },
      },
    },
  });

  await Promise.all([
    prisma.page.create({
      data: {
        slug: 'about-us',
        title: 'About Us',
        content: aboutContent,
        metaTitle: 'About Fly Free',
        metaDesc: 'Learn about Fly Free and our t-shirt brand story.',
      },
    }),
    prisma.page.create({
      data: {
        slug: 'vision-mission',
        title: 'Vision and Mission',
        content: missionContent,
        metaTitle: 'Fly Free Vision and Mission',
        metaDesc: 'Fly Free brand vision and mission.',
      },
    }),
    prisma.page.create({
      data: {
        slug: 'terms-and-conditions',
        title: 'Terms and Conditions',
        content: `Welcome to Fly Free. By using our website, placing an order, or requesting a custom design, you agree to provide accurate account, contact, payment, and delivery details.

Product photos, colours, sizes, prices, and stock may change as collections are updated. Custom, gifting, festival, anime, Bihu, Puja, Spider-Man-inspired, and bulk order requests are confirmed only after design scope, quantity, pricing, and delivery timing are accepted by Fly Free.

Payments must be completed through the supported checkout methods. Orders may be cancelled, paused, or delayed if payment fails, delivery information is incomplete, the requested item is unavailable, or the custom brief needs clarification.

Fly Free designs, campaign stories, product photos, brand assets, and website content belong to Fly Free or are used with permission. Customers may not copy, reproduce, resell, or misuse them without written approval.

For order support, returns, cancellations, customisation, or bulk gifting questions, contact Fly Free with your order details so the team can help quickly.`,
        metaTitle: 'Terms and Conditions',
        metaDesc: 'Fly Free terms and conditions.',
      },
    }),
    prisma.page.create({
      data: {
        slug: 'return-policy',
        title: 'Return Policy',
        content: 'Eligible items can be returned according to the return window and product condition rules configured by Fly Free.',
        metaTitle: 'Return Policy',
        metaDesc: 'Fly Free return and refund policy.',
      },
    }),
    prisma.page.create({
      data: {
        slug: 'privacy-policy',
        title: 'Privacy Policy',
        content: `Fly Free collects the information needed to create accounts, process orders, deliver products, support customisation requests, and improve the shopping experience.

This may include your name, email address, phone number, delivery address, order history, payment status, saved preferences, and messages or files you share for custom designs, gifting, or bulk orders.

We use this information to confirm purchases, send verification codes, share order and delivery updates, manage returns, prevent fraud, improve our products, and show relevant website messages such as scheduled theme announcements.

We do not sell customer personal information. Trusted providers for payment, delivery, email, analytics, hosting, and storage may process information only to help operate Fly Free services.

You can contact Fly Free support for privacy questions, account help, or communication preferences. We keep customer information only as long as needed for service, legal, security, and business requirements.`,
        metaTitle: 'Privacy Policy',
        metaDesc: 'Fly Free privacy policy.',
      },
    }),
    prisma.page.create({
      data: {
        slug: 'size-chart',
        title: 'Size Chart',
        content: 'XS: 36 in chest, S: 38 in, M: 40 in, L: 42 in, XL: 44 in, XXL: 46 in. Update exact measurements from admin.',
        metaTitle: 'T-shirt Size Chart',
        metaDesc: 'Fly Free t-shirt size chart.',
      },
    }),
    prisma.page.create({
      data: {
        slug: 'contact-us',
        title: 'Contact Us',
        content: 'Contact Fly Free at support@flyfree.com or 9876543210 for orders, returns, custom designs, and influencer partnerships.',
        metaTitle: 'Contact Fly Free',
        metaDesc: 'Fly Free customer support and contact details.',
      },
    }),
    prisma.page.create({
      data: {
        slug: 'gifting',
        title: 'Gifting',
        content: 'Fly Free gifting makes birthdays, festivals, team celebrations, and corporate moments more personal. Choose curated gift-ready tees, custom message cards, and bulk gifting support.',
        metaTitle: 'Fly Free Gifting',
        metaDesc: 'Gift-ready t-shirts, custom cards, and bulk gifting from Fly Free.',
      },
    }),
  ]);

  // Gift options removed - using hampers instead

  await Promise.all([
    prisma.announcement.create({
      data: {
        title: 'Bihu drop is live',
        message: 'Wear Northeast stories with the new Bihu collection.',
        href: '/themes/bihu',
        ctaLabel: 'Shop Bihu',
        type: 'EVENT',
        priority: 1,
        websiteThemeId: websiteThemes[0].id,
        startsAt: new Date(Date.now() - 86400000),
        endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      },
    }),
    prisma.announcement.create({
      data: {
        title: 'Puja gifting open',
        message: 'Schedule gift-ready tees and custom cards for Puja season.',
        href: '/gifting',
        ctaLabel: 'Explore gifts',
        type: 'OFFER',
        priority: 2,
        websiteThemeId: websiteThemes[0].id,
        startsAt: new Date(Date.now() - 86400000),
        endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 45),
      },
    }),
    prisma.notification.create({
      data: {
        channel: 'ADMIN',
        type: 'NEW_ORDER',
        entityType: 'Order',
        entityId: orders[2].id,
        title: 'New order received',
        body: `Order ${orders[2].id} is waiting for confirmation.`,
        status: 'PENDING',
      },
    }),
    prisma.notification.create({
      data: {
        channel: 'ADMIN',
        type: 'INFLUENCER_ORDER',
        entityType: 'Influencer',
        entityId: influencers[0].id,
        title: 'Influencer conversion',
        body: `${influencers[0].name} generated an order with code ${influencers[0].code}.`,
        status: 'PENDING',
      },
    }),
  ]);

  console.log('✅ Seed completed!');
  console.log(`✅ Created ${productsData.length} products with ${6 * 6} variants`);
  console.log(`✅ Created ${categories.length} categories`);
  console.log(`✅ Created ${themes.length} themes`);
  console.log(`✅ Created ${collections.length} collections`);
  console.log(`✅ Created ${coupons.length} coupons`);
  console.log(`✅ Created ${users.length} test users`);
  console.log(`✅ Created ${addresses.length} addresses`);
  console.log(`✅ Created ${admins.length} admin users`);
  console.log(`✅ Created ${orders.length} sample orders`);
  console.log(`✅ Created 4 product reviews`);
  console.log(`✅ Created 3 wishlist items`);
  console.log(`✅ Created 3 cart items`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
