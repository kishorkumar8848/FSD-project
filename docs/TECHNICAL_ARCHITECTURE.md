# CloudGuard — Comprehensive Technical Architecture & Project Report

---

## 1. Complete Project Folder Structure

```
d:/FSD/
│
├── .env                              # Active root environment variables (MongoDB Atlas, JWT, ports)
├── .env.example                      # Safe placeholder environment template
├── .gitignore                        # Git exclusion rules (node_modules, .env, build artifacts)
├── package.json                      # Workspace root orchestration scripts
├── README.md                         # Project documentation and quickstart instructions
│
├── sample-data/                      # Evaluation fixtures & demonstration JSON schemas
│   ├── secure-resources.json         # Hardened, 100% compliant cloud resource configurations
│   ├── vulnerable-resources.json     # Intentionally vulnerable resources violating CG-001..CG-010
│   └── mixed-environment.json        # Enterprise hybrid environment (dev, staging, production)
│
├── client/                           # React 18 + Vite SPA Frontend
│   ├── index.html                    # Root HTML document with cybersecurity fonts
│   ├── package.json                  # Frontend dependencies (React, Vite, Recharts, Lucide, Axios)
│   ├── postcss.config.js             # PostCSS Tailwind plugins
│   ├── tailwind.config.js            # Design system palette, custom dark navy tokens
│   ├── vite.config.js                # Vite configuration with `/api` proxy to localhost:5000
│   │
│   └── src/
│       ├── main.jsx                  # ReactDOM root render with BrowserRouter
│       ├── App.jsx                   # Master routing table & AuthProvider wrapper
│       ├── index.css                 # Base Tailwind directives, scrollbars, glow utilities
│       │
│       ├── api/
│       │   └── client.js             # Axios client with JWT interceptor & 401 handling
│       │
│       ├── context/
│       │   └── AuthContext.jsx       # Reactive user, organization, token, and RBAC context
│       │
│       ├── components/
│       │   ├── common/
│       │   │   ├── Badge.jsx         # Severity, Status, and Environment badge indicators
│       │   │   ├── Breadcrumbs.jsx   # Context-aware path navigation
│       │   │   ├── Button.jsx        # Standardized button with loading state & variants
│       │   │   ├── Card.jsx          # Dark glass card container with header/body/footer
│       │   │   ├── EmptyState.jsx    # Standardized zero-data call-to-action placeholder
│       │   │   ├── LoadingSkeleton.jsx # Pulse skeleton loaders for tables and cards
│       │   │   └── Modal.jsx         # Accessible dialog with overlay and ESC key listener
│       │   │
│       │   └── layout/
│       │       ├── AppLayout.jsx     # Master application shell with authentication gate
│       │       ├── Sidebar.jsx       # Grouped navigation bar with real-time status pill
│       │       └── TopNavbar.jsx     # Global search, alert dropdown, user profile menu
│       │
│       └── pages/
│           ├── auth/
│           │   ├── LoginPage.jsx     # Login form with 1-click demo credential fillers
│           │   └── RegisterPage.jsx  # Multi-tenant registration form
│           ├── dashboard/
│           │   └── DashboardPage.jsx # Core KPI overview with Recharts charts
│           ├── accounts/
│           │   ├── AccountsPage.jsx  # Account directory and provisioning modal
│           │   └── AccountDetailPage.jsx # Account overview, linked assets, and findings
│           ├── resources/
│           │   ├── ResourcesPage.jsx # Paginated resource inventory with multi-filters
│           │   ├── ResourceDetailPage.jsx # Configuration inspector & historical snapshots
│           │   └── ImportConfigPage.jsx # JSON configuration editor, validator, and preview
│           ├── scans/
│           │   ├── ScansPage.jsx     # Scan execution launcher and historical table
│           │   └── ScanDetailPage.jsx # Per-scan KPIs, findings, compliance, and drift diff
│           ├── findings/
│           │   ├── FindingsPage.jsx  # Centralized findings triage center
│           │   └── FindingDetailPage.jsx # Evidence viewer, remediation steps, verify scan
│           ├── compliance/
│           │   ├── CompliancePage.jsx # NIST CSF 2.0 framework compliance overview
│           │   └── ControlDetailPage.jsx # Control evidence requirements & mapped findings
│           ├── drift/
│           │   └── DriftHistoryPage.jsx # Field-by-field configuration diff across snapshots
│           ├── reports/
│           │   └── ReportsPage.jsx   # PDF executive report generator & CSV exporter
│           ├── rules/
│           │   └── RulesPage.jsx     # Administrative rule governance & status toggle
│           ├── notifications/
│           │   └── NotificationsPage.jsx # Alert center for critical security triggers
│           ├── audit/
│           │   └── AuditLogsPage.jsx # Append-only administrative governance trail
│           ├── settings/
│           │   └── SettingsPage.jsx  # Organization parameters and profile settings
│           └── NotFoundPage.jsx      # 404 error page
│
└── server/                           # Node.js + Express Backend
    ├── package.json                  # Backend dependencies (Express, Mongoose, JWT, PDFKit)
    │
    ├── src/
    │   ├── app.js                    # Express app configuration with Helmet, CORS, and rate limits
    │   ├── server.js                 # HTTP listener bootstrap with auto-seed & graceful shutdown
    │   │
    │   ├── config/
    │   │   ├── env.js                # Environment variable normalization & defaults
    │   │   └── database.js           # Dual Mongoose connector (Atlas + embedded fallback)
    │   │
    │   ├── middleware/
    │   │   ├── auth.js               # JWT verification & role authorization (Admin/Analyst)
    │   │   ├── errorHandler.js       # Centralized error handler (Zod, Mongoose, Duplicate keys)
    │   │   └── rateLimiter.js        # IP rate limiting for auth, import, and general routes
    │   │
    │   ├── models/                   # 14 Mongoose Schema Definitions
    │   │   ├── AuditLog.js           # Append-only audit events
    │   │   ├── CloudAccount.js       # Monitored account representation
    │   │   ├── CloudResource.js      # Inventoried asset configurations
    │   │   ├── ComplianceControl.js  # NIST CSF 2.0 control definitions
    │   │   ├── ComplianceResult.js   # Per-scan control evaluation records
    │   │   ├── ConfigurationSnapshot.js # Normalized resource snapshots for drift
    │   │   ├── DriftEvent.js         # Security regressions and improvements
    │   │   ├── Finding.js            # Security violations with stable fingerprints
    │   │   ├── Notification.js       # In-app security alerts
    │   │   ├── Organization.js       # Tenant isolation boundary
    │   │   ├── Report.js             # Generated PDF/CSV artifacts
    │   │   ├── Scan.js               # Assessment execution lifecycle
    │   │   ├── SecurityRule.js       # Configurable rule registry
    │   │   └── User.js               # User accounts with bcrypt hashing
    │   │
    │   ├── services/
    │   │   ├── assessment/
    │   │   │   ├── fingerprint.js    # SHA-256 stable fingerprint generation
    │   │   │   ├── scoringService.js # Posture deduction and explainable risk calculations
    │   │   │   ├── driftService.js   # Snapshot hashing and delta comparison
    │   │   │   ├── scanService.js    # Master scan lifecycle orchestrator
    │   │   │   └── rules/            # Deterministic Rule Implementations
    │   │   │       ├── CG001.js      # Public storage bucket access
    │   │   │       ├── CG002.js      # Public database exposure
    │   │   │       ├── CG003.js      # Storage encryption disabled
    │   │   │       ├── CG004.js      # Missing MFA on privileged identities
    │   │   │       ├── CG005.js      # Overly permissive wildcard IAM policies
    │   │   │       ├── CG006.js      # Security audit logging disabled
    │   │   │       ├── CG007.js      # Insecure transport (missing TLS/HTTPS)
    │   │   │       ├── CG008.js      # Missing mandatory governance tags
    │   │   │       ├── CG009.js      # Public administrative network ports (SSH/RDP)
    │   │   │       ├── CG010.js      # Database backup protection disabled
    │   │   │       └── index.js      # Rule registry and lookup map
    │   │   │
    │   │   ├── compliance/
    │   │   │   ├── nistCsf.js        # NIST CSF 2.0 framework and control definitions
    │   │   │   └── complianceService.js # Automated control evaluation & scoring
    │   │   │
    │   │   └── reports/
    │   │       ├── pdfReportService.js # PDFKit vector executive report generation
    │   │       └── csvReportService.js # Formula-injection safe CSV serialization
    │   │
    │   ├── controllers/              # REST Controller Implementations
    │   │   ├── authController.js     # Register, login, logout, me, forgot password
    │   │   ├── dashboardController.js # Aggregated metrics, charts, risk rankings
    │   │   ├── cloudAccountController.js # Account CRUD
    │   │   ├── resourceController.js # Inventory query, JSON import, history
    │   │   ├── scanController.js     # Scan execution, results, diff
    │   │   ├── findingController.js  # Triage, status changes, risk acceptance, verify
    │   │   ├── complianceController.js # NIST CSF scores and controls
    │   │   ├── ruleController.js     # Rule status toggle & severity overrides
    │   │   ├── reportController.js   # Report generation and download streams
    │   │   ├── notificationController.js # Notification polling & read state
    │   │   └── auditLogController.js # Audit trail queries & org settings
    │   │
    │   ├── routes/                   # Express Routers (/api/v1/*)
    │   │   ├── authRoutes.js
    │   │   ├── dashboardRoutes.js
    │   │   ├── cloudAccountRoutes.js
    │   │   ├── resourceRoutes.js
    │   │   ├── scanRoutes.js
    │   │   ├── findingRoutes.js
    │   │   ├── complianceRoutes.js
    │   │   ├── ruleRoutes.js
    │   │   ├── reportRoutes.js
    │   │   ├── notificationRoutes.js
    │   │   ├── auditLogRoutes.js
    │   │   ├── settingsRoutes.js
    │   │   └── index.js              # Aggregated master v1 router
    │   │
    │   ├── jobs/
    │   │   └── scheduler.js          # Periodic scan runner via node-cron
    │   │
    │   └── seed/
    │       └── seed.js               # Idempotent database initialization script
    │
    └── tests/                        # Vitest automated test suites
        ├── rules.test.js             # Unit tests for all 10 rules and edge cases
        ├── scoring.test.js           # Tests for posture deduction and risk weights
        └── api.test.js               # Supertest API integration tests
```

