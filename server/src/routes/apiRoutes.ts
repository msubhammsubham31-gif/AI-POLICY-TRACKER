import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { store } from '../db/store';
import { requireAuth, requireRole } from '../middleware/authMiddleware';
import {
  registerSchema,
  loginSchema,
  createFacilitySchema,
  createProductSchema,
  createSupplierSchema,
  createProcessSchema,
  createComplianceActionSchema,
  updateComplianceActionSchema,
  reviewChangeSchema,
  assistantQuerySchema
} from '../validators/schemas';
import { computeSHA256, computeTextDiff } from '../services/diffEngine';
import { analyzeRegulatoryDrift, answerAssistantQuery } from '../services/geminiService';
import { evaluateRegulatoryRisk } from '../services/riskEngine';
import { pollRegulatorySource } from '../services/ingestionEngine';

const router = Router();

// ============================================================================
// 1. AUTHENTICATION & MULTI-TENANCY
// ============================================================================
router.post('/auth/register', async (req: Request, res: Response) => {
  const data = registerSchema.parse(req.body);
  const existingUser = store.users.find(u => u.email.toLowerCase() === data.email.toLowerCase());
  if (existingUser) {
    return res.status(400).json({ error: 'User with this email already exists' });
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(data.password, salt);

  const newUserId = `usr-${Date.now()}`;
  const newUser = {
    id: newUserId,
    email: data.email,
    passwordHash,
    fullName: data.fullName,
    organizationId: store.organization.id,
    role: 'ANALYST' as const,
  };

  store.users.push(newUser);

  const token = jwt.sign(
    {
      userId: newUser.id,
      organizationId: newUser.organizationId,
      email: newUser.email,
      fullName: newUser.fullName,
      role: newUser.role,
    },
    config.jwtSecret,
    { expiresIn: '7d' }
  );

  res.status(201).json({
    user: {
      id: newUser.id,
      email: newUser.email,
      fullName: newUser.fullName,
      role: newUser.role,
      organizationId: newUser.organizationId,
      organizationName: store.organization.name,
    },
    token,
  });
});

router.post('/auth/login', async (req: Request, res: Response) => {
  const data = loginSchema.parse(req.body);
  const user = store.users.find(u => u.email.toLowerCase() === data.email.toLowerCase());

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const isMatch = await bcrypt.compare(data.password, user.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = jwt.sign(
    {
      userId: user.id,
      organizationId: user.organizationId,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    },
    config.jwtSecret,
    { expiresIn: '7d' }
  );

  res.json({
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      organizationId: user.organizationId,
      organizationName: store.organization.name,
    },
    token,
  });
});

router.get('/auth/me', requireAuth, (req: Request, res: Response) => {
  const user = store.users.find(u => u.id === req.user!.userId) || req.user!;
  res.json({
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      organizationId: req.user!.organizationId,
      organizationName: store.organization.name,
    },
  });
});

// ============================================================================
// 2. DASHBOARD METRICS
// ============================================================================
router.get('/dashboard', requireAuth, (req: Request, res: Response) => {
  const metrics = store.getDashboardMetrics(req.user!.organizationId);
  res.json(metrics);
});

// ============================================================================
// 3. REGULATIONS
// ============================================================================
router.get('/regulations', requireAuth, (req: Request, res: Response) => {
  let list = [...store.regulations];

  const { category, jurisdictionId, status, search } = req.query;
  if (category && typeof category === 'string') {
    list = list.filter(r => r.category === category);
  }
  if (jurisdictionId && typeof jurisdictionId === 'string') {
    list = list.filter(r => r.jurisdictionId === jurisdictionId);
  }
  if (status && typeof status === 'string') {
    list = list.filter(r => r.status === status);
  }
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    list = list.filter(r => r.title.toLowerCase().includes(q) || r.shortTitle.toLowerCase().includes(q) || r.country.toLowerCase().includes(q));
  }

  res.json({ total: list.length, regulations: list });
});

router.get('/regulations/:id', requireAuth, (req: Request, res: Response) => {
  const reg = store.regulations.find(r => r.id === req.params.id);
  if (!reg) return res.status(404).json({ error: 'Regulation not found' });

  const changes = store.changes.filter(c => c.regulationId === reg.id);
  const actions = store.actions.filter(a => a.regulationId === reg.id);
  const documents = store.documents.filter(d => d.regulationId === reg.id);

  res.json({
    ...reg,
    changes,
    actions,
    documents,
  });
});

