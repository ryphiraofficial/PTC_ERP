import express from 'express';
import { register, login, getMe, switchRoleUser, getAllUsers } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/users', protect, getAllUsers);
router.post('/switch-role/:role', switchRoleUser);

export default router;
