import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Calendar, CheckSquare, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import { ComplianceAction } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { RiskBadge } from '../components/common/RiskBadge';

export const DeadlinesPage: React.FC = () => {
  const navigate = useNavigate();
  const [actions, setActions] = useState<ComplianceAction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.actions.getAll()
      .then(res => setActions(res.actions || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const sortedActions = [...actions].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Regulatory Calendar & Deadlines</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {actions.length} Statutory Milestones
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Enforcement calendar tracking critical chemical phase-outs, digital passport deployments, and statutory filings.
          </p>
        </div>
      </div>

      {/* Deadlines Schedule Cards */}
      <div className="space-y-4">
        {sortedActions.map(action => {
          const dueDate = new Date(action.dueDate);
          const now = new Date();
          const diffDays = Math.round((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          const isUrgent = diffDays <= 60;

          return (
            <div
              key={action.id}
              onClick={() => navigate(`/app/actions/${action.id}`)}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 glass-panel glass-card-hover cursor-pointer space-y-3 group"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border flex items-center gap-1.5 ${
                    isUrgent
                      ? 'bg-rose-500/15 text-rose-400 border-rose-500/30 animate-pulse'
                      : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  }`}>
                    <Clock className="w-3.5 h-3.5" />
                    <span>{diffDays > 0 ? `${diffDays} Days Remaining` : 'Deadline Passed'}</span>
                  </span>
                  <StatusBadge status={action.status} size="sm" />
                  <RiskBadge level={action.priority} size="sm" />
                </div>

                <div className="text-xs font-mono text-white font-bold flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  <span>{dueDate.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              </div>

              <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                {action.title}
              </h3>

              <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                {action.description}
              </p>

              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-300 font-mono flex items-center justify-between">
                <span>Deliverable Evidence: {action.evidenceRequired}</span>
                <span className="text-emerald-400 flex items-center gap-1 font-semibold group-hover:translate-x-0.5 transition-transform">
                  <span>Action details</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
