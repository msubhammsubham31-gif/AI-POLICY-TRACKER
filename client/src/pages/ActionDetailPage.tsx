import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CheckSquare,
  ArrowLeft,
  Calendar,
  FileCheck,
  UploadCloud,
  CheckCircle2,
  Building2,
  Package,
  Truck,
  BookOpen,
  FolderLock,
} from 'lucide-react';
import { api } from '../services/api';
import { ComplianceAction, ActionStatus, RiskLevel } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { RiskBadge } from '../components/common/RiskBadge';
import { LegalDisclaimer } from '../components/common/LegalDisclaimer';

export const ActionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [action, setAction] = useState<ComplianceAction | null>(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [status, setStatus] = useState<ActionStatus>('IN_PROGRESS');
  const [priority, setPriority] = useState<RiskLevel>('HIGH');
  const [completionNotes, setCompletionNotes] = useState('');
  const [evidenceFileName, setEvidenceFileName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api.actions.getById(id)
      .then(res => {
        setAction(res);
        setStatus(res.status);
        setPriority(res.priority);
        setCompletionNotes(res.completionNotes || '');
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSubmitting(true);
    setSuccessMessage(null);

    try {
      const updated = await api.actions.update(id, {
        status,
        priority,
        completionNotes,
      });

      if (evidenceFileName) {
        await api.documents.upload({
          title: evidenceFileName,
          complianceActionId: id,
          facilityId: action?.facilityId,
          regulationId: action?.regulationId,
        });
      }

      setAction(updated);
      setSuccessMessage('Compliance action status and evidence attestation saved successfully.');
    } catch (err: any) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !action) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-400 font-mono text-xs">
        Loading work order execution details...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <button
          onClick={() => navigate('/app/actions')}
          className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Action Tracker</span>
        </button>

        <div className="flex items-center gap-2">
          <StatusBadge status={action.status} />
          <RiskBadge level={action.priority} />
        </div>
      </div>

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Hero Header */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 glass-panel space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
          <Calendar className="w-4 h-4" />
          <span>Enforcement Due Date: {new Date(action.dueDate).toLocaleDateString()}</span>
        </div>

        <h1 className="text-2xl font-bold text-white tracking-tight">
          {action.title}
        </h1>

        <p className="text-sm text-slate-300 leading-relaxed max-w-4xl">
          {action.description}
        </p>

        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 font-mono space-y-1">
          <div className="text-slate-500 uppercase text-[10px] font-bold">Prescribed Authoritative Evidence:</div>
          <div>{action.evidenceRequired}</div>
        </div>
      </div>

      <LegalDisclaimer />

      {/* Linked Assets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 glass-panel space-y-1 text-xs">
          <div className="flex items-center gap-1.5 text-cyan-400 font-mono uppercase text-[11px]">
            <Building2 className="w-4 h-4" />
            <span>Assigned Facility</span>
          </div>
          <div className="font-bold text-white">{action.facility?.name || 'Apex Advanced Materials — Dresden'}</div>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 glass-panel space-y-1 text-xs">
          <div className="flex items-center gap-1.5 text-emerald-400 font-mono uppercase text-[11px]">
            <Package className="w-4 h-4" />
            <span>Target Product SKU</span>
          </div>
          <div className="font-bold text-white">{action.product?.name || 'Apex-Fluor 400 Protective Polymer'}</div>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 glass-panel space-y-1 text-xs">
          <div className="flex items-center gap-1.5 text-purple-400 font-mono uppercase text-[11px]">
            <BookOpen className="w-4 h-4" />
            <span>Triggering Regulation</span>
          </div>
          <div className="font-bold text-white">{action.regulation?.shortTitle || 'EU REACH PFAS Universal Ban'}</div>
        </div>
      </div>

      {/* Execution & Evidence Submission Workflow Form */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 glass-panel space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <FileCheck className="w-4 h-4 text-emerald-400" />
            <span>Execution Status & Evidence Submission</span>
          </div>
          <span className="text-xs font-mono text-slate-400">Authenticated Sign-Off</span>
        </div>

        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                Workflow Status Transition
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ActionStatus)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              >
                <option value="OPEN">OPEN (Assigned, Not Started)</option>
                <option value="IN_PROGRESS">IN PROGRESS (Lab Testing / Engineering Underway)</option>
                <option value="UNDER_REVIEW">UNDER REVIEW (Awaiting CCO Verification)</option>
                <option value="COMPLETED">COMPLETED (Evidence Verified & Filed)</option>
                <option value="BLOCKED">BLOCKED (External Dependency Bottleneck)</option>
                <option value="WAIVED">WAIVED (Legal Exemption Granted)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                Priority Rating
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as RiskLevel)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              >
                <option value="CRITICAL">CRITICAL</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
              Attach Evidence Document / Certificate Filename
            </label>
            <div className="relative">
              <UploadCloud className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={evidenceFileName}
                onChange={(e) => setEvidenceFileName(e.target.value)}
                placeholder="e.g. ASTM-D3359_Siloxane_Lab_Qualification_Report_2025.pdf"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-500 font-mono">
              File record will be automatically indexed into the Immutable Document Vault.
            </p>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
              Engineering Notes & Operational Attestation
            </label>
            <textarea
              rows={4}
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
              placeholder="Detail pilot batch test results, scrubber parameters, customs electronic filing confirmation numbers..."
              className="w-full p-3 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-sans"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-500 font-mono">
              Stamped with active user identity and IP address in the system audit log.
            </span>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-2 disabled:opacity-50 shadow-md shadow-emerald-500/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'Saving...' : 'Save & Submit Work Order'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
