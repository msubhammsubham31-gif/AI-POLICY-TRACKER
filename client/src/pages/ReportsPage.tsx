import React, { useState } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
  Printer,
  Share2,
  FileSpreadsheet,
  AlertCircle,
  Building,
  Shield,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { LegalDisclaimer } from '../components/common/LegalDisclaimer';

interface ReportTemplate {
  id: string;
  title: string;
  category: string;
  description: string;
  jurisdiction: string;
  scope: string;
  lastGenerated: string;
  status: 'Ready' | 'Scheduled' | 'Draft';
  fileFormats: string[];
}

const TEMPLATES: ReportTemplate[] = [
  {
    id: 'csrd-esg',
    title: 'CSRD Double Materiality & Sustainability Disclosure Register',
    category: 'ESG_DISCLOSURE',
    description: 'Comprehensive audit register cross-referencing ESRS environmental standards against Apex Industrial Systems facility footprints and Scope 1-3 emissions.',
    jurisdiction: 'European Union (EU)',
    scope: 'All Global Assets & Facilities',
    lastGenerated: '2026-03-31',
    status: 'Ready',
    fileFormats: ['PDF', 'JSON', 'CSV'],
  },
  {
    id: 'cbam-audit',
    title: 'EU CBAM Embedded Carbon & Importer Exposure Audit',
    category: 'CARBON',
    description: 'Quarterly embedded emissions verification for imported metals, steel, and aluminum components across Stuttgart and Rotterdam supply lines.',
    jurisdiction: 'European Union (EU)',
    scope: 'Rotterdam Distribution & Stuttgart Works',
    lastGenerated: '2026-03-15',
    status: 'Ready',
    fileFormats: ['PDF', 'CSV'],
  },
  {
    id: 'reach-pfas',
    title: 'PFAS Universal Restriction & REACH Annex XVII Compliance Matrix',
    category: 'CHEMICALS',
    description: 'Substance concentration mapping of fluoropolymer seals and PTFE gaskets across product SKUs and tier-1 chemical suppliers.',
    jurisdiction: 'EU / US / Global',
    scope: 'Products: SKUs P-4001 through P-4008',
    lastGenerated: '2026-03-28',
    status: 'Ready',
    fileFormats: ['PDF', 'JSON'],
  },
  {
    id: 'lksg-supply-chain',
    title: 'German Supply Chain Due Diligence Act (LkSG) Risk Assessment',
    category: 'SUPPLY_CHAIN',
    description: 'Annual environmental and human rights risk ranking for 12 primary suppliers in Germany, Taiwan, and the United States.',
    jurisdiction: 'Germany (DE)',
    scope: 'Supply Chain Tier-1 & Tier-2',
    lastGenerated: '2026-02-15',
    status: 'Ready',
    fileFormats: ['PDF', 'CSV'],
  },
  {
    id: 'drift-horizon',
    title: 'Regulatory Drift & Enforcement Horizon Intelligence Report',
    category: 'CLIMATE',
    description: 'Synthetic summary of 26 monitored regulatory bodies, recent legislative text diffs, and upcoming compliance deadlines for Q2-Q4 2026.',
    jurisdiction: 'Global Jurisdictions',
    scope: 'Enterprise Compliance Architecture',
    lastGenerated: '2026-04-01',
    status: 'Ready',
    fileFormats: ['PDF', 'JSON', 'CSV'],
  },
];

export const ReportsPage: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState<ReportTemplate>(TEMPLATES[0]);
  const [generating, setGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const handleDownload = (format: string) => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setDownloadSuccess(`Downloaded ${selectedReport.title}.${format.toLowerCase()}`);
      
      // Simulate file download
      const element = document.createElement('a');
      const content = JSON.stringify({
        reportTitle: selectedReport.title,
        generatedAt: new Date().toISOString(),
        organization: 'Apex Industrial Systems Corp.',
        jurisdiction: selectedReport.jurisdiction,
        scope: selectedReport.scope,
        metadata: {
          system: 'RegulaMap AI Compliance Intelligence',
          complianceStatus: 'VERIFIED',
          disclaimer: 'AI-generated regulatory analysis is not legal advice.',
        },
      }, null, 2);
      
      const file = new Blob([content], { type: format === 'JSON' ? 'application/json' : 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = `${selectedReport.id}-compliance-report.${format.toLowerCase()}`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);

      setTimeout(() => setDownloadSuccess(null), 3500);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            Compliance & Audit Reports
          </h1>
          <p className="text-sm text-muted-foreground">
            Generate formal regulatory dossiers, ESG verification reports, and supply chain audit packages.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleDownload('PDF')}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            {generating ? 'Compiling Dossier...' : 'Export Active Dossier'}
          </button>
        </div>
      </div>

      <LegalDisclaimer />

      {downloadSuccess && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          {downloadSuccess}
        </div>
      )}

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template List */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Available Compliance Dossiers
          </h2>
          <div className="space-y-2">
            {TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.id}
                onClick={() => setSelectedReport(tmpl)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                  selectedReport.id === tmpl.id
                    ? 'bg-primary/10 border-primary text-white shadow-md'
                    : 'bg-surface border-border text-slate-300 hover:bg-surface/80 hover:border-border/80'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                    {tmpl.category}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {tmpl.jurisdiction}
                  </span>
                </div>
                <h3 className="font-semibold text-sm text-white line-clamp-1">{tmpl.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                  {tmpl.description}
                </p>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-2 pt-2 border-t border-border/40">
                  <span>Scope: {tmpl.scope}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Dossier Preview */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-surface border border-border rounded-xl p-6 shadow-sm space-y-6">
            <div className="border-b border-border/60 pb-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">
                  {selectedReport.category}
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Last Updated: {selectedReport.lastGenerated}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mt-3">
                {selectedReport.title}
              </h2>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                {selectedReport.description}
              </p>
            </div>

            {/* Scope & Jurisdiction Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-surface/60 border border-border/70 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-1">
                  <Shield className="w-4 h-4 text-primary" />
                  Jurisdictional Authority
                </div>
                <div className="text-sm font-medium text-white">{selectedReport.jurisdiction}</div>
              </div>
              <div className="bg-surface/60 border border-border/70 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-1">
                  <Building className="w-4 h-4 text-emerald-400" />
                  Entity Asset Scope
                </div>
                <div className="text-sm font-medium text-white">{selectedReport.scope}</div>
              </div>
            </div>

            {/* Dossier Structure Breakdown */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Dossier Sections Included in Export
              </h3>
              <div className="space-y-2">
                {[
                  '1. Executive Summary & Legal Exposure Assessment',
                  '2. Materiality Determination & Facility Cross-Mapping',
                  '3. Delta Drift Analysis (Side-by-side legal clause shifts)',
                  '4. Chemical & Emissions Threshold Inventory',
                  '5. Assigned Compliance Actions & Verification Status',
                  '6. Authoritative Source Citations & Non-Legal Advice Advisory',
                ].map((sec, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-surface/40 border border-border/50 text-sm text-slate-300"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>{sec}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Export Format Selectors */}
            <div className="pt-4 border-t border-border/60 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs text-muted-foreground block">Supported Formats:</span>
                <span className="text-sm font-semibold text-white">PDF Formal Dossier, Raw JSON Package, CSV Register</span>
              </div>
              <div className="flex items-center gap-2">
                {selectedReport.fileFormats.map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => handleDownload(fmt)}
                    disabled={generating}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-surface hover:bg-slate-800 border border-border text-xs font-semibold text-white rounded-lg transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download {fmt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
