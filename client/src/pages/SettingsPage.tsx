import React, { useState } from 'react';
import {
  Settings,
  Building,
  User,
  Bell,
  Database,
  Cpu,
  Key,
  ShieldCheck,
  CheckCircle2,
  Save,
  Globe,
  Radio,
  Sliders,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [saved, setSaved] = useState(false);
  const [orgName, setOrgName] = useState('Apex Industrial Systems Corp.');
  const [industry, setIndustry] = useState('Advanced Heavy Manufacturing & Specialty Chemicals');
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [inAppAlerts, setInAppAlerts] = useState(true);
  const [criticalOnly, setCriticalOnly] = useState(false);
  const [digestFrequency, setDigestFrequency] = useState('IMMEDIATE');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary" />
            System & Organization Settings
          </h1>
          <p className="text-sm text-muted-foreground">
            Configure tenant parameters, compliance thresholds, alert channels, and cloud service integrations.
          </p>
        </div>

        {saved && (
          <div className="flex items-center gap-2 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg">
            <CheckCircle2 className="w-4 h-4" /> Settings updated successfully
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Organization Profile */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-white font-semibold border-b border-border/60 pb-3">
            <Building className="w-5 h-5 text-primary" />
            <h3>Organization Profile</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Organization Name
              </label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full bg-surface/80 border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Primary Industry Sector
              </label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full bg-surface/80 border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Monitored Operating Jurisdictions
            </label>
            <div className="flex flex-wrap gap-2">
              {['European Union (EU)', 'United States (Federal & CA)', 'Germany (DE)', 'Taiwan (TW)', 'Japan (JP)', 'United Kingdom (UK)'].map(
                (jur, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-surface border border-border text-xs text-slate-300"
                  >
                    <Globe className="w-3 h-3 text-primary" /> {jur}
                  </span>
                )
              )}
            </div>
          </div>
        </div>

        {/* User Account */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-white font-semibold border-b border-border/60 pb-3">
            <User className="w-5 h-5 text-emerald-400" />
            <h3>Active User Profile</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="text-xs text-muted-foreground block">Full Name</span>
              <span className="text-sm font-medium text-white">Dr. Elena Vance</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Email Address</span>
              <span className="text-sm font-medium text-white">elena.vance@apexindustrial.com</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Assigned RBAC Role</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-primary/20 text-primary border border-primary/30 mt-0.5">
                COMPLIANCE_MANAGER (ADMIN)
              </span>
            </div>
          </div>
        </div>

        {/* Notification & Drift Dispatch Preferences */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-white font-semibold border-b border-border/60 pb-3">
            <Bell className="w-5 h-5 text-amber-400" />
            <h3>Compliance Drift Alerts & Notifications</h3>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              <div>
                <span className="text-sm font-medium text-white block">Email Dispatch</span>
                <span className="text-xs text-muted-foreground">
                  Send regulatory drift digests and new compliance action notices to team inboxes.
                </span>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={inAppAlerts}
                onChange={(e) => setInAppAlerts(e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              <div>
                <span className="text-sm font-medium text-white block">In-App Notification Center</span>
                <span className="text-xs text-muted-foreground">
                  Display real-time badge counters and alert banners in the top navigation bar.
                </span>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={criticalOnly}
                onChange={(e) => setCriticalOnly(e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              <div>
                <span className="text-sm font-medium text-white block">Critical Urgency Only</span>
                <span className="text-xs text-muted-foreground">
                  Suppress informational updates; dispatch notifications solely for CRITICAL or HIGH severity changes.
                </span>
              </div>
            </label>

            <div className="pt-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Dispatch Frequency
              </label>
              <select
                value={digestFrequency}
                onChange={(e) => setDigestFrequency(e.target.value)}
                className="w-full sm:w-64 bg-surface/80 border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="IMMEDIATE">Immediate (Real-Time Ingestion)</option>
                <option value="DAILY_DIGEST">Daily Digest (08:00 UTC)</option>
                <option value="WEEKLY_DIGEST">Weekly Executive Summary (Mondays)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Cloud & AI Integrations */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-white font-semibold border-b border-border/60 pb-3">
            <Cpu className="w-5 h-5 text-indigo-400" />
            <h3>Cloud & AI Service Integrations</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3.5 bg-surface/60 border border-border rounded-lg flex items-start gap-3">
              <Database className="w-5 h-5 text-emerald-400 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-white flex items-center gap-2">
                  Supabase Cloud PostgreSQL
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-mono">
                    CONNECTED
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1 font-mono">
                  https://xniukiwokjkafyxymcpc.supabase.co
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-surface/60 border border-border rounded-lg flex items-start gap-3">
              <Cpu className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <div className="text-sm font-medium text-white flex items-center gap-2">
                  Google Gemini 2.5 Flash SDK
                  <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-mono">
                    ACTIVE
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  @google/genai structured JSON synthesis with strict grounding rules.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm rounded-lg shadow-sm transition-colors"
          >
            <Save className="w-4 h-4" /> Save Preferences
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;
