import { Request, Response } from 'express';
import { restore } from '../utils/softDelete';

/**
 * Restore a soft-deleted purchase
 * POST /api/restore/purchases/:id
 */
export async function restorePurchase(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { id } = req.params;

    const restored = await restore('purchase', id, req.user.userId);

    res.json({
      success: true,
      data: restored,
      message: 'Purchase restored successfully'
    });
  } catch (error: any) {
    console.error('Restore purchase error:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false,
      error: error.message || 'Failed to restore purchase'
    });
  }
}

/**
 * Restore a soft-deleted product
 * POST /api/restore/products/:id
 */
export async function restoreProduct(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { id } = req.params;

    const restored = await restore('product', id, req.user.userId);

    res.json({
      success: true,
      data: restored,
      message: 'Product restored successfully'
    });
  } catch (error: any) {
    console.error('Restore product error:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false,
      error: error.message || 'Failed to restore product'
    });
  }
}

/**
 * Restore a soft-deleted store
 * POST /api/restore/stores/:id
 */
export async function restoreStore(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { id } = req.params;

    const restored = await restore('store', id, req.user.userId);

    res.json({
      success: true,
      data: restored,
      message: 'Store restored successfully'
    });
  } catch (error: any) {
    console.error('Restore store error:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false,
      error: error.message || 'Failed to restore store'
    });
  }
}

/**
 * Restore a soft-deleted category
 * POST /api/restore/categories/:id
 */
export async function restoreCategory(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { id } = req.params;

    const restored = await restore('category', id, req.user.userId);

    res.json({
      success: true,
      data: restored,
      message: 'Category restored successfully'
    });
  } catch (error: any) {
    console.error('Restore category error:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false,
      error: error.message || 'Failed to restore category'
    });
  }
}
