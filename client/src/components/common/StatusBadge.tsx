import React from 'react';
import { ActionStatus, ReviewStatus, RegulationStatus } from '../../types';

interface StatusBadgeProps {
  status: ActionStatus | ReviewStatus | RegulationStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const norm = (status || 'UNKNOWN').toUpperCase();

  let color = 'bg-slate-800 text-slate-300 border-slate-700';

  if (norm === 'COMPLETED' || norm === 'APPROVED' || norm === 'ENACTED') {
    color = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
  } else if (norm === 'IN_PROGRESS' || norm === 'UNDER_REVIEW') {
    color = 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30';
  } else if (norm === 'OPEN' || norm === 'PENDING') {
    color = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
  } else if (norm === 'BLOCKED' || norm === 'REJECTED' || norm === 'REPEALED') {
    color = 'bg-rose-500/15 text-rose-400 border-rose-500/30';
  } else if (norm === 'MODIFIED' || norm === 'AMENDED' || norm === 'PROPOSED') {
    color = 'bg-purple-500/15 text-purple-400 border-purple-500/30';
  }

  const sizeClass = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center rounded-md border font-medium uppercase font-mono tracking-wide ${color} ${sizeClass}`}
    >
      {norm.replace(/_/g, ' ')}
    </span>
  );
};
