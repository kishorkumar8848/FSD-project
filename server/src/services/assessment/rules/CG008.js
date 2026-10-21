export const CG008 = {
  ruleId: 'CG-008',
  name: 'Missing mandatory governance metadata tags',
  description: 'Detects cloud resources lacking required organizational governance tags (owner, environment, dataClassification).',
  category: 'Governance & Metadata',
  supportedResourceTypes: [
    'storage_bucket',
    'database',
    'virtual_machine',
    'iam_role',
    'iam_user',
    'security_group',
    'audit_log',
  ],
  severity: 'low',
  version: '1.0.0',
  expectedSecureConfig: 'Tags must include "owner", "environment", and "dataClassification"',
  detectionRationale: 'Untagged resources hinder cost allocation, incident attribution, and identification of asset owners during security breaches.',
  evidenceFields: ['tags'],
  remediationInstructions: {
    summary: 'Apply organizational metadata tags to identify owner, environment tier, and data classification.',
    whyItMatters: 'During security incident containment, response teams must instantly know who owns the asset and what classification of data it processes.',
    recommendedSecureState: 'Ensure all resources have defined owner, environment, and dataClassification tags.',
    stepByStep: [
      'Open the resource management console.',
      'Navigate to the Tags tab.',
      'Add key "owner" with team or email, "environment" (dev/stage/prod), and "dataClassification" (public/internal/confidential/restricted).',
    ],
    operationalImpact: 'Zero runtime impact on resource functionality.',
    verificationProcedure: 'Scan resource to confirm all three mandatory tags are present and populated.',
  },
  complianceMappings: [
    { framework: 'NIST CSF 2.0', controlId: 'ID.AM-01', controlTitle: 'Physical and virtual assets are inventoried' },
    { framework: 'NIST CSF 2.0', controlId: 'GV.OC-01', controlTitle: 'Organizational context is understood' },
  ],
  evaluate(resource) {
    if (!this.supportedResourceTypes.includes(resource.type)) {
      return { passed: true, status: 'not_applicable' };
    }
    const rawTags = resource.tags || {};
    // Handle both Map (Mongoose) and Plain Object
    const tags = rawTags instanceof Map ? Object.fromEntries(rawTags) : rawTags;

    const requiredTags = ['owner', 'environment', 'dataClassification'];
    const missingTags = requiredTags.filter((t) => {
      const val = tags[t];
      return !val || typeof val !== 'string' || val.trim() === '';
    });

    if (missingTags.length > 0) {
      return {
        passed: false,
        status: 'fail',
        evidence: {
          evaluatedFields: { presentTags: Object.keys(tags), missingTags },
          actualValue: `Missing mandatory tags: [${missingTags.join(', ')}]`,
          expectedValue: 'Tags containing owner, environment, and dataClassification',
          message: `Resource is missing mandatory governance tags: ${missingTags.join(', ')}.`,
        },
        riskScore: 25,
      };
    }

    return { passed: true, status: 'pass' };
  },
};
