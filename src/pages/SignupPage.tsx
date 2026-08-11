import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Workflow, Loader2, Mail, Lock, AlertCircle, CheckCircle2, User } from 'lucide-react';
import { useAuth } from '../AuthContext';

export function SignupPage() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!displayName.trim()) {
      setError('Display name is required.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    const { error } = await signUp(email, password, displayName.trim());

    if (error) {
      setError(getErrorMessage(error.message));
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="relative min-h-screen overflow-x-hidden bg-ink-950 text-ink-100">
        {/* Ambient background */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 grid-bg opacity-60" />
          <div className="absolute -top-40 left-1/2 h-[480px] w-[820px] -translate-x-1/2 rounded-full bg-brand-600/20 blur-[120px]" />
        </div>

        <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-12 sm:px-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 shadow-lift">
              <Workflow size={20} className="text-white" strokeWidth={2.2} />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight text-white">
                DocuAI
              </p>
              <p className="text-xs text-ink-400">Private document intelligence</p>
            </div>
          </Link>

          {/* Success Card */}
          <div className="mt-10 glass rounded-2xl border border-white/10 p-6 shadow-soft sm:p-8">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success-500/20">
                <CheckCircle2 size={32} className="text-success-400" />
              </div>
            </div>
            <h1 className="mt-6 text-center text-2xl font-bold text-white">
              Account created!
            </h1>
            <p className="mt-3 text-center text-sm text-ink-400">
              We've sent a confirmation link to{' '}
              <span className="text-ink-200">{email}</span>. Click the link in the email to activate
              your account.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="mt-6 w-full rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 py-2.5 text-sm font-semibold text-white shadow-lift transition hover:from-brand-400 hover:to-brand-500"
            >
              Continue to sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

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
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 shadow-lift">
            <Workflow size={20} className="text-white" strokeWidth={2.2} />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight text-white">
                DocuAI
            </p>
              <p className="text-xs text-ink-400">Private document intelligence</p>
          </div>
        </Link>

        {/* Card */}
        <div className="mt-10 glass rounded-2xl border border-white/10 p-6 shadow-soft sm:p-8">
          <h1 className="text-2xl font-bold text-white">Create an account</h1>
          <p className="mt-2 text-sm text-ink-400">
            Get started with DocuAI for free
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-danger-500/30 bg-danger-500/10 px-4 py-3">
                <AlertCircle size={18} className="mt-0.5 shrink-0 text-danger-400" />
                <p className="text-sm text-danger-300">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="displayName" className="block text-sm font-medium text-ink-200">
                Display name
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  required
                  autoComplete="name"
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-ink-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/50"
                />
              </div>
            </div>

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
              <label htmlFor="password" className="block text-sm font-medium text-ink-200">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-ink-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-ink-200">
                Confirm password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                  autoComplete="new-password"
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
                  Creating account…
                </span>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-400">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-brand-400 transition hover:text-brand-300">
              Sign in
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
  if (message.includes('already registered')) {
    return 'An account with this email already exists.';
  }
  if (message.includes('Password')) {
    return 'Password does not meet requirements.';
  }
  return message || 'An error occurred. Please try again.';
}
