import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, Mail, Lock, AlertCircle, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { DocuAIBrand } from '../components/DocuAIBrand';
import { supabase } from '../lib/supabase';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<'user' | 'admin'>(
    searchParams.get('mode') === 'admin' ? 'admin' : 'user',
  );
  const { signIn, signOut, refreshAdmin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setError(getErrorMessage(error.message));
      setLoading(false);
      return;
    }

    if (mode === 'admin') {
      const { error: bootstrapError } = await supabase.functions.invoke('admin-bootstrap', {
        method: 'POST',
      });

      if (bootstrapError || !(await refreshAdmin())) {
        await signOut();
        setError('This account is not authorized for the admin dashboard.');
        setLoading(false);
        return;
      }

      navigate('/admin');
      return;
    }

    navigate('/app');
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-ink-950 text-ink-100">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 grid-bg opacity-60" />
        <div className="absolute -top-40 left-1/2 h-[480px] w-[820px] -translate-x-1/2 rounded-full bg-brand-600/20 blur-[120px]" />
        <div className="absolute top-32 -right-24 h-[360px] w-[360px] rounded-full bg-accent-500/10 blur-[100px]" />
        <div className="absolute bottom-0 -left-24 h-[320px] w-[320px] rounded-full bg-brand-700/20 blur-[110px]" />
      </div>

      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-12 sm:px-8">
        {/* Logo */}
        <Link to="/" className="inline-flex">
          <DocuAIBrand subtitle="Private document intelligence" />
        </Link>

        {/* Card */}
        <div className="mt-10 glass rounded-2xl border border-white/10 p-6 shadow-soft sm:p-8">
          <h1 className="text-2xl font-bold text-white">
            {mode === 'admin' ? 'Admin access' : 'Welcome back'}
          </h1>
          <p className="mt-2 text-sm text-ink-400">
            {mode === 'admin'
              ? 'Use the Supabase account authorized by your admin allowlist.'
              : 'Sign in to your account to continue'}
          </p>

          <div className="mt-6 grid grid-cols-2 rounded-xl border border-white/10 bg-black/20 p-1">
            <button
              type="button"
              onClick={() => { setMode('user'); setError(null); }}
              className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                mode === 'user' ? 'bg-white/10 text-white' : 'text-ink-500 hover:text-ink-200'
              }`}
            >
              <User size={15} /> User
            </button>
            <button
              type="button"
              onClick={() => { setMode('admin'); setError(null); }}
              className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                mode === 'admin' ? 'bg-brand-500/15 text-brand-200' : 'text-ink-500 hover:text-ink-200'
              }`}
            >
              <ShieldCheck size={15} /> Admin
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-5">
            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-danger-500/30 bg-danger-500/10 px-4 py-3">
                <AlertCircle size={18} className="mt-0.5 shrink-0 text-danger-400" />
                <p className="text-sm text-danger-300">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-ink-200">
                Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-ink-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-ink-200">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs text-brand-400 transition hover:text-brand-300">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-ink-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 py-2.5 text-sm font-semibold text-white shadow-lift transition hover:from-brand-400 hover:to-brand-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  Verifying...
                </span>
              ) : (
                mode === 'admin' ? 'Sign in as admin' : 'Sign in'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-400">
            Don't have an account?{' '}
            <Link to="/signup" className="font-medium text-brand-400 transition hover:text-brand-300">
              Create one
            </Link>
          </p>
        </div>

        {/* Footer */}
          <p className="mt-auto pt-8 text-center text-xs text-ink-500">
          Built for secure document intelligence.
        </p>
      </div>
    </div>
  );
}

function getErrorMessage(message: string): string {
  if (message.includes('Invalid login credentials')) {
    return 'Invalid email or password. Please try again.';
  }
  if (message.includes('Email not confirmed')) {
    return 'Please check your email inbox to confirm your account.';
  }
  return message || 'An error occurred. Please try again.';
}
