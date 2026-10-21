import { AuditLog } from '../models/AuditLog.js';
import { Organization } from '../models/Organization.js';

export async function getAuditLogs(req, res, next) {
  try {
    const { page = 1, limit = 25, action, targetType } = req.query;
    const query = { organization: req.organizationId };

    if (action) query.action = action;
    if (targetType) query.targetType = targetType;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      AuditLog.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          total,
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          totalPages: Math.ceil(total / parseInt(limit, 10)),
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getSettings(req, res, next) {
  try {
    const org = await Organization.findById(req.organizationId);
    res.json({
      success: true,
      data: {
        organization: org,
        environment: process.env.NODE_ENV,
        cronEnabled: process.env.ENABLE_CRON_SCHEDULE !== 'false',
        demoMode: process.env.DEMO_MODE !== 'false',
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function updateSettings(req, res, next) {
  try {
    const org = await Organization.findById(req.organizationId);
    if (!org) {
      return res.status(404).json({ success: false, error: { message: 'Organization not found.' } });
    }

    if (req.body.name) org.name = req.body.name;
    if (req.body.settings) {
      org.settings = { ...org.settings, ...req.body.settings };
    }

    await org.save();

    await AuditLog.create({
      organization: req.organizationId,
      actor: req.user._id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'SETTINGS_UPDATED',
      targetType: 'setting',
      details: req.body,
    });

    res.json({ success: true, data: org });
  } catch (err) {
    next(err);
  }
}
