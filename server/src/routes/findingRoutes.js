import express from 'express';
import {
  getFindings,
  getFindingById,
  updateFindingStatus,
  acceptFindingRisk,
  verifyFindingRemediation,
} from '../controllers/findingController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getFindings);
router.get('/:id', getFindingById);
router.patch('/:id/status', updateFindingStatus);
router.post('/:id/accept-risk', acceptFindingRisk);
router.post('/:id/verify', verifyFindingRemediation);

export default router;
