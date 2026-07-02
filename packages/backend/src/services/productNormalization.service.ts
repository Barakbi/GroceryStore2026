import { Product, ProductAlias } from '@prisma/client';
import * as fuzz from 'fuzzball';
import prisma from '../utils/prisma';

/**
 * Product Normalization Service
 * Handles fuzzy matching and normalization of product names
 * Supports Hebrew and English variations
 */

interface SimilarityMatch {
  product: Product;
  similarity: number;
  matchedAlias?: string;
}

const SIMILARITY_THRESHOLD = 75; // Minimum similarity percentage for auto-match

/**
 * Normalize text for comparison
 * - Lowercase
 * - Trim whitespace
 * - Remove special characters
 * - Handle Hebrew and English
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\u0590-\u05FFa-z0-9\s]/g, '') // Keep Hebrew, English, numbers, spaces
    .replace(/\s+/g, ' '); // Normalize multiple spaces
}

/**
 * Calculate similarity between two strings using multiple algorithms
 * Returns a weighted score from 0-100
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const normalized1 = normalizeText(str1);
  const normalized2 = normalizeText(str2);

  // Exact match after normalization
  if (normalized1 === normalized2) {
    return 100;
  }

  // Use multiple fuzzy matching algorithms
  const ratio = fuzz.ratio(normalized1, normalized2);
  const partialRatio = fuzz.partial_ratio(normalized1, normalized2);
  const tokenSetRatio = fuzz.token_set_ratio(normalized1, normalized2);
  const tokenSortRatio = fuzz.token_sort_ratio(normalized1, normalized2);

  // Weighted average (token_set_ratio is best for product names with variations)
  const weightedScore = (
    ratio * 0.2 +
    partialRatio * 0.2 +
    tokenSetRatio * 0.4 +
    tokenSortRatio * 0.2
  );

  return Math.round(weightedScore);
}

/**
 * Find similar products in the database
 * Checks both canonical names and aliases
 */
export async function findSimilarProducts(
  name: string,
  userId: string,
  barcode?: string
): Promise<SimilarityMatch[]> {
  // If barcode provided, try exact match first
  if (barcode) {
    const exactMatch = await prisma.product.findUnique({
      where: { barcode }
    });
    if (exactMatch && exactMatch.userId === userId) {
      return [{ product: exactMatch, similarity: 100 }];
    }
  }

  // Get all user's products with their aliases
  const products = await prisma.product.findMany({
    where: { userId },
    include: { aliases: true }
  });

  const matches: SimilarityMatch[] = [];

  for (const product of products) {
    // Check canonical name
    const canonicalSimilarity = calculateSimilarity(name, product.canonicalName);

    // Check all aliases
    let bestAliasSimilarity = 0;
    let matchedAlias: string | undefined;

    for (const alias of product.aliases) {
      const aliasSimilarity = calculateSimilarity(name, alias.aliasName);
      if (aliasSimilarity > bestAliasSimilarity) {
        bestAliasSimilarity = aliasSimilarity;
        matchedAlias = alias.aliasName;
      }
    }

    // Use the best similarity score
    const similarity = Math.max(canonicalSimilarity, bestAliasSimilarity);

    if (similarity >= SIMILARITY_THRESHOLD) {
      matches.push({
        product,
        similarity,
        matchedAlias: bestAliasSimilarity > canonicalSimilarity ? matchedAlias : undefined
      });
    }
  }

  // Sort by similarity (highest first)
  return matches.sort((a, b) => b.similarity - a.similarity);
}

/**
 * Create a new product alias
 */
export async function createProductAlias(
  productId: string,
  aliasName: string,
  language?: string
): Promise<ProductAlias> {
  // Check if alias already exists
  const existing = await prisma.productAlias.findUnique({
    where: {
      productId_aliasName: {
        productId,
        aliasName: normalizeText(aliasName)
      }
    }
  });

  if (existing) {
    return existing;
  }

  return prisma.productAlias.create({
    data: {
      productId,
      aliasName: normalizeText(aliasName),
      language
    }
  });
}

/**
 * Normalize product name and find or create product
 * This is the main entry point for product normalization
 */
export async function normalizeProduct(
  name: string,
  userId: string,
  barcode?: string,
  category?: string,
  defaultUnit?: any
): Promise<{
  product: Product;
  isNew: boolean;
  matchScore?: number;
  suggestedProducts?: SimilarityMatch[];
}> {
  // Find similar products
  const similarProducts = await findSimilarProducts(name, userId, barcode);

  // If we have a very high similarity match (>= 90%), use it
  if (similarProducts.length > 0 && similarProducts[0].similarity >= 90) {
    const match = similarProducts[0];

    // Create alias if this is a new variation
    const normalizedName = normalizeText(name);
    if (normalizedName !== normalizeText(match.product.canonicalName)) {
      await createProductAlias(match.product.id, name, detectLanguage(name));
    }

    return {
      product: match.product,
      isNew: false,
      matchScore: match.similarity
    };
  }

  // Return suggestions if we have good matches (75-89%)
  if (similarProducts.length > 0) {
    return {
      product: similarProducts[0].product,
      isNew: false,
      matchScore: similarProducts[0].similarity,
      suggestedProducts: similarProducts.slice(0, 5) // Top 5 suggestions
    };
  }

  // No good match found, create new product
  const newProduct = await prisma.product.create({
    data: {
      canonicalName: name,
      categoryId: category,
      barcode,
      defaultUnit: defaultUnit || 'PIECE',
      userId
    }
  });

  // Create initial alias
  await createProductAlias(newProduct.id, name, detectLanguage(name));

  return {
    product: newProduct,
    isNew: true
  };
}

/**
 * Detect language of text (simple heuristic)
 */
function detectLanguage(text: string): string {
  // Check if contains Hebrew characters
  const hasHebrew = /[\u0590-\u05FF]/.test(text);
  // Check if contains English letters
  const hasEnglish = /[a-zA-Z]/.test(text);

  if (hasHebrew && !hasEnglish) return 'he';
  if (hasEnglish && !hasHebrew) return 'en';
  return 'mixed';
}

/**
 * Merge two products (manual merge)
 * Moves all aliases and purchase items from source to target
 */
export async function mergeProducts(
  sourceId: string,
  targetId: string,
  userId: string
): Promise<Product> {
  // Verify both products belong to user
  const [source, target] = await Promise.all([
    prisma.product.findFirst({ where: { id: sourceId, userId } }),
    prisma.product.findFirst({ where: { id: targetId, userId } })
  ]);

  if (!source || !target) {
    throw new Error('Products not found or access denied');
  }

  // Move all aliases from source to target
  await prisma.productAlias.updateMany({
    where: { productId: sourceId },
    data: { productId: targetId }
  });

  // Move all purchase items from source to target
  await prisma.purchaseItem.updateMany({
    where: { productId: sourceId },
    data: { productId: targetId }
  });

  // Soft delete source product
  await prisma.product.update({
    where: { id: sourceId },
    data: {
      deletedAt: new Date(),
      deletedBy: userId
    }
  });

  return target;
}
