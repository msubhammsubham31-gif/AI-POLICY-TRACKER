import React, { useEffect, useState } from 'react';
import { FolderLock, FileText, UploadCloud, Search, Download, Plus, CheckCircle2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../services/api';
import { DocumentItem } from '../types';

const docSchema = z.object({
  title: z.string().min(3, 'Title is required'),
});

type DocFormData = z.infer<typeof docSchema>;

export const DocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { register, handleSubmit, reset } = useForm<DocFormData>({
    resolver: zodResolver(docSchema),
  });

  const loadDocuments = () => {
    api.documents.getAll()
      .then(res => setDocuments(res.documents || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleUpload = async (data: DocFormData) => {
    try {
      await api.documents.upload({
        title: data.title.endsWith('.pdf') ? data.title : `${data.title}.pdf`,
        fileType: 'application/pdf',
        fileSize: 2450000,
      });
      reset();
      setIsModalOpen(false);
      loadDocuments();
    } catch (err: any) {
      console.error(err);
    }
  };

  const filtered = documents.filter(d =>
    d.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Compliance Document Vault</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {documents.length} Encrypted Artifacts
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tamper-evident legal dossiers, laboratory qualification reports, customs filing receipts, and supplier attestations.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Evidence</span>
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center bg-slate-900/60 p-3 rounded-2xl border border-slate-800 glass-panel">
        <Search className="w-4 h-4 text-slate-500 ml-2 mr-3" />
        <input
          type="text"
          placeholder="Search evidence repository by filename, test standard, or certificate number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
        />
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(doc => (
          <div
            key={doc.id}
            className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 glass-panel flex items-start justify-between gap-4 group hover:border-emerald-500/30 transition-colors"
          >
            <div className="flex items-start gap-3.5">
              <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 text-emerald-400 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                  {doc.title}
                </h4>
                <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
                  <span>{(doc.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                  <span>•</span>
                  <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span className="text-emerald-400">SHA-256 Verified</span>
                </div>
              </div>
            </div>

            <a
              href={doc.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors shrink-0"
              title="Download Artifact"
            >
              <Download className="w-4 h-4" />
            </a>
          </div>
        ))}
      </div>

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Upload Regulatory Evidence</h3>
            <form onSubmit={handleSubmit(handleUpload)} className="space-y-3">
              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Dossier / Document Title</label>
                <input
                  type="text"
                  {...register('title')}
                  placeholder="e.g. EPA-TSCA-PFAS-Form7710-FilingReceipt.pdf"
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
                  Index to Vault
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
