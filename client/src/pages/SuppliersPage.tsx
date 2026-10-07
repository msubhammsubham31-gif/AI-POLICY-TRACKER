import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Plus, Search, ShieldCheck, AlertTriangle, ArrowRight, Award } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../services/api';
import { Supplier } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';

const supplierSchema = z.object({
  name: z.string().min(2, 'Supplier name is required'),
  country: z.string().min(2, 'Country is required'),
  riskScore: z.number().min(0).max(100),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

export const SuppliersPage: React.FC = () => {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { register, handleSubmit, reset } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: { riskScore: 15 },
  });

  const loadSuppliers = () => {
    api.suppliers.getAll()
      .then(res => setSuppliers(res.suppliers || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const handleCreate = async (data: SupplierFormData) => {
    try {
      await api.suppliers.create({
        ...data,
        certifications: ['ISO 14001', 'ISO 9001'],
        complianceStatus: 'COMPLIANT',
      });
      reset();
      setIsModalOpen(false);
      loadSuppliers();
    } catch (err: any) {
      console.error(err);
    }
  };

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.country.toLowerCase().includes(search.toLowerCase()) ||
    s.complianceStatus.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Supply Chain & Supplier Directory</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {suppliers.length} Tier-1 Strategic Partners
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Global material and precursor providers screened under German LkSG, EU CSDDD, and CBAM embedded carbon verification rules.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add Supplier</span>
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center bg-slate-900/60 p-3 rounded-2xl border border-slate-800 glass-panel">
        <Search className="w-4 h-4 text-slate-500 ml-2 mr-3" />
        <input
          type="text"
          placeholder="Search suppliers by name, country, or ESG certification..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
        />
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map(s => {
          const isHighRisk = s.riskScore > 30;
          return (
            <div
              key={s.id}
              onClick={() => navigate(`/app/suppliers/${s.id}`)}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 glass-panel glass-card-hover cursor-pointer space-y-3 flex flex-col justify-between group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {s.country}
                  </span>
                  <StatusBadge status={s.complianceStatus} size="sm" />
                </div>
                <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                  {s.name}
                </h3>
              </div>

              {/* Certifications badges */}
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <div className="flex flex-wrap gap-1">
                  {s.certifications?.map((c, i) => (
                    <span key={i} className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      {c}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className={`font-mono font-bold ${isHighRisk ? 'text-rose-400' : 'text-emerald-400'}`}>
                    Risk Index: {s.riskScore.toFixed(1)}/100
                  </span>
                  <span className="text-slate-400 flex items-center gap-1 group-hover:text-white font-medium text-xs">
                    <span>Profile</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Onboard Supply Chain Partner</h3>
            <form onSubmit={handleSubmit(handleCreate)} className="space-y-3">
              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Company Name</label>
                <input
                  type="text"
                  {...register('name')}
                  placeholder="e.g. Nordic Bio-Polymers AB"
                  className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Country</label>
                <input
                  type="text"
                  {...register('country')}
                  placeholder="e.g. Sweden"
                  className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Risk Score (0 - 100)</label>
                <input
                  type="number"
                  {...register('riskScore', { valueAsNumber: true })}
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
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
