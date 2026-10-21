import express from 'express';
import { getRules, getRuleDetails, updateRule } from '../controllers/ruleController.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getRules);
router.get('/:id', getRuleDetails);
router.patch('/:id', authorizeRoles('admin'), updateRule);

export default router;
