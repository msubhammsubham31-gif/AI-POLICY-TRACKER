import React, { useEffect, useState } from 'react';
import { Cpu, Search, Plus, Zap, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../services/api';
import { ProcessItem } from '../types';

const processSchema = z.object({
  name: z.string().min(2, 'Process name is required'),
  description: z.string().min(5, 'Description is required'),
  energyKw: z.number().min(0, 'Energy must be non-negative'),
});

type ProcessFormData = z.infer<typeof processSchema>;

export const ProcessesPage: React.FC = () => {
  const [processes, setProcesses] = useState<ProcessItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { register, handleSubmit, reset } = useForm<ProcessFormData>({
    resolver: zodResolver(processSchema),
    defaultValues: { energyKw: 250 },
  });

  const loadProcesses = () => {
    api.processes.getAll()
      .then(res => setProcesses(res.processes || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProcesses();
  }, []);

  const handleCreate = async (data: ProcessFormData) => {
    try {
      await api.processes.create({
        ...data,
        inputs: ['Feedstock chemicals'],
        chemicals: ['Industrial solvents'],
        emissions: ['Treated exhaust'],
        waste: ['Non-hazardous solid waste'],
      });
      reset();
      setIsModalOpen(false);
      loadProcesses();
    } catch (err: any) {
      console.error(err);
    }
  };

  const filtered = processes.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Industrial Processes Directory</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {processes.length} Registered Manufacturing Unit Operations
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Chemical synthesis, extrusion, thermal oxidation, and assembly steps evaluated against industrial emissions (IED) and chemical restrictions.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add Process</span>
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center bg-slate-900/60 p-3 rounded-2xl border border-slate-800 glass-panel">
        <Search className="w-4 h-4 text-slate-500 ml-2 mr-3" />
        <input
          type="text"
          placeholder="Search processes by title, chemical precursors, or emissions profile..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map(pr => (
          <div
            key={pr.id}
            className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 glass-panel glass-card-hover space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  ID: {pr.id}
                </span>
                <span className="text-xs font-mono text-cyan-400 font-bold flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" />
                  <span>{pr.energyKw} kW</span>
                </span>
              </div>
              <h3 className="text-sm font-bold text-white leading-snug">{pr.name}</h3>
              <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">{pr.description}</p>
            </div>

            <div className="pt-3 border-t border-slate-800/80 space-y-2 text-[11px] font-mono">
              <div className="flex items-start gap-1 text-slate-400">
                <span className="text-slate-500 shrink-0">Chemicals:</span>
                <span className="text-emerald-300 truncate">{pr.chemicals?.join(', ') || 'N/A'}</span>
              </div>
              <div className="flex items-start gap-1 text-slate-400">
                <span className="text-slate-500 shrink-0">Emissions:</span>
                <span className="text-rose-300 truncate">{pr.emissions?.join(', ') || 'Clean air'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Register Industrial Process Unit</h3>
            <form onSubmit={handleSubmit(handleCreate)} className="space-y-3">
              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Process Name</label>
                <input
                  type="text"
                  {...register('name')}
                  placeholder="e.g. Ultrasonic Solvent Degreasing"
                  className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Description</label>
                <textarea
                  rows={3}
                  {...register('description')}
                  placeholder="Operating parameters, reaction temperature, atmosphere..."
                  className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Connected Load (kW)</label>
                <input
                  type="number"
                  {...register('energyKw', { valueAsNumber: true })}
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
                  Save Process
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
