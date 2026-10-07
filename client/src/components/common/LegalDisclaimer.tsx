import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

interface LegalDisclaimerProps {
  compact?: boolean;
}

export const LegalDisclaimer: React.FC<LegalDisclaimerProps> = ({ compact = false }) => {
  return (
    <div
      role="note"
      aria-label="Legal Notice"
      className={`rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200 shadow-sm ${
        compact ? 'px-3 py-2 text-xs flex items-center gap-2' : 'p-4 text-sm flex items-start gap-3'
      }`}
    >
      <AlertTriangle className={`text-amber-400 shrink-0 ${compact ? 'w-4 h-4' : 'w-5 h-5 mt-0.5'}`} />
      <div className="flex-1">
        <div className="font-semibold text-amber-300">Mandatory Regulatory Notice</div>
        <div className="text-amber-200/90 leading-relaxed">
          AI-generated regulatory analysis is not legal advice. Verify material obligations against authoritative sources and qualified professionals.
        </div>
      </div>
      {!compact && (
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 text-xs font-mono font-medium shrink-0">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>RLS & Audit Guard Active</span>
        </div>
      )}
    </div>
  );
};
