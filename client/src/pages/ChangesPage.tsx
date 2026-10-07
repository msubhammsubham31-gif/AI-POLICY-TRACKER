import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GitCompare, Filter, Search, ArrowRight, ShieldAlert, Sparkles, CheckCircle2, Clock } from 'lucide-react';
import { api } from '../services/api';
import { RegulatoryChange, RiskLevel } from '../types';
import { RiskBadge } from '../components/common/RiskBadge';
import { StatusBadge } from '../components/common/StatusBadge';

export const ChangesPage: React.FC = () => {
  const navigate = useNavigate();
  const [changes, setChanges] = useState<RegulatoryChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.changes.getAll()
      .then(res => setChanges(res.changes || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = changes.filter(c => {
    const matchesSeverity = severityFilter === 'ALL' || c.severity === severityFilter;
    const matchesStatus = statusFilter === 'ALL' || c.reviewStatus === statusFilter;
    const matchesSearch = c.summary.toLowerCase().includes(search.toLowerCase());
    return matchesSeverity && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Regulatory Changes & Drift Feed</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30">
              {changes.length} Drift Events
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Continuous detection feed monitoring threshold shifts, obligation expansions, and legal amendments across world jurisdictions.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800 glass-panel">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search changes by summary, chemical, or section..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-800 bg-slate-950 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 font-mono"
          >
            <option value="ALL">Severity: ALL</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-800 bg-slate-950 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 font-mono"
          >
            <option value="ALL">Review: ALL</option>
            <option value="PENDING">PENDING REVIEW</option>
            <option value="APPROVED">APPROVED</option>
            <option value="MODIFIED">MODIFIED</option>
          </select>
        </div>
      </div>

      {/* Changes Feed List */}
      <div className="space-y-4">
        {filtered.map(change => (
          <div
            key={change.id}
            onClick={() => navigate(`/app/changes/${change.id}`)}
            className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 glass-panel glass-card-hover cursor-pointer space-y-3 group"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <RiskBadge level={change.severity} size="sm" />
                <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-purple-500/15 text-purple-300 border border-purple-500/30 uppercase font-semibold">
                  {change.changeType}
                </span>
                <StatusBadge status={change.reviewStatus} size="sm" />
              </div>

              <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                <span>Effective: {new Date(change.effectiveDate).toLocaleDateString()}</span>
                <span>•</span>
                <span className="text-slate-500">Detected: {new Date(change.detectedAt).toLocaleDateString()}</span>
              </div>
            </div>

            <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors leading-snug">
              {change.summary}
            </h3>

            {change.aiAnalysis && (
              <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 text-xs text-slate-300 space-y-1.5 font-sans">
                <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px] font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Grounded Operational Impact Synthesis:</span>
                </div>
                <p className="line-clamp-2 text-slate-300 leading-relaxed">
                  {change.aiAnalysis.whyItMatters}
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-mono text-slate-400">
                  <span>Exposed Assets:</span>
                  {change.aiAnalysis.affectedFacilities.map((f, i) => (
                    <span key={i} className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                      {f}
                    </span>
                  ))}
                  {change.aiAnalysis.affectedProducts.slice(0, 2).map((p, i) => (
                    <span key={i} className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60">
              <span className="font-mono text-[11px] text-slate-500">
                Clause: {change.sectionIdentifier || 'Article Amendment'}
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium group-hover:translate-x-0.5 transition-transform">
                <span>Inspect Side-by-Side Diff & Review</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && !loading && (
        <div className="text-center py-16 text-slate-500 text-sm">
          No regulatory changes matched your filter criteria.
        </div>
      )}
    </div>
  );
};
