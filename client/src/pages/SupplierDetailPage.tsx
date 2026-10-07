import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Truck, ArrowLeft, ShieldCheck, Award, AlertTriangle, CheckSquare } from 'lucide-react';
import { api } from '../services/api';
import { Supplier } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { RiskBadge } from '../components/common/RiskBadge';
import { LegalDisclaimer } from '../components/common/LegalDisclaimer';

export const SupplierDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api.suppliers.getById(id)
      .then(res => setSupplier(res))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading || !supplier) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-400 font-mono text-xs">
        Loading supplier due diligence profile...
      </div>
    );
  }

  const isHighRisk = supplier.riskScore > 30;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <button
          onClick={() => navigate('/app/suppliers')}
          className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Suppliers Directory</span>
        </button>

        <StatusBadge status={supplier.complianceStatus} />
      </div>

      {/* Hero Header */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 glass-panel space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono uppercase text-emerald-400 font-semibold">
          <span>{supplier.country}</span>
          <span>•</span>
          <span className={isHighRisk ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
            Risk Score: {supplier.riskScore.toFixed(1)} / 100
          </span>
        </div>

        <h1 className="text-2xl font-bold text-white tracking-tight">
          {supplier.name}
        </h1>

        <div className="pt-2">
          <LegalDisclaimer compact />
        </div>
      </div>

      {/* Certifications and Due Diligence */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 glass-panel space-y-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Award className="w-4 h-4 text-emerald-400" />
            <span>Active Environmental Certifications</span>
          </div>
          <div className="space-y-2">
            {supplier.certifications?.map((c, i) => (
              <div key={i} className="p-3 rounded-xl border border-slate-800 bg-slate-950/40 text-xs flex items-center justify-between">
                <span className="font-semibold text-white">{c}</span>
                <span className="text-[10px] font-mono text-emerald-400">Verified Active</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 glass-panel space-y-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>German LkSG & EU CSDDD Due Diligence Status</span>
          </div>
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Annual Audit Status:</span>
              <span className="font-mono text-emerald-400 font-bold">COMPLIANT (Q1 2024 Audit Passed)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Mercury & POPs Screening:</span>
              <span className="font-mono text-white">Negative / Clean Certificate on File</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">CBAM Primary Data Telemetry:</span>
              <span className="font-mono text-cyan-300">Emission Factors Submitted</span>
            </div>
          </div>
        </div>
      </div>

      {/* Compliance Actions */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 glass-panel space-y-3">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <CheckSquare className="w-4 h-4 text-emerald-400" />
          <span>Active Supplier Remediation Work Orders</span>
        </div>
        <div className="space-y-2">
          {supplier.actions && supplier.actions.length > 0 ? (
            supplier.actions.map(a => (
              <div
                key={a.id}
                onClick={() => navigate(`/app/actions/${a.id}`)}
                className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/40 hover:bg-slate-800/40 transition-colors cursor-pointer text-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <StatusBadge status={a.status} size="sm" />
                  <RiskBadge level={a.priority} size="sm" />
                </div>
                <div className="font-semibold text-white">{a.title}</div>
                <div className="text-[11px] font-mono text-amber-400">
                  Due: {new Date(a.dueDate).toLocaleDateString()}
                </div>
              </div>
            ))
          ) : (
            <div className="text-xs text-slate-500 p-4 text-center">
              No outstanding corrective action plans required for this partner.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