router.post('/regulations', requireAuth, requireRole(['OWNER', 'ADMIN', 'COMPLIANCE_MANAGER']), (req: Request, res: Response) => {
  const newReg = {
    id: `reg-${Date.now()}`,
    ...req.body,
    currentVersion: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  store.regulations.unshift(newReg);
  res.status(201).json(newReg);
});

router.get('/regulations/:id/versions', requireAuth, (req: Request, res: Response) => {
  const reg = store.regulations.find(r => r.id === req.params.id);
  if (!reg) return res.status(404).json({ error: 'Regulation not found' });

  const changes = store.changes.filter(c => c.regulationId === reg.id);
  res.json({
    regulationId: reg.id,
    currentVersion: reg.currentVersion,
    versions: [
      {
        versionNumber: reg.currentVersion,
        effectiveDate: reg.effectiveDate,
        publicationDate: reg.publicationDate,
        hash: computeSHA256(reg.description),
      },
      ...changes.map((c, idx) => ({
        versionNumber: reg.currentVersion - (idx + 1),
        effectiveDate: c.effectiveDate,
        publicationDate: c.detectedAt,
        hash: computeSHA256(c.oldText || ''),
      }))
    ]
  });
});

router.post('/regulations/:id/ingest', requireAuth, async (req: Request, res: Response) => {
  const reg = store.regulations.find(r => r.id === req.params.id);
  if (!reg) return res.status(404).json({ error: 'Regulation not found' });

  const result = await pollRegulatorySource(
    {
      id: 'src-manual',
      name: 'Manual Ingestion Engine Trigger',
      sourceType: 'OFFICIAL_WEBSITE',
      url: reg.sourceUrl,
      jurisdictionCode: reg.country,
    },
    reg.id,
    computeSHA256(reg.description),
    reg.description,
    req.body.sampleNewText
  );

  res.json(result);
});

// ============================================================================
// 4. REGULATORY CHANGES & DRIFT FEED
// ============================================================================
router.get('/regulatory-changes', requireAuth, (req: Request, res: Response) => {
  let list = [...store.changes];
  const { severity, reviewStatus, search } = req.query;

  if (severity && typeof severity === 'string') {
    list = list.filter(c => c.severity === severity);
  }
  if (reviewStatus && typeof reviewStatus === 'string') {
    list = list.filter(c => c.reviewStatus === reviewStatus);
  }
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    list = list.filter(c => c.summary.toLowerCase().includes(q));
  }

  res.json({ total: list.length, changes: list });
});

router.get('/regulatory-changes/:id', requireAuth, (req: Request, res: Response) => {
  const change = store.changes.find(c => c.id === req.params.id);
  if (!change) return res.status(404).json({ error: 'Regulatory change not found' });

  const reg = store.regulations.find(r => r.id === change.regulationId);
  const diffResult = computeTextDiff(change.oldText || '', change.newText || '');

  res.json({
    ...change,
    regulation: reg,
    computedDiff: diffResult,
  });
});

router.patch('/regulatory-changes/:id/review', requireAuth, requireRole(['OWNER', 'ADMIN', 'COMPLIANCE_MANAGER', 'LEGAL_REVIEWER']), (req: Request, res: Response) => {
  const data = reviewChangeSchema.parse(req.body);
  const change = store.changes.find(c => c.id === req.params.id);
  if (!change) return res.status(404).json({ error: 'Regulatory change not found' });

  change.reviewStatus = data.reviewStatus;
  if (data.adjustedRiskLevel) {
    change.severity = data.adjustedRiskLevel;
  }
  change.reviewNotes = data.reviewNotes;
  change.reviewedBy = req.user!.fullName;
  change.reviewedAt = new Date().toISOString();

  // Audit log
  store.auditLogs.unshift({
    id: `aud-${Date.now()}`,
    organizationId: req.user!.organizationId,
    userId: req.user!.userId,
    action: 'HUMAN_REVIEW_SUBMITTED',
    entityType: 'RegulatoryChange',
    entityId: change.id,
    metadata: { reviewStatus: data.reviewStatus, reviewer: req.user!.fullName, notes: data.reviewNotes },
    ipAddress: req.ip || '127.0.0.1',
    createdAt: new Date().toISOString(),
  });

  res.json(change);
});

// ============================================================================
// 5. FACILITIES
// ============================================================================
router.get('/facilities', requireAuth, (req: Request, res: Response) => {
  const list = store.facilities.filter(f => f.organizationId === req.user!.organizationId);
  res.json({ total: list.length, facilities: list });
});

