import { Request, Response } from 'express';
import { getDashboardStats, getMonthlySpending } from '../services/analytics.service';
import {
  getCheapestStoreForProduct,
  detectPriceChanges,
  getExclusiveProducts,
  compareProductPricesByStores,
  getPurchaseItemPriceChanges
} from '../services/priceIntelligence.service';

/**
 * Get dashboard statistics
 */
export async function getDashboard(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const stats = await getDashboardStats(req.user.userId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data'
    });
  }
}

/**
 * Get price comparison for a product
 */
export async function getPriceComparison(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { productId } = req.query;

    if (!productId) {
      return res.status(400).json({
        success: false,
        error: 'Product ID is required'
      });
    }

    const comparison = await getCheapestStoreForProduct(productId as string);

    res.json({
      success: true,
      data: comparison
    });
  } catch (error: any) {
    console.error('Get price comparison error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch price comparison'
    });
  }
}

/**
 * Get store comparison for multiple stores and a product
 */
export async function getStoreComparison(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { productId, storeIds } = req.query;

    if (!productId) {
      return res.status(400).json({
        success: false,
        error: 'Product ID is required'
      });
    }

    const storeIdArray = Array.isArray(storeIds)
      ? storeIds as string[]
      : storeIds
      ? [storeIds as string]
      : [];

    if (storeIdArray.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one store ID is required'
      });
    }

    const comparison = await compareProductPricesByStores(
      productId as string,
      storeIdArray
    );

    res.json({
      success: true,
      data: comparison
    });
  } catch (error: any) {
    console.error('Get store comparison error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch store comparison'
    });
  }
}

/**
 * Get exclusive products for a store
 */
export async function getExclusiveProductsEndpoint(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { storeId } = req.query;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        error: 'Store ID is required'
      });
    }

    const products = await getExclusiveProducts(storeId as string);

    res.json({
      success: true,
      data: products
    });
  } catch (error: any) {
    console.error('Get exclusive products error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch exclusive products'
    });
  }
}

/**
 * Get price changes
 */
export async function getPriceChanges(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { threshold } = req.query;
    const thresholdPercent = threshold ? parseFloat(threshold as string) : 10;

    const changes = await detectPriceChanges(req.user.userId, thresholdPercent);

    res.json({
      success: true,
      data: changes
    });
  } catch (error: any) {
    console.error('Get price changes error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch price changes'
    });
  }
}

/**
 * Get monthly spending
 */
export async function getMonthlySpendingEndpoint(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { year } = req.query;
    const targetYear = year ? parseInt(year as string) : new Date().getFullYear();

    const spending = await getMonthlySpending(req.user.userId, targetYear);

    res.json({
      success: true,
      data: spending
    });
  } catch (error: any) {
    console.error('Get monthly spending error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch monthly spending'
    });
  }
}

/**
 * Get price changes for items in a specific purchase
 */
export async function getPurchaseItemPriceChangesEndpoint(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { purchaseId } = req.query;

    if (!purchaseId) {
      return res.status(400).json({
        success: false,
        error: 'Purchase ID is required'
      });
    }

    const priceChanges = await getPurchaseItemPriceChanges(purchaseId as string);

    res.json({
      success: true,
      data: priceChanges
    });
  } catch (error: any) {
    console.error('Get purchase item price changes error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch price changes'
    });
  }
}
