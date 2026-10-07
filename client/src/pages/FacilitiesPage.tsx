import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, Search, MapPin, Gauge, ShieldCheck, ArrowRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../services/api';
import { Facility } from '../types';

const facilitySchema = z.object({
  name: z.string().min(2, 'Facility name is required'),
  country: z.string().min(2, 'Country is required'),
  location: z.string().min(2, 'Location is required'),
  facilityType: z.string().min(2, 'Type is required'),
  productionCapacity: z.string().min(2, 'Capacity is required'),
});

type FacilityFormData = z.infer<typeof facilitySchema>;

export const FacilitiesPage: React.FC = () => {
  const navigate = useNavigate();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { register, handleSubmit, reset } = useForm<FacilityFormData>({
    resolver: zodResolver(facilitySchema),
  });

  const loadFacilities = () => {
    api.facilities.getAll()
      .then(res => setFacilities(res.facilities || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadFacilities();
  }, []);

  const handleCreate = async (data: FacilityFormData) => {
    try {
      await api.facilities.create({
        ...data,
        latitude: 48.1351,
        longitude: 11.5820,
        emissionsData: { scope1_co2e_mt: 5000, scope2_co2e_mt: 3000, scope3_co2e_mt: 12000 },
        waterUsage: { annual_m3: 45000, recycling_rate_pct: 80.0 },
        energyMetrics: { mwh_consumed: 15000, renewable_pct: 50.0 },
        wasteOutput: { hazardous_waste_mt: 80, non_hazardous_waste_mt: 400 },
      });
      reset();
      setIsModalOpen(false);
      loadFacilities();
    } catch (err: any) {
      console.error(err);
    }
  };

  const filtered = facilities.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.country.toLowerCase().includes(search.toLowerCase()) ||
    f.facilityType.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Company Facilities Directory</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              {facilities.length} Operating Plants
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manufacturing, refining, synthesis, and battery assembly sites subject to national environmental permits and emissions monitoring.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add Facility</span>
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center bg-slate-900/60 p-3 rounded-2xl border border-slate-800 glass-panel">
        <Search className="w-4 h-4 text-slate-500 ml-2 mr-3" />
        <input
          type="text"
          placeholder="Search facilities by name, country, or production type..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
        />
      </div>

      {/* Facilities Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.map(fac => (
          <div
            key={fac.id}
            onClick={() => navigate(`/app/facilities/${fac.id}`)}
            className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 glass-panel glass-card-hover cursor-pointer space-y-4 group"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold uppercase">
                  {fac.country}
                </span>
                <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors mt-2">
                  {fac.name}
                </h3>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-cyan-400">
                <Building2 className="w-5 h-5" />
              </div>
            </div>

            <p className="text-xs text-slate-400">
              {fac.facilityType} • Annual Capacity: {fac.productionCapacity}
            </p>

            <div className="flex items-center gap-2 text-xs text-slate-300 font-mono">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              <span className="truncate">{fac.location}</span>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800/80 text-[11px] font-mono text-center">
              <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-500 block text-[9px] uppercase">Scope 1 CO2e</span>
                <span className="text-white font-bold">{fac.emissionsData?.scope1_co2e_mt?.toLocaleString() || '12,400'} MT</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-500 block text-[9px] uppercase">Water Recycled</span>
                <span className="text-cyan-400 font-bold">{fac.waterUsage?.recycling_rate_pct || '78.4'}%</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-500 block text-[9px] uppercase">Renewable MWh</span>
                <span className="text-emerald-400 font-bold">{fac.energyMetrics?.renewable_pct || '62.0'}%</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span className="font-mono text-[11px] text-emerald-400">
                Telemetry Active • GPS: {fac.latitude.toFixed(2)}, {fac.longitude.toFixed(2)}
              </span>
              <span className="flex items-center gap-1 text-slate-300 group-hover:text-emerald-400 font-medium">
                <span>Inspect plant</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Register Industrial Facility</h3>
            <form onSubmit={handleSubmit(handleCreate)} className="space-y-3">
              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Facility Name</label>
                <input
                  type="text"
                  {...register('name')}
                  placeholder="e.g. Apex CleanChem Rotterdam"
                  className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Country</label>
                <input
                  type="text"
                  {...register('country')}
                  placeholder="e.g. Netherlands"
                  className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Location / Address</label>
                <input
                  type="text"
                  {...register('location')}
                  placeholder="e.g. Port of Rotterdam Cluster"
                  className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Facility Type</label>
                <input
                  type="text"
                  {...register('facilityType')}
                  placeholder="e.g. Chemical Synthesis & Solvent Recovery"
                  className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Production Capacity</label>
                <input
                  type="text"
                  {...register('productionCapacity')}
                  placeholder="e.g. 50,000 MT / annum"
                  className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
                >
                  Save Facility
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
