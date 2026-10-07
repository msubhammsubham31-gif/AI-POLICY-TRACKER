import { describe, it, expect } from 'vitest';
import {
  computeTextDiff,
  computeSHA256,
} from '../src/services/diffEngine';

describe('Deterministic Diff Engine', () => {
  it('computes line-by-line diff between two legal text versions', () => {
    const oldText = 'Article 1: Scope\nArticle 2: Limits 25 ppb\nArticle 3: Reporting quarterly';
    const newText = 'Article 1: Scope\nArticle 2: Limits 1.0 ppb\nArticle 3: Reporting quarterly\nArticle 4: Penalties';

    const result = computeTextDiff(oldText, newText);

    expect(result.lines).toBeDefined();
    expect(result.additionsCount).toBeGreaterThanOrEqual(1);
    expect(result.deletionsCount).toBeGreaterThanOrEqual(1);
    expect(result.detectedArticles).toContain('Article 1');
  });

  it('detects threshold and numerical changes accurately', () => {
    const oldText = 'Permissible concentration of PFAS substances shall not exceed 25 ppb.';
    const newText = 'Permissible concentration of PFAS substances shall not exceed 1.0 ppb.';

    const result = computeTextDiff(oldText, newText);

    expect(result.detectedThresholds.length).toBeGreaterThan(0);
    expect(result.detectedThresholds[0].oldValue).toContain('25 ppb');
    expect(result.detectedThresholds[0].newValue).toContain('1.0 ppb');
  });

  it('calculates deterministic SHA-256 hash for version immutability', () => {
    const text = 'Regulation (EU) 2023/956 Carbon Border Adjustment Mechanism';
    const hash1 = computeSHA256(text);
    const hash2 = computeSHA256(text);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
  });

  it('determines severity rating from legal changes', () => {
    const oldText = 'Standard emissions limit 50 mg/m3.';
    const newText = 'Strict prohibition: substance is banned and prohibited from use under Article 5.';

    const result = computeTextDiff(oldText, newText);

    expect(result.severityRating).toBe('CRITICAL');
  });
});
