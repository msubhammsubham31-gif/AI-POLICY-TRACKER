import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, GitCompare, Sparkles, ShieldCheck, CheckCircle2, XCircle, AlertCircle, Building2, Package, Cpu, Truck } from 'lucide-react';
import { api } from '../services/api';
import { RegulatoryChange, ReviewStatus, RiskLevel } from '../types';
import { RegulatoryDiff } from '../components/common/RegulatoryDiff';
import { RiskBadge } from '../components/common/RiskBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { LegalDisclaimer } from '../components/common/LegalDisclaimer';

export const ChangeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [change, setChange] = useState<RegulatoryChange | null>(null);
  const [loading, setLoading] = useState(true);

  // Human Review Form State
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>('APPROVED');
  const [reviewNotes, setReviewNotes] = useState('');
  const [adjustedSeverity, setAdjustedSeverity] = useState<RiskLevel>('CRITICAL');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.changes.getById(id)
      .then(res => {
        setChange(res);
        setReviewStatus(res.reviewStatus || 'APPROVED');
        setAdjustedSeverity(res.severity || 'CRITICAL');
        setReviewNotes(res.reviewNotes || '');
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSubmittingReview(true);
    try {
      const updated = await api.changes.review(id, {
        reviewStatus,
        reviewNotes,
        adjustedRiskLevel: adjustedSeverity,
      });
      setChange(updated);
      setReviewSuccess(true);
      setTimeout(() => setReviewSuccess(false), 3000);
    } catch (err: any) {
      console.error('Review submission error:', err);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading || !change) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-400 font-mono text-xs">
        Loading regulatory drift analysis...
      </div>
    );
  }

  const ai = change.aiAnalysis;

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <button
          onClick={() => navigate('/app/changes')}
          className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Drift Feed</span>
        </button>

        <div className="flex items-center gap-2">
          <RiskBadge level={change.severity} />
          <StatusBadge status={change.reviewStatus} />
        </div>
      </div>

      {/* Header Summary */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 glass-panel space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono text-purple-300">
          <span className="font-semibold">{change.changeType}</span>
          <span>•</span>
          <span>Effective: {new Date(change.effectiveDate).toLocaleDateString()}</span>
          <span>•</span>
          <span className="text-slate-400">{change.sectionIdentifier}</span>
        </div>

        <h1 className="text-2xl font-bold text-white tracking-tight leading-snug">
          {change.summary}
        </h1>

        <div className="pt-2">
          <LegalDisclaimer />
        </div>
      </div>

      {/* Side-by-Side Dual-Pane Text Diff Renderer */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
          <GitCompare className="w-4 h-4 text-emerald-400" />
          <span>Authoritative Version Diff</span>
        </h3>
        <RegulatoryDiff
          oldText={change.oldText || ''}
          newText={change.newText || ''}
          diff={change.computedDiff}
          sectionIdentifier={change.sectionIdentifier}
          changeType={change.changeType}
        />
      </div>

      {/* Grounded AI Analysis Breakdown */}
      {ai && (
        <div className="rounded-2xl border border-emerald-500/30 bg-slate-900/80 p-6 glass-panel space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2 text-emerald-400 font-mono text-sm font-bold">
              <Sparkles className="w-4 h-4" />
              <span>Grounded Gemini-2.5-Flash Operational Synthesis</span>
            </div>
            <div className="text-xs font-mono px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Confidence: {Math.round(ai.confidence * 100)}%
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-mono uppercase text-slate-400 font-semibold">Operational Risk Impact:</h4>
            <p className="text-sm text-slate-200 leading-relaxed font-sans bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              {ai.whyItMatters}
            </p>
          </div>

          {/* Asset Exposure Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-400">
                <Building2 className="w-4 h-4" />
                <span>Affected Facilities</span>
              </div>
              <ul className="text-xs text-slate-300 space-y-1">
                {ai.affectedFacilities.map((f, i) => (
                  <li key={i} className="truncate">• {f}</li>
                ))}
              </ul>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400">
                <Package className="w-4 h-4" />
                <span>Affected Products</span>
              </div>
              <ul className="text-xs text-slate-300 space-y-1">
                {ai.affectedProducts.map((p, i) => (
                  <li key={i} className="truncate">• {p}</li>
                ))}
              </ul>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-mono text-amber-400">
                <Cpu className="w-4 h-4" />
                <span>Industrial Processes</span>
              </div>
              <ul className="text-xs text-slate-300 space-y-1">
                {ai.affectedProcesses.map((pr, i) => (
                  <li key={i} className="truncate">• {pr}</li>
                ))}
              </ul>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-mono text-purple-400">
                <Truck className="w-4 h-4" />
                <span>Supply Chain</span>
              </div>
              <ul className="text-xs text-slate-300 space-y-1">
                {ai.affectedSuppliers.map((s, i) => (
                  <li key={i} className="truncate">• {s}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Obligations & Recommended Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-2">
              <h5 className="font-mono text-rose-400 font-semibold uppercase">Potential Material Obligations:</h5>
              <ul className="space-y-1.5 text-slate-300">
                {ai.potentialObligations.map((ob, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-rose-400 mt-0.5">•</span>
                    <span>{ob}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-2">
              <h5 className="font-mono text-emerald-400 font-semibold uppercase">Recommended Operational Actions:</h5>
              <ul className="space-y-1.5 text-slate-300">
                {ai.recommendedActions.map((act, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">•</span>
                    <span>{act}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Human-in-the-Loop Review & Sign-Off Panel */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 glass-panel space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
              Human-in-the-Loop Compliance Review & Attestation
            </h3>
          </div>
          {reviewSuccess && (
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Review Recorded in Immutable Audit Trail</span>
            </span>
          )}
        </div>

        <form onSubmit={handleSubmitReview} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                Review Decision
              </label>
              <select
                value={reviewStatus}
                onChange={(e) => setReviewStatus(e.target.value as ReviewStatus)}
                className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              >
                <option value="APPROVED">APPROVED (Acknowledge & Confirm Impact)</option>
                <option value="MODIFIED">MODIFIED (Adjusted Severity or Scope)</option>
                <option value="REJECTED">REJECTED (Not Applicable to Apex Assets)</option>
                <option value="PENDING">PENDING (Awaiting Legal Counsel)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                Assigned Operational Severity
              </label>
              <select
                value={adjustedSeverity}
                onChange={(e) => setAdjustedSeverity(e.target.value as RiskLevel)}
                className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              >
                <option value="CRITICAL">CRITICAL</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
                <option value="INFORMATIONAL">INFORMATIONAL</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
              Review Notes & Legal Rationale
            </label>
            <textarea
              rows={3}
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Provide legal commentary or specific engineering instructions for affected plant managers..."
              className="w-full p-3 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-sans"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-500 font-mono">
              Action will be stamped by authenticated reviewer session (Elena Rostova / ADMIN).
            </span>
            <button
              type="submit"
              disabled={submittingReview}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submittingReview ? 'Recording...' : 'Submit Verification'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
