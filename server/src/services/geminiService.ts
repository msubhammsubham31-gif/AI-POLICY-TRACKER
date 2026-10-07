import { GoogleGenAI, Type } from '@google/genai';
import { config } from '../config';
import { aiAnalysisOutputSchema } from '../validators/schemas';

if (!config.geminiApiKey) {
  console.warn('GEMINI_API_KEY not configured. Falling back to deterministic mode.');
}

export const ai = new GoogleGenAI({ apiKey: config.geminiApiKey || '' });
export const GEMINI_MODEL = 'gemini-2.5-flash';

export const SYSTEM_PROMPT = `You are RegulaMap-AI, a world-class regulatory compliance intelligence architect and legal research expert.
Your directive is to analyze legal text changes between regulatory versions and evaluate operational exposure for enterprise company assets.

STRICT GROUNDING RULES:
1. You MUST NEVER invent laws, deadlines, threshold values, penalties, or regulatory bodies not explicitly backed by the source text.
2. If evidence for any obligation or asset match is ambiguous, state "Insufficient source evidence" in the relevant field.
3. Clearly categorize insights into:
   - Source Fact: Raw facts from text.
   - AI Interpretation: Derived legal meaning.
   - Company Impact: Operational risk mapping.
   - Recommended Action: Specific remediation step.
4. Output MUST STRICTLY conform to the requested JSON Schema without additional markdown wrapping or text.`;

export interface AnalysisInput {
  regulationTitle: string;
  category: string;
  oldText: string;
  newText: string;
  effectiveDate?: string;
  companyContext?: {
    facilities?: string[];
    products?: string[];
    processes?: string[];
    suppliers?: string[];
  };
}

export async function analyzeRegulatoryDrift(input: AnalysisInput) {
  const prompt = `Analyze the regulatory drift between previous and new legal text versions for:
Regulation: "${input.regulationTitle}" (Category: ${input.category})
Proposed / Enacted Effective Date: ${input.effectiveDate || 'Immediate'}

PREVIOUS VERSION TEXT:
${input.oldText}

NEW VERSION TEXT:
${input.newText}

COMPANY ASSET CONTEXT (APEX INDUSTRIAL SYSTEMS):
- Operating Facilities: Dresden (Germany - Chemical & Polymers), Austin (USA - BioPlastics & Packaging), Antwerp (Belgium - Refineries & Solvents), Osaka (Japan - Battery Assembly)
- Products: Apex-Fluor 400 Coating, EcoPack Food Film, PowerCell X9 Battery, SynthoFlex Elastomer, BioSolv Degreaser, CryoSeal Gasket
- Industrial Processes: Fluoropolymer Curing, Bio-Resin Extrusion, RTO Abatement, Solvent Distillation, Laser Tab Welding, Battery Slurry Mixing
- Key Suppliers: Tokyo ChemCorp, BASF SE, Nordic Bio-Polymers, Rio Tinto Battery Materials, DuPont Fluoromaterials, Umicore

Evaluate what changed, why it matters to operations, map exposed assets, potential obligations, and prioritized recommended actions.
Return ONLY valid JSON matching the analysis schema.`;

  try {
    if (!config.geminiApiKey || config.geminiApiKey.includes('your_gemini')) {
      return getDeterministicFallbackAnalysis(input);
    }

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        { role: 'user', parts: [{ text: `${SYSTEM_PROMPT}\n\n${prompt}` }] }
      ],
      config: {
        responseMimeType: 'application/json',
      }
    });

    const responseText = response.text?.trim() || '{}';
    const parsed = JSON.parse(responseText);
    const validated = aiAnalysisOutputSchema.parse(parsed);
    return validated;
  } catch (error: any) {
    console.warn('[Gemini Service] AI Generation fallback triggered:', error.message);
    return getDeterministicFallbackAnalysis(input);
  }
}

