export const CG005 = {
  ruleId: 'CG-005',
  name: 'Overly permissive IAM permissions detected',
  description: 'Detects IAM policies or role attachments granting unrestricted wildcard access ("*" actions and "*" resources).',
  category: 'Identity & Access Management',
  supportedResourceTypes: ['iam_user', 'iam_role', 'iam_policy'],
  severity: 'high',
  version: '1.0.0',
  expectedSecureConfig: 'Least-privilege policies with explicitly scoped actions and resource ARNs',
  detectionRationale: 'Granting wildcard administrator permissions violates the principle of least privilege and dramatically expands blast radius upon credential compromise.',
  evidenceFields: ['policies', 'actions', 'resources'],
  remediationInstructions: {
    summary: 'Replace full wildcard statements with scoped action lists and resource ARNs.',
    whyItMatters: 'If an IAM key or role is intercepted, wildcard rights allow an attacker to delete infrastructure, create backdoors, or tamper with logging.',
    recommendedSecureState: 'Specify discrete actions (e.g., s3:GetObject instead of *) and target resource ARNs.',
    stepByStep: [
      'Inspect the IAM policy document attached to the identity.',
      'Identify Statements containing Effect: "Allow", Action: "*", Resource: "*".',
      'Refactor policy using IAM Access Advisor to permit only services actually utilized in the last 90 days.',
      'Apply permission boundaries to prevent privilege escalation.',
    ],
    operationalImpact: 'Ensure all required application API calls are enumerated in policy to avoid permission denied errors.',
    verificationProcedure: 'Scan IAM resource to verify no wildcard statement remains active.',
  },
  complianceMappings: [
    { framework: 'NIST CSF 2.0', controlId: 'PR.AC-03', controlTitle: 'Access permissions and authorizations are managed' },
    { framework: 'NIST CSF 2.0', controlId: 'PR.AA-01', controlTitle: 'Identities and credentials are managed' },
  ],
  evaluate(resource) {
    if (!this.supportedResourceTypes.includes(resource.type)) {
      return { passed: true, status: 'not_applicable' };
    }
    const config = resource.configuration || {};
    const policies = Array.isArray(config.policies) ? config.policies : [];

    let violatingPolicy = null;

    // Check direct policy list
    for (const p of policies) {
      const actions = Array.isArray(p.actions) ? p.actions : [p.actions || ''];
      const resources = Array.isArray(p.resources) ? p.resources : [p.resources || ''];
      const effect = (p.effect || 'Allow').toLowerCase();

      if (effect === 'allow') {
        const hasWildcardAction = actions.some((a) => a === '*' || a === 'AdministratorAccess');
        const hasWildcardResource = resources.some((r) => r === '*');
        if (hasWildcardAction && hasWildcardResource) {
          violatingPolicy = p;
          break;
        }
      }
    }

    // Check inline permissions
    if (!violatingPolicy && config.actions && config.resources) {
      const actions = Array.isArray(config.actions) ? config.actions : [config.actions];
      const resources = Array.isArray(config.resources) ? config.resources : [config.resources];
      if (actions.includes('*') && resources.includes('*')) {
        violatingPolicy = { policyName: 'inline', actions, resources };
      }
    }

    if (violatingPolicy) {
      return {
        passed: false,
        status: 'fail',
        evidence: {
          evaluatedFields: { violatingPolicy },
          actualValue: `Policy '${violatingPolicy.policyName || 'unnamed'}' grants Action: * on Resource: *`,
          expectedValue: 'Scoped actions restricted to explicit resource ARNs',
          message: 'Overly permissive IAM policy detected granting unrestricted administrative privileges.',
        },
        riskScore: 88,
      };
    }

    return { passed: true, status: 'pass' };
  },
};
