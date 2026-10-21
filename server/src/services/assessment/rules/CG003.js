export const CG003 = {
  ruleId: 'CG-003',
  name: 'Storage encryption at rest disabled',
  description: 'Detects cloud storage buckets that lack mandatory server-side encryption at rest.',
  category: 'Storage Security',
  supportedResourceTypes: ['storage_bucket'],
  severity: 'high',
  version: '1.0.0',
  expectedSecureConfig: 'encryptionEnabled: true with KMS or AES-256 key',
  detectionRationale: 'Data stored without encryption at rest violates compliance baselines and risks raw disk exposure or unauthorized offline data recovery.',
  evidenceFields: ['encryptionEnabled', 'encryptionType'],
  remediationInstructions: {
    summary: 'Enable default server-side encryption using managed KMS or AES-256 keys.',
    whyItMatters: 'Encryption at rest protects physical media and ensures compliance with GDPR, HIPAA, and NIST guidelines.',
    recommendedSecureState: 'Set encryptionEnabled to true using a customer-managed or cloud-provider-managed key.',
    stepByStep: [
      'Open the storage bucket properties.',
      'Locate the Default encryption section.',
      'Enable Server-side encryption with AWS KMS or AES-256.',
      'Save configuration and apply encryption to existing unencrypted objects if needed.',
    ],
    operationalImpact: 'Negligible performance overhead; KMS API call costs may apply for high-throughput buckets.',
    verificationProcedure: 'Scan storage bucket to verify encryptionEnabled: true.',
  },
  complianceMappings: [
    { framework: 'NIST CSF 2.0', controlId: 'PR.DS-01', controlTitle: 'Data-at-rest is protected' },
  ],
  evaluate(resource) {
    if (!this.supportedResourceTypes.includes(resource.type)) {
      return { passed: true, status: 'not_applicable' };
    }
    const config = resource.configuration || {};
    if (config.encryptionEnabled !== true) {
      return {
        passed: false,
        status: 'fail',
        evidence: {
          evaluatedFields: { encryptionEnabled: config.encryptionEnabled },
          actualValue: `encryptionEnabled: ${config.encryptionEnabled}`,
          expectedValue: 'encryptionEnabled: true',
          message: 'Default server-side encryption is disabled on this storage bucket.',
        },
        riskScore: 75,
      };
    }
    return { passed: true, status: 'pass' };
  },
};
