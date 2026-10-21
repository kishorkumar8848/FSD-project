import { z } from 'zod';
import { Scan } from '../models/Scan.js';
import { Finding } from '../models/Finding.js';
import { ComplianceResult } from '../models/ComplianceResult.js';
import { DriftEvent } from '../models/DriftEvent.js';
import { runSecurityScan } from '../services/assessment/scanService.js';

const triggerScanSchema = z.object({
  accountId: z.string().min(1, 'Account ID is required'),
  scanType: z.enum(['manual', 'scheduled', 'verification', 'import_scan']).default('manual'),
});

export async function createScan(req, res, next) {
  try {
    const data = triggerScanSchema.parse(req.body);

    const completedScan = await runSecurityScan({
      accountId: data.accountId,
      organizationId: req.organizationId,
      initiatedBy: req.user._id,
      scanType: data.scanType,
    });

    res.status(201).json({
      success: true,
      message: 'Security assessment completed successfully.',
      data: completedScan,
    });
  } catch (err) {
    next(err);
  }
}

export async function getScans(req, res, next) {
  try {
    const { accountId, page = 1, limit = 15 } = req.query;
    const query = { organization: req.organizationId };
    if (accountId) query.account = accountId;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [scans, total] = await Promise.all([
      Scan.find(query)
        .populate('account', 'name provider environment')
        .populate('initiatedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      Scan.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        scans,
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

export async function getScanById(req, res, next) {
  try {
    const scan = await Scan.findOne({
      _id: req.params.id,
      organization: req.organizationId,
    })
      .populate('account', 'name provider environment region')
      .populate('initiatedBy', 'name email');

    if (!scan) {
      return res.status(404).json({ success: false, error: { message: 'Scan record not found.' } });
    }

    res.json({ success: true, data: scan });
  } catch (err) {
    next(err);
  }
}

export async function getScanFindings(req, res, next) {
  try {
    const scan = await Scan.findOne({ _id: req.params.id, organization: req.organizationId });
    if (!scan) {
      return res.status(404).json({ success: false, error: { message: 'Scan not found.' } });
    }

    const findings = await Finding.find({
      organization: req.organizationId,
      $or: [{ firstSeenScanId: scan._id }, { lastSeenScanId: scan._id }, { resolvedByScanId: scan._id }],
    }).sort({ severity: 1, riskScore: -1 });

    res.json({ success: true, data: findings });
  } catch (err) {
    next(err);
  }
}

export async function getScanCompliance(req, res, next) {
  try {
    const results = await ComplianceResult.find({
      organization: req.organizationId,
      scan: req.params.id,
    }).sort({ category: 1, controlId: 1 });

    res.json({ success: true, data: results });
  } catch (err) {
    next(err);
  }
}

export async function getScanDiff(req, res, next) {
  try {
    const currentScan = await Scan.findOne({ _id: req.params.id, organization: req.organizationId });
    if (!currentScan) {
      return res.status(404).json({ success: false, error: { message: 'Scan record not found.' } });
    }

    // Drift events associated with this scan
    const driftEvents = await DriftEvent.find({
      organization: req.organizationId,
      currentScan: currentScan._id,
    });

    // Comparison against previous scan
    const previousScan = await Scan.findOne({
      organization: req.organizationId,
      account: currentScan.account,
      status: 'completed',
      createdAt: { $lt: currentScan.createdAt },
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        currentScan,
        previousScan,
        driftEvents,
        postureDelta: previousScan ? (currentScan.postureScore || 100) - (previousScan.postureScore || 100) : 0,
        complianceDelta: previousScan ? (currentScan.complianceScore || 100) - (previousScan.complianceScore || 100) : 0,
      },
    });
  } catch (err) {
    next(err);
  }
}
