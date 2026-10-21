import crypto from 'crypto';

/**
 * Generates a stable, deterministic fingerprint for a finding.
 * Guarantees identity across scans so existing findings are updated rather than duplicated.
 */
export function generateFindingFingerprint(organizationId, accountId, resourceId, ruleId) {
  const raw = `${organizationId}:${accountId}:${resourceId}:${ruleId}`;
  return crypto.createHash('sha256').update(raw).digest('hex');
}
