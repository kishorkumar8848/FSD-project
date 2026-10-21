export const CG007 = {
  ruleId: 'CG-007',
  name: 'Insecure transport detected (missing TLS/HTTPS enforcement)',
  description: 'Detects resources that permit unencrypted HTTP or cleartext transport communication.',
  category: 'Data Protection',
  supportedResourceTypes: ['storage_bucket', 'virtual_machine', 'database'],
  severity: 'high',
  version: '1.0.0',
  expectedSecureConfig: 'tlsRequired: true, enforceHttps: true, sslEnabled: true',
  detectionRationale: 'Unencrypted in-transit network communication allows adversaries to intercept, inspect, or modify sensitive data via man-in-the-middle (MitM) eavesdropping.',
  evidenceFields: ['tlsRequired', 'enforceHttps', 'sslEnabled'],
  remediationInstructions: {
    summary: 'Enforce modern TLS (v1.2+) or HTTPS-only policies on all endpoints and APIs.',
    whyItMatters: 'Cleartext communications expose auth tokens, session cookies, and payload contents over intermediate routers.',
    recommendedSecureState: 'Enforce secure transport condition (aws:SecureTransport: true) or HTTPS redirect.',
    stepByStep: [
      'In storage buckets, attach a policy denying actions where aws:SecureTransport is false.',
      'In web servers/VMs, disable cleartext HTTP on port 80 or enforce a 301 redirect to HTTPS on port 443.',
      'In databases, enforce SSL/TLS client connection verification flags.',
    ],
    operationalImpact: 'Clients using legacy SSLv3 or TLS 1.0/1.1 or unencrypted HTTP will need client-side certificate updates.',
    verificationProcedure: 'Verify tlsRequired: true or enforceHttps: true in CloudGuard Scan.',
  },
  complianceMappings: [
    { framework: 'NIST CSF 2.0', controlId: 'PR.DS-02', controlTitle: 'Data-in-transit is protected' },
    { framework: 'NIST CSF 2.0', controlId: 'PR.IR-01', controlTitle: 'Networks and environments are protected' },
  ],
  evaluate(resource) {
    if (!this.supportedResourceTypes.includes(resource.type)) {
      return { passed: true, status: 'not_applicable' };
    }
    const config = resource.configuration || {};

    const secureTransport =
      config.tlsRequired === true ||
      config.enforceHttps === true ||
      config.sslEnabled === true;

    if (!secureTransport) {
      return {
        passed: false,
        status: 'fail',
        evidence: {
          evaluatedFields: {
            tlsRequired: config.tlsRequired,
            enforceHttps: config.enforceHttps,
            sslEnabled: config.sslEnabled,
          },
          actualValue: `tlsRequired: ${config.tlsRequired}, enforceHttps: ${config.enforceHttps}`,
          expectedValue: 'tlsRequired: true or enforceHttps: true',
          message: 'Secure transport is not enforced; cleartext HTTP or unencrypted protocols are permitted.',
        },
        riskScore: 72,
      };
    }

    return { passed: true, status: 'pass' };
  },
};
