import { Router } from 'express';
import {
  getAllStores,
  getStoreById,
  createStore,
  updateStore,
  deleteStore,
  getAnalytics
} from '../controllers/store.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All store routes require authentication
router.use(authMiddleware);

router.get('/', getAllStores);
router.get('/:id', getStoreById);
router.post('/', createStore);
router.put('/:id', updateStore);
router.delete('/:id', deleteStore);
router.get('/:id/analytics', getAnalytics);

export default router;
