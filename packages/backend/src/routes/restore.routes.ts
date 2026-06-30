import { Router } from 'express';
import {
  restorePurchase,
  restoreProduct,
  restoreStore,
  restoreCategory
} from '../controllers/restore.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All restore routes require authentication
router.use(authMiddleware);

// Restore endpoints
router.post('/purchases/:id', restorePurchase);
router.post('/products/:id', restoreProduct);
router.post('/stores/:id', restoreStore);
router.post('/categories/:id', restoreCategory);

export default router;
