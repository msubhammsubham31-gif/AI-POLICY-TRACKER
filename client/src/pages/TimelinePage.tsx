import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, GitCompare, CheckSquare, ArrowRight, ShieldAlert } from 'lucide-react';
import { api } from '../services/api';
import { RiskBadge } from '../components/common/RiskBadge';

export const TimelinePage: React.FC = () => {
  const navigate = useNavigate();
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.timeline.getTimeline()
      .then(res => setTimeline(res.timeline || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Master Regulatory & Compliance Timeline</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Chronological Roadmap
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Integrated milestone calendar aligning external legal enforcement dates with internal engineering deliverables.
          </p>
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="relative border-l border-slate-800 ml-4 sm:ml-6 space-y-8 pb-12">
        {timeline.map((item, idx) => {
          const isDrift = item.type === 'REGULATORY_CHANGE';
          const effDate = new Date(item.date);
          const isPast = effDate < new Date();

          return (
            <div key={idx} className="relative pl-6 sm:pl-8 group">
              {/* Timeline Marker Dot */}
              <div
                className={`absolute -left-3 top-1.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-transform group-hover:scale-125 ${
                  isDrift
                    ? 'border-rose-500 bg-rose-950/80 text-rose-300'
                    : 'border-emerald-500 bg-emerald-950/80 text-emerald-300'
                }`}
              >
                {isDrift ? <GitCompare className="w-3 h-3" /> : <CheckSquare className="w-3 h-3" />}
              </div>

              {/* Event Card */}
              <div
                onClick={() => {
                  if (isDrift) navigate(`/app/changes/${item.id}`);
                  else navigate(`/app/actions/${item.id}`);
                }}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 glass-panel glass-card-hover cursor-pointer space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-800 text-slate-300">
                      {isDrift ? 'Enacted Regulatory Drift' : 'Internal Compliance Work Order'}
                    </span>
                    <RiskBadge level={item.severity} size="sm" />
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{effDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                  {item.title}
                </h3>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60">
                  <span className="font-mono text-[11px] text-slate-500">
                    {isPast ? 'Mandatory Law in Force' : 'Approaching Effective Deadline'}
                  </span>
                  <span className="flex items-center gap-1 text-emerald-400 font-medium">
                    <span>Inspect event</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
