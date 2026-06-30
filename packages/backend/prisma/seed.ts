import { PrismaClient, UnitType } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create demo user
  const hashedPassword = await bcrypt.hash('demo123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'demo@grocery.com' },
    update: {},
    create: {
      email: 'demo@grocery.com',
      password: hashedPassword,
      name: 'Demo User'
    }
  });

  console.log('✅ Created demo user:', user.email);

  // Create stores
  const stores = await Promise.all([
    prisma.store.upsert({
      where: { id: 'store-1' },
      update: {},
      create: {
        id: 'store-1',
        name: 'שופרסל',
        address: 'רחוב הרצל 123',
        city: 'תל אביב',
        userId: user.id
      }
    }),
    prisma.store.upsert({
      where: { id: 'store-2' },
      update: {},
      create: {
        id: 'store-2',
        name: 'רמי לוי',
        address: 'שדרות בן גוריון 45',
        city: 'תל אביב',
        userId: user.id
      }
    }),
    prisma.store.upsert({
      where: { id: 'store-3' },
      update: {},
      create: {
        id: 'store-3',
        name: 'ויקטורי',
        address: 'רחוב דיזנגוף 78',
        city: 'תל אביב',
        userId: user.id
      }
    })
  ]);

  console.log('✅ Created', stores.length, 'stores');

  // Create default categories
  const categoryNames = ['חלב ומוצריו', 'לחם', 'ירקות', 'פירות', 'משקאות', 'ממתקים'];
  const categories = [];

  for (const name of categoryNames) {
    let category = await prisma.category.findFirst({
      where: {
        userId: user.id,
        name: name,
        deletedAt: null
      }
    });

    if (!category) {
      category = await prisma.category.create({
        data: {
          name: name,
          userId: user.id,
          isDefault: true
        }
      });
    }

    categories.push(category);
  }

  console.log('✅ Created', categories.length, 'categories');

  // Create products with Hebrew names
  const products = await Promise.all([
    prisma.product.upsert({
      where: { id: 'product-1' },
      update: {},
      create: {
        id: 'product-1',
        canonicalName: 'חלב טרה 3%',
        categoryId: categories[0].id,
        defaultUnit: UnitType.LITER,
        userId: user.id
      }
    }),
    prisma.product.upsert({
      where: { id: 'product-2' },
      update: {},
      create: {
        id: 'product-2',
        canonicalName: 'לחם מחיטה מלאה',
        categoryId: categories[1].id,
        defaultUnit: UnitType.PIECE,
        userId: user.id
      }
    }),
    prisma.product.upsert({
      where: { id: 'product-3' },
      update: {},
      create: {
        id: 'product-3',
        canonicalName: 'עגבניות',
        categoryId: categories[2].id,
        defaultUnit: UnitType.KILOGRAM,
        userId: user.id
      }
    }),
    prisma.product.upsert({
      where: { id: 'product-4' },
      update: {},
      create: {
        id: 'product-4',
        canonicalName: 'בננות',
        categoryId: categories[3].id,
        defaultUnit: UnitType.KILOGRAM,
        userId: user.id
      }
    }),
    prisma.product.upsert({
      where: { id: 'product-5' },
      update: {},
      create: {
        id: 'product-5',
        canonicalName: 'קפה עלית',
        categoryId: categories[4].id,
        defaultUnit: UnitType.PACKAGE,
        userId: user.id
      }
    }),
    prisma.product.upsert({
      where: { id: 'product-6' },
      update: {},
      create: {
        id: 'product-6',
        canonicalName: 'קינדר בואנו',
        categoryId: categories[5].id,
        barcode: '8000500217993',
        defaultUnit: UnitType.PACKAGE,
        userId: user.id
      }
    })
  ]);

  console.log('✅ Created', products.length, 'products');

  // Create product aliases (for normalization testing)
  await Promise.all([
    prisma.productAlias.upsert({
      where: {
        productId_aliasName: {
          productId: 'product-1',
          aliasName: 'חלב טרה'
        }
      },
      update: {},
      create: {
        productId: 'product-1',
        aliasName: 'חלב טרה',
        language: 'he'
      }
    }),
    prisma.productAlias.upsert({
      where: {
        productId_aliasName: {
          productId: 'product-6',
          aliasName: 'kinder bueno'
        }
      },
      update: {},
      create: {
        productId: 'product-6',
        aliasName: 'kinder bueno',
        language: 'en'
      }
    })
  ]);

  console.log('✅ Created product aliases');

  // Create sample purchases
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  await prisma.purchase.create({
    data: {
      purchaseDate: twoWeeksAgo,
      storeId: 'store-1',
      totalAmount: 150.5,
      userId: user.id,
      items: {
        create: [
          {
            productId: 'product-1',
            quantity: 2,
            unitType: UnitType.LITER,
            totalPrice: 15.8,
            calculatedUnitPrice: 7.9
          },
          {
            productId: 'product-2',
            quantity: 1,
            unitType: UnitType.PIECE,
            totalPrice: 8.9,
            calculatedUnitPrice: 8.9
          },
          {
            productId: 'product-3',
            quantity: 1.5,
            unitType: UnitType.KILOGRAM,
            totalPrice: 12.0,
            calculatedUnitPrice: 8.0
          }
        ]
      }
    }
  });

  await prisma.purchase.create({
    data: {
      purchaseDate: oneWeekAgo,
      storeId: 'store-2',
      totalAmount: 200.0,
      userId: user.id,
      items: {
        create: [
          {
            productId: 'product-1',
            quantity: 2,
            unitType: UnitType.LITER,
            totalPrice: 14.0,
            calculatedUnitPrice: 7.0
          },
          {
            productId: 'product-4',
            quantity: 2,
            unitType: UnitType.KILOGRAM,
            totalPrice: 18.0,
            calculatedUnitPrice: 9.0
          },
          {
            productId: 'product-5',
            quantity: 1,
            unitType: UnitType.PACKAGE,
            totalPrice: 32.9,
            calculatedUnitPrice: 32.9
          }
        ]
      }
    }
  });

  await prisma.purchase.create({
    data: {
      purchaseDate: now,
      storeId: 'store-3',
      totalAmount: 85.5,
      userId: user.id,
      items: {
        create: [
          {
            productId: 'product-6',
            quantity: 3,
            unitType: UnitType.PACKAGE,
            totalPrice: 24.9,
            calculatedUnitPrice: 8.3
          },
          {
            productId: 'product-3',
            quantity: 2,
            unitType: UnitType.KILOGRAM,
            totalPrice: 18.0,
            calculatedUnitPrice: 9.0
          }
        ]
      }
    }
  });

  console.log('✅ Created sample purchases');

  console.log('🎉 Database seeded successfully!');
  console.log('📧 Demo user email: demo@grocery.com');
  console.log('🔑 Demo user password: demo123');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
