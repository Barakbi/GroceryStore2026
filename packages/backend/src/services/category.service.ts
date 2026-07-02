import prisma from '../utils/prisma';
import { Category, CreateCategoryRequest, UpdateCategoryRequest } from '@grocery-store/shared';

/**
 * Category Service
 * Manages user-customizable product categories
 */

/**
 * Get all categories for a user
 */
export async function getCategoriesByUserId(userId: string): Promise<Category[]> {
  const categories = await prisma.category.findMany({
    where: { userId },
    orderBy: [
      { isDefault: 'desc' }, // Default categories first
      { name: 'asc' }        // Then alphabetically
    ]
  });

  return categories.map(cat => ({
    ...cat,
    createdAt: cat.createdAt,
    updatedAt: cat.updatedAt
  }));
}

/**
 * Get a single category by ID
 */
export async function getCategoryById(categoryId: string, userId: string): Promise<Category | null> {
  const category = await prisma.category.findFirst({
    where: {
      id: categoryId,
      userId // Ensure user can only access their own categories
    }
  });

  if (!category) {
    return null;
  }

  return {
    ...category,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt
  };
}

/**
 * Create a new category
 */
export async function createCategory(
  userId: string,
  data: CreateCategoryRequest
): Promise<Category> {
  // Check if category with this name already exists for this user
  const existing = await prisma.category.findFirst({
    where: {
      userId,
      name: data.name,
      deletedAt: null
    }
  });

  if (existing) {
    throw new Error('A category with this name already exists');
  }

  const category = await prisma.category.create({
    data: {
      name: data.name,
      userId,
      isDefault: false // User-created categories are never default
    }
  });

  return {
    ...category,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt
  };
}

/**
 * Update a category
 */
export async function updateCategory(
  categoryId: string,
  userId: string,
  data: UpdateCategoryRequest
): Promise<Category> {
  // Verify category belongs to user
  const category = await prisma.category.findFirst({
    where: {
      id: categoryId,
      userId
    }
  });

  if (!category) {
    throw new Error('Category not found');
  }

  // If updating name, check for duplicates
  if (data.name && data.name !== category.name) {
    const existing = await prisma.category.findFirst({
      where: {
        userId,
        name: data.name,
        deletedAt: null
      }
    });

    if (existing) {
      throw new Error('A category with this name already exists');
    }
  }

  const updated = await prisma.category.update({
    where: { id: categoryId },
    data: {
      name: data.name
    }
  });

  return {
    ...updated,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt
  };
}

/**
 * Delete a category
 * Note: Products using this category will have their categoryId set to null
 */
export async function deleteCategory(categoryId: string, userId: string): Promise<void> {
  // Verify category belongs to user
  const category = await prisma.category.findFirst({
    where: {
      id: categoryId,
      userId
    }
  });

  if (!category) {
    throw new Error('Category not found');
  }

  // Soft delete the category (products will have categoryId set to null due to onDelete: SetNull)
  await prisma.category.update({
    where: { id: categoryId },
    data: {
      deletedAt: new Date(),
      deletedBy: userId
    }
  });
}

/**
 * Create default categories for a new user
 */
export async function createDefaultCategories(userId: string): Promise<Category[]> {
  const defaultCategoryNames = [
    'חלב ומוצריו',
    'לחם',
    'ירקות',
    'פירות',
    'משקאות',
    'ממתקים',
    'בשר ודגים',
    'מוצרי ניקיון',
    'טואלטיקה'
  ];

  const categories = [];
  for (const name of defaultCategoryNames) {
    let category = await prisma.category.findFirst({
      where: {
        userId,
        name,
        deletedAt: null
      }
    });

    if (!category) {
      category = await prisma.category.create({
        data: {
          name,
          userId,
          isDefault: true
        }
      });
    }
    categories.push(category);
  }

  return categories.map(cat => ({
    ...cat,
    createdAt: cat.createdAt,
    updatedAt: cat.updatedAt
  }));
}
