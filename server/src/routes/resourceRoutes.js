import express from 'express';
import {
  getResources,
  getResourceById,
  importResources,
  getResourceHistory,
} from '../controllers/resourceController.js';
import { authenticate } from '../middleware/auth.js';
import { importLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getResources);
router.post('/import', importLimiter, importResources);
router.get('/:id', getResourceById);
router.get('/:id/history', getResourceHistory);

export default router;
