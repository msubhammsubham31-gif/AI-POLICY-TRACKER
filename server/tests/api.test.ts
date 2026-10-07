import { describe, it, expect } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app';
import { config } from '../src/config';

const app = createApp();

// Generate valid JWT token for test user
const authToken = jwt.sign(
  {
    userId: 'usr-apex-002',
    id: 'usr-apex-002',
    organizationId: 'org-apex-001',
    email: 'elena.rostova@apexindustrial.com',
    fullName: 'Elena Rostova',
    role: 'ADMIN',
  },
  config.jwtSecret,
  { expiresIn: '7d' }
);

describe('RegulaMap Express API Endpoints', () => {
  it('GET /health returns status healthy', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.app).toContain('RegulaMap');
  });

  it('GET /api/dashboard returns metrics, trends, and risk distribution', async () => {
    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.totalRegulationsTracked).toBeGreaterThanOrEqual(20);
    expect(res.body.assetsCovered.facilities).toBeGreaterThanOrEqual(4);
    expect(res.body.riskDistribution).toBeDefined();
    expect(res.body.riskDistribution.critical).toBeDefined();
  });

  it('GET /api/regulations lists regulations with filtering', async () => {
    const res = await request(app)
      .get('/api/regulations')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.regulations.length).toBeGreaterThanOrEqual(20);
    expect(res.body.total).toBeGreaterThanOrEqual(20);
  });

  it('GET /api/regulatory-changes lists drift changes with diffs', async () => {
    const res = await request(app)
      .get('/api/regulatory-changes')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.changes.length).toBeGreaterThanOrEqual(6);
    expect(res.body.changes[0].sectionIdentifier).toBeDefined();
    expect(res.body.changes[0].oldText).toBeDefined();
  });

  it('GET /api/facilities returns multi-tenant facilities', async () => {
    const res = await request(app)
      .get('/api/facilities')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.facilities.length).toBe(4);
    expect(res.body.facilities[0].emissionsData).toBeDefined();
  });

  it('POST /api/assistant/query returns grounded legal analysis with disclaimer', async () => {
    const res = await request(app)
      .post('/api/assistant/query')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ query: 'What are the CBAM deadlines for Rotterdam?' });
    expect(res.status).toBe(200);
    expect(res.body.answer).toBeDefined();
    expect(res.body.disclaimer).toContain('AI-generated regulatory analysis is not legal advice');
    expect(res.body.groundedSourcesUsed.length).toBeGreaterThan(0);
  }, 15000);

  it('GET /api/audit-log returns immutable audit trail', async () => {
    const res = await request(app)
      .get('/api/audit-log')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.auditLogs.length).toBeGreaterThan(0);
  });
});
