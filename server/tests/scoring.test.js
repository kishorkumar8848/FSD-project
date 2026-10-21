import { describe, it, expect } from 'vitest';
import { calculatePostureScore, calculateExplainableRisk } from '../src/services/assessment/scoringService.js';

describe('Posture Scoring and Risk Logic', () => {
  it('should return baseline 100 when there are no active findings', () => {
    const score = calculatePostureScore([]);
    expect(score).toBe(100);
  });

  it('should deduct correct weighted penalties for active findings', () => {
    // 1 Critical (20), 1 High (10), 1 Medium (4), 1 Low (1) -> total penalty = 35 -> score = 65
    const findings = [
      { severity: 'critical', status: 'open' },
      { severity: 'high', status: 'open' },
      { severity: 'medium', status: 'in_progress' },
      { severity: 'low', status: 'open' },
    ];
    const score = calculatePostureScore(findings);
    expect(score).toBe(65);
  });

  it('should apply 50% discount for accepted_risk status and 0 for resolved/false_positive', () => {
    // 1 Critical accepted_risk (20 * 0.5 = 10), 1 resolved (0), 1 false_positive (0) -> penalty = 10 -> score = 90
    const findings = [
      { severity: 'critical', status: 'accepted_risk' },
      { severity: 'high', status: 'resolved' },
      { severity: 'critical', status: 'false_positive' },
    ];
    const score = calculatePostureScore(findings);
    expect(score).toBe(90);
  });

  it('should clamp minimum score at 0', () => {
    const findings = Array(10).fill({ severity: 'critical', status: 'open' }); // penalty = 200
    const score = calculatePostureScore(findings);
    expect(score).toBe(0);
  });

  it('should compute explainable risk factors', () => {
    const rule = { severity: 'critical' };
    const resource = {
      criticality: 'critical',
      environment: 'production',
      configuration: { publicAccess: true },
    };

    const { riskScore, factors } = calculateExplainableRisk(rule, resource);
    // Base 40 + Asset Criticality 30 + Public Exposure 20 + Prod 10 = 100
    expect(riskScore).toBe(100);
    expect(factors.length).toBe(4);
    expect(factors.map((f) => f.name)).toContain('Public Exposure');
  });
});
