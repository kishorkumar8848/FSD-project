import { nistCsfFramework } from '../services/compliance/nistCsf.js';
import { ComplianceResult } from '../models/ComplianceResult.js';
import { Scan } from '../models/Scan.js';
import { Finding } from '../models/Finding.js';
import { CloudResource } from '../models/CloudResource.js';

export async function getComplianceSummary(req, res, next) {
  try {
    const lastScan = await Scan.findOne({
      organization: req.organizationId,
      status: 'completed',
    }).sort({ completedAt: -1 });

    if (!lastScan) {
      return res.json({
        success: true,
        data: {
          framework: nistCsfFramework.name,
          frameworkVersion: nistCsfFramework.version,
          complianceScore: null,
          complianceCoverage: null,
          totalControls: nistCsfFramework.controls.length,
          passedControls: 0,
          failedControls: 0,
          notAssessedControls: nistCsfFramework.controls.length,
          lastAssessedAt: null,
          disclaimer:
            'Demonstration framework mapping inspired by NIST CSF 2.0. Not a formal certification or regulatory audit.',
        },
      });
    }

    const results = await ComplianceResult.find({
      organization: req.organizationId,
      scan: lastScan._id,
    });

    const passed = results.filter((r) => r.status === 'pass').length;
    const failed = results.filter((r) => r.status === 'fail').length;
    const notApplicable = results.filter((r) => r.status === 'not_applicable').length;
    const assessed = passed + failed;

    res.json({
      success: true,
      data: {
        framework: nistCsfFramework.name,
        frameworkVersion: nistCsfFramework.version,
        complianceScore: lastScan.complianceScore,
        complianceCoverage: lastScan.complianceCoverage,
        totalControls: nistCsfFramework.controls.length,
        passedControls: passed,
        failedControls: failed,
        notApplicableControls: notApplicable,
        totalAssessedControls: assessed,
        lastAssessedAt: lastScan.completedAt,
        scanId: lastScan._id,
        disclaimer:
          'Demonstration framework mapping inspired by NIST CSF 2.0. Not a formal certification or regulatory audit.',
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getComplianceFrameworks(req, res, next) {
  try {
    res.json({
      success: true,
      data: [
        {
          id: 'nist-csf-2.0',
          name: nistCsfFramework.name,
          version: nistCsfFramework.version,
          description: nistCsfFramework.description,
          totalControls: nistCsfFramework.controls.length,
          categories: [
            'Governance & Asset Inventory',
            'Identity & Access Management',
            'Data Protection',
            'Infrastructure Security',
            'Logging & Monitoring',
            'Backup & Recovery',
          ],
        },
      ],
    });
  } catch (err) {
    next(err);
  }
}

export async function getComplianceControls(req, res, next) {
  try {
    const { category, status } = req.query;

    const lastScan = await Scan.findOne({
      organization: req.organizationId,
      status: 'completed',
    }).sort({ completedAt: -1 });

    let scanResultsMap = new Map();
    if (lastScan) {
      const results = await ComplianceResult.find({
        organization: req.organizationId,
        scan: lastScan._id,
      });
      scanResultsMap = new Map(results.map((r) => [r.controlId, r]));
    }

    let controls = nistCsfFramework.controls.map((c) => {
      const result = scanResultsMap.get(c.controlId);
      return {
        ...c,
        status: result ? result.status : 'not_assessed',
        applicableResourcesCount: result ? result.applicableResourcesCount : 0,
        failingResourcesCount: result ? result.failingResourcesCount : 0,
        passingResourcesCount: result ? result.passingResourcesCount : 0,
        remediationGuidance: result?.remediationGuidance || 'Awaiting initial scan assessment.',
      };
    });

    if (category) {
      controls = controls.filter((c) => c.category === category);
    }
    if (status) {
      controls = controls.filter((c) => c.status === status);
    }

    res.json({ success: true, data: controls });
  } catch (err) {
    next(err);
  }
}

export async function getComplianceControlById(req, res, next) {
  try {
    const control = nistCsfFramework.controls.find(
      (c) => c.controlId.toLowerCase() === req.params.id.toLowerCase()
    );
    if (!control) {
      return res.status(404).json({ success: false, error: { message: 'Compliance control not found.' } });
    }

    const lastScan = await Scan.findOne({
      organization: req.organizationId,
      status: 'completed',
    }).sort({ completedAt: -1 });

    let result = null;
    if (lastScan) {
      result = await ComplianceResult.findOne({
        organization: req.organizationId,
        scan: lastScan._id,
        controlId: control.controlId,
      });
    }

    // Active findings mapped to this control
    const mappedFindings = await Finding.find({
      organization: req.organizationId,
      ruleId: { $in: control.mappedRuleIds },
      status: { $in: ['open', 'in_progress'] },
    }).populate('resource', 'name type environment criticality');

    res.json({
      success: true,
      data: {
        control,
        result,
        mappedFindings,
      },
    });
  } catch (err) {
    next(err);
  }
}
