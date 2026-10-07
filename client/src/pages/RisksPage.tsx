import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowRight, Gauge, AlertTriangle, CheckCircle, Info, Calculator } from 'lucide-react';
import { api } from '../services/api';
import { RiskBadge } from '../components/common/RiskBadge';
import { LegalDisclaimer } from '../components/common/LegalDisclaimer';

export const RisksPage: React.FC = () => {
  const navigate = useNavigate();
  const [impacts, setImpacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Interactive Risk Simulator State
  const [calcSeverity, setCalcSeverity] = useState('CRITICAL');
  const [calcDays, setCalcDays] = useState(45);
  const [calcAssets, setCalcAssets] = useState(4);
  const [calcMandatory, setCalcMandatory] = useState(true);
  const [simulationResult, setSimulationResult] = useState<any>(null);

  useEffect(() => {
    api.impacts.getAll()
      .then(res => setImpacts(res.impactMatrix || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));

    runSimulation();
  }, []);

  const runSimulation = () => {
    const futureDate = new Date(Date.now() + calcDays * 24 * 60 * 60 * 1000).toISOString();
    api.impacts.assess({
      effectiveDate: futureDate,
      severity: calcSeverity,
      affectedAssets: { facilities: calcAssets, products: calcAssets, suppliers: calcAssets, processes: calcAssets },
      isMandatory: calcMandatory,
    }).then(res => setSimulationResult(res))
      .catch(err => console.error(err));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Enterprise Compliance Risk Matrix</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30">
              Explainable Multi-Factor Engine
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Deterministic risk scoring evaluating Scope, Severity, Proximity, Dependency, Obligation, Exposure, and Compliance readiness.
          </p>
        </div>
      </div>

      <LegalDisclaimer />

      {/* Interactive Risk Simulator Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 glass-panel space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Calculator className="w-4 h-4 text-emerald-400" />
            <span>Interactive Regulatory Risk & Exposure Simulator</span>
          </div>
          <span className="text-xs font-mono text-slate-400">Real-time Multi-Factor Calculation</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
          <div>
            <label className="block text-slate-400 mb-1 uppercase">Regulatory Severity</label>
            <select
              value={calcSeverity}
              onChange={(e) => { setCalcSeverity(e.target.value); }}
              className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-950 text-white"
            >
              <option value="CRITICAL">CRITICAL (Total Market Ban)</option>
              <option value="HIGH">HIGH (Mandatory Threshold Shift)</option>
              <option value="MEDIUM">MEDIUM (Reporting Standard)</option>
              <option value="LOW">LOW (Informational Revision)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 uppercase">Enforcement Window (Days)</label>
            <input
              type="number"
              value={calcDays}
              onChange={(e) => { setCalcDays(parseInt(e.target.value) || 30); }}
              className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-950 text-white"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 uppercase">Affected Assets Count</label>
            <input
              type="number"
              value={calcAssets}
              onChange={(e) => { setCalcAssets(parseInt(e.target.value) || 1); }}
              className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-950 text-white"
            />
          </div>

          <div className="flex flex-col justify-end">
            <button
              type="button"
              onClick={runSimulation}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-all text-xs"
            >
              Recalculate Risk Score
            </button>
          </div>
        </div>

        {simulationResult && (
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <RiskBadge level={simulationResult.riskLevel} size="lg" />
                <span className="text-xl font-bold font-mono text-white">
                  Score: {simulationResult.compositeScore} / 100
                </span>
              </div>
              <span className="text-xs font-mono text-amber-400">
                Action Mandate Window: {simulationResult.recommendedResponseWindowDays} Days
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono pt-2">
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Severity Score</span>
                <span className="text-white font-bold">{simulationResult.factors.severity}/10</span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Proximity Score</span>
                <span className="text-white font-bold">{simulationResult.factors.proximity}/10</span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Exposure Score</span>
                <span className="text-white font-bold">{simulationResult.factors.exposure}/10</span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Obligation Score</span>
                <span className="text-white font-bold">{simulationResult.factors.obligation}/10</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-sans pt-1">
              <strong className="text-emerald-400">Explainable Rationale: </strong>
              {simulationResult.explanation.severityRationale} {simulationResult.explanation.proximityRationale} {simulationResult.explanation.obligationRationale}
            </p>
          </div>
        )}
      </div>

      {/* Evaluated Drift Events Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 glass-panel space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
            Active Regulatory Drift Risk Matrix ({impacts.length} Events)
          </h3>
        </div>

        <div className="space-y-3">
          {impacts.map((item, idx) => (
            <div
              key={idx}
              onClick={() => navigate(`/app/changes/${item.changeId}`)}
              className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 hover:bg-slate-800/40 transition-colors cursor-pointer space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RiskBadge level={item.evaluation.riskLevel} size="sm" />
                  <span className="text-xs font-mono text-white font-bold">
                    Composite Score: {item.evaluation.compositeScore}/100
                  </span>
                </div>
                <span className="text-xs font-mono text-emerald-400">
                  Response Window: {item.evaluation.recommendedResponseWindowDays}d
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed group-hover:text-emerald-300 transition-colors">
                {item.evaluation.explanation.severityRationale} {item.evaluation.explanation.exposureRationale}
              </p>

              <div className="text-[11px] font-mono text-slate-500 pt-1 flex items-center justify-between">
                <span>{item.evaluation.explanation.scopeRationale}</span>
                <span className="text-emerald-400 flex items-center gap-1 font-medium">
                  <span>Inspect Risk Factors</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
