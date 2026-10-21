import express from 'express';
import {
  createScan,
  getScans,
  getScanById,
  getScanFindings,
  getScanCompliance,
  getScanDiff,
} from '../controllers/scanController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.post('/', createScan);
router.get('/', getScans);
router.get('/:id', getScanById);
router.get('/:id/findings', getScanFindings);
router.get('/:id/compliance', getScanCompliance);
router.get('/:id/diff', getScanDiff);

export default router;