router.get('/facilities/:id', requireAuth, (req: Request, res: Response) => {
  const fac = store.facilities.find(f => f.id === req.params.id && f.organizationId === req.user!.organizationId);
  if (!fac) return res.status(404).json({ error: 'Facility not found' });

  const assignedProcesses = store.processes.filter(p => fac.processes?.includes(p.id));
  const mappedProducts = store.products.filter(p => ['prod-001', 'prod-004'].includes(p.id));
  const relatedActions = store.actions.filter(a => a.facilityId === fac.id);

  res.json({
    ...fac,
    assignedProcesses,
    mappedProducts,
    relatedActions,
  });
});

router.post('/facilities', requireAuth, requireRole(['OWNER', 'ADMIN', 'COMPLIANCE_MANAGER']), (req: Request, res: Response) => {
  const data = createFacilitySchema.parse(req.body);
  const newFac = {
    id: `fac-${Date.now()}`,
    organizationId: req.user!.organizationId,
    ...data,
    processes: [],
  };
  store.facilities.push(newFac as any);
  res.status(201).json(newFac);
});

router.patch('/facilities/:id', requireAuth, requireRole(['OWNER', 'ADMIN', 'COMPLIANCE_MANAGER']), (req: Request, res: Response) => {
  const fac = store.facilities.find(f => f.id === req.params.id && f.organizationId === req.user!.organizationId);
  if (!fac) return res.status(404).json({ error: 'Facility not found' });

  Object.assign(fac, req.body);
  res.json(fac);
});

// ============================================================================
// 6. PRODUCTS
// ============================================================================
router.get('/products', requireAuth, (req: Request, res: Response) => {
  const list = store.products.filter(p => p.organizationId === req.user!.organizationId);
  res.json({ total: list.length, products: list });
});

router.get('/products/:id', requireAuth, (req: Request, res: Response) => {
  const prod = store.products.find(p => p.id === req.params.id && p.organizationId === req.user!.organizationId);
  if (!prod) return res.status(404).json({ error: 'Product not found' });

  const mappedFacilities = store.facilities.filter(f => ['fac-001', 'fac-002'].includes(f.id));
  const relatedActions = store.actions.filter(a => a.productId === prod.id);

  res.json({
    ...prod,
    materials: [
      { name: 'Core Polymer / Bio-composite', cas: '9002-84-0', percentageWeight: 65.5, supplier: 'DuPont / Nordic Bio' },
      { name: 'Active Crosslinkers / Barrier Additive', cas: '29420-49-3', percentageWeight: 4.5, supplier: 'Tokyo ChemCorp' },
      { name: 'Structural Matrix Carrier', cas: '13463-67-7', percentageWeight: 30.0, supplier: 'BASF SE' },
    ],
    mappedFacilities,
    relatedActions,
  });
});

router.post('/products', requireAuth, requireRole(['OWNER', 'ADMIN', 'COMPLIANCE_MANAGER']), (req: Request, res: Response) => {
  const data = createProductSchema.parse(req.body);
  const newProd = {
    id: `prod-${Date.now()}`,
    organizationId: req.user!.organizationId,
    ...data,
  };
  store.products.push(newProd);
  res.status(201).json(newProd);
});

router.patch('/products/:id', requireAuth, requireRole(['OWNER', 'ADMIN', 'COMPLIANCE_MANAGER']), (req: Request, res: Response) => {
  const prod = store.products.find(p => p.id === req.params.id && p.organizationId === req.user!.organizationId);
  if (!prod) return res.status(404).json({ error: 'Product not found' });

  Object.assign(prod, req.body);
  res.json(prod);
});

// ============================================================================
// 7. SUPPLIERS
// ============================================================================
router.get('/suppliers', requireAuth, (req: Request, res: Response) => {
  const list = store.suppliers.filter(s => s.organizationId === req.user!.organizationId);
  res.json({ total: list.length, suppliers: list });
});

router.get('/suppliers/:id', requireAuth, (req: Request, res: Response) => {
  const supp = store.suppliers.find(s => s.id === req.params.id && s.organizationId === req.user!.organizationId);
  if (!supp) return res.status(404).json({ error: 'Supplier not found' });

  const actions = store.actions.filter(a => a.supplierId === supp.id);
  res.json({ ...supp, actions });
});

router.post('/suppliers', requireAuth, requireRole(['OWNER', 'ADMIN', 'COMPLIANCE_MANAGER']), (req: Request, res: Response) => {
  const data = createSupplierSchema.parse(req.body);
  const newSupp = {
    id: `supp-${Date.now()}`,
    organizationId: req.user!.organizationId,
    ...data,
  };
  store.suppliers.push(newSupp);
  res.status(201).json(newSupp);
});

