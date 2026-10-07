-- ============================================================================
-- RegulaMap Database Schema Migration: 001_initial_schema.sql
-- Enterprise AI Regulatory & Environmental Compliance Drift Tracking Platform
-- Target: Supabase Cloud PostgreSQL
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. ENUMS
-- ----------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE "Role" AS ENUM ('OWNER', 'ADMIN', 'COMPLIANCE_MANAGER', 'LEGAL_REVIEWER', 'ANALYST', 'VIEWER');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "RegulationCategory" AS ENUM (
    'EMISSIONS', 'CARBON', 'CLIMATE', 'CHEMICALS', 'WASTE', 'PACKAGING',
    'WATER', 'ENERGY', 'AIR_QUALITY', 'HAZARDOUS_MATERIALS', 'PRODUCT_STEWARDSHIP',
    'RECYCLING', 'DEFORESTATION', 'BIODIVERSITY', 'ESG_DISCLOSURE', 'SUPPLY_CHAIN', 'SUSTAINABILITY'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "RegulationStatus" AS ENUM ('PROPOSED', 'UNDER_REVIEW', 'ENACTED', 'AMENDED', 'REPEALED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "ChangeType" AS ENUM (
    'NEW_REGULATION', 'AMENDMENT', 'THRESHOLD_CHANGE', 'DEADLINE_CHANGE',
    'DEFINITION_CHANGE', 'SCOPE_CHANGE', 'REPORTING_CHANGE', 'PENALTY_CHANGE',
    'OBLIGATION_CHANGE', 'EXEMPTION_CHANGE', 'OTHER'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "RiskLevel" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFORMATIONAL');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "ActionStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'BLOCKED', 'UNDER_REVIEW', 'COMPLETED', 'WAIVED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'MODIFIED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "SourceType" AS ENUM ('OFFICIAL_API', 'OFFICIAL_WEBSITE', 'RSS', 'ATOM', 'DOCUMENT_FEED', 'MANUAL_UPLOAD');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ----------------------------------------------------------------------------
-- 2. CORE TABLES
-- ----------------------------------------------------------------------------

-- Organizations
CREATE TABLE IF NOT EXISTS "Organization" (
  "id" VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" VARCHAR(255) NOT NULL,
  "industry" VARCHAR(255) NOT NULL,
  "countries" TEXT[] NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users
CREATE TABLE IF NOT EXISTS "User" (
  "id" VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "email" VARCHAR(255) UNIQUE NOT NULL,
  "passwordHash" VARCHAR(255) NOT NULL,
  "fullName" VARCHAR(255) NOT NULL,
  "organizationId" VARCHAR(64) NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Organization Memberships (RBAC)
CREATE TABLE IF NOT EXISTS "OrganizationMember" (
  "id" VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "organizationId" VARCHAR(64) NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "userId" VARCHAR(64) NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "role" "Role" NOT NULL DEFAULT 'ANALYST',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "uq_org_member" UNIQUE ("organizationId", "userId")
);

-- Jurisdictions
CREATE TABLE IF NOT EXISTS "Jurisdiction" (
  "id" VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "code" VARCHAR(32) UNIQUE NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "country" VARCHAR(255) NOT NULL,
  "region" VARCHAR(255) NOT NULL,
  "latitude" DOUBLE PRECISION NOT NULL,
  "longitude" DOUBLE PRECISION NOT NULL
);

-- Regulatory Sources
CREATE TABLE IF NOT EXISTS "RegulatorySource" (
  "id" VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" VARCHAR(255) NOT NULL,
  "sourceType" "SourceType" NOT NULL DEFAULT 'OFFICIAL_WEBSITE',
  "url" TEXT NOT NULL,
  "jurisdictionId" VARCHAR(64) NOT NULL REFERENCES "Jurisdiction"("id") ON DELETE CASCADE,
  "lastPolledAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Regulations
CREATE TABLE IF NOT EXISTS "Regulation" (
  "id" VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "title" TEXT NOT NULL,
  "shortTitle" VARCHAR(255) NOT NULL,
  "jurisdictionId" VARCHAR(64) NOT NULL REFERENCES "Jurisdiction"("id") ON DELETE RESTRICT,
  "regulatorySourceId" VARCHAR(64) REFERENCES "RegulatorySource"("id") ON DELETE SET NULL,
  "country" VARCHAR(255) NOT NULL,
  "regulatoryBody" VARCHAR(255) NOT NULL,
  "category" "RegulationCategory" NOT NULL,
  "description" TEXT NOT NULL,
  "sourceUrl" TEXT NOT NULL,
  "publicationDate" TIMESTAMPTZ NOT NULL,
  "effectiveDate" TIMESTAMPTZ NOT NULL,
  "status" "RegulationStatus" NOT NULL DEFAULT 'ENACTED',
  "currentVersion" INTEGER NOT NULL DEFAULT 1,
  "applicability" TEXT NOT NULL,
  "industry" VARCHAR(255) NOT NULL,
  "penalties" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Regulation Versions (Immutable)
CREATE TABLE IF NOT EXISTS "RegulationVersion" (
  "id" VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "regulationId" VARCHAR(64) NOT NULL REFERENCES "Regulation"("id") ON DELETE CASCADE,
  "versionNumber" INTEGER NOT NULL,
  "sourceDocumentHash" VARCHAR(128) NOT NULL,
  "sourceUrl" TEXT NOT NULL,
  "rawDocument" TEXT NOT NULL,
  "normalizedText" TEXT NOT NULL,
  "publicationDate" TIMESTAMPTZ NOT NULL,
  "effectiveDate" TIMESTAMPTZ NOT NULL,
  "retrievedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "uq_reg_version" UNIQUE ("regulationId", "versionNumber")
);

-- Regulatory Changes (Drift)
CREATE TABLE IF NOT EXISTS "RegulatoryChange" (
  "id" VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "regulationId" VARCHAR(64) NOT NULL REFERENCES "Regulation"("id") ON DELETE CASCADE,
  "previousVersionId" VARCHAR(64) REFERENCES "RegulationVersion"("id") ON DELETE SET NULL,
  "newVersionId" VARCHAR(64) NOT NULL REFERENCES "RegulationVersion"("id") ON DELETE CASCADE,
  "changeType" "ChangeType" NOT NULL,
  "summary" TEXT NOT NULL,
  "changedSections" JSONB NOT NULL DEFAULT '[]',
  "severity" "RiskLevel" NOT NULL DEFAULT 'MEDIUM',
  "detectedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "effectiveDate" TIMESTAMPTZ NOT NULL,
  "reviewStatus" "ReviewStatus" NOT NULL DEFAULT 'PENDING'
);

-- Regulatory Change Sections (Clause-level Diffs)
CREATE TABLE IF NOT EXISTS "RegulatoryChangeSection" (
  "id" VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "regulatoryChangeId" VARCHAR(64) NOT NULL REFERENCES "RegulatoryChange"("id") ON DELETE CASCADE,
  "sectionIdentifier" VARCHAR(255) NOT NULL,
  "oldText" TEXT NOT NULL,
  "newText" TEXT NOT NULL,
  "changeType" "ChangeType" NOT NULL
);

-- Facilities
CREATE TABLE IF NOT EXISTS "Facility" (
  "id" VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "organizationId" VARCHAR(64) NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "name" VARCHAR(255) NOT NULL,
  "country" VARCHAR(255) NOT NULL,
  "location" VARCHAR(255) NOT NULL,
  "latitude" DOUBLE PRECISION NOT NULL,
  "longitude" DOUBLE PRECISION NOT NULL,
  "facilityType" VARCHAR(255) NOT NULL,
  "productionCapacity" VARCHAR(255) NOT NULL,
  "emissionsData" JSONB NOT NULL DEFAULT '{}',
  "waterUsage" JSONB NOT NULL DEFAULT '{}',
  "energyMetrics" JSONB NOT NULL DEFAULT '{}',
  "wasteOutput" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Products
CREATE TABLE IF NOT EXISTS "Product" (
  "id" VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "organizationId" VARCHAR(64) NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "name" VARCHAR(255) NOT NULL,
  "sku" VARCHAR(100) UNIQUE NOT NULL,
  "category" VARCHAR(255) NOT NULL,
  "markets" TEXT[] NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Suppliers
CREATE TABLE IF NOT EXISTS "Supplier" (
  "id" VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "organizationId" VARCHAR(64) NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "name" VARCHAR(255) NOT NULL,
  "country" VARCHAR(255) NOT NULL,
  "certifications" TEXT[] NOT NULL DEFAULT '{}',
  "complianceStatus" VARCHAR(100) NOT NULL DEFAULT 'COMPLIANT',
  "riskScore" DOUBLE PRECISION NOT NULL DEFAULT 15.0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Product Materials (Bill of Materials)
CREATE TABLE IF NOT EXISTS "ProductMaterial" (
  "id" VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "productId" VARCHAR(64) NOT NULL REFERENCES "Product"("id") ON DELETE CASCADE,
  "materialName" VARCHAR(255) NOT NULL,
  "casNumber" VARCHAR(64),
  "percentageWeight" DOUBLE PRECISION NOT NULL,
  "supplierId" VARCHAR(64) REFERENCES "Supplier"("id") ON DELETE SET NULL
);

-- Processes
CREATE TABLE IF NOT EXISTS "Process" (
  "id" VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT NOT NULL,
  "inputs" TEXT[] NOT NULL DEFAULT '{}',
  "chemicals" TEXT[] NOT NULL DEFAULT '{}',
  "emissions" TEXT[] NOT NULL DEFAULT '{}',
  "waste" TEXT[] NOT NULL DEFAULT '{}',
  "energyKw" DOUBLE PRECISION NOT NULL DEFAULT 0.0
);

-- Facility Processes (Junction)
CREATE TABLE IF NOT EXISTS "FacilityProcess" (
  "id" VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "facilityId" VARCHAR(64) NOT NULL REFERENCES "Facility"("id") ON DELETE CASCADE,
  "processId" VARCHAR(64) NOT NULL REFERENCES "Process"("id") ON DELETE CASCADE,
  CONSTRAINT "uq_fac_proc" UNIQUE ("facilityId", "processId")
);

-- Product Facility (Junction)
CREATE TABLE IF NOT EXISTS "ProductFacility" (
  "id" VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "productId" VARCHAR(64) NOT NULL REFERENCES "Product"("id") ON DELETE CASCADE,
  "facilityId" VARCHAR(64) NOT NULL REFERENCES "Facility"("id") ON DELETE CASCADE,
  CONSTRAINT "uq_prod_fac" UNIQUE ("productId", "facilityId")
);

-- Supplier Products (Junction)
CREATE TABLE IF NOT EXISTS "SupplierProduct" (
  "id" VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "supplierId" VARCHAR(64) NOT NULL REFERENCES "Supplier"("id") ON DELETE CASCADE,
  "productId" VARCHAR(64) NOT NULL REFERENCES "Product"("id") ON DELETE CASCADE,
  CONSTRAINT "uq_supp_prod" UNIQUE ("supplierId", "productId")
);

-- Supplier Facilities (Junction)
CREATE TABLE IF NOT EXISTS "SupplierFacility" (
  "id" VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "supplierId" VARCHAR(64) NOT NULL REFERENCES "Supplier"("id") ON DELETE CASCADE,
  "facilityId" VARCHAR(64) NOT NULL REFERENCES "Facility"("id") ON DELETE CASCADE,
  CONSTRAINT "uq_supp_fac" UNIQUE ("supplierId", "facilityId")
);

-- Regulation Impact (Graph Linkage)
CREATE TABLE IF NOT EXISTS "RegulationImpact" (
  "id" VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "regulationId" VARCHAR(64) NOT NULL REFERENCES "Regulation"("id") ON DELETE CASCADE,
  "regulatoryChangeId" VARCHAR(64) REFERENCES "RegulatoryChange"("id") ON DELETE SET NULL,
  "facilityId" VARCHAR(64) REFERENCES "Facility"("id") ON DELETE SET NULL,
  "productId" VARCHAR(64) REFERENCES "Product"("id") ON DELETE SET NULL,
  "processId" VARCHAR(64) REFERENCES "Process"("id") ON DELETE SET NULL,
  "supplierId" VARCHAR(64) REFERENCES "Supplier"("id") ON DELETE SET NULL,
  "impactLevel" "RiskLevel" NOT NULL DEFAULT 'MEDIUM',
  "reason" TEXT NOT NULL,
  "regulatoryRequirement" TEXT NOT NULL,
  "evidence" TEXT NOT NULL,
  "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.95,
  "recommendedAction" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AI Analysis (Grounded GenAI Model Outputs)
CREATE TABLE IF NOT EXISTS "AIAnalysis" (
  "id" VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "regulatoryChangeId" VARCHAR(64) NOT NULL REFERENCES "RegulatoryChange"("id") ON DELETE CASCADE,
  "summary" TEXT NOT NULL,
  "whatChanged" JSONB NOT NULL DEFAULT '[]',
  "whyItMatters" TEXT NOT NULL,
  "affectedProducts" JSONB NOT NULL DEFAULT '[]',
  "affectedFacilities" JSONB NOT NULL DEFAULT '[]',
  "affectedProcesses" JSONB NOT NULL DEFAULT '[]',
  "affectedSuppliers" JSONB NOT NULL DEFAULT '[]',
  "potentialObligations" JSONB NOT NULL DEFAULT '[]',
  "recommendedActions" JSONB NOT NULL DEFAULT '[]',
  "effectiveDate" TIMESTAMPTZ NOT NULL,
  "urgency" "RiskLevel" NOT NULL DEFAULT 'MEDIUM',
  "riskLevel" "RiskLevel" NOT NULL DEFAULT 'MEDIUM',
  "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.9,
  "requiresHumanReview" BOOLEAN NOT NULL DEFAULT TRUE,
  "sourceReferences" JSONB NOT NULL DEFAULT '[]',
  "reviewStatus" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
  "reviewerId" VARCHAR(64) REFERENCES "User"("id") ON DELETE SET NULL,
  "reviewNotes" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Compliance Actions
CREATE TABLE IF NOT EXISTS "ComplianceAction" (
  "id" VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "organizationId" VARCHAR(64) NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT NOT NULL,
  "regulationId" VARCHAR(64) REFERENCES "Regulation"("id") ON DELETE SET NULL,
  "facilityId" VARCHAR(64) REFERENCES "Facility"("id") ON DELETE SET NULL,
  "productId" VARCHAR(64) REFERENCES "Product"("id") ON DELETE SET NULL,
  "processId" VARCHAR(64) REFERENCES "Process"("id") ON DELETE SET NULL,
  "supplierId" VARCHAR(64) REFERENCES "Supplier"("id") ON DELETE SET NULL,
  "ownerId" VARCHAR(64) REFERENCES "User"("id") ON DELETE SET NULL,
  "priority" "RiskLevel" NOT NULL DEFAULT 'HIGH',
  "status" "ActionStatus" NOT NULL DEFAULT 'OPEN',
  "dueDate" TIMESTAMPTZ NOT NULL,
  "evidenceRequired" TEXT NOT NULL,
  "completionNotes" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Deadlines
CREATE TABLE IF NOT EXISTS "Deadline" (
  "id" VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "complianceActionId" VARCHAR(64) REFERENCES "ComplianceAction"("id") ON DELETE CASCADE,
  "title" VARCHAR(255) NOT NULL,
  "dueDate" TIMESTAMPTZ NOT NULL,
  "category" "RegulationCategory" NOT NULL,
  "isMilestone" BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Alerts
CREATE TABLE IF NOT EXISTS "Alert" (
  "id" VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "organizationId" VARCHAR(64) NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "title" VARCHAR(255) NOT NULL,
  "message" TEXT NOT NULL,
  "severity" "RiskLevel" NOT NULL DEFAULT 'MEDIUM',
  "read" BOOLEAN NOT NULL DEFAULT FALSE,
  "deadlineId" VARCHAR(64) REFERENCES "Deadline"("id") ON DELETE SET NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Documents & Evidence Vault
CREATE TABLE IF NOT EXISTS "Document" (
  "id" VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "organizationId" VARCHAR(64) NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "title" VARCHAR(255) NOT NULL,
  "fileType" VARCHAR(64) NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "fileSize" INTEGER NOT NULL DEFAULT 0,
  "regulationId" VARCHAR(64) REFERENCES "Regulation"("id") ON DELETE SET NULL,
  "facilityId" VARCHAR(64) REFERENCES "Facility"("id") ON DELETE SET NULL,
  "productId" VARCHAR(64) REFERENCES "Product"("id") ON DELETE SET NULL,
  "supplierId" VARCHAR(64) REFERENCES "Supplier"("id") ON DELETE SET NULL,
  "complianceActionId" VARCHAR(64) REFERENCES "ComplianceAction"("id") ON DELETE SET NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "DocumentVersion" (
  "id" VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "documentId" VARCHAR(64) NOT NULL REFERENCES "Document"("id") ON DELETE CASCADE,
  "versionNumber" INTEGER NOT NULL DEFAULT 1,
  "fileUrl" TEXT NOT NULL,
  "uploadedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Immutable Audit Log
CREATE TABLE IF NOT EXISTS "AuditLog" (
  "id" VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "organizationId" VARCHAR(64) NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "userId" VARCHAR(64) REFERENCES "User"("id") ON DELETE SET NULL,
  "action" VARCHAR(255) NOT NULL,
  "entityType" VARCHAR(100) NOT NULL,
  "entityId" VARCHAR(64) NOT NULL,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "ipAddress" VARCHAR(64),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notification Preferences
CREATE TABLE IF NOT EXISTS "NotificationPreference" (
  "id" VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "organizationId" VARCHAR(64) NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "channel" VARCHAR(32) NOT NULL DEFAULT 'IN_APP',
  "frequency" VARCHAR(32) NOT NULL DEFAULT 'IMMEDIATE',
  "criticalOnly" BOOLEAN NOT NULL DEFAULT FALSE
);

-- ----------------------------------------------------------------------------
-- 3. INDEXES
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS "idx_user_org" ON "User"("organizationId");
CREATE INDEX IF NOT EXISTS "idx_reg_cat" ON "Regulation"("category");
CREATE INDEX IF NOT EXISTS "idx_reg_jurisdiction" ON "Regulation"("jurisdictionId");
CREATE INDEX IF NOT EXISTS "idx_change_reg" ON "RegulatoryChange"("regulationId");
CREATE INDEX IF NOT EXISTS "idx_facility_org" ON "Facility"("organizationId");
CREATE INDEX IF NOT EXISTS "idx_product_org" ON "Product"("organizationId");
CREATE INDEX IF NOT EXISTS "idx_supplier_org" ON "Supplier"("organizationId");
CREATE INDEX IF NOT EXISTS "idx_action_org" ON "ComplianceAction"("organizationId");
CREATE INDEX IF NOT EXISTS "idx_action_status" ON "ComplianceAction"("status");
CREATE INDEX IF NOT EXISTS "idx_alert_org" ON "Alert"("organizationId");
CREATE INDEX IF NOT EXISTS "idx_audit_org" ON "AuditLog"("organizationId");
CREATE INDEX IF NOT EXISTS "idx_audit_created" ON "AuditLog"("createdAt" DESC);

-- ----------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE "Organization" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrganizationMember" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Jurisdiction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RegulatorySource" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Regulation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RegulationVersion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RegulatoryChange" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RegulatoryChangeSection" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Facility" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Supplier" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProductMaterial" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Process" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FacilityProcess" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProductFacility" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SupplierProduct" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SupplierFacility" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RegulationImpact" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AIAnalysis" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ComplianceAction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Deadline" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Alert" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Document" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DocumentVersion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "NotificationPreference" ENABLE ROW LEVEL SECURITY;

-- Allow Service Role full access to all tables
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "service_role_all" ON %I;', tbl);
    EXECUTE format('CREATE POLICY "service_role_all" ON %I FOR ALL TO service_role USING (true) WITH CHECK (true);', tbl);
    -- Public / Anon read policy for reference data
    IF tbl IN ('Jurisdiction', 'RegulatorySource', 'Regulation', 'RegulationVersion', 'RegulatoryChange', 'RegulatoryChangeSection', 'Process') THEN
      EXECUTE format('DROP POLICY IF EXISTS "public_read_ref" ON %I;', tbl);
      EXECUTE format('CREATE POLICY "public_read_ref" ON %I FOR SELECT TO anon, authenticated USING (true);', tbl);
    END IF;
  END LOOP;
END $$;

-- Facilities
INSERT INTO "Facility" ("id", "organizationId", "name", "country", "location", "latitude", "longitude", "facilityType", "productionCapacity", "emissionsData", "waterUsage", "energyMetrics", "wasteOutput")
VALUES ('fac-001', 'org-apex-001', 'Apex Advanced Materials — Dresden', 'Germany', 'Silicon Saxony TechPark, Dresden, Saxony, Germany', 51.0504, 13.7373, 'Chemical Synthesis & Specialty Fluoropolymer Plant', '45,000 MT / annum', '{"scope1_co2e_mt":12400,"scope2_co2e_mt":8900,"scope3_co2e_mt":34200,"voc_emissions_kg":840,"nox_kg":450}'::jsonb, '{"annual_m3":185000,"recycling_rate_pct":78.4,"discharge_purity_pct":99.1}'::jsonb, '{"mwh_consumed":38400,"renewable_pct":62,"ppa_contracts":["Vattenfall Wind 20MW"]}'::jsonb, '{"hazardous_waste_mt":310,"non_hazardous_waste_mt":1250,"landfill_diversion_pct":94.2}'::jsonb)
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Facility" ("id", "organizationId", "name", "country", "location", "latitude", "longitude", "facilityType", "productionCapacity", "emissionsData", "waterUsage", "energyMetrics", "wasteOutput")
VALUES ('fac-002', 'org-apex-001', 'Apex BioPlastics & Packaging — Austin', 'United States', 'Met Center Industrial Blvd, Austin, TX, USA', 30.2672, -97.7431, 'Advanced Polymer Extrusion & Bio-Resin Formulation', '60,000 MT / annum', '{"scope1_co2e_mt":8200,"scope2_co2e_mt":14500,"scope3_co2e_mt":48900,"voc_emissions_kg":320,"nox_kg":210}'::jsonb, '{"annual_m3":92000,"recycling_rate_pct":85,"discharge_purity_pct":99.8}'::jsonb, '{"mwh_consumed":42100,"renewable_pct":48.5,"solar_onsite_mw":3.2}'::jsonb, '{"hazardous_waste_mt":45,"non_hazardous_waste_mt":890,"landfill_diversion_pct":98.1}'::jsonb)
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Facility" ("id", "organizationId", "name", "country", "location", "latitude", "longitude", "facilityType", "productionCapacity", "emissionsData", "waterUsage", "energyMetrics", "wasteOutput")
VALUES ('fac-003', 'org-apex-001', 'Apex Chemical Refineries — Antwerp', 'Belgium', 'Port of Antwerp-Bruges Chemical Cluster, Antwerp, Belgium', 51.2194, 4.4025, 'Petrochemical Distillation & Industrial Solvent Purification', '120,000 MT / annum', '{"scope1_co2e_mt":38900,"scope2_co2e_mt":22100,"scope3_co2e_mt":98000,"voc_emissions_kg":1850,"so2_kg":920}'::jsonb, '{"annual_m3":450000,"recycling_rate_pct":82.5,"discharge_purity_pct":98.9}'::jsonb, '{"mwh_consumed":110500,"renewable_pct":55,"cogen_heat_recovery_pct":65}'::jsonb, '{"hazardous_waste_mt":890,"non_hazardous_waste_mt":3400,"landfill_diversion_pct":91.5}'::jsonb)
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Facility" ("id", "organizationId", "name", "country", "location", "latitude", "longitude", "facilityType", "productionCapacity", "emissionsData", "waterUsage", "energyMetrics", "wasteOutput")
VALUES ('fac-004', 'org-apex-001', 'Apex Battery Assembly & Testing — Osaka', 'Japan', 'Kansai Industrial Coastal Zone, Osaka, Japan', 34.6937, 135.5023, 'High-Density Lithium-Ion Pack Assembly & Cell Testing', '1.2 GWh / annum', '{"scope1_co2e_mt":4100,"scope2_co2e_mt":9800,"scope3_co2e_mt":62000,"voc_emissions_kg":110,"nox_kg":85}'::jsonb, '{"annual_m3":64000,"recycling_rate_pct":91.2,"discharge_purity_pct":99.9}'::jsonb, '{"mwh_consumed":29000,"renewable_pct":71,"clean_grid_cert":true}'::jsonb, '{"hazardous_waste_mt":120,"non_hazardous_waste_mt":430,"landfill_diversion_pct":97.4}'::jsonb)
ON CONFLICT ("id") DO NOTHING;

-- Products
INSERT INTO "Product" ("id", "organizationId", "name", "sku", "category", "markets")
VALUES ('prod-001', 'org-apex-001', 'Apex-Fluor 400 Protective Polymer', 'AF400-EUR-01', 'Specialty Coatings', ARRAY['EU','US','JP'])
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Product" ("id", "organizationId", "name", "sku", "category", "markets")
VALUES ('prod-002', 'org-apex-001', 'EcoPack Ultra-Barrier Food Film', 'EP-UBF-09', 'Circular Packaging', ARRAY['EU','UK','US'])
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Product" ("id", "organizationId", "name", "sku", "category", "markets")
VALUES ('prod-003', 'org-apex-001', 'PowerCell X9 High-Density Storage Pack', 'PCX9-BAT-48V', 'Industrial Energy Storage', ARRAY['EU','US','JP','UK'])
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Product" ("id", "organizationId", "name", "sku", "category", "markets")
VALUES ('prod-004', 'org-apex-001', 'SynthoFlex High-Temp Fluoroelastomer', 'SF-ELAST-22', 'Engineered Polymers', ARRAY['EU','US'])
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Product" ("id", "organizationId", "name", "sku", "category", "markets")
VALUES ('prod-005', 'org-apex-001', 'ThermBarrier Cryogenic Aerogel Blanket', 'TBA-INSUL-01', 'Thermal Insulation', ARRAY['EU','US','DE'])
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Product" ("id", "organizationId", "name", "sku", "category", "markets")
VALUES ('prod-006', 'org-apex-001', 'CryoSeal Liquid Gasket Anaerobic Compound', 'CSL-GAS-88', 'Industrial Adhesives & Sealants', ARRAY['EU','BE','DE'])
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Product" ("id", "organizationId", "name", "sku", "category", "markets")
VALUES ('prod-007', 'org-apex-001', 'PureVolt Polymeric Conductive Separator', 'PVC-POLY-10', 'Battery Component Materials', ARRAY['EU','JP','US'])
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Product" ("id", "organizationId", "name", "sku", "category", "markets")
VALUES ('prod-008', 'org-apex-001', 'BioSolv Heavy Industrial Degreaser', 'BS-DEGR-55', 'Green Solvents & Cleaners', ARRAY['US','EU','UK'])
ON CONFLICT ("id") DO NOTHING;

-- Suppliers
INSERT INTO "Supplier" ("id", "organizationId", "name", "country", "certifications", "complianceStatus", "riskScore")
VALUES ('supp-001', 'org-apex-001', 'Tokyo ChemCorp Ltd.', 'Japan', ARRAY['ISO 14001','ISO 9001','EcoVadis Gold'], 'COMPLIANT', 12.5)
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Supplier" ("id", "organizationId", "name", "country", "certifications", "complianceStatus", "riskScore")
VALUES ('supp-002', 'org-apex-001', 'BASF SE Specialty Monomers', 'Germany', ARRAY['ISO 14001','EMAS','TfS Together for Sustainability'], 'COMPLIANT', 8)
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Supplier" ("id", "organizationId", "name", "country", "certifications", "complianceStatus", "riskScore")
VALUES ('supp-003', 'org-apex-001', 'Nordic Bio-Polymers AB', 'Sweden', ARRAY['ISCC PLUS','FSC Certified','ISO 50001'], 'COMPLIANT', 6.2)
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Supplier" ("id", "organizationId", "name", "country", "certifications", "complianceStatus", "riskScore")
VALUES ('supp-004', 'org-apex-001', 'Rio Tinto Battery Materials Corp.', 'Australia', ARRAY['IRMA Verified','ISO 14001'], 'UNDER_REVIEW', 28.4)
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Supplier" ("id", "organizationId", "name", "country", "certifications", "complianceStatus", "riskScore")
VALUES ('supp-005', 'org-apex-001', 'Solvay Specialty Chemicals Belgium', 'Belgium', ARRAY['ISO 14001','Responsible Care'], 'COMPLIANT', 14.1)
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Supplier" ("id", "organizationId", "name", "country", "certifications", "complianceStatus", "riskScore")
VALUES ('supp-006', 'org-apex-001', 'Shin-Etsu Specialty Silicones', 'Japan', ARRAY['ISO 14001','Sony Green Partner'], 'COMPLIANT', 10.5)
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Supplier" ("id", "organizationId", "name", "country", "certifications", "complianceStatus", "riskScore")
VALUES ('supp-007', 'org-apex-001', 'Formosa Advanced Petrochemicals', 'Taiwan', ARRAY['ISO 9001'], 'HIGH_RISK', 54)
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Supplier" ("id", "organizationId", "name", "country", "certifications", "complianceStatus", "riskScore")
VALUES ('supp-008', 'org-apex-001', 'DuPont Industrial Fluoromaterials', 'United States', ARRAY['ISO 14001','Responsible Care'], 'UNDER_REVIEW', 35.8)
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Supplier" ("id", "organizationId", "name", "country", "certifications", "complianceStatus", "riskScore")
VALUES ('supp-009', 'org-apex-001', 'Umicore Cathode Refining NV', 'Belgium', ARRAY['RMI Conflict Free','ISO 14001','EcoVadis Platinum'], 'COMPLIANT', 7.2)
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Supplier" ("id", "organizationId", "name", "country", "certifications", "complianceStatus", "riskScore")
VALUES ('supp-010', 'org-apex-001', 'LG Energy Materials South Korea', 'South Korea', ARRAY['ISO 14001','RE100 Signatory'], 'COMPLIANT', 15)
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Supplier" ("id", "organizationId", "name", "country", "certifications", "complianceStatus", "riskScore")
VALUES ('supp-011', 'org-apex-001', 'Air Liquide Industrial Gases SA', 'France', ARRAY['ISO 14001','ISO 50001'], 'COMPLIANT', 5.5)
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Supplier" ("id", "organizationId", "name", "country", "certifications", "complianceStatus", "riskScore")
VALUES ('supp-012', 'org-apex-001', 'Stora Enso Circular Packaging Solutions', 'Finland', ARRAY['PEFC','FSC Chain of Custody','EU Ecolabel'], 'COMPLIANT', 4.8)
ON CONFLICT ("id") DO NOTHING;

-- Processes
INSERT INTO "Process" ("id", "name", "description", "inputs", "chemicals", "emissions", "waste", "energyKw")
VALUES ('proc-001', 'Fluoropolymer Heat Curing & Sintering', 'Thermal treatment of fluoropolymer matrix at 380°C in inert nitrogen atmosphere to establish cross-linking.', ARRAY['Fluoro-dispersions','Nitrogen 99.99%'], ARRAY['Perfluoroalkyl precursors','Ammonium salt surfactant'], ARRAY['Trace trace VOC','CO2 heat loss'], ARRAY['Filter particulate cake'], 450)
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Process" ("id", "name", "description", "inputs", "chemicals", "emissions", "waste", "energyKw")
VALUES ('proc-002', 'Acid Leaching & Neutralization', 'Hydrometallurgical extraction and subsequent neutralization of reactive salts in wet scrubbers.', ARRAY['Sulfuric Acid 98%','Sodium Hydroxide 50%'], ARRAY['H2SO4','NaOH','Calcium hydroxide'], ARRAY['Scrubber water vapor'], ARRAY['Neutralized Gypsum Sludge (non-haz)'], 120)
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Process" ("id", "name", "description", "inputs", "chemicals", "emissions", "waste", "energyKw")
VALUES ('proc-003', 'Solvent Recovery & Multi-Stage Distillation', 'Vacuum distillation cycle recovering 98.5% of isopropyl alcohol and ethyl acetate solvents.', ARRAY['Spent solvent stream'], ARRAY['Isopropanol','Ethyl Acetate','Toluene traces'], ARRAY['Condenser vent off-gas (abated)'], ARRAY['Still bottom distillation residue'], 880)
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Process" ("id", "name", "description", "inputs", "chemicals", "emissions", "waste", "energyKw")
VALUES ('proc-004', 'Cathode Slurry Mixing & Ultrasonic Dispersal', 'Homogenization of NMC cathode active material, carbon black, and PVDF binder in NMP.', ARRAY['NMC Powder','Carbon Black','NMP solvent'], ARRAY['N-Methyl-2-pyrrolidone (CAS 872-50-4)'], ARRAY['NMP vapor captured via condenser'], ARRAY['Scraper residue'], 310)
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Process" ("id", "name", "description", "inputs", "chemicals", "emissions", "waste", "energyKw")
VALUES ('proc-005', 'High-Pressure Bio-Resin Extrusion', 'Twin-screw compounding and continuous extrusion of PLA/PHA biocomposite films.', ARRAY['Bio-PLA Pellets','Cellulose nanofibrils'], ARRAY['Citric acid plasticizer'], ARRAY['Negligible bio-steam'], ARRAY['Extruder purge trimmings (recycled)'], 560)
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Process" ("id", "name", "description", "inputs", "chemicals", "emissions", "waste", "energyKw")
VALUES ('proc-006', 'Plasma Surface Activation & Corona Discharge', 'Atmospheric pressure dielectric barrier discharge modifying surface polarity for bonding.', ARRAY['High-voltage electrical power','Compressed dry air'], ARRAY['Ozone (catalytically destroyed)'], ARRAY['De-ozonized exhaust'], ARRAY['None'], 85)
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Process" ("id", "name", "description", "inputs", "chemicals", "emissions", "waste", "energyKw")
VALUES ('proc-007', 'Nitrogen Blanket Chemical Synthesis', 'Closed-vessel organic synthesis of elastomeric precursors under pressurized N2 blanketing.', ARRAY['Monomer batch','Polymerization initiator'], ARRAY['Organic peroxides','Specialty amines'], ARRAY['Rupture disc vent to flare stack'], ARRAY['Cleaning rinse water'], 240)
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Process" ("id", "name", "description", "inputs", "chemicals", "emissions", "waste", "energyKw")
VALUES ('proc-008', 'Regenerative Thermal Oxidation (RTO)', 'Ceramic bed heat exchange oxidizing volatile organics at 850°C with 99.5% destruction efficiency.', ARRAY['Facility exhaust duct gas'], ARRAY['Methane assist fuel'], ARRAY['CO2','H2O vapor','Ultra-low NOx'], ARRAY['Spent ceramic media (annual)'], 1100)
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Process" ("id", "name", "description", "inputs", "chemicals", "emissions", "waste", "energyKw")
VALUES ('proc-009', 'Wastewater Heavy Metal Precipitation', 'Chemical reduction, sulfide precipitation, and clarifier settling for heavy metals removal.', ARRAY['Industrial effluent'], ARRAY['Ferric chloride','Sodium dimethyldithiocarbamate'], ARRAY['None'], ARRAY['Dewatered metal hydroxide cake'], 95)
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Process" ("id", "name", "description", "inputs", "chemicals", "emissions", "waste", "energyKw")
VALUES ('proc-010', 'Supercritical CO2 Precision Cleansing', 'Extraction of trace oils and microscopic contaminants from precision battery tabs using SC-CO2.', ARRAY['Liquid CO2','Chamber pressure 100 bar'], ARRAY['Carbon dioxide (re-liquefied)'], ARRAY['Closed loop recycling 96%'], ARRAY['Extracted hydrocarbon residue'], 180)
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Process" ("id", "name", "description", "inputs", "chemicals", "emissions", "waste", "energyKw")
VALUES ('proc-011', 'Continuous Vulcanization & Post-Cure Oven', 'Hot-air vulcanization tunnel followed by secondary degassing post-cure at 200°C for 4 hours.', ARRAY['Green extruded elastomer'], ARRAY['Silane crosslinkers','Zinc oxide'], ARRAY['Oven exhaust to carbon filters'], ARRAY['Flash trimmings'], 620)
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Process" ("id", "name", "description", "inputs", "chemicals", "emissions", "waste", "energyKw")
VALUES ('proc-012', 'Automated Cylindrical Cell Laser Tab Welding', 'Fiber laser welding of nickel-plated copper busbars onto battery cell terminals.', ARRAY['Cells','Copper busbars','Laser optical line'], ARRAY['None'], ARRAY['Laser fume extractor dust'], ARRAY['HEPA dust filter'], 75)
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Process" ("id", "name", "description", "inputs", "chemicals", "emissions", "waste", "energyKw")
VALUES ('proc-013', 'Bio-Feedstock Enzymatic Polymerization', 'Low-temperature catalytic conversion of plant starches into packaging polyesters.', ARRAY['Agricultural starch syrup','Enzyme cocktails'], ARRAY['Enzyme biocatalyst'], ARRAY['Biogenic CO2'], ARRAY['Spent biomass cake for soil amendment'], 140)
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Process" ("id", "name", "description", "inputs", "chemicals", "emissions", "waste", "energyKw")
VALUES ('proc-014', 'VOC Carbon Bed Adsorption & Desorption', 'Dual-canister activated carbon filter bank removing chlorinated and fluorinated VOCs.', ARRAY['Process exhaust'], ARRAY['Granular activated carbon'], ARRAY['Clean air discharge < 1 ppm VOC'], ARRAY['Spent carbon for thermal regeneration'], 190)
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Process" ("id", "name", "description", "inputs", "chemicals", "emissions", "waste", "energyKw")
VALUES ('proc-015', 'Pyrolysis Char Gasification & Heat Recovery', 'High-temperature thermal cracking of waste plastic scrap generating synthesis fuel gas.', ARRAY['Internal production plastic scrap'], ARRAY['Synthetic syngas'], ARRAY['Clean flue gas to heat recovery boiler'], ARRAY['Inert ash residue'], 750)
ON CONFLICT ("id") DO NOTHING;

-- Facility Processes
INSERT INTO "FacilityProcess" ("id", "facilityId", "processId") VALUES ('fp-1', 'fac-001', 'proc-001') ON CONFLICT ("facilityId", "processId") DO NOTHING;
INSERT INTO "FacilityProcess" ("id", "facilityId", "processId") VALUES ('fp-2', 'fac-001', 'proc-002') ON CONFLICT ("facilityId", "processId") DO NOTHING;
INSERT INTO "FacilityProcess" ("id", "facilityId", "processId") VALUES ('fp-3', 'fac-001', 'proc-008') ON CONFLICT ("facilityId", "processId") DO NOTHING;
INSERT INTO "FacilityProcess" ("id", "facilityId", "processId") VALUES ('fp-4', 'fac-001', 'proc-009') ON CONFLICT ("facilityId", "processId") DO NOTHING;
INSERT INTO "FacilityProcess" ("id", "facilityId", "processId") VALUES ('fp-5', 'fac-002', 'proc-005') ON CONFLICT ("facilityId", "processId") DO NOTHING;
INSERT INTO "FacilityProcess" ("id", "facilityId", "processId") VALUES ('fp-6', 'fac-002', 'proc-006') ON CONFLICT ("facilityId", "processId") DO NOTHING;
INSERT INTO "FacilityProcess" ("id", "facilityId", "processId") VALUES ('fp-7', 'fac-002', 'proc-008') ON CONFLICT ("facilityId", "processId") DO NOTHING;
INSERT INTO "FacilityProcess" ("id", "facilityId", "processId") VALUES ('fp-8', 'fac-002', 'proc-014') ON CONFLICT ("facilityId", "processId") DO NOTHING;
INSERT INTO "FacilityProcess" ("id", "facilityId", "processId") VALUES ('fp-9', 'fac-003', 'proc-002') ON CONFLICT ("facilityId", "processId") DO NOTHING;
INSERT INTO "FacilityProcess" ("id", "facilityId", "processId") VALUES ('fp-10', 'fac-003', 'proc-003') ON CONFLICT ("facilityId", "processId") DO NOTHING;
INSERT INTO "FacilityProcess" ("id", "facilityId", "processId") VALUES ('fp-11', 'fac-003', 'proc-007') ON CONFLICT ("facilityId", "processId") DO NOTHING;
INSERT INTO "FacilityProcess" ("id", "facilityId", "processId") VALUES ('fp-12', 'fac-003', 'proc-008') ON CONFLICT ("facilityId", "processId") DO NOTHING;
INSERT INTO "FacilityProcess" ("id", "facilityId", "processId") VALUES ('fp-13', 'fac-003', 'proc-009') ON CONFLICT ("facilityId", "processId") DO NOTHING;
INSERT INTO "FacilityProcess" ("id", "facilityId", "processId") VALUES ('fp-14', 'fac-004', 'proc-004') ON CONFLICT ("facilityId", "processId") DO NOTHING;
INSERT INTO "FacilityProcess" ("id", "facilityId", "processId") VALUES ('fp-15', 'fac-004', 'proc-006') ON CONFLICT ("facilityId", "processId") DO NOTHING;
INSERT INTO "FacilityProcess" ("id", "facilityId", "processId") VALUES ('fp-16', 'fac-004', 'proc-010') ON CONFLICT ("facilityId", "processId") DO NOTHING;
INSERT INTO "FacilityProcess" ("id", "facilityId", "processId") VALUES ('fp-17', 'fac-004', 'proc-012') ON CONFLICT ("facilityId", "processId") DO NOTHING;

-- Product Facilities
INSERT INTO "ProductFacility" ("id", "productId", "facilityId") VALUES ('pf-1', 'prod-001', 'fac-001') ON CONFLICT ("productId", "facilityId") DO NOTHING;
INSERT INTO "ProductFacility" ("id", "productId", "facilityId") VALUES ('pf-2', 'prod-004', 'fac-001') ON CONFLICT ("productId", "facilityId") DO NOTHING;
INSERT INTO "ProductFacility" ("id", "productId", "facilityId") VALUES ('pf-3', 'prod-005', 'fac-001') ON CONFLICT ("productId", "facilityId") DO NOTHING;
INSERT INTO "ProductFacility" ("id", "productId", "facilityId") VALUES ('pf-4', 'prod-002', 'fac-002') ON CONFLICT ("productId", "facilityId") DO NOTHING;
INSERT INTO "ProductFacility" ("id", "productId", "facilityId") VALUES ('pf-5', 'prod-008', 'fac-002') ON CONFLICT ("productId", "facilityId") DO NOTHING;
INSERT INTO "ProductFacility" ("id", "productId", "facilityId") VALUES ('pf-6', 'prod-004', 'fac-003') ON CONFLICT ("productId", "facilityId") DO NOTHING;
INSERT INTO "ProductFacility" ("id", "productId", "facilityId") VALUES ('pf-7', 'prod-006', 'fac-003') ON CONFLICT ("productId", "facilityId") DO NOTHING;
INSERT INTO "ProductFacility" ("id", "productId", "facilityId") VALUES ('pf-8', 'prod-008', 'fac-003') ON CONFLICT ("productId", "facilityId") DO NOTHING;
INSERT INTO "ProductFacility" ("id", "productId", "facilityId") VALUES ('pf-9', 'prod-003', 'fac-004') ON CONFLICT ("productId", "facilityId") DO NOTHING;
INSERT INTO "ProductFacility" ("id", "productId", "facilityId") VALUES ('pf-10', 'prod-007', 'fac-004') ON CONFLICT ("productId", "facilityId") DO NOTHING;

-- Product Materials
INSERT INTO "ProductMaterial" ("id", "productId", "materialName", "casNumber", "percentageWeight", "supplierId")
VALUES ('mat-001', 'prod-001', 'Polytetrafluoroethylene dispersion', '9002-84-0', 65.5, 'supp-008') ON CONFLICT ("id") DO NOTHING;
INSERT INTO "ProductMaterial" ("id", "productId", "materialName", "casNumber", "percentageWeight", "supplierId")
VALUES ('mat-002', 'prod-001', 'Fluorosurfactant fluorinated wetting aid', '29420-49-3', 2.5, 'supp-008') ON CONFLICT ("id") DO NOTHING;
INSERT INTO "ProductMaterial" ("id", "productId", "materialName", "casNumber", "percentageWeight", "supplierId")
VALUES ('mat-003', 'prod-001', 'Titanium dioxide pigment', '13463-67-7', 32, 'supp-002') ON CONFLICT ("id") DO NOTHING;
INSERT INTO "ProductMaterial" ("id", "productId", "materialName", "casNumber", "percentageWeight", "supplierId")
VALUES ('mat-004', 'prod-002', 'Polyhydroxyalkanoate (PHA) bio-resin', '26744-04-7', 58, 'supp-003') ON CONFLICT ("id") DO NOTHING;
INSERT INTO "ProductMaterial" ("id", "productId", "materialName", "casNumber", "percentageWeight", "supplierId")
VALUES ('mat-005', 'prod-002', 'Wood-derived microfibrillated cellulose', '9004-34-6', 35, 'supp-012') ON CONFLICT ("id") DO NOTHING;
INSERT INTO "ProductMaterial" ("id", "productId", "materialName", "casNumber", "percentageWeight", "supplierId")
VALUES ('mat-006', 'prod-002', 'Epoxidized soybean oil barrier plasticizer', '8013-07-8', 7, 'supp-003') ON CONFLICT ("id") DO NOTHING;
INSERT INTO "ProductMaterial" ("id", "productId", "materialName", "casNumber", "percentageWeight", "supplierId")
VALUES ('mat-007', 'prod-003', 'Lithium Nickel Manganese Cobalt Oxide (NMC 811)', '346417-97-8', 45, 'supp-009') ON CONFLICT ("id") DO NOTHING;
INSERT INTO "ProductMaterial" ("id", "productId", "materialName", "casNumber", "percentageWeight", "supplierId")
VALUES ('mat-008', 'prod-003', 'Battery-grade synthetic graphite', '7782-42-5', 28, 'supp-004') ON CONFLICT ("id") DO NOTHING;
INSERT INTO "ProductMaterial" ("id", "productId", "materialName", "casNumber", "percentageWeight", "supplierId")
VALUES ('mat-009', 'prod-003', 'Polyvinylidene fluoride (PVDF) binder', '24937-79-9', 4, 'supp-005') ON CONFLICT ("id") DO NOTHING;
INSERT INTO "ProductMaterial" ("id", "productId", "materialName", "casNumber", "percentageWeight", "supplierId")
VALUES ('mat-010', 'prod-003', 'Lithium hexafluorophosphate electrolyte', '21324-40-3', 12, 'supp-010') ON CONFLICT ("id") DO NOTHING;
INSERT INTO "ProductMaterial" ("id", "productId", "materialName", "casNumber", "percentageWeight", "supplierId")
VALUES ('mat-011', 'prod-003', 'Aluminum and copper foil conductors', '7429-90-5', 11, 'supp-001') ON CONFLICT ("id") DO NOTHING;

-- Master Regulations (26 items)
INSERT INTO "Regulation" ("id", "title", "shortTitle", "jurisdictionId", "country", "regulatoryBody", "category", "description", "sourceUrl", "publicationDate", "effectiveDate", "status", "currentVersion", "applicability", "industry", "penalties")
VALUES ('reg-001', 'EU Corporate Sustainability Reporting Directive (CSRD) & ESRS Environmental Standards', 'EU CSRD Directive 2022/2464', 'jur-eu', 'European Union', 'European Commission / EFRAG', 'ESG_DISCLOSURE'::"RegulationCategory", 'Mandatory double-materiality sustainability reporting covering Scope 1, 2, and upstream/downstream Scope 3 emissions, circular economy metrics, and biodiversity impacts under strict digital tagging rules.', 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022L2464', '2023-01-05T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz, 'ENACTED'::"RegulationStatus", 3, 'All large EU entities (>250 employees or >€50M turnover) and non-EU companies with >€150M EU revenue.', 'Cross-industry, Manufacturing, Specialty Chemicals', 'Up to 5% of global group annual turnover, administrative sanctions, and disqualification from public tenders.')
ON CONFLICT ("id") DO UPDATE SET "title" = EXCLUDED."title", "description" = EXCLUDED."description";
INSERT INTO "Regulation" ("id", "title", "shortTitle", "jurisdictionId", "country", "regulatoryBody", "category", "description", "sourceUrl", "publicationDate", "effectiveDate", "status", "currentVersion", "applicability", "industry", "penalties")
VALUES ('reg-002', 'EU REACH Regulation Annex XVII — Universal PFAS Restriction Proposal', 'EU REACH PFAS Universal Ban', 'jur-eu', 'European Union', 'European Chemicals Agency (ECHA)', 'CHEMICALS'::"RegulationCategory", 'Comprehensive restriction proposal prohibiting the manufacture, placing on the market, and use of per- and polyfluoroalkyl substances (PFAS) containing at least one fully fluorinated methyl or methylene carbon atom.', 'https://echa.europa.eu/hot-topics/perfluoroalkyl-chemicals-pfas', '2023-02-07T00:00:00Z'::timestamptz, '2026-06-30T00:00:00Z'::timestamptz, 'UNDER_REVIEW'::"RegulationStatus", 4, 'Chemical manufacturers, industrial coatings, batteries, lubricants, and packaging producers exporting to or operating in the EEA.', 'Specialty Chemicals, Industrial Coatings, Electronics', 'Immediate market ban, confiscation of goods, and civil penalties exceeding €10M per member state authority.')
ON CONFLICT ("id") DO UPDATE SET "title" = EXCLUDED."title", "description" = EXCLUDED."description";
INSERT INTO "Regulation" ("id", "title", "shortTitle", "jurisdictionId", "country", "regulatoryBody", "category", "description", "sourceUrl", "publicationDate", "effectiveDate", "status", "currentVersion", "applicability", "industry", "penalties")
VALUES ('reg-003', 'EU Carbon Border Adjustment Mechanism (CBAM) Regulation (EU) 2023/956', 'EU CBAM Regulation', 'jur-eu', 'European Union', 'European Commission DG TAXUD', 'CARBON'::"RegulationCategory", 'Carbon pricing equalization mechanism taxing embedded GHG emissions of imported goods including steel, aluminum, fertilizers, hydrogen, and chemical precursors entering the EU internal market.', 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32023R0956', '2023-05-16T00:00:00Z'::timestamptz, '2026-01-01T00:00:00Z'::timestamptz, 'ENACTED'::"RegulationStatus", 2, 'Importers and producers of energy-intensive materials into the EU customs territory.', 'Metals, Chemicals, Fertilizers, Polymers', '€10 to €50 per tonne of unreported embedded CO2 emissions; revocation of authorized CBAM declarant status.')
ON CONFLICT ("id") DO UPDATE SET "title" = EXCLUDED."title", "description" = EXCLUDED."description";
INSERT INTO "Regulation" ("id", "title", "shortTitle", "jurisdictionId", "country", "regulatoryBody", "category", "description", "sourceUrl", "publicationDate", "effectiveDate", "status", "currentVersion", "applicability", "industry", "penalties")
VALUES ('reg-004', 'EU Packaging and Packaging Waste Regulation (PPWR) 2024 Revision', 'EU PPWR 2024', 'jur-eu', 'European Union', 'European Parliament & Council', 'PACKAGING'::"RegulationCategory", 'Mandatory design-for-recycling grades, minimum post-consumer recycled plastic percentages (35% by 2030, 65% by 2040), ban on PFAS in food contact packaging, and strict empty space ratio caps (maximum 50%).', 'https://environment.ec.europa.eu/topics/waste-and-recycling/packaging-waste_en', '2024-04-24T00:00:00Z'::timestamptz, '2025-11-01T00:00:00Z'::timestamptz, 'ENACTED'::"RegulationStatus", 2, 'All packaging manufacturers, distributors, e-commerce sellers, and food/beverage processors in the EU.', 'Packaging, Polymers, Consumer Goods', 'Fines proportional to non-compliant packaging volumes, commercial sales prohibition across all 27 EU member states.')
ON CONFLICT ("id") DO UPDATE SET "title" = EXCLUDED."title", "description" = EXCLUDED."description";
INSERT INTO "Regulation" ("id", "title", "shortTitle", "jurisdictionId", "country", "regulatoryBody", "category", "description", "sourceUrl", "publicationDate", "effectiveDate", "status", "currentVersion", "applicability", "industry", "penalties")
VALUES ('reg-005', 'EU Deforestation Regulation (EUDR) Regulation (EU) 2023/1115', 'EUDR Deforestation Due Diligence', 'jur-eu', 'European Union', 'European Commission DG ENV', 'DEFORESTATION'::"RegulationCategory", 'Mandatory geolocation tracking (polygon coordinates) proving commodities (cattle, cocoa, coffee, oil palm, rubber, soya, wood and paper derivatives) did not originate on land deforested after Dec 31, 2020.', 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32023R1115', '2023-06-09T00:00:00Z'::timestamptz, '2025-12-30T00:00:00Z'::timestamptz, 'AMENDED'::"RegulationStatus", 3, 'Traders and operators placing covered commodities and derived materials on the EU market.', 'Forestry, Paper, Bio-Polymers, Agriculture', 'Confiscation of shipments, exclusion from public procurement for 12 months, fines up to 4% of total EU turnover.')
ON CONFLICT ("id") DO UPDATE SET "title" = EXCLUDED."title", "description" = EXCLUDED."description";
INSERT INTO "Regulation" ("id", "title", "shortTitle", "jurisdictionId", "country", "regulatoryBody", "category", "description", "sourceUrl", "publicationDate", "effectiveDate", "status", "currentVersion", "applicability", "industry", "penalties")
VALUES ('reg-006', 'EU Batteries and Waste Batteries Regulation (EU) 2023/1542', 'EU Battery Passport Regulation', 'jur-eu', 'European Union', 'European Commission DG GROW', 'PRODUCT_STEWARDSHIP'::"RegulationCategory", 'Comprehensive lifecycle requirements for all industrial and EV batteries including mandatory Digital Battery Passports, recycled cobalt (16%), lead (85%), lithium (6%), and nickel (6%) quotas, and carbon footprint declarations.', 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32023R1542', '2023-07-28T00:00:00Z'::timestamptz, '2025-08-18T00:00:00Z'::timestamptz, 'ENACTED'::"RegulationStatus", 2, 'Battery cell manufacturers, battery module integrators, EV producers, and industrial energy storage operators.', 'Energy Storage, Automotive, Electronics', 'CE mark revocation, mandatory product recall at manufacturer expense, administrative fines up to €20M.')
ON CONFLICT ("id") DO UPDATE SET "title" = EXCLUDED."title", "description" = EXCLUDED."description";
INSERT INTO "Regulation" ("id", "title", "shortTitle", "jurisdictionId", "country", "regulatoryBody", "category", "description", "sourceUrl", "publicationDate", "effectiveDate", "status", "currentVersion", "applicability", "industry", "penalties")
VALUES ('reg-007', 'US EPA TSCA Section 8(a)(7) PFAS Reporting & Recordkeeping Rule', 'US EPA TSCA PFAS Rule 40 CFR 705', 'jur-us', 'United States', 'US Environmental Protection Agency (EPA)', 'CHEMICALS'::"RegulationCategory", 'One-time retrospective reporting requirement under the Toxic Substances Control Act mandating every entity that manufactured or imported PFAS or PFAS-containing articles since January 1, 2011 to report chemical identity, volumes, uses, exposures, and environmental disposals.', 'https://www.epa.gov/assessing-and-managing-chemicals-under-tsca/tsca-section-8a7-reporting-and-recordkeeping-requirements', '2023-10-11T00:00:00Z'::timestamptz, '2025-05-08T00:00:00Z'::timestamptz, 'AMENDED'::"RegulationStatus", 3, 'All US chemical manufacturers and importers of industrial articles containing PFAS trace compounds.', 'Chemicals, Electronics, Automotive, Manufacturing', 'Civil penalties under TSCA Section 16 up to $46,989 per day per violation.')
ON CONFLICT ("id") DO UPDATE SET "title" = EXCLUDED."title", "description" = EXCLUDED."description";
INSERT INTO "Regulation" ("id", "title", "shortTitle", "jurisdictionId", "country", "regulatoryBody", "category", "description", "sourceUrl", "publicationDate", "effectiveDate", "status", "currentVersion", "applicability", "industry", "penalties")
VALUES ('reg-008', 'California Senate Bill 253 — Climate Corporate Data Accountability Act', 'California SB 253 Climate Disclosure', 'jur-us-ca', 'United States (California)', 'California Air Resources Board (CARB)', 'CLIMATE'::"RegulationCategory", 'Requires all public and private US enterprises with annual revenues exceeding $1 billion that do business in California to publicly disclose audited Scope 1, Scope 2, and Scope 3 greenhouse gas emissions annually.', 'https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202320240SB253', '2023-10-07T00:00:00Z'::timestamptz, '2026-01-01T00:00:00Z'::timestamptz, 'ENACTED'::"RegulationStatus", 2, 'Enterprises doing business in California with total annual global revenues >$1,000,000,000.', 'All enterprise sectors, Heavy Industry, Consumer Goods', 'CARB administrative penalties up to $500,000 per reporting year.')
ON CONFLICT ("id") DO UPDATE SET "title" = EXCLUDED."title", "description" = EXCLUDED."description";
INSERT INTO "Regulation" ("id", "title", "shortTitle", "jurisdictionId", "country", "regulatoryBody", "category", "description", "sourceUrl", "publicationDate", "effectiveDate", "status", "currentVersion", "applicability", "industry", "penalties")
VALUES ('reg-009', 'California Senate Bill 261 — Climate-Related Financial Risk Disclosures', 'California SB 261 Climate Risk', 'jur-us-ca', 'United States (California)', 'California Air Resources Board (CARB)', 'CLIMATE'::"RegulationCategory", 'Mandates biennial publication of climate-related financial risk reports aligning with the Task Force on Climate-Related Financial Disclosures (TCFD) framework, outlining physical and transition risk mitigation.', 'https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202320240SB261', '2023-10-07T00:00:00Z'::timestamptz, '2026-01-01T00:00:00Z'::timestamptz, 'ENACTED'::"RegulationStatus", 1, 'Enterprises doing business in California with annual global revenues >$500,000,000.', 'Financial, Industrial, Manufacturing', 'Fines up to $50,000 per reporting cycle.')
ON CONFLICT ("id") DO UPDATE SET "title" = EXCLUDED."title", "description" = EXCLUDED."description";
INSERT INTO "Regulation" ("id", "title", "shortTitle", "jurisdictionId", "country", "regulatoryBody", "category", "description", "sourceUrl", "publicationDate", "effectiveDate", "status", "currentVersion", "applicability", "industry", "penalties")
VALUES ('reg-010', 'German Supply Chain Due Diligence Act (Lieferkettensorgfaltspflichtengesetz — LkSG)', 'Germany LkSG Supply Chain Act', 'jur-de', 'Germany', 'BAFA (Federal Office for Economic Affairs and Export Control)', 'SUPPLY_CHAIN'::"RegulationCategory", 'Mandates establishment of risk management systems to prevent human rights abuses and environmental degradation (mercury emissions, persistent organic pollutants, water pollution) throughout global supplier tiers.', 'https://www.bafa.de/EN/Supply_Chain_Act/supply_chain_act_node.html', '2023-01-01T00:00:00Z'::timestamptz, '2024-01-01T00:00:00Z'::timestamptz, 'ENACTED'::"RegulationStatus", 2, 'German companies and international companies with German branches with >=1,000 employees.', 'Manufacturing, Automotive, Specialty Chemicals', 'Up to 2% of average annual global turnover for companies >€400M turnover, public exclusion from federal procurement.')
ON CONFLICT ("id") DO UPDATE SET "title" = EXCLUDED."title", "description" = EXCLUDED."description";
INSERT INTO "Regulation" ("id", "title", "shortTitle", "jurisdictionId", "country", "regulatoryBody", "category", "description", "sourceUrl", "publicationDate", "effectiveDate", "status", "currentVersion", "applicability", "industry", "penalties")
VALUES ('reg-011', 'US Clean Air Act Section 112 Synthetic Organic Chemical HAP NESHAP Standards', 'US EPA HON NESHAP Clean Air Rule', 'jur-us', 'United States', 'US Environmental Protection Agency (EPA)', 'AIR_QUALITY'::"RegulationCategory", 'Stringent revised National Emission Standards for Hazardous Air Pollutants (NESHAP) capping fenceline concentrations of chloroprene, ethylene oxide, benzene, and 1,3-butadiene at chemical synthesis plants.', 'https://www.epa.gov/stationary-sources-air-pollution/hazardous-organic-neshap-synthetic-organic-chemical-manufacturing', '2024-04-09T00:00:00Z'::timestamptz, '2026-04-09T00:00:00Z'::timestamptz, 'ENACTED'::"RegulationStatus", 2, 'SOCMI facilities, petrochemical refineries, synthetic resin and coating manufacturing facilities.', 'Petrochemical, Synthetic Resins, Fine Chemicals', 'Clean Air Act civil judicial enforcement up to $109,000 per violation day and injunctions.')
ON CONFLICT ("id") DO UPDATE SET "title" = EXCLUDED."title", "description" = EXCLUDED."description";
INSERT INTO "Regulation" ("id", "title", "shortTitle", "jurisdictionId", "country", "regulatoryBody", "category", "description", "sourceUrl", "publicationDate", "effectiveDate", "status", "currentVersion", "applicability", "industry", "penalties")
VALUES ('reg-012', 'Basel Convention Plastic Waste Control Amendments on Mixed & Halogenated Polymers', 'Basel Convention Plastic Waste Control', 'jur-intl', 'International', 'UN Environment Programme (UNEP)', 'WASTE'::"RegulationCategory", 'Legally binding international treaty governing transboundary movement of non-hazardous and hazardous plastic waste, requiring Prior Informed Consent (PIC) for contaminated, composite, or fluoropolymer scrap exports.', 'http://www.basel.int/Implementation/Plasticwaste/overview/tabid/8340/Default.aspx', '2021-01-01T00:00:00Z'::timestamptz, '2024-03-01T00:00:00Z'::timestamptz, 'AMENDED'::"RegulationStatus", 3, 'International recyclers, waste management contractors, and global material exporters.', 'Waste Management, Plastics, Recycling', 'Interception and repatriation of illegal waste shipments at exporter expense; criminal prosecution under national laws.')
ON CONFLICT ("id") DO UPDATE SET "title" = EXCLUDED."title", "description" = EXCLUDED."description";
INSERT INTO "Regulation" ("id", "title", "shortTitle", "jurisdictionId", "country", "regulatoryBody", "category", "description", "sourceUrl", "publicationDate", "effectiveDate", "status", "currentVersion", "applicability", "industry", "penalties")
VALUES ('reg-013', 'EU Industrial Emissions Directive (IED 2.0) Directive (EU) 2024/1785', 'EU IED 2.0 Revision', 'jur-eu', 'European Union', 'European Commission DG ENV', 'EMISSIONS'::"RegulationCategory", 'Expanded industrial permitting directive covering gigafactories, battery manufacturing plants, chemical synthesis installations, and mineral extraction with binding Best Available Techniques (BAT) emission limits.', 'https://eur-lex.europa.eu/eli/dir/2024/1785/oj', '2024-07-15T00:00:00Z'::timestamptz, '2026-08-04T00:00:00Z'::timestamptz, 'ENACTED'::"RegulationStatus", 1, 'Operating industrial chemical installations, battery gigafactories, and metal treatment plants in the EU.', 'Heavy Industry, Batteries, Chemicals', 'Permit revocation, compensation claims for affected citizens, fines of at least 3% of the operator’s annual EU turnover.')
ON CONFLICT ("id") DO UPDATE SET "title" = EXCLUDED."title", "description" = EXCLUDED."description";
INSERT INTO "Regulation" ("id", "title", "shortTitle", "jurisdictionId", "country", "regulatoryBody", "category", "description", "sourceUrl", "publicationDate", "effectiveDate", "status", "currentVersion", "applicability", "industry", "penalties")
VALUES ('reg-014', 'UK Extended Producer Responsibility (EPR) for Packaging Regulations 2024', 'UK Packaging EPR Scheme', 'jur-uk', 'United Kingdom', 'UK DEFRA / Environment Agency', 'PACKAGING'::"RegulationCategory", 'Mandatory modulated waste management fees placed on brand owners and importers based on packaging recyclability, weight, and material composition to fund local authority municipal recycling schemes.', 'https://www.gov.uk/guidance/extended-producer-responsibility-for-packaging', '2024-01-10T00:00:00Z'::timestamptz, '2025-04-01T00:00:00Z'::timestamptz, 'ENACTED'::"RegulationStatus", 2, 'UK businesses supplying packaging to the UK market with annual turnover >£1M and >25 tonnes packaging.', 'Packaging, Retail, Industrial Supply', 'Civil sanctions, variable monetary penalties, and criminal liability for false waste returns.')
ON CONFLICT ("id") DO UPDATE SET "title" = EXCLUDED."title", "description" = EXCLUDED."description";
INSERT INTO "Regulation" ("id", "title", "shortTitle", "jurisdictionId", "country", "regulatoryBody", "category", "description", "sourceUrl", "publicationDate", "effectiveDate", "status", "currentVersion", "applicability", "industry", "penalties")
VALUES ('reg-015', 'Japan Chemical Substances Control Law (CSCL Revision 2024) Class I Specified Toxics', 'Japan CSCL 2024 Amendment', 'jur-jp', 'Japan', 'METI, MHLW, MOE Japan', 'HAZARDOUS_MATERIALS'::"RegulationCategory", 'Designation of PFHxS and long-chain perfluorocarboxylic acids as Class I Specified Chemical Substances, prohibiting manufacture, import, or use without emergency Cabinet exemptions.', 'https://www.meti.go.jp/policy/chemical_management/english/cscl/index.html', '2024-02-01T00:00:00Z'::timestamptz, '2024-12-01T00:00:00Z'::timestamptz, 'ENACTED'::"RegulationStatus", 2, 'Importers and chemical manufacturers operating in Japan.', 'Specialty Chemicals, Semiconductors, Electronics', 'Up to 3 years imprisonment or fines up to ¥300,000,000 for corporate entities.')
ON CONFLICT ("id") DO UPDATE SET "title" = EXCLUDED."title", "description" = EXCLUDED."description";
INSERT INTO "Regulation" ("id", "title", "shortTitle", "jurisdictionId", "country", "regulatoryBody", "category", "description", "sourceUrl", "publicationDate", "effectiveDate", "status", "currentVersion", "applicability", "industry", "penalties")
VALUES ('reg-016', 'US EPA Industrial Solvent Degreasing Volatile Organic Compound (VOC) CTG Guidelines', 'US EPA Solvent VOC Guidelines', 'jur-us', 'United States', 'US EPA Office of Air Quality Planning & Standards', 'AIR_QUALITY'::"RegulationCategory", 'Control Techniques Guidelines restricting solvent degreasing and cleaning operations with VOC contents exceeding 50 g/L in ozone nonattainment areas.', 'https://www.epa.gov/stationary-sources-air-pollution/control-techniques-guidelines-industrial-cleaning-solvents', '2023-08-14T00:00:00Z'::timestamptz, '2025-09-01T00:00:00Z'::timestamptz, 'ENACTED'::"RegulationStatus", 1, 'Manufacturing operations using solvent cleaners in ozone nonattainment zones.', 'General Manufacturing, Metal Cleaning, Maintenance', 'Facility operating permit suspensions and statutory Clean Air Act penalties.')
ON CONFLICT ("id") DO UPDATE SET "title" = EXCLUDED."title", "description" = EXCLUDED."description";
INSERT INTO "Regulation" ("id", "title", "shortTitle", "jurisdictionId", "country", "regulatoryBody", "category", "description", "sourceUrl", "publicationDate", "effectiveDate", "status", "currentVersion", "applicability", "industry", "penalties")
VALUES ('reg-017', 'California Proposition 65 Maximum Allowable Dose Level (MADL) Revision for VOCs', 'California Prop 65 VOC MADL', 'jur-us-ca', 'United States (California)', 'OEHHA (Office of Environmental Health Hazard Assessment)', 'PRODUCT_STEWARDSHIP'::"RegulationCategory", 'Establishment of stricter safe harbor limits (MADL/NSRL) for 1-bromopropane, ethylene oxide, and perfluorinated surfactant traces in industrial adhesives and consumer products.', 'https://oehha.ca.gov/proposition-65', '2024-03-15T00:00:00Z'::timestamptz, '2025-06-01T00:00:00Z'::timestamptz, 'AMENDED'::"RegulationStatus", 2, 'Companies selling products to California consumers or with occupational exposure in California.', 'Consumer Goods, Adhesives, Coatings', 'Civil penalties up to $2,500 per day per violation plus mandatory plaintiff attorney fee awards.')
ON CONFLICT ("id") DO UPDATE SET "title" = EXCLUDED."title", "description" = EXCLUDED."description";
INSERT INTO "Regulation" ("id", "title", "shortTitle", "jurisdictionId", "country", "regulatoryBody", "category", "description", "sourceUrl", "publicationDate", "effectiveDate", "status", "currentVersion", "applicability", "industry", "penalties")
VALUES ('reg-018', 'EU Waste Framework Directive (WFD 2024 Targeted Revision) Directive (EU) 2024/278', 'EU Waste Framework Revision', 'jur-eu', 'European Union', 'European Commission DG ENV', 'WASTE'::"RegulationCategory", 'Mandatory separate collection and extended producer responsibility for synthetic textiles, polymer industrial composites, and bio-waste valorization schemes.', 'https://environment.ec.europa.eu/topics/waste-and-recycling/waste-framework-directive_en', '2024-05-30T00:00:00Z'::timestamptz, '2026-01-01T00:00:00Z'::timestamptz, 'ENACTED'::"RegulationStatus", 1, 'Producers of synthetic polymers, engineered textiles, and industrial waste handling sites.', 'Textiles, Polymers, Waste Management', 'EPR registration revocation and member-state administrative sanctions.')
ON CONFLICT ("id") DO UPDATE SET "title" = EXCLUDED."title", "description" = EXCLUDED."description";
INSERT INTO "Regulation" ("id", "title", "shortTitle", "jurisdictionId", "country", "regulatoryBody", "category", "description", "sourceUrl", "publicationDate", "effectiveDate", "status", "currentVersion", "applicability", "industry", "penalties")
VALUES ('reg-019', 'US SEC Climate-Related Disclosures for Investors (Rule 33-11275)', 'US SEC Climate Disclosure Rule', 'jur-us', 'United States', 'Securities and Exchange Commission (SEC)', 'ESG_DISCLOSURE'::"RegulationCategory", 'Regulation S-K amendments mandating large accelerated filers to disclose material Scope 1 and Scope 2 emissions, capitalized climate mitigation expenditures, and physical climate risk governance.', 'https://www.sec.gov/rules/final/2024/33-11275.pdf', '2024-03-06T00:00:00Z'::timestamptz, '2026-01-01T00:00:00Z'::timestamptz, 'UNDER_REVIEW'::"RegulationStatus", 2, 'US public reporting companies with large market capitalization.', 'Financial, Public Corporations, Industrials', 'SEC Enforcement actions, restatement of financial reports, shareholder class actions.')
ON CONFLICT ("id") DO UPDATE SET "title" = EXCLUDED."title", "description" = EXCLUDED."description";
INSERT INTO "Regulation" ("id", "title", "shortTitle", "jurisdictionId", "country", "regulatoryBody", "category", "description", "sourceUrl", "publicationDate", "effectiveDate", "status", "currentVersion", "applicability", "industry", "penalties")
VALUES ('reg-020', 'EU Critical Raw Materials Act (CRMA) Regulation (EU) 2024/1252', 'EU Critical Raw Materials Act', 'jur-eu', 'European Union', 'European Commission DG GROW', 'SUSTAINABILITY'::"RegulationCategory", 'Establishes EU benchmark targets for domestic extraction (10%), processing (40%), and recycling (25%) of strategic raw materials (lithium, cobalt, rare earths, graphite) by 2030, alongside supplier supply chain audits.', 'https://eur-lex.europa.eu/eli/reg/2024/1252/oj', '2024-05-03T00:00:00Z'::timestamptz, '2024-05-23T00:00:00Z'::timestamptz, 'ENACTED'::"RegulationStatus", 1, 'Large industrial consumers of critical and strategic raw materials in the EU.', 'Batteries, Clean Energy, Aerospace', 'Strategic audit non-compliance disclosure and exclusion from EU Net-Zero funding.')
ON CONFLICT ("id") DO UPDATE SET "title" = EXCLUDED."title", "description" = EXCLUDED."description";
INSERT INTO "Regulation" ("id", "title", "shortTitle", "jurisdictionId", "country", "regulatoryBody", "category", "description", "sourceUrl", "publicationDate", "effectiveDate", "status", "currentVersion", "applicability", "industry", "penalties")
VALUES ('reg-021', 'Germany TA Luft Technical Instructions on Air Quality (Technische Anleitung zur Reinhaltung der Luft)', 'Germany TA Luft 2024 Update', 'jur-de', 'Germany', 'BMUV (Federal Ministry for Environment, Germany)', 'AIR_QUALITY'::"RegulationCategory", 'Mandatory emission limit values for industrial synthesis installations, setting strict new caps on dust, particulate matter, organic substances, and nitrogen oxides with real-time continuous fenceline monitoring.', 'https://www.bmuv.de/themen/luft-laerm-mobilitaet/luftreinhaltung/ta-luft', '2024-06-01T00:00:00Z'::timestamptz, '2025-07-01T00:00:00Z'::timestamptz, 'ENACTED'::"RegulationStatus", 2, 'All industrial facilities operating under the Federal Immission Control Act (BImSchG) in Germany.', 'Chemicals, Metallurgy, Power Generation', 'Immediate facility shutdown orders by Gewerbeaufsichtsamt (factory inspectorate).')
ON CONFLICT ("id") DO UPDATE SET "title" = EXCLUDED."title", "description" = EXCLUDED."description";
INSERT INTO "Regulation" ("id", "title", "shortTitle", "jurisdictionId", "country", "regulatoryBody", "category", "description", "sourceUrl", "publicationDate", "effectiveDate", "status", "currentVersion", "applicability", "industry", "penalties")
VALUES ('reg-022', 'EU Ecodesign for Sustainable Products Regulation (ESPR) Regulation (EU) 2024/1781', 'EU ESPR Ecodesign Framework', 'jur-eu', 'European Union', 'European Commission DG GROW & DG ENV', 'SUSTAINABILITY'::"RegulationCategory", 'Comprehensive framework establishing Digital Product Passports (DPP), durability requirements, reparability standards, recycled content quotas, and bans on the destruction of unsold consumer goods.', 'https://eur-lex.europa.eu/eli/reg/2024/1781/oj', '2024-06-28T00:00:00Z'::timestamptz, '2024-07-18T00:00:00Z'::timestamptz, 'ENACTED'::"RegulationStatus", 1, 'Manufacturers, importers, and distributors of products placed on the EU market.', 'Electronics, Textiles, Chemicals, Packaging', 'Prohibition on EU market entry, customs seizure, penalties up to 4% of EU annual turnover.')
ON CONFLICT ("id") DO UPDATE SET "title" = EXCLUDED."title", "description" = EXCLUDED."description";
INSERT INTO "Regulation" ("id", "title", "shortTitle", "jurisdictionId", "country", "regulatoryBody", "category", "description", "sourceUrl", "publicationDate", "effectiveDate", "status", "currentVersion", "applicability", "industry", "penalties")
VALUES ('reg-023', 'US Toxic Substances Control Act (TSCA) Persistent Bioaccumulative Toxics Phaseout', 'US TSCA PBT Chemical Rules', 'jur-us', 'United States', 'US EPA', 'HAZARDOUS_MATERIALS'::"RegulationCategory", 'Strict prohibitions on the processing and distribution in commerce of PIP (3:1), DecaBDE, and 2,4,6-TTBP flame retardants in industrial plastics and electronic potting compounds.', 'https://www.epa.gov/assessing-and-managing-chemicals-under-tsca/persistent-bioaccumulative-and-toxic-pbt-chemicals-under', '2023-11-20T00:00:00Z'::timestamptz, '2025-01-06T00:00:00Z'::timestamptz, 'ENACTED'::"RegulationStatus", 2, 'Fabricators, compounders, and electronic hardware assemblers in the United States.', 'Polymers, Electronics, Industrial Hardware', 'Federal civil penalties and court-ordered product forfeitures.')
ON CONFLICT ("id") DO UPDATE SET "title" = EXCLUDED."title", "description" = EXCLUDED."description";
INSERT INTO "Regulation" ("id", "title", "shortTitle", "jurisdictionId", "country", "regulatoryBody", "category", "description", "sourceUrl", "publicationDate", "effectiveDate", "status", "currentVersion", "applicability", "industry", "penalties")
VALUES ('reg-024', 'IMO MARPOL Annex VI Carbon Intensity Indicator (CII) & CII Correction Factor Update', 'IMO MARPOL Annex VI Maritime CII', 'jur-intl', 'International', 'International Maritime Organization (IMO)', 'EMISSIONS'::"RegulationCategory", 'Mandatory operational carbon intensity rating (grades A to E) for cargo vessels over 5,000 GT, impacting maritime supply chain logistics and Scope 3 shipping emissions accounting.', 'https://www.imo.org/en/OurWork/Environment/Pages/Carbon-Intensity-Indicator-(CII).aspx', '2023-01-01T00:00:00Z'::timestamptz, '2024-01-01T00:00:00Z'::timestamptz, 'AMENDED'::"RegulationStatus", 2, 'Commercial shipping operators and charterers of ocean freight worldwide.', 'Maritime Logistics, Global Supply Chain', 'Port state control detentions, mandatory corrective action plans, insurance invalidations.')
ON CONFLICT ("id") DO UPDATE SET "title" = EXCLUDED."title", "description" = EXCLUDED."description";
INSERT INTO "Regulation" ("id", "title", "shortTitle", "jurisdictionId", "country", "regulatoryBody", "category", "description", "sourceUrl", "publicationDate", "effectiveDate", "status", "currentVersion", "applicability", "industry", "penalties")
VALUES ('reg-025', 'Canada Output-Based Pricing System (OBPS) Greenhouse Gas Pollution Pricing Regulations', 'Canada OBPS Carbon Pricing Update', 'jur-intl', 'Canada', 'Environment and Climate Change Canada (ECCC)', 'CARBON'::"RegulationCategory", 'Escalating statutory carbon pollution pricing schedule ($65/tonne rising by $15/tonne annually to $170/tonne in 2030) for heavy industrial emitters, with tightened sector performance benchmarks.', 'https://www.canada.ca/en/environment-climate-change/services/climate-change/pricing-pollution-how-it-will-work/output-based-pricing-system.html', '2023-06-15T00:00:00Z'::timestamptz, '2024-01-01T00:00:00Z'::timestamptz, 'AMENDED'::"RegulationStatus", 3, 'Industrial emitters operating in Canadian backstop jurisdictions.', 'Chemicals, Mining, Refining', 'Excess emissions charges and compliance credit purchase mandates.')
ON CONFLICT ("id") DO UPDATE SET "title" = EXCLUDED."title", "description" = EXCLUDED."description";
INSERT INTO "Regulation" ("id", "title", "shortTitle", "jurisdictionId", "country", "regulatoryBody", "category", "description", "sourceUrl", "publicationDate", "effectiveDate", "status", "currentVersion", "applicability", "industry", "penalties")
VALUES ('reg-026', 'EU Corporate Sustainability Due Diligence Directive (CSDDD) Directive (EU) 2024/1760', 'EU CSDDD Due Diligence Directive', 'jur-eu', 'European Union', 'European Parliament & Council', 'SUPPLY_CHAIN'::"RegulationCategory", 'Obliges large EU and third-country companies to identify, prevent, and mitigate adverse human rights and environmental impacts (biodiversity loss, pollution, greenhouse emissions) across upstream supply chains and downstream distribution.', 'https://eur-lex.europa.eu/eli/dir/2024/1760/oj', '2024-07-05T00:00:00Z'::timestamptz, '2027-07-26T00:00:00Z'::timestamptz, 'ENACTED'::"RegulationStatus", 1, 'Companies with >1,000 employees and net worldwide turnover >€450M.', 'Manufacturing, Heavy Industry, Retail', 'Fines up to 5% of net worldwide turnover and civil liability for victims of damages.')
ON CONFLICT ("id") DO UPDATE SET "title" = EXCLUDED."title", "description" = EXCLUDED."description";

-- Regulation Versions
INSERT INTO "RegulationVersion" ("id", "regulationId", "versionNumber", "sourceDocumentHash", "sourceUrl", "rawDocument", "normalizedText", "publicationDate", "effectiveDate")
VALUES ('ver-reg-002-1', 'reg-002', 1, 'sha256-v1-reg-002-9a8b7c6d5e', 'https://echa.europa.eu/hot-topics/perfluoroalkyl-chemicals-pfas', 'Per- and polyfluoroalkyl substances (PFAS) shall not be manufactured or placed on the market as substances on their own or in mixtures in a concentration equal to or greater than 25 ppb (0.025 mg/kg) for the sum of targeted PFAS, or 250 ppb for the sum of all PFAS including precursors. Derogation applies to closed-loop fluoropolymer industrial sintering equipment until December 2028.', 'Per- and polyfluoroalkyl substances (PFAS) shall not be manufactured or placed on the market as substances on their own or in mixtures in a concentration equal to or greater than 25 ppb (0.025 mg/kg) for the sum of targeted PFAS, or 250 ppb for the sum of all PFAS including precursors. Derogation applies to closed-loop fluoropolymer industrial sintering equipment until December 2028.', '2023-01-01T00:00:00Z'::timestamptz, '2023-06-01T00:00:00Z'::timestamptz)
ON CONFLICT ("regulationId", "versionNumber") DO NOTHING;
INSERT INTO "RegulationVersion" ("id", "regulationId", "versionNumber", "sourceDocumentHash", "sourceUrl", "rawDocument", "normalizedText", "publicationDate", "effectiveDate")
VALUES ('ver-reg-002-2', 'reg-002', 2, 'sha256-v2-reg-002-1f2e3d4c5b', 'https://echa.europa.eu/hot-topics/perfluoroalkyl-chemicals-pfas', 'Per- and polyfluoroalkyl substances (PFAS) shall not be manufactured, placed on the market, or used in industrial chemical synthesis or article manufacturing in a concentration equal to or greater than 1.0 ppb (0.001 mg/kg) for any individual PFAS compound, or 5.0 ppb for total combined organic fluorine content. ALL INDUSTRIAL MANUFACTURING DEROGATIONS FOR FLUOROPOLYMER SINTERING AND SOLVENT DISPERSIONS ARE REVOKED EFFECTIVE JUNE 30, 2026.', 'Per- and polyfluoroalkyl substances (PFAS) shall not be manufactured, placed on the market, or used in industrial chemical synthesis or article manufacturing in a concentration equal to or greater than 1.0 ppb (0.001 mg/kg) for any individual PFAS compound, or 5.0 ppb for total combined organic fluorine content. ALL INDUSTRIAL MANUFACTURING DEROGATIONS FOR FLUOROPOLYMER SINTERING AND SOLVENT DISPERSIONS ARE REVOKED EFFECTIVE JUNE 30, 2026.', '2024-06-01T00:00:00Z'::timestamptz, '2026-06-30T00:00:00Z'::timestamptz)
ON CONFLICT ("regulationId", "versionNumber") DO NOTHING;
INSERT INTO "RegulationVersion" ("id", "regulationId", "versionNumber", "sourceDocumentHash", "sourceUrl", "rawDocument", "normalizedText", "publicationDate", "effectiveDate")
VALUES ('ver-reg-004-1', 'reg-004', 1, 'sha256-v1-reg-004-9a8b7c6d5e', 'https://environment.ec.europa.eu/topics/waste-and-recycling/packaging-waste_en', 'Member states shall encourage packaging manufacturers to incorporate secondary raw materials into plastic packaging where technically feasible. Economic operators should achieve voluntary recycled content targets of 25% by 2030.', 'Member states shall encourage packaging manufacturers to incorporate secondary raw materials into plastic packaging where technically feasible. Economic operators should achieve voluntary recycled content targets of 25% by 2030.', '2023-01-01T00:00:00Z'::timestamptz, '2023-06-01T00:00:00Z'::timestamptz)
ON CONFLICT ("regulationId", "versionNumber") DO NOTHING;
INSERT INTO "RegulationVersion" ("id", "regulationId", "versionNumber", "sourceDocumentHash", "sourceUrl", "rawDocument", "normalizedText", "publicationDate", "effectiveDate")
VALUES ('ver-reg-004-2', 'reg-004', 2, 'sha256-v2-reg-004-1f2e3d4c5b', 'https://environment.ec.europa.eu/topics/waste-and-recycling/packaging-waste_en', 'By 1 November 2025, each unit of plastic packaging placed on the European Union market shall contain a mandatory minimum of 35% post-consumer recycled plastic (PCR) verified via certified mass balance chain-of-custody. Furthermore, food contact packaging containing intentionally added PFAS exceeding 25 ppm or total fluorine exceeding 50 mg/kg is strictly prohibited from market placement.', 'By 1 November 2025, each unit of plastic packaging placed on the European Union market shall contain a mandatory minimum of 35% post-consumer recycled plastic (PCR) verified via certified mass balance chain-of-custody. Furthermore, food contact packaging containing intentionally added PFAS exceeding 25 ppm or total fluorine exceeding 50 mg/kg is strictly prohibited from market placement.', '2024-06-01T00:00:00Z'::timestamptz, '2025-11-01T00:00:00Z'::timestamptz)
ON CONFLICT ("regulationId", "versionNumber") DO NOTHING;
INSERT INTO "RegulationVersion" ("id", "regulationId", "versionNumber", "sourceDocumentHash", "sourceUrl", "rawDocument", "normalizedText", "publicationDate", "effectiveDate")
VALUES ('ver-reg-006-1', 'reg-006', 1, 'sha256-v1-reg-006-9a8b7c6d5e', 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32023R1542', 'By 18 February 2027, economic operators placing industrial batteries with capacity above 2 kWh on the market shall ensure that a battery passport is accessible via a secure electronic record system.', 'By 18 February 2027, economic operators placing industrial batteries with capacity above 2 kWh on the market shall ensure that a battery passport is accessible via a secure electronic record system.', '2023-01-01T00:00:00Z'::timestamptz, '2023-06-01T00:00:00Z'::timestamptz)
ON CONFLICT ("regulationId", "versionNumber") DO NOTHING;
INSERT INTO "RegulationVersion" ("id", "regulationId", "versionNumber", "sourceDocumentHash", "sourceUrl", "rawDocument", "normalizedText", "publicationDate", "effectiveDate")
VALUES ('ver-reg-006-2', 'reg-006', 2, 'sha256-v2-reg-006-1f2e3d4c5b', 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32023R1542', 'By 18 August 2025, each industrial battery with capacity above 2 kWh placed on the Union market or put into service shall possess an accessible Digital Battery Passport linked to an indelible QR code. The passport must declare certified lifecycle carbon footprint (kg CO2e/kWh), recycled cobalt/lithium/nickel quotas, and validated supply chain due diligence reports.', 'By 18 August 2025, each industrial battery with capacity above 2 kWh placed on the Union market or put into service shall possess an accessible Digital Battery Passport linked to an indelible QR code. The passport must declare certified lifecycle carbon footprint (kg CO2e/kWh), recycled cobalt/lithium/nickel quotas, and validated supply chain due diligence reports.', '2024-06-01T00:00:00Z'::timestamptz, '2025-08-18T00:00:00Z'::timestamptz)
ON CONFLICT ("regulationId", "versionNumber") DO NOTHING;
INSERT INTO "RegulationVersion" ("id", "regulationId", "versionNumber", "sourceDocumentHash", "sourceUrl", "rawDocument", "normalizedText", "publicationDate", "effectiveDate")
VALUES ('ver-reg-007-1', 'reg-007', 1, 'sha256-v1-reg-007-9a8b7c6d5e', 'https://www.epa.gov/assessing-and-managing-chemicals-under-tsca/tsca-section-8a7-reporting-and-recordkeeping-requirements', 'Manufacturers of PFAS substances may submit historical production estimates if exact metering records from 2011 to 2018 are unavailable. Articles containing trace concentrations below 0.1% by weight were proposed for exclusion.', 'Manufacturers of PFAS substances may submit historical production estimates if exact metering records from 2011 to 2018 are unavailable. Articles containing trace concentrations below 0.1% by weight were proposed for exclusion.', '2023-01-01T00:00:00Z'::timestamptz, '2023-06-01T00:00:00Z'::timestamptz)
ON CONFLICT ("regulationId", "versionNumber") DO NOTHING;
INSERT INTO "RegulationVersion" ("id", "regulationId", "versionNumber", "sourceDocumentHash", "sourceUrl", "rawDocument", "normalizedText", "publicationDate", "effectiveDate")
VALUES ('ver-reg-007-2', 'reg-007', 2, 'sha256-v2-reg-007-1f2e3d4c5b', 'https://www.epa.gov/assessing-and-managing-chemicals-under-tsca/tsca-section-8a7-reporting-and-recordkeeping-requirements', 'All entities that manufactured or imported PFAS or PFAS-containing articles between January 1, 2011 and December 31, 2022 must submit definitive reports via the EPA Central Data Exchange (CDX). There is NO DE MINIMIS THRESHOLD. Trace impurities, components of imported polymers, and processing aids are fully subject to mandatory reporting. Reporting opens November 2024 and closes May 8, 2025.', 'All entities that manufactured or imported PFAS or PFAS-containing articles between January 1, 2011 and December 31, 2022 must submit definitive reports via the EPA Central Data Exchange (CDX). There is NO DE MINIMIS THRESHOLD. Trace impurities, components of imported polymers, and processing aids are fully subject to mandatory reporting. Reporting opens November 2024 and closes May 8, 2025.', '2024-06-01T00:00:00Z'::timestamptz, '2025-05-08T00:00:00Z'::timestamptz)
ON CONFLICT ("regulationId", "versionNumber") DO NOTHING;
INSERT INTO "RegulationVersion" ("id", "regulationId", "versionNumber", "sourceDocumentHash", "sourceUrl", "rawDocument", "normalizedText", "publicationDate", "effectiveDate")
VALUES ('ver-reg-003-1', 'reg-003', 1, 'sha256-v1-reg-003-9a8b7c6d5e', 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32023R0956', 'During the transitional phase, declarants shall report direct Scope 1 emissions and indirect Scope 2 electricity emissions using either EU default default values or facility monitoring data.', 'During the transitional phase, declarants shall report direct Scope 1 emissions and indirect Scope 2 electricity emissions using either EU default default values or facility monitoring data.', '2023-01-01T00:00:00Z'::timestamptz, '2023-06-01T00:00:00Z'::timestamptz)
ON CONFLICT ("regulationId", "versionNumber") DO NOTHING;
INSERT INTO "RegulationVersion" ("id", "regulationId", "versionNumber", "sourceDocumentHash", "sourceUrl", "rawDocument", "normalizedText", "publicationDate", "effectiveDate")
VALUES ('ver-reg-003-2', 'reg-003', 2, 'sha256-v2-reg-003-1f2e3d4c5b', 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32023R0956', 'Effective 1 January 2026, the CBAM financial definitive regime commences. Importers must purchase CBAM certificates matching weekly EU ETS auction prices. The boundary of embedded emissions is formally expanded to include complex precursors (Annex I chemical resins, hydrogen derivatives) and upstream Scope 3 extraction footprint. Default values are restricted to maximum penalty calculations.', 'Effective 1 January 2026, the CBAM financial definitive regime commences. Importers must purchase CBAM certificates matching weekly EU ETS auction prices. The boundary of embedded emissions is formally expanded to include complex precursors (Annex I chemical resins, hydrogen derivatives) and upstream Scope 3 extraction footprint. Default values are restricted to maximum penalty calculations.', '2024-06-01T00:00:00Z'::timestamptz, '2026-01-01T00:00:00Z'::timestamptz)
ON CONFLICT ("regulationId", "versionNumber") DO NOTHING;
INSERT INTO "RegulationVersion" ("id", "regulationId", "versionNumber", "sourceDocumentHash", "sourceUrl", "rawDocument", "normalizedText", "publicationDate", "effectiveDate")
VALUES ('ver-reg-008-1', 'reg-008', 1, 'sha256-v1-reg-008-9a8b7c6d5e', 'https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202320240SB253', 'Disclosures shall begin in 2026 for Scope 1 and Scope 2 emissions, and Scope 3 emissions shall be reported within 180 days of public regulations adoption.', 'Disclosures shall begin in 2026 for Scope 1 and Scope 2 emissions, and Scope 3 emissions shall be reported within 180 days of public regulations adoption.', '2023-01-01T00:00:00Z'::timestamptz, '2023-06-01T00:00:00Z'::timestamptz)
ON CONFLICT ("regulationId", "versionNumber") DO NOTHING;
INSERT INTO "RegulationVersion" ("id", "regulationId", "versionNumber", "sourceDocumentHash", "sourceUrl", "rawDocument", "normalizedText", "publicationDate", "effectiveDate")
VALUES ('ver-reg-008-2', 'reg-008', 2, 'sha256-v2-reg-008-1f2e3d4c5b', 'https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202320240SB253', 'Reporting entities shall submit audited Scope 1 and Scope 2 emissions by 1 June 2026, and full Scope 3 supply chain greenhouse gas emissions by 1 December 2026. Reporting must adhere to the GHG Protocol Corporate Standard and possess limited assurance by an independent CARB-accredited verification body.', 'Reporting entities shall submit audited Scope 1 and Scope 2 emissions by 1 June 2026, and full Scope 3 supply chain greenhouse gas emissions by 1 December 2026. Reporting must adhere to the GHG Protocol Corporate Standard and possess limited assurance by an independent CARB-accredited verification body.', '2024-06-01T00:00:00Z'::timestamptz, '2026-01-01T00:00:00Z'::timestamptz)
ON CONFLICT ("regulationId", "versionNumber") DO NOTHING;
INSERT INTO "RegulationVersion" ("id", "regulationId", "versionNumber", "sourceDocumentHash", "sourceUrl", "rawDocument", "normalizedText", "publicationDate", "effectiveDate")
VALUES ('ver-reg-011-1', 'reg-011', 1, 'sha256-v1-reg-011-9a8b7c6d5e', 'https://www.epa.gov/stationary-sources-air-pollution/hazardous-organic-neshap-synthetic-organic-chemical-manufacturing', 'Facilities shall sample organic hazardous air pollutants at perimeter monitors quarterly. The action level for corrective root cause analysis was 9.0 ug/m3 annual rolling average.', 'Facilities shall sample organic hazardous air pollutants at perimeter monitors quarterly. The action level for corrective root cause analysis was 9.0 ug/m3 annual rolling average.', '2023-01-01T00:00:00Z'::timestamptz, '2023-06-01T00:00:00Z'::timestamptz)
ON CONFLICT ("regulationId", "versionNumber") DO NOTHING;
INSERT INTO "RegulationVersion" ("id", "regulationId", "versionNumber", "sourceDocumentHash", "sourceUrl", "rawDocument", "normalizedText", "publicationDate", "effectiveDate")
VALUES ('ver-reg-011-2', 'reg-011', 2, 'sha256-v2-reg-011-1f2e3d4c5b', 'https://www.epa.gov/stationary-sources-air-pollution/hazardous-organic-neshap-synthetic-organic-chemical-manufacturing', 'Facilities subject to Subpart G must install continuous passive or real-time fenceline sorbent tubes. The rolling annual average action level for benzene is reduced to 3.0 ug/m3 (formerly 9.0 ug/m3). Exceedance of the action level triggers mandatory root-cause analysis within 5 days and corrective action within 45 days, with all raw data streamed to the EPA public fenceline dashboard.', 'Facilities subject to Subpart G must install continuous passive or real-time fenceline sorbent tubes. The rolling annual average action level for benzene is reduced to 3.0 ug/m3 (formerly 9.0 ug/m3). Exceedance of the action level triggers mandatory root-cause analysis within 5 days and corrective action within 45 days, with all raw data streamed to the EPA public fenceline dashboard.', '2024-06-01T00:00:00Z'::timestamptz, '2026-04-09T00:00:00Z'::timestamptz)
ON CONFLICT ("regulationId", "versionNumber") DO NOTHING;
INSERT INTO "RegulationVersion" ("id", "regulationId", "versionNumber", "sourceDocumentHash", "sourceUrl", "rawDocument", "normalizedText", "publicationDate", "effectiveDate")
VALUES ('ver-reg-010-1', 'reg-010', 1, 'sha256-v1-reg-010-9a8b7c6d5e', 'https://www.bafa.de/EN/Supply_Chain_Act/supply_chain_act_node.html', 'Companies must perform general human rights risk analysis annually and document procedures for direct Tier-1 suppliers.', 'Companies must perform general human rights risk analysis annually and document procedures for direct Tier-1 suppliers.', '2023-01-01T00:00:00Z'::timestamptz, '2023-06-01T00:00:00Z'::timestamptz)
ON CONFLICT ("regulationId", "versionNumber") DO NOTHING;
INSERT INTO "RegulationVersion" ("id", "regulationId", "versionNumber", "sourceDocumentHash", "sourceUrl", "rawDocument", "normalizedText", "publicationDate", "effectiveDate")
VALUES ('ver-reg-010-2', 'reg-010', 2, 'sha256-v2-reg-010-1f2e3d4c5b', 'https://www.bafa.de/EN/Supply_Chain_Act/supply_chain_act_node.html', 'BAFA will systematically audit compliance with the Minamata Convention on Mercury and the Stockholm Convention on Persistent Organic Pollutants across Tier-1 and indirect Tier-N suppliers where substantiated hints exist. Failure to submit audited BAFA annual reports by April 30 triggers automatic fines of up to €800,000.', 'BAFA will systematically audit compliance with the Minamata Convention on Mercury and the Stockholm Convention on Persistent Organic Pollutants across Tier-1 and indirect Tier-N suppliers where substantiated hints exist. Failure to submit audited BAFA annual reports by April 30 triggers automatic fines of up to €800,000.', '2024-06-01T00:00:00Z'::timestamptz, '2024-01-01T00:00:00Z'::timestamptz)
ON CONFLICT ("regulationId", "versionNumber") DO NOTHING;
INSERT INTO "RegulationVersion" ("id", "regulationId", "versionNumber", "sourceDocumentHash", "sourceUrl", "rawDocument", "normalizedText", "publicationDate", "effectiveDate")
VALUES ('ver-reg-001-1', 'reg-001', 1, 'sha256-v1-reg-001-9a8b7c6d5e', 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022L2464', 'Sustainability statements shall be included in a dedicated section of the management report in human-readable PDF format.', 'Sustainability statements shall be included in a dedicated section of the management report in human-readable PDF format.', '2023-01-01T00:00:00Z'::timestamptz, '2023-06-01T00:00:00Z'::timestamptz)
ON CONFLICT ("regulationId", "versionNumber") DO NOTHING;
INSERT INTO "RegulationVersion" ("id", "regulationId", "versionNumber", "sourceDocumentHash", "sourceUrl", "rawDocument", "normalizedText", "publicationDate", "effectiveDate")
VALUES ('ver-reg-001-2', 'reg-001', 2, 'sha256-v2-reg-001-1f2e3d4c5b', 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022L2464', 'Sustainability statements must be marked up using Inline XBRL (iXBRL) according to the EFRAG ESRS Digital Taxonomy. Every quantitative metric—including Scope 1, 2, and 3 emissions breakdowns, water stress indicators, circular material inflows, and hazardous chemical volumes—must feature granular digital tags validated against ESMA technical standards.', 'Sustainability statements must be marked up using Inline XBRL (iXBRL) according to the EFRAG ESRS Digital Taxonomy. Every quantitative metric—including Scope 1, 2, and 3 emissions breakdowns, water stress indicators, circular material inflows, and hazardous chemical volumes—must feature granular digital tags validated against ESMA technical standards.', '2024-06-01T00:00:00Z'::timestamptz, '2025-01-01T00:00:00Z'::timestamptz)
ON CONFLICT ("regulationId", "versionNumber") DO NOTHING;
INSERT INTO "RegulationVersion" ("id", "regulationId", "versionNumber", "sourceDocumentHash", "sourceUrl", "rawDocument", "normalizedText", "publicationDate", "effectiveDate")
VALUES ('ver-reg-013-1', 'reg-013', 1, 'sha256-v1-reg-013-9a8b7c6d5e', 'https://eur-lex.europa.eu/eli/dir/2024/1785/oj', 'Installations for the production of inorganic or organic chemicals with capacity exceeding thresholds are subject to IED permits. Battery assembly was previously regulated under generic national industrial codes.', 'Installations for the production of inorganic or organic chemicals with capacity exceeding thresholds are subject to IED permits. Battery assembly was previously regulated under generic national industrial codes.', '2023-01-01T00:00:00Z'::timestamptz, '2023-06-01T00:00:00Z'::timestamptz)
ON CONFLICT ("regulationId", "versionNumber") DO NOTHING;
INSERT INTO "RegulationVersion" ("id", "regulationId", "versionNumber", "sourceDocumentHash", "sourceUrl", "rawDocument", "normalizedText", "publicationDate", "effectiveDate")
VALUES ('ver-reg-013-2', 'reg-013', 2, 'sha256-v2-reg-013-1f2e3d4c5b', 'https://eur-lex.europa.eu/eli/dir/2024/1785/oj', 'Annex I is amended to explicitly include: (a) Installations for the manufacture of battery cells or modules with an annual production capacity exceeding 0.5 GWh; (b) Installations for the production of hydrogen via electrolysis exceeding 50 MW capacity. Operators must establish certified Environmental Management Systems (EMS) and adhere to revised BAT-AEL emission limits for volatile organics and heavy metals.', 'Annex I is amended to explicitly include: (a) Installations for the manufacture of battery cells or modules with an annual production capacity exceeding 0.5 GWh; (b) Installations for the production of hydrogen via electrolysis exceeding 50 MW capacity. Operators must establish certified Environmental Management Systems (EMS) and adhere to revised BAT-AEL emission limits for volatile organics and heavy metals.', '2024-06-01T00:00:00Z'::timestamptz, '2026-08-04T00:00:00Z'::timestamptz)
ON CONFLICT ("regulationId", "versionNumber") DO NOTHING;
INSERT INTO "RegulationVersion" ("id", "regulationId", "versionNumber", "sourceDocumentHash", "sourceUrl", "rawDocument", "normalizedText", "publicationDate", "effectiveDate")
VALUES ('ver-reg-021-1', 'reg-021', 1, 'sha256-v1-reg-021-9a8b7c6d5e', 'https://www.bmuv.de/themen/luft-laerm-mobilitaet/luftreinhaltung/ta-luft', 'Total dust emissions from chemical reaction exhausts shall not exceed 20 mg/m3 at mass flow rates of 0.20 kg/h or greater.', 'Total dust emissions from chemical reaction exhausts shall not exceed 20 mg/m3 at mass flow rates of 0.20 kg/h or greater.', '2023-01-01T00:00:00Z'::timestamptz, '2023-06-01T00:00:00Z'::timestamptz)
ON CONFLICT ("regulationId", "versionNumber") DO NOTHING;
INSERT INTO "RegulationVersion" ("id", "regulationId", "versionNumber", "sourceDocumentHash", "sourceUrl", "rawDocument", "normalizedText", "publicationDate", "effectiveDate")
VALUES ('ver-reg-021-2', 'reg-021', 2, 'sha256-v2-reg-021-1f2e3d4c5b', 'https://www.bmuv.de/themen/luft-laerm-mobilitaet/luftreinhaltung/ta-luft', 'Total dust emissions from all chemical synthesis, curing, and compounding exhausts shall not exceed 5.0 mg/m3 at mass flow rates of 0.05 kg/h or greater. For Class I organic compounds, the emission concentration limit is reduced to 10 mg/m3 with mandatory continuous parameter recording.', 'Total dust emissions from all chemical synthesis, curing, and compounding exhausts shall not exceed 5.0 mg/m3 at mass flow rates of 0.05 kg/h or greater. For Class I organic compounds, the emission concentration limit is reduced to 10 mg/m3 with mandatory continuous parameter recording.', '2024-06-01T00:00:00Z'::timestamptz, '2025-07-01T00:00:00Z'::timestamptz)
ON CONFLICT ("regulationId", "versionNumber") DO NOTHING;
INSERT INTO "RegulationVersion" ("id", "regulationId", "versionNumber", "sourceDocumentHash", "sourceUrl", "rawDocument", "normalizedText", "publicationDate", "effectiveDate")
VALUES ('ver-reg-022-1', 'reg-022', 1, 'sha256-v1-reg-022-9a8b7c6d5e', 'https://eur-lex.europa.eu/eli/reg/2024/1781/oj', 'Ecodesign requirements applied exclusively to energy-related products under Directive 2009/125/EC.', 'Ecodesign requirements applied exclusively to energy-related products under Directive 2009/125/EC.', '2023-01-01T00:00:00Z'::timestamptz, '2023-06-01T00:00:00Z'::timestamptz)
ON CONFLICT ("regulationId", "versionNumber") DO NOTHING;
INSERT INTO "RegulationVersion" ("id", "regulationId", "versionNumber", "sourceDocumentHash", "sourceUrl", "rawDocument", "normalizedText", "publicationDate", "effectiveDate")
VALUES ('ver-reg-022-2', 'reg-022', 2, 'sha256-v2-reg-022-1f2e3d4c5b', 'https://eur-lex.europa.eu/eli/reg/2024/1781/oj', 'The Ecodesign for Sustainable Products Regulation (ESPR) is entered into force. Priority working plans designate chemicals, polymers, textiles, and electronics for mandatory Digital Product Passports (DPP) containing material composition, carbon footprint, and recyclability scores. Companies must publicly disclose the volume of unsold products discarded annually.', 'The Ecodesign for Sustainable Products Regulation (ESPR) is entered into force. Priority working plans designate chemicals, polymers, textiles, and electronics for mandatory Digital Product Passports (DPP) containing material composition, carbon footprint, and recyclability scores. Companies must publicly disclose the volume of unsold products discarded annually.', '2024-06-01T00:00:00Z'::timestamptz, '2024-07-18T00:00:00Z'::timestamptz)
ON CONFLICT ("regulationId", "versionNumber") DO NOTHING;
INSERT INTO "RegulationVersion" ("id", "regulationId", "versionNumber", "sourceDocumentHash", "sourceUrl", "rawDocument", "normalizedText", "publicationDate", "effectiveDate")
VALUES ('ver-reg-005-1', 'reg-005', 1, 'sha256-v1-reg-005-9a8b7c6d5e', 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32023R1115', 'The regulation shall apply from 30 December 2024 for large operators and traders, and from 30 June 2025 for micro and small enterprises.', 'The regulation shall apply from 30 December 2024 for large operators and traders, and from 30 June 2025 for micro and small enterprises.', '2023-01-01T00:00:00Z'::timestamptz, '2023-06-01T00:00:00Z'::timestamptz)
ON CONFLICT ("regulationId", "versionNumber") DO NOTHING;
INSERT INTO "RegulationVersion" ("id", "regulationId", "versionNumber", "sourceDocumentHash", "sourceUrl", "rawDocument", "normalizedText", "publicationDate", "effectiveDate")
VALUES ('ver-reg-005-2', 'reg-005', 2, 'sha256-v2-reg-005-1f2e3d4c5b', 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32023R1115', 'The regulation shall apply from 30 December 2025 for large operators and traders, and from 30 June 2026 for micro and small enterprises. The European Commission Deforestation Due Diligence Information System will open for pre-registration in June 2025 to enable upload of plot polygon coordinates.', 'The regulation shall apply from 30 December 2025 for large operators and traders, and from 30 June 2026 for micro and small enterprises. The European Commission Deforestation Due Diligence Information System will open for pre-registration in June 2025 to enable upload of plot polygon coordinates.', '2024-06-01T00:00:00Z'::timestamptz, '2025-12-30T00:00:00Z'::timestamptz)
ON CONFLICT ("regulationId", "versionNumber") DO NOTHING;
INSERT INTO "RegulationVersion" ("id", "regulationId", "versionNumber", "sourceDocumentHash", "sourceUrl", "rawDocument", "normalizedText", "publicationDate", "effectiveDate")
VALUES ('ver-reg-014-1', 'reg-014', 1, 'sha256-v1-reg-014-9a8b7c6d5e', 'https://www.gov.uk/guidance/extended-producer-responsibility-for-packaging', 'Producers shall submit packaging weight data semi-annually under the legacy PRN (Packaging Recovery Note) system.', 'Producers shall submit packaging weight data semi-annually under the legacy PRN (Packaging Recovery Note) system.', '2023-01-01T00:00:00Z'::timestamptz, '2023-06-01T00:00:00Z'::timestamptz)
ON CONFLICT ("regulationId", "versionNumber") DO NOTHING;
INSERT INTO "RegulationVersion" ("id", "regulationId", "versionNumber", "sourceDocumentHash", "sourceUrl", "rawDocument", "normalizedText", "publicationDate", "effectiveDate")
VALUES ('ver-reg-014-2', 'reg-014', 2, 'sha256-v2-reg-014-1f2e3d4c5b', 'https://www.gov.uk/guidance/extended-producer-responsibility-for-packaging', 'Effective 1 April 2025, local authority packaging waste management costs will be directly billed to obligated producers via modulated EPR fees. Base fee estimates range from £130-£220/tonne for aluminum, £330-£590/tonne for plastic packaging, and £140-£260/tonne for paper/cardboard. Modulations based on recyclability design will take effect in Year 2.', 'Effective 1 April 2025, local authority packaging waste management costs will be directly billed to obligated producers via modulated EPR fees. Base fee estimates range from £130-£220/tonne for aluminum, £330-£590/tonne for plastic packaging, and £140-£260/tonne for paper/cardboard. Modulations based on recyclability design will take effect in Year 2.', '2024-06-01T00:00:00Z'::timestamptz, '2025-04-01T00:00:00Z'::timestamptz)
ON CONFLICT ("regulationId", "versionNumber") DO NOTHING;
INSERT INTO "RegulationVersion" ("id", "regulationId", "versionNumber", "sourceDocumentHash", "sourceUrl", "rawDocument", "normalizedText", "publicationDate", "effectiveDate")
VALUES ('ver-reg-023-1', 'reg-023', 1, 'sha256-v1-reg-023-9a8b7c6d5e', 'https://www.epa.gov/assessing-and-managing-chemicals-under-tsca/persistent-bioaccumulative-and-toxic-pbt-chemicals-under', 'The EPA previously granted temporary enforcement discretions permitting the processing and distribution of PIP (3:1) in articles until October 2024.', 'The EPA previously granted temporary enforcement discretions permitting the processing and distribution of PIP (3:1) in articles until October 2024.', '2023-01-01T00:00:00Z'::timestamptz, '2023-06-01T00:00:00Z'::timestamptz)
ON CONFLICT ("regulationId", "versionNumber") DO NOTHING;
INSERT INTO "RegulationVersion" ("id", "regulationId", "versionNumber", "sourceDocumentHash", "sourceUrl", "rawDocument", "normalizedText", "publicationDate", "effectiveDate")
VALUES ('ver-reg-023-2', 'reg-023', 2, 'sha256-v2-reg-023-1f2e3d4c5b', 'https://www.epa.gov/assessing-and-managing-chemicals-under-tsca/persistent-bioaccumulative-and-toxic-pbt-chemicals-under', 'Effective January 6, 2025, the processing and distribution in commerce of PIP (3:1) (CASRN 68937-41-7) and products or articles containing PIP (3:1) is STRICTLY PROHIBITED throughout the United States. All historical enforcement discretions have terminated. Mandatory recordkeeping of complete phase-out and disposal records must be maintained for 5 years.', 'Effective January 6, 2025, the processing and distribution in commerce of PIP (3:1) (CASRN 68937-41-7) and products or articles containing PIP (3:1) is STRICTLY PROHIBITED throughout the United States. All historical enforcement discretions have terminated. Mandatory recordkeeping of complete phase-out and disposal records must be maintained for 5 years.', '2024-06-01T00:00:00Z'::timestamptz, '2025-01-06T00:00:00Z'::timestamptz)
ON CONFLICT ("regulationId", "versionNumber") DO NOTHING;
INSERT INTO "RegulationVersion" ("id", "regulationId", "versionNumber", "sourceDocumentHash", "sourceUrl", "rawDocument", "normalizedText", "publicationDate", "effectiveDate")
VALUES ('ver-reg-015-1', 'reg-015', 1, 'sha256-v1-reg-015-9a8b7c6d5e', 'https://www.meti.go.jp/policy/chemical_management/english/cscl/index.html', 'PFHxS was monitored under Class II reporting guidelines with voluntary annual production notifications.', 'PFHxS was monitored under Class II reporting guidelines with voluntary annual production notifications.', '2023-01-01T00:00:00Z'::timestamptz, '2023-06-01T00:00:00Z'::timestamptz)
ON CONFLICT ("regulationId", "versionNumber") DO NOTHING;
INSERT INTO "RegulationVersion" ("id", "regulationId", "versionNumber", "sourceDocumentHash", "sourceUrl", "rawDocument", "normalizedText", "publicationDate", "effectiveDate")
VALUES ('ver-reg-015-2', 'reg-015', 2, 'sha256-v2-reg-015-1f2e3d4c5b', 'https://www.meti.go.jp/policy/chemical_management/english/cscl/index.html', 'Perfluorohexanesulfonic acid (PFHxS), its salts, and PFHxS-related compounds are designated as Class I Specified Chemical Substances. Manufacture, import, and commercial use are prohibited. Importation of 10 specified articles containing PFHxS (water-repellent fabrics, semiconductor etching agents, metal processing aids) is banned.', 'Perfluorohexanesulfonic acid (PFHxS), its salts, and PFHxS-related compounds are designated as Class I Specified Chemical Substances. Manufacture, import, and commercial use are prohibited. Importation of 10 specified articles containing PFHxS (water-repellent fabrics, semiconductor etching agents, metal processing aids) is banned.', '2024-06-01T00:00:00Z'::timestamptz, '2024-12-01T00:00:00Z'::timestamptz)
ON CONFLICT ("regulationId", "versionNumber") DO NOTHING;

-- Regulatory Changes & Sections
INSERT INTO "RegulatoryChange" ("id", "regulationId", "previousVersionId", "newVersionId", "changeType", "summary", "changedSections", "severity", "detectedAt", "effectiveDate", "reviewStatus")
VALUES ('chg-001', 'reg-002', 'ver-reg-002-1', 'ver-reg-002-2', 'THRESHOLD_CHANGE'::"ChangeType", 'Universal PFAS limit lowered from 25 ppb (parts per billion) to 1.0 ppb with elimination of industrial fluoropolymer processing exemptions.', '[{"section":"Article 67 & Annex XVII Entry 68","changeType":"THRESHOLD_CHANGE","oldText":"Per- and polyfluoroalkyl substances (PFAS) shall not be manufactured or placed on the market as substances on their own or in mixtures in a concentration equal to or greater than 25 ppb (0.025 mg/kg) for the sum of targeted PFAS, or 250 ppb for the sum of all PFAS including precursors. Derogation applies to closed-loop fluoropolymer industrial sintering equipment until December 2028.","newText":"Per- and polyfluoroalkyl substances (PFAS) shall not be manufactured, placed on the market, or used in industrial chemical synthesis or article manufacturing in a concentration equal to or greater than 1.0 ppb (0.001 mg/kg) for any individual PFAS compound, or 5.0 ppb for total combined organic fluorine content. ALL INDUSTRIAL MANUFACTURING DEROGATIONS FOR FLUOROPOLYMER SINTERING AND SOLVENT DISPERSIONS ARE REVOKED EFFECTIVE JUNE 30, 2026."}]'::jsonb, 'CRITICAL'::"RiskLevel", NOW(), '2026-06-30T00:00:00Z'::timestamptz, 'PENDING')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "RegulatoryChangeSection" ("id", "regulatoryChangeId", "sectionIdentifier", "oldText", "newText", "changeType")
VALUES ('sec-chg-001', 'chg-001', 'Article 67 & Annex XVII Entry 68', 'Per- and polyfluoroalkyl substances (PFAS) shall not be manufactured or placed on the market as substances on their own or in mixtures in a concentration equal to or greater than 25 ppb (0.025 mg/kg) for the sum of targeted PFAS, or 250 ppb for the sum of all PFAS including precursors. Derogation applies to closed-loop fluoropolymer industrial sintering equipment until December 2028.', 'Per- and polyfluoroalkyl substances (PFAS) shall not be manufactured, placed on the market, or used in industrial chemical synthesis or article manufacturing in a concentration equal to or greater than 1.0 ppb (0.001 mg/kg) for any individual PFAS compound, or 5.0 ppb for total combined organic fluorine content. ALL INDUSTRIAL MANUFACTURING DEROGATIONS FOR FLUOROPOLYMER SINTERING AND SOLVENT DISPERSIONS ARE REVOKED EFFECTIVE JUNE 30, 2026.', 'THRESHOLD_CHANGE'::"ChangeType")
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "AIAnalysis" ("id", "regulatoryChangeId", "summary", "whatChanged", "whyItMatters", "affectedProducts", "affectedFacilities", "affectedProcesses", "affectedSuppliers", "potentialObligations", "recommendedActions", "effectiveDate", "urgency", "riskLevel", "confidence", "requiresHumanReview", "sourceReferences", "reviewStatus")
VALUES ('aia-chg-001', 'chg-001', 'Critical regulatory drift: ECHA eliminated the industrial processing exemption for fluoropolymer manufacturing and slashed the allowable PFAS threshold by 96% down to 1.0 ppb.', '["Allowable PFAS threshold cut from 25 ppb down to 1.0 ppb","Total organic fluorine limit reduced from 250 ppb to 5.0 ppb","Complete elimination of previously granted derogation for closed-loop fluoropolymer sintering by June 30, 2026"]'::jsonb, 'Apex-Fluor 400 coating contains high molecular weight fluoropolymer chains that exceed the 1.0 ppb threshold. Facility fac-001 in Dresden directly executes fluoropolymer heat curing (proc-001) which will violate the revised rule without zero-emission scrubber retrofits.', '["Apex-Fluor 400 Protective Polymer (AF400-EUR-01)","SynthoFlex Fluoroelastomer (SF-ELAST-22)"]'::jsonb, '["Apex Advanced Materials — Dresden (fac-001)"]'::jsonb, '["Fluoropolymer Heat Curing & Sintering (proc-001)","Wastewater Heavy Metal Precipitation (proc-009)"]'::jsonb, '["DuPont Industrial Fluoromaterials (supp-008)","Solvay Specialty Chemicals (supp-005)"]'::jsonb, '["Mandatory substitution of fluorosurfactant aids prior to June 2026","Installation of fenceline granular activated carbon (GAC) water polishing units","Submission of alternative assessment dossier to ECHA within 90 days"]'::jsonb, '["Initiate pilot testing of non-fluorinated siloxane alternative for Apex-Fluor 400 formulation","Audit Dresden facility effluent discharge using high-resolution liquid chromatography (LC-MS/MS)","Issue formal compliance query to suppliers supp-008 and supp-005 requesting PFAS impurity certificates"]'::jsonb, '2026-06-30T00:00:00Z'::timestamptz, 'CRITICAL'::"RiskLevel", 'CRITICAL'::"RiskLevel", 0.98, true, '["ECHA Restriction Report Proposal Annex XVII Entry 68 Revision 4, Section 2.1"]'::jsonb, 'PENDING')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "RegulatoryChange" ("id", "regulationId", "previousVersionId", "newVersionId", "changeType", "summary", "changedSections", "severity", "detectedAt", "effectiveDate", "reviewStatus")
VALUES ('chg-002', 'reg-004', 'ver-reg-004-1', 'ver-reg-004-2', 'OBLIGATION_CHANGE'::"ChangeType", 'PPWR 2024 revision imposes mandatory 35% post-consumer recycled (PCR) content for contact-sensitive packaging and bans perfluorinated barriers in food contact film.', '[{"section":"Article 6(1) & Article 13 — Recycled Content & Chemical Safety","changeType":"OBLIGATION_CHANGE","oldText":"Member states shall encourage packaging manufacturers to incorporate secondary raw materials into plastic packaging where technically feasible. Economic operators should achieve voluntary recycled content targets of 25% by 2030.","newText":"By 1 November 2025, each unit of plastic packaging placed on the European Union market shall contain a mandatory minimum of 35% post-consumer recycled plastic (PCR) verified via certified mass balance chain-of-custody. Furthermore, food contact packaging containing intentionally added PFAS exceeding 25 ppm or total fluorine exceeding 50 mg/kg is strictly prohibited from market placement."}]'::jsonb, 'HIGH'::"RiskLevel", NOW(), '2025-11-01T00:00:00Z'::timestamptz, 'PENDING')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "RegulatoryChangeSection" ("id", "regulatoryChangeId", "sectionIdentifier", "oldText", "newText", "changeType")
VALUES ('sec-chg-002', 'chg-002', 'Article 6(1) & Article 13 — Recycled Content & Chemical Safety', 'Member states shall encourage packaging manufacturers to incorporate secondary raw materials into plastic packaging where technically feasible. Economic operators should achieve voluntary recycled content targets of 25% by 2030.', 'By 1 November 2025, each unit of plastic packaging placed on the European Union market shall contain a mandatory minimum of 35% post-consumer recycled plastic (PCR) verified via certified mass balance chain-of-custody. Furthermore, food contact packaging containing intentionally added PFAS exceeding 25 ppm or total fluorine exceeding 50 mg/kg is strictly prohibited from market placement.', 'OBLIGATION_CHANGE'::"ChangeType")
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "AIAnalysis" ("id", "regulatoryChangeId", "summary", "whatChanged", "whyItMatters", "affectedProducts", "affectedFacilities", "affectedProcesses", "affectedSuppliers", "potentialObligations", "recommendedActions", "effectiveDate", "urgency", "riskLevel", "confidence", "requiresHumanReview", "sourceReferences", "reviewStatus")
VALUES ('aia-chg-002', 'chg-002', 'EU PPWR shifts from voluntary recycled content targets to legally binding 35% post-consumer recycled minimums, alongside a blanket prohibition of PFAS barriers in food packaging.', '["Mandatory 35% PCR minimum content enacted for all plastic packaging entering the EU","Immediate ban on intentionally added PFAS or total fluorine >50 mg/kg in food contact materials","Third-party mass balance chain-of-custody certification mandated"]'::jsonb, 'EcoPack Ultra-Barrier Food Film (prod-002) is manufactured at Apex Austin (fac-002) using bio-PLA but utilizes an external barrier coating that must be verified for fluorine absence and certified for PCR compliance.', '["EcoPack Ultra-Barrier Food Film (EP-UBF-09)"]'::jsonb, '["Apex BioPlastics & Packaging — Austin (fac-002)"]'::jsonb, '["High-Pressure Bio-Resin Extrusion (proc-005)"]'::jsonb, '["Nordic Bio-Polymers AB (supp-003)","Stora Enso Circular Packaging (supp-012)"]'::jsonb, '["Re-certify EcoPack film bill-of-materials against EN 13432 and PCR mass-balance standards","Eliminate any trace fluorinated processing aids in extrusion lines"]'::jsonb, '["Execute fluorine combustibility testing on Austin plant extrusion barrier layers","Secure guaranteed 40% PCR certified resin batches from Nordic Bio-Polymers"]'::jsonb, '2025-11-01T00:00:00Z'::timestamptz, 'HIGH'::"RiskLevel", 'HIGH'::"RiskLevel", 0.95, true, '["Regulation (EU) 2024/PPWR Final Text, Articles 6, 7 & 13"]'::jsonb, 'PENDING')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "RegulatoryChange" ("id", "regulationId", "previousVersionId", "newVersionId", "changeType", "summary", "changedSections", "severity", "detectedAt", "effectiveDate", "reviewStatus")
VALUES ('chg-003', 'reg-006', 'ver-reg-006-1', 'ver-reg-006-2', 'DEADLINE_CHANGE'::"ChangeType", 'EU Battery Passport digital QR code deployment accelerated to August 2025 with strict supply chain carbon footprint declaration rules.', '[{"section":"Article 77 & Annex VI — Digital Battery Passport Architecture","changeType":"DEADLINE_CHANGE","oldText":"By 18 February 2027, economic operators placing industrial batteries with capacity above 2 kWh on the market shall ensure that a battery passport is accessible via a secure electronic record system.","newText":"By 18 August 2025, each industrial battery with capacity above 2 kWh placed on the Union market or put into service shall possess an accessible Digital Battery Passport linked to an indelible QR code. The passport must declare certified lifecycle carbon footprint (kg CO2e/kWh), recycled cobalt/lithium/nickel quotas, and validated supply chain due diligence reports."}]'::jsonb, 'HIGH'::"RiskLevel", NOW(), '2025-08-18T00:00:00Z'::timestamptz, 'PENDING')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "RegulatoryChangeSection" ("id", "regulatoryChangeId", "sectionIdentifier", "oldText", "newText", "changeType")
VALUES ('sec-chg-003', 'chg-003', 'Article 77 & Annex VI — Digital Battery Passport Architecture', 'By 18 February 2027, economic operators placing industrial batteries with capacity above 2 kWh on the market shall ensure that a battery passport is accessible via a secure electronic record system.', 'By 18 August 2025, each industrial battery with capacity above 2 kWh placed on the Union market or put into service shall possess an accessible Digital Battery Passport linked to an indelible QR code. The passport must declare certified lifecycle carbon footprint (kg CO2e/kWh), recycled cobalt/lithium/nickel quotas, and validated supply chain due diligence reports.', 'DEADLINE_CHANGE'::"ChangeType")
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "AIAnalysis" ("id", "regulatoryChangeId", "summary", "whatChanged", "whyItMatters", "affectedProducts", "affectedFacilities", "affectedProcesses", "affectedSuppliers", "potentialObligations", "recommendedActions", "effectiveDate", "urgency", "riskLevel", "confidence", "requiresHumanReview", "sourceReferences", "reviewStatus")
VALUES ('aia-chg-003', 'chg-003', 'Digital Battery Passport enforcement moved forward by 18 months to August 2025, requiring verifiable carbon footprint and material origin data.', '["Battery Passport deadline brought forward from Feb 2027 to 18 August 2025","Mandatory inclusion of certified supply chain carbon footprint per kWh","QR code permanent laser etching requirement on pack chassis"]'::jsonb, 'PowerCell X9 Battery Pack (prod-003) assembled in Osaka (fac-004) exports heavily to Germany and Belgium. Missing the August 2025 deadline blocks CE marking and customs clearance.', '["PowerCell X9 High-Density Storage Pack (PCX9-BAT-48V)","PureVolt Polymeric Separator (PVC-POLY-10)"]'::jsonb, '["Apex Battery Assembly & Testing — Osaka (fac-004)"]'::jsonb, '["Automated Cylindrical Cell Laser Tab Welding (proc-012)","Cathode Slurry Mixing (proc-004)"]'::jsonb, '["Rio Tinto Battery Materials (supp-004)","Umicore Cathode Refining (supp-009)","LG Energy Materials (supp-010)"]'::jsonb, '["Implement Battery Passport API connector compliant with EU CIRPASS architecture","Collect verified Scope 1, 2, and 3 carbon data from Rio Tinto and Umicore"]'::jsonb, '["Contract third-party ISO 14044 lifecycle analysis auditor for PowerCell X9","Install QR code laser-etching verification camera on Osaka assembly line"]'::jsonb, '2025-08-18T00:00:00Z'::timestamptz, 'HIGH'::"RiskLevel", 'HIGH'::"RiskLevel", 0.94, false, '["Regulation (EU) 2023/1542, Articles 77 and 78"]'::jsonb, 'PENDING')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "RegulatoryChange" ("id", "regulationId", "previousVersionId", "newVersionId", "changeType", "summary", "changedSections", "severity", "detectedAt", "effectiveDate", "reviewStatus")
VALUES ('chg-004', 'reg-007', 'ver-reg-007-1', 'ver-reg-007-2', 'REPORTING_CHANGE'::"ChangeType", 'US EPA TSCA Sec 8(a)(7) reporting window finalized: mandatory submission of 12 years of retrospective PFAS import data with no de minimis exemption.', '[{"section":"40 CFR Part 705.15 — Scope of Reporting & Data Elements","changeType":"REPORTING_CHANGE","oldText":"Manufacturers of PFAS substances may submit historical production estimates if exact metering records from 2011 to 2018 are unavailable. Articles containing trace concentrations below 0.1% by weight were proposed for exclusion.","newText":"All entities that manufactured or imported PFAS or PFAS-containing articles between January 1, 2011 and December 31, 2022 must submit definitive reports via the EPA Central Data Exchange (CDX). There is NO DE MINIMIS THRESHOLD. Trace impurities, components of imported polymers, and processing aids are fully subject to mandatory reporting. Reporting opens November 2024 and closes May 8, 2025."}]'::jsonb, 'CRITICAL'::"RiskLevel", NOW(), '2025-05-08T00:00:00Z'::timestamptz, 'PENDING')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "RegulatoryChangeSection" ("id", "regulatoryChangeId", "sectionIdentifier", "oldText", "newText", "changeType")
VALUES ('sec-chg-004', 'chg-004', '40 CFR Part 705.15 — Scope of Reporting & Data Elements', 'Manufacturers of PFAS substances may submit historical production estimates if exact metering records from 2011 to 2018 are unavailable. Articles containing trace concentrations below 0.1% by weight were proposed for exclusion.', 'All entities that manufactured or imported PFAS or PFAS-containing articles between January 1, 2011 and December 31, 2022 must submit definitive reports via the EPA Central Data Exchange (CDX). There is NO DE MINIMIS THRESHOLD. Trace impurities, components of imported polymers, and processing aids are fully subject to mandatory reporting. Reporting opens November 2024 and closes May 8, 2025.', 'REPORTING_CHANGE'::"ChangeType")
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "AIAnalysis" ("id", "regulatoryChangeId", "summary", "whatChanged", "whyItMatters", "affectedProducts", "affectedFacilities", "affectedProcesses", "affectedSuppliers", "potentialObligations", "recommendedActions", "effectiveDate", "urgency", "riskLevel", "confidence", "requiresHumanReview", "sourceReferences", "reviewStatus")
VALUES ('aia-chg-004', 'chg-004', 'EPA eliminated the proposed 0.1% de minimis exemption for TSCA PFAS reporting, mandating exhaustive retrospective reporting back to 2011.', '["Removal of de minimis threshold for articles containing trace PFAS","Mandatory electronic reporting deadline fixed to May 8, 2025","Historical records from 2011 to 2022 must be reconstructed and certified under penalty of perjury"]'::jsonb, 'Apex Austin (fac-002) imported fluoropolymer additives from Japanese suppliers between 2014 and 2021. Exposure to TSCA Section 16 penalties ($46,989/day) if retrospective import volumes are unfiled.', '["Apex-Fluor 400 Protective Polymer (AF400-EUR-01)","CryoSeal Liquid Gasket (CSL-GAS-88)"]'::jsonb, '["Apex BioPlastics & Packaging — Austin (fac-002)"]'::jsonb, '["Nitrogen Blanket Chemical Synthesis (proc-007)"]'::jsonb, '["Tokyo ChemCorp Ltd. (supp-001)","DuPont Industrial Fluoromaterials (supp-008)"]'::jsonb, '["Reconstruct 12 years of customs entry filings and chemical CAS logs","Submit completed Form 7710-X via EPA CDX portal"]'::jsonb, '["Engage external customs brokerage audit team to pull 2011-2022 ACE entry records","Coordinate chemical characterization sign-offs with legal team"]'::jsonb, '2025-05-08T00:00:00Z'::timestamptz, 'CRITICAL'::"RiskLevel", 'CRITICAL'::"RiskLevel", 0.99, true, '["US EPA Final Rule 88 FR 70516, 40 CFR Part 705"]'::jsonb, 'PENDING')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "RegulatoryChange" ("id", "regulationId", "previousVersionId", "newVersionId", "changeType", "summary", "changedSections", "severity", "detectedAt", "effectiveDate", "reviewStatus")
VALUES ('chg-005', 'reg-003', 'ver-reg-003-1', 'ver-reg-003-2', 'SCOPE_CHANGE'::"ChangeType", 'EU CBAM expands reporting to include Scope 3 precursor emissions and sets definitive financial carbon certificate purchasing timeline.', '[{"section":"Annex I & Annex III — Emissions Calculation Methodologies","changeType":"SCOPE_CHANGE","oldText":"During the transitional phase, declarants shall report direct Scope 1 emissions and indirect Scope 2 electricity emissions using either EU default default values or facility monitoring data.","newText":"Effective 1 January 2026, the CBAM financial definitive regime commences. Importers must purchase CBAM certificates matching weekly EU ETS auction prices. The boundary of embedded emissions is formally expanded to include complex precursors (Annex I chemical resins, hydrogen derivatives) and upstream Scope 3 extraction footprint. Default values are restricted to maximum penalty calculations."}]'::jsonb, 'HIGH'::"RiskLevel", NOW(), '2026-01-01T00:00:00Z'::timestamptz, 'PENDING')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "RegulatoryChangeSection" ("id", "regulatoryChangeId", "sectionIdentifier", "oldText", "newText", "changeType")
VALUES ('sec-chg-005', 'chg-005', 'Annex I & Annex III — Emissions Calculation Methodologies', 'During the transitional phase, declarants shall report direct Scope 1 emissions and indirect Scope 2 electricity emissions using either EU default default values or facility monitoring data.', 'Effective 1 January 2026, the CBAM financial definitive regime commences. Importers must purchase CBAM certificates matching weekly EU ETS auction prices. The boundary of embedded emissions is formally expanded to include complex precursors (Annex I chemical resins, hydrogen derivatives) and upstream Scope 3 extraction footprint. Default values are restricted to maximum penalty calculations.', 'SCOPE_CHANGE'::"ChangeType")
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "AIAnalysis" ("id", "regulatoryChangeId", "summary", "whatChanged", "whyItMatters", "affectedProducts", "affectedFacilities", "affectedProcesses", "affectedSuppliers", "potentialObligations", "recommendedActions", "effectiveDate", "urgency", "riskLevel", "confidence", "requiresHumanReview", "sourceReferences", "reviewStatus")
VALUES ('aia-chg-005', 'chg-005', 'CBAM enters definitive financial tariff phase with mandatory Scope 3 precursor emissions inclusion, replacing transition estimation models.', '["Transition phase concludes, financial CBAM certificate purchasing becomes mandatory","Scope 3 upstream chemical precursor emissions added to covered boundary","Default values will incur highest-tier penalty coefficients"]'::jsonb, 'Apex Antwerp refinery (fac-003) imports specialty chemical precursors from Formosa Plastics (supp-007) in Taiwan and Rio Tinto (supp-004) in Australia. High embedded carbon will result in substantial import tariffs.', '["SynthoFlex Fluoroelastomer (SF-ELAST-22)","PureVolt Polymeric Separator (PVC-POLY-10)"]'::jsonb, '["Apex Chemical Refineries — Antwerp (fac-003)"]'::jsonb, '["Solvent Recovery & Distillation (proc-003)"]'::jsonb, '["Formosa Advanced Petrochemicals (supp-007)","Rio Tinto Battery Materials (supp-004)"]'::jsonb, '["Register as Authorized CBAM Declarant with Belgian customs authorities","Acquire verified Primary Data carbon certificates from Formosa and Rio Tinto"]'::jsonb, '["Establish direct API telemetry with suppliers for shipment-level emission certificates","Evaluate low-carbon domestic EU suppliers to replace high-tariff Taiwanese raw materials"]'::jsonb, '2026-01-01T00:00:00Z'::timestamptz, 'HIGH'::"RiskLevel", 'HIGH'::"RiskLevel", 0.93, false, '["Regulation (EU) 2023/956, Annex III and Commission Implementing Regulation 2023/1773"]'::jsonb, 'PENDING')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "RegulatoryChange" ("id", "regulationId", "previousVersionId", "newVersionId", "changeType", "summary", "changedSections", "severity", "detectedAt", "effectiveDate", "reviewStatus")
VALUES ('chg-006', 'reg-008', 'ver-reg-008-1', 'ver-reg-008-2', 'REPORTING_CHANGE'::"ChangeType", 'California CARB establishes electronic disclosure portal and third-party assurance protocols for SB 253 Scope 1, 2, and 3 disclosures.', '[{"section":"Section 38532(c) — Assurance & Reporting Architecture","changeType":"REPORTING_CHANGE","oldText":"Disclosures shall begin in 2026 for Scope 1 and Scope 2 emissions, and Scope 3 emissions shall be reported within 180 days of public regulations adoption.","newText":"Reporting entities shall submit audited Scope 1 and Scope 2 emissions by 1 June 2026, and full Scope 3 supply chain greenhouse gas emissions by 1 December 2026. Reporting must adhere to the GHG Protocol Corporate Standard and possess limited assurance by an independent CARB-accredited verification body."}]'::jsonb, 'HIGH'::"RiskLevel", NOW(), '2026-01-01T00:00:00Z'::timestamptz, 'PENDING')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "RegulatoryChangeSection" ("id", "regulatoryChangeId", "sectionIdentifier", "oldText", "newText", "changeType")
VALUES ('sec-chg-006', 'chg-006', 'Section 38532(c) — Assurance & Reporting Architecture', 'Disclosures shall begin in 2026 for Scope 1 and Scope 2 emissions, and Scope 3 emissions shall be reported within 180 days of public regulations adoption.', 'Reporting entities shall submit audited Scope 1 and Scope 2 emissions by 1 June 2026, and full Scope 3 supply chain greenhouse gas emissions by 1 December 2026. Reporting must adhere to the GHG Protocol Corporate Standard and possess limited assurance by an independent CARB-accredited verification body.', 'REPORTING_CHANGE'::"ChangeType")
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "AIAnalysis" ("id", "regulatoryChangeId", "summary", "whatChanged", "whyItMatters", "affectedProducts", "affectedFacilities", "affectedProcesses", "affectedSuppliers", "potentialObligations", "recommendedActions", "effectiveDate", "urgency", "riskLevel", "confidence", "requiresHumanReview", "sourceReferences", "reviewStatus")
VALUES ('aia-chg-006', 'chg-006', 'CARB codified exact deadlines and mandatory limited assurance verification for SB 253 corporate disclosures.', '["Deadlines established: June 1, 2026 (Scope 1/2) and Dec 1, 2026 (Scope 3)","Mandatory limited assurance by CARB-accredited verifiers","Strict GHG Protocol Corporate Standard alignment enforced"]'::jsonb, 'Apex Industrial Systems exceeds the $1B revenue threshold and conducts extensive commerce in California. Austin plant and global suppliers must be audited.', '["All Apex Products"]'::jsonb, '["Apex BioPlastics & Packaging — Austin (fac-002)","Apex Advanced Materials — Dresden (fac-001)"]'::jsonb, '["High-Pressure Bio-Resin Extrusion (proc-005)","Regenerative Thermal Oxidation (proc-008)"]'::jsonb, '["All 12 Global Suppliers"]'::jsonb, '["Publish board-approved GHG inventory compliant with CARB rules","Contract accredited third-party verification auditor"]'::jsonb, '["Consolidate multi-facility Scope 1, 2, and 3 telemetry into centralized ESG ledger","Initiate baseline pre-assurance review with Big 4 audit partner"]'::jsonb, '2026-01-01T00:00:00Z'::timestamptz, 'HIGH'::"RiskLevel", 'HIGH'::"RiskLevel", 0.96, false, '["California Health and Safety Code Division 25.5, Part 3.7"]'::jsonb, 'PENDING')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "RegulatoryChange" ("id", "regulationId", "previousVersionId", "newVersionId", "changeType", "summary", "changedSections", "severity", "detectedAt", "effectiveDate", "reviewStatus")
VALUES ('chg-007', 'reg-011', 'ver-reg-011-1', 'ver-reg-011-2', 'THRESHOLD_CHANGE'::"ChangeType", 'EPA HON Rule slashes fenceline benzene and 1,3-butadiene action levels to 3.0 ug/m3 with mandatory public web reporting.', '[{"section":"40 CFR 63 Subpart G — Fenceline Monitoring Work Practice Standards","changeType":"THRESHOLD_CHANGE","oldText":"Facilities shall sample organic hazardous air pollutants at perimeter monitors quarterly. The action level for corrective root cause analysis was 9.0 ug/m3 annual rolling average.","newText":"Facilities subject to Subpart G must install continuous passive or real-time fenceline sorbent tubes. The rolling annual average action level for benzene is reduced to 3.0 ug/m3 (formerly 9.0 ug/m3). Exceedance of the action level triggers mandatory root-cause analysis within 5 days and corrective action within 45 days, with all raw data streamed to the EPA public fenceline dashboard."}]'::jsonb, 'MEDIUM'::"RiskLevel", NOW(), '2026-04-09T00:00:00Z'::timestamptz, 'PENDING')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "RegulatoryChangeSection" ("id", "regulatoryChangeId", "sectionIdentifier", "oldText", "newText", "changeType")
VALUES ('sec-chg-007', 'chg-007', '40 CFR 63 Subpart G — Fenceline Monitoring Work Practice Standards', 'Facilities shall sample organic hazardous air pollutants at perimeter monitors quarterly. The action level for corrective root cause analysis was 9.0 ug/m3 annual rolling average.', 'Facilities subject to Subpart G must install continuous passive or real-time fenceline sorbent tubes. The rolling annual average action level for benzene is reduced to 3.0 ug/m3 (formerly 9.0 ug/m3). Exceedance of the action level triggers mandatory root-cause analysis within 5 days and corrective action within 45 days, with all raw data streamed to the EPA public fenceline dashboard.', 'THRESHOLD_CHANGE'::"ChangeType")
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "AIAnalysis" ("id", "regulatoryChangeId", "summary", "whatChanged", "whyItMatters", "affectedProducts", "affectedFacilities", "affectedProcesses", "affectedSuppliers", "potentialObligations", "recommendedActions", "effectiveDate", "urgency", "riskLevel", "confidence", "requiresHumanReview", "sourceReferences", "reviewStatus")
VALUES ('aia-chg-007', 'chg-007', 'EPA slashed industrial chemical fenceline action levels by 66% and mandated public fenceline monitoring telemetry.', '["Action level lowered from 9.0 ug/m3 to 3.0 ug/m3","Root cause analysis window tightened to 5 days","Real-time automated data reporting to public EPA portal"]'::jsonb, 'Apex Austin facility (fac-002) and partner refining nodes must ensure chemical distillation and regenerative oxidizers operate below the 3.0 ug/m3 cap.', '["BioSolv Industrial Degreaser (BS-DEGR-55)"]'::jsonb, '["Apex BioPlastics & Packaging — Austin (fac-002)"]'::jsonb, '["Regenerative Thermal Oxidation (proc-008)","VOC Carbon Bed Adsorption (proc-014)"]'::jsonb, '["Air Liquide Industrial Gases (supp-011)"]'::jsonb, '["Deploy 16 fenceline passive sampling tubes with bi-weekly GC-FID analysis","Establish automated root cause escalation protocol"]'::jsonb, '["Conduct optical gas imaging (OGI) leak detection survey across Austin facility piping","Calibrate Regenerative Thermal Oxidizer combustion efficiency to 99.8%"]'::jsonb, '2026-04-09T00:00:00Z'::timestamptz, 'MEDIUM'::"RiskLevel", 'MEDIUM'::"RiskLevel", 0.92, false, '["US EPA Final Clean Air Act SOCMI Rule, 89 FR 32900"]'::jsonb, 'PENDING')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "RegulatoryChange" ("id", "regulationId", "previousVersionId", "newVersionId", "changeType", "summary", "changedSections", "severity", "detectedAt", "effectiveDate", "reviewStatus")
VALUES ('chg-008', 'reg-010', 'ver-reg-010-1', 'ver-reg-010-2', 'PENALTY_CHANGE'::"ChangeType", 'BAFA tightens environmental due diligence enforcement under German LkSG, adding mandatory mercury and POP audits.', '[{"section":"Section 7 & 8 — Environmental Due Diligence Obligations","changeType":"PENALTY_CHANGE","oldText":"Companies must perform general human rights risk analysis annually and document procedures for direct Tier-1 suppliers.","newText":"BAFA will systematically audit compliance with the Minamata Convention on Mercury and the Stockholm Convention on Persistent Organic Pollutants across Tier-1 and indirect Tier-N suppliers where substantiated hints exist. Failure to submit audited BAFA annual reports by April 30 triggers automatic fines of up to €800,000."}]'::jsonb, 'MEDIUM'::"RiskLevel", NOW(), '2024-01-01T00:00:00Z'::timestamptz, 'PENDING')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "RegulatoryChangeSection" ("id", "regulatoryChangeId", "sectionIdentifier", "oldText", "newText", "changeType")
VALUES ('sec-chg-008', 'chg-008', 'Section 7 & 8 — Environmental Due Diligence Obligations', 'Companies must perform general human rights risk analysis annually and document procedures for direct Tier-1 suppliers.', 'BAFA will systematically audit compliance with the Minamata Convention on Mercury and the Stockholm Convention on Persistent Organic Pollutants across Tier-1 and indirect Tier-N suppliers where substantiated hints exist. Failure to submit audited BAFA annual reports by April 30 triggers automatic fines of up to €800,000.', 'PENALTY_CHANGE'::"ChangeType")
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "AIAnalysis" ("id", "regulatoryChangeId", "summary", "whatChanged", "whyItMatters", "affectedProducts", "affectedFacilities", "affectedProcesses", "affectedSuppliers", "potentialObligations", "recommendedActions", "effectiveDate", "urgency", "riskLevel", "confidence", "requiresHumanReview", "sourceReferences", "reviewStatus")
VALUES ('aia-chg-008', 'chg-008', 'German regulator BAFA expanded LkSG auditing to enforce strict chemical pollutant and mercury prevention across supply tiers.', '["Direct focus on Minamata mercury and Stockholm POPs compliance","Automatic penalty trigger for unfiled supply chain reports","Increased scrutiny of Tier-N indirect suppliers"]'::jsonb, 'Apex Dresden plant (fac-001) is located in Germany and falls directly under BAFA oversight. Taiwanese and Australian suppliers must be screened.', '["All European product lines"]'::jsonb, '["Apex Advanced Materials — Dresden (fac-001)"]'::jsonb, '["Acid Leaching & Neutralization (proc-002)"]'::jsonb, '["Formosa Advanced Petrochemicals (supp-007)","Rio Tinto Battery Materials (supp-004)"]'::jsonb, '["Submit annual LkSG report via BAFA digital platform","Execute environmental on-site audit of high-risk suppliers"]'::jsonb, '["Issue LkSG questionnaire covering POPs and mercury to Formosa Plastics","Update supplier code of conduct with mandatory BAFA audit clauses"]'::jsonb, '2024-01-01T00:00:00Z'::timestamptz, 'MEDIUM'::"RiskLevel", 'MEDIUM'::"RiskLevel", 0.91, false, '["BAFA LkSG Implementation Guidance 2024, Section 3.4"]'::jsonb, 'PENDING')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "RegulatoryChange" ("id", "regulationId", "previousVersionId", "newVersionId", "changeType", "summary", "changedSections", "severity", "detectedAt", "effectiveDate", "reviewStatus")
VALUES ('chg-009', 'reg-001', 'ver-reg-001-1', 'ver-reg-001-2', 'REPORTING_CHANGE'::"ChangeType", 'EFRAG publishes finalized ESRS XBRL taxonomy and digital tagging requirements for CSRD corporate sustainability statements.', '[{"section":"Annex I — ESRS E1, E2, E4 & E5 Digital Reporting Taxonomy","changeType":"REPORTING_CHANGE","oldText":"Sustainability statements shall be included in a dedicated section of the management report in human-readable PDF format.","newText":"Sustainability statements must be marked up using Inline XBRL (iXBRL) according to the EFRAG ESRS Digital Taxonomy. Every quantitative metric—including Scope 1, 2, and 3 emissions breakdowns, water stress indicators, circular material inflows, and hazardous chemical volumes—must feature granular digital tags validated against ESMA technical standards."}]'::jsonb, 'HIGH'::"RiskLevel", NOW(), '2025-01-01T00:00:00Z'::timestamptz, 'PENDING')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "RegulatoryChangeSection" ("id", "regulatoryChangeId", "sectionIdentifier", "oldText", "newText", "changeType")
VALUES ('sec-chg-009', 'chg-009', 'Annex I — ESRS E1, E2, E4 & E5 Digital Reporting Taxonomy', 'Sustainability statements shall be included in a dedicated section of the management report in human-readable PDF format.', 'Sustainability statements must be marked up using Inline XBRL (iXBRL) according to the EFRAG ESRS Digital Taxonomy. Every quantitative metric—including Scope 1, 2, and 3 emissions breakdowns, water stress indicators, circular material inflows, and hazardous chemical volumes—must feature granular digital tags validated against ESMA technical standards.', 'REPORTING_CHANGE'::"ChangeType")
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "AIAnalysis" ("id", "regulatoryChangeId", "summary", "whatChanged", "whyItMatters", "affectedProducts", "affectedFacilities", "affectedProcesses", "affectedSuppliers", "potentialObligations", "recommendedActions", "effectiveDate", "urgency", "riskLevel", "confidence", "requiresHumanReview", "sourceReferences", "reviewStatus")
VALUES ('aia-chg-009', 'chg-009', 'CSRD sustainability reports must be submitted as machine-readable iXBRL tagged filings starting FY2025.', '["Mandatory iXBRL digital tagging replacing flat PDF reports","Granular tags required for over 1,100 ESRS data points","Automated ESMA compliance validation rules applied"]'::jsonb, 'Apex European entities must ensure ERP and ESG software outputs valid iXBRL data blocks to prevent filing rejections.', '["All products"]'::jsonb, '["Apex Advanced Materials — Dresden (fac-001)","Apex Chemical Refineries — Antwerp (fac-003)"]'::jsonb, '["All 15 processes"]'::jsonb, '["All suppliers"]'::jsonb, '["Integrate iXBRL digital tagging into corporate sustainability reporting pipeline","Obtain auditor attestation on digital tagging compliance"]'::jsonb, '["Implement RegulaMap CSRD tagging exporter module","Map internal facility energy and waste metrics to EFRAG ESRS E1 and E2 schema codes"]'::jsonb, '2025-01-01T00:00:00Z'::timestamptz, 'HIGH'::"RiskLevel", 'HIGH'::"RiskLevel", 0.97, false, '["EFRAG ESRS XBRL Taxonomy Release v1.0, July 2024"]'::jsonb, 'PENDING')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "RegulatoryChange" ("id", "regulationId", "previousVersionId", "newVersionId", "changeType", "summary", "changedSections", "severity", "detectedAt", "effectiveDate", "reviewStatus")
VALUES ('chg-010', 'reg-013', 'ver-reg-013-1', 'ver-reg-013-2', 'SCOPE_CHANGE'::"ChangeType", 'EU IED 2.0 directive formally incorporates industrial battery gigafactories and electrolyzer facilities into mandatory environmental permit rules.', '[{"section":"Annex I, Category 4.7 & 6.12 — Battery Manufacturing & Industrial Installations","changeType":"SCOPE_CHANGE","oldText":"Installations for the production of inorganic or organic chemicals with capacity exceeding thresholds are subject to IED permits. Battery assembly was previously regulated under generic national industrial codes.","newText":"Annex I is amended to explicitly include: (a) Installations for the manufacture of battery cells or modules with an annual production capacity exceeding 0.5 GWh; (b) Installations for the production of hydrogen via electrolysis exceeding 50 MW capacity. Operators must establish certified Environmental Management Systems (EMS) and adhere to revised BAT-AEL emission limits for volatile organics and heavy metals."}]'::jsonb, 'HIGH'::"RiskLevel", NOW(), '2026-08-04T00:00:00Z'::timestamptz, 'PENDING')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "RegulatoryChangeSection" ("id", "regulatoryChangeId", "sectionIdentifier", "oldText", "newText", "changeType")
VALUES ('sec-chg-010', 'chg-010', 'Annex I, Category 4.7 & 6.12 — Battery Manufacturing & Industrial Installations', 'Installations for the production of inorganic or organic chemicals with capacity exceeding thresholds are subject to IED permits. Battery assembly was previously regulated under generic national industrial codes.', 'Annex I is amended to explicitly include: (a) Installations for the manufacture of battery cells or modules with an annual production capacity exceeding 0.5 GWh; (b) Installations for the production of hydrogen via electrolysis exceeding 50 MW capacity. Operators must establish certified Environmental Management Systems (EMS) and adhere to revised BAT-AEL emission limits for volatile organics and heavy metals.', 'SCOPE_CHANGE'::"ChangeType")
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "AIAnalysis" ("id", "regulatoryChangeId", "summary", "whatChanged", "whyItMatters", "affectedProducts", "affectedFacilities", "affectedProcesses", "affectedSuppliers", "potentialObligations", "recommendedActions", "effectiveDate", "urgency", "riskLevel", "confidence", "requiresHumanReview", "sourceReferences", "reviewStatus")
VALUES ('aia-chg-010', 'chg-010', 'Industrial battery plants >0.5 GWh are now directly regulated under the stringent EU Industrial Emissions Directive.', '["Battery manufacturing >0.5 GWh added to Annex I permitting scope","Mandatory EMAS or ISO 14001 Environmental Management System","Binding BAT-AEL emission limit values applied to battery processing"]'::jsonb, 'Although Osaka plant is in Japan, Apex is evaluating a 1.5 GWh battery cell line in Antwerp (Belgium) which will require immediate IED permitting.', '["PowerCell X9 High-Density Storage Pack (PCX9-BAT-48V)"]'::jsonb, '["Apex Chemical Refineries — Antwerp (fac-003)","Apex Battery Assembly — Osaka (fac-004)"]'::jsonb, '["Cathode Slurry Mixing (proc-004)","Automated Cylindrical Cell Laser Tab Welding (proc-012)"]'::jsonb, '["Umicore Cathode Refining (supp-009)"]'::jsonb, '["Prepare comprehensive IED Baseline Environmental Report for planned Antwerp expansion","Implement closed-loop solvent recovery certified under BAT guidelines"]'::jsonb, '["Review BAT Reference Document (BREF) on Surface Treatment using Organic Solvents","Conduct environmental baseline soil and groundwater survey at Antwerp site"]'::jsonb, '2026-08-04T00:00:00Z'::timestamptz, 'HIGH'::"RiskLevel", 'HIGH'::"RiskLevel", 0.95, true, '["Directive (EU) 2024/1785, Articles 3, 14 & Annex I"]'::jsonb, 'PENDING')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "RegulatoryChange" ("id", "regulationId", "previousVersionId", "newVersionId", "changeType", "summary", "changedSections", "severity", "detectedAt", "effectiveDate", "reviewStatus")
VALUES ('chg-011', 'reg-021', 'ver-reg-021-1', 'ver-reg-021-2', 'THRESHOLD_CHANGE'::"ChangeType", 'German TA Luft revision caps total dust and organic emissions from chemical synthesis reactors to 5 mg/m3.', '[{"section":"Section 5.2.5 — Total Dust & Class I Organic Compounds","changeType":"THRESHOLD_CHANGE","oldText":"Total dust emissions from chemical reaction exhausts shall not exceed 20 mg/m3 at mass flow rates of 0.20 kg/h or greater.","newText":"Total dust emissions from all chemical synthesis, curing, and compounding exhausts shall not exceed 5.0 mg/m3 at mass flow rates of 0.05 kg/h or greater. For Class I organic compounds, the emission concentration limit is reduced to 10 mg/m3 with mandatory continuous parameter recording."}]'::jsonb, 'MEDIUM'::"RiskLevel", NOW(), '2025-07-01T00:00:00Z'::timestamptz, 'PENDING')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "RegulatoryChangeSection" ("id", "regulatoryChangeId", "sectionIdentifier", "oldText", "newText", "changeType")
VALUES ('sec-chg-011', 'chg-011', 'Section 5.2.5 — Total Dust & Class I Organic Compounds', 'Total dust emissions from chemical reaction exhausts shall not exceed 20 mg/m3 at mass flow rates of 0.20 kg/h or greater.', 'Total dust emissions from all chemical synthesis, curing, and compounding exhausts shall not exceed 5.0 mg/m3 at mass flow rates of 0.05 kg/h or greater. For Class I organic compounds, the emission concentration limit is reduced to 10 mg/m3 with mandatory continuous parameter recording.', 'THRESHOLD_CHANGE'::"ChangeType")
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "AIAnalysis" ("id", "regulatoryChangeId", "summary", "whatChanged", "whyItMatters", "affectedProducts", "affectedFacilities", "affectedProcesses", "affectedSuppliers", "potentialObligations", "recommendedActions", "effectiveDate", "urgency", "riskLevel", "confidence", "requiresHumanReview", "sourceReferences", "reviewStatus")
VALUES ('aia-chg-011', 'chg-011', 'Germany TA Luft lowers dust emission limits by 75% down to 5.0 mg/m3 for chemical exhaust systems.', '["Dust emission cap lowered from 20 mg/m3 to 5.0 mg/m3","Mass flow threshold reduced from 0.20 kg/h to 0.05 kg/h","Mandatory continuous telemetry recording of abatement parameters"]'::jsonb, 'Apex Dresden facility (fac-001) operates curing ovens (proc-001) and calcining lines that must verify HEPA filtration compliance.', '["Apex-Fluor 400 Protective Polymer (AF400-EUR-01)"]'::jsonb, '["Apex Advanced Materials — Dresden (fac-001)"]'::jsonb, '["Fluoropolymer Heat Curing & Sintering (proc-001)"]'::jsonb, '["BASF SE (supp-002)"]'::jsonb, '["Upgrade baghouse filtration media to PTFE membrane filters","Install continuous opacity and differential pressure sensors"]'::jsonb, '["Perform stack emission measurement protocol at Dresden stack K-02","Calibrate differential pressure alarms on exhaust filtration units"]'::jsonb, '2025-07-01T00:00:00Z'::timestamptz, 'MEDIUM'::"RiskLevel", 'MEDIUM'::"RiskLevel", 0.93, false, '["Gemeinsames Ministerialblatt Nr. 48-54, TA Luft Neufassung"]'::jsonb, 'PENDING')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "RegulatoryChange" ("id", "regulationId", "previousVersionId", "newVersionId", "changeType", "summary", "changedSections", "severity", "detectedAt", "effectiveDate", "reviewStatus")
VALUES ('chg-012', 'reg-022', 'ver-reg-022-1', 'ver-reg-022-2', 'OBLIGATION_CHANGE'::"ChangeType", 'EU ESPR enters into force with immediate mandates for Digital Product Passports and destruction ban disclosures for unsold goods.', '[{"section":"Articles 8, 9, 20 & 21 — Digital Product Passport Architecture","changeType":"OBLIGATION_CHANGE","oldText":"Ecodesign requirements applied exclusively to energy-related products under Directive 2009/125/EC.","newText":"The Ecodesign for Sustainable Products Regulation (ESPR) is entered into force. Priority working plans designate chemicals, polymers, textiles, and electronics for mandatory Digital Product Passports (DPP) containing material composition, carbon footprint, and recyclability scores. Companies must publicly disclose the volume of unsold products discarded annually."}]'::jsonb, 'HIGH'::"RiskLevel", NOW(), '2024-07-18T00:00:00Z'::timestamptz, 'PENDING')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "RegulatoryChangeSection" ("id", "regulatoryChangeId", "sectionIdentifier", "oldText", "newText", "changeType")
VALUES ('sec-chg-012', 'chg-012', 'Articles 8, 9, 20 & 21 — Digital Product Passport Architecture', 'Ecodesign requirements applied exclusively to energy-related products under Directive 2009/125/EC.', 'The Ecodesign for Sustainable Products Regulation (ESPR) is entered into force. Priority working plans designate chemicals, polymers, textiles, and electronics for mandatory Digital Product Passports (DPP) containing material composition, carbon footprint, and recyclability scores. Companies must publicly disclose the volume of unsold products discarded annually.', 'OBLIGATION_CHANGE'::"ChangeType")
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "AIAnalysis" ("id", "regulatoryChangeId", "summary", "whatChanged", "whyItMatters", "affectedProducts", "affectedFacilities", "affectedProcesses", "affectedSuppliers", "potentialObligations", "recommendedActions", "effectiveDate", "urgency", "riskLevel", "confidence", "requiresHumanReview", "sourceReferences", "reviewStatus")
VALUES ('aia-chg-012', 'chg-012', 'ESPR replaces the legacy ecodesign directive, extending DPP requirements to virtually all manufactured industrial goods.', '["Scope broadened from energy-using devices to all physical products","Mandatory Digital Product Passport framework enacted","Public disclosure requirement on destruction of unsold inventory"]'::jsonb, 'All 8 Apex products distributed in the EU will require digital product passport schemas within the next 24 months.', '["All Apex Products"]'::jsonb, '["Apex Advanced Materials — Dresden (fac-001)","Apex Chemical Refineries — Antwerp (fac-003)"]'::jsonb, '["All processes"]'::jsonb, '["All suppliers"]'::jsonb, '["Map bill of materials to upcoming DPP data models","Establish zero-destruction policy for surplus chemical and polymer inventory"]'::jsonb, '["Assemble cross-functional product stewardship team to establish DPP repository","Audit inventory disposition workflows across European warehouses"]'::jsonb, '2024-07-18T00:00:00Z'::timestamptz, 'HIGH'::"RiskLevel", 'HIGH'::"RiskLevel", 0.95, false, '["Regulation (EU) 2024/1781, Official Journal L Series"]'::jsonb, 'PENDING')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "RegulatoryChange" ("id", "regulationId", "previousVersionId", "newVersionId", "changeType", "summary", "changedSections", "severity", "detectedAt", "effectiveDate", "reviewStatus")
VALUES ('chg-013', 'reg-005', 'ver-reg-005-1', 'ver-reg-005-2', 'DEADLINE_CHANGE'::"ChangeType", 'European Commission approves 12-month phasing delay for EUDR deforestation due diligence enforcement.', '[{"section":"Article 38 — Entry into Application & Transitional Provisions","changeType":"DEADLINE_CHANGE","oldText":"The regulation shall apply from 30 December 2024 for large operators and traders, and from 30 June 2025 for micro and small enterprises.","newText":"The regulation shall apply from 30 December 2025 for large operators and traders, and from 30 June 2026 for micro and small enterprises. The European Commission Deforestation Due Diligence Information System will open for pre-registration in June 2025 to enable upload of plot polygon coordinates."}]'::jsonb, 'MEDIUM'::"RiskLevel", NOW(), '2025-12-30T00:00:00Z'::timestamptz, 'PENDING')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "RegulatoryChangeSection" ("id", "regulatoryChangeId", "sectionIdentifier", "oldText", "newText", "changeType")
VALUES ('sec-chg-013', 'chg-013', 'Article 38 — Entry into Application & Transitional Provisions', 'The regulation shall apply from 30 December 2024 for large operators and traders, and from 30 June 2025 for micro and small enterprises.', 'The regulation shall apply from 30 December 2025 for large operators and traders, and from 30 June 2026 for micro and small enterprises. The European Commission Deforestation Due Diligence Information System will open for pre-registration in June 2025 to enable upload of plot polygon coordinates.', 'DEADLINE_CHANGE'::"ChangeType")
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "AIAnalysis" ("id", "regulatoryChangeId", "summary", "whatChanged", "whyItMatters", "affectedProducts", "affectedFacilities", "affectedProcesses", "affectedSuppliers", "potentialObligations", "recommendedActions", "effectiveDate", "urgency", "riskLevel", "confidence", "requiresHumanReview", "sourceReferences", "reviewStatus")
VALUES ('aia-chg-013', 'chg-013', 'EU Deforestation Regulation compliance deadline deferred by 12 months, granting additional runway to map supply chains.', '["Enforcement delayed from 30 Dec 2024 to 30 Dec 2025 for large enterprises","Pre-registration portal launch announced for June 2025","Polygon geolocation data validation protocols updated"]'::jsonb, 'Apex packaging materials (prod-002) utilize bio-based cellulose and wood pulp derivatives supplied by Stora Enso. The delay provides vital window to gather forest polygon coordinates.', '["EcoPack Ultra-Barrier Food Film (EP-UBF-09)"]'::jsonb, '["Apex BioPlastics & Packaging — Austin (fac-002)"]'::jsonb, '["High-Pressure Bio-Resin Extrusion (proc-005)"]'::jsonb, '["Stora Enso Circular Packaging (supp-012)"]'::jsonb, '["Collect GIS polygon coordinates for all timber and bio-feedstock plots","Submit due diligence statements to EU Deforestation Registry"]'::jsonb, '["Request certified GIS plot coordinate data package from Stora Enso","Verify zero-deforestation baseline satellite verification imagery"]'::jsonb, '2025-12-30T00:00:00Z'::timestamptz, 'MEDIUM'::"RiskLevel", 'MEDIUM'::"RiskLevel", 0.98, false, '["European Commission Press Release IP/24/5009, Proposal COM(2024) 452"]'::jsonb, 'PENDING')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "RegulatoryChange" ("id", "regulationId", "previousVersionId", "newVersionId", "changeType", "summary", "changedSections", "severity", "detectedAt", "effectiveDate", "reviewStatus")
VALUES ('chg-014', 'reg-014', 'ver-reg-014-1', 'ver-reg-014-2', 'REPORTING_CHANGE'::"ChangeType", 'UK DEFRA publishes illustrative base fees for packaging EPR modulated fee structure.', '[{"section":"Regulation 22 & Schedule 4 — Modulated Disposal Fees","changeType":"REPORTING_CHANGE","oldText":"Producers shall submit packaging weight data semi-annually under the legacy PRN (Packaging Recovery Note) system.","newText":"Effective 1 April 2025, local authority packaging waste management costs will be directly billed to obligated producers via modulated EPR fees. Base fee estimates range from £130-£220/tonne for aluminum, £330-£590/tonne for plastic packaging, and £140-£260/tonne for paper/cardboard. Modulations based on recyclability design will take effect in Year 2."}]'::jsonb, 'MEDIUM'::"RiskLevel", NOW(), '2025-04-01T00:00:00Z'::timestamptz, 'PENDING')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "RegulatoryChangeSection" ("id", "regulatoryChangeId", "sectionIdentifier", "oldText", "newText", "changeType")
VALUES ('sec-chg-014', 'chg-014', 'Regulation 22 & Schedule 4 — Modulated Disposal Fees', 'Producers shall submit packaging weight data semi-annually under the legacy PRN (Packaging Recovery Note) system.', 'Effective 1 April 2025, local authority packaging waste management costs will be directly billed to obligated producers via modulated EPR fees. Base fee estimates range from £130-£220/tonne for aluminum, £330-£590/tonne for plastic packaging, and £140-£260/tonne for paper/cardboard. Modulations based on recyclability design will take effect in Year 2.', 'REPORTING_CHANGE'::"ChangeType")
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "AIAnalysis" ("id", "regulatoryChangeId", "summary", "whatChanged", "whyItMatters", "affectedProducts", "affectedFacilities", "affectedProcesses", "affectedSuppliers", "potentialObligations", "recommendedActions", "effectiveDate", "urgency", "riskLevel", "confidence", "requiresHumanReview", "sourceReferences", "reviewStatus")
VALUES ('aia-chg-014', 'chg-014', 'UK replaces PRN system with direct modulated packaging disposal fee invoices starting April 2025.', '["Direct modulated fees replace legacy PRN trading credits","Fee ranges announced: plastic packaging up to £590/tonne","Mandatory reporting of packaging category and destination nation"]'::jsonb, 'EcoPack products shipped to UK distributors will incur significant annual fees unless certified for kerbside recyclable stream.', '["EcoPack Ultra-Barrier Food Film (EP-UBF-09)"]'::jsonb, '["Apex BioPlastics & Packaging — Austin (fac-002)"]'::jsonb, '["High-Pressure Bio-Resin Extrusion (proc-005)"]'::jsonb, '["Stora Enso Circular Packaging (supp-012)"]'::jsonb, '["Submit UK Report Packaging Data (RPD) bi-annually","Pay DEFRA modulated local authority disposal fees"]'::jsonb, '["Calculate projected UK EPR liability for FY2025 based on current export tonnage","Optimize packaging design to meet OPRL (On-Pack Recycling Label) high-recyclability tier"]'::jsonb, '2025-04-01T00:00:00Z'::timestamptz, 'MEDIUM'::"RiskLevel", 'MEDIUM'::"RiskLevel", 0.94, false, '["UK DEFRA Extended Producer Responsibility for Packaging Guidance, August 2024"]'::jsonb, 'PENDING')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "RegulatoryChange" ("id", "regulationId", "previousVersionId", "newVersionId", "changeType", "summary", "changedSections", "severity", "detectedAt", "effectiveDate", "reviewStatus")
VALUES ('chg-015', 'reg-023', 'ver-reg-023-1', 'ver-reg-023-2', 'DEFINITION_CHANGE'::"ChangeType", 'US EPA finalizes strict PIP (3:1) prohibition in adhesives, sealants, and electronic assemblies without transitional exemptions.', '[{"section":"40 CFR 751.407 — Phenol, isopropylated phosphate (3:1) Prohibition","changeType":"DEFINITION_CHANGE","oldText":"The EPA previously granted temporary enforcement discretions permitting the processing and distribution of PIP (3:1) in articles until October 2024.","newText":"Effective January 6, 2025, the processing and distribution in commerce of PIP (3:1) (CASRN 68937-41-7) and products or articles containing PIP (3:1) is STRICTLY PROHIBITED throughout the United States. All historical enforcement discretions have terminated. Mandatory recordkeeping of complete phase-out and disposal records must be maintained for 5 years."}]'::jsonb, 'HIGH'::"RiskLevel", NOW(), '2025-01-06T00:00:00Z'::timestamptz, 'PENDING')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "RegulatoryChangeSection" ("id", "regulatoryChangeId", "sectionIdentifier", "oldText", "newText", "changeType")
VALUES ('sec-chg-015', 'chg-015', '40 CFR 751.407 — Phenol, isopropylated phosphate (3:1) Prohibition', 'The EPA previously granted temporary enforcement discretions permitting the processing and distribution of PIP (3:1) in articles until October 2024.', 'Effective January 6, 2025, the processing and distribution in commerce of PIP (3:1) (CASRN 68937-41-7) and products or articles containing PIP (3:1) is STRICTLY PROHIBITED throughout the United States. All historical enforcement discretions have terminated. Mandatory recordkeeping of complete phase-out and disposal records must be maintained for 5 years.', 'DEFINITION_CHANGE'::"ChangeType")
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "AIAnalysis" ("id", "regulatoryChangeId", "summary", "whatChanged", "whyItMatters", "affectedProducts", "affectedFacilities", "affectedProcesses", "affectedSuppliers", "potentialObligations", "recommendedActions", "effectiveDate", "urgency", "riskLevel", "confidence", "requiresHumanReview", "sourceReferences", "reviewStatus")
VALUES ('aia-chg-015', 'chg-015', 'EPA ends temporary enforcement discretion: total ban on PIP (3:1) flame retardant in US industrial articles is now in force.', '["Termination of temporary enforcement discretion","Total prohibition on distribution of articles containing PIP (3:1)","Mandatory 5-year retention of phase-out certification records"]'::jsonb, 'CryoSeal Liquid Gasket (prod-006) and electronic potting formulations must be certified 100% free of PIP (3:1) plasticizer.', '["CryoSeal Liquid Gasket (CSL-GAS-88)","SynthoFlex Fluoroelastomer (SF-ELAST-22)"]'::jsonb, '["Apex BioPlastics & Packaging — Austin (fac-002)"]'::jsonb, '["Continuous Vulcanization & Post-Cure (proc-011)"]'::jsonb, '["Shin-Etsu Specialty Silicones (supp-006)"]'::jsonb, '["Collect formal PIP (3:1) free supplier certifications","Quarantine and properly manifest any historical inventory containing PIP (3:1)"]'::jsonb, '["Review supplier safety data sheets (SDS) and test reports for CAS 68937-41-7","Issue Certificate of Non-Use to US customer base"]'::jsonb, '2025-01-06T00:00:00Z'::timestamptz, 'HIGH'::"RiskLevel", 'HIGH'::"RiskLevel", 0.97, true, '["US EPA Final PBT Rule, 40 CFR Part 751"]'::jsonb, 'PENDING')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "RegulatoryChange" ("id", "regulationId", "previousVersionId", "newVersionId", "changeType", "summary", "changedSections", "severity", "detectedAt", "effectiveDate", "reviewStatus")
VALUES ('chg-016', 'reg-015', 'ver-reg-015-1', 'ver-reg-015-2', 'SCOPE_CHANGE'::"ChangeType", 'Japan METI designates PFHxS and related salts as Class I Specified Chemical Substances under CSCL.', '[{"section":"Cabinet Order No. 343 & CSCL Article 2(2)","changeType":"SCOPE_CHANGE","oldText":"PFHxS was monitored under Class II reporting guidelines with voluntary annual production notifications.","newText":"Perfluorohexanesulfonic acid (PFHxS), its salts, and PFHxS-related compounds are designated as Class I Specified Chemical Substances. Manufacture, import, and commercial use are prohibited. Importation of 10 specified articles containing PFHxS (water-repellent fabrics, semiconductor etching agents, metal processing aids) is banned."}]'::jsonb, 'MEDIUM'::"RiskLevel", NOW(), '2024-12-01T00:00:00Z'::timestamptz, 'PENDING')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "RegulatoryChangeSection" ("id", "regulatoryChangeId", "sectionIdentifier", "oldText", "newText", "changeType")
VALUES ('sec-chg-016', 'chg-016', 'Cabinet Order No. 343 & CSCL Article 2(2)', 'PFHxS was monitored under Class II reporting guidelines with voluntary annual production notifications.', 'Perfluorohexanesulfonic acid (PFHxS), its salts, and PFHxS-related compounds are designated as Class I Specified Chemical Substances. Manufacture, import, and commercial use are prohibited. Importation of 10 specified articles containing PFHxS (water-repellent fabrics, semiconductor etching agents, metal processing aids) is banned.', 'SCOPE_CHANGE'::"ChangeType")
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "AIAnalysis" ("id", "regulatoryChangeId", "summary", "whatChanged", "whyItMatters", "affectedProducts", "affectedFacilities", "affectedProcesses", "affectedSuppliers", "potentialObligations", "recommendedActions", "effectiveDate", "urgency", "riskLevel", "confidence", "requiresHumanReview", "sourceReferences", "reviewStatus")
VALUES ('aia-chg-016', 'chg-016', 'Japan enacts total Class I ban on PFHxS chemical compounds and imported articles.', '["PFHxS elevated to Class I Specified Chemical Substance","Import prohibition on 10 categories of articles containing PFHxS","Strict customs clearance inspection protocols at Japanese ports"]'::jsonb, 'Apex Battery Assembly in Osaka (fac-004) utilizes surface cleaning and coating chemicals that must be certified free of PFHxS.', '["PowerCell X9 High-Density Storage Pack (PCX9-BAT-48V)"]'::jsonb, '["Apex Battery Assembly & Testing — Osaka (fac-004)"]'::jsonb, '["Supercritical CO2 Precision Cleansing (proc-010)"]'::jsonb, '["Tokyo ChemCorp Ltd. (supp-001)"]'::jsonb, '["Verify cleaning chemical supplies at Osaka plant comply with Cabinet Order 343","Maintain chemical import compliance declarations for Japan Customs"]'::jsonb, '["Request written confirmation of PFHxS non-use from Tokyo ChemCorp","Test degreasing surfactant residues using gas chromatography"]'::jsonb, '2024-12-01T00:00:00Z'::timestamptz, 'MEDIUM'::"RiskLevel", 'MEDIUM'::"RiskLevel", 0.96, false, '["Japan Ministry of Economy, Trade and Industry (METI) Cabinet Order Announcement 2024"]'::jsonb, 'PENDING')
ON CONFLICT ("id") DO NOTHING;

-- Compliance Actions & Impacts
INSERT INTO "ComplianceAction" ("id", "organizationId", "title", "description", "regulationId", "facilityId", "productId", "processId", "supplierId", "ownerId", "priority", "status", "dueDate", "evidenceRequired")
VALUES ('act-001', 'org-apex-001', 'Replace PFAS Surfactant in Apex-Fluor 400 Formulation', 'Re-engineer Apex-Fluor 400 coating formulation to eliminate ammonium perfluoroalkyl surfactant before EU REACH universal restriction takes full effect.', 'reg-002', 'fac-001', 'prod-001', 'proc-001', 'supp-008', 'usr-apex-003', 'CRITICAL'::"RiskLevel", 'IN_PROGRESS'::"ActionStatus", '2025-12-15T00:00:00Z'::timestamptz, 'Laboratory qualification report (ASTM D3359 cross-hatch adhesion and corrosion resistance) of alternative siloxane formulation.')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Deadline" ("id", "complianceActionId", "title", "dueDate", "category", "isMilestone")
VALUES ('dl-act-001', 'act-001', 'Replace PFAS Surfactant in Apex-Fluor 400 Formulation', '2025-12-15T00:00:00Z'::timestamptz, 'CHEMICALS', TRUE)
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Alert" ("id", "organizationId", "title", "message", "severity", "deadlineId")
VALUES ('alt-act-001', 'org-apex-001', 'Compliance Alert: Replace PFAS Surfactant in Apex-Fluor 400 Formulation', 'Approaching deadline: Re-engineer Apex-Fluor 400 coating formulation to eliminate ammonium perfluoroalkyl surfactant before EU REACH universal...', 'CRITICAL'::"RiskLevel", 'dl-act-001')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "ComplianceAction" ("id", "organizationId", "title", "description", "regulationId", "facilityId", "productId", "processId", "supplierId", "ownerId", "priority", "status", "dueDate", "evidenceRequired")
VALUES ('act-002', 'org-apex-001', 'Implement Digital Battery Passport API for PowerCell X9', 'Integrate manufacturing execution telemetry with CIRPASS standard Digital Battery Passport repository to comply with EU Battery Regulation 2023/1542.', 'reg-006', 'fac-004', 'prod-003', 'proc-012', 'supp-009', 'usr-apex-002', 'HIGH'::"RiskLevel", 'OPEN'::"ActionStatus", '2025-07-01T00:00:00Z'::timestamptz, 'Verified API payload schema validation report and sample laser-etched QR code test certificate from Osaka facility.')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Deadline" ("id", "complianceActionId", "title", "dueDate", "category", "isMilestone")
VALUES ('dl-act-002', 'act-002', 'Implement Digital Battery Passport API for PowerCell X9', '2025-07-01T00:00:00Z'::timestamptz, 'CHEMICALS', TRUE)
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Alert" ("id", "organizationId", "title", "message", "severity", "deadlineId")
VALUES ('alt-act-002', 'org-apex-001', 'Compliance Alert: Implement Digital Battery Passport API for PowerCell X9', 'Approaching deadline: Integrate manufacturing execution telemetry with CIRPASS standard Digital Battery Passport repository to comply with EU ...', 'HIGH'::"RiskLevel", 'dl-act-002')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "ComplianceAction" ("id", "organizationId", "title", "description", "regulationId", "facilityId", "productId", "processId", "supplierId", "ownerId", "priority", "status", "dueDate", "evidenceRequired")
VALUES ('act-003', 'org-apex-001', 'File US EPA TSCA Section 8(a)(7) Retrospective PFAS Import Data', 'Reconstruct and certify all chemical import records from 2011 to 2022 covering Austin plant fluoropolymer additives via EPA Central Data Exchange.', 'reg-007', 'fac-002', 'prod-001', 'proc-007', 'supp-001', 'usr-apex-004', 'CRITICAL'::"RiskLevel", 'IN_PROGRESS'::"ActionStatus", '2025-05-01T00:00:00Z'::timestamptz, 'EPA CDX submission confirmation receipt with signed authorized corporate official certification.')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Deadline" ("id", "complianceActionId", "title", "dueDate", "category", "isMilestone")
VALUES ('dl-act-003', 'act-003', 'File US EPA TSCA Section 8(a)(7) Retrospective PFAS Import Data', '2025-05-01T00:00:00Z'::timestamptz, 'CHEMICALS', TRUE)
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Alert" ("id", "organizationId", "title", "message", "severity", "deadlineId")
VALUES ('alt-act-003', 'org-apex-001', 'Compliance Alert: File US EPA TSCA Section 8(a)(7) Retrospective PFAS Import Data', 'Approaching deadline: Reconstruct and certify all chemical import records from 2011 to 2022 covering Austin plant fluoropolymer additives via ...', 'CRITICAL'::"RiskLevel", 'dl-act-003')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "ComplianceAction" ("id", "organizationId", "title", "description", "regulationId", "facilityId", "productId", "processId", "supplierId", "ownerId", "priority", "status", "dueDate", "evidenceRequired")
VALUES ('act-004', 'org-apex-001', 'Obtain Recycled Content & PFAS-Free Certification for EcoPack Film', 'Secure certified mass balance documentation proving 35% post-consumer recycled content and total fluorine <50 mg/kg for European food packaging compliance.', 'reg-004', 'fac-002', 'prod-002', 'proc-005', 'supp-003', 'usr-apex-003', 'HIGH'::"RiskLevel", 'OPEN'::"ActionStatus", '2025-10-15T00:00:00Z'::timestamptz, 'ISCC PLUS mass balance audit certificate and third-party combustion ion chromatography fluorine test results.')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Deadline" ("id", "complianceActionId", "title", "dueDate", "category", "isMilestone")
VALUES ('dl-act-004', 'act-004', 'Obtain Recycled Content & PFAS-Free Certification for EcoPack Film', '2025-10-15T00:00:00Z'::timestamptz, 'CHEMICALS', TRUE)
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Alert" ("id", "organizationId", "title", "message", "severity", "deadlineId")
VALUES ('alt-act-004', 'org-apex-001', 'Compliance Alert: Obtain Recycled Content & PFAS-Free Certification for EcoPack Film', 'Approaching deadline: Secure certified mass balance documentation proving 35% post-consumer recycled content and total fluorine <50 mg/kg for ...', 'HIGH'::"RiskLevel", 'dl-act-004')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "ComplianceAction" ("id", "organizationId", "title", "description", "regulationId", "facilityId", "productId", "processId", "supplierId", "ownerId", "priority", "status", "dueDate", "evidenceRequired")
VALUES ('act-005', 'org-apex-001', 'Register as Authorized CBAM Declarant with Belgian Customs', 'Complete registration on EU CBAM Registry portal and execute primary supplier emission audits for Antwerp chemical refining imports.', 'reg-003', 'fac-003', 'prod-004', 'proc-003', 'supp-007', 'usr-apex-005', 'HIGH'::"RiskLevel", 'COMPLETED'::"ActionStatus", '2025-03-31T00:00:00Z'::timestamptz, 'Belgian General Administration of Customs & Excise authorized CBAM declarant approval certificate No. BE-CBAM-2025-8841.')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Deadline" ("id", "complianceActionId", "title", "dueDate", "category", "isMilestone")
VALUES ('dl-act-005', 'act-005', 'Register as Authorized CBAM Declarant with Belgian Customs', '2025-03-31T00:00:00Z'::timestamptz, 'CHEMICALS', TRUE)
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Alert" ("id", "organizationId", "title", "message", "severity", "deadlineId")
VALUES ('alt-act-005', 'org-apex-001', 'Compliance Alert: Register as Authorized CBAM Declarant with Belgian Customs', 'Approaching deadline: Complete registration on EU CBAM Registry portal and execute primary supplier emission audits for Antwerp chemical refin...', 'HIGH'::"RiskLevel", 'dl-act-005')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "ComplianceAction" ("id", "organizationId", "title", "description", "regulationId", "facilityId", "productId", "processId", "supplierId", "ownerId", "priority", "status", "dueDate", "evidenceRequired")
VALUES ('act-006', 'org-apex-001', 'Deploy Fenceline Passive Sorbent Monitoring at Austin Plant', 'Install 16 EPA Method 325 fenceline monitoring stations surrounding Austin facility to benchmark benzene and organic VOC levels prior to HON Rule deadline.', 'reg-011', 'fac-002', 'prod-008', 'proc-008', 'supp-011', 'usr-apex-003', 'MEDIUM'::"RiskLevel", 'IN_PROGRESS'::"ActionStatus", '2025-11-30T00:00:00Z'::timestamptz, 'Contract agreement with environmental laboratory and Q1 baseline air monitoring report.')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Deadline" ("id", "complianceActionId", "title", "dueDate", "category", "isMilestone")
VALUES ('dl-act-006', 'act-006', 'Deploy Fenceline Passive Sorbent Monitoring at Austin Plant', '2025-11-30T00:00:00Z'::timestamptz, 'CHEMICALS', TRUE)
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Alert" ("id", "organizationId", "title", "message", "severity", "deadlineId")
VALUES ('alt-act-006', 'org-apex-001', 'Compliance Alert: Deploy Fenceline Passive Sorbent Monitoring at Austin Plant', 'Approaching deadline: Install 16 EPA Method 325 fenceline monitoring stations surrounding Austin facility to benchmark benzene and organic VOC...', 'MEDIUM'::"RiskLevel", 'dl-act-006')
ON CONFLICT ("id") DO NOTHING;

-- Regulation Impacts
INSERT INTO "RegulationImpact" ("id", "regulationId", "regulatoryChangeId", "facilityId", "productId", "processId", "supplierId", "impactLevel", "reason", "regulatoryRequirement", "evidence", "confidence", "recommendedAction")
VALUES ('imp-1', 'reg-002', 'chg-001', 'fac-001', 'prod-001', 'proc-001', 'supp-008', 'CRITICAL'::"RiskLevel", 'Apex-Fluor 400 coating contains high molecular weight fluoropolymer chains that exceed the 1.0 ppb threshold. Facility fac-001 in Dresden directly executes fluoropolymer heat curing (proc-001) which will violate the revised rule without zero-emission scrubber retrofits.', 'Universal PFAS limit lowered from 25 ppb (parts per billion) to 1.0 ppb with elimination of industrial fluoropolymer processing exemptions.', 'Per- and polyfluoroalkyl substances (PFAS) shall not be manufactured, placed on the market, or used in industrial chemical synthesis or article manufacturing in a concentration equal to or greater than 1.0 ppb (0.001 mg/kg) for any individual PFAS compound, or 5.0 ppb for total combined organic fluo', 0.95, 'Initiate pilot testing of non-fluorinated siloxane alternative for Apex-Fluor 400 formulation')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "RegulationImpact" ("id", "regulationId", "regulatoryChangeId", "facilityId", "productId", "processId", "supplierId", "impactLevel", "reason", "regulatoryRequirement", "evidence", "confidence", "recommendedAction")
VALUES ('imp-2', 'reg-004', 'chg-002', 'fac-001', 'prod-001', 'proc-001', 'supp-008', 'HIGH'::"RiskLevel", 'EcoPack Ultra-Barrier Food Film (prod-002) is manufactured at Apex Austin (fac-002) using bio-PLA but utilizes an external barrier coating that must be verified for fluorine absence and certified for PCR compliance.', 'PPWR 2024 revision imposes mandatory 35% post-consumer recycled (PCR) content for contact-sensitive packaging and bans perfluorinated barriers in food contact film.', 'By 1 November 2025, each unit of plastic packaging placed on the European Union market shall contain a mandatory minimum of 35% post-consumer recycled plastic (PCR) verified via certified mass balance chain-of-custody. Furthermore, food contact packaging containing intentionally added PFAS exceeding', 0.95, 'Execute fluorine combustibility testing on Austin plant extrusion barrier layers')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "RegulationImpact" ("id", "regulationId", "regulatoryChangeId", "facilityId", "productId", "processId", "supplierId", "impactLevel", "reason", "regulatoryRequirement", "evidence", "confidence", "recommendedAction")
VALUES ('imp-3', 'reg-006', 'chg-003', 'fac-001', 'prod-001', 'proc-001', 'supp-008', 'HIGH'::"RiskLevel", 'PowerCell X9 Battery Pack (prod-003) assembled in Osaka (fac-004) exports heavily to Germany and Belgium. Missing the August 2025 deadline blocks CE marking and customs clearance.', 'EU Battery Passport digital QR code deployment accelerated to August 2025 with strict supply chain carbon footprint declaration rules.', 'By 18 August 2025, each industrial battery with capacity above 2 kWh placed on the Union market or put into service shall possess an accessible Digital Battery Passport linked to an indelible QR code. The passport must declare certified lifecycle carbon footprint (kg CO2e/kWh), recycled cobalt/lithi', 0.95, 'Contract third-party ISO 14044 lifecycle analysis auditor for PowerCell X9')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "RegulationImpact" ("id", "regulationId", "regulatoryChangeId", "facilityId", "productId", "processId", "supplierId", "impactLevel", "reason", "regulatoryRequirement", "evidence", "confidence", "recommendedAction")
VALUES ('imp-4', 'reg-007', 'chg-004', 'fac-001', 'prod-001', 'proc-001', 'supp-008', 'CRITICAL'::"RiskLevel", 'Apex Austin (fac-002) imported fluoropolymer additives from Japanese suppliers between 2014 and 2021. Exposure to TSCA Section 16 penalties ($46,989/day) if retrospective import volumes are unfiled.', 'US EPA TSCA Sec 8(a)(7) reporting window finalized: mandatory submission of 12 years of retrospective PFAS import data with no de minimis exemption.', 'All entities that manufactured or imported PFAS or PFAS-containing articles between January 1, 2011 and December 31, 2022 must submit definitive reports via the EPA Central Data Exchange (CDX). There is NO DE MINIMIS THRESHOLD. Trace impurities, components of imported polymers, and processing aids a', 0.95, 'Engage external customs brokerage audit team to pull 2011-2022 ACE entry records')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "RegulationImpact" ("id", "regulationId", "regulatoryChangeId", "facilityId", "productId", "processId", "supplierId", "impactLevel", "reason", "regulatoryRequirement", "evidence", "confidence", "recommendedAction")
VALUES ('imp-5', 'reg-003', 'chg-005', 'fac-001', 'prod-001', 'proc-001', 'supp-008', 'HIGH'::"RiskLevel", 'Apex Antwerp refinery (fac-003) imports specialty chemical precursors from Formosa Plastics (supp-007) in Taiwan and Rio Tinto (supp-004) in Australia. High embedded carbon will result in substantial import tariffs.', 'EU CBAM expands reporting to include Scope 3 precursor emissions and sets definitive financial carbon certificate purchasing timeline.', 'Effective 1 January 2026, the CBAM financial definitive regime commences. Importers must purchase CBAM certificates matching weekly EU ETS auction prices. The boundary of embedded emissions is formally expanded to include complex precursors (Annex I chemical resins, hydrogen derivatives) and upstrea', 0.95, 'Establish direct API telemetry with suppliers for shipment-level emission certificates')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "RegulationImpact" ("id", "regulationId", "regulatoryChangeId", "facilityId", "productId", "processId", "supplierId", "impactLevel", "reason", "regulatoryRequirement", "evidence", "confidence", "recommendedAction")
VALUES ('imp-6', 'reg-008', 'chg-006', 'fac-001', 'prod-001', 'proc-001', 'supp-008', 'HIGH'::"RiskLevel", 'Apex Industrial Systems exceeds the $1B revenue threshold and conducts extensive commerce in California. Austin plant and global suppliers must be audited.', 'California CARB establishes electronic disclosure portal and third-party assurance protocols for SB 253 Scope 1, 2, and 3 disclosures.', 'Reporting entities shall submit audited Scope 1 and Scope 2 emissions by 1 June 2026, and full Scope 3 supply chain greenhouse gas emissions by 1 December 2026. Reporting must adhere to the GHG Protocol Corporate Standard and possess limited assurance by an independent CARB-accredited verification b', 0.95, 'Consolidate multi-facility Scope 1, 2, and 3 telemetry into centralized ESG ledger')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "RegulationImpact" ("id", "regulationId", "regulatoryChangeId", "facilityId", "productId", "processId", "supplierId", "impactLevel", "reason", "regulatoryRequirement", "evidence", "confidence", "recommendedAction")
VALUES ('imp-7', 'reg-011', 'chg-007', 'fac-001', 'prod-001', 'proc-001', 'supp-008', 'MEDIUM'::"RiskLevel", 'Apex Austin facility (fac-002) and partner refining nodes must ensure chemical distillation and regenerative oxidizers operate below the 3.0 ug/m3 cap.', 'EPA HON Rule slashes fenceline benzene and 1,3-butadiene action levels to 3.0 ug/m3 with mandatory public web reporting.', 'Facilities subject to Subpart G must install continuous passive or real-time fenceline sorbent tubes. The rolling annual average action level for benzene is reduced to 3.0 ug/m3 (formerly 9.0 ug/m3). Exceedance of the action level triggers mandatory root-cause analysis within 5 days and corrective a', 0.95, 'Conduct optical gas imaging (OGI) leak detection survey across Austin facility piping')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "RegulationImpact" ("id", "regulationId", "regulatoryChangeId", "facilityId", "productId", "processId", "supplierId", "impactLevel", "reason", "regulatoryRequirement", "evidence", "confidence", "recommendedAction")
VALUES ('imp-8', 'reg-010', 'chg-008', 'fac-001', 'prod-001', 'proc-001', 'supp-008', 'MEDIUM'::"RiskLevel", 'Apex Dresden plant (fac-001) is located in Germany and falls directly under BAFA oversight. Taiwanese and Australian suppliers must be screened.', 'BAFA tightens environmental due diligence enforcement under German LkSG, adding mandatory mercury and POP audits.', 'BAFA will systematically audit compliance with the Minamata Convention on Mercury and the Stockholm Convention on Persistent Organic Pollutants across Tier-1 and indirect Tier-N suppliers where substantiated hints exist. Failure to submit audited BAFA annual reports by April 30 triggers automatic fi', 0.95, 'Issue LkSG questionnaire covering POPs and mercury to Formosa Plastics')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "RegulationImpact" ("id", "regulationId", "regulatoryChangeId", "facilityId", "productId", "processId", "supplierId", "impactLevel", "reason", "regulatoryRequirement", "evidence", "confidence", "recommendedAction")
VALUES ('imp-9', 'reg-001', 'chg-009', 'fac-001', 'prod-001', 'proc-001', 'supp-008', 'HIGH'::"RiskLevel", 'Apex European entities must ensure ERP and ESG software outputs valid iXBRL data blocks to prevent filing rejections.', 'EFRAG publishes finalized ESRS XBRL taxonomy and digital tagging requirements for CSRD corporate sustainability statements.', 'Sustainability statements must be marked up using Inline XBRL (iXBRL) according to the EFRAG ESRS Digital Taxonomy. Every quantitative metric—including Scope 1, 2, and 3 emissions breakdowns, water stress indicators, circular material inflows, and hazardous chemical volumes—must feature granular dig', 0.95, 'Implement RegulaMap CSRD tagging exporter module')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "RegulationImpact" ("id", "regulationId", "regulatoryChangeId", "facilityId", "productId", "processId", "supplierId", "impactLevel", "reason", "regulatoryRequirement", "evidence", "confidence", "recommendedAction")
VALUES ('imp-10', 'reg-013', 'chg-010', 'fac-001', 'prod-001', 'proc-001', 'supp-008', 'HIGH'::"RiskLevel", 'Although Osaka plant is in Japan, Apex is evaluating a 1.5 GWh battery cell line in Antwerp (Belgium) which will require immediate IED permitting.', 'EU IED 2.0 directive formally incorporates industrial battery gigafactories and electrolyzer facilities into mandatory environmental permit rules.', 'Annex I is amended to explicitly include: (a) Installations for the manufacture of battery cells or modules with an annual production capacity exceeding 0.5 GWh; (b) Installations for the production of hydrogen via electrolysis exceeding 50 MW capacity. Operators must establish certified Environment', 0.95, 'Review BAT Reference Document (BREF) on Surface Treatment using Organic Solvents')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "RegulationImpact" ("id", "regulationId", "regulatoryChangeId", "facilityId", "productId", "processId", "supplierId", "impactLevel", "reason", "regulatoryRequirement", "evidence", "confidence", "recommendedAction")
VALUES ('imp-11', 'reg-021', 'chg-011', 'fac-001', 'prod-001', 'proc-001', 'supp-008', 'MEDIUM'::"RiskLevel", 'Apex Dresden facility (fac-001) operates curing ovens (proc-001) and calcining lines that must verify HEPA filtration compliance.', 'German TA Luft revision caps total dust and organic emissions from chemical synthesis reactors to 5 mg/m3.', 'Total dust emissions from all chemical synthesis, curing, and compounding exhausts shall not exceed 5.0 mg/m3 at mass flow rates of 0.05 kg/h or greater. For Class I organic compounds, the emission concentration limit is reduced to 10 mg/m3 with mandatory continuous parameter recording.', 0.95, 'Perform stack emission measurement protocol at Dresden stack K-02')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "RegulationImpact" ("id", "regulationId", "regulatoryChangeId", "facilityId", "productId", "processId", "supplierId", "impactLevel", "reason", "regulatoryRequirement", "evidence", "confidence", "recommendedAction")
VALUES ('imp-12', 'reg-022', 'chg-012', 'fac-001', 'prod-001', 'proc-001', 'supp-008', 'HIGH'::"RiskLevel", 'All 8 Apex products distributed in the EU will require digital product passport schemas within the next 24 months.', 'EU ESPR enters into force with immediate mandates for Digital Product Passports and destruction ban disclosures for unsold goods.', 'The Ecodesign for Sustainable Products Regulation (ESPR) is entered into force. Priority working plans designate chemicals, polymers, textiles, and electronics for mandatory Digital Product Passports (DPP) containing material composition, carbon footprint, and recyclability scores. Companies must pu', 0.95, 'Assemble cross-functional product stewardship team to establish DPP repository')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "RegulationImpact" ("id", "regulationId", "regulatoryChangeId", "facilityId", "productId", "processId", "supplierId", "impactLevel", "reason", "regulatoryRequirement", "evidence", "confidence", "recommendedAction")
VALUES ('imp-13', 'reg-005', 'chg-013', 'fac-001', 'prod-001', 'proc-001', 'supp-008', 'MEDIUM'::"RiskLevel", 'Apex packaging materials (prod-002) utilize bio-based cellulose and wood pulp derivatives supplied by Stora Enso. The delay provides vital window to gather forest polygon coordinates.', 'European Commission approves 12-month phasing delay for EUDR deforestation due diligence enforcement.', 'The regulation shall apply from 30 December 2025 for large operators and traders, and from 30 June 2026 for micro and small enterprises. The European Commission Deforestation Due Diligence Information System will open for pre-registration in June 2025 to enable upload of plot polygon coordinates.', 0.95, 'Request certified GIS plot coordinate data package from Stora Enso')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "RegulationImpact" ("id", "regulationId", "regulatoryChangeId", "facilityId", "productId", "processId", "supplierId", "impactLevel", "reason", "regulatoryRequirement", "evidence", "confidence", "recommendedAction")
VALUES ('imp-14', 'reg-014', 'chg-014', 'fac-001', 'prod-001', 'proc-001', 'supp-008', 'MEDIUM'::"RiskLevel", 'EcoPack products shipped to UK distributors will incur significant annual fees unless certified for kerbside recyclable stream.', 'UK DEFRA publishes illustrative base fees for packaging EPR modulated fee structure.', 'Effective 1 April 2025, local authority packaging waste management costs will be directly billed to obligated producers via modulated EPR fees. Base fee estimates range from £130-£220/tonne for aluminum, £330-£590/tonne for plastic packaging, and £140-£260/tonne for paper/cardboard. Modulations base', 0.95, 'Calculate projected UK EPR liability for FY2025 based on current export tonnage')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "RegulationImpact" ("id", "regulationId", "regulatoryChangeId", "facilityId", "productId", "processId", "supplierId", "impactLevel", "reason", "regulatoryRequirement", "evidence", "confidence", "recommendedAction")
VALUES ('imp-15', 'reg-023', 'chg-015', 'fac-001', 'prod-001', 'proc-001', 'supp-008', 'HIGH'::"RiskLevel", 'CryoSeal Liquid Gasket (prod-006) and electronic potting formulations must be certified 100% free of PIP (3:1) plasticizer.', 'US EPA finalizes strict PIP (3:1) prohibition in adhesives, sealants, and electronic assemblies without transitional exemptions.', 'Effective January 6, 2025, the processing and distribution in commerce of PIP (3:1) (CASRN 68937-41-7) and products or articles containing PIP (3:1) is STRICTLY PROHIBITED throughout the United States. All historical enforcement discretions have terminated. Mandatory recordkeeping of complete phase-', 0.95, 'Review supplier safety data sheets (SDS) and test reports for CAS 68937-41-7')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "RegulationImpact" ("id", "regulationId", "regulatoryChangeId", "facilityId", "productId", "processId", "supplierId", "impactLevel", "reason", "regulatoryRequirement", "evidence", "confidence", "recommendedAction")
VALUES ('imp-16', 'reg-015', 'chg-016', 'fac-001', 'prod-001', 'proc-001', 'supp-008', 'MEDIUM'::"RiskLevel", 'Apex Battery Assembly in Osaka (fac-004) utilizes surface cleaning and coating chemicals that must be certified free of PFHxS.', 'Japan METI designates PFHxS and related salts as Class I Specified Chemical Substances under CSCL.', 'Perfluorohexanesulfonic acid (PFHxS), its salts, and PFHxS-related compounds are designated as Class I Specified Chemical Substances. Manufacture, import, and commercial use are prohibited. Importation of 10 specified articles containing PFHxS (water-repellent fabrics, semiconductor etching agents, ', 0.95, 'Request written confirmation of PFHxS non-use from Tokyo ChemCorp')
ON CONFLICT ("id") DO NOTHING;

-- Audit Logs
INSERT INTO "AuditLog" ("id", "organizationId", "userId", "action", "entityType", "entityId", "metadata", "ipAddress")
VALUES ('aud-1', 'org-apex-001', 'usr-apex-002', 'ORGANIZATION_INITIALIZED', 'Organization', 'org-apex-001', '{"name":"Apex Industrial Systems Corp.","createdBy":"SYSTEM"}'::jsonb, '192.168.1.100')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "AuditLog" ("id", "organizationId", "userId", "action", "entityType", "entityId", "metadata", "ipAddress")
VALUES ('aud-2', 'org-apex-001', 'usr-apex-002', 'REGULATION_INGESTED', 'Regulation', 'reg-002', '{"title":"EU REACH PFAS Universal Ban","source":"EUR-Lex API","version":4}'::jsonb, '192.168.1.101')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "AuditLog" ("id", "organizationId", "userId", "action", "entityType", "entityId", "metadata", "ipAddress")
VALUES ('aud-3', 'org-apex-001', 'usr-apex-002', 'VERSION_DETECTED', 'RegulationVersion', 'ver-reg-002-2', '{"hash":"sha256-v2-reg-002-1f2e3d4c5b","previousHash":"sha256-v1-reg-002-9a8b7c6d5e"}'::jsonb, '192.168.1.102')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "AuditLog" ("id", "organizationId", "userId", "action", "entityType", "entityId", "metadata", "ipAddress")
VALUES ('aud-4', 'org-apex-001', 'usr-apex-002', 'DETERMINISTIC_DIFF_COMPUTED', 'RegulatoryChange', 'chg-001', '{"additions":3,"deletions":2,"thresholdShift":"25 ppb -> 1.0 ppb"}'::jsonb, '192.168.1.103')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "AuditLog" ("id", "organizationId", "userId", "action", "entityType", "entityId", "metadata", "ipAddress")
VALUES ('aud-5', 'org-apex-001', 'usr-apex-002', 'AI_SYNTHESIS_EXECUTED', 'AIAnalysis', 'aia-chg-001', '{"model":"gemini-2.5-flash","confidence":0.98,"groundedCitations":1}'::jsonb, '192.168.1.104')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "AuditLog" ("id", "organizationId", "userId", "action", "entityType", "entityId", "metadata", "ipAddress")
VALUES ('aud-6', 'org-apex-001', 'usr-apex-002', 'IMPACT_MAPPED', 'RegulationImpact', 'imp-1', '{"affectedFacilities":["fac-001"],"affectedProducts":["prod-001"]}'::jsonb, '192.168.1.105')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "AuditLog" ("id", "organizationId", "userId", "action", "entityType", "entityId", "metadata", "ipAddress")
VALUES ('aud-7', 'org-apex-001', 'usr-apex-002', 'ACTION_ITEM_DISPATCHED', 'ComplianceAction', 'act-001', '{"assignee":"usr-apex-003","priority":"CRITICAL","dueDate":"2025-12-15"}'::jsonb, '192.168.1.106')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "AuditLog" ("id", "organizationId", "userId", "action", "entityType", "entityId", "metadata", "ipAddress")
VALUES ('aud-8', 'org-apex-001', 'usr-apex-002', 'LEGAL_REVIEW_SUBMITTED', 'RegulatoryChange', 'chg-001', '{"reviewer":"usr-apex-004","status":"PENDING_FINAL_SIGN"}'::jsonb, '192.168.1.107')
ON CONFLICT ("id") DO NOTHING;
