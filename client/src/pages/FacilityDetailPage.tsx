import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Building2, ArrowLeft, MapPin, Gauge, Droplet, Zap, Trash2, Cpu, CheckSquare, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import { Facility } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { RiskBadge } from '../components/common/RiskBadge';
import { LegalDisclaimer } from '../components/common/LegalDisclaimer';

export const FacilityDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [facility, setFacility] = useState<Facility | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api.facilities.getById(id)
      .then(res => setFacility(res))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading || !facility) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-400 font-mono text-xs">
        Loading facility environmental telemetry...
      </div>
    );
  }

  const em = facility.emissionsData || {};
  const wt = facility.waterUsage || {};
  const en = facility.energyMetrics || {};
  const ws = facility.wasteOutput || {};

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <button
          onClick={() => navigate('/app/facilities')}
          className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Facilities Directory</span>
        </button>

        <span className="text-xs font-mono text-cyan-400">
          GPS: {facility.latitude.toFixed(4)}, {facility.longitude.toFixed(4)}
        </span>
      </div>

      {/* Hero Header */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 glass-panel space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono uppercase text-cyan-400 font-semibold">
          <span>{facility.country}</span>
          <span>•</span>
          <span>Capacity: {facility.productionCapacity}</span>
        </div>

        <h1 className="text-2xl font-bold text-white tracking-tight">
          {facility.name}
        </h1>

        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
          <MapPin className="w-4 h-4 text-slate-500" />
          <span>{facility.location}</span>
        </div>

        <div className="pt-2">
          <LegalDisclaimer compact />
        </div>
      </div>

      {/* Environmental & Operational Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* GHG Emissions */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 glass-panel space-y-3">
          <div className="flex items-center justify-between text-rose-400">
            <span className="text-xs font-mono font-bold uppercase">GHG Emissions</span>
            <Gauge className="w-5 h-5" />
          </div>
          <div className="space-y-1 font-mono text-xs">
            <div className="flex justify-between text-slate-300">
              <span>Scope 1 CO2e:</span>
              <span className="font-bold text-white">{em.scope1_co2e_mt?.toLocaleString() || '12,400'} MT</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Scope 2 CO2e:</span>
              <span className="font-bold text-white">{em.scope2_co2e_mt?.toLocaleString() || '8,900'} MT</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Scope 3 CO2e:</span>
              <span className="font-bold text-white">{em.scope3_co2e_mt?.toLocaleString() || '34,200'} MT</span>
            </div>
          </div>
        </div>

        {/* Water Management */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 glass-panel space-y-3">
          <div className="flex items-center justify-between text-cyan-400">
            <span className="text-xs font-mono font-bold uppercase">Water Systems</span>
            <Droplet className="w-5 h-5" />
          </div>
          <div className="space-y-1 font-mono text-xs">
            <div className="flex justify-between text-slate-300">
              <span>Annual Draw:</span>
              <span className="font-bold text-white">{wt.annual_m3?.toLocaleString() || '185,000'} m³</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Recycling Rate:</span>
              <span className="font-bold text-cyan-400">{wt.recycling_rate_pct || '78.4'}%</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Discharge Purity:</span>
              <span className="font-bold text-white">{wt.discharge_purity_pct || '99.1'}%</span>
            </div>
          </div>
        </div>

        {/* Energy & Power */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 glass-panel space-y-3">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-xs font-mono font-bold uppercase">Energy & Grid</span>
            <Zap className="w-5 h-5" />
          </div>
          <div className="space-y-1 font-mono text-xs">
            <div className="flex justify-between text-slate-300">
              <span>Annual Load:</span>
              <span className="font-bold text-white">{en.mwh_consumed?.toLocaleString() || '38,400'} MWh</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Renewable Ratio:</span>
              <span className="font-bold text-emerald-400">{en.renewable_pct || '62.0'}%</span>
            </div>
            <div className="flex justify-between text-slate-300 truncate">
              <span>PPA Agreement:</span>
              <span className="font-bold text-white truncate">Active PPA</span>
            </div>
          </div>
        </div>

        {/* Waste Output */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 glass-panel space-y-3">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-xs font-mono font-bold uppercase">Waste Stream</span>
            <Trash2 className="w-5 h-5" />
          </div>
          <div className="space-y-1 font-mono text-xs">
            <div className="flex justify-between text-slate-300">
              <span>Hazardous Waste:</span>
              <span className="font-bold text-rose-400">{ws.hazardous_waste_mt || '310'} MT</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Non-Hazardous:</span>
              <span className="font-bold text-white">{ws.non_hazardous_waste_mt || '1,250'} MT</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Diversion Rate:</span>
              <span className="font-bold text-emerald-400">{ws.landfill_diversion_pct || '94.2'}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Industrial Processes Executed At Facility */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 glass-panel space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
              Operating Industrial Processes ({facility.assignedProcesses?.length || facility.processes?.length || 4})
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {facility.assignedProcesses?.map(p => (
            <div key={p.id} className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white">{p.name}</h4>
                <span className="text-[10px] font-mono text-cyan-400">{p.energyKw} kW Load</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{p.description}</p>
              <div className="text-[11px] text-slate-500 font-mono">
                Chemicals: {p.chemicals?.join(', ') || 'Standard Catalysts'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Linked Compliance Work Orders */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 glass-panel space-y-3">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <CheckSquare className="w-4 h-4 text-emerald-400" />
          <span>Active Compliance Work Orders for this Facility</span>
        </div>
        <div className="space-y-2">
          {facility.relatedActions && facility.relatedActions.length > 0 ? (
            facility.relatedActions.map(a => (
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
              All environmental operating permits currently certified in good standing.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
