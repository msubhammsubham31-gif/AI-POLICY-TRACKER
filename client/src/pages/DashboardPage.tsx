import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  BookOpen,
  GitCompare,
  CheckSquare,
  Building2,
  TrendingUp,
  ArrowRight,
  AlertTriangle,
  Globe2,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { api } from '../services/api';
import { DashboardMetrics } from '../types';
import { MetricCard } from '../components/common/MetricCard';
import { RiskBadge } from '../components/common/RiskBadge';
import { StatusBadge } from '../components/common/StatusBadge';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.dashboard.getMetrics()
      .then(data => setMetrics(data))
      .catch(err => console.error('Failed to load dashboard metrics:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-emerald-400 font-mono text-sm">
          <Sparkles className="w-5 h-5 animate-spin" />
          <span>Synchronizing Enterprise Compliance Graph...</span>
        </div>
      </div>
    );
  }

  const riskChartData = [
    { name: 'Critical', value: metrics.riskDistribution.critical, color: '#ef4444' },
    { name: 'High', value: metrics.riskDistribution.high, color: '#f97316' },
    { name: 'Medium', value: metrics.riskDistribution.medium, color: '#eab308' },
    { name: 'Low', value: metrics.riskDistribution.low, color: '#3b82f6' },
  ];

  const domainActivityData = [
    { name: 'Chemicals', events: 5 },
    { name: 'Carbon', events: 3 },
    { name: 'Packaging', events: 3 },
    { name: 'Emissions', events: 2 },
    { name: 'Batteries', events: 2 },
    { name: 'Due Diligence', events: 1 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Executive Compliance Dashboard</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Live Posture: 84.5%
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time environmental, chemical, and product-stewardship regulatory drift tracking for {metrics.organizationName}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/app/map')}
            className="px-3.5 py-2 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-200 transition-colors flex items-center gap-2"
          >
            <Globe2 className="w-4 h-4 text-emerald-400" />
            <span>Open Global Map</span>
          </button>
          <button
            onClick={() => navigate('/app/assistant')}
            className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Ask Compliance AI</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Tracked Regulations"
          value={metrics.totalRegulationsTracked}
          subtitle="Across 8 Global Jurisdictions"
          change="+3 this month"
          isPositive={true}
          icon={BookOpen}
          variant="emerald"
        />
        <MetricCard
          title="Regulatory Drift Events"
          value={metrics.totalDriftEvents}
          subtitle="Version delta revisions"
          change="16 verified diffs"
          isPositive={false}
          icon={GitCompare}
          variant="rose"
        />
        <MetricCard
          title="Monitored Facilities"
          value={metrics.assetsCovered.facilities}
          subtitle="DE, US, BE, JP Operating Sites"
          change="100% telemetry online"
          isPositive={true}
          icon={Building2}
          variant="blue"
        />
        <MetricCard
          title="Open Compliance Actions"
          value={`${metrics.complianceActions.open} / ${metrics.complianceActions.total}`}
          subtitle="Work items assigned"
          change="2 Critical due soon"
          isPositive={false}
          icon={CheckSquare}
          variant="amber"
        />
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Level Distribution */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 glass-panel flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Regulatory Risk Distribution
              </h3>
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            </div>
            <p className="text-xs text-slate-400 mt-1">Multi-factor severity and proximity evaluation</p>
          </div>

          <div className="h-52 w-full my-3">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {riskChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            {riskChartData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-950/50 border border-slate-800">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name}
                </span>
                <span className="font-bold text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Domain Activity Breakdown */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 glass-panel flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Recent Regulatory Changes by Domain
              </h3>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-xs text-slate-400 mt-1">Active amendments affecting materials and industrial operations</p>
          </div>

          <div className="h-56 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={domainActivityData} margin={{ top: 20, right: 20, left: -20, bottom: 5 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="events" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-3">
            <span>Primary Focus: REACH PFAS Universal Ban & Battery Passport 2025</span>
            <button
              onClick={() => navigate('/app/changes')}
              className="text-emerald-400 hover:underline flex items-center gap-1 font-medium"
            >
              <span>View all 16 drift events</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Two Column Section: Recent Drift Feed & Urgent Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Drift Feed */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 glass-panel space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-rose-400" />
              <h3 className="text-sm font-bold text-white">Latest Regulatory Drift Events</h3>
            </div>
            <button
              onClick={() => navigate('/app/changes')}
              className="text-xs text-emerald-400 hover:underline"
            >
              Explore Feed
            </button>
          </div>

          <div className="space-y-3">
            {metrics.recentDriftEvents.slice(0, 4).map((change, idx) => (
              <div
                key={idx}
                onClick={() => navigate(`/app/changes/${change.id}`)}
                className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-950/40 hover:bg-slate-800/40 transition-colors cursor-pointer group space-y-2"
              >
                <div className="flex items-center justify-between">
                  <RiskBadge level={change.severity} size="sm" />
                  <span className="text-[11px] font-mono text-slate-500">
                    Effective: {new Date(change.effectiveDate).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="text-xs font-semibold text-white group-hover:text-emerald-300 transition-colors line-clamp-2">
                  {change.summary}
                </h4>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/50">
                  <span className="font-mono text-emerald-400/80">{change.sectionIdentifier || 'Article Amendment'}</span>
                  <span className="flex items-center gap-1 text-slate-500 group-hover:text-slate-300">
                    <span>Inspect diff</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Compliance Work Items */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 glass-panel space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Priority Compliance Work Orders</h3>
            </div>
            <button
              onClick={() => navigate('/app/actions')}
              className="text-xs text-emerald-400 hover:underline"
            >
              View All ({metrics.complianceActions.total})
            </button>
          </div>

          <div className="space-y-3">
            {metrics.urgentActions.slice(0, 4).map((action, idx) => (
              <div
                key={idx}
                onClick={() => navigate(`/app/actions/${action.id}`)}
                className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-950/40 hover:bg-slate-800/40 transition-colors cursor-pointer group space-y-2"
              >
                <div className="flex items-center justify-between">
                  <StatusBadge status={action.status} size="sm" />
                  <RiskBadge level={action.priority} size="sm" />
                </div>
                <h4 className="text-xs font-semibold text-white group-hover:text-emerald-300 transition-colors line-clamp-2">
                  {action.title}
                </h4>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/50">
                  <span className="font-mono text-amber-400">
                    Due: {new Date(action.dueDate).toLocaleDateString()}
                  </span>
                  <span className="text-slate-500 group-hover:text-slate-300">Submit Evidence →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
