import { PrismaClient, Prisma } from '@prisma/client';

// Models with soft delete enabled
const SOFT_DELETE_MODELS = ['Purchase', 'Product', 'Store', 'Category'];

// Create a singleton Prisma client instance
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Soft delete middleware
prisma.$use(async (params, next) => {
  const { model, action, args } = params;

  // Only apply to models with soft delete enabled
  if (!model || !SOFT_DELETE_MODELS.includes(model)) {
    return next(params);
  }

  // Convert delete to soft delete (update with deletedAt timestamp)
  if (action === 'delete') {
    params.action = 'update';
    params.args.data = {
      deletedAt: new Date(),
      deletedBy: (args as any).deletedBy || null, // deletedBy should be passed via args
    };
  }

  // Convert deleteMany to updateMany with soft delete
  if (action === 'deleteMany') {
    params.action = 'updateMany';
    if (params.args.data) {
      params.args.data.deletedAt = new Date();
      params.args.data.deletedBy = (args as any).deletedBy || null;
    } else {
      params.args.data = {
        deletedAt: new Date(),
        deletedBy: (args as any).deletedBy || null,
      };
    }
  }

  // Auto-filter deleted records for read operations
  const readActions = ['findUnique', 'findFirst', 'findMany', 'count', 'aggregate'];
  if (readActions.includes(action)) {
    // Initialize where clause if it doesn't exist
    if (!params.args.where) {
      params.args.where = {};
    }

    // Only add deletedAt filter if not already specified
    // This allows explicit queries for deleted records if needed
    if (params.args.where.deletedAt === undefined) {
      params.args.where.deletedAt = null;
    }
  }

  // Prevent updates to already-deleted records
  if (action === 'update' || action === 'updateMany') {
    if (!params.args.where) {
      params.args.where = {};
    }

    // Only add deletedAt filter if not explicitly bypassed
    if (params.args.where.deletedAt === undefined) {
      params.args.where.deletedAt = null;
    }
  }

  return next(params);
});

// Handle cleanup on process termination
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;
