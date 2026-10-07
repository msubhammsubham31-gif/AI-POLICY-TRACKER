import { describe, it, expect } from 'vitest';
import { evaluateRegulatoryRisk } from '../src/services/riskEngine';

describe('Explainable Risk & Impact Matrix Engine', () => {
  it('computes 8-factor composite risk score with explainable factor breakdown for CRITICAL events', () => {
    // Proximity 15 days in future, CRITICAL severity, 4 facilities, 5 products
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 15);

    const result = evaluateRegulatoryRisk(
      futureDate,
      'CRITICAL',
      { facilities: 4, products: 5, suppliers: 3, processes: 2 },
      true,
      3000000
    );

    expect(result.compositeScore).toBeGreaterThanOrEqual(75);
    expect(result.riskLevel).toBe('CRITICAL');
    expect(result.recommendedResponseWindowDays).toBe(7);
    expect(result.factors.scope).toBeGreaterThanOrEqual(8);
    expect(result.factors.severity).toBe(10);
    expect(result.factors.proximity).toBe(10);
    expect(result.explanation.proximityRationale).toBeDefined();
    expect(result.explanation.scopeRationale).toContain('4 facilities');
  });

  it('assigns LOW or INFORMATIONAL risk when proximity is distant and change is minor', () => {
    const distantDate = new Date();
    distantDate.setDate(distantDate.getDate() + 400);

    const result = evaluateRegulatoryRisk(
      distantDate,
      'INFORMATIONAL',
      { facilities: 0, products: 0, suppliers: 0, processes: 0 },
      false,
      10000
    );

    expect(result.compositeScore).toBeLessThan(35);
    expect(['LOW', 'INFORMATIONAL']).toContain(result.riskLevel);
    expect(result.recommendedResponseWindowDays).toBeGreaterThanOrEqual(90);
  });

  it('provides all 7 explainable factor rationales in compliance matrix output', () => {
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 45);

    const result = evaluateRegulatoryRisk(
      nextMonth,
      'HIGH',
      { facilities: 2, products: 1, suppliers: 1, processes: 1 },
      false,
      550000
    );

    expect(result.riskLevel).toBe('HIGH');
    expect(result.explanation.scopeRationale).toBeDefined();
    expect(result.explanation.severityRationale).toBeDefined();
    expect(result.explanation.proximityRationale).toBeDefined();
    expect(result.explanation.dependencyRationale).toBeDefined();
    expect(result.explanation.obligationRationale).toBeDefined();
    expect(result.explanation.exposureRationale).toBeDefined();
    expect(result.explanation.gapRationale).toBeDefined();
  });
});
