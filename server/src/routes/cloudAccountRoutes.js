import express from 'express';
import {
  getCloudAccounts,
  getCloudAccountById,
  createCloudAccount,
  updateCloudAccount,
  deleteCloudAccount,
} from '../controllers/cloudAccountController.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getCloudAccounts);
router.post('/', createCloudAccount);
router.get('/:id', getCloudAccountById);
router.patch('/:id', updateCloudAccount);
router.delete('/:id', authorizeRoles('admin'), deleteCloudAccount);

export default router;
