// scripts/seed-sql-generator.js
// Generates PostgreSQL seed SQL for Apex Industrial Systems
const fs = require('fs');
const path = require('path');

const pHash = '$2b$10$vI8aWBnW3fID.ZQ4/ZO1e.uKzVfE7yUOzLzV2y4d42mHek3uX44qK'; // bcrypt hash of Password123!

let sql = `
-- ============================================================================
-- 5. COMPREHENSIVE SEED DATA FOR APEX INDUSTRIAL SYSTEMS
-- ============================================================================

-- Organization
INSERT INTO "Organization" ("id", "name", "industry", "countries")
VALUES ('org-apex-001', 'Apex Industrial Systems Corp.', 'Heavy Manufacturing, Advanced Materials & Specialty Chemicals', ARRAY['DE', 'US', 'BE', 'JP'])
ON CONFLICT ("id") DO UPDATE SET "name" = EXCLUDED."name";

-- Users
INSERT INTO "User" ("id", "email", "passwordHash", "fullName", "organizationId")
VALUES 
  ('usr-apex-001', 'owner@apexindustrial.com', '${pHash}', 'Marcus Vance (CEO / Owner)', 'org-apex-001'),
  ('usr-apex-002', 'elena.rostova@apexindustrial.com', '${pHash}', 'Elena Rostova (Chief Compliance Officer)', 'org-apex-001'),
  ('usr-apex-003', 'sarah.lin@apexindustrial.com', '${pHash}', 'Sarah Lin (Environmental Compliance Lead)', 'org-apex-001'),
  ('usr-apex-004', 'david.richter@apexindustrial.com', '${pHash}', 'David Richter (Senior Legal Reviewer)', 'org-apex-001'),
  ('usr-apex-005', 'tariq.analyst@apexindustrial.com', '${pHash}', 'Tariq Al-Mansoor (Regulatory Drift Analyst)', 'org-apex-001'),
  ('usr-apex-006', 'chloe.viewer@apexindustrial.com', '${pHash}', 'Chloe Bennett (Sustainability Analyst / Viewer)', 'org-apex-001')
ON CONFLICT ("id") DO NOTHING;

-- Memberships
INSERT INTO "OrganizationMember" ("id", "organizationId", "userId", "role")
VALUES
  ('mem-001', 'org-apex-001', 'usr-apex-001', 'OWNER'),
  ('mem-002', 'org-apex-001', 'usr-apex-002', 'ADMIN'),
  ('mem-003', 'org-apex-001', 'usr-apex-003', 'COMPLIANCE_MANAGER'),
  ('mem-004', 'org-apex-001', 'usr-apex-004', 'LEGAL_REVIEWER'),
  ('mem-005', 'org-apex-001', 'usr-apex-005', 'ANALYST'),
  ('mem-006', 'org-apex-001', 'usr-apex-006', 'VIEWER')
ON CONFLICT ("organizationId", "userId") DO NOTHING;

-- Jurisdictions
INSERT INTO "Jurisdiction" ("id", "code", "name", "country", "region", "latitude", "longitude")
VALUES
  ('jur-eu', 'EU', 'European Union', 'European Union', 'Europe', 50.8503, 4.3517),
  ('jur-us', 'US', 'United States (Federal)', 'United States', 'North America', 38.9072, -77.0369),
  ('jur-us-ca', 'US-CA', 'State of California', 'United States', 'North America (West)', 38.5816, -121.4944),
  ('jur-de', 'DE', 'Federal Republic of Germany', 'Germany', 'Europe', 52.5200, 13.4050),
  ('jur-be', 'BE', 'Kingdom of Belgium (Flanders)', 'Belgium', 'Europe', 51.2194, 4.4025),
  ('jur-jp', 'JP', 'Japan (METI & MOE)', 'Japan', 'Asia-Pacific', 35.6762, 139.6503),
  ('jur-uk', 'UK', 'United Kingdom', 'United Kingdom', 'Europe', 51.5074, -0.1278),
  ('jur-intl', 'INTL', 'International Environmental Pacts', 'Global', 'Global', 46.2044, 6.1432)
ON CONFLICT ("code") DO NOTHING;

-- Regulatory Sources
INSERT INTO "RegulatorySource" ("id", "name", "sourceType", "url", "jurisdictionId")
VALUES
  ('src-001', 'EUR-Lex Official Journal & Consultation API', 'OFFICIAL_API', 'https://eur-lex.europa.eu/api', 'jur-eu'),
  ('src-002', 'US Federal Register & Regulations.gov API', 'OFFICIAL_API', 'https://www.federalregister.gov/api/v1', 'jur-us'),
  ('src-003', 'California Office of Administrative Law Regulatory Feed', 'RSS', 'https://oal.ca.gov/rss/regulations', 'jur-us-ca'),
  ('src-004', 'German Federal Law Gazette (Bundesgesetzblatt BGBl)', 'OFFICIAL_WEBSITE', 'https://www.recht.bund.de', 'jur-de'),
  ('src-005', 'Japan METI Industrial Safety & Standards Bulletin', 'DOCUMENT_FEED', 'https://www.meti.go.jp/english', 'jur-jp'),
  ('src-006', 'UK Legislation.gov.uk Publishing API', 'OFFICIAL_API', 'https://www.legislation.gov.uk/api', 'jur-uk')
ON CONFLICT ("id") DO NOTHING;
`;

fs.writeFileSync(path.join(__dirname, 'seed_part1.sql'), sql);
console.log('Seed part 1 written.');
