import express from 'express';
import { getReports, createReport, downloadReport } from '../controllers/reportController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getReports);
router.post('/', createReport);
router.get('/:id/download', downloadReport);

export default router;
