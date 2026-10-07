// scripts/build-seed-sql.js
const fs = require('fs');
const path = require('path');

const pHash = '$2b$10$vI8aWBnW3fID.ZQ4/ZO1e.uKzVfE7yUOzLzV2y4d42mHek3uX44qK'; // Password123!

const facilities = [
  {
    id: 'fac-001',
    orgId: 'org-apex-001',
    name: 'Apex Advanced Materials — Dresden',
    country: 'Germany',
    location: 'Silicon Saxony TechPark, Dresden, Saxony, Germany',
    latitude: 51.0504,
    longitude: 13.7373,
    facilityType: 'Chemical Synthesis & Specialty Fluoropolymer Plant',
    productionCapacity: '45,000 MT / annum',
    emissionsData: JSON.stringify({ scope1_co2e_mt: 12400, scope2_co2e_mt: 8900, scope3_co2e_mt: 34200, voc_emissions_kg: 840, nox_kg: 450 }),
    waterUsage: JSON.stringify({ annual_m3: 185000, recycling_rate_pct: 78.4, discharge_purity_pct: 99.1 }),
    energyMetrics: JSON.stringify({ mwh_consumed: 38400, renewable_pct: 62.0, ppa_contracts: ['Vattenfall Wind 20MW'] }),
    wasteOutput: JSON.stringify({ hazardous_waste_mt: 310, non_hazardous_waste_mt: 1250, landfill_diversion_pct: 94.2 })
  },
  {
    id: 'fac-002',
    orgId: 'org-apex-001',
    name: 'Apex BioPlastics & Packaging — Austin',
    country: 'United States',
    location: 'Met Center Industrial Blvd, Austin, TX, USA',
    latitude: 30.2672,
    longitude: -97.7431,
    facilityType: 'Advanced Polymer Extrusion & Bio-Resin Formulation',
    productionCapacity: '60,000 MT / annum',
    emissionsData: JSON.stringify({ scope1_co2e_mt: 8200, scope2_co2e_mt: 14500, scope3_co2e_mt: 48900, voc_emissions_kg: 320, nox_kg: 210 }),
    waterUsage: JSON.stringify({ annual_m3: 92000, recycling_rate_pct: 85.0, discharge_purity_pct: 99.8 }),
    energyMetrics: JSON.stringify({ mwh_consumed: 42100, renewable_pct: 48.5, solar_onsite_mw: 3.2 }),
    wasteOutput: JSON.stringify({ hazardous_waste_mt: 45, non_hazardous_waste_mt: 890, landfill_diversion_pct: 98.1 })
  },
  {
    id: 'fac-003',
    orgId: 'org-apex-001',
    name: 'Apex Chemical Refineries — Antwerp',
    country: 'Belgium',
    location: 'Port of Antwerp-Bruges Chemical Cluster, Antwerp, Belgium',
    latitude: 51.2194,
    longitude: 4.4025,
    facilityType: 'Petrochemical Distillation & Industrial Solvent Purification',
    productionCapacity: '120,000 MT / annum',
    emissionsData: JSON.stringify({ scope1_co2e_mt: 38900, scope2_co2e_mt: 22100, scope3_co2e_mt: 98000, voc_emissions_kg: 1850, so2_kg: 920 }),
    waterUsage: JSON.stringify({ annual_m3: 450000, recycling_rate_pct: 82.5, discharge_purity_pct: 98.9 }),
    energyMetrics: JSON.stringify({ mwh_consumed: 110500, renewable_pct: 55.0, cogen_heat_recovery_pct: 65.0 }),
    wasteOutput: JSON.stringify({ hazardous_waste_mt: 890, non_hazardous_waste_mt: 3400, landfill_diversion_pct: 91.5 })
  },
  {
    id: 'fac-004',
    orgId: 'org-apex-001',
    name: 'Apex Battery Assembly & Testing — Osaka',
    country: 'Japan',
    location: 'Kansai Industrial Coastal Zone, Osaka, Japan',
    latitude: 34.6937,
    longitude: 135.5023,
    facilityType: 'High-Density Lithium-Ion Pack Assembly & Cell Testing',
    productionCapacity: '1.2 GWh / annum',
    emissionsData: JSON.stringify({ scope1_co2e_mt: 4100, scope2_co2e_mt: 9800, scope3_co2e_mt: 62000, voc_emissions_kg: 110, nox_kg: 85 }),
    waterUsage: JSON.stringify({ annual_m3: 64000, recycling_rate_pct: 91.2, discharge_purity_pct: 99.9 }),
    energyMetrics: JSON.stringify({ mwh_consumed: 29000, renewable_pct: 71.0, clean_grid_cert: true }),
    wasteOutput: JSON.stringify({ hazardous_waste_mt: 120, non_hazardous_waste_mt: 430, landfill_diversion_pct: 97.4 })
  }
];

const products = [
  { id: 'prod-001', orgId: 'org-apex-001', name: 'Apex-Fluor 400 Protective Polymer', sku: 'AF400-EUR-01', category: 'Specialty Coatings', markets: ['EU', 'US', 'JP'] },
  { id: 'prod-002', orgId: 'org-apex-001', name: 'EcoPack Ultra-Barrier Food Film', sku: 'EP-UBF-09', category: 'Circular Packaging', markets: ['EU', 'UK', 'US'] },
  { id: 'prod-003', orgId: 'org-apex-001', name: 'PowerCell X9 High-Density Storage Pack', sku: 'PCX9-BAT-48V', category: 'Industrial Energy Storage', markets: ['EU', 'US', 'JP', 'UK'] },
  { id: 'prod-004', orgId: 'org-apex-001', name: 'SynthoFlex High-Temp Fluoroelastomer', sku: 'SF-ELAST-22', category: 'Engineered Polymers', markets: ['EU', 'US'] },
  { id: 'prod-005', orgId: 'org-apex-001', name: 'ThermBarrier Cryogenic Aerogel Blanket', sku: 'TBA-INSUL-01', category: 'Thermal Insulation', markets: ['EU', 'US', 'DE'] },
  { id: 'prod-006', orgId: 'org-apex-001', name: 'CryoSeal Liquid Gasket Anaerobic Compound', sku: 'CSL-GAS-88', category: 'Industrial Adhesives & Sealants', markets: ['EU', 'BE', 'DE'] },
  { id: 'prod-007', orgId: 'org-apex-001', name: 'PureVolt Polymeric Conductive Separator', sku: 'PVC-POLY-10', category: 'Battery Component Materials', markets: ['EU', 'JP', 'US'] },
  { id: 'prod-008', orgId: 'org-apex-001', name: 'BioSolv Heavy Industrial Degreaser', sku: 'BS-DEGR-55', category: 'Green Solvents & Cleaners', markets: ['US', 'EU', 'UK'] }
];

const suppliers = [
  { id: 'supp-001', orgId: 'org-apex-001', name: 'Tokyo ChemCorp Ltd.', country: 'Japan', certifications: ['ISO 14001', 'ISO 9001', 'EcoVadis Gold'], complianceStatus: 'COMPLIANT', riskScore: 12.5 },
  { id: 'supp-002', orgId: 'org-apex-001', name: 'BASF SE Specialty Monomers', country: 'Germany', certifications: ['ISO 14001', 'EMAS', 'TfS Together for Sustainability'], complianceStatus: 'COMPLIANT', riskScore: 8.0 },
  { id: 'supp-003', orgId: 'org-apex-001', name: 'Nordic Bio-Polymers AB', country: 'Sweden', certifications: ['ISCC PLUS', 'FSC Certified', 'ISO 50001'], complianceStatus: 'COMPLIANT', riskScore: 6.2 },
  { id: 'supp-004', orgId: 'org-apex-001', name: 'Rio Tinto Battery Materials Corp.', country: 'Australia', certifications: ['IRMA Verified', 'ISO 14001'], complianceStatus: 'UNDER_REVIEW', riskScore: 28.4 },
  { id: 'supp-005', orgId: 'org-apex-001', name: 'Solvay Specialty Chemicals Belgium', country: 'Belgium', certifications: ['ISO 14001', 'Responsible Care'], complianceStatus: 'COMPLIANT', riskScore: 14.1 },
  { id: 'supp-006', orgId: 'org-apex-001', name: 'Shin-Etsu Specialty Silicones', country: 'Japan', certifications: ['ISO 14001', 'Sony Green Partner'], complianceStatus: 'COMPLIANT', riskScore: 10.5 },
  { id: 'supp-007', orgId: 'org-apex-001', name: 'Formosa Advanced Petrochemicals', country: 'Taiwan', certifications: ['ISO 9001'], complianceStatus: 'HIGH_RISK', riskScore: 54.0 },
  { id: 'supp-008', orgId: 'org-apex-001', name: 'DuPont Industrial Fluoromaterials', country: 'United States', certifications: ['ISO 14001', 'Responsible Care'], complianceStatus: 'UNDER_REVIEW', riskScore: 35.8 },
  { id: 'supp-009', orgId: 'org-apex-001', name: 'Umicore Cathode Refining NV', country: 'Belgium', certifications: ['RMI Conflict Free', 'ISO 14001', 'EcoVadis Platinum'], complianceStatus: 'COMPLIANT', riskScore: 7.2 },
  { id: 'supp-010', orgId: 'org-apex-001', name: 'LG Energy Materials South Korea', country: 'South Korea', certifications: ['ISO 14001', 'RE100 Signatory'], complianceStatus: 'COMPLIANT', riskScore: 15.0 },
  { id: 'supp-011', orgId: 'org-apex-001', name: 'Air Liquide Industrial Gases SA', country: 'France', certifications: ['ISO 14001', 'ISO 50001'], complianceStatus: 'COMPLIANT', riskScore: 5.5 },
  { id: 'supp-012', orgId: 'org-apex-001', name: 'Stora Enso Circular Packaging Solutions', country: 'Finland', certifications: ['PEFC', 'FSC Chain of Custody', 'EU Ecolabel'], complianceStatus: 'COMPLIANT', riskScore: 4.8 }
];

const processes = [
  { id: 'proc-001', name: 'Fluoropolymer Heat Curing & Sintering', description: 'Thermal treatment of fluoropolymer matrix at 380°C in inert nitrogen atmosphere to establish cross-linking.', inputs: ['Fluoro-dispersions', 'Nitrogen 99.99%'], chemicals: ['Perfluoroalkyl precursors', 'Ammonium salt surfactant'], emissions: ['Trace trace VOC', 'CO2 heat loss'], waste: ['Filter particulate cake'], energyKw: 450.0 },
  { id: 'proc-002', name: 'Acid Leaching & Neutralization', description: 'Hydrometallurgical extraction and subsequent neutralization of reactive salts in wet scrubbers.', inputs: ['Sulfuric Acid 98%', 'Sodium Hydroxide 50%'], chemicals: ['H2SO4', 'NaOH', 'Calcium hydroxide'], emissions: ['Scrubber water vapor'], waste: ['Neutralized Gypsum Sludge (non-haz)'], energyKw: 120.0 },
  { id: 'proc-003', name: 'Solvent Recovery & Multi-Stage Distillation', description: 'Vacuum distillation cycle recovering 98.5% of isopropyl alcohol and ethyl acetate solvents.', inputs: ['Spent solvent stream'], chemicals: ['Isopropanol', 'Ethyl Acetate', 'Toluene traces'], emissions: ['Condenser vent off-gas (abated)'], waste: ['Still bottom distillation residue'], energyKw: 880.0 },
  { id: 'proc-004', name: 'Cathode Slurry Mixing & Ultrasonic Dispersal', description: 'Homogenization of NMC cathode active material, carbon black, and PVDF binder in NMP.', inputs: ['NMC Powder', 'Carbon Black', 'NMP solvent'], chemicals: ['N-Methyl-2-pyrrolidone (CAS 872-50-4)'], emissions: ['NMP vapor captured via condenser'], waste: ['Scraper residue'], energyKw: 310.0 },
  { id: 'proc-005', name: 'High-Pressure Bio-Resin Extrusion', description: 'Twin-screw compounding and continuous extrusion of PLA/PHA biocomposite films.', inputs: ['Bio-PLA Pellets', 'Cellulose nanofibrils'], chemicals: ['Citric acid plasticizer'], emissions: ['Negligible bio-steam'], waste: ['Extruder purge trimmings (recycled)'], energyKw: 560.0 },
  { id: 'proc-006', name: 'Plasma Surface Activation & Corona Discharge', description: 'Atmospheric pressure dielectric barrier discharge modifying surface polarity for bonding.', inputs: ['High-voltage electrical power', 'Compressed dry air'], chemicals: ['Ozone (catalytically destroyed)'], emissions: ['De-ozonized exhaust'], waste: ['None'], energyKw: 85.0 },
  { id: 'proc-007', name: 'Nitrogen Blanket Chemical Synthesis', description: 'Closed-vessel organic synthesis of elastomeric precursors under pressurized N2 blanketing.', inputs: ['Monomer batch', 'Polymerization initiator'], chemicals: ['Organic peroxides', 'Specialty amines'], emissions: ['Rupture disc vent to flare stack'], waste: ['Cleaning rinse water'], energyKw: 240.0 },
  { id: 'proc-008', name: 'Regenerative Thermal Oxidation (RTO)', description: 'Ceramic bed heat exchange oxidizing volatile organics at 850°C with 99.5% destruction efficiency.', inputs: ['Facility exhaust duct gas'], chemicals: ['Methane assist fuel'], emissions: ['CO2', 'H2O vapor', 'Ultra-low NOx'], waste: ['Spent ceramic media (annual)'], energyKw: 1100.0 },
  { id: 'proc-009', name: 'Wastewater Heavy Metal Precipitation', description: 'Chemical reduction, sulfide precipitation, and clarifier settling for heavy metals removal.', inputs: ['Industrial effluent'], chemicals: ['Ferric chloride', 'Sodium dimethyldithiocarbamate'], emissions: ['None'], waste: ['Dewatered metal hydroxide cake'], energyKw: 95.0 },
  { id: 'proc-010', name: 'Supercritical CO2 Precision Cleansing', description: 'Extraction of trace oils and microscopic contaminants from precision battery tabs using SC-CO2.', inputs: ['Liquid CO2', 'Chamber pressure 100 bar'], chemicals: ['Carbon dioxide (re-liquefied)'], emissions: ['Closed loop recycling 96%'], waste: ['Extracted hydrocarbon residue'], energyKw: 180.0 },
  { id: 'proc-011', name: 'Continuous Vulcanization & Post-Cure Oven', description: 'Hot-air vulcanization tunnel followed by secondary degassing post-cure at 200°C for 4 hours.', inputs: ['Green extruded elastomer'], chemicals: ['Silane crosslinkers', 'Zinc oxide'], emissions: ['Oven exhaust to carbon filters'], waste: ['Flash trimmings'], energyKw: 620.0 },
  { id: 'proc-012', name: 'Automated Cylindrical Cell Laser Tab Welding', description: 'Fiber laser welding of nickel-plated copper busbars onto battery cell terminals.', inputs: ['Cells', 'Copper busbars', 'Laser optical line'], chemicals: ['None'], emissions: ['Laser fume extractor dust'], waste: ['HEPA dust filter'], energyKw: 75.0 },
  { id: 'proc-013', name: 'Bio-Feedstock Enzymatic Polymerization', description: 'Low-temperature catalytic conversion of plant starches into packaging polyesters.', inputs: ['Agricultural starch syrup', 'Enzyme cocktails'], chemicals: ['Enzyme biocatalyst'], emissions: ['Biogenic CO2'], waste: ['Spent biomass cake for soil amendment'], energyKw: 140.0 },
  { id: 'proc-014', name: 'VOC Carbon Bed Adsorption & Desorption', description: 'Dual-canister activated carbon filter bank removing chlorinated and fluorinated VOCs.', inputs: ['Process exhaust'], chemicals: ['Granular activated carbon'], emissions: ['Clean air discharge < 1 ppm VOC'], waste: ['Spent carbon for thermal regeneration'], energyKw: 190.0 },
  { id: 'proc-015', name: 'Pyrolysis Char Gasification & Heat Recovery', description: 'High-temperature thermal cracking of waste plastic scrap generating synthesis fuel gas.', inputs: ['Internal production plastic scrap'], chemicals: ['Synthetic syngas'], emissions: ['Clean flue gas to heat recovery boiler'], waste: ['Inert ash residue'], energyKw: 750.0 }
];

