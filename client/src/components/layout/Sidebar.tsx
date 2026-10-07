import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Globe2,
  BookOpen,
  GitCompare,
  Calendar,
  Building2,
  Package,
  Cpu,
  Truck,
  ShieldAlert,
  CheckSquare,
  Clock,
  Bell,
  FolderLock,
  Sparkles,
  FileSpreadsheet,
  History,
  Settings,
  Scale,
} from 'lucide-react';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const navSections = [
    {
      title: 'Regulatory Intelligence',
      links: [
        { name: 'Dashboard', path: '/app/dashboard', icon: LayoutDashboard },
        { name: 'Global Map', path: '/app/map', icon: Globe2, badge: 'Live' },
        { name: 'Regulations Directory', path: '/app/regulations', icon: BookOpen, count: 26 },
        { name: 'Drift & Changes Feed', path: '/app/changes', icon: GitCompare, count: 16, countColor: 'bg-rose-500/20 text-rose-300' },
        { name: 'Master Timeline', path: '/app/timeline', icon: Calendar },
        { name: 'Risk Matrix', path: '/app/risks', icon: ShieldAlert },
      ],
    },
    {
      title: 'Company Assets Graph',
      links: [
        { name: 'Facilities', path: '/app/facilities', icon: Building2, count: 4 },
        { name: 'Products & BOM', path: '/app/products', icon: Package, count: 8 },
        { name: 'Processes', path: '/app/processes', icon: Cpu, count: 15 },
        { name: 'Suppliers & Supply Chain', path: '/app/suppliers', icon: Truck, count: 12 },
      ],
    },
    {
      title: 'Compliance Operations',
      links: [
        { name: 'Action Tracker', path: '/app/actions', icon: CheckSquare, count: 6 },
        { name: 'Deadlines & Calendar', path: '/app/deadlines', icon: Clock },
        { name: 'Alerts & Notifications', path: '/app/alerts', icon: Bell, count: 4, countColor: 'bg-amber-500/20 text-amber-300' },
        { name: 'Document Vault', path: '/app/documents', icon: FolderLock, count: 4 },
      ],
    },
    {
      title: 'AI & Enterprise Governance',
      links: [
        { name: 'Grounded AI Assistant', path: '/app/assistant', icon: Sparkles, badge: 'Gemini' },
        { name: 'Compliance Reports', path: '/app/reports', icon: FileSpreadsheet },
        { name: 'Immutable Audit Log', path: '/app/audit-log', icon: History },
        { name: 'Settings & Org', path: '/app/settings', icon: Settings },
      ],
    },
  ];

  return (
    <aside className="w-64 shrink-0 flex flex-col h-full bg-slate-950 border-r border-slate-800/80 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 border-b border-slate-800/80 gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/20">
          <Scale className="w-5 h-5 text-slate-950" />
        </div>
        <div>
          <div className="flex items-center gap-1.5 font-bold tracking-tight text-white text-base">
            <span>Regula</span>
            <span className="text-emerald-400">Map</span>
          </div>
          <div className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">
            Drift Tracking Platform
          </div>
        </div>
      </div>

      {/* Navigation Links Scroll Area */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            <h4 className="px-3 text-[11px] font-mono font-medium uppercase tracking-wider text-slate-400">
              {section.title}
            </h4>
            <div className="space-y-0.5 mt-1.5">
              {section.links.map((link, lIdx) => {
                const Icon = link.icon;
                return (
                  <NavLink
                    key={lIdx}
                    to={link.path}
                    onClick={onCloseMobile}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                        isActive
                          ? 'bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/30 shadow-sm'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900 border border-transparent'
                      }`
                    }
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon className="w-4 h-4 shrink-0 transition-colors group-hover:text-emerald-400" />
                      <span className="truncate">{link.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {link.badge && (
                        <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          {link.badge}
                        </span>
                      )}
                      {link.count !== undefined && (
                        <span
                          className={`px-1.5 py-0.2 text-[10px] font-mono rounded-md font-medium ${
                            link.countColor || 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {link.count}
                        </span>
                      )}
                    </div>
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Tenant Context Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/60">
        <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/60 text-xs">
          <div className="text-[10px] uppercase font-mono text-slate-500">Active Tenant Context</div>
          <div className="font-semibold text-slate-200 truncate mt-0.5">Apex Industrial Systems</div>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>RLS Isolated: 4 Facilities</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
