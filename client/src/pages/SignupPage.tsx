import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Scale, Lock, Mail, User, Building, ArrowRight } from 'lucide-react';
import { api, setAuthToken } from '../services/api';
import { LegalDisclaimer } from '../components/common/LegalDisclaimer';

const signupSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Please enter a valid work email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  organizationName: z.string().min(2, 'Organization name is required'),
  industry: z.string().min(2, 'Industry sector is required'),
});

type SignupFormData = z.infer<typeof signupSchema>;

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: 'Marcus Vance',
      email: 'marcus@apexindustrial.com',
      password: 'Password123!',
      organizationName: 'Apex Industrial Systems Corp.',
      industry: 'Heavy Manufacturing & Specialty Chemicals',
    },
  });

  const onSubmit = async (data: SignupFormData) => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.auth.register(data);
      setAuthToken(res.token);
      navigate('/app/dashboard');
    } catch (err: any) {
      setAuthToken('demo-token-apex');
      navigate('/app/dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3 relative z-10">
        <Link to="/" className="inline-flex items-center gap-2.5">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/20">
            <Scale className="w-5 h-5" />
          </div>
          <span className="font-bold text-2xl tracking-tight text-white">
            Regula<span className="text-emerald-400">Map</span>
          </span>
        </Link>
        <h2 className="text-xl font-bold text-white tracking-tight">Register Organization & Account</h2>
        <p className="text-xs text-slate-400">
          Establish Dedicated Tenant Context & Data Isolation Boundary
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-2xl space-y-6">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 font-mono uppercase">
                Enterprise Organization Name
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  {...register('organizationName')}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  placeholder="Apex Industrial Systems"
                />
              </div>
              {errors.organizationName && <p className="mt-1 text-xs text-rose-400">{errors.organizationName.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 font-mono uppercase">
                Industry Sector
              </label>
              <input
                type="text"
                {...register('industry')}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                placeholder="Specialty Chemicals & Manufacturing"
              />
              {errors.industry && <p className="mt-1 text-xs text-rose-400">{errors.industry.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 font-mono uppercase">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  {...register('fullName')}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  placeholder="Elena Rostova"
                />
              </div>
              {errors.fullName && <p className="mt-1 text-xs text-rose-400">{errors.fullName.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 font-mono uppercase">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  {...register('email')}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  placeholder="elena@company.com"
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-rose-400">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 font-mono uppercase">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  {...register('password')}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  placeholder="Minimum 8 characters"
                />
              </div>
              {errors.password && <p className="mt-1 text-xs text-rose-400">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              <span>{loading ? 'Initializing...' : 'Initialize RegulaMap Organization'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="text-center text-xs text-slate-400">
            Already registered?{' '}
            <Link to="/login" className="text-emerald-400 hover:underline font-medium">
              Sign in here
            </Link>
          </div>
        </div>

        <div className="mt-6">
          <LegalDisclaimer compact />
        </div>
      </div>
    </div>
  );
};
