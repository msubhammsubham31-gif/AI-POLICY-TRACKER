# RegulaMap — AI Regulatory & Environmental Compliance Drift Tracking Platform

> **"Google Maps for global regulations"** — An enterprise-grade regulatory intelligence platform that continuously tracks environmental, climate, emissions, chemicals, waste, packaging, carbon, sustainability, and product-compliance drift.

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)]()
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)]()
[![Node.js](https://img.shields.io/badge/Node.js-22.x-green.svg)]()
[![Gemini](https://img.shields.io/badge/Google%20GenAI-Gemini%202.5%20Flash-orange.svg)]()
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20RLS-3ecf8e.svg)]()
[![MapLibre](https://img.shields.io/badge/MapLibre%20GL-JS-blue.svg)]()

---

## 🏛️ Executive Summary

RegulaMap bridges the gap between complex legal regulatory changes and enterprise operational reality. It monitors 26+ global regulatory bodies (EU, US EPA, CARB, UK DEFRA, Germany BImSchG/LkSG, Taiwan EPA, Japan METI/MOE, IMO), computes deterministic line-by-line diffs, grounds changes through Google Gemini 2.5 Flash (`@google/genai`), and cross-maps impacts directly to company assets:
- **Facilities** (production capacity, Scope 1/2/3 emissions, wastewater, hazardous waste)
- **Products & Bill of Materials** (SKUs, chemical CAS numbers, packaging resins)
- **Processes** (industrial steps, chemical catalysts, emissions permits)
- **Suppliers** (tier-1 and tier-2 vendor compliance risk)

---

## ⚡ Core Architecture & Workflow

```text
  ┌──────────────────────────────────────────────────────────────┐
  │                 Regulatory Sources (26+ Jurisdictions)       │
  │     (EU Eur-Lex, US Federal Register, ECHA, CARB, DEFRA)     │
  └──────────────────────────────┬───────────────────────────────┘
                                 │
                                 ▼
  ┌──────────────────────────────────────────────────────────────┐
  │                Ingestion & Version Detector                  │
  │   - SHA-256 Content Hashing (Strict Version Immutability)    │
  │   - Normalized Text Ingestion Engine                         │
  └──────────────────────────────┬───────────────────────────────┘
                                 │
                                 ▼
  ┌──────────────────────────────────────────────────────────────┐
  │                 Deterministic Diff Engine                    │
  │   - Pure TypeScript line-by-line comparison                  │
  │   - Threshold Shift Extraction (e.g., 25 ppb → 1.0 ppb)      │
  │   - Legal Article & Clause Identification                    │
  └──────────────────────────────┬───────────────────────────────┘
                                 │
                                 ▼
  ┌──────────────────────────────────────────────────────────────┐
  │              Grounded AI Interpretation Engine               │
  │   - Official @google/genai SDK (Gemini 2.5 Flash)            │
  │   - Strict Grounding Rules (Zero Hallucination Tolerance)    │
  │   - Structured Zod Schema Output                             │
  └──────────────────────────────┬───────────────────────────────┘
                                 │
                                 ▼
  ┌──────────────────────────────────────────────────────────────┐
  │            Explainable Risk & Impact Matrix Engine           │
  │   - 8-Factor Composite Risk Scoring (0–100)                  │
  │   - Multi-Asset Graph Cross-Mapping                          │
  │   - Recommended Response Windows (7d, 30d, 60d, 90d)         │
  └──────────────────────────────┬───────────────────────────────┘
                                 │
                                 ▼
  ┌──────────────────────────────────────────────────────────────┐
  │            Compliance Operations & Audit Governance          │
  │   - Interactive Global Map (MapLibre GL JS)                  │
  │   - Dual-Pane Side-by-Side Diff Visualizer                   │
  │   - Action Tracker with Evidence Document Vault              │
  │   - Immutable Cryptographic Audit Log                        │
  └──────────────────────────────────────────────────────────────┘
```

---

## ⚖️ Mandatory Legal Notice

> **Mandatory Regulatory Advisory:**
> AI-generated regulatory analysis is not legal advice. Verify material obligations against authoritative sources and qualified professionals.

---

## 🧭 Application Routes (28 Views)

| Route | Page | Purpose |
|---|---|---|
| `/` | `LandingPage` | Enterprise platform landing page, capabilities, and sign-in gateway |
| `/login` | `LoginPage` | JWT-authenticated portal with demo credential autofill |
| `/signup` | `SignupPage` | Multi-tenant organization registration |
| `/app/dashboard` | `DashboardPage` | Executive compliance KPIs, posture score, risk distribution, drift alerts |
| `/app/map` | `MapPage` | Interactive MapLibre GL JS global regulatory map with CARTO Dark tiles |
| `/app/regulations` | `RegulationsPage` | Searchable directory of 26+ monitored regulations across 16 categories |
| `/app/regulations/:id` | `RegulationDetailPage` | Version history, full legal text, citations, and attached company impacts |
| `/app/changes` | `ChangesPage` | Live regulatory drift stream with severity filters and review status |
| `/app/changes/:id` | `ChangeDetailPage` | Side-by-side legal diff viewer, Gemini AI summary, human review approval |
| `/app/timeline` | `TimelinePage` | Master chronological regulatory enforcement horizon (2023–2030) |
| `/app/products` | `ProductsPage` | Company product catalog with BOM materials and substance tracking |
| `/app/products/:id` | `ProductDetailPage` | Material concentration, CAS numbers, supplier link, and regulatory exposure |
| `/app/facilities` | `FacilitiesPage` | Industrial facility inventory with emissions, waste, and capacity metrics |
| `/app/facilities/:id` | `FacilityDetailPage` | Facility emissions profiles, process flows, and targeted compliance actions |
| `/app/processes` | `ProcessesPage` | Industrial manufacturing operations, energy metrics, and chemical inputs |
| `/app/suppliers` | `SuppliersPage` | Global supply chain directory, certifications, and compliance risk index |
| `/app/suppliers/:id` | `SupplierDetailPage` | Tier-1/2 supplier compliance profile and linked material dependencies |
| `/app/risks` | `RisksPage` | Enterprise 8-factor compliance risk matrix and exposure calculations |
| `/app/actions` | `ActionsPage` | Corrective compliance action items, assignees, deadlines, and statuses |
| `/app/actions/:id` | `ActionDetailPage` | Action execution console, evidence document submission, workflow review |
| `/app/deadlines` | `DeadlinesPage` | Regulatory calendar and statutory enforcement deadline tracker |
| `/app/alerts` | `AlertsPage` | Real-time regulatory drift notifications and severity alerts |
| `/app/documents` | `DocumentsPage` | Compliance document vault, evidence filings, and version records |
| `/app/assistant` | `AssistantPage` | Grounded AI Compliance Assistant powered by Gemini with live DB context |
| `/app/reports` | `ReportsPage` | Exportable dossiers (CSRD, EU CBAM, REACH PFAS, LkSG) in PDF/JSON/CSV |
| `/app/audit-log` | `AuditLogPage` | Immutable audit trail with cryptographic timestamps and JSON payload inspector |
| `/app/settings` | `SettingsPage` | Multi-tenant settings, notification preferences, and cloud integrations |

---

## 🗄️ Database Architecture (Supabase PostgreSQL)

The schema is defined in `/supabase/migrations/001_initial_schema.sql` (1,105 lines) and `prisma/schema.prisma`. It establishes:

- **Enums**: `Role`, `RegulationCategory`, `RegulationStatus`, `ChangeType`, `RiskLevel`, `ActionStatus`, `ReviewStatus`, `SourceType`
- **Multi-Tenant Tables**: `organizations`, `users`, `organization_members`
- **Regulatory Tables**: `jurisdictions`, `regulatory_sources`, `regulations`, `regulation_versions`, `regulatory_changes`, `regulatory_change_sections`
- **Company Asset Tables**: `facilities`, `products`, `product_materials`, `processes`, `facility_processes`, `product_facilities`, `suppliers`, `supplier_products`, `supplier_facilities`
- **Intelligence & Governance Tables**: `regulation_impacts`, `ai_analyses`, `compliance_actions`, `deadlines`, `alerts`, `documents`, `document_versions`, `audit_logs`, `notification_preferences`
- **Row-Level Security (RLS)**: Scoped to `organization_id` using JWT claims with role hierarchy enforcement.

---

## 🧪 Seeding & Demo Data: Apex Industrial Systems Corp.

The platform comes pre-seeded with complete data for **Apex Industrial Systems Corp.** (heavy industrial manufacturing & specialty chemicals):
- **4 Global Facilities**:
  - Dresden Advanced Materials Works (Germany)
  - Austin BioPlastics & Packaging Facility (Texas, USA)
  - Rotterdam Chemical Processing & Port Terminal (Netherlands)
  - Hsinchu Semiconductor Precision Coatings (Taiwan)
- **8 Commercial Products** (with detailed BOM, CAS numbers, and polymer formulations)
- **12 Global Suppliers** across Germany, USA, Taiwan, Japan, and Sweden
- **15 Industrial Processes** (fluoropolymer sintering, bio-resin extrusion, catalytic pyrolysis, solvent distillation)
- **26 Monitored Regulations** (EU CBAM, EU PPWR, REACH PFAS Restriction, CSRD, US TSCA, California SB 253, Germany LkSG, etc.)
- **16 Regulatory Drift Changes** with full side-by-side diff blocks and Gemini AI analysis
- **Compliance Actions & Deadlines** with assignees and evidence requirements

---

## 🚀 Quickstart & Local Setup

### 1. Prerequisites
- Node.js 18+ (tested on Node.js 22.x)
- npm 9+

### 2. Environment Configuration
Copy the provided environment templates:
```bash
cp .env.example .env
cp client/.env.example client/.env
```

Ensure `.env` contains your Gemini API key and Supabase details:
```env
PORT=5000
NODE_ENV=development
API_URL=http://localhost:5000
JWT_SECRET=super-secret-production-jwt-token-key-change-this-32-chars
GEMINI_API_KEY=your_gemini_api_key_here

# Supabase PostgreSQL
SUPABASE_URL=https://xniukiwokjkafyxymcpc.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
DATABASE_URL=postgresql://postgres.xniukiwokjkafyxymcpc:[YOUR_PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

### 3. Apply Supabase Database Migrations
Run the Supabase migration script:
```bash
npm run migrate:supabase
```

### 4. Build Application
Build both the server (TypeScript) and client (Vite):
```bash
npm run build
```

### 5. Run Tests
Execute the unit and integration test suite (Vitest + Supertest):
```bash
npm test
```

### 6. Start Development Servers
Run the full-stack development environment concurrently:
```bash
npm run dev
```
- Client interface: `http://localhost:5173`
- Backend API: `http://localhost:5000/api`
- Health check: `http://localhost:5000/health`

### 7. Demo Login Credentials
- **Email:** `elena.rostova@apexindustrial.com`
- **Password:** `Password123!`
- **Role:** `ADMIN` / `COMPLIANCE_MANAGER`

---

## 🌐 Production Deployment Guide (Render + Vercel)

The repository includes pre-configured deployment blueprints for both **Render** (Backend API) and **Vercel** (Frontend SPA).

### Part 1: Deploy Backend to Render

1. Log in to your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** → **Blueprint** (or **Web Service**).
3. Connect your GitHub repository: `https://github.com/msubhammsubham31-gif/AI-POLICY-TRACKER`.
4. Render will automatically detect [`render.yaml`](file:///c:/ai%20policy%20tracker/render.yaml) with these pre-configured settings:
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build:server`
   - **Start Command:** `npm run start` (executes `node server/dist/index.js`)
   - **Health Check Path:** `/health`
5. Under **Environment Variables**, provide your secret values:
   - `GEMINI_API_KEY`: Your Google Gemini API Key
   - `SUPABASE_URL`: `https://xniukiwokjkafyxymcpc.supabase.co`
   - `SUPABASE_ANON_KEY`: Your Supabase Anon Key
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase Service Role Key
   - `JWT_SECRET`: (Render auto-generates a secure 32+ character key)
6. Click **Apply** / **Create Web Service**.
7. Once deployed, Render will provide your public backend URL, e.g.:
   `https://regulamap-backend.onrender.com`

---

### Part 2: Deploy Frontend to Vercel

1. Log in to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New...** → **Project**.
3. Import your GitHub repository: `https://github.com/msubhammsubham31-gif/AI-POLICY-TRACKER`.
4. Configure the project settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `./` (or `client`)
   - The included [`vercel.json`](file:///c:/ai%20policy%20tracker/vercel.json) handles automatic SPA routing so deep links like `/app/dashboard` and `/app/regulations` never return 404 errors.
5. Under **Environment Variables**, add:
   - `VITE_API_URL`: `https://your-backend-name.onrender.com/api` (the Render URL from Part 1)
   - `VITE_SUPABASE_URL`: `https://xniukiwokjkafyxymcpc.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Key
6. Click **Deploy**.
7. Vercel will build and assign a global, high-performance domain:
   `https://ai-policy-tracker.vercel.app`

---

## 🔒 Security & Data Isolation
- **Strict Tenant Scoping:** Every query automatically filters by `organization_id` derived directly from verified JWT payloads.
- **Header Hardening:** Helmet middleware configured with CSP policies supporting MapLibre GL tiles.
- **Zero Client Secrets:** Google Gemini API keys and database credentials reside exclusively on the server.
- **Deterministic AI Fallback:** Graceful fallback handles any external network interruption without application degradation.
- **Immutable Version Hashing:** Legal source documents are hashed using SHA-256 ensuring regulatory modifications can never overwrite legal precedent.

---

## 📄 License
MIT © 2026 RegulaMap Engineering. All rights reserved.
