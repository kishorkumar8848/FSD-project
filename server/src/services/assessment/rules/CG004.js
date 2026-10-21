export const CG004 = {
  ruleId: 'CG-004',
  name: 'Privileged identity missing multi-factor authentication (MFA)',
  description: 'Detects privileged IAM identities or administrative roles that do not enforce multi-factor authentication.',
  category: 'Identity & Access Management',
  supportedResourceTypes: ['iam_user', 'iam_role'],
  severity: 'high',
  version: '1.0.0',
  expectedSecureConfig: 'mfaEnabled: true for all privileged identities and console users',
  detectionRationale: 'Privileged credentials protected solely by single-factor passwords or static API keys are vulnerable to credential theft, phishing, and session hijacking.',
  evidenceFields: ['isPrivileged', 'mfaEnabled'],
  remediationInstructions: {
    summary: 'Enforce MFA activation on privileged IAM accounts.',
    whyItMatters: 'Compromise of a privileged credential without MFA grants an adversary administrative control over the entire cloud environment.',
    recommendedSecureState: 'Enforce virtual or hardware MFA tokens for all privileged users.',
    stepByStep: [
      'Navigate to IAM Security Credentials for the affected user.',
      'Assign an MFA device (TOTP authenticator app or FIDO2 hardware security key).',
      'Attach an IAM policy requiring MFA condition (aws:MultiFactorAuthPresent) for sensitive API actions.',
    ],
    operationalImpact: 'Users must supply an MFA code upon authentication; automation scripts should transition to short-lived STS assumed roles.',
    verificationProcedure: 'Verify IAM identity reflects mfaEnabled: true in CloudGuard Scan.',
  },
  complianceMappings: [
    { framework: 'NIST CSF 2.0', controlId: 'PR.AA-01', controlTitle: 'Identities and credentials are managed' },
    { framework: 'NIST CSF 2.0', controlId: 'PR.AA-03', controlTitle: 'Users, devices, and other assets are authenticated' },
  ],
  evaluate(resource) {
    if (!this.supportedResourceTypes.includes(resource.type)) {
      return { passed: true, status: 'not_applicable' };
    }
    const config = resource.configuration || {};
    const isPrivileged = config.isPrivileged === true || config.role === 'admin' || config.role === 'administrator';

    if (isPrivileged && config.mfaEnabled !== true) {
      return {
        passed: false,
        status: 'fail',
        evidence: {
          evaluatedFields: { isPrivileged: true, mfaEnabled: config.mfaEnabled },
          actualValue: `isPrivileged: true, mfaEnabled: ${config.mfaEnabled}`,
          expectedValue: 'mfaEnabled: true',
          message: 'Privileged identity is configured without mandatory multi-factor authentication (MFA).',
        },
        riskScore: 82,
      };
    }

    return { passed: true, status: 'pass' };
  },
};