router.patch('/suppliers/:id', requireAuth, requireRole(['OWNER', 'ADMIN', 'COMPLIANCE_MANAGER']), (req: Request, res: Response) => {
  const supp = store.suppliers.find(s => s.id === req.params.id && s.organizationId === req.user!.organizationId);
  if (!supp) return res.status(404).json({ error: 'Supplier not found' });

  Object.assign(supp, req.body);
  res.json(supp);
});

// ============================================================================
// 8. PROCESSES
// ============================================================================
router.get('/processes', requireAuth, (req: Request, res: Response) => {
  res.json({ total: store.processes.length, processes: store.processes });
});

router.post('/processes', requireAuth, requireRole(['OWNER', 'ADMIN', 'COMPLIANCE_MANAGER']), (req: Request, res: Response) => {
  const data = createProcessSchema.parse(req.body);
  const newProc = {
    id: `proc-${Date.now()}`,
    ...data,
  };
  store.processes.push(newProc);
  res.status(201).json(newProc);
});

// ============================================================================
// 9. IMPACTS & RISKS MATRIX
// ============================================================================
router.get('/impacts', requireAuth, (req: Request, res: Response) => {
  const evaluations = store.changes.map(c => ({
    changeId: c.id,
    regulationId: c.regulationId,
    evaluation: evaluateRegulatoryRisk(
      c.effectiveDate,
      c.severity,
      { facilities: 2, products: 2, suppliers: 3, processes: 2 },
      c.severity === 'CRITICAL'
    ),
  }));

  res.json({
    total: evaluations.length,
    impactMatrix: evaluations,
  });
});

router.post('/impacts/assess', requireAuth, (req: Request, res: Response) => {
  const { effectiveDate, severity, affectedAssets, isMandatory } = req.body;
  const result = evaluateRegulatoryRisk(
    effectiveDate || new Date().toISOString(),
    severity || 'HIGH',
    affectedAssets || { facilities: 1, products: 1, suppliers: 1, processes: 1 },
    !!isMandatory
  );
  res.json(result);
});

// ============================================================================
// 10. COMPLIANCE ACTIONS
// ============================================================================
router.get('/actions', requireAuth, (req: Request, res: Response) => {
  let list = store.actions.filter(a => a.organizationId === req.user!.organizationId);
  const { status, priority, ownerId } = req.query;

  if (status && typeof status === 'string') list = list.filter(a => a.status === status);
  if (priority && typeof priority === 'string') list = list.filter(a => a.priority === priority);
  if (ownerId && typeof ownerId === 'string') list = list.filter(a => a.ownerId === ownerId);

  res.json({ total: list.length, actions: list });
});

router.get('/actions/:id', requireAuth, (req: Request, res: Response) => {
  const action = store.actions.find(a => a.id === req.params.id && a.organizationId === req.user!.organizationId);
  if (!action) return res.status(404).json({ error: 'Action not found' });

  const reg = store.regulations.find(r => r.id === action.regulationId);
  const fac = store.facilities.find(f => f.id === action.facilityId);
  const prod = store.products.find(p => p.id === action.productId);
  const supp = store.suppliers.find(s => s.id === action.supplierId);
  const docs = store.documents.filter(d => d.complianceActionId === action.id);

  res.json({
    ...action,
    regulation: reg,
    facility: fac,
    product: prod,
    supplier: supp,
    documents: docs,
  });
});

router.post('/actions', requireAuth, (req: Request, res: Response) => {
  const data = createComplianceActionSchema.parse(req.body);
  const newAction = {
    id: `act-${Date.now()}`,
    organizationId: req.user!.organizationId,
    ownerId: req.user!.userId,
    status: 'OPEN' as const,
    createdAt: new Date().toISOString(),
    ...data,
  };

  store.actions.unshift(newAction);

  // Add deadline
  store.deadlines.push({
    id: `dl-${newAction.id}`,
    complianceActionId: newAction.id,
    title: newAction.title,
    dueDate: newAction.dueDate,
    category: 'CHEMICALS',
    isMilestone: true,
    status: 'OPEN',
  });

  // Audit log
  store.auditLogs.unshift({
    id: `aud-${Date.now()}`,
    organizationId: req.user!.organizationId,
    userId: req.user!.userId,
    action: 'COMPLIANCE_ACTION_CREATED',
    entityType: 'ComplianceAction',
    entityId: newAction.id,
    metadata: { title: newAction.title, priority: newAction.priority },
    ipAddress: req.ip || '127.0.0.1',
    createdAt: new Date().toISOString(),
  });

  res.status(201).json(newAction);
});

