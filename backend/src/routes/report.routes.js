import express from 'express';
import { 
  exportVisitsExcel as exportVisits, 
  exportCheckouts, 
  exportReturns 
} from '../controllers/report.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/visits', exportVisits);
router.get('/checkouts', exportCheckouts);
router.get('/returns', exportReturns);

export default router;