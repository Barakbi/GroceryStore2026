import { Router } from 'express';
import {
  getDashboard,
  getPriceComparison,
  getStoreComparison,
  getExclusiveProductsEndpoint,
  getPriceChanges,
  getMonthlySpendingEndpoint,
  getPurchaseItemPriceChangesEndpoint
} from '../controllers/analytics.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All analytics routes require authentication
router.use(authMiddleware);

router.get('/dashboard', getDashboard);
router.get('/price-comparison', getPriceComparison);
router.get('/store-comparison', getStoreComparison);
router.get('/exclusive-products', getExclusiveProductsEndpoint);
router.get('/price-changes', getPriceChanges);
router.get('/monthly-spending', getMonthlySpendingEndpoint);
router.get('/purchase-item-price-changes', getPurchaseItemPriceChangesEndpoint);

export default router;
