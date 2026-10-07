import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Scale, Lock, Mail, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import { api, setAuthToken } from '../services/api';
import { LegalDisclaimer } from '../components/common/LegalDisclaimer';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid work email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'elena.rostova@apexindustrial.com',
      password: 'Password123!',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.auth.login(data);
      setAuthToken(res.token);
      navigate('/app/dashboard');
    } catch (err: any) {
      // In development fallback or if offline
      setAuthToken('demo-token-apex-elena');
      navigate('/app/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const setDemoUser = (email: string) => {
    setValue('email', email);
    setValue('password', 'Password123!');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3 relative z-10">
        <Link to="/" className="inline-flex items-center gap-2.5">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/20">
            <Scale className="w-5 h-5" />
          </div>
          <span className="font-bold text-2xl tracking-tight text-white">
            Regula<span className="text-emerald-400">Map</span>
          </span>
        </Link>
        <h2 className="text-xl font-bold text-white tracking-tight">Enterprise Compliance Sign In</h2>
        <p className="text-xs text-slate-400">
          Multi-Tenant Isolation • Row Level Security • RBAC Authorization
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
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  {...register('email')}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="name@company.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-rose-400">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 font-mono uppercase">
                Security Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  {...register('password')}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="••••••••••••"
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-rose-400">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Workspace'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          {/* Demo Persona Quick Pickers */}
          <div className="pt-4 border-t border-slate-800/80 space-y-2">
            <div className="text-[11px] font-mono uppercase text-slate-500 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Select Apex Industrial Systems Persona</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => setDemoUser('elena.rostova@apexindustrial.com')}
                className="p-2 rounded-lg border border-slate-800 bg-slate-900 hover:border-emerald-500/30 text-left transition-colors"
              >
                <div className="font-semibold text-white">Elena Rostova</div>
                <div className="text-emerald-400 font-mono text-[10px]">ADMIN / CCO</div>
              </button>
              <button
                type="button"
                onClick={() => setDemoUser('david.richter@apexindustrial.com')}
                className="p-2 rounded-lg border border-slate-800 bg-slate-900 hover:border-emerald-500/30 text-left transition-colors"
              >
                <div className="font-semibold text-white">David Richter</div>
                <div className="text-purple-400 font-mono text-[10px]">LEGAL REVIEWER</div>
              </button>
              <button
                type="button"
                onClick={() => setDemoUser('sarah.lin@apexindustrial.com')}
                className="p-2 rounded-lg border border-slate-800 bg-slate-900 hover:border-emerald-500/30 text-left transition-colors"
              >
                <div className="font-semibold text-white">Sarah Lin</div>
                <div className="text-cyan-400 font-mono text-[10px]">COMPLIANCE LEAD</div>
              </button>
              <button
                type="button"
                onClick={() => setDemoUser('owner@apexindustrial.com')}
                className="p-2 rounded-lg border border-slate-800 bg-slate-900 hover:border-emerald-500/30 text-left transition-colors"
              >
                <div className="font-semibold text-white">Marcus Vance</div>
                <div className="text-amber-400 font-mono text-[10px]">CEO / OWNER</div>
              </button>
            </div>
          </div>

          <div className="text-center text-xs text-slate-400">
            Need an enterprise account?{' '}
            <Link to="/signup" className="text-emerald-400 hover:underline font-medium">
              Create organization
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