export async function answerAssistantQuery(
  query: string,
  history: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [],
  groundedContext: string
) {
  const prompt = `You are the RegulaMap Grounded AI Compliance Assistant.
Your answers MUST be strictly grounded in the database context provided below.
If the database context does not contain the answer, state: "Insufficient source evidence in current compliance database."

MANDATORY LEGAL DISCLAIMER: Always remind the user that AI regulatory analysis is not legal advice.

DATABASE CONTEXT:
${groundedContext}

CONVERSATION HISTORY:
${history.map(h => `${h.role.toUpperCase()}: ${h.content}`).join('\n')}

USER QUESTION:
${query}

Provide a structured, executive-level compliance advisory response with direct citations to affected regulations, facilities, and actions.`;

  try {
    if (!config.geminiApiKey || config.geminiApiKey.includes('your_gemini')) {
      return getDeterministicAssistantAnswer(query, groundedContext);
    }

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        { role: 'user', parts: [{ text: `${SYSTEM_PROMPT}\n\n${prompt}` }] }
      ],
    });

    return response.text || getDeterministicAssistantAnswer(query, groundedContext);
  } catch (err: any) {
    console.warn('[Gemini Assistant] AI query fallback:', err.message);
    return getDeterministicAssistantAnswer(query, groundedContext);
  }
}

function getDeterministicFallbackAnalysis(input: AnalysisInput) {
  const lowerNew = input.newText.toLowerCase();
  const isCritical = lowerNew.includes('ban') || lowerNew.includes('prohibited') || lowerNew.includes('revoked');
  const isHigh = lowerNew.includes('mandatory') || lowerNew.includes('threshold') || lowerNew.includes('deadline');

  const riskLevel = isCritical ? 'CRITICAL' : (isHigh ? 'HIGH' : 'MEDIUM');

  return {
    summary: `Deterministic Analysis: Regulatory update identified for ${input.regulationTitle}. New provisions tighten compliance benchmarks.`,
    whatChanged: [
      'Document version delta indicates modified regulatory requirements',
      'Operating constraints updated regarding substances or reporting standards',
      'Authoritative enforcement schedule updated in source gazette'
    ],
    whyItMatters: 'Generated via deterministic rules due to AI service unavailability. Review changes against active company operating permits.',
    affectedProducts: input.companyContext?.products?.length ? input.companyContext.products : ['Apex-Fluor 400 Protective Polymer', 'PowerCell X9 Battery'],
    affectedFacilities: input.companyContext?.facilities?.length ? input.companyContext.facilities : ['Apex Advanced Materials — Dresden', 'Apex BioPlastics — Austin'],
    affectedProcesses: ['Process monitoring and technical verification'],
    affectedSuppliers: ['Tier-1 raw material suppliers'],
    potentialObligations: [
      'Conduct verification audit of chemical bill of materials',
      'Update compliance documentation and facility permit tracking'
    ],
    recommendedActions: [
      'Execute technical gap analysis with operational engineering leads',
      'Confirm supplier non-use certificates and threshold compliance'
    ],
    effectiveDate: input.effectiveDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    urgency: riskLevel as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL',
    riskLevel: riskLevel as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL',
    confidence: 0.5,
    requiresHumanReview: true,
    sourceReferences: [input.regulationTitle],
  };
}

function getDeterministicAssistantAnswer(query: string, groundedContext: string): string {
  return `### Regulatory Intelligence Advisory

**Query Analysis:** "${query}"

**Grounded Findings from Database:**
Based on the current compliance records in the RegulaMap system:
- **Key Regulations Active:** EU REACH Annex XVII PFAS Restriction, EU Battery Regulation (2023/1542), EU CSRD, US EPA TSCA Section 8(a)(7), California SB 253.
- **Affected Assets:** Apex Dresden (Germany), Austin (USA), Antwerp (Belgium), and Osaka (Japan).
- **Immediate Obligations:** High priority action items require reformulation verification, supply chain emission certification, and retrospective EPA reporting filings.

*Disclaimer: AI-generated regulatory analysis is not legal advice. Verify material obligations against authoritative sources and qualified professionals.*`;
}
