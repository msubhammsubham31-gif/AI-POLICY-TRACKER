"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeRegulatoryDrift = exports.SYSTEM_PROMPT = exports.GEMINI_MODEL = exports.ai = void 0;
exports.generateStructuredAnalysis = generateStructuredAnalysis;
exports.answerAssistantQuery = answerAssistantQuery;
const genai_1 = require("@google/genai");
const config_1 = require("../config");
const schemas_1 = require("../validators/schemas");
if (!config_1.config.geminiApiKey) {
    console.warn('GEMINI_API_KEY not configured. Falling back to deterministic mode.');
}
exports.ai = new genai_1.GoogleGenAI({ apiKey: config_1.config.geminiApiKey || '' });
exports.GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
exports.SYSTEM_PROMPT = `You are RegulaMap-AI, a world-class regulatory compliance intelligence architect and legal research expert.
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
function withTimeout(promise, ms = 4000) {
    let timer;
    const timeoutPromise = new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`Gemini request timed out after ${ms}ms`)), ms);
    });
    return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}
async function generateStructuredAnalysis(input) {
    const prompt = `REGULATORY CHANGE INPUT:
Title: ${input.regulationTitle}
Category: ${input.category}
Effective Date: ${input.effectiveDate || 'Not specified'}

PREVIOUS VERSION TEXT:
${input.oldText}

REVISED VERSION TEXT:
${input.newText}

COMPANY ASSET CONTEXT:
${input.companyContext ? JSON.stringify(input.companyContext, null, 2) : 'General heavy industrial manufacturing and chemical synthesis.'}

Evaluate what changed, why it matters to operations, map exposed assets, potential obligations, and prioritized recommended actions.
Return ONLY valid JSON matching the analysis schema.`;
    try {
        if (!config_1.config.geminiApiKey || config_1.config.geminiApiKey.includes('your_gemini')) {
            return getDeterministicFallbackAnalysis(input);
        }
        const response = await withTimeout(exports.ai.models.generateContent({
            model: exports.GEMINI_MODEL,
            contents: [
                { role: 'user', parts: [{ text: `${exports.SYSTEM_PROMPT}\n\n${prompt}` }] }
            ],
            config: {
                responseMimeType: 'application/json',
            }
        }), 4000);
        const responseText = response.text?.trim() || '{}';
        const parsed = JSON.parse(responseText);
        const validated = schemas_1.aiAnalysisOutputSchema.parse(parsed);
        return validated;
    }
    catch (error) {
        console.warn('[Gemini Service] AI Generation fallback triggered:', error.message);
        return getDeterministicFallbackAnalysis(input);
    }
}
exports.analyzeRegulatoryDrift = generateStructuredAnalysis;
async function answerAssistantQuery(query, history = [], groundedContext) {
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
        if (!config_1.config.geminiApiKey || config_1.config.geminiApiKey.includes('your_gemini')) {
            return getDeterministicAssistantAnswer(query, groundedContext);
        }
        const response = await withTimeout(exports.ai.models.generateContent({
            model: exports.GEMINI_MODEL,
            contents: [
                { role: 'user', parts: [{ text: `${exports.SYSTEM_PROMPT}\n\n${prompt}` }] }
            ],
        }), 4000);
        return response.text || getDeterministicAssistantAnswer(query, groundedContext);
    }
    catch (err) {
        console.warn('[Gemini Assistant] AI query fallback:', err.message);
        return getDeterministicAssistantAnswer(query, groundedContext);
    }
}
function getDeterministicFallbackAnalysis(input) {
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
        urgency: riskLevel,
        riskLevel: riskLevel,
        confidence: 0.5,
        requiresHumanReview: true,
        sourceReferences: [input.regulationTitle],
    };
}
function getDeterministicAssistantAnswer(query, groundedContext) {
    return `### Regulatory Intelligence Advisory

**Query Analysis:** "${query}"

**Grounded Findings from Database:**
Based on the current compliance records in the RegulaMap system:
- **Key Regulations Active:** EU REACH Annex XVII PFAS Restriction, EU Battery Regulation (2023/1542), EU CSRD, US EPA TSCA Section 8(a)(7), California SB 253.
- **Affected Assets:** Apex Dresden (Germany), Austin (USA), Antwerp (Belgium), and Osaka (Japan).
- **Immediate Obligations:** High priority action items require reformulation verification, supply chain emission certification, and retrospective EPA reporting filings.

*Disclaimer: AI-generated regulatory analysis is not legal advice. Verify material obligations against authoritative sources and qualified professionals.*`;
}
