import express from 'express';
import { getSettings, updateSettings } from '../controllers/auditLogController.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getSettings);
router.patch('/', authorizeRoles('admin'), updateSettings);

export default router;