---

## 2. Core Source Code Architecture

### 2.1 Master Scan Orchestration Service (`server/src/services/assessment/scanService.js`)
This is the central assessment orchestrator. It manages the complete scan lifecycle: loads authorized resources, evaluates active rules, computes stable fingerprints, tracks findings, executes compliance mapping, records configuration drift, and emits audit records.

```javascript
import { Scan } from '../../models/Scan.js';
import { CloudAccount } from '../../models/CloudAccount.js';
import { CloudResource } from '../../models/CloudResource.js';
import { Finding } from '../../models/Finding.js';
import { SecurityRule } from '../../models/SecurityRule.js';
import { Notification } from '../../models/Notification.js';
import { AuditLog } from '../../models/AuditLog.js';
import { allRules } from './rules/index.js';
import { generateFindingFingerprint } from './fingerprint.js';
import { calculatePostureScore, calculateExplainableRisk } from './scoringService.js';
import { evaluateComplianceForScan } from '../compliance/complianceService.js';
import { detectDriftAndCaptureSnapshot } from './driftService.js';

export async function runSecurityScan({ accountId, organizationId, initiatedBy = null, scanType = 'manual' }) {
  const startTime = Date.now();

  const account = await CloudAccount.findOne({ _id: accountId, organization: organizationId });
  if (!account) throw new Error('Cloud account not found or access unauthorized.');

  const scan = await Scan.create({
    organization: organizationId,
    account: accountId,
    status: 'running',
    scanType,
    initiatedBy: initiatedBy || undefined,
    startedAt: new Date(),
  });

  try {
    const resources = await CloudResource.find({ organization: organizationId, account: accountId });
    const dbRules = await SecurityRule.find({ status: 'enabled' });
    const enabledRuleMap = new Map();
    allRules.forEach((r) => enabledRuleMap.set(r.ruleId, r));
    dbRules.forEach((dbR) => {
      if (enabledRuleMap.has(dbR.ruleId)) {
        enabledRuleMap.set(dbR.ruleId, { ...enabledRuleMap.get(dbR.ruleId), ...dbR.toObject() });
      }
    });

    const activeRules = Array.from(enabledRuleMap.values()).filter((r) => r.status !== 'disabled');

    const existingActiveFindings = await Finding.find({
      organization: organizationId,
      account: accountId,
      status: { $in: ['open', 'in_progress', 'accepted_risk'] },
    });
    const existingFindingsByFingerprint = new Map(existingActiveFindings.map((f) => [f.fingerprint, f]));

    const evaluatedFingerprintsThisScan = new Set();
    const failingFingerprintsThisScan = new Set();
    let newFindingsCount = 0;
    let resolvedFindingsCount = 0;
    let rulesEvaluatedCount = 0;

    const newFindingRuleIdsByResource = {};
    const resolvedFindingRuleIdsByResource = {};

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
            existing.lastSeenScanId = scan._id;
            existing.lastDetectedAt = new Date();
            existing.evidence = evalResult.evidence;
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
            const historicalResolved = await Finding.findOne({ organization: organizationId, fingerprint, status: 'resolved' });
            if (historicalResolved) {
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
                statusHistory: [{ fromStatus: 'none', toStatus: 'open', timestamp: new Date(), reason: 'Initial detection.' }],
              });
              newFindingsCount++;
              if (!newFindingRuleIdsByResource[res.resourceId]) newFindingRuleIdsByResource[res.resourceId] = [];
              newFindingRuleIdsByResource[res.resourceId].push(rule.ruleId);
            }
          }
        }
      }
      res.lastAssessedAt = new Date();
      await res.save();
    }

    // Identify resolved findings (no longer reproducible)
    for (const existing of existingActiveFindings) {
      if (evaluatedFingerprintsThisScan.has(existing.fingerprint) && !failingFingerprintsThisScan.has(existing.fingerprint)) {
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
        if (!resolvedFindingRuleIdsByResource[existing.resourceId]) resolvedFindingRuleIdsByResource[existing.resourceId] = [];
        resolvedFindingRuleIdsByResource[existing.resourceId].push(existing.ruleId);
      }
    }

    const currentActiveFindings = await Finding.find({
      organization: organizationId,
      account: accountId,
      status: { $in: ['open', 'in_progress', 'accepted_risk'] },
    });

    const severityCounts = { critical: 0, high: 0, medium: 0, low: 0 };
    currentActiveFindings.forEach((f) => { if (severityCounts[f.severity] !== undefined) severityCounts[f.severity]++; });

    const postureScore = calculatePostureScore(currentActiveFindings);
    const complianceData = await evaluateComplianceForScan(scan, resources, currentActiveFindings);

    const { snapshot } = await detectDriftAndCaptureSnapshot({
      organizationId,
      accountId,
      scanId: scan._id,
      resources,
      newFindingRuleIdsByResource,
      resolvedFindingRuleIdsByResource,
    });

    const durationMs = Date.now() - startTime;
    scan.status = 'completed';
    scan.completedAt = new Date();
    scan.durationMs = durationMs;
    scan.resourcesEvaluatedCount = resources.length;
    scan.rulesEvaluatedCount = rulesEvaluatedCount;
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

    account.lastScanAt = new Date();
    account.lastScanStatus = 'completed';
    account.postureScore = postureScore;
    account.totalResources = resources.length;
    account.totalFindings = currentActiveFindings.length;
    await account.save();

    return scan;
  } catch (err) {
    scan.status = 'failed';
    scan.completedAt = new Date();
    scan.durationMs = Date.now() - startTime;
    scan.errorMessage = err.message;
    await scan.save();
    throw err;
  }
}
```

