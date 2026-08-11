import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Workflow,
  Loader2,
  Lock,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowLeft,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../AuthContext';

type Status = 'loading' | 'ready' | 'error_token' | 'submitting' | 'success';

function getStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { score, label: 'Weak', color: 'bg-danger-500' };
  if (score <= 2) return { score, label: 'Fair', color: 'bg-warning-400' };
  if (score <= 3) return { score, label: 'Good', color: 'bg-brand-400' };
  return { score, label: 'Strong', color: 'bg-success-400' };
}

export function ResetPasswordPage() {
  const [status, setStatus] = useState<Status>('loading');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { updatePassword } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const type = params.get('type');

    if (accessToken && refreshToken && type === 'recovery') {
      supabase.auth
        .setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ error }) => {
          if (error) {
            setStatus('error_token');
          } else {
            setStatus('ready');
            window.history.replaceState(null, '', window.location.pathname);
          }
        });
      return;
    }

    // Already has an active session (e.g. user is already signed in on the same device)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setStatus('ready');
      } else {
        setStatus('error_token');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setStatus('ready');
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setStatus('submitting');
    const { error } = await updatePassword(password);

    if (error) {
      setError('Failed to update password. The link may have expired — please request a new one.');
      setStatus('ready');
    } else {
      setStatus('success');
      setTimeout(() => navigate('/'), 2500);
    }
  };

  const strength = getStrength(password);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-ink-950 text-ink-100">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 grid-bg opacity-60" />
        <div className="absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-brand-600/20 blur-[140px]" />
        <div className="absolute top-32 -right-24 h-[360px] w-[360px] rounded-full bg-accent-500/10 blur-[100px]" />
        <div className="absolute bottom-0 -left-24 h-[320px] w-[320px] rounded-full bg-brand-700/20 blur-[110px]" />
      </div>

      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-12 sm:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 shadow-lift">
            <Workflow size={20} className="text-white" strokeWidth={2.2} />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight text-white">DocuAI</p>
            <p className="text-xs text-ink-400">Private document intelligence</p>
          </div>
        </Link>

        {/* Card */}
        <div className="mt-10 glass rounded-2xl border border-white/10 shadow-soft">
          {/* Loading state */}
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-4 px-6 py-14 sm:px-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-500/15">
                <Loader2 size={28} className="animate-spin text-brand-400" />
              </div>
              <p className="text-sm text-ink-400">Verifying your reset link…</p>
            </div>
          )}

          {/* Invalid / expired token */}
          {status === 'error_token' && (
            <div className="px-6 py-10 text-center sm:px-8">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-danger-500/15 ring-1 ring-danger-500/20">
                <AlertCircle size={28} className="text-danger-400" />
              </div>
              <h1 className="text-xl font-bold text-white">Link expired or invalid</h1>
              <p className="mt-3 text-sm leading-relaxed text-ink-400">
                This reset link has already been used or has expired. Reset links are valid for{' '}
                <span className="text-ink-200">1 hour</span>. Please request a fresh one.
              </p>
              <Link
                to="/forgot-password"
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 py-2.5 text-sm font-semibold text-white shadow-lift transition hover:from-brand-400 hover:to-brand-500"
              >
                Request new link
              </Link>
              <Link
                to="/login"
                className="mt-3 flex items-center justify-center gap-2 text-sm text-ink-400 transition hover:text-ink-200"
              >
                <ArrowLeft size={14} />
                Back to sign in
              </Link>
            </div>
          )}

          {/* Success state */}
          {status === 'success' && (
            <div className="px-6 py-10 text-center sm:px-8">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-success-500/15 ring-1 ring-success-500/20">
                <CheckCircle2 size={28} className="text-success-400" />
              </div>
              <h1 className="text-2xl font-bold text-white">Password updated!</h1>
              <p className="mt-3 text-sm leading-relaxed text-ink-400">
                Your password has been changed successfully. You'll be redirected to the dashboard
                in a moment.
              </p>
              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-ink-500">
                <Loader2 size={12} className="animate-spin" />
                Redirecting…
              </div>
            </div>
          )}

          {/* Form */}
          {(status === 'ready' || status === 'submitting') && (
            <div className="p-6 sm:p-8">
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500/15 ring-1 ring-brand-500/20">
                  <ShieldCheck size={20} className="text-brand-400" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Set new password</h1>
                  <p className="text-sm text-ink-400">Choose something strong and unique</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                {error && (
                  <div className="flex items-start gap-3 rounded-xl border border-danger-500/30 bg-danger-500/10 px-4 py-3">
                    <AlertCircle size={16} className="mt-0.5 shrink-0 text-danger-400" />
                    <p className="text-sm text-danger-300">{error}</p>
                  </div>
                )}

                {/* New password */}
                <div className="space-y-2">
                  <label htmlFor="new-password" className="block text-sm font-medium text-ink-200">
                    New password
                  </label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                    <input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      required
                      autoFocus
                      autoComplete="new-password"
                      className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-10 text-sm text-white placeholder:text-ink-500 transition focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 transition hover:text-ink-200"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>

                  {/* Strength meter */}
                  {password.length > 0 && (
                    <div className="space-y-1.5 pt-0.5">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={[
                              'h-1 flex-1 rounded-full transition-all duration-300',
                              strength.score >= i ? strength.color : 'bg-white/10',
                            ].join(' ')}
                          />
                        ))}
                      </div>
                      <p className={[
                        'text-xs font-medium transition-colors',
                        strength.score <= 1 ? 'text-danger-400' :
                        strength.score <= 2 ? 'text-warning-400' :
                        strength.score <= 3 ? 'text-brand-400' : 'text-success-400',
                      ].join(' ')}>
                        {strength.label} password
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div className="space-y-2">
                  <label htmlFor="confirm-password" className="block text-sm font-medium text-ink-200">
                    Confirm new password
                  </label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                    <input
                      id="confirm-password"
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat your new password"
                      required
                      autoComplete="new-password"
                      className={[
                        'w-full rounded-xl border bg-white/5 py-2.5 pl-10 pr-10 text-sm text-white placeholder:text-ink-500 transition focus:outline-none focus:ring-1',
                        confirmPassword.length > 0 && password !== confirmPassword
                          ? 'border-danger-500/50 focus:border-danger-500 focus:ring-danger-500/30'
                          : confirmPassword.length > 0 && password === confirmPassword
                          ? 'border-success-500/50 focus:border-success-500 focus:ring-success-500/30'
                          : 'border-white/10 focus:border-brand-500 focus:ring-brand-500/50',
                      ].join(' ')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 transition hover:text-ink-200"
                    >
                      {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                    {confirmPassword.length > 0 && (
                      <div className="absolute right-9 top-1/2 -translate-y-1/2">
                        {password === confirmPassword ? (
                          <CheckCircle2 size={14} className="text-success-400" />
                        ) : (
                          <AlertCircle size={14} className="text-danger-400" />
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="w-full rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 py-2.5 text-sm font-semibold text-white shadow-lift transition hover:from-brand-400 hover:to-brand-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {status === 'submitting' ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      Updating password…
                    </span>
                  ) : (
                    'Update password'
                  )}
                </button>
              </form>

              <Link
                to="/login"
                className="mt-5 flex items-center justify-center gap-2 text-sm text-ink-400 transition hover:text-ink-200"
              >
                <ArrowLeft size={14} />
                Back to sign in
              </Link>
            </div>
          )}
        </div>

        <p className="mt-auto pt-8 text-center text-xs text-ink-500">
          Built for secure document intelligence.
        </p>
      </div>
    </div>
  );
}
