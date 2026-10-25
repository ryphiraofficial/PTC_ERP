import express from 'express';
import {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  auditInvoiceByCA,
  deleteInvoice,
} from '../controllers/invoiceController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getInvoices);
router.get('/:id', protect, getInvoiceById);
router.post('/', protect, authorize('owner', 'biller'), createInvoice);
// INVOICE EDIT FEATURE
router.put('/:id', protect, authorize('owner', 'biller', 'ca'), updateInvoice);
// CA SPECIFIC AUDIT ENDPOINT
router.post('/:id/audit', protect, authorize('ca', 'owner'), auditInvoiceByCA);
router.delete('/:id', protect, authorize('owner', 'biller'), deleteInvoice);

export default router;
