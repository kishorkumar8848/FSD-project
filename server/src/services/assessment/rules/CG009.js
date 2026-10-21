export const CG009 = {
  ruleId: 'CG-009',
  name: 'Public administrative network ports exposed (SSH/RDP)',
  description: 'Detects virtual machines or security groups with open ingress from 0.0.0.0/0 on remote management ports (22, 3389).',
  category: 'Network Security',
  supportedResourceTypes: ['virtual_machine', 'security_group'],
  severity: 'high',
  version: '1.0.0',
  expectedSecureConfig: 'Inbound management ports 22 and 3389 restricted to private corporate CIDRs or zero open internet ingress',
  detectionRationale: 'Publicly exposed administrative ports invite automated brute-force attacks, port scanning, and exploit attempts targeting SSH daemon or RDP vulnerabilities.',
  evidenceFields: ['inboundRules', 'publicIp'],
  remediationInstructions: {
    summary: 'Restrict SSH (port 22) and RDP (port 3389) ingress to corporate bastion hosts or VPN ranges.',
    whyItMatters: 'Unrestricted remote administration ports are actively scanned across IPv4 space within minutes of provisioning.',
    recommendedSecureState: 'Remove 0.0.0.0/0 ingress for ports 22 and 3389; connect using Systems Manager Session Manager or VPN.',
    stepByStep: [
      'Locate the security group assigned to the host.',
      'Audit inbound rules for TCP port 22 and TCP port 3389.',
      'Delete rules allowing source 0.0.0.0/0 or ::/0.',
      'Replace with internal VPN subnet CIDR or use SSM / serial console.',
    ],
    operationalImpact: 'Direct public IP SSH/RDP connections will be blocked; administrators must authenticate to VPN first.',
    verificationProcedure: 'Verify no inbound rule allows 0.0.0.0/0 on ports 22 or 3389 in CloudGuard Scan.',
  },
  complianceMappings: [
    { framework: 'NIST CSF 2.0', controlId: 'PR.IR-01', controlTitle: 'Networks and environments are protected' },
    { framework: 'NIST CSF 2.0', controlId: 'PR.AC-03', controlTitle: 'Access permissions and authorizations are managed' },
  ],
  evaluate(resource) {
    if (!this.supportedResourceTypes.includes(resource.type)) {
      return { passed: true, status: 'not_applicable' };
    }
    const config = resource.configuration || {};
    const rules = Array.isArray(config.inboundRules) ? config.inboundRules : [];
    const sensitivePorts = [22, 3389, 23];

    const openManagementRules = rules.filter((r) => {
      const src = (r.source || r.cidr || '').trim();
      const isOpen = src === '0.0.0.0/0' || src === '::/0' || src === '*';
      const port = parseInt(r.port, 10);
      const isPortViolating = sensitivePorts.includes(port) || (r.fromPort <= 22 && r.toPort >= 22) || (r.fromPort <= 3389 && r.toPort >= 3389);
      return isOpen && isPortViolating;
    });

    if (openManagementRules.length > 0) {
      return {
        passed: false,
        status: 'fail',
        evidence: {
          evaluatedFields: { openRules: openManagementRules },
          actualValue: openManagementRules.map((r) => `Port ${r.port || `${r.fromPort}-${r.toPort}`} open from ${r.source || r.cidr}`).join('; '),
          expectedValue: 'Management ports 22/3389 restricted to private VPN/bastion subnets',
          message: 'Administrative management ports (SSH/RDP) are exposed to the entire public internet.',
        },
        riskScore: 85,
      };
    }

    return { passed: true, status: 'pass' };
  },
};
