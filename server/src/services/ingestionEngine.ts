import { computeSHA256, computeTextDiff } from './diffEngine';
import { analyzeRegulatoryDrift } from './geminiService';
import { evaluateRegulatoryRisk } from './riskEngine';

export interface IngestionSource {
  id: string;
  name: string;
  sourceType: 'OFFICIAL_API' | 'OFFICIAL_WEBSITE' | 'RSS' | 'ATOM' | 'DOCUMENT_FEED' | 'MANUAL_UPLOAD';
  url: string;
  jurisdictionCode: string;
}

export interface IngestionResult {
  regulationId: string;
  detectedNewVersion: boolean;
  versionNumber: number;
  newHash: string;
  diffSummary?: any;
  aiAnalysis?: any;
  riskEvaluation?: any;
  message: string;
}

export async function pollRegulatorySource(
  source: IngestionSource,
  regulationId: string,
  currentHash: string,
  existingText: string,
  sampleNewText?: string
): Promise<IngestionResult> {
  console.log(`[Ingestion Engine] Polling source "${source.name}" (${source.sourceType}) for reg ${regulationId}...`);

  // Simulate or execute feed retrieval
  const simulatedUpdateText = sampleNewText || existingText + '\n\nArticle 99 (Enacted Amendment): Facilities must certify full elimination of target substances within 180 days of publication.';
  const newHash = computeSHA256(simulatedUpdateText);

  if (newHash === currentHash) {
    return {
      regulationId,
      detectedNewVersion: false,
      versionNumber: 1,
      newHash,
      message: 'Source content unchanged. SHA-256 hash verified match.',
    };
  }

  // Version drift detected!
  console.log(`[Ingestion Engine] New version detected! Hash shifted: ${currentHash.slice(0, 12)} -> ${newHash.slice(0, 12)}`);

  // 1. Run Deterministic Diff
  const diffResult = computeTextDiff(existingText, simulatedUpdateText);

  // 2. Run Grounded AI Synthesis
  const aiAnalysis = await analyzeRegulatoryDrift({
    regulationTitle: `Updated Regulation (${source.name})`,
    category: 'CHEMICALS',
    oldText: existingText,
    newText: simulatedUpdateText,
    effectiveDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
  });

  // 3. Evaluate Multi-factor Risk Matrix
  const riskEval = evaluateRegulatoryRisk(
    aiAnalysis.effectiveDate,
    aiAnalysis.riskLevel,
    {
      facilities: aiAnalysis.affectedFacilities.length,
      products: aiAnalysis.affectedProducts.length,
      suppliers: aiAnalysis.affectedSuppliers.length,
      processes: aiAnalysis.affectedProcesses.length,
    },
    true
  );

  return {
    regulationId,
    detectedNewVersion: true,
    versionNumber: 2,
    newHash,
    diffSummary: diffResult,
    aiAnalysis,
    riskEvaluation: riskEval,
    message: 'New regulatory version detected, diff calculated, and AI operational analysis synthesized.',
  };
}