---

### 2.2 Deterministic Posture & Risk Scoring Service (`server/src/services/assessment/scoringService.js`)

```javascript
/**
 * Posture Formula:
 * - Baseline: 100 points
 * - Active Deductions: Critical: -20, High: -10, Medium: -4, Low: -1
 * - Formally Accepted Risk: 50% discount on penalty
 * - Resolved & False Positive: 0 penalty
 */
export function calculatePostureScore(findings = []) {
  const activeFindings = findings.filter(
    (f) => f.status === 'open' || f.status === 'in_progress' || f.status === 'accepted_risk'
  );

  let totalPenalty = 0;
  for (const finding of activeFindings) {
    let penalty = 0;
    switch (finding.severity) {
      case 'critical': penalty = 20; break;
      case 'high': penalty = 10; break;
      case 'medium': penalty = 4; break;
      case 'low': penalty = 1; break;
      default: penalty = 0;
    }
    if (finding.status === 'accepted_risk') penalty = penalty * 0.5;
    totalPenalty += penalty;
  }
  return Math.max(0, Math.round(100 - totalPenalty));
}

/**
 * Transparent 4-factor risk prioritizer (0 - 100)
 */
export function calculateExplainableRisk(finding, resource) {
  const factors = [];
  let score = 0;

  // 1. Severity Factor (max 40)
  let severityScore = 5;
  if (finding.severity === 'critical') severityScore = 40;
  else if (finding.severity === 'high') severityScore = 30;
  else if (finding.severity === 'medium') severityScore = 15;
  score += severityScore;
  factors.push({ name: 'Base Severity', weight: severityScore, description: `${finding.severity.toUpperCase()} finding weight` });

  // 2. Resource Criticality (max 30)
  const criticality = (resource?.criticality || 'medium').toLowerCase();
  let critScore = 10;
  if (criticality === 'critical') critScore = 30;
  else if (criticality === 'high') critScore = 20;
  else if (criticality === 'low') critScore = 5;
  score += critScore;
  factors.push({ name: 'Asset Criticality', weight: critScore, description: `${criticality.toUpperCase()} tier asset impact` });

  // 3. Public Exposure (max 20)
  const isPublic =
    resource?.configuration?.publicAccess === true ||
    resource?.configuration?.publicIp === true ||
    (Array.isArray(resource?.configuration?.inboundRules) &&
      resource.configuration.inboundRules.some((r) => r.source === '0.0.0.0/0' || r.cidr === '0.0.0.0/0'));
  if (isPublic) {
    score += 20;
    factors.push({ name: 'Public Exposure', weight: 20, description: 'Direct internet ingress / accessibility detected' });
  }

  // 4. Environment Context (max 10)
  const env = (resource?.environment || 'development').toLowerCase();
  let envScore = 0;
  if (env === 'production') envScore = 10;
  else if (env === 'staging') envScore = 5;
  score += envScore;
  factors.push({ name: 'Environment Tier', weight: envScore, description: `${env.toUpperCase()} environment blast radius` });

  return { riskScore: Math.min(100, score), factors };
}
```

