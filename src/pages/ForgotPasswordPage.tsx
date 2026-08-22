import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Mail, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { DocuAIBrand } from '../components/DocuAIBrand';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const { sendPasswordReset } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await sendPasswordReset(email.trim());
    setLoading(false);

    if (error) {
      setError('Failed to send reset email. Please check the address and try again.');
    } else {
      setSent(true);
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-ink-950 text-ink-100">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 grid-bg opacity-60" />
        <div className="absolute -top-40 left-1/2 h-[480px] w-[820px] -translate-x-1/2 rounded-full bg-brand-600/20 blur-[120px]" />
        <div className="absolute top-32 -right-24 h-[360px] w-[360px] rounded-full bg-accent-500/10 blur-[100px]" />
        <div className="absolute bottom-0 -left-24 h-[320px] w-[320px] rounded-full bg-brand-700/20 blur-[110px]" />
      </div>

      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-12 sm:px-8">
        <Link to="/" className="inline-flex">
          <DocuAIBrand subtitle="Private document intelligence" />
        </Link>

        <div className="mt-10 glass rounded-2xl border border-white/10 p-6 shadow-soft sm:p-8">
          {sent ? (
            <div className="text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-success-500/20">
                <CheckCircle2 size={32} className="text-success-400" />
              </div>
              <h1 className="text-2xl font-bold text-white">Check your inbox</h1>
              <p className="mt-3 text-sm leading-relaxed text-ink-400">
                We sent a password reset link to{' '}
                <span className="text-ink-200">{email}</span>. Follow the link to set a new password.
              </p>
              <p className="mt-2 text-xs text-ink-500">
                If it doesn't arrive in a few minutes, check your spam folder.
              </p>
              <Link
                to="/login"
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 py-2.5 text-sm font-semibold text-white shadow-lift transition hover:from-brand-400 hover:to-brand-500"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/20">
                  <Mail size={18} className="text-brand-400" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Forgot password?</h1>
                  <p className="text-sm text-ink-400">We'll send you a reset link</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                {error && (
                  <div className="flex items-start gap-3 rounded-xl border border-danger-500/30 bg-danger-500/10 px-4 py-3">
                    <AlertCircle size={18} className="mt-0.5 shrink-0 text-danger-400" />
                    <p className="text-sm text-danger-300">{error}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-ink-200">
                    Email address
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 py-2.5 text-sm font-semibold text-white shadow-lift transition hover:from-brand-400 hover:to-brand-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      Sending…
                    </span>
                  ) : (
                    'Send reset link'
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
            </>
          )}
        </div>

        <p className="mt-auto pt-8 text-center text-xs text-ink-500">
          Built for secure document intelligence.
        </p>
      </div>
    </div>
  );
}
