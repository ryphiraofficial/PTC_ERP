import express from 'express';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from '../controllers/customerController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getCustomers);
router.get('/:id', protect, getCustomerById);
router.post('/', protect, authorize('owner', 'biller'), createCustomer);
router.put('/:id', protect, authorize('owner', 'biller'), updateCustomer);
router.delete('/:id', protect, authorize('owner'), deleteCustomer);

export default router;
