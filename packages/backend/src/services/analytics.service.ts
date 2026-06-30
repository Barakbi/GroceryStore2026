import prisma from '../utils/prisma';
import {
  DashboardStats,
  MonthlySpending,
  ProductSpending,
  StoreAnalytics,
  ProductAnalytics,
  CategorySpending
} from '@grocery-store/shared';
import { getCheapestStoreForProduct, getProductPriceHistory, detectPriceChanges } from './priceIntelligence.service';

/**
 * Analytics Service
 * Provides dashboard statistics and analytics data
 */

/**
 * Get dashboard statistics for a user
 */
export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  // Get basic counts
  const [purchases, products, stores] = await Promise.all([
    prisma.purchase.findMany({
      where: { userId },
      include: {
        items: {
          include: { product: true }
        },
        store: true
      },
      orderBy: { purchaseDate: 'desc' }
    }),
    prisma.product.count({ where: { userId } }),
    prisma.store.count({ where: { userId } })
  ]);

  // Calculate total spending
  const totalSpending = purchases.reduce((sum, p) => sum + p.totalAmount, 0);

  // Calculate average basket size
  const avgBasketSize = purchases.length > 0 ? totalSpending / purchases.length : 0;

  // Get recent purchases (last 10)
  const recentPurchases = purchases.slice(0, 10).map(p => ({
    ...p,
    purchaseDate: p.purchaseDate,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    items: p.items.map(item => ({
      ...item,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }))
  }));

  // Calculate monthly spending (last 12 months)
  const monthlySpending = calculateMonthlySpending(purchases);

  // Get top products by spending
  const topProducts = await getTopProductsBySpending(userId, 10);

  // Get price changes
  const priceChanges = await detectPriceChanges(userId, 10);

  return {
    totalSpending,
    purchaseCount: purchases.length,
    avgBasketSize,
    productCount: products,
    storeCount: stores,
    recentPurchases,
    monthlySpending,
    topProducts,
    priceChanges: priceChanges.slice(0, 10)
  };
}

/**
 * Calculate monthly spending from purchases
 */
function calculateMonthlySpending(purchases: any[]): MonthlySpending[] {
  const monthlyData = new Map<string, { total: number; count: number; year: number; month: number }>();

  for (const purchase of purchases) {
    const date = new Date(purchase.purchaseDate);
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 1-12
    const key = `${year}-${month.toString().padStart(2, '0')}`;

    if (monthlyData.has(key)) {
      const data = monthlyData.get(key)!;
      data.total += purchase.totalAmount;
      data.count++;
    } else {
      monthlyData.set(key, {
        total: purchase.totalAmount,
        count: 1,
        year,
        month
      });
    }
  }

  // Convert to array and sort by date (most recent first)
  const result = Array.from(monthlyData.entries())
    .map(([key, data]) => ({
      month: key,
      year: data.year,
      total: data.total,
      purchaseCount: data.count
    }))
    .sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return parseInt(b.month.split('-')[1]) - parseInt(a.month.split('-')[1]);
    })
    .slice(0, 12); // Last 12 months

  return result;
}

/**
 * Get top products by total spending
 */
async function getTopProductsBySpending(userId: string, limit: number): Promise<ProductSpending[]> {
  const products = await prisma.product.findMany({
    where: { userId },
    include: {
      purchaseItems: true
    }
  });

  const productStats = products
    .map(product => {
      const totalSpent = product.purchaseItems.reduce((sum, item) => sum + item.totalPrice, 0);
      const quantity = product.purchaseItems.reduce((sum, item) => sum + item.quantity, 0);
      const purchaseCount = product.purchaseItems.length;

      return {
        product,
        totalSpent,
        quantity,
        purchaseCount
      };
    })
    .filter(item => item.purchaseCount > 0)
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, limit);

  return productStats;
}

/**
 * Get store analytics
 */
