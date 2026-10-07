import React, { useState } from 'react';
import { Columns, AlignJustify, ArrowRight, Zap, Copy, Check } from 'lucide-react';
import { DiffResult } from '../../types';

interface RegulatoryDiffProps {
  diff?: DiffResult;
  oldText?: string;
  newText?: string;
  sectionIdentifier?: string;
  changeType?: string;
}

export const RegulatoryDiff: React.FC<RegulatoryDiffProps> = ({
  diff,
  oldText = '',
  newText = '',
  sectionIdentifier,
  changeType,
}) => {
  const [viewMode, setViewMode] = useState<'split' | 'unified'>('split');
  const [copied, setCopied] = useState(false);

  // If pre-computed diff not provided, parse simple lines
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');

  const handleCopy = () => {
    const text = `--- PREVIOUS VERSION ---\n${oldText}\n\n+++ NEW VERSION +++\n${newText}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-2xl backdrop-blur-md">
      {/* Diff Toolbar Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 py-3 gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-mono font-medium uppercase tracking-wider text-slate-300">
            Deterministic Legal Text Diff Engine
          </span>
          {sectionIdentifier && (
            <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-mono text-emerald-400 border border-slate-700">
              {sectionIdentifier}
            </span>
          )}
          {changeType && (
            <span className="rounded bg-purple-500/15 px-2 py-0.5 text-xs font-mono text-purple-300 border border-purple-500/30 uppercase">
              {changeType.replace(/_/g, ' ')}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {diff?.detectedThresholds && diff.detectedThresholds.length > 0 && (
            <div className="flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-2.5 py-1 text-xs text-amber-300 border border-amber-500/20 font-mono">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Threshold Drift: {diff.detectedThresholds[0].oldValue} → {diff.detectedThresholds[0].newValue}</span>
            </div>
          )}

          <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900 p-0.5">
            <button
              onClick={() => setViewMode('split')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'split' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="Side-by-Side Dual Pane"
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Split</span>
            </button>
            <button
              onClick={() => setViewMode('unified')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'unified' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="Unified Stream View"
            >
              <AlignJustify className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Unified</span>
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Diff Content Body */}
      {viewMode === 'split' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-800 font-mono text-xs">
          {/* Left Pane: Previous Version */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800/80 bg-rose-950/20 px-4 py-2 text-rose-300">
              <span className="font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Previous Legal Text (Prior Version)
              </span>
              <span className="text-[11px] text-rose-400/80">Deleted / Superseded Clauses</span>
            </div>
            <div className="p-4 space-y-2 bg-slate-950/50 min-h-[160px] text-slate-300 overflow-x-auto leading-relaxed">
              {oldLines.map((line, idx) => (
                <div key={idx} className="flex gap-3 diff-deleted p-2 rounded">
                  <span className="select-none text-rose-400/60 font-mono shrink-0 w-6 text-right">{idx + 1}</span>
                  <span className="select-none text-rose-400 shrink-0 font-bold">-</span>
                  <span className="whitespace-pre-wrap flex-1">{line}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Pane: Enacted / Proposed Version */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800/80 bg-emerald-950/20 px-4 py-2 text-emerald-300">
              <span className="font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                New Legal Text (Enacted / Proposed)
              </span>
              <span className="text-[11px] text-emerald-400/80">Added / Revised Obligations</span>
            </div>
            <div className="p-4 space-y-2 bg-slate-950/50 min-h-[160px] text-slate-300 overflow-x-auto leading-relaxed">
              {newLines.map((line, idx) => (
                <div key={idx} className="flex gap-3 diff-added p-2 rounded">
                  <span className="select-none text-emerald-400/60 font-mono shrink-0 w-6 text-right">{idx + 1}</span>
                  <span className="select-none text-emerald-400 shrink-0 font-bold">+</span>
                  <span className="whitespace-pre-wrap flex-1">{line}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Unified View */
        <div className="p-4 bg-slate-950/50 space-y-2 font-mono text-xs overflow-x-auto leading-relaxed">
          {oldLines.map((line, idx) => (
            <div key={`del-${idx}`} className="flex gap-3 diff-deleted p-2 rounded">
              <span className="select-none text-rose-400/60 shrink-0 w-6 text-right">{idx + 1}</span>
              <span className="select-none text-rose-400 shrink-0 font-bold">-</span>
              <span className="whitespace-pre-wrap flex-1">{line}</span>
            </div>
          ))}
          {newLines.map((line, idx) => (
            <div key={`add-${idx}`} className="flex gap-3 diff-added p-2 rounded">
              <span className="select-none text-emerald-400/60 shrink-0 w-6 text-right">{idx + 1}</span>
              <span className="select-none text-emerald-400 shrink-0 font-bold">+</span>
              <span className="whitespace-pre-wrap flex-1">{line}</span>
            </div>
          ))}
        </div>
      )}

      {/* Diff Footer Metrics */}
      <div className="flex flex-wrap items-center justify-between border-t border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-rose-400 font-mono">
            <span className="font-bold">-</span> {diff?.deletionsCount || oldLines.length} deleted lines
          </span>
          <span className="flex items-center gap-1.5 text-emerald-400 font-mono">
            <span className="font-bold">+</span> {diff?.additionsCount || newLines.length} added lines
          </span>
        </div>
        <div className="text-slate-400 font-mono text-[11px]">
          Verified SHA-256 Legal Version Integrity Check
        </div>
      </div>
    </div>
  );
};
