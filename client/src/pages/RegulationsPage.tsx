import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Search, Filter, Plus, ArrowRight, ShieldCheck, ExternalLink, Calendar } from 'lucide-react';
import { api } from '../services/api';
import { Regulation, RegulationCategory, RegulationStatus } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';

export const RegulationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [regulations, setRegulations] = useState<Regulation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  useEffect(() => {
    api.regulations.getAll()
      .then(res => setRegulations(res.regulations || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const categories = [
    'ALL', 'EMISSIONS', 'CARBON', 'CLIMATE', 'CHEMICALS', 'WASTE', 'PACKAGING',
    'WATER', 'ENERGY', 'AIR_QUALITY', 'HAZARDOUS_MATERIALS', 'PRODUCT_STEWARDSHIP',
    'RECYCLING', 'DEFORESTATION', 'ESG_DISCLOSURE', 'SUPPLY_CHAIN', 'SUSTAINABILITY'
  ];

  const filtered = regulations.filter(r => {
    const matchesSearch =
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.shortTitle.toLowerCase().includes(search.toLowerCase()) ||
      r.country.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || r.category === categoryFilter;
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Master Regulatory Directory</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {regulations.length} Tracked Laws
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Global environmental, chemicals, carbon disclosure, and supply chain regulatory catalog under continuous version monitoring.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800 glass-panel">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search regulations by title, keyword, country, or obligation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-800 bg-slate-950 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 font-mono"
          >
            {categories.map((c, idx) => (
              <option key={idx} value={c}>
                Category: {c.replace(/_/g, ' ')}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-800 bg-slate-950 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 font-mono"
          >
            <option value="ALL">Status: ALL</option>
            <option value="ENACTED">ENACTED</option>
            <option value="UNDER_REVIEW">UNDER REVIEW</option>
            <option value="AMENDED">AMENDED</option>
            <option value="PROPOSED">PROPOSED</option>
          </select>
        </div>
      </div>

      {/* Regulations Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map(r => (
          <div
            key={r.id}
            onClick={() => navigate(`/app/regulations/${r.id}`)}
            className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 glass-panel glass-card-hover cursor-pointer flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold uppercase">
                  {r.category.replace(/_/g, ' ')}
                </span>
                <StatusBadge status={r.status} size="sm" />
              </div>

              <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-2">
                {r.title}
              </h3>

              <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                {r.description}
              </p>
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>{r.regulatoryBody}</span>
                <span className="text-slate-300 font-semibold">{r.country}</span>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-[11px] font-mono text-emerald-400">
                  Version {r.currentVersion} • In Force
                </span>
                <span className="flex items-center gap-1 text-slate-400 group-hover:text-white font-medium text-xs">
                  <span>View Details</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && !loading && (
        <div className="text-center py-16 text-slate-500 text-sm">
          No regulations matched your filter criteria.
        </div>
      )}
    </div>
  );
};
