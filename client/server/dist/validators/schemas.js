"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiAnalysisOutputSchema = exports.assistantQuerySchema = exports.reviewChangeSchema = exports.updateComplianceActionSchema = exports.createComplianceActionSchema = exports.createProcessSchema = exports.createSupplierSchema = exports.createProductSchema = exports.createFacilitySchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    fullName: zod_1.z.string().min(2),
    organizationName: zod_1.z.string().min(2).optional(),
    industry: zod_1.z.string().optional(),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
});
exports.createFacilitySchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    country: zod_1.z.string().min(2),
    location: zod_1.z.string(),
    latitude: zod_1.z.number(),
    longitude: zod_1.z.number(),
    facilityType: zod_1.z.string(),
    productionCapacity: zod_1.z.string(),
    emissionsData: zod_1.z.record(zod_1.z.any()),
    waterUsage: zod_1.z.record(zod_1.z.any()),
    energyMetrics: zod_1.z.record(zod_1.z.any()),
    wasteOutput: zod_1.z.record(zod_1.z.any()),
});
exports.createProductSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    sku: zod_1.z.string().min(2),
    category: zod_1.z.string().min(2),
    markets: zod_1.z.array(zod_1.z.string()).default([]),
});
exports.createSupplierSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    country: zod_1.z.string().min(2),
    certifications: zod_1.z.array(zod_1.z.string()).default([]),
    complianceStatus: zod_1.z.string().default('COMPLIANT'),
    riskScore: zod_1.z.number().min(0).max(100).default(10),
});
exports.createProcessSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    description: zod_1.z.string(),
    inputs: zod_1.z.array(zod_1.z.string()).default([]),
    chemicals: zod_1.z.array(zod_1.z.string()).default([]),
    emissions: zod_1.z.array(zod_1.z.string()).default([]),
    waste: zod_1.z.array(zod_1.z.string()).default([]),
    energyKw: zod_1.z.number().default(0),
});
exports.createComplianceActionSchema = zod_1.z.object({
    title: zod_1.z.string().min(3),
    description: zod_1.z.string(),
    regulationId: zod_1.z.string().optional(),
    facilityId: zod_1.z.string().optional(),
    productId: zod_1.z.string().optional(),
    processId: zod_1.z.string().optional(),
    supplierId: zod_1.z.string().optional(),
    priority: zod_1.z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFORMATIONAL']).default('HIGH'),
    dueDate: zod_1.z.string(),
    evidenceRequired: zod_1.z.string(),
});
exports.updateComplianceActionSchema = zod_1.z.object({
    title: zod_1.z.string().min(3).optional(),
    description: zod_1.z.string().optional(),
    priority: zod_1.z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFORMATIONAL']).optional(),
    status: zod_1.z.enum(['OPEN', 'IN_PROGRESS', 'BLOCKED', 'UNDER_REVIEW', 'COMPLETED', 'WAIVED']).optional(),
    dueDate: zod_1.z.string().optional(),
    evidenceRequired: zod_1.z.string().optional(),
    completionNotes: zod_1.z.string().optional(),
});
exports.reviewChangeSchema = zod_1.z.object({
    reviewStatus: zod_1.z.enum(['PENDING', 'APPROVED', 'REJECTED', 'MODIFIED']),
    reviewNotes: zod_1.z.string().optional(),
    adjustedRiskLevel: zod_1.z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFORMATIONAL']).optional(),
});
exports.assistantQuerySchema = zod_1.z.object({
    query: zod_1.z.string().min(2),
    conversationHistory: zod_1.z.array(zod_1.z.object({
        role: zod_1.z.enum(['user', 'assistant', 'system']),
        content: zod_1.z.string(),
    })).optional(),
    contextFilter: zod_1.z.object({
        facilityId: zod_1.z.string().optional(),
        regulationId: zod_1.z.string().optional(),
        category: zod_1.z.string().optional(),
    }).optional(),
});
exports.aiAnalysisOutputSchema = zod_1.z.object({
    summary: zod_1.z.string(),
    whatChanged: zod_1.z.array(zod_1.z.string()),
    whyItMatters: zod_1.z.string(),
    affectedProducts: zod_1.z.array(zod_1.z.string()),
    affectedFacilities: zod_1.z.array(zod_1.z.string()),
    affectedProcesses: zod_1.z.array(zod_1.z.string()),
    affectedSuppliers: zod_1.z.array(zod_1.z.string()),
    potentialObligations: zod_1.z.array(zod_1.z.string()),
    recommendedActions: zod_1.z.array(zod_1.z.string()),
    effectiveDate: zod_1.z.string(),
    urgency: zod_1.z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFORMATIONAL']),
    riskLevel: zod_1.z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFORMATIONAL']),
    confidence: zod_1.z.number().min(0).max(1),
    requiresHumanReview: zod_1.z.boolean(),
    sourceReferences: zod_1.z.array(zod_1.z.string()),
});
