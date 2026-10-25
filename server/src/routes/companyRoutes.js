import express from 'express';
import { getCompany, updateCompany } from '../controllers/companyController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getCompany);
router.put('/', protect, authorize('owner'), updateCompany);

export default router;
