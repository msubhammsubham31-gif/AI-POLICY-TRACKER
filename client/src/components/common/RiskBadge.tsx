import React from 'react';
import { RiskLevel } from '../../types';

interface RiskBadgeProps {
  level: RiskLevel | string;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, size = 'md' }) => {
  const normLevel = (level || 'INFORMATIONAL').toUpperCase() as RiskLevel;

  const styleMap: Record<RiskLevel, { bg: string; text: string; border: string; dot: string }> = {
    CRITICAL: {
      bg: 'bg-rose-500/15',
      text: 'text-rose-400 font-semibold',
      border: 'border-rose-500/30',
      dot: 'bg-rose-500 animate-pulse',
    },
    HIGH: {
      bg: 'bg-orange-500/15',
      text: 'text-orange-400 font-semibold',
      border: 'border-orange-500/30',
      dot: 'bg-orange-500',
    },
    MEDIUM: {
      bg: 'bg-amber-500/15',
      text: 'text-amber-400 font-medium',
      border: 'border-amber-500/30',
      dot: 'bg-amber-400',
    },
    LOW: {
      bg: 'bg-sky-500/15',
      text: 'text-sky-400 font-medium',
      border: 'border-sky-500/30',
      dot: 'bg-sky-400',
    },
    INFORMATIONAL: {
      bg: 'bg-slate-700/30',
      text: 'text-slate-400 font-normal',
      border: 'border-slate-700/50',
      dot: 'bg-slate-500',
    },
  };

  const current = styleMap[normLevel] || styleMap.INFORMATIONAL;
  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border font-mono tracking-wider uppercase transition-colors ${current.bg} ${current.text} ${current.border} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${current.dot}`} />
      <span>{normLevel}</span>
    </span>
  );
};
