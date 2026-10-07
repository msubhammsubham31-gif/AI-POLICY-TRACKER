import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Search, Plus, ArrowRight, ShieldCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../services/api';
import { Product } from '../types';

const productSchema = z.object({
  name: z.string().min(2, 'Product name is required'),
  sku: z.string().min(2, 'SKU is required'),
  category: z.string().min(2, 'Category is required'),
});

type ProductFormData = z.infer<typeof productSchema>;

export const ProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { register, handleSubmit, reset } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  });

  const loadProducts = () => {
    api.products.getAll()
      .then(res => setProducts(res.products || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleCreate = async (data: ProductFormData) => {
    try {
      await api.products.create({ ...data, markets: ['EU', 'US'] });
      reset();
      setIsModalOpen(false);
      loadProducts();
    } catch (err: any) {
      console.error(err);
    }
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Company Products & Material BOMs</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {products.length} Active Catalog Lines
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Finished commercial articles and chemical formulations mapped against global material restriction standards.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center bg-slate-900/60 p-3 rounded-2xl border border-slate-800 glass-panel">
        <Search className="w-4 h-4 text-slate-500 ml-2 mr-3" />
        <input
          type="text"
          placeholder="Search products by SKU, name, or formulation category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
        />
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {filtered.map(prod => (
          <div
            key={prod.id}
            onClick={() => navigate(`/app/products/${prod.id}`)}
            className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 glass-panel glass-card-hover cursor-pointer flex flex-col justify-between space-y-3 group"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase font-bold">
                  {prod.category}
                </span>
                <span className="text-[10px] font-mono text-slate-400">{prod.sku}</span>
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                {prod.name}
              </h3>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-[11px] font-mono text-slate-400">
                Markets: {prod.markets?.join(', ') || 'Global'}
              </span>
              <span className="text-emerald-400 flex items-center gap-1 font-medium group-hover:translate-x-0.5 transition-transform">
                <span>BOM</span>
                <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Register New Product Line</h3>
            <form onSubmit={handleSubmit(handleCreate)} className="space-y-3">
              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Product Name</label>
                <input
                  type="text"
                  {...register('name')}
                  placeholder="e.g. Apex Bio-Resin Composite"
                  className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Product SKU</label>
                <input
                  type="text"
                  {...register('sku')}
                  placeholder="e.g. ABR-COMP-01"
                  className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Category</label>
                <input
                  type="text"
                  {...register('category')}
                  placeholder="e.g. Circular Packaging"
                  className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
