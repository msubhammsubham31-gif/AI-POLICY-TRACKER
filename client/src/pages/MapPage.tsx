import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe2, Shield, Building2, Filter, Sparkles, ArrowRight, ExternalLink } from 'lucide-react';
import { api } from '../services/api';
import { Jurisdiction, Facility, Regulation } from '../types';
import { MapView } from '../components/common/MapView';
import { RiskBadge } from '../components/common/RiskBadge';

export const MapPage: React.FC = () => {
  const navigate = useNavigate();
  const [jurisdictions, setJurisdictions] = useState<Jurisdiction[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [regulations, setRegulations] = useState<Regulation[]>([]);
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<Jurisdiction | null>(null);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.jurisdictions.getAll(),
      api.facilities.getAll(),
      api.regulations.getAll(),
    ]).then(([jRes, fRes, rRes]) => {
      setJurisdictions(jRes.jurisdictions || []);
      setFacilities(fRes.facilities || []);
      setRegulations(rRes.regulations || []);
    }).catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filteredRegulations = selectedJurisdiction
    ? regulations.filter(r => r.jurisdictionId === selectedJurisdiction.id || r.country.includes(selectedJurisdiction.name))
    : regulations;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Global Regulatory Map</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              "Google Maps for Laws"
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Spatial intelligence visualization connecting global regulatory mandates to Apex operating facilities and supply chain hubs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedJurisdiction && (
            <button
              onClick={() => setSelectedJurisdiction(null)}
              className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-xs text-slate-300 hover:text-white"
            >
              Clear Filter: {selectedJurisdiction.name}
            </button>
          )}
        </div>
      </div>

      {/* Main Map Container & Sidebar Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map Canvas (3 Columns) */}
        <div className="lg:col-span-3 h-[580px]">
          <MapView
            jurisdictions={jurisdictions}
            facilities={facilities}
            onSelectJurisdiction={(j) => setSelectedJurisdiction(j)}
            onSelectFacility={(f) => setSelectedFacility(f)}
          />
        </div>

        {/* Dynamic Context Sidebar (1 Column) */}
        <div className="space-y-4 flex flex-col justify-between">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 glass-panel space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-mono font-medium uppercase tracking-wider text-slate-400">
                {selectedJurisdiction ? `Focus: ${selectedJurisdiction.code}` : 'Active Coverage'}
              </span>
              <Shield className="w-4 h-4 text-emerald-400" />
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Jurisdictions:</span>
                <span className="font-mono text-white font-bold">{jurisdictions.length} Global Pacts</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Facilities Covered:</span>
                <span className="font-mono text-cyan-300 font-bold">{facilities.length} Industrial Sites</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Applicable Laws:</span>
                <span className="font-mono text-emerald-400 font-bold">{filteredRegulations.length} Acts</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <h4 className="text-xs font-semibold text-slate-300 mb-2">Operating Facilities:</h4>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {facilities.map(f => (
                  <div
                    key={f.id}
                    onClick={() => navigate(`/app/facilities/${f.id}`)}
                    className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-cyan-500/30 transition-colors cursor-pointer text-xs"
                  >
                    <div className="font-semibold text-white truncate">{f.name}</div>
                    <div className="text-[10px] text-slate-400">{f.country} • {f.facilityType}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Laws List in Region */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 glass-panel space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                Laws in Scope ({filteredRegulations.slice(0, 3).length})
              </h4>
              <button
                onClick={() => navigate('/app/regulations')}
                className="text-[11px] text-emerald-400 hover:underline"
              >
                Directory →
              </button>
            </div>

            <div className="space-y-2">
              {filteredRegulations.slice(0, 3).map(r => (
                <div
                  key={r.id}
                  onClick={() => navigate(`/app/regulations/${r.id}`)}
                  className="p-2 rounded-lg bg-slate-950/40 border border-slate-800 hover:border-emerald-500/30 cursor-pointer transition-colors"
                >
                  <div className="text-xs font-semibold text-white truncate">{r.shortTitle}</div>
                  <div className="text-[10px] font-mono text-emerald-400">{r.category}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