export async function getStoreAnalytics(storeId: string, userId: string): Promise<StoreAnalytics> {
  const store = await prisma.store.findFirst({
    where: { id: storeId, userId }
  });

  if (!store) {
    throw new Error('Store not found');
  }

  const purchases = await prisma.purchase.findMany({
    where: { storeId, userId },
    include: {
      items: {
        include: {
          product: {
            include: { category: true }
          }
        }
      }
    }
  });

  const totalSpending = purchases.reduce((sum, p) => sum + p.totalAmount, 0);
  const avgBasketSize = purchases.length > 0 ? totalSpending / purchases.length : 0;

  // Calculate top products for this store
  const productMap = new Map<string, { product: any; totalSpent: number; quantity: number; count: number }>();

  for (const purchase of purchases) {
    for (const item of purchase.items) {
      const existing = productMap.get(item.productId);
      if (existing) {
        existing.totalSpent += item.totalPrice;
        existing.quantity += item.quantity;
        existing.count++;
      } else {
        productMap.set(item.productId, {
          product: item.product,
          totalSpent: item.totalPrice,
          quantity: item.quantity,
          count: 1
        });
      }
    }
  }

  const topProducts: ProductSpending[] = Array.from(productMap.values())
    .map(({ product, totalSpent, quantity, count }) => ({
      product,
      totalSpent,
      quantity,
      purchaseCount: count
    }))
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 10);

  // Calculate category breakdown
  const categoryMap = new Map<string, {
    categoryId: string | null;
    categoryName: string;
    category: any;
    totalSpent: number;
    productCount: Set<string>;
  }>();

  for (const purchase of purchases) {
    for (const item of purchase.items) {
      const categoryId = item.product.categoryId || null;
      const categoryName = item.product.category?.name || 'Uncategorized';
      const key = categoryId || 'uncategorized';

      const existing = categoryMap.get(key);
      if (existing) {
        existing.totalSpent += item.totalPrice;
        existing.productCount.add(item.productId);
      } else {
        categoryMap.set(key, {
          categoryId,
          categoryName,
          category: item.product.category,
          totalSpent: item.totalPrice,
          productCount: new Set([item.productId])
        });
      }
    }
  }

  const categoryBreakdown: CategorySpending[] = Array.from(categoryMap.values())
    .map((data) => ({
      categoryId: data.categoryId || undefined,
      categoryName: data.categoryName,
      category: data.category,
      totalSpent: data.totalSpent,
      productCount: data.productCount.size
    }))
    .sort((a, b) => b.totalSpent - a.totalSpent);

  return {
    store,
    totalSpending,
    purchaseCount: purchases.length,
    avgBasketSize,
    topProducts,
    categoryBreakdown
  };
}

/**
 * Get product analytics
 */
export async function getProductAnalytics(productId: string, userId: string): Promise<ProductAnalytics> {
  const product = await prisma.product.findFirst({
    where: { id: productId, userId }
  });

  if (!product) {
    throw new Error('Product not found');
  }

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
    return {
      product,
      totalPurchases: 0,
      totalQuantity: 0,
      totalSpent: 0,
      avgPrice: 0,
      minPrice: 0,
      maxPrice: 0,
      priceHistory: [],
      storeComparison: []
    };
  }

  const totalPurchases = purchaseItems.length;
  const totalQuantity = purchaseItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalSpent = purchaseItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const prices = purchaseItems.map(item => item.calculatedUnitPrice);
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  // Get price history
  const priceHistory = await getProductPriceHistory(productId);

  // Get store comparison
  const storeComparison = await getCheapestStoreForProduct(productId);

  // Find preferred store (most purchases)
  const storeCounts = new Map<string, { store: any; count: number }>();
  for (const item of purchaseItems) {
    const existing = storeCounts.get(item.purchase.storeId);
    if (existing) {
      existing.count++;
    } else {
      storeCounts.set(item.purchase.storeId, {
        store: item.purchase.store,
        count: 1
      });
    }
  }

  const preferredStoreData = Array.from(storeCounts.values())
    .sort((a, b) => b.count - a.count)[0];

  return {
    product,
    totalPurchases,
    totalQuantity,
    totalSpent,
    avgPrice,
    minPrice,
    maxPrice,
    priceHistory,
    preferredStore: preferredStoreData?.store,
    storeComparison
  };
}

/**
 * Get monthly spending trends
 */
export async function getMonthlySpending(userId: string, year: number): Promise<MonthlySpending[]> {
  const purchases = await prisma.purchase.findMany({
    where: {
      userId,
      purchaseDate: {
        gte: new Date(year, 0, 1),
        lte: new Date(year, 11, 31, 23, 59, 59)
      }
    }
  });

  return calculateMonthlySpending(purchases);
}