const regulations = [
  {
    id: 'reg-001',
    title: 'EU Corporate Sustainability Reporting Directive (CSRD) & ESRS Environmental Standards',
    shortTitle: 'EU CSRD Directive 2022/2464',
    jurisdictionId: 'jur-eu',
    country: 'European Union',
    regulatoryBody: 'European Commission / EFRAG',
    category: 'ESG_DISCLOSURE',
    description: 'Mandatory double-materiality sustainability reporting covering Scope 1, 2, and upstream/downstream Scope 3 emissions, circular economy metrics, and biodiversity impacts under strict digital tagging rules.',
    sourceUrl: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022L2464',
    publicationDate: '2023-01-05T00:00:00Z',
    effectiveDate: '2025-01-01T00:00:00Z',
    status: 'ENACTED',
    currentVersion: 3,
    applicability: 'All large EU entities (>250 employees or >€50M turnover) and non-EU companies with >€150M EU revenue.',
    industry: 'Cross-industry, Manufacturing, Specialty Chemicals',
    penalties: 'Up to 5% of global group annual turnover, administrative sanctions, and disqualification from public tenders.'
  },
  {
    id: 'reg-002',
    title: 'EU REACH Regulation Annex XVII — Universal PFAS Restriction Proposal',
    shortTitle: 'EU REACH PFAS Universal Ban',
    jurisdictionId: 'jur-eu',
    country: 'European Union',
    regulatoryBody: 'European Chemicals Agency (ECHA)',
    category: 'CHEMICALS',
    description: 'Comprehensive restriction proposal prohibiting the manufacture, placing on the market, and use of per- and polyfluoroalkyl substances (PFAS) containing at least one fully fluorinated methyl or methylene carbon atom.',
    sourceUrl: 'https://echa.europa.eu/hot-topics/perfluoroalkyl-chemicals-pfas',
    publicationDate: '2023-02-07T00:00:00Z',
    effectiveDate: '2026-06-30T00:00:00Z',
    status: 'UNDER_REVIEW',
    currentVersion: 4,
    applicability: 'Chemical manufacturers, industrial coatings, batteries, lubricants, and packaging producers exporting to or operating in the EEA.',
    industry: 'Specialty Chemicals, Industrial Coatings, Electronics',
    penalties: 'Immediate market ban, confiscation of goods, and civil penalties exceeding €10M per member state authority.'
  },
  {
    id: 'reg-003',
    title: 'EU Carbon Border Adjustment Mechanism (CBAM) Regulation (EU) 2023/956',
    shortTitle: 'EU CBAM Regulation',
    jurisdictionId: 'jur-eu',
    country: 'European Union',
    regulatoryBody: 'European Commission DG TAXUD',
    category: 'CARBON',
    description: 'Carbon pricing equalization mechanism taxing embedded GHG emissions of imported goods including steel, aluminum, fertilizers, hydrogen, and chemical precursors entering the EU internal market.',
    sourceUrl: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32023R0956',
    publicationDate: '2023-05-16T00:00:00Z',
    effectiveDate: '2026-01-01T00:00:00Z',
    status: 'ENACTED',
    currentVersion: 2,
    applicability: 'Importers and producers of energy-intensive materials into the EU customs territory.',
    industry: 'Metals, Chemicals, Fertilizers, Polymers',
    penalties: '€10 to €50 per tonne of unreported embedded CO2 emissions; revocation of authorized CBAM declarant status.'
  },
  {
    id: 'reg-004',
    title: 'EU Packaging and Packaging Waste Regulation (PPWR) 2024 Revision',
    shortTitle: 'EU PPWR 2024',
    jurisdictionId: 'jur-eu',
    country: 'European Union',
    regulatoryBody: 'European Parliament & Council',
    category: 'PACKAGING',
    description: 'Mandatory design-for-recycling grades, minimum post-consumer recycled plastic percentages (35% by 2030, 65% by 2040), ban on PFAS in food contact packaging, and strict empty space ratio caps (maximum 50%).',
    sourceUrl: 'https://environment.ec.europa.eu/topics/waste-and-recycling/packaging-waste_en',
    publicationDate: '2024-04-24T00:00:00Z',
    effectiveDate: '2025-11-01T00:00:00Z',
    status: 'ENACTED',
    currentVersion: 2,
    applicability: 'All packaging manufacturers, distributors, e-commerce sellers, and food/beverage processors in the EU.',
    industry: 'Packaging, Polymers, Consumer Goods',
    penalties: 'Fines proportional to non-compliant packaging volumes, commercial sales prohibition across all 27 EU member states.'
  },
  {
    id: 'reg-005',
    title: 'EU Deforestation Regulation (EUDR) Regulation (EU) 2023/1115',
    shortTitle: 'EUDR Deforestation Due Diligence',
    jurisdictionId: 'jur-eu',
    country: 'European Union',
    regulatoryBody: 'European Commission DG ENV',
    category: 'DEFORESTATION',
    description: 'Mandatory geolocation tracking (polygon coordinates) proving commodities (cattle, cocoa, coffee, oil palm, rubber, soya, wood and paper derivatives) did not originate on land deforested after Dec 31, 2020.',
    sourceUrl: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32023R1115',
    publicationDate: '2023-06-09T00:00:00Z',
    effectiveDate: '2025-12-30T00:00:00Z',
    status: 'AMENDED',
    currentVersion: 3,
    applicability: 'Traders and operators placing covered commodities and derived materials on the EU market.',
    industry: 'Forestry, Paper, Bio-Polymers, Agriculture',
    penalties: 'Confiscation of shipments, exclusion from public procurement for 12 months, fines up to 4% of total EU turnover.'
  },
  {
    id: 'reg-006',
    title: 'EU Batteries and Waste Batteries Regulation (EU) 2023/1542',
    shortTitle: 'EU Battery Passport Regulation',
    jurisdictionId: 'jur-eu',
    country: 'European Union',
    regulatoryBody: 'European Commission DG GROW',
    category: 'PRODUCT_STEWARDSHIP',
    description: 'Comprehensive lifecycle requirements for all industrial and EV batteries including mandatory Digital Battery Passports, recycled cobalt (16%), lead (85%), lithium (6%), and nickel (6%) quotas, and carbon footprint declarations.',
    sourceUrl: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32023R1542',
    publicationDate: '2023-07-28T00:00:00Z',
    effectiveDate: '2025-08-18T00:00:00Z',
    status: 'ENACTED',
    currentVersion: 2,
    applicability: 'Battery cell manufacturers, battery module integrators, EV producers, and industrial energy storage operators.',
    industry: 'Energy Storage, Automotive, Electronics',
    penalties: 'CE mark revocation, mandatory product recall at manufacturer expense, administrative fines up to €20M.'
  },
  {
    id: 'reg-007',
    title: 'US EPA TSCA Section 8(a)(7) PFAS Reporting & Recordkeeping Rule',
    shortTitle: 'US EPA TSCA PFAS Rule 40 CFR 705',
    jurisdictionId: 'jur-us',
    country: 'United States',
    regulatoryBody: 'US Environmental Protection Agency (EPA)',
    category: 'CHEMICALS',
    description: 'One-time retrospective reporting requirement under the Toxic Substances Control Act mandating every entity that manufactured or imported PFAS or PFAS-containing articles since January 1, 2011 to report chemical identity, volumes, uses, exposures, and environmental disposals.',
    sourceUrl: 'https://www.epa.gov/assessing-and-managing-chemicals-under-tsca/tsca-section-8a7-reporting-and-recordkeeping-requirements',
    publicationDate: '2023-10-11T00:00:00Z',
    effectiveDate: '2025-05-08T00:00:00Z',
    status: 'AMENDED',
    currentVersion: 3,
    applicability: 'All US chemical manufacturers and importers of industrial articles containing PFAS trace compounds.',
    industry: 'Chemicals, Electronics, Automotive, Manufacturing',
    penalties: 'Civil penalties under TSCA Section 16 up to $46,989 per day per violation.'
  },
  {
    id: 'reg-008',
    title: 'California Senate Bill 253 — Climate Corporate Data Accountability Act',
    shortTitle: 'California SB 253 Climate Disclosure',
    jurisdictionId: 'jur-us-ca',
    country: 'United States (California)',
    regulatoryBody: 'California Air Resources Board (CARB)',
    category: 'CLIMATE',
    description: 'Requires all public and private US enterprises with annual revenues exceeding $1 billion that do business in California to publicly disclose audited Scope 1, Scope 2, and Scope 3 greenhouse gas emissions annually.',
    sourceUrl: 'https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202320240SB253',
    publicationDate: '2023-10-07T00:00:00Z',
    effectiveDate: '2026-01-01T00:00:00Z',
    status: 'ENACTED',
    currentVersion: 2,
    applicability: 'Enterprises doing business in California with total annual global revenues >$1,000,000,000.',
    industry: 'All enterprise sectors, Heavy Industry, Consumer Goods',
    penalties: 'CARB administrative penalties up to $500,000 per reporting year.'
  },
  {
    id: 'reg-009',
    title: 'California Senate Bill 261 — Climate-Related Financial Risk Disclosures',
    shortTitle: 'California SB 261 Climate Risk',
    jurisdictionId: 'jur-us-ca',
    country: 'United States (California)',
    regulatoryBody: 'California Air Resources Board (CARB)',
    category: 'CLIMATE',
    description: 'Mandates biennial publication of climate-related financial risk reports aligning with the Task Force on Climate-Related Financial Disclosures (TCFD) framework, outlining physical and transition risk mitigation.',
    sourceUrl: 'https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202320240SB261',
    publicationDate: '2023-10-07T00:00:00Z',
    effectiveDate: '2026-01-01T00:00:00Z',
    status: 'ENACTED',
    currentVersion: 1,
    applicability: 'Enterprises doing business in California with annual global revenues >$500,000,000.',
    industry: 'Financial, Industrial, Manufacturing',
    penalties: 'Fines up to $50,000 per reporting cycle.'
  },
  {
    id: 'reg-010',
    title: 'German Supply Chain Due Diligence Act (Lieferkettensorgfaltspflichtengesetz — LkSG)',
    shortTitle: 'Germany LkSG Supply Chain Act',
    jurisdictionId: 'jur-de',
    country: 'Germany',
    regulatoryBody: 'BAFA (Federal Office for Economic Affairs and Export Control)',
    category: 'SUPPLY_CHAIN',
    description: 'Mandates establishment of risk management systems to prevent human rights abuses and environmental degradation (mercury emissions, persistent organic pollutants, water pollution) throughout global supplier tiers.',
    sourceUrl: 'https://www.bafa.de/EN/Supply_Chain_Act/supply_chain_act_node.html',
    publicationDate: '2023-01-01T00:00:00Z',
    effectiveDate: '2024-01-01T00:00:00Z',
    status: 'ENACTED',
    currentVersion: 2,
    applicability: 'German companies and international companies with German branches with >=1,000 employees.',
    industry: 'Manufacturing, Automotive, Specialty Chemicals',
    penalties: 'Up to 2% of average annual global turnover for companies >€400M turnover, public exclusion from federal procurement.'
  },
  {
    id: 'reg-011',
    title: 'US Clean Air Act Section 112 Synthetic Organic Chemical HAP NESHAP Standards',
    shortTitle: 'US EPA HON NESHAP Clean Air Rule',
    jurisdictionId: 'jur-us',
    country: 'United States',
    regulatoryBody: 'US Environmental Protection Agency (EPA)',
    category: 'AIR_QUALITY',
    description: 'Stringent revised National Emission Standards for Hazardous Air Pollutants (NESHAP) capping fenceline concentrations of chloroprene, ethylene oxide, benzene, and 1,3-butadiene at chemical synthesis plants.',
    sourceUrl: 'https://www.epa.gov/stationary-sources-air-pollution/hazardous-organic-neshap-synthetic-organic-chemical-manufacturing',
    publicationDate: '2024-04-09T00:00:00Z',
    effectiveDate: '2026-04-09T00:00:00Z',
    status: 'ENACTED',
    currentVersion: 2,
    applicability: 'SOCMI facilities, petrochemical refineries, synthetic resin and coating manufacturing facilities.',
    industry: 'Petrochemical, Synthetic Resins, Fine Chemicals',
    penalties: 'Clean Air Act civil judicial enforcement up to $109,000 per violation day and injunctions.'
  },
  {
    id: 'reg-012',
    title: 'Basel Convention Plastic Waste Control Amendments on Mixed & Halogenated Polymers',
    shortTitle: 'Basel Convention Plastic Waste Control',
    jurisdictionId: 'jur-intl',
    country: 'International',
    regulatoryBody: 'UN Environment Programme (UNEP)',
    category: 'WASTE',
    description: 'Legally binding international treaty governing transboundary movement of non-hazardous and hazardous plastic waste, requiring Prior Informed Consent (PIC) for contaminated, composite, or fluoropolymer scrap exports.',
    sourceUrl: 'http://www.basel.int/Implementation/Plasticwaste/overview/tabid/8340/Default.aspx',
    publicationDate: '2021-01-01T00:00:00Z',
    effectiveDate: '2024-03-01T00:00:00Z',
    status: 'AMENDED',
    currentVersion: 3,
    applicability: 'International recyclers, waste management contractors, and global material exporters.',
    industry: 'Waste Management, Plastics, Recycling',
    penalties: 'Interception and repatriation of illegal waste shipments at exporter expense; criminal prosecution under national laws.'
  },
  {
    id: 'reg-013',
    title: 'EU Industrial Emissions Directive (IED 2.0) Directive (EU) 2024/1785',
    shortTitle: 'EU IED 2.0 Revision',
    jurisdictionId: 'jur-eu',
    country: 'European Union',
    regulatoryBody: 'European Commission DG ENV',
    category: 'EMISSIONS',
    description: 'Expanded industrial permitting directive covering gigafactories, battery manufacturing plants, chemical synthesis installations, and mineral extraction with binding Best Available Techniques (BAT) emission limits.',
    sourceUrl: 'https://eur-lex.europa.eu/eli/dir/2024/1785/oj',
    publicationDate: '2024-07-15T00:00:00Z',
    effectiveDate: '2026-08-04T00:00:00Z',
    status: 'ENACTED',
    currentVersion: 1,
    applicability: 'Operating industrial chemical installations, battery gigafactories, and metal treatment plants in the EU.',
    industry: 'Heavy Industry, Batteries, Chemicals',
    penalties: 'Permit revocation, compensation claims for affected citizens, fines of at least 3% of the operator’s annual EU turnover.'
  },
  {
    id: 'reg-014',
    title: 'UK Extended Producer Responsibility (EPR) for Packaging Regulations 2024',
    shortTitle: 'UK Packaging EPR Scheme',
    jurisdictionId: 'jur-uk',
    country: 'United Kingdom',
    regulatoryBody: 'UK DEFRA / Environment Agency',
    category: 'PACKAGING',
    description: 'Mandatory modulated waste management fees placed on brand owners and importers based on packaging recyclability, weight, and material composition to fund local authority municipal recycling schemes.',
    sourceUrl: 'https://www.gov.uk/guidance/extended-producer-responsibility-for-packaging',
    publicationDate: '2024-01-10T00:00:00Z',
    effectiveDate: '2025-04-01T00:00:00Z',
    status: 'ENACTED',
    currentVersion: 2,
    applicability: 'UK businesses supplying packaging to the UK market with annual turnover >£1M and >25 tonnes packaging.',
    industry: 'Packaging, Retail, Industrial Supply',
    penalties: 'Civil sanctions, variable monetary penalties, and criminal liability for false waste returns.'
  },
  {
    id: 'reg-015',
    title: 'Japan Chemical Substances Control Law (CSCL Revision 2024) Class I Specified Toxics',
    shortTitle: 'Japan CSCL 2024 Amendment',
    jurisdictionId: 'jur-jp',
    country: 'Japan',
    regulatoryBody: 'METI, MHLW, MOE Japan',
    category: 'HAZARDOUS_MATERIALS',
    description: 'Designation of PFHxS and long-chain perfluorocarboxylic acids as Class I Specified Chemical Substances, prohibiting manufacture, import, or use without emergency Cabinet exemptions.',
    sourceUrl: 'https://www.meti.go.jp/policy/chemical_management/english/cscl/index.html',
    publicationDate: '2024-02-01T00:00:00Z',
    effectiveDate: '2024-12-01T00:00:00Z',
    status: 'ENACTED',
    currentVersion: 2,
    applicability: 'Importers and chemical manufacturers operating in Japan.',
    industry: 'Specialty Chemicals, Semiconductors, Electronics',
    penalties: 'Up to 3 years imprisonment or fines up to ¥300,000,000 for corporate entities.'
  },
  {
    id: 'reg-016',
    title: 'US EPA Industrial Solvent Degreasing Volatile Organic Compound (VOC) CTG Guidelines',
    shortTitle: 'US EPA Solvent VOC Guidelines',
    jurisdictionId: 'jur-us',
    country: 'United States',
    regulatoryBody: 'US EPA Office of Air Quality Planning & Standards',
    category: 'AIR_QUALITY',
    description: 'Control Techniques Guidelines restricting solvent degreasing and cleaning operations with VOC contents exceeding 50 g/L in ozone nonattainment areas.',
    sourceUrl: 'https://www.epa.gov/stationary-sources-air-pollution/control-techniques-guidelines-industrial-cleaning-solvents',
    publicationDate: '2023-08-14T00:00:00Z',
    effectiveDate: '2025-09-01T00:00:00Z',
    status: 'ENACTED',
    currentVersion: 1,
    applicability: 'Manufacturing operations using solvent cleaners in ozone nonattainment zones.',
    industry: 'General Manufacturing, Metal Cleaning, Maintenance',
    penalties: 'Facility operating permit suspensions and statutory Clean Air Act penalties.'
  },
  {
    id: 'reg-017',
    title: 'California Proposition 65 Maximum Allowable Dose Level (MADL) Revision for VOCs',
    shortTitle: 'California Prop 65 VOC MADL',
    jurisdictionId: 'jur-us-ca',
    country: 'United States (California)',
    regulatoryBody: 'OEHHA (Office of Environmental Health Hazard Assessment)',
    category: 'PRODUCT_STEWARDSHIP',
    description: 'Establishment of stricter safe harbor limits (MADL/NSRL) for 1-bromopropane, ethylene oxide, and perfluorinated surfactant traces in industrial adhesives and consumer products.',
    sourceUrl: 'https://oehha.ca.gov/proposition-65',
    publicationDate: '2024-03-15T00:00:00Z',
    effectiveDate: '2025-06-01T00:00:00Z',
    status: 'AMENDED',
    currentVersion: 2,
    applicability: 'Companies selling products to California consumers or with occupational exposure in California.',
    industry: 'Consumer Goods, Adhesives, Coatings',
    penalties: 'Civil penalties up to $2,500 per day per violation plus mandatory plaintiff attorney fee awards.'
  },
  {
    id: 'reg-018',
    title: 'EU Waste Framework Directive (WFD 2024 Targeted Revision) Directive (EU) 2024/278',
    shortTitle: 'EU Waste Framework Revision',
    jurisdictionId: 'jur-eu',
    country: 'European Union',
    regulatoryBody: 'European Commission DG ENV',
    category: 'WASTE',
    description: 'Mandatory separate collection and extended producer responsibility for synthetic textiles, polymer industrial composites, and bio-waste valorization schemes.',
    sourceUrl: 'https://environment.ec.europa.eu/topics/waste-and-recycling/waste-framework-directive_en',
    publicationDate: '2024-05-30T00:00:00Z',
    effectiveDate: '2026-01-01T00:00:00Z',
    status: 'ENACTED',
    currentVersion: 1,
    applicability: 'Producers of synthetic polymers, engineered textiles, and industrial waste handling sites.',
    industry: 'Textiles, Polymers, Waste Management',
    penalties: 'EPR registration revocation and member-state administrative sanctions.'
  },
  {
    id: 'reg-019',
    title: 'US SEC Climate-Related Disclosures for Investors (Rule 33-11275)',
    shortTitle: 'US SEC Climate Disclosure Rule',
    jurisdictionId: 'jur-us',
    country: 'United States',
    regulatoryBody: 'Securities and Exchange Commission (SEC)',
    category: 'ESG_DISCLOSURE',
    description: 'Regulation S-K amendments mandating large accelerated filers to disclose material Scope 1 and Scope 2 emissions, capitalized climate mitigation expenditures, and physical climate risk governance.',
    sourceUrl: 'https://www.sec.gov/rules/final/2024/33-11275.pdf',
    publicationDate: '2024-03-06T00:00:00Z',
    effectiveDate: '2026-01-01T00:00:00Z',
    status: 'UNDER_REVIEW',
    currentVersion: 2,
    applicability: 'US public reporting companies with large market capitalization.',
    industry: 'Financial, Public Corporations, Industrials',
    penalties: 'SEC Enforcement actions, restatement of financial reports, shareholder class actions.'
  },
  {
    id: 'reg-020',
    title: 'EU Critical Raw Materials Act (CRMA) Regulation (EU) 2024/1252',
    shortTitle: 'EU Critical Raw Materials Act',
    jurisdictionId: 'jur-eu',
    country: 'European Union',
    regulatoryBody: 'European Commission DG GROW',
    category: 'SUSTAINABILITY',
    description: 'Establishes EU benchmark targets for domestic extraction (10%), processing (40%), and recycling (25%) of strategic raw materials (lithium, cobalt, rare earths, graphite) by 2030, alongside supplier supply chain audits.',
    sourceUrl: 'https://eur-lex.europa.eu/eli/reg/2024/1252/oj',
    publicationDate: '2024-05-03T00:00:00Z',
    effectiveDate: '2024-05-23T00:00:00Z',
    status: 'ENACTED',
    currentVersion: 1,
    applicability: 'Large industrial consumers of critical and strategic raw materials in the EU.',
    industry: 'Batteries, Clean Energy, Aerospace',
    penalties: 'Strategic audit non-compliance disclosure and exclusion from EU Net-Zero funding.'
  },
  {
    id: 'reg-021',
    title: 'Germany TA Luft Technical Instructions on Air Quality (Technische Anleitung zur Reinhaltung der Luft)',
    shortTitle: 'Germany TA Luft 2024 Update',
    jurisdictionId: 'jur-de',
    country: 'Germany',
    regulatoryBody: 'BMUV (Federal Ministry for Environment, Germany)',
    category: 'AIR_QUALITY',
    description: 'Mandatory emission limit values for industrial synthesis installations, setting strict new caps on dust, particulate matter, organic substances, and nitrogen oxides with real-time continuous fenceline monitoring.',
    sourceUrl: 'https://www.bmuv.de/themen/luft-laerm-mobilitaet/luftreinhaltung/ta-luft',
    publicationDate: '2024-06-01T00:00:00Z',
    effectiveDate: '2025-07-01T00:00:00Z',
    status: 'ENACTED',
    currentVersion: 2,
    applicability: 'All industrial facilities operating under the Federal Immission Control Act (BImSchG) in Germany.',
    industry: 'Chemicals, Metallurgy, Power Generation',
    penalties: 'Immediate facility shutdown orders by Gewerbeaufsichtsamt (factory inspectorate).'
  },
  {
    id: 'reg-022',
    title: 'EU Ecodesign for Sustainable Products Regulation (ESPR) Regulation (EU) 2024/1781',
    shortTitle: 'EU ESPR Ecodesign Framework',
    jurisdictionId: 'jur-eu',
    country: 'European Union',
    regulatoryBody: 'European Commission DG GROW & DG ENV',
    category: 'SUSTAINABILITY',
    description: 'Comprehensive framework establishing Digital Product Passports (DPP), durability requirements, reparability standards, recycled content quotas, and bans on the destruction of unsold consumer goods.',
    sourceUrl: 'https://eur-lex.europa.eu/eli/reg/2024/1781/oj',
    publicationDate: '2024-06-28T00:00:00Z',
    effectiveDate: '2024-07-18T00:00:00Z',
    status: 'ENACTED',
    currentVersion: 1,
    applicability: 'Manufacturers, importers, and distributors of products placed on the EU market.',
    industry: 'Electronics, Textiles, Chemicals, Packaging',
    penalties: 'Prohibition on EU market entry, customs seizure, penalties up to 4% of EU annual turnover.'
  },
  {
    id: 'reg-023',
    title: 'US Toxic Substances Control Act (TSCA) Persistent Bioaccumulative Toxics Phaseout',
    shortTitle: 'US TSCA PBT Chemical Rules',
    jurisdictionId: 'jur-us',
    country: 'United States',
    regulatoryBody: 'US EPA',
    category: 'HAZARDOUS_MATERIALS',
    description: 'Strict prohibitions on the processing and distribution in commerce of PIP (3:1), DecaBDE, and 2,4,6-TTBP flame retardants in industrial plastics and electronic potting compounds.',
    sourceUrl: 'https://www.epa.gov/assessing-and-managing-chemicals-under-tsca/persistent-bioaccumulative-and-toxic-pbt-chemicals-under',
    publicationDate: '2023-11-20T00:00:00Z',
    effectiveDate: '2025-01-06T00:00:00Z',
    status: 'ENACTED',
    currentVersion: 2,
    applicability: 'Fabricators, compounders, and electronic hardware assemblers in the United States.',
    industry: 'Polymers, Electronics, Industrial Hardware',
    penalties: 'Federal civil penalties and court-ordered product forfeitures.'
  },
  {
    id: 'reg-024',
    title: 'IMO MARPOL Annex VI Carbon Intensity Indicator (CII) & CII Correction Factor Update',
    shortTitle: 'IMO MARPOL Annex VI Maritime CII',
    jurisdictionId: 'jur-intl',
    country: 'International',
    regulatoryBody: 'International Maritime Organization (IMO)',
    category: 'EMISSIONS',
    description: 'Mandatory operational carbon intensity rating (grades A to E) for cargo vessels over 5,000 GT, impacting maritime supply chain logistics and Scope 3 shipping emissions accounting.',
    sourceUrl: 'https://www.imo.org/en/OurWork/Environment/Pages/Carbon-Intensity-Indicator-(CII).aspx',
    publicationDate: '2023-01-01T00:00:00Z',
    effectiveDate: '2024-01-01T00:00:00Z',
    status: 'AMENDED',
    currentVersion: 2,
    applicability: 'Commercial shipping operators and charterers of ocean freight worldwide.',
    industry: 'Maritime Logistics, Global Supply Chain',
    penalties: 'Port state control detentions, mandatory corrective action plans, insurance invalidations.'
  },
  {
    id: 'reg-025',
    title: 'Canada Output-Based Pricing System (OBPS) Greenhouse Gas Pollution Pricing Regulations',
    shortTitle: 'Canada OBPS Carbon Pricing Update',
    jurisdictionId: 'jur-intl',
    country: 'Canada',
    regulatoryBody: 'Environment and Climate Change Canada (ECCC)',
    category: 'CARBON',
    description: 'Escalating statutory carbon pollution pricing schedule ($65/tonne rising by $15/tonne annually to $170/tonne in 2030) for heavy industrial emitters, with tightened sector performance benchmarks.',
    sourceUrl: 'https://www.canada.ca/en/environment-climate-change/services/climate-change/pricing-pollution-how-it-will-work/output-based-pricing-system.html',
    publicationDate: '2023-06-15T00:00:00Z',
    effectiveDate: '2024-01-01T00:00:00Z',
    status: 'AMENDED',
    currentVersion: 3,
    applicability: 'Industrial emitters operating in Canadian backstop jurisdictions.',
    industry: 'Chemicals, Mining, Refining',
    penalties: 'Excess emissions charges and compliance credit purchase mandates.'
  },
  {
    id: 'reg-026',
    title: 'EU Corporate Sustainability Due Diligence Directive (CSDDD) Directive (EU) 2024/1760',
    shortTitle: 'EU CSDDD Due Diligence Directive',
    jurisdictionId: 'jur-eu',
    country: 'European Union',
    regulatoryBody: 'European Parliament & Council',
    category: 'SUPPLY_CHAIN',
    description: 'Obliges large EU and third-country companies to identify, prevent, and mitigate adverse human rights and environmental impacts (biodiversity loss, pollution, greenhouse emissions) across upstream supply chains and downstream distribution.',
    sourceUrl: 'https://eur-lex.europa.eu/eli/dir/2024/1760/oj',
    publicationDate: '2024-07-05T00:00:00Z',
    effectiveDate: '2027-07-26T00:00:00Z',
    status: 'ENACTED',
    currentVersion: 1,
    applicability: 'Companies with >1,000 employees and net worldwide turnover >€450M.',
    industry: 'Manufacturing, Heavy Industry, Retail',
    penalties: 'Fines up to 5% of net worldwide turnover and civil liability for victims of damages.'
  }
];

