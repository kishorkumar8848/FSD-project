export const CG002 = {
  ruleId: 'CG-002',
  name: 'Public database exposure detected',
  description: 'Detects database instances accessible directly from unrestricted internet sources (0.0.0.0/0).',
  category: 'Database Security',
  supportedResourceTypes: ['database'],
  severity: 'critical',
  version: '1.0.0',
  expectedSecureConfig: 'publicAccess: false, inbound network CIDR restricted to private VPC subnets',
  detectionRationale: 'Databases exposed directly to the public internet are susceptible to brute-force credential stuffing, zero-day database exploit attempts, and unauthorized data exfiltration.',
  evidenceFields: ['publicAccess', 'inboundRules'],
  remediationInstructions: {
    summary: 'Disable public accessibility and restrict inbound firewall rules to private application tiers.',
    whyItMatters: 'Direct database accessibility allows external attackers to probe authentication layers without VPN or network perimeter boundaries.',
    recommendedSecureState: 'Disable public accessibility, assign private IPs only, and restrict port 3306/5432 ingress to application security groups.',
    stepByStep: [
      'Modify the database network settings and disable Publicly Accessible.',
      'Audit the attached security group inbound rules.',
      'Remove any rule with source 0.0.0.0/0 or ::/0 targeting database ports.',
      'Add specific source CIDRs for internal application server subnets.',
    ],
    operationalImpact: 'Developers connecting directly from home IPs will need to connect via an internal VPN or SSH bastion tunnel.',
    verificationProcedure: 'Run CloudGuard Scan to confirm publicAccess is false and no ingress rule allows 0.0.0.0/0.',
  },
  complianceMappings: [
    { framework: 'NIST CSF 2.0', controlId: 'PR.IR-01', controlTitle: 'Networks and environments are protected' },
    { framework: 'NIST CSF 2.0', controlId: 'PR.DS-01', controlTitle: 'Data-at-rest is protected' },
  ],
  evaluate(resource) {
    if (!this.supportedResourceTypes.includes(resource.type)) {
      return { passed: true, status: 'not_applicable' };
    }
    const config = resource.configuration || {};
    const hasPublicFlag = config.publicAccess === true;
    
    // Check inbound rules for open 0.0.0.0/0
    const rules = Array.isArray(config.inboundRules) ? config.inboundRules : [];
    const openIngressRule = rules.find((r) => {
      const src = (r.source || r.cidr || '').trim();
      return src === '0.0.0.0/0' || src === '::/0' || src === '*';
    });

    if (hasPublicFlag || openIngressRule) {
      return {
        passed: false,
        status: 'fail',
        evidence: {
          evaluatedFields: {
            publicAccess: config.publicAccess,
            violatingRule: openIngressRule || null,
          },
          actualValue: `publicAccess: ${config.publicAccess}, open ingress: ${openIngressRule ? `${openIngressRule.port || 'all'} from ${openIngressRule.source || openIngressRule.cidr}` : 'none'}`,
          expectedValue: 'publicAccess: false with private CIDR ingress only',
          message: 'Database is exposed to unrestricted internet traffic.',
        },
        riskScore: 92,
      };
    }

    return { passed: true, status: 'pass' };
  },
};
