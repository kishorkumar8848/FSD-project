import { CloudAccount } from '../models/CloudAccount.js';
import { CloudResource } from '../models/CloudResource.js';
import { Finding } from '../models/Finding.js';
import { Scan } from '../models/Scan.js';
import { ComplianceResult } from '../models/ComplianceResult.js';
import { calculatePostureScore } from '../services/assessment/scoringService.js';

export async function getDashboardSummary(req, res, next) {
  try {
    const orgId = req.organizationId;

    // 1. Total Cloud Accounts
    const totalAccounts = await CloudAccount.countDocuments({ organization: orgId });

    // 2. Total Resources
    const totalResources = await CloudResource.countDocuments({ organization: orgId });

    // 3. Active Findings
    const activeFindings = await Finding.find({
      organization: orgId,
      status: { $in: ['open', 'in_progress', 'accepted_risk'] },
    });

    const severityCounts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    const categoryCounts = {};
    for (const f of activeFindings) {
      if (severityCounts[f.severity] !== undefined) {
        severityCounts[f.severity]++;
      }
      categoryCounts[f.category] = (categoryCounts[f.category] || 0) + 1;
    }

    // 4. Overall Posture Score
    const overallPostureScore = calculatePostureScore(activeFindings);

    // 5. Last Successful Scan
    const lastScan = await Scan.findOne({
      organization: orgId,
      status: 'completed',
    })
      .sort({ completedAt: -1 })
      .populate('account', 'name provider');

    // 6. Compliance stats
    let complianceScore = 100;
    let complianceDistribution = { pass: 0, fail: 0, not_applicable: 0 };

    if (lastScan) {
      const compResults = await ComplianceResult.find({ scan: lastScan._id });
      for (const cr of compResults) {
        if (complianceDistribution[cr.status] !== undefined) {
          complianceDistribution[cr.status]++;
        }
      }
      complianceScore = lastScan.complianceScore ?? 100;
    }

    // 7. Remediation progress counts
    const statusCounts = {
      open: await Finding.countDocuments({ organization: orgId, status: 'open' }),
      in_progress: await Finding.countDocuments({ organization: orgId, status: 'in_progress' }),
      resolved: await Finding.countDocuments({ organization: orgId, status: 'resolved' }),
      accepted_risk: await Finding.countDocuments({ organization: orgId, status: 'accepted_risk' }),
      false_positive: await Finding.countDocuments({ organization: orgId, status: 'false_positive' }),
    };

    // 8. Resource breakdown by type
    const resourceTypesAgg = await CloudResource.aggregate([
      { $match: { organization: orgId } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);
    const resourceTypes = resourceTypesAgg.map((r) => ({ type: r._id, count: r.count }));

    // 9. Resource breakdown by provider
    const resourceProvidersAgg = await CloudResource.aggregate([
      { $match: { organization: orgId } },
      { $group: { _id: '$provider', count: { $sum: 1 } } },
    ]);
    const resourceProviders = resourceProvidersAgg.map((r) => ({ provider: r._id, count: r.count }));

    // 10. Scan History Over Time (last 10 scans)
    const scanHistory = await Scan.find({ organization: orgId })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('account', 'name')
      .lean();

    // 11. Most frequently failing rules
    const failingRulesAgg = await Finding.aggregate([
      { $match: { organization: orgId, status: { $in: ['open', 'in_progress'] } } },
      {
        $group: {
          _id: { ruleId: '$ruleId', ruleName: '$ruleName', severity: '$severity' },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);
    const topFailingRules = failingRulesAgg.map((r) => ({
      ruleId: r._id.ruleId,
      ruleName: r._id.ruleName,
      severity: r._id.severity,
      count: r.count,
    }));

    // 12. Highest risk resources
    const highestRiskResources = await Finding.aggregate([
      { $match: { organization: orgId, status: { $in: ['open', 'in_progress'] } } },
      {
        $group: {
          _id: {
            resourceId: '$resourceId',
            resourceName: '$resourceName',
            resourceType: '$resourceType',
          },
          totalRiskScore: { $sum: '$riskScore' },
          findingsCount: { $sum: 1 },
        },
      },
      { $sort: { totalRiskScore: -1 } },
      { $limit: 5 },
    ]).then((rows) =>
      rows.map((r) => ({
        resourceId: r._id.resourceId,
        resourceName: r._id.resourceName,
        resourceType: r._id.resourceType,
        totalRiskScore: r.totalRiskScore,
        findingsCount: r.findingsCount,
      }))
    );

    res.json({
      success: true,
      data: {
        summaryCards: {
          totalAccounts,
          totalResources,
          totalActiveFindings: activeFindings.length,
          criticalFindings: severityCounts.critical,
          highFindings: severityCounts.high,
          postureScore: overallPostureScore,
          complianceScore,
          lastSuccessfulScan: lastScan
            ? {
                scanId: lastScan._id,
                accountName: lastScan.account?.name,
                completedAt: lastScan.completedAt,
              }
            : null,
        },
        charts: {
          findingsBySeverity: Object.entries(severityCounts).map(([severity, count]) => ({
            severity,
            count,
          })),
          findingsByCategory: Object.entries(categoryCounts).map(([category, count]) => ({
            category,
            count,
          })),
          complianceDistribution: Object.entries(complianceDistribution).map(([status, count]) => ({
            status,
            count,
          })),
          remediationProgress: statusCounts,
          resourceTypes,
          resourceProviders,
          scanHistory: scanHistory.reverse().map((s) => ({
            date: new Date(s.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }),
            postureScore: s.postureScore || 100,
            complianceScore: s.complianceScore || 100,
            activeFindings: s.findingsSummary?.totalActive || 0,
            accountName: s.account?.name || 'Account',
          })),
        },
        topFailingRules,
        highestRiskResources,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getRecentFindings(req, res, next) {
  try {
    const findings = await Finding.find({
      organization: req.organizationId,
      status: { $in: ['open', 'in_progress'] },
    })
      .sort({ riskScore: -1, lastDetectedAt: -1 })
      .limit(8)
      .populate('account', 'name provider');

    res.json({ success: true, data: findings });
  } catch (err) {
    next(err);
  }
}
