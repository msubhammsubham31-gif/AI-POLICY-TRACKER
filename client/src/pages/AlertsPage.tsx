import React, { useEffect, useState } from 'react';
import { Bell, CheckCircle2, ShieldAlert, AlertTriangle, Info, Clock, Check } from 'lucide-react';
import { api } from '../services/api';
import { AlertItem } from '../types';
import { RiskBadge } from '../components/common/RiskBadge';

export const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAlerts = () => {
    api.alerts.getAll()
      .then(res => setAlerts(res.alerts || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await api.alerts.markRead(id);
      loadAlerts();
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = alerts.filter(a => !a.read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Notification & Alert Center</h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {unreadCount} Unread Notifications
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time compliance alerts triggered by version changes, threshold exceedances, and milestone deadlines.
          </p>
        </div>
      </div>

      {/* Alerts Stream */}
      <div className="space-y-3">
        {alerts.map(alert => (
          <div
            key={alert.id}
            className={`rounded-2xl border p-5 glass-panel transition-all space-y-3 ${
              alert.read
                ? 'border-slate-800/60 bg-slate-900/40 opacity-75'
                : 'border-emerald-500/30 bg-slate-900/80 shadow-lg'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <RiskBadge level={alert.severity} size="sm" />
                {!alert.read && (
                  <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                )}
                <span className="text-xs font-mono text-slate-400">
                  {new Date(alert.createdAt).toLocaleString()}
                </span>
              </div>

              {!alert.read && (
                <button
                  onClick={() => handleMarkRead(alert.id)}
                  className="px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800 text-[11px] text-slate-300 flex items-center gap-1 font-mono transition-colors"
                >
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span>Mark as Read</span>
                </button>
              )}
            </div>

            <h3 className="text-sm font-bold text-white leading-snug">
              {alert.title}
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {alert.message}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
