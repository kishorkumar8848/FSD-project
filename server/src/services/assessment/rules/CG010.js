export const CG010 = {
  ruleId: 'CG-010',
  name: 'Automated database backups missing or disabled',
  description: 'Detects managed database instances lacking automated backup retention or configured with zero-day retention.',
  category: 'Backup & Recovery',
  supportedResourceTypes: ['database'],
  severity: 'medium',
  version: '1.0.0',
  expectedSecureConfig: 'backupEnabled: true, backupRetentionDays >= 7',
  detectionRationale: 'Databases without automated backups and retention cannot be recovered following ransomware encryption, operational errors, or database corruption.',
  evidenceFields: ['backupEnabled', 'backupRetentionDays'],
  remediationInstructions: {
    summary: 'Enable automated daily backups with a minimum retention window of 7 to 30 days.',
    whyItMatters: 'Ransomware or catastrophic server failure requires rapid point-in-time recovery to restore business continuity without data loss.',
    recommendedSecureState: 'Set backupEnabled: true with backupRetentionDays >= 7.',
    stepByStep: [
      'Open database instance configuration.',
      'Under Backup settings, enable Automated Backups.',
      'Set backup retention period to at least 7 days (or 30 days for production tiers).',
      'Optionally enable cross-region snapshot replication for disaster recovery.',
    ],
    operationalImpact: 'Minor backup storage cost for retaining snapshot delta.',
    verificationProcedure: 'Verify backupEnabled: true and backupRetentionDays >= 7 in CloudGuard Scan.',
  },
  complianceMappings: [
    { framework: 'NIST CSF 2.0', controlId: 'RC.RP-01', controlTitle: 'Recovery plan is executed during or after an event' },
    { framework: 'NIST CSF 2.0', controlId: 'PR.DS-01', controlTitle: 'Data-at-rest is protected' },
  ],
  evaluate(resource) {
    if (!this.supportedResourceTypes.includes(resource.type)) {
      return { passed: true, status: 'not_applicable' };
    }
    const config = resource.configuration || {};
    const backupEnabled = config.backupEnabled === true;
    const retentionDays = parseInt(config.backupRetentionDays, 10) || 0;

    if (!backupEnabled || retentionDays < 7) {
      return {
        passed: false,
        status: 'fail',
        evidence: {
          evaluatedFields: { backupEnabled: config.backupEnabled, backupRetentionDays: config.backupRetentionDays },
          actualValue: `backupEnabled: ${config.backupEnabled}, retentionDays: ${config.backupRetentionDays || 0}`,
          expectedValue: 'backupEnabled: true, backupRetentionDays >= 7',
          message: 'Database backup retention is disabled or set below recommended 7-day retention threshold.',
        },
        riskScore: 50,
      };
    }

    return { passed: true, status: 'pass' };
  },
};
