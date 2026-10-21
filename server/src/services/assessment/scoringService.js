/**
 * Deterministic Posture and Risk Scoring Engine
 *
 * Posture Formula:
 * - Baseline: 100
 * - Deductions per unique ACTIVE finding (status: 'open' | 'in_progress'):
 *   - Critical: 20 points
 *   - High: 10 points
 *   - Medium: 4 points
 *   - Low: 1 point
 * - Accepted Risk findings receive a 50% discount penalty (proportional to residual risk).
 * - False Positive & Resolved findings receive 0 penalty.
 * - Score clamped between 0 and 100.
 */
export function calculatePostureScore(findings = []) {
  const activeFindings = findings.filter(
    (f) => f.status === 'open' || f.status === 'in_progress' || f.status === 'accepted_risk'
  );

  let totalPenalty = 0;

  for (const finding of activeFindings) {
    let penalty = 0;
    switch (finding.severity) {
      case 'critical':
        penalty = 20;
        break;
      case 'high':
        penalty = 10;
        break;
      case 'medium':
        penalty = 4;
        break;
      case 'low':
        penalty = 1;
        break;
      default:
        penalty = 0;
    }

    if (finding.status === 'accepted_risk') {
      penalty = penalty * 0.5; // Accepted risk residual penalty
    }

    totalPenalty += penalty;
  }

  const score = Math.max(0, Math.round(100 - totalPenalty));
  return score;
}

/**
 * Calculates an explainable finding risk score (0 - 100) based on 4 explicit factors:
 * 1. Base Severity (Critical: 40, High: 30, Medium: 15, Low: 5)
 * 2. Resource Criticality (Critical: 30, High: 20, Medium: 10, Low: 5)
 * 3. Public Exposure (Public internet facing: +20, Private: 0)
 * 4. Production Environment (Prod: +10, Stage: +5, Dev: 0)
 */
export function calculateExplainableRisk(finding, resource) {
  const factors = [];
  let score = 0;

  // 1. Severity Factor (max 40)
  let severityScore = 5;
  if (finding.severity === 'critical') severityScore = 40;
  else if (finding.severity === 'high') severityScore = 30;
  else if (finding.severity === 'medium') severityScore = 15;
  score += severityScore;
  factors.push({ name: 'Base Severity', weight: severityScore, description: `${finding.severity.toUpperCase()} finding weight` });

  // 2. Resource Criticality (max 30)
  const criticality = (resource?.criticality || 'medium').toLowerCase();
  let critScore = 10;
  if (criticality === 'critical') critScore = 30;
  else if (criticality === 'high') critScore = 20;
  else if (criticality === 'low') critScore = 5;
  score += critScore;
  factors.push({ name: 'Asset Criticality', weight: critScore, description: `${criticality.toUpperCase()} tier asset impact` });

  // 3. Public Exposure (max 20)
  const isPublic =
    resource?.configuration?.publicAccess === true ||
    resource?.configuration?.publicIp === true ||
    (Array.isArray(resource?.configuration?.inboundRules) &&
      resource.configuration.inboundRules.some((r) => r.source === '0.0.0.0/0' || r.cidr === '0.0.0.0/0'));
  if (isPublic) {
    score += 20;
    factors.push({ name: 'Public Exposure', weight: 20, description: 'Direct internet ingress / accessibility detected' });
  }

  // 4. Environment Context (max 10)
  const env = (resource?.environment || 'development').toLowerCase();
  let envScore = 0;
  if (env === 'production') envScore = 10;
  else if (env === 'staging') envScore = 5;
  score += envScore;
  factors.push({ name: 'Environment Tier', weight: envScore, description: `${env.toUpperCase()} environment blast radius` });

  return {
    riskScore: Math.min(100, score),
    factors,
  };
}
