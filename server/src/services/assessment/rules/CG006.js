export const CG006 = {
  ruleId: 'CG-006',
  name: 'Security audit logging disabled or missing',
  description: 'Detects cloud environments or critical assets operating without active audit trails or access logging.',
  category: 'Logging & Monitoring',
  supportedResourceTypes: ['audit_log', 'storage_bucket', 'database', 'virtual_machine'],
  severity: 'medium',
  version: '1.0.0',
  expectedSecureConfig: 'auditLoggingEnabled: true (or loggingEnabled: true) with log file integrity validation',
  detectionRationale: 'Without centralized audit logging, forensic investigations following an intrusion are impaired, and unauthorized actions remain undetected.',
  evidenceFields: ['auditLoggingEnabled', 'loggingEnabled', 'detailedMonitoring'],
  remediationInstructions: {
    summary: 'Enable audit logging and deliver events to an encrypted, tamper-protected log storage location.',
    whyItMatters: 'Audit trails are essential for incident response, threat hunting, and regulatory compliance evidence.',
    recommendedSecureState: 'Enable multi-region trail logging and storage access logging.',
    stepByStep: [
      'Navigate to the audit service (e.g. AWS CloudTrail or GCP Cloud Audit Logs).',
      'Ensure a trail applies to all regions and logs management and data events.',
      'Configure log file validation and long-term retention (minimum 90-365 days).',
    ],
    operationalImpact: 'Nominal storage charges for retained event logs.',
    verificationProcedure: 'Verify auditLoggingEnabled: true in CloudGuard Scan.',
  },
  complianceMappings: [
    { framework: 'NIST CSF 2.0', controlId: 'DE.AE-01', controlTitle: 'Networks and environments are monitored for anomalies' },
    { framework: 'NIST CSF 2.0', controlId: 'DE.CM-01', controlTitle: 'The network and environment are monitored' },
  ],
  evaluate(resource) {
    if (!this.supportedResourceTypes.includes(resource.type)) {
      return { passed: true, status: 'not_applicable' };
    }
    const config = resource.configuration || {};

    if (resource.type === 'audit_log') {
      if (config.auditLoggingEnabled !== true) {
        return {
          passed: false,
          status: 'fail',
          evidence: {
            evaluatedFields: { auditLoggingEnabled: config.auditLoggingEnabled },
            actualValue: `auditLoggingEnabled: ${config.auditLoggingEnabled}`,
            expectedValue: 'auditLoggingEnabled: true',
            message: 'Centralized audit logging trail is disabled or not configured.',
          },
          riskScore: 60,
        };
      }
    } else {
      // For buckets, dbs, or vms: check if logging / monitoring is enabled
      const hasLogging = config.loggingEnabled === true || config.detailedMonitoring === true;
      if (!hasLogging) {
        return {
          passed: false,
          status: 'fail',
          evidence: {
            evaluatedFields: { loggingEnabled: config.loggingEnabled, detailedMonitoring: config.detailedMonitoring },
            actualValue: `loggingEnabled: ${config.loggingEnabled}, detailedMonitoring: ${config.detailedMonitoring}`,
            expectedValue: 'loggingEnabled: true or detailedMonitoring: true',
            message: 'Resource access logging or monitoring is disabled.',
          },
          riskScore: 45,
        };
      }
    }

    return { passed: true, status: 'pass' };
  },
};