const changes = [
  {
    id: 'chg-001',
    regId: 'reg-002',
    changeType: 'THRESHOLD_CHANGE',
    severity: 'CRITICAL',
    effectiveDate: '2026-06-30T00:00:00Z',
    summary: 'Universal PFAS limit lowered from 25 ppb (parts per billion) to 1.0 ppb with elimination of industrial fluoropolymer processing exemptions.',
    sectionId: 'Article 67 & Annex XVII Entry 68',
    oldText: 'Per- and polyfluoroalkyl substances (PFAS) shall not be manufactured or placed on the market as substances on their own or in mixtures in a concentration equal to or greater than 25 ppb (0.025 mg/kg) for the sum of targeted PFAS, or 250 ppb for the sum of all PFAS including precursors. Derogation applies to closed-loop fluoropolymer industrial sintering equipment until December 2028.',
    newText: 'Per- and polyfluoroalkyl substances (PFAS) shall not be manufactured, placed on the market, or used in industrial chemical synthesis or article manufacturing in a concentration equal to or greater than 1.0 ppb (0.001 mg/kg) for any individual PFAS compound, or 5.0 ppb for total combined organic fluorine content. ALL INDUSTRIAL MANUFACTURING DEROGATIONS FOR FLUOROPOLYMER SINTERING AND SOLVENT DISPERSIONS ARE REVOKED EFFECTIVE JUNE 30, 2026.',
    ai: {
      summary: 'Critical regulatory drift: ECHA eliminated the industrial processing exemption for fluoropolymer manufacturing and slashed the allowable PFAS threshold by 96% down to 1.0 ppb.',
      whatChanged: [
        'Allowable PFAS threshold cut from 25 ppb down to 1.0 ppb',
        'Total organic fluorine limit reduced from 250 ppb to 5.0 ppb',
        'Complete elimination of previously granted derogation for closed-loop fluoropolymer sintering by June 30, 2026'
      ],
      whyItMatters: 'Apex-Fluor 400 coating contains high molecular weight fluoropolymer chains that exceed the 1.0 ppb threshold. Facility fac-001 in Dresden directly executes fluoropolymer heat curing (proc-001) which will violate the revised rule without zero-emission scrubber retrofits.',
      affectedProducts: ['Apex-Fluor 400 Protective Polymer (AF400-EUR-01)', 'SynthoFlex Fluoroelastomer (SF-ELAST-22)'],
      affectedFacilities: ['Apex Advanced Materials — Dresden (fac-001)'],
      affectedProcesses: ['Fluoropolymer Heat Curing & Sintering (proc-001)', 'Wastewater Heavy Metal Precipitation (proc-009)'],
      affectedSuppliers: ['DuPont Industrial Fluoromaterials (supp-008)', 'Solvay Specialty Chemicals (supp-005)'],
      potentialObligations: [
        'Mandatory substitution of fluorosurfactant aids prior to June 2026',
        'Installation of fenceline granular activated carbon (GAC) water polishing units',
        'Submission of alternative assessment dossier to ECHA within 90 days'
      ],
      recommendedActions: [
        'Initiate pilot testing of non-fluorinated siloxane alternative for Apex-Fluor 400 formulation',
        'Audit Dresden facility effluent discharge using high-resolution liquid chromatography (LC-MS/MS)',
        'Issue formal compliance query to suppliers supp-008 and supp-005 requesting PFAS impurity certificates'
      ],
      effectiveDate: '2026-06-30T00:00:00Z',
      urgency: 'CRITICAL',
      riskLevel: 'CRITICAL',
      confidence: 0.98,
      requiresHumanReview: true,
      sourceReferences: ['ECHA Restriction Report Proposal Annex XVII Entry 68 Revision 4, Section 2.1']
    }
  },
  {
    id: 'chg-002',
    regId: 'reg-004',
    changeType: 'OBLIGATION_CHANGE',
    severity: 'HIGH',
    effectiveDate: '2025-11-01T00:00:00Z',
    summary: 'PPWR 2024 revision imposes mandatory 35% post-consumer recycled (PCR) content for contact-sensitive packaging and bans perfluorinated barriers in food contact film.',
    sectionId: 'Article 6(1) & Article 13 — Recycled Content & Chemical Safety',
    oldText: 'Member states shall encourage packaging manufacturers to incorporate secondary raw materials into plastic packaging where technically feasible. Economic operators should achieve voluntary recycled content targets of 25% by 2030.',
    newText: 'By 1 November 2025, each unit of plastic packaging placed on the European Union market shall contain a mandatory minimum of 35% post-consumer recycled plastic (PCR) verified via certified mass balance chain-of-custody. Furthermore, food contact packaging containing intentionally added PFAS exceeding 25 ppm or total fluorine exceeding 50 mg/kg is strictly prohibited from market placement.',
    ai: {
      summary: 'EU PPWR shifts from voluntary recycled content targets to legally binding 35% post-consumer recycled minimums, alongside a blanket prohibition of PFAS barriers in food packaging.',
      whatChanged: [
        'Mandatory 35% PCR minimum content enacted for all plastic packaging entering the EU',
        'Immediate ban on intentionally added PFAS or total fluorine >50 mg/kg in food contact materials',
        'Third-party mass balance chain-of-custody certification mandated'
      ],
      whyItMatters: 'EcoPack Ultra-Barrier Food Film (prod-002) is manufactured at Apex Austin (fac-002) using bio-PLA but utilizes an external barrier coating that must be verified for fluorine absence and certified for PCR compliance.',
      affectedProducts: ['EcoPack Ultra-Barrier Food Film (EP-UBF-09)'],
      affectedFacilities: ['Apex BioPlastics & Packaging — Austin (fac-002)'],
      affectedProcesses: ['High-Pressure Bio-Resin Extrusion (proc-005)'],
      affectedSuppliers: ['Nordic Bio-Polymers AB (supp-003)', 'Stora Enso Circular Packaging (supp-012)'],
      potentialObligations: [
        'Re-certify EcoPack film bill-of-materials against EN 13432 and PCR mass-balance standards',
        'Eliminate any trace fluorinated processing aids in extrusion lines'
      ],
      recommendedActions: [
        'Execute fluorine combustibility testing on Austin plant extrusion barrier layers',
        'Secure guaranteed 40% PCR certified resin batches from Nordic Bio-Polymers'
      ],
      effectiveDate: '2025-11-01T00:00:00Z',
      urgency: 'HIGH',
      riskLevel: 'HIGH',
      confidence: 0.95,
      requiresHumanReview: true,
      sourceReferences: ['Regulation (EU) 2024/PPWR Final Text, Articles 6, 7 & 13']
    }
  },
  {
    id: 'chg-003',
    regId: 'reg-006',
    changeType: 'DEADLINE_CHANGE',
    severity: 'HIGH',
    effectiveDate: '2025-08-18T00:00:00Z',
    summary: 'EU Battery Passport digital QR code deployment accelerated to August 2025 with strict supply chain carbon footprint declaration rules.',
    sectionId: 'Article 77 & Annex VI — Digital Battery Passport Architecture',
    oldText: 'By 18 February 2027, economic operators placing industrial batteries with capacity above 2 kWh on the market shall ensure that a battery passport is accessible via a secure electronic record system.',
    newText: 'By 18 August 2025, each industrial battery with capacity above 2 kWh placed on the Union market or put into service shall possess an accessible Digital Battery Passport linked to an indelible QR code. The passport must declare certified lifecycle carbon footprint (kg CO2e/kWh), recycled cobalt/lithium/nickel quotas, and validated supply chain due diligence reports.',
    ai: {
      summary: 'Digital Battery Passport enforcement moved forward by 18 months to August 2025, requiring verifiable carbon footprint and material origin data.',
      whatChanged: [
        'Battery Passport deadline brought forward from Feb 2027 to 18 August 2025',
        'Mandatory inclusion of certified supply chain carbon footprint per kWh',
        'QR code permanent laser etching requirement on pack chassis'
      ],
      whyItMatters: 'PowerCell X9 Battery Pack (prod-003) assembled in Osaka (fac-004) exports heavily to Germany and Belgium. Missing the August 2025 deadline blocks CE marking and customs clearance.',
      affectedProducts: ['PowerCell X9 High-Density Storage Pack (PCX9-BAT-48V)', 'PureVolt Polymeric Separator (PVC-POLY-10)'],
      affectedFacilities: ['Apex Battery Assembly & Testing — Osaka (fac-004)'],
      affectedProcesses: ['Automated Cylindrical Cell Laser Tab Welding (proc-012)', 'Cathode Slurry Mixing (proc-004)'],
      affectedSuppliers: ['Rio Tinto Battery Materials (supp-004)', 'Umicore Cathode Refining (supp-009)', 'LG Energy Materials (supp-010)'],
      potentialObligations: [
        'Implement Battery Passport API connector compliant with EU CIRPASS architecture',
        'Collect verified Scope 1, 2, and 3 carbon data from Rio Tinto and Umicore'
      ],
      recommendedActions: [
        'Contract third-party ISO 14044 lifecycle analysis auditor for PowerCell X9',
        'Install QR code laser-etching verification camera on Osaka assembly line'
      ],
      effectiveDate: '2025-08-18T00:00:00Z',
      urgency: 'HIGH',
      riskLevel: 'HIGH',
      confidence: 0.94,
      requiresHumanReview: false,
      sourceReferences: ['Regulation (EU) 2023/1542, Articles 77 and 78']
    }
  },
  {
    id: 'chg-004',
    regId: 'reg-007',
    changeType: 'REPORTING_CHANGE',
    severity: 'CRITICAL',
    effectiveDate: '2025-05-08T00:00:00Z',
    summary: 'US EPA TSCA Sec 8(a)(7) reporting window finalized: mandatory submission of 12 years of retrospective PFAS import data with no de minimis exemption.',
    sectionId: '40 CFR Part 705.15 — Scope of Reporting & Data Elements',
    oldText: 'Manufacturers of PFAS substances may submit historical production estimates if exact metering records from 2011 to 2018 are unavailable. Articles containing trace concentrations below 0.1% by weight were proposed for exclusion.',
    newText: 'All entities that manufactured or imported PFAS or PFAS-containing articles between January 1, 2011 and December 31, 2022 must submit definitive reports via the EPA Central Data Exchange (CDX). There is NO DE MINIMIS THRESHOLD. Trace impurities, components of imported polymers, and processing aids are fully subject to mandatory reporting. Reporting opens November 2024 and closes May 8, 2025.',
    ai: {
      summary: 'EPA eliminated the proposed 0.1% de minimis exemption for TSCA PFAS reporting, mandating exhaustive retrospective reporting back to 2011.',
      whatChanged: [
        'Removal of de minimis threshold for articles containing trace PFAS',
        'Mandatory electronic reporting deadline fixed to May 8, 2025',
        'Historical records from 2011 to 2022 must be reconstructed and certified under penalty of perjury'
      ],
      whyItMatters: 'Apex Austin (fac-002) imported fluoropolymer additives from Japanese suppliers between 2014 and 2021. Exposure to TSCA Section 16 penalties ($46,989/day) if retrospective import volumes are unfiled.',
      affectedProducts: ['Apex-Fluor 400 Protective Polymer (AF400-EUR-01)', 'CryoSeal Liquid Gasket (CSL-GAS-88)'],
      affectedFacilities: ['Apex BioPlastics & Packaging — Austin (fac-002)'],
      affectedProcesses: ['Nitrogen Blanket Chemical Synthesis (proc-007)'],
      affectedSuppliers: ['Tokyo ChemCorp Ltd. (supp-001)', 'DuPont Industrial Fluoromaterials (supp-008)'],
      potentialObligations: [
        'Reconstruct 12 years of customs entry filings and chemical CAS logs',
        'Submit completed Form 7710-X via EPA CDX portal'
      ],
      recommendedActions: [
        'Engage external customs brokerage audit team to pull 2011-2022 ACE entry records',
        'Coordinate chemical characterization sign-offs with legal team'
      ],
      effectiveDate: '2025-05-08T00:00:00Z',
      urgency: 'CRITICAL',
      riskLevel: 'CRITICAL',
      confidence: 0.99,
      requiresHumanReview: true,
      sourceReferences: ['US EPA Final Rule 88 FR 70516, 40 CFR Part 705']
    }
  },
  {
    id: 'chg-005',
    regId: 'reg-003',
    changeType: 'SCOPE_CHANGE',
    severity: 'HIGH',
    effectiveDate: '2026-01-01T00:00:00Z',
    summary: 'EU CBAM expands reporting to include Scope 3 precursor emissions and sets definitive financial carbon certificate purchasing timeline.',
    sectionId: 'Annex I & Annex III — Emissions Calculation Methodologies',
    oldText: 'During the transitional phase, declarants shall report direct Scope 1 emissions and indirect Scope 2 electricity emissions using either EU default default values or facility monitoring data.',
    newText: 'Effective 1 January 2026, the CBAM financial definitive regime commences. Importers must purchase CBAM certificates matching weekly EU ETS auction prices. The boundary of embedded emissions is formally expanded to include complex precursors (Annex I chemical resins, hydrogen derivatives) and upstream Scope 3 extraction footprint. Default values are restricted to maximum penalty calculations.',
    ai: {
      summary: 'CBAM enters definitive financial tariff phase with mandatory Scope 3 precursor emissions inclusion, replacing transition estimation models.',
      whatChanged: [
        'Transition phase concludes, financial CBAM certificate purchasing becomes mandatory',
        'Scope 3 upstream chemical precursor emissions added to covered boundary',
        'Default values will incur highest-tier penalty coefficients'
      ],
      whyItMatters: 'Apex Antwerp refinery (fac-003) imports specialty chemical precursors from Formosa Plastics (supp-007) in Taiwan and Rio Tinto (supp-004) in Australia. High embedded carbon will result in substantial import tariffs.',
      affectedProducts: ['SynthoFlex Fluoroelastomer (SF-ELAST-22)', 'PureVolt Polymeric Separator (PVC-POLY-10)'],
      affectedFacilities: ['Apex Chemical Refineries — Antwerp (fac-003)'],
      affectedProcesses: ['Solvent Recovery & Distillation (proc-003)'],
      affectedSuppliers: ['Formosa Advanced Petrochemicals (supp-007)', 'Rio Tinto Battery Materials (supp-004)'],
      potentialObligations: [
        'Register as Authorized CBAM Declarant with Belgian customs authorities',
        'Acquire verified Primary Data carbon certificates from Formosa and Rio Tinto'
      ],
      recommendedActions: [
        'Establish direct API telemetry with suppliers for shipment-level emission certificates',
        'Evaluate low-carbon domestic EU suppliers to replace high-tariff Taiwanese raw materials'
      ],
      effectiveDate: '2026-01-01T00:00:00Z',
      urgency: 'HIGH',
      riskLevel: 'HIGH',
      confidence: 0.93,
      requiresHumanReview: false,
      sourceReferences: ['Regulation (EU) 2023/956, Annex III and Commission Implementing Regulation 2023/1773']
    }
  },
  {
    id: 'chg-006',
    regId: 'reg-008',
    changeType: 'REPORTING_CHANGE',
    severity: 'HIGH',
    effectiveDate: '2026-01-01T00:00:00Z',
    summary: 'California CARB establishes electronic disclosure portal and third-party assurance protocols for SB 253 Scope 1, 2, and 3 disclosures.',
    sectionId: 'Section 38532(c) — Assurance & Reporting Architecture',
    oldText: 'Disclosures shall begin in 2026 for Scope 1 and Scope 2 emissions, and Scope 3 emissions shall be reported within 180 days of public regulations adoption.',
    newText: 'Reporting entities shall submit audited Scope 1 and Scope 2 emissions by 1 June 2026, and full Scope 3 supply chain greenhouse gas emissions by 1 December 2026. Reporting must adhere to the GHG Protocol Corporate Standard and possess limited assurance by an independent CARB-accredited verification body.',
    ai: {
      summary: 'CARB codified exact deadlines and mandatory limited assurance verification for SB 253 corporate disclosures.',
      whatChanged: [
        'Deadlines established: June 1, 2026 (Scope 1/2) and Dec 1, 2026 (Scope 3)',
        'Mandatory limited assurance by CARB-accredited verifiers',
        'Strict GHG Protocol Corporate Standard alignment enforced'
      ],
      whyItMatters: 'Apex Industrial Systems exceeds the $1B revenue threshold and conducts extensive commerce in California. Austin plant and global suppliers must be audited.',
      affectedProducts: ['All Apex Products'],
      affectedFacilities: ['Apex BioPlastics & Packaging — Austin (fac-002)', 'Apex Advanced Materials — Dresden (fac-001)'],
      affectedProcesses: ['High-Pressure Bio-Resin Extrusion (proc-005)', 'Regenerative Thermal Oxidation (proc-008)'],
      affectedSuppliers: ['All 12 Global Suppliers'],
      potentialObligations: [
        'Publish board-approved GHG inventory compliant with CARB rules',
        'Contract accredited third-party verification auditor'
      ],
      recommendedActions: [
        'Consolidate multi-facility Scope 1, 2, and 3 telemetry into centralized ESG ledger',
        'Initiate baseline pre-assurance review with Big 4 audit partner'
      ],
      effectiveDate: '2026-01-01T00:00:00Z',
      urgency: 'HIGH',
      riskLevel: 'HIGH',
      confidence: 0.96,
      requiresHumanReview: false,
      sourceReferences: ['California Health and Safety Code Division 25.5, Part 3.7']
    }
  },
  {
    id: 'chg-007',
    regId: 'reg-011',
    changeType: 'THRESHOLD_CHANGE',
    severity: 'MEDIUM',
    effectiveDate: '2026-04-09T00:00:00Z',
    summary: 'EPA HON Rule slashes fenceline benzene and 1,3-butadiene action levels to 3.0 ug/m3 with mandatory public web reporting.',
    sectionId: '40 CFR 63 Subpart G — Fenceline Monitoring Work Practice Standards',
    oldText: 'Facilities shall sample organic hazardous air pollutants at perimeter monitors quarterly. The action level for corrective root cause analysis was 9.0 ug/m3 annual rolling average.',
    newText: 'Facilities subject to Subpart G must install continuous passive or real-time fenceline sorbent tubes. The rolling annual average action level for benzene is reduced to 3.0 ug/m3 (formerly 9.0 ug/m3). Exceedance of the action level triggers mandatory root-cause analysis within 5 days and corrective action within 45 days, with all raw data streamed to the EPA public fenceline dashboard.',
    ai: {
      summary: 'EPA slashed industrial chemical fenceline action levels by 66% and mandated public fenceline monitoring telemetry.',
      whatChanged: [
        'Action level lowered from 9.0 ug/m3 to 3.0 ug/m3',
        'Root cause analysis window tightened to 5 days',
        'Real-time automated data reporting to public EPA portal'
      ],
      whyItMatters: 'Apex Austin facility (fac-002) and partner refining nodes must ensure chemical distillation and regenerative oxidizers operate below the 3.0 ug/m3 cap.',
      affectedProducts: ['BioSolv Industrial Degreaser (BS-DEGR-55)'],
      affectedFacilities: ['Apex BioPlastics & Packaging — Austin (fac-002)'],
      affectedProcesses: ['Regenerative Thermal Oxidation (proc-008)', 'VOC Carbon Bed Adsorption (proc-014)'],
      affectedSuppliers: ['Air Liquide Industrial Gases (supp-011)'],
      potentialObligations: [
        'Deploy 16 fenceline passive sampling tubes with bi-weekly GC-FID analysis',
        'Establish automated root cause escalation protocol'
      ],
      recommendedActions: [
        'Conduct optical gas imaging (OGI) leak detection survey across Austin facility piping',
        'Calibrate Regenerative Thermal Oxidizer combustion efficiency to 99.8%'
      ],
      effectiveDate: '2026-04-09T00:00:00Z',
      urgency: 'MEDIUM',
      riskLevel: 'MEDIUM',
      confidence: 0.92,
      requiresHumanReview: false,
      sourceReferences: ['US EPA Final Clean Air Act SOCMI Rule, 89 FR 32900']
    }
  },
  {
    id: 'chg-008',
    regId: 'reg-010',
    changeType: 'PENALTY_CHANGE',
    severity: 'MEDIUM',
    effectiveDate: '2024-01-01T00:00:00Z',
    summary: 'BAFA tightens environmental due diligence enforcement under German LkSG, adding mandatory mercury and POP audits.',
    sectionId: 'Section 7 & 8 — Environmental Due Diligence Obligations',
    oldText: 'Companies must perform general human rights risk analysis annually and document procedures for direct Tier-1 suppliers.',
    newText: 'BAFA will systematically audit compliance with the Minamata Convention on Mercury and the Stockholm Convention on Persistent Organic Pollutants across Tier-1 and indirect Tier-N suppliers where substantiated hints exist. Failure to submit audited BAFA annual reports by April 30 triggers automatic fines of up to €800,000.',
    ai: {
      summary: 'German regulator BAFA expanded LkSG auditing to enforce strict chemical pollutant and mercury prevention across supply tiers.',
      whatChanged: [
        'Direct focus on Minamata mercury and Stockholm POPs compliance',
        'Automatic penalty trigger for unfiled supply chain reports',
        'Increased scrutiny of Tier-N indirect suppliers'
      ],
      whyItMatters: 'Apex Dresden plant (fac-001) is located in Germany and falls directly under BAFA oversight. Taiwanese and Australian suppliers must be screened.',
      affectedProducts: ['All European product lines'],
      affectedFacilities: ['Apex Advanced Materials — Dresden (fac-001)'],
      affectedProcesses: ['Acid Leaching & Neutralization (proc-002)'],
      affectedSuppliers: ['Formosa Advanced Petrochemicals (supp-007)', 'Rio Tinto Battery Materials (supp-004)'],
      potentialObligations: [
        'Submit annual LkSG report via BAFA digital platform',
        'Execute environmental on-site audit of high-risk suppliers'
      ],
      recommendedActions: [
        'Issue LkSG questionnaire covering POPs and mercury to Formosa Plastics',
        'Update supplier code of conduct with mandatory BAFA audit clauses'
      ],
      effectiveDate: '2024-01-01T00:00:00Z',
      urgency: 'MEDIUM',
      riskLevel: 'MEDIUM',
      confidence: 0.91,
      requiresHumanReview: false,
      sourceReferences: ['BAFA LkSG Implementation Guidance 2024, Section 3.4']
    }
  },
  {
    id: 'chg-009',
    regId: 'reg-001',
    changeType: 'REPORTING_CHANGE',
    severity: 'HIGH',
    effectiveDate: '2025-01-01T00:00:00Z',
    summary: 'EFRAG publishes finalized ESRS XBRL taxonomy and digital tagging requirements for CSRD corporate sustainability statements.',
    sectionId: 'Annex I — ESRS E1, E2, E4 & E5 Digital Reporting Taxonomy',
    oldText: 'Sustainability statements shall be included in a dedicated section of the management report in human-readable PDF format.',
    newText: 'Sustainability statements must be marked up using Inline XBRL (iXBRL) according to the EFRAG ESRS Digital Taxonomy. Every quantitative metric—including Scope 1, 2, and 3 emissions breakdowns, water stress indicators, circular material inflows, and hazardous chemical volumes—must feature granular digital tags validated against ESMA technical standards.',
    ai: {
      summary: 'CSRD sustainability reports must be submitted as machine-readable iXBRL tagged filings starting FY2025.',
      whatChanged: [
        'Mandatory iXBRL digital tagging replacing flat PDF reports',
        'Granular tags required for over 1,100 ESRS data points',
        'Automated ESMA compliance validation rules applied'
      ],
      whyItMatters: 'Apex European entities must ensure ERP and ESG software outputs valid iXBRL data blocks to prevent filing rejections.',
      affectedProducts: ['All products'],
      affectedFacilities: ['Apex Advanced Materials — Dresden (fac-001)', 'Apex Chemical Refineries — Antwerp (fac-003)'],
      affectedProcesses: ['All 15 processes'],
      affectedSuppliers: ['All suppliers'],
      potentialObligations: [
        'Integrate iXBRL digital tagging into corporate sustainability reporting pipeline',
        'Obtain auditor attestation on digital tagging compliance'
      ],
      recommendedActions: [
        'Implement RegulaMap CSRD tagging exporter module',
        'Map internal facility energy and waste metrics to EFRAG ESRS E1 and E2 schema codes'
      ],
      effectiveDate: '2025-01-01T00:00:00Z',
      urgency: 'HIGH',
      riskLevel: 'HIGH',
      confidence: 0.97,
      requiresHumanReview: false,
      sourceReferences: ['EFRAG ESRS XBRL Taxonomy Release v1.0, July 2024']
    }
  },
  {
    id: 'chg-010',
    regId: 'reg-013',
    changeType: 'SCOPE_CHANGE',
    severity: 'HIGH',
    effectiveDate: '2026-08-04T00:00:00Z',
    summary: 'EU IED 2.0 directive formally incorporates industrial battery gigafactories and electrolyzer facilities into mandatory environmental permit rules.',
    sectionId: 'Annex I, Category 4.7 & 6.12 — Battery Manufacturing & Industrial Installations',
    oldText: 'Installations for the production of inorganic or organic chemicals with capacity exceeding thresholds are subject to IED permits. Battery assembly was previously regulated under generic national industrial codes.',
    newText: 'Annex I is amended to explicitly include: (a) Installations for the manufacture of battery cells or modules with an annual production capacity exceeding 0.5 GWh; (b) Installations for the production of hydrogen via electrolysis exceeding 50 MW capacity. Operators must establish certified Environmental Management Systems (EMS) and adhere to revised BAT-AEL emission limits for volatile organics and heavy metals.',
    ai: {
      summary: 'Industrial battery plants >0.5 GWh are now directly regulated under the stringent EU Industrial Emissions Directive.',
      whatChanged: [
        'Battery manufacturing >0.5 GWh added to Annex I permitting scope',
        'Mandatory EMAS or ISO 14001 Environmental Management System',
        'Binding BAT-AEL emission limit values applied to battery processing'
      ],
      whyItMatters: 'Although Osaka plant is in Japan, Apex is evaluating a 1.5 GWh battery cell line in Antwerp (Belgium) which will require immediate IED permitting.',
      affectedProducts: ['PowerCell X9 High-Density Storage Pack (PCX9-BAT-48V)'],
      affectedFacilities: ['Apex Chemical Refineries — Antwerp (fac-003)', 'Apex Battery Assembly — Osaka (fac-004)'],
      affectedProcesses: ['Cathode Slurry Mixing (proc-004)', 'Automated Cylindrical Cell Laser Tab Welding (proc-012)'],
      affectedSuppliers: ['Umicore Cathode Refining (supp-009)'],
      potentialObligations: [
        'Prepare comprehensive IED Baseline Environmental Report for planned Antwerp expansion',
        'Implement closed-loop solvent recovery certified under BAT guidelines'
      ],
      recommendedActions: [
        'Review BAT Reference Document (BREF) on Surface Treatment using Organic Solvents',
        'Conduct environmental baseline soil and groundwater survey at Antwerp site'
      ],
      effectiveDate: '2026-08-04T00:00:00Z',
      urgency: 'HIGH',
      riskLevel: 'HIGH',
      confidence: 0.95,
      requiresHumanReview: true,
      sourceReferences: ['Directive (EU) 2024/1785, Articles 3, 14 & Annex I']
    }
  },
  {
    id: 'chg-011',
    regId: 'reg-021',
    changeType: 'THRESHOLD_CHANGE',
    severity: 'MEDIUM',
    effectiveDate: '2025-07-01T00:00:00Z',
    summary: 'German TA Luft revision caps total dust and organic emissions from chemical synthesis reactors to 5 mg/m3.',
    sectionId: 'Section 5.2.5 — Total Dust & Class I Organic Compounds',
    oldText: 'Total dust emissions from chemical reaction exhausts shall not exceed 20 mg/m3 at mass flow rates of 0.20 kg/h or greater.',
    newText: 'Total dust emissions from all chemical synthesis, curing, and compounding exhausts shall not exceed 5.0 mg/m3 at mass flow rates of 0.05 kg/h or greater. For Class I organic compounds, the emission concentration limit is reduced to 10 mg/m3 with mandatory continuous parameter recording.',
    ai: {
      summary: 'Germany TA Luft lowers dust emission limits by 75% down to 5.0 mg/m3 for chemical exhaust systems.',
      whatChanged: [
        'Dust emission cap lowered from 20 mg/m3 to 5.0 mg/m3',
        'Mass flow threshold reduced from 0.20 kg/h to 0.05 kg/h',
        'Mandatory continuous telemetry recording of abatement parameters'
      ],
      whyItMatters: 'Apex Dresden facility (fac-001) operates curing ovens (proc-001) and calcining lines that must verify HEPA filtration compliance.',
      affectedProducts: ['Apex-Fluor 400 Protective Polymer (AF400-EUR-01)'],
      affectedFacilities: ['Apex Advanced Materials — Dresden (fac-001)'],
      affectedProcesses: ['Fluoropolymer Heat Curing & Sintering (proc-001)'],
      affectedSuppliers: ['BASF SE (supp-002)'],
      potentialObligations: [
        'Upgrade baghouse filtration media to PTFE membrane filters',
        'Install continuous opacity and differential pressure sensors'
      ],
      recommendedActions: [
        'Perform stack emission measurement protocol at Dresden stack K-02',
        'Calibrate differential pressure alarms on exhaust filtration units'
      ],
      effectiveDate: '2025-07-01T00:00:00Z',
      urgency: 'MEDIUM',
      riskLevel: 'MEDIUM',
      confidence: 0.93,
      requiresHumanReview: false,
      sourceReferences: ['Gemeinsames Ministerialblatt Nr. 48-54, TA Luft Neufassung']
    }
  },
  {
    id: 'chg-012',
    regId: 'reg-022',
    changeType: 'OBLIGATION_CHANGE',
    severity: 'HIGH',
    effectiveDate: '2024-07-18T00:00:00Z',
    summary: 'EU ESPR enters into force with immediate mandates for Digital Product Passports and destruction ban disclosures for unsold goods.',
    sectionId: 'Articles 8, 9, 20 & 21 — Digital Product Passport Architecture',
    oldText: 'Ecodesign requirements applied exclusively to energy-related products under Directive 2009/125/EC.',
    newText: 'The Ecodesign for Sustainable Products Regulation (ESPR) is entered into force. Priority working plans designate chemicals, polymers, textiles, and electronics for mandatory Digital Product Passports (DPP) containing material composition, carbon footprint, and recyclability scores. Companies must publicly disclose the volume of unsold products discarded annually.',
    ai: {
      summary: 'ESPR replaces the legacy ecodesign directive, extending DPP requirements to virtually all manufactured industrial goods.',
      whatChanged: [
        'Scope broadened from energy-using devices to all physical products',
        'Mandatory Digital Product Passport framework enacted',
        'Public disclosure requirement on destruction of unsold inventory'
      ],
      whyItMatters: 'All 8 Apex products distributed in the EU will require digital product passport schemas within the next 24 months.',
      affectedProducts: ['All Apex Products'],
      affectedFacilities: ['Apex Advanced Materials — Dresden (fac-001)', 'Apex Chemical Refineries — Antwerp (fac-003)'],
      affectedProcesses: ['All processes'],
      affectedSuppliers: ['All suppliers'],
      potentialObligations: [
        'Map bill of materials to upcoming DPP data models',
        'Establish zero-destruction policy for surplus chemical and polymer inventory'
      ],
      recommendedActions: [
        'Assemble cross-functional product stewardship team to establish DPP repository',
        'Audit inventory disposition workflows across European warehouses'
      ],
      effectiveDate: '2024-07-18T00:00:00Z',
      urgency: 'HIGH',
      riskLevel: 'HIGH',
      confidence: 0.95,
      requiresHumanReview: false,
      sourceReferences: ['Regulation (EU) 2024/1781, Official Journal L Series']
    }
  },
  {
    id: 'chg-013',
    regId: 'reg-005',
    changeType: 'DEADLINE_CHANGE',
    severity: 'MEDIUM',
    effectiveDate: '2025-12-30T00:00:00Z',
    summary: 'European Commission approves 12-month phasing delay for EUDR deforestation due diligence enforcement.',
    sectionId: 'Article 38 — Entry into Application & Transitional Provisions',
    oldText: 'The regulation shall apply from 30 December 2024 for large operators and traders, and from 30 June 2025 for micro and small enterprises.',
    newText: 'The regulation shall apply from 30 December 2025 for large operators and traders, and from 30 June 2026 for micro and small enterprises. The European Commission Deforestation Due Diligence Information System will open for pre-registration in June 2025 to enable upload of plot polygon coordinates.',
    ai: {
      summary: 'EU Deforestation Regulation compliance deadline deferred by 12 months, granting additional runway to map supply chains.',
      whatChanged: [
        'Enforcement delayed from 30 Dec 2024 to 30 Dec 2025 for large enterprises',
        'Pre-registration portal launch announced for June 2025',
        'Polygon geolocation data validation protocols updated'
      ],
      whyItMatters: 'Apex packaging materials (prod-002) utilize bio-based cellulose and wood pulp derivatives supplied by Stora Enso. The delay provides vital window to gather forest polygon coordinates.',
      affectedProducts: ['EcoPack Ultra-Barrier Food Film (EP-UBF-09)'],
      affectedFacilities: ['Apex BioPlastics & Packaging — Austin (fac-002)'],
      affectedProcesses: ['High-Pressure Bio-Resin Extrusion (proc-005)'],
      affectedSuppliers: ['Stora Enso Circular Packaging (supp-012)'],
      potentialObligations: [
        'Collect GIS polygon coordinates for all timber and bio-feedstock plots',
        'Submit due diligence statements to EU Deforestation Registry'
      ],
      recommendedActions: [
        'Request certified GIS plot coordinate data package from Stora Enso',
        'Verify zero-deforestation baseline satellite verification imagery'
      ],
      effectiveDate: '2025-12-30T00:00:00Z',
      urgency: 'MEDIUM',
      riskLevel: 'MEDIUM',
      confidence: 0.98,
      requiresHumanReview: false,
      sourceReferences: ['European Commission Press Release IP/24/5009, Proposal COM(2024) 452']
    }
  },
  {
    id: 'chg-014',
    regId: 'reg-014',
    changeType: 'REPORTING_CHANGE',
    severity: 'MEDIUM',
    effectiveDate: '2025-04-01T00:00:00Z',
    summary: 'UK DEFRA publishes illustrative base fees for packaging EPR modulated fee structure.',
    sectionId: 'Regulation 22 & Schedule 4 — Modulated Disposal Fees',
    oldText: 'Producers shall submit packaging weight data semi-annually under the legacy PRN (Packaging Recovery Note) system.',
    newText: 'Effective 1 April 2025, local authority packaging waste management costs will be directly billed to obligated producers via modulated EPR fees. Base fee estimates range from £130-£220/tonne for aluminum, £330-£590/tonne for plastic packaging, and £140-£260/tonne for paper/cardboard. Modulations based on recyclability design will take effect in Year 2.',
    ai: {
      summary: 'UK replaces PRN system with direct modulated packaging disposal fee invoices starting April 2025.',
      whatChanged: [
        'Direct modulated fees replace legacy PRN trading credits',
        'Fee ranges announced: plastic packaging up to £590/tonne',
        'Mandatory reporting of packaging category and destination nation'
      ],
      whyItMatters: 'EcoPack products shipped to UK distributors will incur significant annual fees unless certified for kerbside recyclable stream.',
      affectedProducts: ['EcoPack Ultra-Barrier Food Film (EP-UBF-09)'],
      affectedFacilities: ['Apex BioPlastics & Packaging — Austin (fac-002)'],
      affectedProcesses: ['High-Pressure Bio-Resin Extrusion (proc-005)'],
      affectedSuppliers: ['Stora Enso Circular Packaging (supp-012)'],
      potentialObligations: [
        'Submit UK Report Packaging Data (RPD) bi-annually',
        'Pay DEFRA modulated local authority disposal fees'
      ],
      recommendedActions: [
        'Calculate projected UK EPR liability for FY2025 based on current export tonnage',
        'Optimize packaging design to meet OPRL (On-Pack Recycling Label) high-recyclability tier'
      ],
      effectiveDate: '2025-04-01T00:00:00Z',
      urgency: 'MEDIUM',
      riskLevel: 'MEDIUM',
      confidence: 0.94,
      requiresHumanReview: false,
      sourceReferences: ['UK DEFRA Extended Producer Responsibility for Packaging Guidance, August 2024']
    }
  },
  {
    id: 'chg-015',
    regId: 'reg-023',
    changeType: 'DEFINITION_CHANGE',
    severity: 'HIGH',
    effectiveDate: '2025-01-06T00:00:00Z',
    summary: 'US EPA finalizes strict PIP (3:1) prohibition in adhesives, sealants, and electronic assemblies without transitional exemptions.',
    sectionId: '40 CFR 751.407 — Phenol, isopropylated phosphate (3:1) Prohibition',
    oldText: 'The EPA previously granted temporary enforcement discretions permitting the processing and distribution of PIP (3:1) in articles until October 2024.',
    newText: 'Effective January 6, 2025, the processing and distribution in commerce of PIP (3:1) (CASRN 68937-41-7) and products or articles containing PIP (3:1) is STRICTLY PROHIBITED throughout the United States. All historical enforcement discretions have terminated. Mandatory recordkeeping of complete phase-out and disposal records must be maintained for 5 years.',
    ai: {
      summary: 'EPA ends temporary enforcement discretion: total ban on PIP (3:1) flame retardant in US industrial articles is now in force.',
      whatChanged: [
        'Termination of temporary enforcement discretion',
        'Total prohibition on distribution of articles containing PIP (3:1)',
        'Mandatory 5-year retention of phase-out certification records'
      ],
      whyItMatters: 'CryoSeal Liquid Gasket (prod-006) and electronic potting formulations must be certified 100% free of PIP (3:1) plasticizer.',
      affectedProducts: ['CryoSeal Liquid Gasket (CSL-GAS-88)', 'SynthoFlex Fluoroelastomer (SF-ELAST-22)'],
      affectedFacilities: ['Apex BioPlastics & Packaging — Austin (fac-002)'],
      affectedProcesses: ['Continuous Vulcanization & Post-Cure (proc-011)'],
      affectedSuppliers: ['Shin-Etsu Specialty Silicones (supp-006)'],
      potentialObligations: [
        'Collect formal PIP (3:1) free supplier certifications',
        'Quarantine and properly manifest any historical inventory containing PIP (3:1)'
      ],
      recommendedActions: [
        'Review supplier safety data sheets (SDS) and test reports for CAS 68937-41-7',
        'Issue Certificate of Non-Use to US customer base'
      ],
      effectiveDate: '2025-01-06T00:00:00Z',
      urgency: 'HIGH',
      riskLevel: 'HIGH',
      confidence: 0.97,
      requiresHumanReview: true,
      sourceReferences: ['US EPA Final PBT Rule, 40 CFR Part 751']
    }
  },
  {
    id: 'chg-016',
    regId: 'reg-015',
    changeType: 'SCOPE_CHANGE',
    severity: 'MEDIUM',
    effectiveDate: '2024-12-01T00:00:00Z',
    summary: 'Japan METI designates PFHxS and related salts as Class I Specified Chemical Substances under CSCL.',
    sectionId: 'Cabinet Order No. 343 & CSCL Article 2(2)',
    oldText: 'PFHxS was monitored under Class II reporting guidelines with voluntary annual production notifications.',
    newText: 'Perfluorohexanesulfonic acid (PFHxS), its salts, and PFHxS-related compounds are designated as Class I Specified Chemical Substances. Manufacture, import, and commercial use are prohibited. Importation of 10 specified articles containing PFHxS (water-repellent fabrics, semiconductor etching agents, metal processing aids) is banned.',
    ai: {
      summary: 'Japan enacts total Class I ban on PFHxS chemical compounds and imported articles.',
      whatChanged: [
        'PFHxS elevated to Class I Specified Chemical Substance',
        'Import prohibition on 10 categories of articles containing PFHxS',
        'Strict customs clearance inspection protocols at Japanese ports'
      ],
      whyItMatters: 'Apex Battery Assembly in Osaka (fac-004) utilizes surface cleaning and coating chemicals that must be certified free of PFHxS.',
      affectedProducts: ['PowerCell X9 High-Density Storage Pack (PCX9-BAT-48V)'],
      affectedFacilities: ['Apex Battery Assembly & Testing — Osaka (fac-004)'],
      affectedProcesses: ['Supercritical CO2 Precision Cleansing (proc-010)'],
      affectedSuppliers: ['Tokyo ChemCorp Ltd. (supp-001)'],
      potentialObligations: [
        'Verify cleaning chemical supplies at Osaka plant comply with Cabinet Order 343',
        'Maintain chemical import compliance declarations for Japan Customs'
      ],
      recommendedActions: [
        'Request written confirmation of PFHxS non-use from Tokyo ChemCorp',
        'Test degreasing surfactant residues using gas chromatography'
      ],
      effectiveDate: '2024-12-01T00:00:00Z',
      urgency: 'MEDIUM',
      riskLevel: 'MEDIUM',
      confidence: 0.96,
      requiresHumanReview: false,
      sourceReferences: ['Japan Ministry of Economy, Trade and Industry (METI) Cabinet Order Announcement 2024']
    }
  }
];

