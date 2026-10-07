import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  Eye,
  Calendar,
  User,
  Clock,
  Layers,
  CheckCircle2,
  AlertCircle,
  FileText,
  Code,
  X,
} from 'lucide-react';
import { api } from '../services/api';
import { AuditLogItem } from '../types';

export const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.audit.getLogs();
      setLogs(res.auditLogs || []);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.entityType.toLowerCase().includes(search.toLowerCase()) ||
      log.entityId.toLowerCase().includes(search.toLowerCase());
    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  const getActionColor = (action: string) => {
    if (action.includes('CREATED') || action.includes('APPROVED')) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    if (action.includes('UPDATED') || action.includes('REVIEW')) return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    if (action.includes('REJECTED') || action.includes('DELETED')) return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" />
            Immutable Audit Log
          </h1>
          <p className="text-sm text-muted-foreground">
            Complete cryptographic audit trail of all regulatory version ingests, AI assessments, and human review sign-offs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs bg-surface border border-border px-3 py-1.5 rounded-lg text-slate-300 font-mono">
            Total Logged Events: {logs.length}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search action, entity type, or record ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-muted-foreground"
          />
        </div>
        <div className="sm:w-64">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="ALL">All Actions</option>
            <option value="INGEST_VERSION">INGEST_VERSION</option>
            <option value="AI_ANALYSIS_GENERATED">AI_ANALYSIS_GENERATED</option>
            <option value="REVIEW_APPROVED">REVIEW_APPROVED</option>
            <option value="ACTION_CREATED">ACTION_CREATED</option>
            <option value="ACTION_UPDATED">ACTION_UPDATED</option>
            <option value="DOCUMENT_UPLOADED">DOCUMENT_UPLOADED</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface/50 border-b border-border/80 text-xs text-muted-foreground uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entity Type</th>
                <th className="px-4 py-3">Entity ID</th>
                <th className="px-4 py-3">Actor / User</th>
                <th className="px-4 py-3 text-right">Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Loading audit trail events...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No matching audit records found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300 font-medium whitespace-nowrap">
                      {log.entityType}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400 whitespace-nowrap">
                      {log.entityId}
                    </td>
                    <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                      <span className="flex items-center gap-1.5 text-xs">
                        <User className="w-3.5 h-3.5 text-muted-foreground" />
                        {log.userId || 'system-orchestrator'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded bg-surface border border-border text-slate-300 hover:text-white hover:border-primary transition-colors"
                      >
                        <Eye className="w-3 h-3" /> Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspector Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-border/80">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-white">
                  Audit Record: {selectedLog.action}
                </h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-muted-foreground hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-surface/50 p-2.5 rounded border border-border">
                  <span className="text-muted-foreground block">Event ID</span>
                  <span className="font-mono text-white">{selectedLog.id}</span>
                </div>
                <div className="bg-surface/50 p-2.5 rounded border border-border">
                  <span className="text-muted-foreground block">Recorded At</span>
                  <span className="font-mono text-white">{new Date(selectedLog.createdAt).toISOString()}</span>
                </div>
                <div className="bg-surface/50 p-2.5 rounded border border-border">
                  <span className="text-muted-foreground block">Entity Target</span>
                  <span className="font-mono text-white">{selectedLog.entityType} ({selectedLog.entityId})</span>
                </div>
                <div className="bg-surface/50 p-2.5 rounded border border-border">
                  <span className="text-muted-foreground block">Actor User</span>
                  <span className="font-mono text-white">{selectedLog.userId || 'system-daemon'}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Payload Metadata (JSON)
                </label>
                <pre className="p-3 bg-black/60 border border-border/80 rounded-lg text-xs font-mono text-emerald-400 overflow-x-auto max-h-60">
                  {JSON.stringify(selectedLog.metadata || {}, null, 2)}
                </pre>
              </div>
            </div>

            <div className="p-3 border-t border-border/80 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 bg-surface hover:bg-slate-800 border border-border rounded-lg text-xs font-medium text-white transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogPage;
