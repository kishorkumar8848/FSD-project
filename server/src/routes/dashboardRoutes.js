import express from 'express';
import { getDashboardSummary, getRecentFindings } from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/summary', getDashboardSummary);
router.get('/recent-findings', getRecentFindings);

export default router;
