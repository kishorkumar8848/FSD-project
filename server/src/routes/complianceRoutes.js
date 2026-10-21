import express from 'express';
import {
  getComplianceSummary,
  getComplianceFrameworks,
  getComplianceControls,
  getComplianceControlById,
} from '../controllers/complianceController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/summary', getComplianceSummary);
router.get('/frameworks', getComplianceFrameworks);
router.get('/controls', getComplianceControls);
router.get('/controls/:id', getComplianceControlById);

export default router;
