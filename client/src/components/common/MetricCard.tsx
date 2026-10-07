import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: string;
  isPositive?: boolean;
  icon: LucideIcon;
  variant?: 'emerald' | 'rose' | 'amber' | 'blue' | 'purple';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  change,
  isPositive = true,
  icon: Icon,
  variant = 'emerald',
}) => {
  const variantStyles = {
    emerald: {
      border: 'hover:border-emerald-500/40',
      iconBg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
      glow: 'group-hover:shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)]',
    },
    rose: {
      border: 'hover:border-rose-500/40',
      iconBg: 'bg-rose-500/15 text-rose-400 border-rose-500/20',
      glow: 'group-hover:shadow-[0_0_20px_-5px_rgba(239,68,68,0.3)]',
    },
    amber: {
      border: 'hover:border-amber-500/40',
      iconBg: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
      glow: 'group-hover:shadow-[0_0_20px_-5px_rgba(245,158,11,0.3)]',
    },
    blue: {
      border: 'hover:border-sky-500/40',
      iconBg: 'bg-sky-500/15 text-sky-400 border-sky-500/20',
      glow: 'group-hover:shadow-[0_0_20px_-5px_rgba(14,165,233,0.3)]',
    },
    purple: {
      border: 'hover:border-purple-500/40',
      iconBg: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
      glow: 'group-hover:shadow-[0_0_20px_-5px_rgba(168,85,247,0.3)]',
    },
  }[variant];

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md transition-all duration-300 ${variantStyles.border} ${variantStyles.glow}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400 font-mono">{title}</p>
          <h3 className="mt-2 text-2xl font-bold tracking-tight text-white">{value}</h3>
        </div>
        <div className={`rounded-xl border p-2.5 transition-transform duration-300 group-hover:scale-110 ${variantStyles.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {(subtitle || change) && (
        <div className="mt-3 flex items-center justify-between text-xs">
          {change && (
            <span className={`font-mono font-medium ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {change}
            </span>
          )}
          {subtitle && <span className="text-slate-400">{subtitle}</span>}
        </div>
      )}
    </div>
  );
};
