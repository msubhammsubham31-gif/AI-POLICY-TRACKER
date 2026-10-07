import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  organizationName: z.string().min(2).optional(),
  industry: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const createFacilitySchema = z.object({
  name: z.string().min(2),
  country: z.string().min(2),
  location: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  facilityType: z.string(),
  productionCapacity: z.string(),
  emissionsData: z.record(z.any()),
  waterUsage: z.record(z.any()),
  energyMetrics: z.record(z.any()),
  wasteOutput: z.record(z.any()),
});

export const createProductSchema = z.object({
  name: z.string().min(2),
  sku: z.string().min(2),
  category: z.string().min(2),
  markets: z.array(z.string()).default([]),
});

export const createSupplierSchema = z.object({
  name: z.string().min(2),
  country: z.string().min(2),
  certifications: z.array(z.string()).default([]),
  complianceStatus: z.string().default('COMPLIANT'),
  riskScore: z.number().min(0).max(100).default(10),
});

export const createProcessSchema = z.object({
  name: z.string().min(2),
  description: z.string(),
  inputs: z.array(z.string()).default([]),
  chemicals: z.array(z.string()).default([]),
  emissions: z.array(z.string()).default([]),
  waste: z.array(z.string()).default([]),
  energyKw: z.number().default(0),
});

export const createComplianceActionSchema = z.object({
  title: z.string().min(3),
  description: z.string(),
  regulationId: z.string().optional(),
  facilityId: z.string().optional(),
  productId: z.string().optional(),
  processId: z.string().optional(),
  supplierId: z.string().optional(),
  priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFORMATIONAL']).default('HIGH'),
  dueDate: z.string(),
  evidenceRequired: z.string(),
});

export const updateComplianceActionSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFORMATIONAL']).optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'BLOCKED', 'UNDER_REVIEW', 'COMPLETED', 'WAIVED']).optional(),
  dueDate: z.string().optional(),
  evidenceRequired: z.string().optional(),
  completionNotes: z.string().optional(),
});

export const reviewChangeSchema = z.object({
  reviewStatus: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'MODIFIED']),
  reviewNotes: z.string().optional(),
  adjustedRiskLevel: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFORMATIONAL']).optional(),
});

export const assistantQuerySchema = z.object({
  query: z.string().min(2),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
  })).optional(),
  contextFilter: z.object({
    facilityId: z.string().optional(),
    regulationId: z.string().optional(),
    category: z.string().optional(),
  }).optional(),
});

export const aiAnalysisOutputSchema = z.object({
  summary: z.string(),
  whatChanged: z.array(z.string()),
  whyItMatters: z.string(),
  affectedProducts: z.array(z.string()),
  affectedFacilities: z.array(z.string()),
  affectedProcesses: z.array(z.string()),
  affectedSuppliers: z.array(z.string()),
  potentialObligations: z.array(z.string()),
  recommendedActions: z.array(z.string()),
  effectiveDate: z.string(),
  urgency: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFORMATIONAL']),
  riskLevel: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFORMATIONAL']),
  confidence: z.number().min(0).max(1),
  requiresHumanReview: z.boolean(),
  sourceReferences: z.array(z.string()),
});
