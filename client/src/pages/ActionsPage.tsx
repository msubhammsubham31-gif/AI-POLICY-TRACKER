import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckSquare, Plus, Search, Filter, Calendar, User, ArrowRight, ShieldCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../services/api';
import { ComplianceAction, ActionStatus, RiskLevel } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { RiskBadge } from '../components/common/RiskBadge';

const actionSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  description: z.string().min(5, 'Description is required'),
  priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
  dueDate: z.string().min(4, 'Due date is required'),
  evidenceRequired: z.string().min(3, 'Evidence requirements are required'),
});

type ActionFormData = z.infer<typeof actionSchema>;

export const ActionsPage: React.FC = () => {
  const navigate = useNavigate();
  const [actions, setActions] = useState<ComplianceAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { register, handleSubmit, reset } = useForm<ActionFormData>({
    resolver: zodResolver(actionSchema),
    defaultValues: {
      priority: 'HIGH',
      dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
  });

  const loadActions = () => {
    api.actions.getAll()
      .then(res => setActions(res.actions || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadActions();
  }, []);

  const handleCreate = async (data: ActionFormData) => {
    try {
      await api.actions.create({
        ...data,
        dueDate: new Date(data.dueDate).toISOString(),
      });
      reset();
      setIsModalOpen(false);
      loadActions();
    } catch (err: any) {
      console.error(err);
    }
  };

  const filtered = actions.filter(a => {
    const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || a.priority === priorityFilter;
    const matchesSearch = a.title.toLowerCase().includes(search.toLowerCase()) ||
                          a.description.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesPriority && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Compliance Action Tracker</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {actions.length} Work Orders Assigned
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Operational remediation orders, testing deliverables, and authoritative reporting filings across facilities.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Dispatch New Action</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800 glass-panel">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search actions by title, evidence requirement, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-800 bg-slate-950 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 font-mono"
          >
            <option value="ALL">Status: ALL</option>
            <option value="OPEN">OPEN</option>
            <option value="IN_PROGRESS">IN PROGRESS</option>
            <option value="UNDER_REVIEW">UNDER REVIEW</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="BLOCKED">BLOCKED</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-800 bg-slate-950 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 font-mono"
          >
            <option value="ALL">Priority: ALL</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
        </div>
      </div>

      {/* Actions List */}
      <div className="space-y-4">
        {filtered.map(action => (
          <div
            key={action.id}
            onClick={() => navigate(`/app/actions/${action.id}`)}
            className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 glass-panel glass-card-hover cursor-pointer space-y-3 group"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <StatusBadge status={action.status} size="sm" />
                <RiskBadge level={action.priority} size="sm" />
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
                <Calendar className="w-3.5 h-3.5" />
                <span>Due Date: {new Date(action.dueDate).toLocaleDateString()}</span>
              </div>
            </div>

            <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
              {action.title}
            </h3>

            <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
              {action.description}
            </p>

            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-300 font-mono">
              <span className="text-slate-500 block uppercase text-[10px]">Mandatory Evidence:</span>
              <span className="truncate block">{action.evidenceRequired}</span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span className="font-mono text-[11px]">Assigned Owner: Environmental Engineering Lead</span>
              <span className="text-emerald-400 flex items-center gap-1 font-medium group-hover:translate-x-0.5 transition-transform">
                <span>Execute & Submit Evidence</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Dispatch Compliance Work Order</h3>
            <form onSubmit={handleSubmit(handleCreate)} className="space-y-3">
              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Action Title</label>
                <input
                  type="text"
                  {...register('title')}
                  placeholder="e.g. Conduct Fenceline Air Quality Benchmark"
                  className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Operational Description</label>
                <textarea
                  rows={3}
                  {...register('description')}
                  placeholder="Specific technical steps, laboratory methods, or regulatory filing forms..."
                  className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Priority</label>
                  <select
                    {...register('priority')}
                    className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Due Date</label>
                  <input
                    type="date"
                    {...register('dueDate')}
                    className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Required Evidence Document</label>
                <input
                  type="text"
                  {...register('evidenceRequired')}
                  placeholder="e.g. Certified lab analysis report ASTM E29 or signed customs form"
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
                  Create Work Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
