import { Router } from 'express';
import {
  getAllCategories,
  getSingleCategory,
  createNewCategory,
  updateExistingCategory,
  deleteExistingCategory
} from '../controllers/category.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All category routes require authentication
router.use(authMiddleware);

router.get('/', getAllCategories);
router.get('/:id', getSingleCategory);
router.post('/', createNewCategory);
router.put('/:id', updateExistingCategory);
router.delete('/:id', deleteExistingCategory);

export default router;
