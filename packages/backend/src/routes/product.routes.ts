import { Router } from 'express';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  normalizeProductEndpoint,
  findSimilarProductsEndpoint,
  mergeProductsEndpoint,
  getAnalytics,
  getPriceHistory
} from '../controllers/product.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All product routes require authentication
router.use(authMiddleware);

// Product normalization endpoints
router.post('/normalize', normalizeProductEndpoint);
router.get('/similar', findSimilarProductsEndpoint);
router.post('/merge', mergeProductsEndpoint);

// CRUD endpoints
router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

// Analytics endpoints
router.get('/:id/analytics', getAnalytics);
router.get('/:id/price-history', getPriceHistory);

export default router;
