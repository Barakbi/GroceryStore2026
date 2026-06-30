import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { CreatePurchaseRequest, UpdatePurchaseRequest } from '@grocery-store/shared';
import { calculateUnitPrice } from '../services/unitConversion.service';

/**
 * Get all purchases for current user
 */
export async function getAllPurchases(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { storeId, startDate, endDate, minAmount, maxAmount } = req.query;

    const where: any = {
      userId: req.user.userId
    };

    if (storeId) {
      where.storeId = storeId;
    }

    if (startDate || endDate) {
      where.purchaseDate = {};
      if (startDate) where.purchaseDate.gte = new Date(startDate as string);
      if (endDate) where.purchaseDate.lte = new Date(endDate as string);
    }

    if (minAmount || maxAmount) {
      where.totalAmount = {};
      if (minAmount) where.totalAmount.gte = parseFloat(minAmount as string);
      if (maxAmount) where.totalAmount.lte = parseFloat(maxAmount as string);
    }

    const purchases = await prisma.purchase.findMany({
      where,
      include: {
        store: true,
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: { purchaseDate: 'desc' }
    });

    res.json({
      success: true,
      data: purchases
    });
  } catch (error: any) {
    console.error('Get purchases error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch purchases'
    });
  }
}

/**
 * Get single purchase by ID
 */
export async function getPurchaseById(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { id } = req.params;

    const purchase = await prisma.purchase.findFirst({
      where: {
        id,
        userId: req.user.userId
      },
      include: {
        store: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!purchase) {
      return res.status(404).json({
        success: false,
        error: 'Purchase not found'
      });
    }

    res.json({
      success: true,
      data: purchase
    });
  } catch (error: any) {
    console.error('Get purchase error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch purchase'
    });
  }
}

/**
 * Create new purchase with items
 */
export async function createPurchase(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { purchaseDate, storeId, notes, items }: CreatePurchaseRequest = req.body;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        error: 'Store ID is required'
      });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one item is required'
      });
    }

    // Verify store ownership
    const store = await prisma.store.findFirst({
      where: { id: storeId, userId: req.user.userId }
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        error: 'Store not found'
      });
    }

    // Verify all products exist and belong to user
    const productIds = items.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        userId: req.user.userId
      }
    });

    if (products.length !== productIds.length) {
      return res.status(404).json({
        success: false,
        error: 'One or more products not found'
      });
    }

    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);

    // Create purchase with items in a transaction
    const purchase = await prisma.purchase.create({
      data: {
        purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
        storeId,
        totalAmount,
        notes,
        userId: req.user.userId,
        items: {
          create: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitType: item.unitType,
            totalPrice: item.totalPrice,
            calculatedUnitPrice: calculateUnitPrice(
              item.totalPrice,
              item.quantity,
              item.unitType
            )
          }))
        }
      },
      include: {
        store: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: purchase
    });
  } catch (error: any) {
    console.error('Create purchase error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create purchase'
    });
  }
}

/**
 * Update purchase
 */
export async function updatePurchase(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { id } = req.params;
    const { purchaseDate, storeId, notes, items }: UpdatePurchaseRequest = req.body;

    // Verify ownership
    const existing = await prisma.purchase.findFirst({
      where: { id, userId: req.user.userId }
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Purchase not found'
      });
    }

    // If updating items, delete old ones and create new ones
    let updateData: any = {
      ...(purchaseDate !== undefined && { purchaseDate: new Date(purchaseDate) }),
      ...(storeId !== undefined && { storeId }),
      ...(notes !== undefined && { notes })
    };

    if (items) {
      // Calculate new total
      const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);
      updateData.totalAmount = totalAmount;

      // Delete old items and create new ones
      await prisma.purchaseItem.deleteMany({
        where: { purchaseId: id }
      });

      updateData.items = {
        create: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitType: item.unitType,
          totalPrice: item.totalPrice,
          calculatedUnitPrice: calculateUnitPrice(
            item.totalPrice,
            item.quantity,
            item.unitType
          )
        }))
      };
    }

    const purchase = await prisma.purchase.update({
      where: { id },
      data: updateData,
      include: {
        store: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: purchase
    });
  } catch (error: any) {
    console.error('Update purchase error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update purchase'
    });
  }
}

/**
 * Delete purchase
 */
export async function deletePurchase(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { id } = req.params;

    // Verify ownership
    const existing = await prisma.purchase.findFirst({
      where: { id, userId: req.user.userId }
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Purchase not found'
      });
    }

    // Soft delete: set deletedAt and deletedBy
    await prisma.purchase.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: req.user.userId
      }
    });

    res.json({
      success: true,
      message: 'Purchase deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete purchase error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete purchase'
    });
  }
}
