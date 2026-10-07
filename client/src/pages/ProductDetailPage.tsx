import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Package, ArrowLeft, Building2, CheckSquare, Layers, ShieldCheck, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { Product } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { RiskBadge } from '../components/common/RiskBadge';
import { LegalDisclaimer } from '../components/common/LegalDisclaimer';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api.products.getById(id)
      .then(res => setProduct(res))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading || !product) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-400 font-mono text-xs">
        Loading product bill of materials...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <button
          onClick={() => navigate('/app/products')}
          className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Products Directory</span>
        </button>

        <span className="text-xs font-mono px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
          SKU: {product.sku}
        </span>
      </div>

      {/* Hero Header */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 glass-panel space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono uppercase text-emerald-400 font-semibold">
          <span>{product.category}</span>
          <span>•</span>
          <span>Target Markets: {product.markets?.join(', ')}</span>
        </div>

        <h1 className="text-2xl font-bold text-white tracking-tight">
          {product.name}
        </h1>

        <div className="pt-2">
          <LegalDisclaimer compact />
        </div>
      </div>

      {/* Bill of Materials (BOM) Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 glass-panel space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
              Chemical & Material Bill of Materials (BOM)
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">Total Formulated Weight: 100.0%</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3 font-semibold uppercase">Component Material</th>
                <th className="py-2.5 px-3 font-semibold uppercase">CAS Registry No.</th>
                <th className="py-2.5 px-3 font-semibold uppercase text-right">% Weight</th>
                <th className="py-2.5 px-3 font-semibold uppercase">Primary Supplier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {product.materials?.map((m, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30">
                  <td className="py-3 px-3 font-medium text-white">{m.name}</td>
                  <td className="py-3 px-3 text-emerald-400">{m.cas || 'Confidential Polymeric'}</td>
                  <td className="py-3 px-3 text-right font-bold text-white">{m.percentageWeight}%</td>
                  <td className="py-3 px-3 text-slate-400">{m.supplier}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Linked Facilities & Work Orders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 glass-panel space-y-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Building2 className="w-4 h-4 text-cyan-400" />
            <span>Manufacturing Facilities</span>
          </div>
          <div className="space-y-2">
            {product.mappedFacilities?.map(f => (
              <div
                key={f.id}
                onClick={() => navigate(`/app/facilities/${f.id}`)}
                className="p-3 rounded-xl border border-slate-800 bg-slate-950/40 hover:bg-slate-800/40 transition-colors cursor-pointer text-xs"
              >
                <div className="font-semibold text-white">{f.name}</div>
                <div className="text-slate-400 text-[11px]">{f.location} • {f.facilityType}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 glass-panel space-y-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <CheckSquare className="w-4 h-4 text-emerald-400" />
            <span>Related Compliance Actions</span>
          </div>
          <div className="space-y-2">
            {product.relatedActions && product.relatedActions.length > 0 ? (
              product.relatedActions.map(a => (
                <div
                  key={a.id}
                  onClick={() => navigate(`/app/actions/${a.id}`)}
                  className="p-3 rounded-xl border border-slate-800 bg-slate-950/40 hover:bg-slate-800/40 transition-colors cursor-pointer text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <StatusBadge status={a.status} size="sm" />
                    <RiskBadge level={a.priority} size="sm" />
                  </div>
                  <div className="font-semibold text-white">{a.title}</div>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-500 p-4 text-center">
                All regulatory requirements for this SKU are currently fulfilled.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
