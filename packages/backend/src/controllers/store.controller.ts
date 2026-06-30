import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { CreateStoreRequest, UpdateStoreRequest } from '@grocery-store/shared';
import { getStoreAnalytics } from '../services/analytics.service';

/**
 * Get all stores for current user
 */
export async function getAllStores(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const stores = await prisma.store.findMany({
      where: { userId: req.user.userId },
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      data: stores
    });
  } catch (error: any) {
    console.error('Get stores error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stores'
    });
  }
}

/**
 * Get single store by ID
 */
export async function getStoreById(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { id } = req.params;

    const store = await prisma.store.findFirst({
      where: {
        id,
        userId: req.user.userId
      }
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        error: 'Store not found'
      });
    }

    res.json({
      success: true,
      data: store
    });
  } catch (error: any) {
    console.error('Get store error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch store'
    });
  }
}

/**
 * Create new store
 */
export async function createStore(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { name, address, city }: CreateStoreRequest = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Store name is required'
      });
    }

    const store = await prisma.store.create({
      data: {
        name,
        address,
        city,
        userId: req.user.userId
      }
    });

    res.status(201).json({
      success: true,
      data: store
    });
  } catch (error: any) {
    console.error('Create store error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create store'
    });
  }
}

/**
 * Update store
 */
export async function updateStore(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { id } = req.params;
    const { name, address, city }: UpdateStoreRequest = req.body;

    // Verify ownership
    const existing = await prisma.store.findFirst({
      where: { id, userId: req.user.userId }
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Store not found'
      });
    }

    const store = await prisma.store.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city })
      }
    });

    res.json({
      success: true,
      data: store
    });
  } catch (error: any) {
    console.error('Update store error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update store'
    });
  }
}

/**
 * Delete store
 */
export async function deleteStore(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { id } = req.params;

    // Verify ownership
    const existing = await prisma.store.findFirst({
      where: { id, userId: req.user.userId }
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Store not found'
      });
    }

    // Soft delete cascade: first soft-delete all purchases from this store
    await prisma.purchase.updateMany({
      where: { storeId: id },
      data: {
        deletedAt: new Date(),
        deletedBy: req.user.userId
      }
    });

    // Then soft-delete the store
    await prisma.store.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: req.user.userId
      }
    });

    res.json({
      success: true,
      message: 'Store deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete store error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete store'
    });
  }
}

/**
 * Get store analytics
 */
export async function getAnalytics(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { id } = req.params;

    const analytics = await getStoreAnalytics(id, req.user.userId);

    res.json({
      success: true,
      data: analytics
    });
  } catch (error: any) {
    console.error('Get store analytics error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch store analytics'
    });
  }
}
