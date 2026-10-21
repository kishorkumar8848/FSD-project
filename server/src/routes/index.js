import express from 'express';
import authRoutes from './authRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import cloudAccountRoutes from './cloudAccountRoutes.js';
import resourceRoutes from './resourceRoutes.js';
import scanRoutes from './scanRoutes.js';
import findingRoutes from './findingRoutes.js';
import complianceRoutes from './complianceRoutes.js';
import ruleRoutes from './ruleRoutes.js';
import reportRoutes from './reportRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import auditLogRoutes from './auditLogRoutes.js';
import settingsRoutes from './settingsRoutes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/cloud-accounts', cloudAccountRoutes);
router.use('/resources', resourceRoutes);
router.use('/scans', scanRoutes);
router.use('/findings', findingRoutes);
router.use('/compliance', complianceRoutes);
router.use('/rules', ruleRoutes);
router.use('/reports', reportRoutes);
router.use('/notifications', notificationRoutes);
router.use('/audit-logs', auditLogRoutes);
router.use('/settings', settingsRoutes);

export default router;
