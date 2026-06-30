import prisma from './prisma';

type SoftDeleteModel = 'purchase' | 'product' | 'store' | 'category';

/**
 * Restore a soft-deleted record
 * @param model - The model name (lowercase)
 * @param id - The record ID to restore
 * @param userId - The user ID (for ownership verification)
 * @returns The restored record
 */
export async function restore(model: SoftDeleteModel, id: string, userId: string) {
  // Type-safe model access
  const modelClient = prisma[model] as any;

  // Verify ownership and that record is deleted
  const record = await modelClient.findFirst({
    where: {
      id,
      userId,
      deletedAt: { not: null },
    },
  });

  if (!record) {
    throw new Error(`Deleted ${model} not found or access denied`);
  }

  // Restore by setting deletedAt and deletedBy to null
  return await modelClient.update({
    where: { id },
    data: {
      deletedAt: null,
      deletedBy: null,
    },
  });
}

/**
 * Find deleted records for a user
 * @param model - The model name (lowercase)
 * @param userId - The user ID
 * @returns Array of deleted records
 */
export async function findDeleted(model: SoftDeleteModel, userId: string) {
  const modelClient = prisma[model] as any;

  return await modelClient.findMany({
    where: {
      userId,
      deletedAt: { not: null },
    },
    orderBy: {
      deletedAt: 'desc',
    },
  });
}

/**
 * Permanently delete a soft-deleted record
 * This is a hard delete and cannot be undone
 * @param model - The model name (lowercase)
 * @param id - The record ID to permanently delete
 * @param userId - The user ID (for ownership verification)
 */
export async function permanentlyDelete(model: SoftDeleteModel, id: string, userId: string) {
  const modelClient = prisma[model] as any;

  // Verify ownership and that record is already soft-deleted
  const record = await modelClient.findFirst({
    where: {
      id,
      userId,
      deletedAt: { not: null },
    },
  });

  if (!record) {
    throw new Error(`Deleted ${model} not found or access denied`);
  }

  // Perform hard delete
  // We need to bypass the middleware, so we use the raw delete
  return await modelClient.delete({
    where: { id, deletedAt: { not: null } },
  });
}