router.patch('/actions/:id', requireAuth, (req: Request, res: Response) => {
  const data = updateComplianceActionSchema.parse(req.body);
  const action = store.actions.find(a => a.id === req.params.id && a.organizationId === req.user!.organizationId);
  if (!action) return res.status(404).json({ error: 'Action not found' });

  Object.assign(action, data);

  // Audit log
  store.auditLogs.unshift({
    id: `aud-${Date.now()}`,
    organizationId: req.user!.organizationId,
    userId: req.user!.userId,
    action: 'COMPLIANCE_ACTION_UPDATED',
    entityType: 'ComplianceAction',
    entityId: action.id,
    metadata: { status: action.status, priority: action.priority },
    ipAddress: req.ip || '127.0.0.1',
    createdAt: new Date().toISOString(),
  });

  res.json(action);
});

// ============================================================================
// 11. TIMELINE & DEADLINES
// ============================================================================
router.get('/timeline', requireAuth, (req: Request, res: Response) => {
  const timelineEvents = [
    ...store.changes.map(c => ({
      id: c.id,
      type: 'REGULATORY_CHANGE',
      title: c.summary,
      date: c.effectiveDate,
      detectedAt: c.detectedAt,
      severity: c.severity,
      regulationId: c.regulationId,
    })),
    ...store.actions.map(a => ({
      id: a.id,
      type: 'COMPLIANCE_ACTION',
      title: a.title,
      date: a.dueDate,
      severity: a.priority,
      status: a.status,
    }))
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  res.json({ total: timelineEvents.length, timeline: timelineEvents });
});

// ============================================================================
// 12. ALERTS
// ============================================================================
router.get('/alerts', requireAuth, (req: Request, res: Response) => {
  const alerts = store.alerts.filter(a => a.organizationId === req.user!.organizationId);
  res.json({ total: alerts.length, alerts });
});

router.patch('/alerts/:id/read', requireAuth, (req: Request, res: Response) => {
  const alert = store.alerts.find(a => a.id === req.params.id && a.organizationId === req.user!.organizationId);
  if (!alert) return res.status(404).json({ error: 'Alert not found' });

  alert.read = true;
  res.json(alert);
});

// ============================================================================
// 13. DOCUMENTS VAULT
// ============================================================================
router.get('/documents', requireAuth, (req: Request, res: Response) => {
  const docs = store.documents.filter(d => d.organizationId === req.user!.organizationId);
  res.json({ total: docs.length, documents: docs });
});

router.post('/documents/upload', requireAuth, (req: Request, res: Response) => {
  const { title, fileType, fileUrl, fileSize, complianceActionId, regulationId, facilityId } = req.body;

  const newDoc = {
    id: `doc-${Date.now()}`,
    organizationId: req.user!.organizationId,
    title: title || 'Evidence Document.pdf',
    fileType: fileType || 'application/pdf',
    fileUrl: fileUrl || 'https://vault.apexindustrial.com/uploads/evidence.pdf',
    fileSize: fileSize || 1024000,
    complianceActionId,
    regulationId,
    facilityId,
    createdAt: new Date().toISOString(),
  };

  store.documents.unshift(newDoc);
  res.status(201).json(newDoc);
});

// ============================================================================
// 14. GROUNDED AI ASSISTANT
// ============================================================================
router.post('/assistant/query', requireAuth, async (req: Request, res: Response) => {
  const { query, conversationHistory } = assistantQuerySchema.parse(req.body);

  const groundedContext = store.queryDatabaseForAssistant(query, req.user!.organizationId);
  const answer = await answerAssistantQuery(query, conversationHistory || [], groundedContext);

  res.json({
    query,
    answer,
    disclaimer: 'AI-generated regulatory analysis is not legal advice. Verify material obligations against authoritative sources and qualified professionals.',
    groundedSourcesUsed: ['Apex Facilities Ledger', 'Active Regulations Register', 'ECHA REACH & EPA TSCA Drift Tracking'],
  });
});

// ============================================================================
// 15. AUDIT LOGS
// ============================================================================
router.get('/audit-log', requireAuth, (req: Request, res: Response) => {
  const logs = store.auditLogs.filter(l => l.organizationId === req.user!.organizationId);
  res.json({ total: logs.length, auditLogs: logs });
});

// ============================================================================
// 16. JURISDICTIONS (LOOKUP)
// ============================================================================
router.get('/jurisdictions', requireAuth, (req: Request, res: Response) => {
  res.json({ jurisdictions: store.jurisdictions });
});

export default router;
