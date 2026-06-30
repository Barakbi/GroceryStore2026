import { Store, Product } from '@prisma/client';
import prisma from '../utils/prisma';
import { PriceHistoryPoint, StorePrice, PriceChange } from '@grocery-store/shared';

/**
 * Price Intelligence Service
 * Provides price analytics and comparison across stores
 */

/**
 * Get cheapest store for a specific product
 * Compares average unit prices across all stores
 */
export async function getCheapestStoreForProduct(productId: string): Promise<StorePrice[]> {
  const purchaseItems = await prisma.purchaseItem.findMany({
    where: { productId },
    include: {
      purchase: {
        include: { store: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  if (purchaseItems.length === 0) {
    return [];
  }

  // Group by store and calculate statistics
  const storeStats = new Map<string, {
    store: Store;
    prices: number[];
    lastPrice: number;
    lastDate: Date;
    count: number;
  }>();

  for (const item of purchaseItems) {
    const storeId = item.purchase.storeId;
    const existing = storeStats.get(storeId);

    if (existing) {
      existing.prices.push(item.calculatedUnitPrice);
      existing.count++;
      if (item.createdAt > existing.lastDate) {
        existing.lastPrice = item.calculatedUnitPrice;
        existing.lastDate = item.createdAt;
      }
    } else {
      storeStats.set(storeId, {
        store: item.purchase.store,
        prices: [item.calculatedUnitPrice],
        lastPrice: item.calculatedUnitPrice,
        lastDate: item.createdAt,
        count: 1
      });
    }
  }

  // Calculate average and format results
  const results: StorePrice[] = [];
  for (const [_, stats] of storeStats) {
    const avgUnitPrice = stats.prices.reduce((a, b) => a + b, 0) / stats.prices.length;
    results.push({
      store: stats.store,
      avgUnitPrice,
      lastPrice: stats.lastPrice,
      lastPurchaseDate: stats.lastDate,
      purchaseCount: stats.count
    });
  }

  // Sort by average unit price (lowest first)
  return results.sort((a, b) => a.avgUnitPrice - b.avgUnitPrice);
}

/**
 * Get price history for a product
 * Returns chronological price data with store information
 */
export async function getProductPriceHistory(
  productId: string,
  startDate?: Date,
  endDate?: Date
): Promise<PriceHistoryPoint[]> {
  const whereClause: any = {
    productId,
    purchase: {}
  };

  if (startDate || endDate) {
    whereClause.purchase.purchaseDate = {};
    if (startDate) whereClause.purchase.purchaseDate.gte = startDate;
    if (endDate) whereClause.purchase.purchaseDate.lte = endDate;
  }

  const purchaseItems = await prisma.purchaseItem.findMany({
    where: whereClause,
    include: {
      purchase: {
        include: { store: true }
      }
    },
    orderBy: {
      purchase: {
        purchaseDate: 'asc'
      }
    }
  });

  return purchaseItems.map(item => ({
    date: item.purchase.purchaseDate,
    price: item.totalPrice,
    unitPrice: item.calculatedUnitPrice,
    storeId: item.purchase.storeId,
    storeName: item.purchase.store.name
  }));
}

/**
 * Detect price changes above a certain threshold
 * Compares last two purchases of each product
 */
export async function detectPriceChanges(
  userId: string,
  thresholdPercent: number = 10
): Promise<PriceChange[]> {
  const products = await prisma.product.findMany({
    where: { userId },
    include: {
      purchaseItems: {
        include: {
          purchase: {
            include: { store: true }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10 // Get last 10 purchases per product
      }
    }
  });

  const priceChanges: PriceChange[] = [];

  for (const product of products) {
    if (product.purchaseItems.length < 2) continue;

    // Group by store to detect price changes per store
    const byStore = new Map<string, typeof product.purchaseItems>();

    for (const item of product.purchaseItems) {
      const storeId = item.purchase.storeId;
      if (!byStore.has(storeId)) {
        byStore.set(storeId, []);
      }
      byStore.get(storeId)!.push(item);
    }

    // Check each store for price changes
    for (const [_, items] of byStore) {
      if (items.length < 2) continue;

      const latest = items[0];
      const previous = items[1];

      const oldPrice = previous.calculatedUnitPrice;
      const newPrice = latest.calculatedUnitPrice;
      const percentageChange = ((newPrice - oldPrice) / oldPrice) * 100;

      // Only report if change exceeds threshold
      if (Math.abs(percentageChange) >= thresholdPercent) {
        priceChanges.push({
          product,
          oldPrice,
          newPrice,
          percentageChange,
          store: latest.purchase.store,
          date: latest.createdAt
        });
      }
    }
  }

  // Sort by percentage change (highest increases first)
  return priceChanges.sort((a, b) => b.percentageChange - a.percentageChange);
}

/**
 * Get products that are exclusively bought from one store
 * Useful for identifying store-specific items
 */
export async function getExclusiveProducts(storeId: string): Promise<Product[]> {
  // Get all purchases from this store
  const storePurchases = await prisma.purchase.findMany({
    where: { storeId },
    include: {
      items: {
        include: { product: true }
      }
    }
  });

  // Get unique product IDs from this store
  const productIds = new Set<string>();
  for (const purchase of storePurchases) {
    for (const item of purchase.items) {
      productIds.add(item.productId);
    }
  }

  // Check each product to see if it's only bought from this store
  const exclusiveProducts: Product[] = [];

  for (const productId of productIds) {
    const allPurchases = await prisma.purchaseItem.findMany({
      where: { productId },
      include: { purchase: true }
    });

    // Check if all purchases are from this store
    const isExclusive = allPurchases.every(item => item.purchase.storeId === storeId);

    if (isExclusive && allPurchases.length > 0) {
      const product = allPurchases[0].product || await prisma.product.findUnique({
        where: { id: productId }
      });
      if (product) {
        exclusiveProducts.push(product);
      }
    }
  }

  return exclusiveProducts;
}

/**
 * Get best value products (best price-to-quantity ratio)
 * Useful for finding deals
 */
export async function getBestValueProducts(
  userId: string,
  limit: number = 10
): Promise<Array<{ product: Product; avgUnitPrice: number; purchaseCount: number }>> {
  const products = await prisma.product.findMany({
    where: { userId },
    include: {
      purchaseItems: true
    }
  });

  const productStats = products
    .map(product => {
      if (product.purchaseItems.length === 0) return null;

      const avgUnitPrice = product.purchaseItems.reduce(
        (sum, item) => sum + item.calculatedUnitPrice,
        0
      ) / product.purchaseItems.length;

      return {
        product,
        avgUnitPrice,
        purchaseCount: product.purchaseItems.length
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => a.avgUnitPrice - b.avgUnitPrice)
    .slice(0, limit);

  return productStats;
}

/**
 * Get price changes for items in a specific purchase
 * Compares each item to the previous purchase of the same product at the same store
 */
export interface ItemPriceChange {
  itemId: string;
  productId: string;
  currentPrice: number;
  previousPrice: number | null;
  percentageChange: number | null;
  previousPurchaseDate: Date | null;
}

export async function getPurchaseItemPriceChanges(purchaseId: string): Promise<ItemPriceChange[]> {
  // Get the purchase with its items
  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
    include: {
      items: {
        include: { product: true }
      }
    }
  });

  if (!purchase) {
    return [];
  }

  const priceChanges: ItemPriceChange[] = [];

  for (const item of purchase.items) {
    // Find the previous purchase of the same product at the same store
    const previousItem = await prisma.purchaseItem.findFirst({
      where: {
        productId: item.productId,
        purchase: {
          storeId: purchase.storeId,
          purchaseDate: {
            lt: purchase.purchaseDate
          }
        },
        id: {
          not: item.id
        }
      },
      include: {
        purchase: true
      },
      orderBy: {
        purchase: {
          purchaseDate: 'desc'
        }
      }
    });

    if (previousItem) {
      const percentageChange = ((item.calculatedUnitPrice - previousItem.calculatedUnitPrice) / previousItem.calculatedUnitPrice) * 100;
      priceChanges.push({
        itemId: item.id,
        productId: item.productId,
        currentPrice: item.calculatedUnitPrice,
        previousPrice: previousItem.calculatedUnitPrice,
        percentageChange,
        previousPurchaseDate: previousItem.purchase.purchaseDate
      });
    } else {
      priceChanges.push({
        itemId: item.id,
        productId: item.productId,
        currentPrice: item.calculatedUnitPrice,
        previousPrice: null,
        percentageChange: null,
        previousPurchaseDate: null
      });
    }
  }

  return priceChanges;
}

/**
 * Compare prices between multiple stores for the same product
 */
export async function compareProductPricesByStores(
  productId: string,
  storeIds: string[]
): Promise<{
  product: Product;
  comparison: Array<{
    store: Store;
    avgPrice: number;
    minPrice: number;
    maxPrice: number;
    purchaseCount: number;
  }>;
}> {
  const product = await prisma.product.findUnique({
    where: { id: productId }
  });

  if (!product) {
    throw new Error('Product not found');
  }

  const comparison = [];

  for (const storeId of storeIds) {
    const items = await prisma.purchaseItem.findMany({
      where: {
        productId,
        purchase: { storeId }
      },
      include: {
        purchase: { include: { store: true } }
      }
    });

    if (items.length === 0) continue;

    const prices = items.map(item => item.calculatedUnitPrice);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    comparison.push({
      store: items[0].purchase.store,
      avgPrice,
      minPrice,
      maxPrice,
      purchaseCount: items.length
    });
  }

  return {
    product,
    comparison: comparison.sort((a, b) => a.avgPrice - b.avgPrice)
  };
}
