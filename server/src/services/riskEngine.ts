export interface RiskFactors {
  scope: number; // 0-10 (e.g. multi-site vs single site)
  severity: number; // 0-10 (e.g. criminal/shut-down vs administrative)
  proximity: number; // 0-10 (e.g. <30 days vs 2 years)
  dependency: number; // 0-10 (e.g. core revenue product vs niche)
  obligation: number; // 0-10 (e.g. total redesign vs routine reporting)
  exposure: number; // 0-10 (financial materiality)
  currentCompliance: number; // 0-10 (0 = fully compliant, 10 = completely non-compliant)
  confidence: number; // 0-10 (certainty of legal evidence)
}

export interface RiskEvaluation {
  compositeScore: number; // 0-100
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL';
  factors: RiskFactors;
  explanation: {
    scopeRationale: string;
    severityRationale: string;
    proximityRationale: string;
    dependencyRationale: string;
    obligationRationale: string;
    exposureRationale: string;
    gapRationale: string;
  };
  recommendedResponseWindowDays: number;
}

export function evaluateRegulatoryRisk(
  effectiveDate: Date | string,
  changeSeverity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL',
  affectedAssetCount: { facilities: number; products: number; suppliers: number; processes: number },
  isMandatoryBanOrThreshold: boolean,
  estimatedFinancialImpactEur: number = 250000
): RiskEvaluation {
  const effDate = new Date(effectiveDate);
  const now = new Date();
  const diffDays = Math.max(0, Math.round((effDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  // Proximity score
  let proximityScore = 2;
  if (diffDays <= 30) proximityScore = 10;
  else if (diffDays <= 90) proximityScore = 8.5;
  else if (diffDays <= 180) proximityScore = 7;
  else if (diffDays <= 365) proximityScore = 5;

  // Severity score
  const severityMap = {
    CRITICAL: 10,
    HIGH: 8,
    MEDIUM: 5.5,
    LOW: 3,
    INFORMATIONAL: 1,
  };
  const severityScore = severityMap[changeSeverity] || 5;

  // Scope score based on asset breadth
  const totalAssets = affectedAssetCount.facilities + affectedAssetCount.products + affectedAssetCount.suppliers + affectedAssetCount.processes;
  const scopeScore = Math.min(10, Math.max(2, totalAssets * 1.5));

  // Dependency score
  const dependencyScore = affectedAssetCount.products > 0 ? 8 : 5;

  // Obligation score
  const obligationScore = isMandatoryBanOrThreshold ? 9.5 : 6.0;

  // Exposure score
  let exposureScore = 4;
  if (estimatedFinancialImpactEur > 2000000) exposureScore = 9.5;
  else if (estimatedFinancialImpactEur > 500000) exposureScore = 7.5;
  else if (estimatedFinancialImpactEur > 100000) exposureScore = 5.5;

  const currentComplianceScore = isMandatoryBanOrThreshold ? 7.5 : 4.0;
  const confidenceScore = 9.0;

  // Weights sum to 1.0
  // Severity (25%), Proximity (20%), Obligation (15%), Exposure (15%), Scope (10%), Dependency (10%), Compliance Gap (5%)
  const compositeScore = Math.min(100, Math.round(
    (severityScore * 2.5) +
    (proximityScore * 2.0) +
    (obligationScore * 1.5) +
    (exposureScore * 1.5) +
    (scopeScore * 1.0) +
    (dependencyScore * 1.0) +
    (currentComplianceScore * 0.5)
  ));

  let riskLevel: RiskEvaluation['riskLevel'] = 'INFORMATIONAL';
  let recommendedResponseWindowDays = 90;

  if (compositeScore >= 80 || changeSeverity === 'CRITICAL') {
    riskLevel = 'CRITICAL';
    recommendedResponseWindowDays = 7;
  } else if (compositeScore >= 62 || changeSeverity === 'HIGH') {
    riskLevel = 'HIGH';
    recommendedResponseWindowDays = 30;
  } else if (compositeScore >= 42) {
    riskLevel = 'MEDIUM';
    recommendedResponseWindowDays = 60;
  } else if (compositeScore >= 25) {
    riskLevel = 'LOW';
    recommendedResponseWindowDays = 120;
  }

  return {
    compositeScore,
    riskLevel,
    factors: {
      scope: scopeScore,
      severity: severityScore,
      proximity: proximityScore,
      dependency: dependencyScore,
      obligation: obligationScore,
      exposure: exposureScore,
      currentCompliance: currentComplianceScore,
      confidence: confidenceScore,
    },
    explanation: {
      scopeRationale: `Impact spans ${affectedAssetCount.facilities} facilities, ${affectedAssetCount.products} product lines, and ${affectedAssetCount.suppliers} supply chain partners.`,
      severityRationale: `Classified as ${changeSeverity} due to regulatory enforcement penalties and potential commercial stop-shipment sanctions.`,
      proximityRationale: `Enforcement becomes mandatory in ${diffDays} calendar days (${effDate.toISOString().split('T')[0]}).`,
      dependencyRationale: `Impact directly touches high-revenue commercial manufacturing and chemical supply paths.`,
      obligationRationale: isMandatoryBanOrThreshold
        ? 'Imposes affirmative technical prohibition or strict quantifiable threshold requiring process alteration.'
        : 'Requires compliance monitoring, procedural audit trails, and periodic regulatory filing.',
      exposureRationale: `Estimated risk exposure exceeds €${estimatedFinancialImpactEur.toLocaleString()} across potential fines and operational redesign.`,
      gapRationale: 'Internal gap assessment indicates affirmative engineering and supplier verification actions are required to reach full compliance.',
    },
    recommendedResponseWindowDays,
  };
}