// Helper to escape SQL strings
function esc(str) {
  if (str === null || str === undefined) return 'NULL';
  return "'" + String(str).replace(/'/g, "''") + "'";
}

function escJson(obj) {
  if (obj === null || obj === undefined) return "'[]'::jsonb";
  return "'" + JSON.stringify(obj).replace(/'/g, "''") + "'::jsonb";
}

let outSql = '';

// Facilities
outSql += '\n-- Facilities\n';
for (const f of facilities) {
  outSql += `INSERT INTO "Facility" ("id", "organizationId", "name", "country", "location", "latitude", "longitude", "facilityType", "productionCapacity", "emissionsData", "waterUsage", "energyMetrics", "wasteOutput")
VALUES (${esc(f.id)}, ${esc(f.orgId)}, ${esc(f.name)}, ${esc(f.country)}, ${esc(f.location)}, ${f.latitude}, ${f.longitude}, ${esc(f.facilityType)}, ${esc(f.productionCapacity)}, ${esc(f.emissionsData)}::jsonb, ${esc(f.waterUsage)}::jsonb, ${esc(f.energyMetrics)}::jsonb, ${esc(f.wasteOutput)}::jsonb)
ON CONFLICT ("id") DO NOTHING;\n`;
}

// Products
outSql += '\n-- Products\n';
for (const p of products) {
  outSql += `INSERT INTO "Product" ("id", "organizationId", "name", "sku", "category", "markets")
VALUES (${esc(p.id)}, ${esc(p.orgId)}, ${esc(p.name)}, ${esc(p.sku)}, ${esc(p.category)}, ARRAY[${p.markets.map(m => esc(m)).join(',')}])
ON CONFLICT ("id") DO NOTHING;\n`;
}

// Suppliers
outSql += '\n-- Suppliers\n';
for (const s of suppliers) {
  outSql += `INSERT INTO "Supplier" ("id", "organizationId", "name", "country", "certifications", "complianceStatus", "riskScore")
VALUES (${esc(s.id)}, ${esc(s.orgId)}, ${esc(s.name)}, ${esc(s.country)}, ARRAY[${s.certifications.map(c => esc(c)).join(',')}], ${esc(s.complianceStatus)}, ${s.riskScore})
ON CONFLICT ("id") DO NOTHING;\n`;
}

// Processes
outSql += '\n-- Processes\n';
for (const pr of processes) {
  outSql += `INSERT INTO "Process" ("id", "name", "description", "inputs", "chemicals", "emissions", "waste", "energyKw")
VALUES (${esc(pr.id)}, ${esc(pr.name)}, ${esc(pr.description)}, ARRAY[${pr.inputs.map(i => esc(i)).join(',')}], ARRAY[${pr.chemicals.map(c => esc(c)).join(',')}], ARRAY[${pr.emissions.map(e => esc(e)).join(',')}], ARRAY[${pr.waste.map(w => esc(w)).join(',')}], ${pr.energyKw})
ON CONFLICT ("id") DO NOTHING;\n`;
}

// Junctions: Facility Processes
outSql += '\n-- Facility Processes\n';
const facProcMap = [
  ['fac-001', 'proc-001'], ['fac-001', 'proc-002'], ['fac-001', 'proc-008'], ['fac-001', 'proc-009'],
  ['fac-002', 'proc-005'], ['fac-002', 'proc-006'], ['fac-002', 'proc-008'], ['fac-002', 'proc-014'],
  ['fac-003', 'proc-002'], ['fac-003', 'proc-003'], ['fac-003', 'proc-007'], ['fac-003', 'proc-008'], ['fac-003', 'proc-009'],
  ['fac-004', 'proc-004'], ['fac-004', 'proc-006'], ['fac-004', 'proc-010'], ['fac-004', 'proc-012']
];
facProcMap.forEach(([fId, pId], idx) => {
  outSql += `INSERT INTO "FacilityProcess" ("id", "facilityId", "processId") VALUES ('fp-${idx+1}', '${fId}', '${pId}') ON CONFLICT ("facilityId", "processId") DO NOTHING;\n`;
});

// Junctions: Product Facilities
outSql += '\n-- Product Facilities\n';
const prodFacMap = [
  ['prod-001', 'fac-001'], ['prod-004', 'fac-001'], ['prod-005', 'fac-001'],
  ['prod-002', 'fac-002'], ['prod-008', 'fac-002'],
  ['prod-004', 'fac-003'], ['prod-006', 'fac-003'], ['prod-008', 'fac-003'],
  ['prod-003', 'fac-004'], ['prod-007', 'fac-004']
];
prodFacMap.forEach(([pId, fId], idx) => {
  outSql += `INSERT INTO "ProductFacility" ("id", "productId", "facilityId") VALUES ('pf-${idx+1}', '${pId}', '${fId}') ON CONFLICT ("productId", "facilityId") DO NOTHING;\n`;
});

// Product Materials
outSql += '\n-- Product Materials\n';
const materials = [
  { id: 'mat-001', prodId: 'prod-001', name: 'Polytetrafluoroethylene dispersion', cas: '9002-84-0', pct: 65.5, suppId: 'supp-008' },
  { id: 'mat-002', prodId: 'prod-001', name: 'Fluorosurfactant fluorinated wetting aid', cas: '29420-49-3', pct: 2.5, suppId: 'supp-008' },
  { id: 'mat-003', prodId: 'prod-001', name: 'Titanium dioxide pigment', cas: '13463-67-7', pct: 32.0, suppId: 'supp-002' },
  { id: 'mat-004', prodId: 'prod-002', name: 'Polyhydroxyalkanoate (PHA) bio-resin', cas: '26744-04-7', pct: 58.0, suppId: 'supp-003' },
  { id: 'mat-005', prodId: 'prod-002', name: 'Wood-derived microfibrillated cellulose', cas: '9004-34-6', pct: 35.0, suppId: 'supp-012' },
  { id: 'mat-006', prodId: 'prod-002', name: 'Epoxidized soybean oil barrier plasticizer', cas: '8013-07-8', pct: 7.0, suppId: 'supp-003' },
  { id: 'mat-007', prodId: 'prod-003', name: 'Lithium Nickel Manganese Cobalt Oxide (NMC 811)', cas: '346417-97-8', pct: 45.0, suppId: 'supp-009' },
  { id: 'mat-008', prodId: 'prod-003', name: 'Battery-grade synthetic graphite', cas: '7782-42-5', pct: 28.0, suppId: 'supp-004' },
  { id: 'mat-009', prodId: 'prod-003', name: 'Polyvinylidene fluoride (PVDF) binder', cas: '24937-79-9', pct: 4.0, suppId: 'supp-005' },
  { id: 'mat-010', prodId: 'prod-003', name: 'Lithium hexafluorophosphate electrolyte', cas: '21324-40-3', pct: 12.0, suppId: 'supp-010' },
  { id: 'mat-011', prodId: 'prod-003', name: 'Aluminum and copper foil conductors', cas: '7429-90-5', pct: 11.0, suppId: 'supp-001' }
];
materials.forEach(m => {
  outSql += `INSERT INTO "ProductMaterial" ("id", "productId", "materialName", "casNumber", "percentageWeight", "supplierId")
VALUES (${esc(m.id)}, ${esc(m.prodId)}, ${esc(m.name)}, ${esc(m.cas)}, ${m.pct}, ${esc(m.suppId)}) ON CONFLICT ("id") DO NOTHING;\n`;
});

// Regulations
outSql += '\n-- Master Regulations (26 items)\n';
for (const r of regulations) {
  outSql += `INSERT INTO "Regulation" ("id", "title", "shortTitle", "jurisdictionId", "country", "regulatoryBody", "category", "description", "sourceUrl", "publicationDate", "effectiveDate", "status", "currentVersion", "applicability", "industry", "penalties")
VALUES (${esc(r.id)}, ${esc(r.title)}, ${esc(r.shortTitle)}, ${esc(r.jurisdictionId)}, ${esc(r.country)}, ${esc(r.regulatoryBody)}, ${esc(r.category)}::"RegulationCategory", ${esc(r.description)}, ${esc(r.sourceUrl)}, ${esc(r.publicationDate)}::timestamptz, ${esc(r.effectiveDate)}::timestamptz, ${esc(r.status)}::"RegulationStatus", ${r.currentVersion}, ${esc(r.applicability)}, ${esc(r.industry)}, ${esc(r.penalties)})
ON CONFLICT ("id") DO UPDATE SET "title" = EXCLUDED."title", "description" = EXCLUDED."description";\n`;
}

// Regulation Versions for Changes
outSql += '\n-- Regulation Versions\n';
changes.forEach((c, idx) => {
  const reg = regulations.find(r => r.id === c.regId);
  const hashV1 = 'sha256-v1-' + c.regId + '-9a8b7c6d5e';
  const hashV2 = 'sha256-v2-' + c.regId + '-1f2e3d4c5b';
  outSql += `INSERT INTO "RegulationVersion" ("id", "regulationId", "versionNumber", "sourceDocumentHash", "sourceUrl", "rawDocument", "normalizedText", "publicationDate", "effectiveDate")
VALUES ('ver-${c.regId}-1', '${c.regId}', 1, '${hashV1}', '${reg ? reg.sourceUrl : "https://eur-lex.europa.eu"}', ${esc(c.oldText)}, ${esc(c.oldText)}, '2023-01-01T00:00:00Z'::timestamptz, '2023-06-01T00:00:00Z'::timestamptz)
ON CONFLICT ("regulationId", "versionNumber") DO NOTHING;\n`;

  outSql += `INSERT INTO "RegulationVersion" ("id", "regulationId", "versionNumber", "sourceDocumentHash", "sourceUrl", "rawDocument", "normalizedText", "publicationDate", "effectiveDate")
VALUES ('ver-${c.regId}-2', '${c.regId}', 2, '${hashV2}', '${reg ? reg.sourceUrl : "https://eur-lex.europa.eu"}', ${esc(c.newText)}, ${esc(c.newText)}, '2024-06-01T00:00:00Z'::timestamptz, ${esc(c.effectiveDate)}::timestamptz)
ON CONFLICT ("regulationId", "versionNumber") DO NOTHING;\n`;
});

// Regulatory Changes & Diffs
outSql += '\n-- Regulatory Changes & Sections\n';
changes.forEach(c => {
  const diffBlocks = JSON.stringify([
    {
      section: c.sectionId,
      changeType: c.changeType,
      oldText: c.oldText,
      newText: c.newText
    }
  ]);

  outSql += `INSERT INTO "RegulatoryChange" ("id", "regulationId", "previousVersionId", "newVersionId", "changeType", "summary", "changedSections", "severity", "detectedAt", "effectiveDate", "reviewStatus")
VALUES (${esc(c.id)}, ${esc(c.regId)}, 'ver-${c.regId}-1', 'ver-${c.regId}-2', ${esc(c.changeType)}::"ChangeType", ${esc(c.summary)}, ${esc(diffBlocks)}::jsonb, ${esc(c.severity)}::"RiskLevel", NOW(), ${esc(c.effectiveDate)}::timestamptz, 'PENDING')
ON CONFLICT ("id") DO NOTHING;\n`;

  outSql += `INSERT INTO "RegulatoryChangeSection" ("id", "regulatoryChangeId", "sectionIdentifier", "oldText", "newText", "changeType")
VALUES ('sec-${c.id}', ${esc(c.id)}, ${esc(c.sectionId)}, ${esc(c.oldText)}, ${esc(c.newText)}, ${esc(c.changeType)}::"ChangeType")
ON CONFLICT ("id") DO NOTHING;\n`;

  // AI Analysis
  outSql += `INSERT INTO "AIAnalysis" ("id", "regulatoryChangeId", "summary", "whatChanged", "whyItMatters", "affectedProducts", "affectedFacilities", "affectedProcesses", "affectedSuppliers", "potentialObligations", "recommendedActions", "effectiveDate", "urgency", "riskLevel", "confidence", "requiresHumanReview", "sourceReferences", "reviewStatus")
VALUES ('aia-${c.id}', ${esc(c.id)}, ${esc(c.ai.summary)}, ${escJson(c.ai.whatChanged)}, ${esc(c.ai.whyItMatters)}, ${escJson(c.ai.affectedProducts)}, ${escJson(c.ai.affectedFacilities)}, ${escJson(c.ai.affectedProcesses)}, ${escJson(c.ai.affectedSuppliers)}, ${escJson(c.ai.potentialObligations)}, ${escJson(c.ai.recommendedActions)}, ${esc(c.effectiveDate)}::timestamptz, ${esc(c.ai.urgency)}::"RiskLevel", ${esc(c.ai.riskLevel)}::"RiskLevel", ${c.ai.confidence}, ${c.ai.requiresHumanReview}, ${escJson(c.ai.sourceReferences)}, 'PENDING')
ON CONFLICT ("id") DO NOTHING;\n`;
});

// Compliance Actions & Impacts
outSql += '\n-- Compliance Actions & Impacts\n';
const actions = [
  {
    id: 'act-001',
    orgId: 'org-apex-001',
    title: 'Replace PFAS Surfactant in Apex-Fluor 400 Formulation',
    description: 'Re-engineer Apex-Fluor 400 coating formulation to eliminate ammonium perfluoroalkyl surfactant before EU REACH universal restriction takes full effect.',
    regId: 'reg-002',
    facId: 'fac-001',
    prodId: 'prod-001',
    procId: 'proc-001',
    suppId: 'supp-008',
    ownerId: 'usr-apex-003',
    priority: 'CRITICAL',
    status: 'IN_PROGRESS',
    dueDate: '2025-12-15T00:00:00Z',
    evidence: 'Laboratory qualification report (ASTM D3359 cross-hatch adhesion and corrosion resistance) of alternative siloxane formulation.'
  },
  {
    id: 'act-002',
    orgId: 'org-apex-001',
    title: 'Implement Digital Battery Passport API for PowerCell X9',
    description: 'Integrate manufacturing execution telemetry with CIRPASS standard Digital Battery Passport repository to comply with EU Battery Regulation 2023/1542.',
    regId: 'reg-006',
    facId: 'fac-004',
    prodId: 'prod-003',
    procId: 'proc-012',
    suppId: 'supp-009',
    ownerId: 'usr-apex-002',
    priority: 'HIGH',
    status: 'OPEN',
    dueDate: '2025-07-01T00:00:00Z',
    evidence: 'Verified API payload schema validation report and sample laser-etched QR code test certificate from Osaka facility.'
  },
  {
    id: 'act-003',
    orgId: 'org-apex-001',
    title: 'File US EPA TSCA Section 8(a)(7) Retrospective PFAS Import Data',
    description: 'Reconstruct and certify all chemical import records from 2011 to 2022 covering Austin plant fluoropolymer additives via EPA Central Data Exchange.',
    regId: 'reg-007',
    facId: 'fac-002',
    prodId: 'prod-001',
    procId: 'proc-007',
    suppId: 'supp-001',
    ownerId: 'usr-apex-004',
    priority: 'CRITICAL',
    status: 'IN_PROGRESS',
    dueDate: '2025-05-01T00:00:00Z',
    evidence: 'EPA CDX submission confirmation receipt with signed authorized corporate official certification.'
  },
  {
    id: 'act-004',
    orgId: 'org-apex-001',
    title: 'Obtain Recycled Content & PFAS-Free Certification for EcoPack Film',
    description: 'Secure certified mass balance documentation proving 35% post-consumer recycled content and total fluorine <50 mg/kg for European food packaging compliance.',
    regId: 'reg-004',
    facId: 'fac-002',
    prodId: 'prod-002',
    procId: 'proc-005',
    suppId: 'supp-003',
    ownerId: 'usr-apex-003',
    priority: 'HIGH',
    status: 'OPEN',
    dueDate: '2025-10-15T00:00:00Z',
    evidence: 'ISCC PLUS mass balance audit certificate and third-party combustion ion chromatography fluorine test results.'
  },
  {
    id: 'act-005',
    orgId: 'org-apex-001',
    title: 'Register as Authorized CBAM Declarant with Belgian Customs',
    description: 'Complete registration on EU CBAM Registry portal and execute primary supplier emission audits for Antwerp chemical refining imports.',
    regId: 'reg-003',
    facId: 'fac-003',
    prodId: 'prod-004',
    procId: 'proc-003',
    suppId: 'supp-007',
    ownerId: 'usr-apex-005',
    priority: 'HIGH',
    status: 'COMPLETED',
    dueDate: '2025-03-31T00:00:00Z',
    evidence: 'Belgian General Administration of Customs & Excise authorized CBAM declarant approval certificate No. BE-CBAM-2025-8841.'
  },
  {
    id: 'act-006',
    orgId: 'org-apex-001',
    title: 'Deploy Fenceline Passive Sorbent Monitoring at Austin Plant',
    description: 'Install 16 EPA Method 325 fenceline monitoring stations surrounding Austin facility to benchmark benzene and organic VOC levels prior to HON Rule deadline.',
    regId: 'reg-011',
    facId: 'fac-002',
    prodId: 'prod-008',
    procId: 'proc-008',
    suppId: 'supp-011',
    ownerId: 'usr-apex-003',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    dueDate: '2025-11-30T00:00:00Z',
    evidence: 'Contract agreement with environmental laboratory and Q1 baseline air monitoring report.'
  }
];

actions.forEach(a => {
  outSql += `INSERT INTO "ComplianceAction" ("id", "organizationId", "title", "description", "regulationId", "facilityId", "productId", "processId", "supplierId", "ownerId", "priority", "status", "dueDate", "evidenceRequired")
VALUES (${esc(a.id)}, ${esc(a.orgId)}, ${esc(a.title)}, ${esc(a.description)}, ${esc(a.regId)}, ${esc(a.facId)}, ${esc(a.prodId)}, ${esc(a.procId)}, ${esc(a.suppId)}, ${esc(a.ownerId)}, ${esc(a.priority)}::"RiskLevel", ${esc(a.status)}::"ActionStatus", ${esc(a.dueDate)}::timestamptz, ${esc(a.evidence)})
ON CONFLICT ("id") DO NOTHING;\n`;

  // Deadlines
  outSql += `INSERT INTO "Deadline" ("id", "complianceActionId", "title", "dueDate", "category", "isMilestone")
VALUES ('dl-${a.id}', ${esc(a.id)}, ${esc(a.title)}, ${esc(a.dueDate)}::timestamptz, 'CHEMICALS', TRUE)
ON CONFLICT ("id") DO NOTHING;\n`;

  // Alerts
  outSql += `INSERT INTO "Alert" ("id", "organizationId", "title", "message", "severity", "deadlineId")
VALUES ('alt-${a.id}', ${esc(a.orgId)}, ${esc("Compliance Alert: " + a.title)}, ${esc("Approaching deadline: " + a.description.slice(0, 120) + "...")}, ${esc(a.priority)}::"RiskLevel", 'dl-${a.id}')
ON CONFLICT ("id") DO NOTHING;\n`;
});

// Regulation Impacts
outSql += '\n-- Regulation Impacts\n';
changes.forEach((c, idx) => {
  outSql += `INSERT INTO "RegulationImpact" ("id", "regulationId", "regulatoryChangeId", "facilityId", "productId", "processId", "supplierId", "impactLevel", "reason", "regulatoryRequirement", "evidence", "confidence", "recommendedAction")
VALUES ('imp-${idx+1}', ${esc(c.regId)}, ${esc(c.id)}, 'fac-001', 'prod-001', 'proc-001', 'supp-008', ${esc(c.severity)}::"RiskLevel", ${esc(c.ai.whyItMatters)}, ${esc(c.summary)}, ${esc(c.newText.slice(0, 300))}, 0.95, ${esc(c.ai.recommendedActions[0] || 'Implement required testing')})
ON CONFLICT ("id") DO NOTHING;\n`;
});

// Audit Log
outSql += '\n-- Audit Logs\n';
const auditEvents = [
  { action: 'ORGANIZATION_INITIALIZED', type: 'Organization', id: 'org-apex-001', meta: { name: 'Apex Industrial Systems Corp.', createdBy: 'SYSTEM' } },
  { action: 'REGULATION_INGESTED', type: 'Regulation', id: 'reg-002', meta: { title: 'EU REACH PFAS Universal Ban', source: 'EUR-Lex API', version: 4 } },
  { action: 'VERSION_DETECTED', type: 'RegulationVersion', id: 'ver-reg-002-2', meta: { hash: 'sha256-v2-reg-002-1f2e3d4c5b', previousHash: 'sha256-v1-reg-002-9a8b7c6d5e' } },
  { action: 'DETERMINISTIC_DIFF_COMPUTED', type: 'RegulatoryChange', id: 'chg-001', meta: { additions: 3, deletions: 2, thresholdShift: '25 ppb -> 1.0 ppb' } },
  { action: 'AI_SYNTHESIS_EXECUTED', type: 'AIAnalysis', id: 'aia-chg-001', meta: { model: 'gemini-2.5-flash', confidence: 0.98, groundedCitations: 1 } },
  { action: 'IMPACT_MAPPED', type: 'RegulationImpact', id: 'imp-1', meta: { affectedFacilities: ['fac-001'], affectedProducts: ['prod-001'] } },
  { action: 'ACTION_ITEM_DISPATCHED', type: 'ComplianceAction', id: 'act-001', meta: { assignee: 'usr-apex-003', priority: 'CRITICAL', dueDate: '2025-12-15' } },
  { action: 'LEGAL_REVIEW_SUBMITTED', type: 'RegulatoryChange', id: 'chg-001', meta: { reviewer: 'usr-apex-004', status: 'PENDING_FINAL_SIGN' } }
];

auditEvents.forEach((ev, idx) => {
  outSql += `INSERT INTO "AuditLog" ("id", "organizationId", "userId", "action", "entityType", "entityId", "metadata", "ipAddress")
VALUES ('aud-${idx+1}', 'org-apex-001', 'usr-apex-002', ${esc(ev.action)}, ${esc(ev.type)}, ${esc(ev.id)}, ${esc(JSON.stringify(ev.meta))}::jsonb, '192.168.1.10${idx}')
ON CONFLICT ("id") DO NOTHING;\n`;
});

// Write to seed file and append to 001_initial_schema.sql
const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '001_initial_schema.sql');
fs.appendFileSync(migrationPath, outSql);
console.log('Successfully appended Apex seed data to 001_initial_schema.sql!');
