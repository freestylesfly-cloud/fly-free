import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data (order matters due to foreign keys)
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.review.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.inventory.deleteMany(); // Delete inventory before variants
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.theme.deleteMany();
  await prisma.category.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.adminUser.deleteMany();
  await prisma.heroBanner.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.customizationRequest.deleteMany();
  await prisma.giftOption.deleteMany();

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
  const themes = await Promise.all([
    prisma.theme.create({ data: { name: 'Anime', slug: 'anime' } }),
    prisma.theme.create({ data: { name: 'Marvel', slug: 'marvel' } }),
    prisma.theme.create({ data: { name: 'Spider-Man', slug: 'spider-man' } }),
    prisma.theme.create({ data: { name: 'Assam', slug: 'assam' } }),
    prisma.theme.create({ data: { name: 'Minimal', slug: 'minimal' } }),
    prisma.theme.create({ data: { name: 'Graphic', slug: 'graphic' } }),
    prisma.theme.create({ data: { name: 'Gaming', slug: 'gaming' } }),
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
      themeId: themes[1].id,
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
      themeId: themes[1].id,
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
      themeId: themes[1].id,
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
      themeId: themes[2].id,
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
      themeId: themes[2].id,
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
      themeId: themes[3].id,
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
      themeId: themes[3].id,
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
        isNewArrival: true,
        isVisible: true,
        seoTitle: `${productData.name} - Fly Free`,
        seoDescription: productData.description,
      },
    });

    // Create product images
    await prisma.productImage.create({
      data: {
        productId: product.id,
        color: productData.color,
        url: `https://via.placeholder.com/500?text=${encodeURIComponent(product.name)}`,
        alt: product.name,
        priority: 0,
      },
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
        phone: '+91 9876543210',
      },
    }),
    prisma.user.create({
      data: {
        email: 'jane@example.com',
        name: 'Jane Smith',
        phone: '+91 9876543211',
      },
    }),
    prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        phone: '+91 9876543212',
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
        phone: '+91 9876543210',
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
        phone: '+91 9876543210',
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
        phone: '+91 9876543211',
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

  // Create Reviews
  console.log('⭐ Creating product reviews...');
  await Promise.all([
    prisma.review.create({
      data: {
        userId: users[0].id,
        productId: products[0].id,
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

  // Create Hero Banners
  console.log('📸 Creating hero banners...');
  await Promise.all([
    prisma.heroBanner.create({
      data: {
        title: 'Summer Collection',
        desktopImageUrl: 'https://via.placeholder.com/1200x600?text=Summer+Collection',
        mobileImageUrl: 'https://via.placeholder.com/600x400?text=Summer',
        buttonLabel: 'Shop Summer',
        href: '/collections/summer',
        priority: 1,
        isActive: true,
      },
    }),
    prisma.heroBanner.create({
      data: {
        title: 'Anime Series',
        desktopImageUrl: 'https://via.placeholder.com/1200x600?text=Anime+Series',
        mobileImageUrl: 'https://via.placeholder.com/600x400?text=Anime',
        buttonLabel: 'Shop Anime',
        href: '/themes/anime',
        priority: 2,
        isActive: true,
      },
    }),
    prisma.heroBanner.create({
      data: {
        title: 'Marvel Universe',
        desktopImageUrl: 'https://via.placeholder.com/1200x600?text=Marvel+Universe',
        mobileImageUrl: 'https://via.placeholder.com/600x400?text=Marvel',
        buttonLabel: 'Shop Marvel',
        href: '/themes/marvel',
        priority: 3,
        isActive: true,
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
  console.log(`✅ Created 3 hero banners`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
