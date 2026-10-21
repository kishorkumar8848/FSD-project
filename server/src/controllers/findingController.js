import { z } from 'zod';
import { Finding } from '../models/Finding.js';
import { CloudResource } from '../models/CloudResource.js';
import { AuditLog } from '../models/AuditLog.js';
import { getRuleById } from '../services/assessment/rules/index.js';

const updateStatusSchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved', 'accepted_risk', 'false_positive']),
  reason: z.string().optional().default('Manual status adjustment by analyst.'),
});

const acceptRiskSchema = z.object({
  justification: z.string().min(5, 'Risk acceptance justification must be at least 5 characters'),
  expiresAt: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Valid expiry ISO date is required',
  }),
});

const falsePositiveSchema = z.object({
  justification: z.string().min(5, 'False positive justification must be at least 5 characters'),
});

export async function getFindings(req, res, next) {
  try {
    const {
      page = 1,
      limit = 15,
      severity,
      status,
      category,
      accountId,
      resourceType,
      search,
      sortField = 'lastDetectedAt',
      sortOrder = 'desc',
    } = req.query;

    const query = { organization: req.organizationId };

    if (severity) query.severity = severity;
    if (status) query.status = status;
    if (category) query.category = category;
    if (accountId) query.account = accountId;
    if (resourceType) query.resourceType = resourceType;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { ruleId: { $regex: search, $options: 'i' } },
        { resourceName: { $regex: search, $options: 'i' } },
        { resourceId: { $regex: search, $options: 'i' } },
      ];
    }

    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [findings, total] = await Promise.all([
      Finding.find(query)
        .populate('account', 'name provider environment')
        .populate('resource', 'name type criticality environment')
        .populate('assignedTo', 'name email')
        .sort({ [sortField]: sortDirection })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      Finding.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        findings,
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

export async function getFindingById(req, res, next) {
  try {
    const finding = await Finding.findOne({
      _id: req.params.id,
      organization: req.organizationId,
    })
      .populate('account', 'name provider environment region')
      .populate('resource')
      .populate('firstSeenScanId', 'scanType createdAt')
      .populate('lastSeenScanId', 'scanType createdAt');

    if (!finding) {
      return res.status(404).json({ success: false, error: { message: 'Finding not found.' } });
    }

    res.json({ success: true, data: finding });
  } catch (err) {
    next(err);
  }
}

export async function updateFindingStatus(req, res, next) {
  try {
    const { status, reason } = updateStatusSchema.parse(req.body);

    const finding = await Finding.findOne({
      _id: req.params.id,
      organization: req.organizationId,
    });
    if (!finding) {
      return res.status(404).json({ success: false, error: { message: 'Finding not found.' } });
    }

    const previousStatus = finding.status;
    finding.status = status;
    if (status === 'resolved') {
      finding.resolvedAt = new Date();
    }

    finding.statusHistory.push({
      fromStatus: previousStatus,
      toStatus: status,
      actor: req.user._id,
      actorName: req.user.name,
      timestamp: new Date(),
      reason,
    });

    await finding.save();

    await AuditLog.create({
      organization: req.organizationId,
      actor: req.user._id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'FINDING_STATUS_CHANGED',
      targetType: 'finding',
      targetId: finding._id.toString(),
      details: {
        ruleId: finding.ruleId,
        fromStatus: previousStatus,
        toStatus: status,
        reason,
      },
    });

    res.json({
      success: true,
      message: `Finding status updated from '${previousStatus}' to '${status}'.`,
      data: finding,
    });
  } catch (err) {
    next(err);
  }
}

export async function acceptFindingRisk(req, res, next) {
  try {
    const data = acceptRiskSchema.parse(req.body);

    const finding = await Finding.findOne({
      _id: req.params.id,
      organization: req.organizationId,
    });
    if (!finding) {
      return res.status(404).json({ success: false, error: { message: 'Finding not found.' } });
    }

    const previousStatus = finding.status;
    finding.status = 'accepted_risk';
    finding.riskAcceptance = {
      justification: data.justification,
      acceptedBy: req.user._id,
      acceptedAt: new Date(),
      expiresAt: new Date(data.expiresAt),
    };

    finding.statusHistory.push({
      fromStatus: previousStatus,
      toStatus: 'accepted_risk',
      actor: req.user._id,
      actorName: req.user.name,
      timestamp: new Date(),
      reason: `Risk accepted: ${data.justification} (Expires: ${new Date(data.expiresAt).toLocaleDateString()})`,
    });

    await finding.save();

    await AuditLog.create({
      organization: req.organizationId,
      actor: req.user._id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'RISK_ACCEPTED',
      targetType: 'finding',
      targetId: finding._id.toString(),
      details: {
        justification: data.justification,
        expiresAt: data.expiresAt,
      },
    });

    res.json({
      success: true,
      message: 'Risk exception granted with mandatory expiration tracking.',
      data: finding,
    });
  } catch (err) {
    next(err);
  }
}

export async function verifyFindingRemediation(req, res, next) {
  try {
    const finding = await Finding.findOne({
      _id: req.params.id,
      organization: req.organizationId,
    }).populate('resource');

    if (!finding) {
      return res.status(404).json({ success: false, error: { message: 'Finding not found.' } });
    }

    const resource = await CloudResource.findById(finding.resource);
    if (!resource) {
      return res.status(404).json({
        success: false,
        error: { message: 'Associated resource was deleted from inventory.' },
      });
    }

    const rule = getRuleById(finding.ruleId);
    if (!rule) {
      return res.status(400).json({
        success: false,
        error: { message: `Rule '${finding.ruleId}' definition could not be resolved.` },
      });
    }

    // Re-evaluate rule deterministically
    const evalResult = rule.evaluate(resource);

    if (evalResult.passed) {
      const fromStatus = finding.status;
      finding.status = 'resolved';
      finding.resolvedAt = new Date();
      finding.statusHistory.push({
        fromStatus,
        toStatus: 'resolved',
        actor: req.user._id,
        actorName: req.user.name,
        timestamp: new Date(),
        reason: 'Verification scan successful: Current configuration conforms to rule security baseline.',
      });
      await finding.save();

      return res.json({
        success: true,
        verified: true,
        message: 'Verification passed! Finding has been marked as Resolved by evidence.',
        data: finding,
      });
    } else {
      // Still non-compliant
      finding.evidence = evalResult.evidence;
      await finding.save();

      return res.json({
        success: true,
        verified: false,
        message: 'Verification failed: Configuration remains non-compliant.',
        evidence: evalResult.evidence,
        data: finding,
      });
    }
  } catch (err) {
    next(err);
  }
}
