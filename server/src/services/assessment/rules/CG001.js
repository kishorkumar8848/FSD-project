export const CG001 = {
  ruleId: 'CG-001',
  name: 'Public storage bucket access detected',
  description: 'Detects cloud object storage buckets configured with public access, exposing confidential data to the internet.',
  category: 'Storage Security',
  supportedResourceTypes: ['storage_bucket'],
  severity: 'critical',
  version: '1.0.0',
  expectedSecureConfig: 'publicAccess: false, blockPublicAcls: true, blockPublicPolicy: true',
  detectionRationale: 'Publicly readable or writable object storage is a primary cause of accidental mass data breaches in cloud environments.',
  evidenceFields: ['publicAccess', 'acl', 'policy'],
  remediationInstructions: {
    summary: 'Disable public read/write access and enable bucket public access block settings.',
    whyItMatters: 'Unauthenticated internet users can download sensitive files, customer PII, or upload malware if public access remains open.',
    recommendedSecureState: 'Set publicAccess to false and ensure bucket policies require authenticated access.',
    stepByStep: [
      'Navigate to the cloud storage bucket configuration.',
      'Under Permissions, enable Block all public access.',
      'Review bucket access control lists (ACLs) to revoke public read/write grants.',
      'Verify that bucket policy does not contain Principal: "*" with Allow effects.',
    ],
    operationalImpact: 'Public websites hosting assets on this bucket may fail unless an authenticated CDN or signed URLs are configured.',
    verificationProcedure: 'Run CloudGuard Scan to confirm publicAccess reports false and no open ACL grants remain.',
  },
  complianceMappings: [
    { framework: 'NIST CSF 2.0', controlId: 'PR.DS-01', controlTitle: 'Data-at-rest is protected' },
    { framework: 'NIST CSF 2.0', controlId: 'PR.AC-03', controlTitle: 'Access permissions and authorizations are managed' },
  ],
  evaluate(resource) {
    if (!this.supportedResourceTypes.includes(resource.type)) {
      return { passed: true, status: 'not_applicable' };
    }
    const config = resource.configuration || {};
    if (config.publicAccess === undefined) {
      return {
        passed: false,
        status: 'fail',
        evidence: {
          evaluatedFields: { publicAccess: 'missing' },
          actualValue: 'Undefined/Missing configuration',
          expectedValue: 'publicAccess: false',
          message: 'Public access setting is missing or ambiguous. Secure default requires explicit publicAccess: false.',
        },
        riskScore: 90,
      };
    }
    if (config.publicAccess === true || config.acl === 'public-read' || config.acl === 'public-read-write') {
      return {
        passed: false,
        status: 'fail',
        evidence: {
          evaluatedFields: { publicAccess: config.publicAccess, acl: config.acl },
          actualValue: `publicAccess: ${config.publicAccess}, acl: ${config.acl || 'unspecified'}`,
          expectedValue: 'publicAccess: false',
          message: 'Storage bucket configuration allows unauthenticated public internet access.',
        },
        riskScore: 95,
      };
    }
    return { passed: true, status: 'pass' };
  },
};
