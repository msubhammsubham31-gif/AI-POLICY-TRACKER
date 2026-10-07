import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, Building2, Package, CheckSquare, Compass, ShieldAlert, ArrowRight } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // parent handles toggling
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const quickLinks = [
    { name: 'Executive Dashboard', path: '/app/dashboard', icon: Compass, category: 'Navigation' },
    { name: 'Global Regulatory Map ("Google Maps for Laws")', path: '/app/map', icon: Compass, category: 'Navigation' },
    { name: 'Master Regulatory Directory', path: '/app/regulations', icon: FileText, category: 'Navigation' },
    { name: 'Regulatory Changes & Drift Feed', path: '/app/changes', icon: ShieldAlert, category: 'Navigation' },
    { name: 'Compliance Action Tracker', path: '/app/actions', icon: CheckSquare, category: 'Navigation' },
    { name: 'Operating Facilities (Dresden, Austin, Antwerp, Osaka)', path: '/app/facilities', icon: Building2, category: 'Assets' },
    { name: 'Company Products & Materials', path: '/app/products', icon: Package, category: 'Assets' },
    { name: 'Grounded AI Compliance Assistant', path: '/app/assistant', icon: Search, category: 'AI Tools' },
    { name: 'EU REACH PFAS Universal Ban', path: '/app/regulations/reg-002', icon: FileText, category: 'Regulation' },
    { name: 'EU Battery Passport Regulation', path: '/app/regulations/reg-006', icon: FileText, category: 'Regulation' },
    { name: 'US EPA TSCA Section 8(a)(7) PFAS Rule', path: '/app/regulations/reg-007', icon: FileText, category: 'Regulation' },
    { name: 'California SB 253 Climate Disclosure', path: '/app/regulations/reg-008', icon: FileText, category: 'Regulation' },
  ];

  const filtered = quickLinks.filter(item =>
    item.name.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-800">
          <Search className="w-5 h-5 text-slate-400 shrink-0 mr-3" />
          <input
            type="text"
            placeholder="Type a command, regulation, facility, or search term... (Esc to exit)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-800 rounded border border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500">
              No results found for "{query}".
            </div>
          ) : (
            filtered.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={index}
                  onClick={() => handleSelect(item.path)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-slate-800 group-hover:bg-emerald-500/20 group-hover:text-emerald-400 text-slate-400 transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-[11px] text-slate-500">{item.category}</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" />
                </button>
              );
            })
          )}
        </div>

        <div className="border-t border-slate-800 bg-slate-950/60 px-4 py-2 flex items-center justify-between text-[11px] text-slate-500">
          <span>Navigate with mouse or arrow keys</span>
          <span>RegulaMap Command Hub</span>
        </div>
      </div>
    </div>
  );
};
