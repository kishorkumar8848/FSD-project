import { describe, it, expect } from 'vitest';
import { allRules, getRuleById } from '../src/services/assessment/rules/index.js';
import { CG001 } from '../src/services/assessment/rules/CG001.js';
import { CG002 } from '../src/services/assessment/rules/CG002.js';
import { CG003 } from '../src/services/assessment/rules/CG003.js';
import { CG004 } from '../src/services/assessment/rules/CG004.js';
import { CG005 } from '../src/services/assessment/rules/CG005.js';
import { CG006 } from '../src/services/assessment/rules/CG006.js';
import { CG007 } from '../src/services/assessment/rules/CG007.js';
import { CG008 } from '../src/services/assessment/rules/CG008.js';
import { CG009 } from '../src/services/assessment/rules/CG009.js';
import { CG010 } from '../src/services/assessment/rules/CG010.js';
import { generateFindingFingerprint } from '../src/services/assessment/fingerprint.js';

describe('Deterministic Security Rules Suite', () => {
  it('should load all 10 mandated security rules', () => {
    expect(allRules.length).toBe(10);
    const ruleIds = allRules.map((r) => r.ruleId);
    for (let i = 1; i <= 10; i++) {
      const id = `CG-${String(i).padStart(3, '0')}`;
      expect(ruleIds).toContain(id);
    }
  });

  describe('CG-001: Public Storage Access', () => {
    it('should fail when storage bucket publicAccess is true', () => {
      const res = {
        type: 'storage_bucket',
        configuration: { publicAccess: true, acl: 'public-read' },
      };
      const result = CG001.evaluate(res);
      expect(result.passed).toBe(false);
      expect(result.status).toBe('fail');
      expect(result.evidence.actualValue).toContain('publicAccess: true');
    });

    it('should pass when storage bucket publicAccess is false', () => {
      const res = {
        type: 'storage_bucket',
        configuration: { publicAccess: false, acl: 'private' },
      };
      const result = CG001.evaluate(res);
      expect(result.passed).toBe(true);
      expect(result.status).toBe('pass');
    });

    it('should fail when publicAccess is missing/ambiguous (security default)', () => {
      const res = {
        type: 'storage_bucket',
        configuration: {},
      };
      const result = CG001.evaluate(res);
      expect(result.passed).toBe(false);
      expect(result.status).toBe('fail');
    });

    it('should return not_applicable for non-storage resource types', () => {
      const res = { type: 'database', configuration: { publicAccess: true } };
      const result = CG001.evaluate(res);
      expect(result.status).toBe('not_applicable');
    });
  });

  describe('CG-002: Public Database Exposure', () => {
    it('should fail when database has 0.0.0.0/0 inbound rule', () => {
      const res = {
        type: 'database',
        configuration: {
          publicAccess: false,
          inboundRules: [{ port: 5432, source: '0.0.0.0/0' }],
        },
      };
      const result = CG002.evaluate(res);
      expect(result.passed).toBe(false);
      expect(result.status).toBe('fail');
    });

    it('should pass when database ingress is restricted to private VPC CIDR', () => {
      const res = {
        type: 'database',
        configuration: {
          publicAccess: false,
          inboundRules: [{ port: 5432, source: '10.0.0.0/16' }],
        },
      };
      const result = CG002.evaluate(res);
      expect(result.passed).toBe(true);
      expect(result.status).toBe('pass');
    });
  });

  describe('CG-003: Storage Encryption Disabled', () => {
    it('should fail when encryptionEnabled is false or missing', () => {
      const res = {
        type: 'storage_bucket',
        configuration: { encryptionEnabled: false },
      };
      const result = CG003.evaluate(res);
      expect(result.passed).toBe(false);
    });

    it('should pass when encryptionEnabled is true', () => {
      const res = {
        type: 'storage_bucket',
        configuration: { encryptionEnabled: true },
      };
      const result = CG003.evaluate(res);
      expect(result.passed).toBe(true);
    });
  });

  describe('CG-004: Missing MFA for Privileged Identities', () => {
    it('should fail when privileged user has mfaEnabled false', () => {
      const res = {
        type: 'iam_user',
        configuration: { isPrivileged: true, mfaEnabled: false },
      };
      const result = CG004.evaluate(res);
      expect(result.passed).toBe(false);
    });

    it('should pass when privileged user has mfaEnabled true', () => {
      const res = {
        type: 'iam_user',
        configuration: { isPrivileged: true, mfaEnabled: true },
      };
      const result = CG004.evaluate(res);
      expect(result.passed).toBe(true);
    });
  });

  describe('CG-005: Overly Permissive IAM', () => {
    it('should fail when IAM policy grants wildcard action and resource', () => {
      const res = {
        type: 'iam_role',
        configuration: {
          policies: [
            {
              policyName: 'AdminAccess',
              effect: 'Allow',
              actions: ['*'],
              resources: ['*'],
            },
          ],
        },
      };
      const result = CG005.evaluate(res);
      expect(result.passed).toBe(false);
    });

    it('should pass when IAM policy is scoped to specific actions and ARNs', () => {
      const res = {
        type: 'iam_role',
        configuration: {
          policies: [
            {
              policyName: 'ScopedReadOnly',
              effect: 'Allow',
              actions: ['s3:GetObject'],
              resources: ['arn:aws:s3:::my-bucket/*'],
            },
          ],
        },
      };
      const result = CG005.evaluate(res);
      expect(result.passed).toBe(true);
    });
  });

  describe('CG-006: Audit Logging Disabled', () => {
    it('should fail when audit_log has auditLoggingEnabled false', () => {
      const res = {
        type: 'audit_log',
        configuration: { auditLoggingEnabled: false },
      };
      const result = CG006.evaluate(res);
      expect(result.passed).toBe(false);
    });

    it('should pass when audit_log has auditLoggingEnabled true', () => {
      const res = {
        type: 'audit_log',
        configuration: { auditLoggingEnabled: true },
      };
      const result = CG006.evaluate(res);
      expect(result.passed).toBe(true);
    });
  });

  describe('CG-007: Insecure Transport', () => {
    it('should fail when tlsRequired and enforceHttps are false', () => {
      const res = {
        type: 'storage_bucket',
        configuration: { tlsRequired: false, enforceHttps: false },
      };
      const result = CG007.evaluate(res);
      expect(result.passed).toBe(false);
    });

    it('should pass when tlsRequired is true', () => {
      const res = {
        type: 'storage_bucket',
        configuration: { tlsRequired: true },
      };
      const result = CG007.evaluate(res);
      expect(result.passed).toBe(true);
    });
  });

  describe('CG-008: Missing Mandatory Resource Tags', () => {
    it('should fail when owner or dataClassification tag is missing', () => {
      const res = {
        type: 'virtual_machine',
        tags: { environment: 'production' },
      };
      const result = CG008.evaluate(res);
      expect(result.passed).toBe(false);
      expect(result.evidence.actualValue).toContain('owner');
    });

    it('should pass when owner, environment, and dataClassification tags are present', () => {
      const res = {
        type: 'virtual_machine',
        tags: {
          owner: 'devops-team',
          environment: 'production',
          dataClassification: 'internal',
        },
      };
      const result = CG008.evaluate(res);
      expect(result.passed).toBe(true);
    });
  });

  describe('CG-009: Public Administrative Network Ports', () => {
    it('should fail when SSH (22) or RDP (3389) is open to 0.0.0.0/0', () => {
      const res = {
        type: 'virtual_machine',
        configuration: {
          inboundRules: [{ port: 22, source: '0.0.0.0/0' }],
        },
      };
      const result = CG009.evaluate(res);
      expect(result.passed).toBe(false);
    });

    it('should pass when SSH is restricted to private corporate bastion', () => {
      const res = {
        type: 'virtual_machine',
        configuration: {
          inboundRules: [{ port: 22, source: '10.200.1.10/32' }],
        },
      };
      const result = CG009.evaluate(res);
      expect(result.passed).toBe(true);
    });
  });

  describe('CG-010: Missing Database Backup Protection', () => {
    it('should fail when backupEnabled is false or retentionDays < 7', () => {
      const res = {
        type: 'database',
        configuration: { backupEnabled: true, backupRetentionDays: 2 },
      };
      const result = CG010.evaluate(res);
      expect(result.passed).toBe(false);
    });

    it('should pass when backupEnabled is true and retentionDays >= 7', () => {
      const res = {
        type: 'database',
        configuration: { backupEnabled: true, backupRetentionDays: 14 },
      };
      const result = CG010.evaluate(res);
      expect(result.passed).toBe(true);
    });
  });

  describe('Finding Fingerprint Stability', () => {
    it('should generate identical fingerprints for the same asset and rule parameters', () => {
      const fp1 = generateFindingFingerprint('org-1', 'acc-1', 'res-100', 'CG-001');
      const fp2 = generateFindingFingerprint('org-1', 'acc-1', 'res-100', 'CG-001');
      expect(fp1).toBe(fp2);
      expect(fp1).toHaveLength(64);
    });

    it('should generate different fingerprints for different resources or rules', () => {
      const fp1 = generateFindingFingerprint('org-1', 'acc-1', 'res-100', 'CG-001');
      const fp2 = generateFindingFingerprint('org-1', 'acc-1', 'res-101', 'CG-001');
      const fp3 = generateFindingFingerprint('org-1', 'acc-1', 'res-100', 'CG-002');
      expect(fp1).not.toBe(fp2);
      expect(fp1).not.toBe(fp3);
    });
  });
});
