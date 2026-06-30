import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import {
  CreateProductRequest,
  UpdateProductRequest,
  ProductNormalizationRequest
} from '@grocery-store/shared';
import { normalizeProduct, findSimilarProducts, mergeProducts } from '../services/productNormalization.service';
import { getProductAnalytics } from '../services/analytics.service';
import { getProductPriceHistory } from '../services/priceIntelligence.service';

/**
 * Get all products for current user
 */
export async function getAllProducts(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { category, search } = req.query;

    const where: any = {
      userId: req.user.userId
    };

    if (category) {
      where.categoryId = category;
    }

    if (search) {
      where.OR = [
        { canonicalName: { contains: search as string, mode: 'insensitive' } },
        { barcode: { contains: search as string } }
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        aliases: true,
        category: true
      },
      orderBy: { canonicalName: 'asc' }
    });

    res.json({
      success: true,
      data: products
    });
  } catch (error: any) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch products'
    });
  }
}

/**
 * Get single product by ID
 */
export async function getProductById(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { id } = req.params;

    const product = await prisma.product.findFirst({
      where: {
        id,
        userId: req.user.userId
      },
      include: {
        aliases: true,
        category: true
      }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error: any) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch product'
    });
  }
}

/**
 * Create new product
 */
export async function createProduct(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { canonicalName, categoryId, barcode, defaultUnit }: CreateProductRequest = req.body;

    if (!canonicalName) {
      return res.status(400).json({
        success: false,
        error: 'Product name is required'
      });
    }

    const product = await prisma.product.create({
      data: {
        canonicalName,
        categoryId: categoryId || null,
        barcode: barcode || null,
        defaultUnit: defaultUnit || 'PIECE',
        userId: req.user.userId
      },
      include: {
        aliases: true,
        category: true
      }
    });

    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error: any) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create product'
    });
  }
}

/**
 * Update product
 */
export async function updateProduct(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { id } = req.params;
    const { canonicalName, categoryId, barcode, defaultUnit }: UpdateProductRequest = req.body;

    // Verify ownership
    const existing = await prisma.product.findFirst({
      where: { id, userId: req.user.userId }
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(canonicalName !== undefined && { canonicalName }),
        ...(categoryId !== undefined && { categoryId: categoryId || null }),
        ...(barcode !== undefined && { barcode: barcode || null }),
        ...(defaultUnit !== undefined && { defaultUnit })
      },
      include: {
        aliases: true,
        category: true
      }
    });

    res.json({
      success: true,
      data: product
    });
  } catch (error: any) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update product'
    });
  }
}

/**
 * Delete product
 */
export async function deleteProduct(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { id } = req.params;

    // Verify ownership and check purchase history
    const existing = await prisma.product.findFirst({
      where: { id, userId: req.user.userId },
      include: { purchaseItems: true }
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Prevent deletion of products with purchase history
    if (existing.purchaseItems.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete product with purchase history. Consider merging with another product instead.'
      });
    }

    // Soft delete: set deletedAt and deletedBy
    await prisma.product.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: req.user.userId
      }
    });

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete product'
    });
  }
}

/**
 * Normalize product (fuzzy matching)
 * POST /api/products/normalize
 */
export async function normalizeProductEndpoint(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { name, barcode }: ProductNormalizationRequest = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Product name is required'
      });
    }

    const result = await normalizeProduct(name, req.user.userId, barcode);

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Normalize product error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to normalize product'
    });
  }
}

/**
 * Find similar products
 * GET /api/products/similar?name=...&barcode=...
 */
export async function findSimilarProductsEndpoint(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { name, barcode } = req.query;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Product name is required'
      });
    }

    const similar = await findSimilarProducts(
      name as string,
      req.user.userId,
      barcode as string | undefined
    );

    res.json({
      success: true,
      data: similar
    });
  } catch (error: any) {
    console.error('Find similar products error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to find similar products'
    });
  }
}

/**
 * Merge two products
 * POST /api/products/merge
 */
export async function mergeProductsEndpoint(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { sourceId, targetId } = req.body;

    if (!sourceId || !targetId) {
      return res.status(400).json({
        success: false,
        error: 'Source and target product IDs are required'
      });
    }

    const result = await mergeProducts(sourceId, targetId, req.user.userId);

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Merge products error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to merge products'
    });
  }
}

/**
 * Get product analytics
 */
export async function getAnalytics(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { id } = req.params;

    const analytics = await getProductAnalytics(id, req.user.userId);

    res.json({
      success: true,
      data: analytics
    });
  } catch (error: any) {
    console.error('Get product analytics error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch product analytics'
    });
  }
}

/**
 * Get product price history
 */
export async function getPriceHistory(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { id } = req.params;
    const { startDate, endDate } = req.query;

    const history = await getProductPriceHistory(
      id,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    res.json({
      success: true,
      data: history
    });
  } catch (error: any) {
    console.error('Get price history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch price history'
    });
  }
}