---

### 2.3 Live Remediation Verification (`server/src/controllers/findingController.js`)
When an analyst remediates a misconfiguration in their cloud asset, they execute a verification scan. CloudGuard dynamically re-runs the specific rule's evaluation algorithm over the live configuration and updates the finding to `resolved` upon evidence verification:

```javascript
export async function verifyFindingRemediation(req, res, next) {
  try {
    const finding = await Finding.findOne({ _id: req.params.id, organization: req.organizationId }).populate('resource');
    if (!finding) return res.status(404).json({ success: false, error: { message: 'Finding not found.' } });

    const resource = await CloudResource.findById(finding.resource);
    if (!resource) return res.status(404).json({ success: false, error: { message: 'Associated resource not found.' } });

    const rule = getRuleById(finding.ruleId);
    if (!rule) return res.status(400).json({ success: false, error: { message: `Rule '${finding.ruleId}' not resolved.` } });

    // Deterministic re-evaluation
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
```

---

## 3. Database Structure & Mongoose Models

The platform defines **14 Mongoose models** with indexes, relationships, and schema validations:

### 3.1 Model Schema Overview

| Model | Collection | Primary Keys & Indexes | Key Attributes & Types |
|---|---|---|---|
| **`User`** | `users` | `_id`, `email` (unique, lowercase) | `name` (String), `passwordHash` (String), `role` (`admin`\|`analyst`), `organization` (Ref: Organization), `isActive` (Boolean) |
| **`Organization`** | `organizations` | `_id`, `slug` (unique) | `name` (String), `settings` (Object: `alertThreshold`, `defaultFramework`, `retentionDays`) |
| **`CloudAccount`** | `cloudaccounts` | `[organization, accountId]` (unique) | `name` (String), `accountId` (String), `provider` (Enum), `environment` (Enum), `region` (String), `postureScore` (Number), `totalResources` (Number), `totalFindings` (Number) |
| **`CloudResource`** | `cloudresources` | `[organization, account, resourceId]` (unique) | `resourceId` (String), `type` (Enum: `storage_bucket`, `database`, `iam_user`, etc.), `name` (String), `criticality` (Enum), `configuration` (Mixed), `tags` (Map/Object) |
| **`SecurityRule`** | `securityrules` | `ruleId` (unique) | `name` (String), `category` (Enum), `severity` (Enum), `version` (String), `supportedResourceTypes` (Array), `remediationInstructions` (Object), `complianceMappings` (Array), `status` (`enabled`\|`disabled`) |
| **`Scan`** | `scans` | `_id`, `[organization, createdAt]` | `account` (Ref: CloudAccount), `status` (`queued`\|`running`\|`completed`\|`failed`), `postureScore` (Number), `complianceScore` (Number), `findingsSummary` (Object), `durationMs` (Number) |
| **`Finding`** | `findings` | `[organization, fingerprint, status]` | `account` (Ref), `resource` (Ref), `resourceId` (String), `ruleId` (String), `fingerprint` (String SHA-256), `severity` (Enum), `status` (`open`\|`in_progress`\|`resolved`\|`accepted_risk`\|`false_positive`), `riskScore` (Number), `evidence` (Object), `riskAcceptance` (Object: `justification`, `expiresAt`), `statusHistory` (Array) |
| **`ComplianceControl`** | `compliancecontrols` | `controlId` (unique) | `framework` (String), `category` (Enum), `title` (String), `applicableResourceTypes` (Array), `mappedRuleIds` (Array), `nistFunction` (`GOVERN`\|`IDENTIFY`\|`PROTECT`\|`DETECT`\|`RECOVER`) |
| **`ComplianceResult`** | `complianceresults` | `[scan, controlId]` (unique) | `organization` (Ref), `scan` (Ref), `controlId` (String), `status` (`pass`\|`fail`\|`not_applicable`), `applicableResourcesCount` (Number), `failingResourcesCount` (Number), `evidence` (Array) |
| **`ConfigurationSnapshot`** | `configurationsnapshots`| `_id`, `[organization, account, capturedAt]` | `account` (Ref), `scan` (Ref), `resourcesCount` (Number), `resourceData` (Array of Mixed: serialized resource properties & SHA-256 hashes) |
| **`DriftEvent`** | `driftevents` | `_id`, `[organization, detectedAt]` | `resourceId` (String), `driftType` (`security_regression`\|`security_improvement`\|`configuration_change`), `changedFields` (Array: `fieldPath`, `previousValue`, `currentValue`, `isSecurityRelevant`) |
| **`Report`** | `reports` | `_id`, `[organization, createdAt]` | `title` (String), `reportType` (`executive_summary_pdf`\|`detailed_findings_csv`\|`resource_inventory_csv`), `format` (`pdf`\|`csv`), `fileName` (String), `fileSize` (Number), `fileData` (Buffer) |
| **`Notification`** | `notifications` | `_id`, `[organization, isRead]` | `type` (`scan_completed`\|`critical_finding`\|`system`), `title` (String), `message` (String), `severity` (Enum), `isRead` (Boolean) |
| **`AuditLog`** | `auditlogs` | `[organization, createdAt]` (append-only)| `actor` (Ref: User), `actorEmail` (String), `action` (Enum: `AUTH_LOGIN`, `SCAN_COMPLETED`, `FINDING_STATUS_CHANGED`, etc.), `targetType` (Enum), `details` (Mixed), `ipAddress` (String) |

