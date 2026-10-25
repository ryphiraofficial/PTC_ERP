import express from 'express';
import {
  getDashboardStats,
  getGstr1Report,
  getGstr3bReport,
} from '../controllers/reportController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/dashboard', protect, getDashboardStats);
router.get('/gstr-1', protect, getGstr1Report);
router.get('/gstr-3b', protect, getGstr3bReport);

export default router;
