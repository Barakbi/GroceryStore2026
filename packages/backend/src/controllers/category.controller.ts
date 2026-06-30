import { Request, Response } from 'express';
import { CreateCategoryRequest, UpdateCategoryRequest } from '@grocery-store/shared';
import {
  getCategoriesByUserId,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} from '../services/category.service';

/**
 * Get all categories for current user
 */
export async function getAllCategories(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const categories = await getCategoriesByUserId(req.user.userId);

    res.json({
      success: true,
      data: categories
    });
  } catch (error: any) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories'
    });
  }
}

/**
 * Get single category by ID
 */
export async function getSingleCategory(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { id } = req.params;

    const category = await getCategoryById(id, req.user.userId);

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error: any) {
    console.error('Get category error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch category'
    });
  }
}

/**
 * Create new category
 */
export async function createNewCategory(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { name }: CreateCategoryRequest = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Category name is required'
      });
    }

    const category = await createCategory(req.user.userId, { name: name.trim() });

    res.status(201).json({
      success: true,
      data: category
    });
  } catch (error: any) {
    console.error('Create category error:', error);

    if (error.message === 'A category with this name already exists') {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create category'
    });
  }
}

/**
 * Update category
 */
export async function updateExistingCategory(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { id } = req.params;
    const { name }: UpdateCategoryRequest = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Category name is required'
      });
    }

    const category = await updateCategory(id, req.user.userId, { name: name.trim() });

    res.json({
      success: true,
      data: category
    });
  } catch (error: any) {
    console.error('Update category error:', error);

    if (error.message === 'Category not found') {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }

    if (error.message === 'A category with this name already exists') {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update category'
    });
  }
}

/**
 * Delete category
 */
export async function deleteExistingCategory(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { id } = req.params;

    await deleteCategory(id, req.user.userId);

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete category error:', error);

    if (error.message === 'Category not found') {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to delete category'
    });
  }
}
