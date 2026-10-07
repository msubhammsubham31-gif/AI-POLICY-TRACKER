import crypto from 'crypto';
import * as diffLib from 'diff';

export interface DiffLine {
  lineOld: number | null;
  lineNew: number | null;
  type: 'added' | 'deleted' | 'unchanged';
  content: string;
}

export interface ThresholdDetection {
  parameter: string;
  oldValue: string;
  newValue: string;
  unit: string;
  magnitudeShift: string;
}

export interface DiffResult {
  lines: DiffLine[];
  additionsCount: number;
  deletionsCount: number;
  unchangedCount: number;
  detectedThresholds: ThresholdDetection[];
  detectedArticles: string[];
  severityRating: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL';
}

export function computeSHA256(content: string): string {
  return crypto.createHash('sha256').update(content.trim(), 'utf8').digest('hex');
}

export function computeTextDiff(oldText: string, newText: string): DiffResult {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');

  const patch = diffLib.structuredPatch('old_version', 'new_version', oldText, newText, '', '', { context: 3 });

  const diffLines: DiffLine[] = [];
  let additionsCount = 0;
  let deletionsCount = 0;
  let unchangedCount = 0;

  // Compute fine-grained line-by-line diff
  const changes = diffLib.diffLines(oldText, newText);
  let oldLineIdx = 1;
  let newLineIdx = 1;

  for (const part of changes) {
    const lines = part.value.replace(/\r\n/g, '\n').split('\n');
    if (lines[lines.length - 1] === '') {
      lines.pop();
    }

    for (const line of lines) {
      if (part.added) {
        additionsCount++;
        diffLines.push({
          lineOld: null,
          lineNew: newLineIdx++,
          type: 'added',
          content: line,
        });
      } else if (part.removed) {
        deletionsCount++;
        diffLines.push({
          lineOld: oldLineIdx++,
          lineNew: null,
          type: 'deleted',
          content: line,
        });
      } else {
        unchangedCount++;
        diffLines.push({
          lineOld: oldLineIdx++,
          lineNew: newLineIdx++,
          type: 'unchanged',
          content: line,
        });
      }
    }
  }

  // Detect threshold shifts (e.g. 25 ppb -> 1.0 ppb, 9 ug/m3 -> 3.0 ug/m3, 35% etc.)
  const detectedThresholds = extractThresholdShifts(oldText, newText);

  // Detect legal structure identifiers (Article, Section, Annex, Clause, Paragraph)
  const articleRegex = /(?:Article\s+\d+(?:\(\w+\))?|Annex\s+[IVXLCDM\d]+|Section\s+\d+|§\s*\d+)/gi;
  const oldArticles = oldText.match(articleRegex) || [];
  const newArticles = newText.match(articleRegex) || [];
  const detectedArticles = Array.from(new Set([...oldArticles, ...newArticles]));

  // Assess severity
  let severityRating: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL' = 'LOW';
  const combinedNew = newText.toLowerCase();

  if (
    combinedNew.includes('prohibited') ||
    combinedNew.includes('ban') ||
    combinedNew.includes('revoked') ||
    combinedNew.includes('strict prohibition') ||
    detectedThresholds.some(t => t.magnitudeShift.includes('significant reduction'))
  ) {
    severityRating = 'CRITICAL';
  } else if (
    combinedNew.includes('mandatory') ||
    combinedNew.includes('penalty') ||
    combinedNew.includes('shall not exceed') ||
    detectedThresholds.length > 0 ||
    additionsCount > 15
  ) {
    severityRating = 'HIGH';
  } else if (additionsCount > 5 || deletionsCount > 5) {
    severityRating = 'MEDIUM';
  }

  return {
    lines: diffLines,
    additionsCount,
    deletionsCount,
    unchangedCount,
    detectedThresholds,
    detectedArticles,
    severityRating,
  };
}

function extractThresholdShifts(oldText: string, newText: string): ThresholdDetection[] {
  const thresholds: ThresholdDetection[] = [];

  // Match patterns like "25 ppb", "1.0 ppb", "20 mg/m3", "5.0 mg/m3", "35%", "50 mg/kg"
  const thresholdPattern = /(\b\d+(?:\.\d+)?\s*(?:ppb|ppm|mg\/kg|mg\/m3|ug\/m3|%|g\/L|MT|GWh|MW)\b)/gi;
  const oldMatches = oldText.match(thresholdPattern) || [];
  const newMatches = newText.match(thresholdPattern) || [];

  if (oldMatches.length > 0 && newMatches.length > 0 && oldMatches[0] && newMatches[0]) {
    const oldVal: string = oldMatches[0];
    const newVal: string = newMatches[0];
    if (oldVal !== newVal) {
      thresholds.push({
        parameter: 'Concentration / Target Limit',
        oldValue: oldVal,
        newValue: newVal,
        unit: newVal.replace(/[\d.\s]/g, ''),
        magnitudeShift: 'Tighter limit / regulatory compliance threshold shift detected',
      });
    }
  }

  return thresholds;
}
