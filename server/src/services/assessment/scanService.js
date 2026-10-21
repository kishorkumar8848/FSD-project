import { Scan } from '../../models/Scan.js';
import { CloudAccount } from '../../models/CloudAccount.js';
import { CloudResource } from '../../models/CloudResource.js';
import { Finding } from '../../models/Finding.js';
import { SecurityRule } from '../../models/SecurityRule.js';
import { Notification } from '../../models/Notification.js';
import { AuditLog } from '../../models/AuditLog.js';
import { allRules, rulesMap } from './rules/index.js';
import { generateFindingFingerprint } from './fingerprint.js';
import { calculatePostureScore, calculateExplainableRisk } from './scoringService.js';
import { evaluateComplianceForScan } from '../compliance/complianceService.js';
import { detectDriftAndCaptureSnapshot } from './driftService.js';

export async function runSecurityScan({
  accountId,
  organizationId,
  initiatedBy = null,
  scanType = 'manual',
}) {
  const startTime = Date.now();

  const account = await CloudAccount.findOne({ _id: accountId, organization: organizationId });
  if (!account) {
    throw new Error('Cloud account not found or access unauthorized.');
  }

  // 1. Create Scan record
  const scan = await Scan.create({
    organization: organizationId,
    account: accountId,
    status: 'running',
    scanType,
    initiatedBy: initiatedBy || undefined,
    startedAt: new Date(),
  });

  try {
    // 2. Fetch resources for this account
    const resources = await CloudResource.find({
      organization: organizationId,
      account: accountId,
    });

    // 3. Fetch rules (honoring database rule overrides/status if customized, fallback to allRules)
    const dbRules = await SecurityRule.find({ status: 'enabled' });
    const enabledRuleMap = new Map();
    // Default to in-code rules
    allRules.forEach((r) => enabledRuleMap.set(r.ruleId, r));
    // If DB has custom rule status
    dbRules.forEach((dbR) => {
      if (enabledRuleMap.has(dbR.ruleId)) {
        enabledRuleMap.set(dbR.ruleId, { ...enabledRuleMap.get(dbR.ruleId), ...dbR.toObject() });
      }
    });

    const activeRules = Array.from(enabledRuleMap.values()).filter((r) => r.status !== 'disabled');

    // 4. Track existing active findings for this account
    const existingActiveFindings = await Finding.find({
      organization: organizationId,
      account: accountId,
      status: { $in: ['open', 'in_progress', 'accepted_risk'] },
    });
    const existingFindingsByFingerprint = new Map(
      existingActiveFindings.map((f) => [f.fingerprint, f])
    );

    const evaluatedFingerprintsThisScan = new Set();
    const failingFingerprintsThisScan = new Set();

    let newFindingsCount = 0;
    let resolvedFindingsCount = 0;
    let rulesEvaluatedCount = 0;

    const newFindingRuleIdsByResource = {};
    const resolvedFindingRuleIdsByResource = {};

    // 5. Run deterministic evaluation loop
    for (const res of resources) {
      for (const rule of activeRules) {
        if (!rule.supportedResourceTypes.includes(res.type)) continue;

        rulesEvaluatedCount++;
        const fingerprint = generateFindingFingerprint(
          organizationId.toString(),
          accountId.toString(),
          res.resourceId,
          rule.ruleId
        );
        evaluatedFingerprintsThisScan.add(fingerprint);

        const evalResult = rule.evaluate(res);

        if (!evalResult.passed && evalResult.status === 'fail') {
          failingFingerprintsThisScan.add(fingerprint);

          const existing = existingFindingsByFingerprint.get(fingerprint);
          if (existing) {
            // Update existing finding
            existing.lastSeenScanId = scan._id;
            existing.lastDetectedAt = new Date();
            existing.evidence = evalResult.evidence;
            // If it was accepted_risk and expired, revert to open
            if (
              existing.status === 'accepted_risk' &&
              existing.riskAcceptance?.expiresAt &&
              new Date(existing.riskAcceptance.expiresAt) < new Date()
            ) {
              existing.status = 'open';
              existing.statusHistory.push({
                fromStatus: 'accepted_risk',
                toStatus: 'open',
                timestamp: new Date(),
                reason: 'Accepted risk period expired during automated scan.',
              });
            }
            await existing.save();
          } else {
            // Check if there was a previously resolved finding with this fingerprint
            const historicalResolved = await Finding.findOne({
              organization: organizationId,
              fingerprint,
              status: 'resolved',
            });

            if (historicalResolved) {
              // Re-open regression
              historicalResolved.status = 'open';
              historicalResolved.lastSeenScanId = scan._id;
              historicalResolved.lastDetectedAt = new Date();
              historicalResolved.evidence = evalResult.evidence;
              historicalResolved.statusHistory.push({
                fromStatus: 'resolved',
                toStatus: 'open',
                timestamp: new Date(),
                reason: 'Security regression: Misconfiguration re-detected during scan.',
              });
              await historicalResolved.save();
              newFindingsCount++;
            } else {
              // Create brand new finding
              const { riskScore } = calculateExplainableRisk(rule, res);
              await Finding.create({
                organization: organizationId,
                account: accountId,
                resource: res._id,
                resourceId: res.resourceId,
                resourceName: res.name,
                resourceType: res.type,
                ruleId: rule.ruleId,
                ruleName: rule.name,
                ruleVersion: rule.version || '1.0.0',
                fingerprint,
                severity: rule.severity,
                category: rule.category,
                title: rule.name,
                description: rule.description,
                status: 'open',
                riskScore: evalResult.riskScore || riskScore,
                evidence: evalResult.evidence,
                businessImpact: rule.remediationInstructions?.whyItMatters || '',
                remediationInstructions: rule.remediationInstructions,
                complianceMappings: rule.complianceMappings,
                firstSeenScanId: scan._id,
                lastSeenScanId: scan._id,
                firstDetectedAt: new Date(),
                lastDetectedAt: new Date(),
                statusHistory: [
                  {
                    fromStatus: 'none',
                    toStatus: 'open',
                    timestamp: new Date(),
                    reason: 'Initial detection during automated assessment.',
                  },
                ],
              });

              newFindingsCount++;

              if (!newFindingRuleIdsByResource[res.resourceId]) {
                newFindingRuleIdsByResource[res.resourceId] = [];
              }
              newFindingRuleIdsByResource[res.resourceId].push(rule.ruleId);
            }
          }
        }
      }

      // Update resource lastAssessedAt
      res.lastAssessedAt = new Date();
      await res.save();
    }

    // 6. Identify resolved findings (were active, but passed this scan)
    for (const existing of existingActiveFindings) {
      if (
        evaluatedFingerprintsThisScan.has(existing.fingerprint) &&
        !failingFingerprintsThisScan.has(existing.fingerprint)
      ) {
        // Finding no longer reproduces! Mark as resolved
        existing.status = 'resolved';
        existing.resolvedAt = new Date();
        existing.resolvedByScanId = scan._id;
        existing.statusHistory.push({
          fromStatus: existing.status,
          toStatus: 'resolved',
          timestamp: new Date(),
          reason: 'Verified resolved: Resource configuration now conforms to rule baseline.',
        });
        await existing.save();
        resolvedFindingsCount++;

        if (!resolvedFindingRuleIdsByResource[existing.resourceId]) {
          resolvedFindingRuleIdsByResource[existing.resourceId] = [];
        }
        resolvedFindingRuleIdsByResource[existing.resourceId].push(existing.ruleId);
      }
    }

    // 7. Get final active findings for score and compliance computation
    const currentActiveFindings = await Finding.find({
      organization: organizationId,
      account: accountId,
      status: { $in: ['open', 'in_progress', 'accepted_risk'] },
    });

    const severityCounts = { critical: 0, high: 0, medium: 0, low: 0 };
    currentActiveFindings.forEach((f) => {
      if (severityCounts[f.severity] !== undefined) {
        severityCounts[f.severity]++;
      }
    });

    const postureScore = calculatePostureScore(currentActiveFindings);

    // 8. Compliance evaluation
    const complianceData = await evaluateComplianceForScan(scan, resources, currentActiveFindings);

    // 9. Configuration Drift detection & snapshot capture
    const { snapshot } = await detectDriftAndCaptureSnapshot({
      organizationId,
      accountId,
      scanId: scan._id,
      resources,
      newFindingRuleIdsByResource,
      resolvedFindingRuleIdsByResource,
    });

    // 10. Update Scan record to completed
    const durationMs = Date.now() - startTime;
    scan.status = 'completed';
    scan.completedAt = new Date();
    scan.durationMs = durationMs;
    scan.resourcesEvaluatedCount = resources.length;
    scan.rulesEvaluatedCount;
    scan.findingsSummary = {
      critical: severityCounts.critical,
      high: severityCounts.high,
      medium: severityCounts.medium,
      low: severityCounts.low,
      totalActive: currentActiveFindings.length,
      newFindings: newFindingsCount,
      resolvedFindings: resolvedFindingsCount,
      unchangedFindings: Math.max(0, currentActiveFindings.length - newFindingsCount),
    };
    scan.postureScore = postureScore;
    scan.complianceScore = complianceData.complianceScore ?? 100;
    scan.complianceCoverage = complianceData.complianceCoverage ?? 100;
    scan.snapshot = snapshot._id;
    await scan.save();

    // 11. Update CloudAccount summary fields
    account.lastScanAt = new Date();
    account.lastScanStatus = 'completed';
    account.postureScore = postureScore;
    account.totalResources = resources.length;
    account.totalFindings = currentActiveFindings.length;
    await account.save();

    // 12. Trigger notifications if critical findings found
    if (severityCounts.critical > 0) {
      await Notification.create({
        organization: organizationId,
        type: 'critical_finding',
        title: `Critical findings detected on ${account.name}`,
        message: `${severityCounts.critical} critical security finding(s) detected during scan ${scan._id.toString().slice(-6)}. Immediate review recommended.`,
        severity: 'critical',
        metadata: { scanId: scan._id, accountId: account._id },
      });
    }

    // Scan complete notification
    await Notification.create({
      organization: organizationId,
      type: 'scan_completed',
      title: `Assessment Completed: ${account.name}`,
      message: `Evaluated ${resources.length} resources against ${rulesEvaluatedCount} checks. Posture Score: ${postureScore}/100.`,
      severity: 'info',
      metadata: { scanId: scan._id, accountId: account._id },
    });

    // Audit log
    await AuditLog.create({
      organization: organizationId,
      actor: initiatedBy || undefined,
      actorEmail: 'system@cloudguard.io',
      action: 'SCAN_COMPLETED',
      targetType: 'scan',
      targetId: scan._id.toString(),
      details: {
        accountId: account._id,
        accountName: account.name,
        postureScore,
        totalActiveFindings: currentActiveFindings.length,
        durationMs,
      },
    });

    return scan;
  } catch (err) {
    scan.status = 'failed';
    scan.completedAt = new Date();
    scan.durationMs = Date.now() - startTime;
    scan.errorMessage = err.message;
    await scan.save();

    account.lastScanStatus = 'failed';
    await account.save();

    await Notification.create({
      organization: organizationId,
      type: 'scan_failed',
      title: `Scan failed on ${account.name}`,
      message: `Scan execution encountered an error: ${err.message}`,
      severity: 'high',
      metadata: { scanId: scan._id, accountId: account._id },
    });

    throw err;
  }
}