---

## 4. API Details & REST Specification

All API endpoints are prefixed with `/api/v1` and protected with JWT Bearer / HttpOnly session authentication.

### 4.1 Authentication Endpoints (`server/src/routes/authRoutes.js`)

#### `POST /api/v1/auth/login`
- **Controller**: `authController.js -> login`
- **Request Body**:
```json
{
  "email": "admin@cloudguard.io",
  "password": "CloudGuard@2026Admin!"
}
```
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "67b8401...",
      "name": "Alex Mercer (SecOps Lead)",
      "email": "admin@cloudguard.io",
      "role": "admin",
      "organization": "67b8400..."
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 4.2 Dashboard Endpoints (`server/src/routes/dashboardRoutes.js`)

#### `GET /api/v1/dashboard/summary`
- **Controller**: `dashboardController.js -> getDashboardSummary`
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "summaryCards": {
      "totalAccounts": 3,
      "totalResources": 12,
      "totalActiveFindings": 7,
      "criticalFindings": 2,
      "highFindings": 4,
      "postureScore": 48,
      "complianceScore": 70,
      "lastSuccessfulScan": {
        "scanId": "67b841...",
        "accountName": "AWS Production Workloads",
        "completedAt": "2026-10-21T07:15:00.000Z"
      }
    },
    "charts": {
      "findingsBySeverity": [
        { "severity": "critical", "count": 2 },
        { "severity": "high", "count": 4 },
        { "severity": "medium", "count": 1 }
      ],
      "complianceDistribution": [
        { "status": "pass", "count": 7 },
        { "status": "fail", "count": 3 }
      ],
      "remediationProgress": {
        "open": 6,
        "in_progress": 1,
        "resolved": 4,
        "accepted_risk": 1,
        "false_positive": 0
      }
    },
    "topFailingRules": [
      { "ruleId": "CG-001", "ruleName": "Public storage bucket access", "severity": "critical", "count": 1 }
    ],
    "highestRiskResources": [
      { "resourceId": "s3-customer-documents-public", "resourceName": "prod-customer-docs", "totalRiskScore": 95, "findingsCount": 2 }
    ]
  }
}
```

---

### 4.3 Scans & Drift Endpoints (`server/src/routes/scanRoutes.js`)

#### `POST /api/v1/scans`
- **Controller**: `scanController.js -> createScan`
- **Request Body**:
```json
{
  "accountId": "67b840c...",
  "scanType": "manual"
}
```
- **Success Response (201 Created)**:
```json
{
  "success": true,
  "message": "Security assessment completed successfully.",
  "data": {
    "_id": "67b841a...",
    "account": "67b840c...",
    "status": "completed",
    "postureScore": 65,
    "complianceScore": 80,
    "durationMs": 420,
    "findingsSummary": {
      "critical": 1,
      "high": 2,
      "medium": 1,
      "totalActive": 4,
      "newFindings": 0,
      "resolvedFindings": 1
    }
  }
}
```

#### `GET /api/v1/scans/:id/diff`
- **Controller**: `scanController.js -> getScanDiff`
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "postureDelta": 15,
    "complianceDelta": 10,
    "driftEvents": [
      {
        "resourceId": "s3-customer-documents-public",
        "resourceName": "prod-customer-documents-public",
        "driftType": "security_improvement",
        "description": "Security remediation confirmed: publicAccess changed to false.",
        "changedFields": [
          {
            "fieldPath": "configuration.publicAccess",
            "previousValue": true,
            "currentValue": false,
            "isSecurityRelevant": true
          }
        ]
      }
    ]
  }
}
```

