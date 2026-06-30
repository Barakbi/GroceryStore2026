import { Router } from 'express';
import {
  getAllPurchases,
  getPurchaseById,
  createPurchase,
  updatePurchase,
  deletePurchase
} from '../controllers/purchase.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All purchase routes require authentication
router.use(authMiddleware);

router.get('/', getAllPurchases);
router.get('/:id', getPurchaseById);
router.post('/', createPurchase);
router.put('/:id', updatePurchase);
router.delete('/:id', deletePurchase);

export default router;
