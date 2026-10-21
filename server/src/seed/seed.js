import bcrypt from 'bcryptjs';
import { Organization } from '../models/Organization.js';
import { User } from '../models/User.js';
import { CloudAccount } from '../models/CloudAccount.js';
import { CloudResource } from '../models/CloudResource.js';
import { SecurityRule } from '../models/SecurityRule.js';
import { ComplianceControl } from '../models/ComplianceControl.js';
import { Notification } from '../models/Notification.js';
import { AuditLog } from '../models/AuditLog.js';
import { allRules } from '../services/assessment/rules/index.js';
import { nistCsfFramework } from '../services/compliance/nistCsf.js';
import { runSecurityScan } from '../services/assessment/scanService.js';
import { config } from '../config/env.js';
import { connectDB, disconnectDB } from '../config/database.js';

export async function seedDatabase() {
  console.log('[Seed] Starting CloudGuard demonstration environment seeding...');

  // 1. Create or ensure Demo Organization
  let org = await Organization.findOne({ slug: 'cloudguard-demo' });
  if (!org) {
    org = await Organization.create({
      name: 'CloudGuard Enterprise Demo',
      slug: 'cloudguard-demo',
      settings: {
        alertThreshold: 'medium',
        defaultFramework: 'NIST CSF 2.0',
        retentionDays: 90,
      },
    });
    console.log(`[Seed] Created Organization: ${org.name}`);
  }

  // 2. Create or ensure Administrator & Security Analyst accounts
  const adminSalt = await bcrypt.genSalt(10);
  const adminHash = await bcrypt.hash(config.seedAdminPassword, adminSalt);
  let admin = await User.findOne({ email: config.seedAdminEmail.toLowerCase() });
  if (!admin) {
    admin = await User.create({
      name: 'Alex Mercer (SecOps Lead)',
      email: config.seedAdminEmail.toLowerCase(),
      passwordHash: adminHash,
      role: 'admin',
      organization: org._id,
      isActive: true,
      lastLogin: new Date(),
    });
    console.log(`[Seed] Created Admin User: ${admin.email}`);
  }

  const analystSalt = await bcrypt.genSalt(10);
  const analystHash = await bcrypt.hash(config.seedAnalystPassword, analystSalt);
  let analyst = await User.findOne({ email: config.seedAnalystEmail.toLowerCase() });
  if (!analyst) {
    analyst = await User.create({
      name: 'Jordan Rivera (Security Analyst)',
      email: config.seedAnalystEmail.toLowerCase(),
      passwordHash: analystHash,
      role: 'analyst',
      organization: org._id,
      isActive: true,
      lastLogin: new Date(),
    });
    console.log(`[Seed] Created Analyst User: ${analyst.email}`);
  }

  // 3. Seed Security Rules in Database
  for (const rule of allRules) {
    const existingRule = await SecurityRule.findOne({ ruleId: rule.ruleId });
    if (!existingRule) {
      await SecurityRule.create({
        ruleId: rule.ruleId,
        name: rule.name,
        description: rule.description,
        category: rule.category,
        supportedResourceTypes: rule.supportedResourceTypes,
        severity: rule.severity,
        version: rule.version,
        expectedSecureConfig: rule.expectedSecureConfig,
        detectionRationale: rule.detectionRationale,
        evidenceFields: rule.evidenceFields,
        remediationInstructions: rule.remediationInstructions,
        complianceMappings: rule.complianceMappings,
        status: 'enabled',
      });
    }
  }
  console.log(`[Seed] Seeded ${allRules.length} security rules.`);

  // 4. Seed NIST CSF 2.0 Controls
  for (const ctrl of nistCsfFramework.controls) {
    const existingCtrl = await ComplianceControl.findOne({ controlId: ctrl.controlId });
    if (!existingCtrl) {
      await ComplianceControl.create({
        framework: nistCsfFramework.name,
        frameworkVersion: nistCsfFramework.version,
        category: ctrl.category,
        controlId: ctrl.controlId,
        title: ctrl.title,
        description: ctrl.description,
        applicableResourceTypes: ctrl.applicableResourceTypes,
        mappedRuleIds: ctrl.mappedRuleIds,
        assessmentMethod: ctrl.assessmentMethod,
        evidenceRequirements: ctrl.evidenceRequirements,
        nistFunction: ctrl.nistFunction,
      });
    }
  }
  console.log(`[Seed] Seeded ${nistCsfFramework.controls.length} compliance controls.`);

  // 5. Seed Cloud Accounts
  const demoAccounts = [
    {
      name: 'AWS Production Workloads',
      accountId: 'acc-sim-aws-prod-01',
      provider: 'simulated',
      environment: 'production',
      region: 'us-east-1',
      description: 'Primary customer-facing e-commerce API cluster, RDS cluster, and document vaults.',
      connectionMode: 'simulated_local',
      status: 'active',
    },
    {
      name: 'Azure Hybrid Staging Tier',
      accountId: 'acc-sim-azure-stage-02',
      provider: 'simulated',
      environment: 'staging',
      region: 'centralus',
      description: 'Pre-release deployment cluster for staging validation and load testing.',
      connectionMode: 'simulated_local',
      status: 'active',
    },
    {
      name: 'GCP Internal Analytics Lab',
      accountId: 'acc-sim-gcp-dev-03',
      provider: 'simulated',
      environment: 'development',
      region: 'europe-west1',
      description: 'Data science sandbox and ad-hoc telemetry query instances.',
      connectionMode: 'simulated_local',
      status: 'active',
    },
  ];

  const seededAccountDocs = [];
  for (const acc of demoAccounts) {
    let accDoc = await CloudAccount.findOne({ organization: org._id, accountId: acc.accountId });
    if (!accDoc) {
      accDoc = await CloudAccount.create({ ...acc, organization: org._id });
      console.log(`[Seed] Created Cloud Account: ${accDoc.name}`);
    }
    seededAccountDocs.push(accDoc);
  }

  // 6. Seed Cloud Resources (Secure, Insecure, and Boundary cases) for Primary Prod Account
  const primaryAccount = seededAccountDocs[0];

  const sampleResources = [
    // CG-001 violation: Public storage bucket
    {
      resourceId: 's3-customer-documents-public',
      name: 'prod-customer-documents-public',
      type: 'storage_bucket',
      provider: 'simulated',
      region: 'us-east-1',
      environment: 'production',
      criticality: 'critical',
      configuration: {
        publicAccess: true,
        acl: 'public-read',
        encryptionEnabled: false,
        versioningEnabled: false,
        tlsRequired: false,
      },
      tags: {
        owner: 'platform-team',
        environment: 'production',
        dataClassification: 'restricted',
      },
    },
    // CG-001 Compliant: Secure hardened bucket
    {
      resourceId: 's3-financial-ledgers-secure',
      name: 'prod-financial-ledgers-encrypted',
      type: 'storage_bucket',
      provider: 'simulated',
      region: 'us-east-1',
      environment: 'production',
      criticality: 'critical',
      configuration: {
        publicAccess: false,
        acl: 'private',
        encryptionEnabled: true,
        encryptionType: 'aws:kms',
        versioningEnabled: true,
        tlsRequired: true,
        loggingEnabled: true,
      },
      tags: {
        owner: 'finance-sec',
        environment: 'production',
        dataClassification: 'confidential',
      },
    },
    // CG-002 & CG-010 violation: Public database without backups
    {
      resourceId: 'rds-orders-db-exposed',
      name: 'prod-orders-database-postgres',
      type: 'database',
      provider: 'simulated',
      region: 'us-east-1',
      environment: 'production',
      criticality: 'critical',
      configuration: {
        publicAccess: true,
        encryptionEnabled: false,
        backupEnabled: false,
        backupRetentionDays: 0,
        inboundRules: [
          { protocol: 'tcp', port: 5432, source: '0.0.0.0/0' },
        ],
      },
      tags: {
        owner: 'order-service',
        environment: 'production',
        dataClassification: 'confidential',
      },
    },
    // CG-002 & CG-010 Compliant: Private encrypted DB with 30-day backups
    {
      resourceId: 'rds-auth-tokens-db-secure',
      name: 'prod-identity-auth-db-postgres',
      type: 'database',
      provider: 'simulated',
      region: 'us-east-1',
      environment: 'production',
      criticality: 'critical',
      configuration: {
        publicAccess: false,
        encryptionEnabled: true,
        backupEnabled: true,
        backupRetentionDays: 30,
        inboundRules: [
          { protocol: 'tcp', port: 5432, source: '10.0.4.0/24' },
        ],
      },
      tags: {
        owner: 'iam-ops',
        environment: 'production',
        dataClassification: 'restricted',
      },
    },
    // CG-004 & CG-005 violation: Privileged IAM user without MFA and wildcard policies
    {
      resourceId: 'iam-ci-cd-deployer-unrestricted',
      name: 'cicd-automation-deployer',
      type: 'iam_user',
      provider: 'simulated',
      region: 'us-east-1',
      environment: 'production',
      criticality: 'high',
      configuration: {
        isPrivileged: true,
        mfaEnabled: false,
        accessKeysCount: 2,
        policies: [
          {
            policyName: 'AdministratorFullWildcard',
            actions: ['*'],
            effect: 'Allow',
            resources: ['*'],
          },
        ],
      },
      tags: {
        owner: 'devops-automation',
        environment: 'production',
        dataClassification: 'internal',
      },
    },
    // CG-004 & CG-005 Compliant: Privileged IAM user with MFA and scoped policies
    {
      resourceId: 'iam-security-officer-hardened',
      name: 'alex-mercer-admin',
      type: 'iam_user',
      provider: 'simulated',
      region: 'us-east-1',
      environment: 'production',
      criticality: 'critical',
      configuration: {
        isPrivileged: true,
        mfaEnabled: true,
        accessKeysCount: 1,
        policies: [
          {
            policyName: 'ScopedSecurityAuditor',
            actions: ['securityhub:*', 'guardduty:*', 'cloudtrail:Lookup*'],
            effect: 'Allow',
            resources: ['arn:aws:securityhub:us-east-1:123456789012:*'],
          },
        ],
      },
      tags: {
        owner: 'secops',
        environment: 'production',
        dataClassification: 'confidential',
      },
    },
    // CG-009 violation: Virtual machine with public SSH (port 22) and RDP (port 3389)
    {
      resourceId: 'ec2-bastion-open-management',
      name: 'prod-jumpbox-bastion-exposed',
      type: 'virtual_machine',
      provider: 'simulated',
      region: 'us-east-1',
      environment: 'production',
      criticality: 'high',
      configuration: {
        publicIp: true,
        diskEncrypted: true,
        detailedMonitoring: true,
        inboundRules: [
          { protocol: 'tcp', port: 22, source: '0.0.0.0/0' },
          { protocol: 'tcp', port: 3389, source: '0.0.0.0/0' },
        ],
      },
      tags: {
        owner: 'infra-sre',
        environment: 'production',
        dataClassification: 'internal',
      },
    },
    // CG-009 Compliant: Private application host with restricted ingress
    {
      resourceId: 'ec2-payment-worker-secure',
      name: 'prod-payment-processor-node',
      type: 'virtual_machine',
      provider: 'simulated',
      region: 'us-east-1',
      environment: 'production',
      criticality: 'critical',
      configuration: {
        publicIp: false,
        diskEncrypted: true,
        detailedMonitoring: true,
        inboundRules: [
          { protocol: 'tcp', port: 443, source: '10.0.0.0/16' },
        ],
      },
      tags: {
        owner: 'payments-team',
        environment: 'production',
        dataClassification: 'restricted',
      },
    },
    // CG-006 violation: Audit logging disabled
    {
      resourceId: 'trail-management-disabled',
      name: 'prod-management-audit-trail',
      type: 'audit_log',
      provider: 'simulated',
      region: 'us-east-1',
      environment: 'production',
      criticality: 'critical',
      configuration: {
        auditLoggingEnabled: false,
        multiRegion: false,
        logFileValidation: false,
        retentionDays: 0,
      },
      tags: {
        owner: 'governance',
        environment: 'production',
        dataClassification: 'internal',
      },
    },
    // CG-008 violation: Resource missing required governance tags
    {
      resourceId: 'sg-unlabeled-legacy-ingress',
      name: 'legacy-app-security-group',
      type: 'security_group',
      provider: 'simulated',
      region: 'us-east-1',
      environment: 'production',
      criticality: 'medium',
      configuration: {
        inboundRules: [
          { protocol: 'tcp', port: 8080, source: '10.0.0.0/8' },
        ],
      },
      tags: {
        // Missing owner and dataClassification tags
        legacyTag: 'true',
      },
    },
  ];

  for (const r of sampleResources) {
    const existingRes = await CloudResource.findOne({
      organization: org._id,
      account: primaryAccount._id,
      resourceId: r.resourceId,
    });
    if (!existingRes) {
      await CloudResource.create({
        ...r,
        organization: org._id,
        account: primaryAccount._id,
      });
    }
  }
  console.log(`[Seed] Seeded ${sampleResources.length} cloud resources for ${primaryAccount.name}.`);

  // 7. Seed Resources for Staging and Dev accounts
  const secondaryResources = [
    {
      resourceId: 'stg-storage-reports',
      name: 'staging-reports-bucket',
      type: 'storage_bucket',
      provider: 'simulated',
      region: 'centralus',
      environment: 'staging',
      criticality: 'medium',
      configuration: {
        publicAccess: false,
        encryptionEnabled: true,
        versioningEnabled: true,
        tlsRequired: true,
      },
      tags: { owner: 'qa-team', environment: 'staging', dataClassification: 'internal' },
    },
    {
      resourceId: 'dev-analytics-mongo',
      name: 'dev-experimental-mongodb',
      type: 'database',
      provider: 'simulated',
      region: 'europe-west1',
      environment: 'development',
      criticality: 'low',
      configuration: {
        publicAccess: true,
        encryptionEnabled: false,
        backupEnabled: false,
        backupRetentionDays: 0,
        inboundRules: [{ protocol: 'tcp', port: 27017, source: '0.0.0.0/0' }],
      },
      tags: { owner: 'data-science', environment: 'development', dataClassification: 'public' },
    },
  ];

  for (let i = 0; i < secondaryResources.length; i++) {
    const targetAcc = seededAccountDocs[i + 1];
    const r = secondaryResources[i];
    const existing = await CloudResource.findOne({
      organization: org._id,
      account: targetAcc._id,
      resourceId: r.resourceId,
    });
    if (!existing) {
      await CloudResource.create({ ...r, organization: org._id, account: targetAcc._id });
    }
  }

  // 8. Execute baseline scan to generate authentic deterministic findings, compliance results & snapshots!
  console.log('[Seed] Executing baseline security assessment scan using deterministic rules engine...');
  const initialScan = await runSecurityScan({
    accountId: primaryAccount._id,
    organizationId: org._id,
    initiatedBy: admin._id,
    scanType: 'manual',
  });
  console.log(`[Seed] Baseline scan completed! Posture Score: ${initialScan.postureScore}/100, Active Findings: ${initialScan.findingsSummary.totalActive}`);

  // Also scan staging account
  await runSecurityScan({
    accountId: seededAccountDocs[1]._id,
    organizationId: org._id,
    initiatedBy: admin._id,
    scanType: 'manual',
  });

  // Seed sample initial audit logs
  await AuditLog.create({
    organization: org._id,
    actor: admin._id,
    actorEmail: admin.email,
    actorRole: 'admin',
    action: 'SETTINGS_UPDATED',
    targetType: 'setting',
    details: { message: 'Demo environment provisioned with baseline security configurations.' },
  });

  console.log('[Seed] Demonstration environment successfully seeded and initialized.');
}

// Allow standalone execution via `node src/seed/seed.js`
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  (async () => {
    try {
      await connectDB();
      await seedDatabase();
      await disconnectDB();
      console.log('[Seed] Standalone seed script finished successfully.');
      process.exit(0);
    } catch (err) {
      console.error('[Seed] Standalone seed error:', err);
      process.exit(1);
    }
  })();
}
