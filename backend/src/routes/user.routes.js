import express from 'express';
import { 
  getUsers, 
  getUserById, 
  createUser, 
  updateUser, 
  deleteUser, 
  getProfile, 
  updateProfile 
} from '../controllers/user.controller.js';
import authMiddleware, { adminOnly } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authMiddleware);

// 1. Rute Profil (Wajib di atas /:id agar tidak tertukar dengan parameter ID)
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// 2. Rute Manajemen User (Khusus Admin)
router.get('/', adminOnly, getUsers);
router.get('/:id', adminOnly, getUserById);
router.post('/', adminOnly, createUser);
router.put('/:id', adminOnly, updateUser);
router.delete('/:id', adminOnly, deleteUser);

export default router;