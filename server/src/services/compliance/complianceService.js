import { nistCsfFramework } from './nistCsf.js';
import { ComplianceResult } from '../../models/ComplianceResult.js';

/**
 * Evaluates NIST CSF 2.0 controls for a completed scan
 * Returns per-control results, aggregate compliance score, and coverage percentage.
 */
export async function evaluateComplianceForScan(scan, resources, activeFindings) {
  const results = [];
  let applicableAndAssessedCount = 0;
  let passedCount = 0;
  const totalFrameworkControls = nistCsfFramework.controls.length;

  for (const control of nistCsfFramework.controls) {
    // Find resources matching this control's applicable types
    const applicableResources = resources.filter((r) =>
      control.applicableResourceTypes.includes(r.type)
    );

    if (applicableResources.length === 0) {
      results.push({
        organization: scan.organization,
        account: scan.account,
        scan: scan._id,
        framework: nistCsfFramework.name,
        controlId: control.controlId,
        controlTitle: control.title,
        category: control.category,
        status: 'not_applicable',
        applicableResourcesCount: 0,
        failingResourcesCount: 0,
        passingResourcesCount: 0,
        evidence: [],
        remediationGuidance: 'No cloud resources in current account match applicable types for this control.',
      });
      continue;
    }

    // Check if any active finding for these resources maps to any ruleId of this control
    const controlFindings = activeFindings.filter((f) =>
      control.mappedRuleIds.includes(f.ruleId) &&
      (f.status === 'open' || f.status === 'in_progress')
    );

    const failingResourceIds = new Set(controlFindings.map((f) => f.resourceId));
    const failingCount = failingResourceIds.size;
    const passingCount = Math.max(0, applicableResources.length - failingCount);

    const isFailing = failingCount > 0;
    const status = isFailing ? 'fail' : 'pass';

    applicableAndAssessedCount++;
    if (status === 'pass') {
      passedCount++;
    }

    // Gather evidence
    const evidenceList = applicableResources.map((res) => {
      const relatedFinding = controlFindings.find((f) => f.resourceId === res.resourceId);
      if (relatedFinding) {
        return {
          resourceId: res.resourceId,
          resourceName: res.name,
          status: 'FAIL',
          findingId: relatedFinding._id,
          detail: relatedFinding.title,
        };
      }
      return {
        resourceId: res.resourceId,
        resourceName: res.name,
        status: 'PASS',
        detail: 'Configuration verified compliant with control baseline.',
      };
    });

    results.push({
      organization: scan.organization,
      account: scan.account,
      scan: scan._id,
      framework: nistCsfFramework.name,
      controlId: control.controlId,
      controlTitle: control.title,
      category: control.category,
      status,
      applicableResourcesCount: applicableResources.length,
      failingResourcesCount: failingCount,
      passingResourcesCount: passingCount,
      evidence: evidenceList,
      remediationGuidance: isFailing
        ? `Remediate findings in mapped rules [${control.mappedRuleIds.join(', ')}] across ${failingCount} affected resource(s).`
        : 'All assessed cloud resources currently conform to this control.',
    });
  }

  // Calculate percentage: passed applicable and assessed / total applicable and assessed * 100
  let compliancePercentage = null;
  if (applicableAndAssessedCount > 0) {
    compliancePercentage = Math.round((passedCount / applicableAndAssessedCount) * 100);
  }

  // Coverage percentage: applicable & assessed / total defined controls in framework
  const coveragePercentage = Math.round((applicableAndAssessedCount / totalFrameworkControls) * 100);

  // Persist compliance results to database
  if (results.length > 0) {
    await ComplianceResult.insertMany(results);
  }

  return {
    complianceScore: compliancePercentage,
    complianceCoverage: coveragePercentage,
    passedControls: passedCount,
    failedControls: applicableAndAssessedCount - passedCount,
    totalAssessedControls: applicableAndAssessedCount,
    results,
  };
}
