import { useState, useEffect, type FormEvent } from 'react';
import { X, User, Lock, Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../AuthContext';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export type AccountTab = 'profile' | 'password';

export function EditProfileModal({ isOpen, onClose, initialTab = 'profile' }: EditProfileModalProps & { initialTab?: AccountTab }) {
  const { displayName, updateDisplayName, updatePassword, user } = useAuth();

  const [tab, setTab] = useState<AccountTab>(initialTab);

  // Profile tab state
  const [name, setName] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Password tab state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTab(initialTab);
      setName(displayName || '');
      setProfileError(null);
      setProfileSuccess(false);
      setNewPassword('');
      setConfirmPassword('');
      setPasswordError(null);
      setPasswordSuccess(false);
    }
  }, [isOpen, displayName, initialTab]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(false);

    const trimmed = name.trim();
    if (!trimmed) {
      setProfileError('Display name cannot be empty.');
      return;
    }

    setProfileLoading(true);
    const { error } = await updateDisplayName(trimmed);
    setProfileLoading(false);

    if (error) {
      setProfileError('Failed to update display name. Please try again.');
    } else {
      setProfileSuccess(true);
      setTimeout(() => onClose(), 1200);
    }
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setPasswordLoading(true);
    const { error } = await updatePassword(newPassword);
    setPasswordLoading(false);

    if (error) {
      setPasswordError('Failed to update password. Please try again.');
    } else {
      setPasswordSuccess(true);
      setTimeout(() => onClose(), 1400);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#0b1019]/95 p-6 shadow-[0_32px_110px_rgba(0,0,0,0.6)] backdrop-blur-2xl sm:p-7">
        <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-brand-500/15 blur-[70px]" />
        {/* Header */}
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-300">DocuAI account</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-white">Account settings</h2>
            <p className="mt-0.5 text-xs text-ink-400">{user?.email}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-400 transition hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="relative mt-6 flex gap-1 rounded-xl border border-white/[0.06] bg-black/20 p-1">
          <button
            onClick={() => setTab('profile')}
            className={[
              'flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition',
              tab === 'profile'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-ink-400 hover:text-ink-200',
            ].join(' ')}
          >
            <User size={14} />
            Profile
          </button>
          <button
            onClick={() => setTab('password')}
            className={[
              'flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition',
              tab === 'password'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-ink-400 hover:text-ink-200',
            ].join(' ')}
          >
            <Lock size={14} />
            Password
          </button>
        </div>

        {/* Profile tab */}
        {tab === 'profile' && (
          <form onSubmit={handleProfileSubmit} className="relative mt-5 space-y-4">
            {profileError && (
              <div className="flex items-start gap-3 rounded-xl border border-danger-500/30 bg-danger-500/10 px-4 py-3">
                <AlertCircle size={18} className="mt-0.5 shrink-0 text-danger-400" />
                <p className="text-sm text-danger-300">{profileError}</p>
              </div>
            )}
            {profileSuccess && (
              <div className="flex items-start gap-3 rounded-xl border border-success-500/30 bg-success-500/10 px-4 py-3">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-success-400" />
                <p className="text-sm text-success-300">Username updated successfully.</p>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="editDisplayName" className="block text-sm font-medium text-ink-200">
                Username
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  id="editDisplayName"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your public display name"
                  maxLength={60}
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-ink-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/50"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-semibold text-ink-300 transition hover:bg-white/10 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={profileLoading}
                className="flex-1 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 py-2.5 text-sm font-semibold text-white shadow-lift transition hover:from-brand-400 hover:to-brand-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {profileLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Saving…
                  </span>
                ) : (
                  'Save changes'
                )}
              </button>
            </div>
          </form>
        )}

        {/* Password tab */}
        {tab === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="relative mt-5 space-y-4">
            {passwordError && (
              <div className="flex items-start gap-3 rounded-xl border border-danger-500/30 bg-danger-500/10 px-4 py-3">
                <AlertCircle size={18} className="mt-0.5 shrink-0 text-danger-400" />
                <p className="text-sm text-danger-300">{passwordError}</p>
              </div>
            )}
            {passwordSuccess && (
              <div className="flex items-start gap-3 rounded-xl border border-success-500/30 bg-success-500/10 px-4 py-3">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-success-400" />
                <p className="text-sm text-success-300">Password updated successfully!</p>
              </div>
            )}

            <PasswordField
              id="newPassword"
              label="New password"
              value={newPassword}
              onChange={setNewPassword}
              show={showNew}
              onToggle={() => setShowNew((v) => !v)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
            />

            <PasswordStrength password={newPassword} />

            <PasswordField
              id="confirmPassword"
              label="Confirm new password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              show={showConfirm}
              onToggle={() => setShowConfirm((v) => !v)}
              placeholder="Repeat your new password"
              autoComplete="new-password"
            />

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-semibold text-ink-300 transition hover:bg-white/10 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={passwordLoading}
                className="flex-1 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 py-2.5 text-sm font-semibold text-white shadow-lift transition hover:from-brand-400 hover:to-brand-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {passwordLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Updating…
                  </span>
                ) : (
                  'Update password'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  show,
  onToggle,
  placeholder,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  placeholder: string;
  autoComplete: string;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-ink-200">
        {label}
      </label>
      <div className="relative">
        <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required
          autoComplete={autoComplete}
          className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-10 text-sm text-white placeholder:text-ink-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/50"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 transition hover:text-ink-200"
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}

function PasswordStrength({ password }: { password: string }) {
  const score = [password.length >= 8, /[A-Z]/.test(password), /[0-9]/.test(password), /[^A-Za-z0-9]/.test(password)].filter(Boolean).length;
  const labels = ['Too weak', 'Weak', 'Fair', 'Strong', 'Excellent'];
  const colors = ['bg-white/10', 'bg-danger-400', 'bg-warning-400', 'bg-brand-400', 'bg-success-400'];
  return (
    <div aria-live="polite">
      <div className="flex gap-1.5">{[1, 2, 3, 4].map((level) => <span key={level} className={`h-1 flex-1 rounded-full transition-colors ${score >= level ? colors[score] : 'bg-white/[0.07]'}`} />)}</div>
      <div className="mt-2 flex items-center justify-between text-[10px]"><span className="text-ink-600">8+ characters, uppercase, number, symbol</span><span className="font-semibold text-ink-400">{labels[score]}</span></div>
    </div>
  );
}
