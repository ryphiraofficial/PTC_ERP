import express from 'express';
import {
  getItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
} from '../controllers/itemController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getItems);
router.get('/:id', protect, getItemById);
router.post('/', protect, authorize('owner', 'biller'), createItem);
router.put('/:id', protect, authorize('owner', 'biller'), updateItem);
router.delete('/:id', protect, authorize('owner'), deleteItem);

export default router;
