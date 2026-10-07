export type Role = 'OWNER' | 'ADMIN' | 'COMPLIANCE_MANAGER' | 'LEGAL_REVIEWER' | 'ANALYST' | 'VIEWER';

export type RegulationCategory =
  | 'EMISSIONS'
  | 'CARBON'
  | 'CLIMATE'
  | 'CHEMICALS'
  | 'WASTE'
  | 'PACKAGING'
  | 'WATER'
  | 'ENERGY'
  | 'AIR_QUALITY'
  | 'HAZARDOUS_MATERIALS'
  | 'PRODUCT_STEWARDSHIP'
  | 'RECYCLING'
  | 'DEFORESTATION'
  | 'BIODIVERSITY'
  | 'ESG_DISCLOSURE'
  | 'SUPPLY_CHAIN'
  | 'SUSTAINABILITY';

export type RegulationStatus = 'PROPOSED' | 'UNDER_REVIEW' | 'ENACTED' | 'AMENDED' | 'REPEALED';

export type ChangeType =
  | 'NEW_REGULATION'
  | 'AMENDMENT'
  | 'THRESHOLD_CHANGE'
  | 'DEADLINE_CHANGE'
  | 'DEFINITION_CHANGE'
  | 'SCOPE_CHANGE'
  | 'REPORTING_CHANGE'
  | 'PENALTY_CHANGE'
  | 'OBLIGATION_CHANGE'
  | 'EXEMPTION_CHANGE'
  | 'OTHER';

export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL';

export type ActionStatus = 'OPEN' | 'IN_PROGRESS' | 'BLOCKED' | 'UNDER_REVIEW' | 'COMPLETED' | 'WAIVED';

export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'MODIFIED';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  organizationId: string;
  organizationName?: string;
}

export interface Jurisdiction {
  id: string;
  code: string;
  name: string;
  country: string;
  region: string;
  latitude: number;
  longitude: number;
}

export interface Regulation {
  id: string;
  title: string;
  shortTitle: string;
  jurisdictionId: string;
  country: string;
  regulatoryBody: string;
  category: RegulationCategory;
  description: string;
  sourceUrl: string;
  publicationDate: string;
  effectiveDate: string;
  status: RegulationStatus;
  currentVersion: number;
  applicability: string;
  industry: string;
  penalties: string;
  changes?: RegulatoryChange[];
  actions?: ComplianceAction[];
  documents?: DocumentItem[];
}

export interface AIAnalysis {
  summary: string;
  whatChanged: string[];
  whyItMatters: string;
  affectedProducts: string[];
  affectedFacilities: string[];
  affectedProcesses: string[];
  affectedSuppliers: string[];
  potentialObligations: string[];
  recommendedActions: string[];
  effectiveDate: string;
  urgency: RiskLevel;
  riskLevel: RiskLevel;
  confidence: number;
  requiresHumanReview: boolean;
  sourceReferences: string[];
}

export interface RegulatoryChange {
  id: string;
  regulationId: string;
  changeType: ChangeType;
  severity: RiskLevel;
  summary: string;
  sectionIdentifier?: string;
  effectiveDate: string;
  detectedAt: string;
  reviewStatus: ReviewStatus;
  reviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  oldText?: string;
  newText?: string;
  aiAnalysis?: AIAnalysis;
  regulation?: Regulation;
  computedDiff?: DiffResult;
}

export interface Facility {
  id: string;
  organizationId: string;
  name: string;
  country: string;
  location: string;
  latitude: number;
  longitude: number;
  facilityType: string;
  productionCapacity: string;
  emissionsData: Record<string, any>;
  waterUsage: Record<string, any>;
  energyMetrics: Record<string, any>;
  wasteOutput: Record<string, any>;
  processes?: string[];
  assignedProcesses?: ProcessItem[];
  mappedProducts?: Product[];
  relatedActions?: ComplianceAction[];
}

export interface Product {
  id: string;
  organizationId: string;
  name: string;
  sku: string;
  category: string;
  markets: string[];
  materials?: Array<{ name: string; cas?: string; percentageWeight: number; supplier?: string }>;
  mappedFacilities?: Facility[];
  relatedActions?: ComplianceAction[];
}

export interface Supplier {
  id: string;
  organizationId: string;
  name: string;
  country: string;
  certifications: string[];
  complianceStatus: string;
  riskScore: number;
  actions?: ComplianceAction[];
}

export interface ProcessItem {
  id: string;
  name: string;
  description: string;
  inputs: string[];
  chemicals: string[];
  emissions: string[];
  waste: string[];
  energyKw: number;
}

export interface ComplianceAction {
  id: string;
  organizationId: string;
  title: string;
  description: string;
  regulationId?: string;
  facilityId?: string;
  productId?: string;
  processId?: string;
  supplierId?: string;
  ownerId?: string;
  priority: RiskLevel;
  status: ActionStatus;
  dueDate: string;
  evidenceRequired: string;
  completionNotes?: string;
  createdAt: string;
  regulation?: Regulation;
  facility?: Facility;
  product?: Product;
  supplier?: Supplier;
  documents?: DocumentItem[];
}

export interface Deadline {
  id: string;
  complianceActionId?: string;
  title: string;
  dueDate: string;
  category: RegulationCategory;
  isMilestone: boolean;
  status?: ActionStatus;
}

export interface AlertItem {
  id: string;
  organizationId: string;
  title: string;
  message: string;
  severity: RiskLevel;
  read: boolean;
  createdAt: string;
}

export interface DocumentItem {
  id: string;
  organizationId: string;
  title: string;
  fileType: string;
  fileUrl: string;
  fileSize: number;
  regulationId?: string;
  facilityId?: string;
  productId?: string;
  complianceActionId?: string;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  organizationId: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, any>;
  ipAddress?: string;
  createdAt: string;
}

export interface DashboardMetrics {
  organizationName: string;
  totalRegulationsTracked: number;
  totalDriftEvents: number;
  riskDistribution: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    informational: number;
  };
  compliancePostureScore: number;
  complianceActions: {
    total: number;
    open: number;
    completed: number;
    overdue: number;
  };
  assetsCovered: {
    facilities: number;
    products: number;
    suppliers: number;
    processes: number;
  };
  recentDriftEvents: RegulatoryChange[];
  urgentActions: ComplianceAction[];
  unreadAlertsCount: number;
}

export interface DiffLine {
  lineOld: number | null;
  lineNew: number | null;
  type: 'added' | 'deleted' | 'unchanged';
  content: string;
}

export interface DiffResult {
  lines: DiffLine[];
  additionsCount: number;
  deletionsCount: number;
  unchangedCount: number;
  detectedThresholds: Array<{
    parameter: string;
    oldValue: string;
    newValue: string;
    unit: string;
    magnitudeShift: string;
  }>;
  detectedArticles: string[];
  severityRating: RiskLevel;
}