---

### 4.4 Findings & Remediation Endpoints (`server/src/routes/findingRoutes.js`)

#### `POST /api/v1/findings/:id/verify`
- **Controller**: `findingController.js -> verifyFindingRemediation`
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "verified": true,
  "message": "Verification passed! Finding has been marked as Resolved by evidence.",
  "data": {
    "_id": "67b840...",
    "ruleId": "CG-001",
    "status": "resolved",
    "resolvedAt": "2026-10-21T07:20:00.000Z"
  }
}
```

#### `POST /api/v1/findings/:id/accept-risk`
- **Controller**: `findingController.js -> acceptFindingRisk`
- **Request Body**:
```json
{
  "justification": "Asset is protected by corporate VPN perimeter firewall rules.",
  "expiresAt": "2026-11-20T00:00:00.000Z"
}
```

---

### 4.5 Configuration Import Endpoints (`server/src/routes/resourceRoutes.js`)

#### `POST /api/v1/resources/import`
- **Controller**: `resourceController.js -> importResources`
- **Request Body**:
```json
{
  "accountId": "67b840c...",
  "provider": "simulated",
  "previewOnly": false,
  "resources": [
    {
      "resourceId": "s3-vault-01",
      "type": "storage_bucket",
      "name": "finance-vault",
      "environment": "production",
      "criticality": "critical",
      "configuration": {
        "publicAccess": false,
        "encryptionEnabled": true,
        "tlsRequired": true
      },
      "tags": { "owner": "secops", "environment": "production", "dataClassification": "confidential" }
    }
  ]
}
```

---

### 4.6 Reports Endpoints (`server/src/routes/reportRoutes.js`)

#### `POST /api/v1/reports`
- **Controller**: `reportController.js -> createReport`
- **Request Body**:
```json
{
  "accountId": "67b840c...",
  "reportType": "executive_summary_pdf"
}
```
- **Success Response (201 Created)**: Returns report metadata (`fileName`, `fileSize`, `reportType`).

#### `GET /api/v1/reports/:id/download`
- **Controller**: `reportController.js -> downloadReport`
- **Response**: Binary stream of PDF or CSV with `Content-Disposition: attachment; filename="CloudGuard_Executive_Report_AWS_Production.pdf"`.
