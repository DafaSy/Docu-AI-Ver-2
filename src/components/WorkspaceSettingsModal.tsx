import { useState, useEffect } from 'react';
import {
  Settings,
  X,
  SunMedium,
  MoonStar,
  Laptop,
  Languages,
  User,
  Zap,
  Keyboard,
  Info,
  CheckCircle2,
  ShieldCheck,
  LogOut,
  Copy,
  Check,
  ExternalLink,
  Sliders,
  type LucideIcon,
} from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { WorkspaceLanguage, WorkspacePreferences, WorkspaceTheme, WorkspaceDensity } from '../lib/preferences';
import type { WorkspaceCopy } from '../locales/workspace';
import { CreatorSocialLinks, DocuAIBrand } from './DocuAIBrand';
import { WEBHOOK_URL } from '../lib/upload';

interface WorkspaceSettingsModalProps {
  user: SupabaseUser | null;
  isAdmin?: boolean;
  preferences: WorkspacePreferences;
  copy: WorkspaceCopy;
  onClose: () => void;
  onThemeChange: (theme: WorkspaceTheme) => void;
  onLanguageChange: (language: WorkspaceLanguage) => void;
  onDensityChange?: (density: WorkspaceDensity) => void;
  onSignOut?: () => void;
}

type SettingsTab = 'appearance' | 'account' | 'webhook' | 'shortcuts' | 'about';

export function WorkspaceSettingsModal({
  user,
  isAdmin,
  preferences,
  copy,
  onClose,
  onThemeChange,
  onLanguageChange,
  onDensityChange,
  onSignOut,
}: WorkspaceSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [copiedUserId, setCopiedUserId] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const copyToClipboard = (text: string, type: 'webhook' | 'user') => {
    void navigator.clipboard.writeText(text);
    if (type === 'webhook') {
      setCopiedWebhook(true);
      setTimeout(() => setCopiedWebhook(false), 2000);
    } else {
      setCopiedUserId(true);
      setTimeout(() => setCopiedUserId(false), 2000);
    }
  };

  const displayName = user?.user_metadata?.display_name ?? user?.user_metadata?.name ?? user?.email?.split('@')[0] ?? 'User';
  const email = user?.email ?? 'anonymous@user.local';
  const density = preferences.density ?? 'comfortable';

  const navTabs: { id: SettingsTab; label: string; icon: LucideIcon }[] = [
    { id: 'appearance', label: copy.tabAppearance, icon: SunMedium },
    { id: 'account', label: copy.tabAccount, icon: User },
    { id: 'webhook', label: copy.tabWebhook, icon: Zap },
    { id: 'shortcuts', label: copy.tabShortcuts, icon: Keyboard },
    { id: 'about', label: copy.tabAbout, icon: Info },
  ];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:justify-center sm:p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-dialog-title"
    >
      <div className="glass flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-ink-200 dark:border-white/15 bg-white/95 dark:bg-[#0a0f18]/95 shadow-2xl backdrop-blur-2xl sm:rounded-3xl sm:border">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-ink-200/80 dark:border-white/10 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/15 text-brand-600 dark:text-brand-400 ring-1 ring-brand-500/25">
              <Settings size={18} />
            </div>
            <div>
              <h2 id="settings-dialog-title" className="text-base font-semibold text-ink-950 dark:text-white">
                {copy.settingsTitle}
              </h2>
              <p className="text-xs text-ink-600 dark:text-ink-400">
                {copy.settingsSubtitle}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full border border-success-500/20 bg-success-500/10 px-2.5 py-1 text-[10px] font-semibold text-success-700 dark:text-success-300 sm:inline-flex">
              <CheckCircle2 size={11} /> Auto-saved
            </span>
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-ink-500 hover:bg-ink-100 dark:text-ink-400 dark:hover:bg-white/10 hover:text-ink-950 dark:hover:text-white transition"
              aria-label="Close settings"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body with Sidebar and Content */}
        <div className="flex flex-1 flex-col overflow-hidden sm:flex-row min-h-[420px] max-h-[70vh]">
          {/* Navigation Sidebar */}
          <aside className="shrink-0 border-b border-ink-200/80 dark:border-white/10 bg-ink-50/75 dark:bg-black/20 p-2 sm:w-56 sm:border-b-0 sm:border-r sm:p-3 overflow-x-auto sm:overflow-y-auto">
            <nav className="flex sm:flex-col gap-1" aria-label="Settings categories">
              {navTabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-medium transition shrink-0 ${
                    activeTab === id
                      ? 'bg-brand-500/15 text-brand-700 dark:text-brand-300 font-semibold border border-brand-500/30'
                      : 'text-ink-700 dark:text-ink-400 hover:bg-ink-200/40 dark:hover:bg-white/5 hover:text-ink-950 dark:hover:text-white'
                  }`}
                >
                  <Icon size={15} className={activeTab === id ? 'text-brand-600 dark:text-brand-400' : 'text-ink-500 dark:text-ink-400'} />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
          </aside>

          {/* Tab Content Panel */}
          <main className="scrollbar-thin flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {/* 1. APPEARANCE & LANGUAGE */}
            {activeTab === 'appearance' && (
              <div className="space-y-6 animate-fade-in">
                {/* Theme Selector */}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-ink-700 dark:text-ink-300 flex items-center gap-2">
                    <SunMedium size={14} className="text-brand-500 dark:text-brand-300" />
                    {copy.settingsTheme}
                  </label>
                  <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
                    {/* Dark Theme Card */}
                    <button
                      type="button"
                      onClick={() => onThemeChange('dark')}
                      className={`group relative flex flex-col justify-between rounded-2xl border p-3.5 text-left transition ${
                        preferences.theme === 'dark'
                          ? 'border-brand-500 bg-brand-500/10 shadow-[0_0_15px_rgba(59,130,246,0.15)] ring-1 ring-brand-500'
                          : 'border-ink-200 dark:border-white/10 bg-white dark:bg-white/[0.03] hover:border-ink-300 dark:hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-black text-white ring-1 ring-white/10">
                          <MoonStar size={14} />
                        </div>
                        {preferences.theme === 'dark' && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-white">
                            <Check size={12} />
                          </span>
                        )}
                      </div>
                      <div className="mt-3">
                        <p className="text-sm font-semibold text-ink-950 dark:text-white">{copy.themeDark}</p>
                        <p className="mt-0.5 text-[11px] text-ink-600 dark:text-ink-400 leading-snug">{copy.themeDarkDesc}</p>
                      </div>
                    </button>

                    {/* Light Theme Card */}
                    <button
                      type="button"
                      onClick={() => onThemeChange('light')}
                      className={`group relative flex flex-col justify-between rounded-2xl border p-3.5 text-left transition ${
                        preferences.theme === 'light'
                          ? 'border-brand-500 bg-brand-500/10 shadow-[0_0_15px_rgba(59,130,246,0.15)] ring-1 ring-brand-500'
                          : 'border-ink-200 dark:border-white/10 bg-white dark:bg-white/[0.03] hover:border-ink-300 dark:hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-ink-950 border border-ink-200 shadow-sm">
                          <SunMedium size={14} />
                        </div>
                        {preferences.theme === 'light' && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-white">
                            <Check size={12} />
                          </span>
                        )}
                      </div>
                      <div className="mt-3">
                        <p className="text-sm font-semibold text-ink-950 dark:text-white">{copy.themeLight}</p>
                        <p className="mt-0.5 text-[11px] text-ink-600 dark:text-ink-400 leading-snug">{copy.themeLightDesc}</p>
                      </div>
                    </button>

                    {/* System Theme Card */}
                    <button
                      type="button"
                      onClick={() => onThemeChange('system')}
                      className={`group relative flex flex-col justify-between rounded-2xl border p-3.5 text-left transition ${
                        preferences.theme === 'system'
                          ? 'border-brand-500 bg-brand-500/10 shadow-[0_0_15px_rgba(59,130,246,0.15)] ring-1 ring-brand-500'
                          : 'border-ink-200 dark:border-white/10 bg-white dark:bg-white/[0.03] hover:border-ink-300 dark:hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink-200 dark:bg-white/10 text-ink-900 dark:text-white">
                          <Laptop size={14} />
                        </div>
                        {preferences.theme === 'system' && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-white">
                            <Check size={12} />
                          </span>
                        )}
                      </div>
                      <div className="mt-3">
                        <p className="text-sm font-semibold text-ink-950 dark:text-white">{copy.themeSystem}</p>
                        <p className="mt-0.5 text-[11px] text-ink-600 dark:text-ink-400 leading-snug">{copy.themeSystemDesc}</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Language Selector */}
                <div className="border-t border-ink-200/80 dark:border-white/10 pt-5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-ink-700 dark:text-ink-300 flex items-center gap-2">
                    <Languages size={14} className="text-brand-500 dark:text-brand-300" />
                    {copy.settingsLanguage}
                  </label>
                  <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => onLanguageChange('id')}
                      className={`flex items-center justify-between rounded-2xl border p-3.5 text-left transition ${
                        preferences.language === 'id'
                          ? 'border-brand-500 bg-brand-500/10 ring-1 ring-brand-500'
                          : 'border-ink-200 dark:border-white/10 bg-white dark:bg-white/[0.03] hover:border-ink-300 dark:hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-500/10 text-xs font-bold text-red-600 dark:text-red-400 ring-1 ring-red-500/20">
                          ID
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-ink-950 dark:text-white">Bahasa Indonesia</p>
                          <p className="text-[11px] text-ink-500">Antarmuka dalam Bahasa Indonesia</p>
                        </div>
                      </div>
                      {preferences.language === 'id' && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-white">
                          <Check size={12} />
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => onLanguageChange('en')}
                      className={`flex items-center justify-between rounded-2xl border p-3.5 text-left transition ${
                        preferences.language === 'en'
                          ? 'border-brand-500 bg-brand-500/10 ring-1 ring-brand-500'
                          : 'border-ink-200 dark:border-white/10 bg-white dark:bg-white/[0.03] hover:border-ink-300 dark:hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-xs font-bold text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20">
                          EN
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-ink-950 dark:text-white">English (US)</p>
                          <p className="text-[11px] text-ink-500">Standard English interface</p>
                        </div>
                      </div>
                      {preferences.language === 'en' && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-white">
                          <Check size={12} />
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Interface Density */}
                {onDensityChange && (
                  <div className="border-t border-ink-200/80 dark:border-white/10 pt-5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-ink-700 dark:text-ink-300 flex items-center gap-2">
                      <Sliders size={14} className="text-brand-500 dark:text-brand-300" />
                      {copy.settingsDensity}
                    </label>
                    <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => onDensityChange('comfortable')}
                        className={`flex items-center justify-between rounded-2xl border p-3.5 text-left transition ${
                          density === 'comfortable'
                            ? 'border-brand-500 bg-brand-500/10 ring-1 ring-brand-500'
                            : 'border-ink-200 dark:border-white/10 bg-white dark:bg-white/[0.03] hover:border-ink-300 dark:hover:border-white/20'
                        }`}
                      >
                        <div>
                          <p className="text-sm font-semibold text-ink-950 dark:text-white">{copy.densityComfortable}</p>
                          <p className="text-[11px] text-ink-500 leading-snug">{copy.densityComfortableDesc}</p>
                        </div>
                        {density === 'comfortable' && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-white">
                            <Check size={12} />
                          </span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => onDensityChange('compact')}
                        className={`flex items-center justify-between rounded-2xl border p-3.5 text-left transition ${
                          density === 'compact'
                            ? 'border-brand-500 bg-brand-500/10 ring-1 ring-brand-500'
                            : 'border-ink-200 dark:border-white/10 bg-white dark:bg-white/[0.03] hover:border-ink-300 dark:hover:border-white/20'
                        }`}
                      >
                        <div>
                          <p className="text-sm font-semibold text-ink-950 dark:text-white">{copy.densityCompact}</p>
                          <p className="text-[11px] text-ink-500 leading-snug">{copy.densityCompactDesc}</p>
                        </div>
                        {density === 'compact' && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-white">
                            <Check size={12} />
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. PROFILE & ACCOUNT */}
            {activeTab === 'account' && (
              <div className="space-y-5 animate-fade-in">
                <div className="rounded-2xl border border-ink-200 dark:border-white/10 bg-white dark:bg-white/[0.02] p-4 sm:p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 text-xl font-bold text-white shadow-lift">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-ink-950 dark:text-white">{displayName}</h3>
                        {isAdmin ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-brand-500/30 bg-brand-500/15 px-2.5 py-0.5 text-[10px] font-semibold text-brand-700 dark:text-brand-300">
                            <ShieldCheck size={12} /> Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-ink-200 dark:border-white/10 bg-ink-100 dark:bg-white/5 px-2.5 py-0.5 text-[10px] font-semibold text-ink-700 dark:text-ink-300">
                            Member
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-ink-600 dark:text-ink-400 font-mono">{email}</p>
                    </div>
                  </div>

                  {user?.id && (
                    <div className="mt-4 flex items-center justify-between rounded-xl border border-ink-200 dark:border-white/10 bg-ink-50 dark:bg-black/20 p-2.5 text-xs">
                      <div className="min-w-0">
                        <span className="text-[10px] uppercase tracking-wider text-ink-500 block">User Identifier</span>
                        <code className="truncate font-mono text-ink-800 dark:text-ink-300 block">{user.id}</code>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(user.id, 'user')}
                        className="inline-flex items-center gap-1 rounded-lg border border-ink-200 dark:border-white/10 bg-white dark:bg-white/5 px-2.5 py-1 text-xs font-medium text-ink-700 dark:text-ink-300 hover:text-ink-950 dark:hover:text-white"
                      >
                        {copiedUserId ? <Check size={13} className="text-success-500" /> : <Copy size={13} />}
                        {copiedUserId ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <p className="text-xs text-ink-500">{copy.accountInfo}</p>
                  {onSignOut && (
                    <button
                      type="button"
                      onClick={onSignOut}
                      className="inline-flex items-center gap-2 rounded-xl border border-danger-500/30 bg-danger-500/10 px-4 py-2 text-xs font-semibold text-danger-600 dark:text-danger-400 hover:bg-danger-500/20 transition"
                    >
                      <LogOut size={14} /> Sign out of DocuAI
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* 3. WEBHOOK & DELIVERY */}
            {activeTab === 'webhook' && (
              <div className="space-y-5 animate-fade-in">
                <div className="rounded-2xl border border-ink-200 dark:border-white/10 bg-white dark:bg-white/[0.02] p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <Zap size={16} className="text-accent-500 dark:text-accent-400" />
                      <h3 className="text-sm font-semibold text-ink-950 dark:text-white">n8n Ingestion Webhook</h3>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-success-500/25 bg-success-500/10 px-2.5 py-1 text-[10px] font-semibold text-success-700 dark:text-success-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-success-500 animate-pulse" /> Ready & Connected
                    </span>
                  </div>
                  <p className="text-xs text-ink-600 dark:text-ink-400 leading-relaxed">
                    Documents uploaded in this workspace are streamed directly to your n8n workflow as <code className="text-ink-900 dark:text-ink-200 font-mono">multipart/form-data</code>.
                  </p>
                  <div className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-ink-200 dark:border-white/10 bg-ink-50 dark:bg-black/30 p-2.5 text-xs">
                    <code className="truncate font-mono text-ink-900 dark:text-ink-200">{WEBHOOK_URL}</code>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(WEBHOOK_URL, 'webhook')}
                      className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-ink-200 dark:border-white/10 bg-white dark:bg-white/5 px-2.5 py-1 text-xs font-medium text-ink-700 dark:text-ink-300 hover:text-ink-950 dark:hover:text-white"
                    >
                      {copiedWebhook ? <Check size={13} className="text-success-500" /> : <Copy size={13} />}
                      {copiedWebhook ? 'Copied' : 'Copy URL'}
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-ink-200 dark:border-white/10 bg-white dark:bg-white/[0.02] p-4 text-xs space-y-2">
                  <p className="font-semibold text-ink-900 dark:text-ink-200">Webhook Specifications</p>
                  <ul className="space-y-1.5 text-ink-600 dark:text-ink-400 list-disc list-inside">
                    <li>Method: <span className="font-mono text-ink-900 dark:text-ink-200">POST</span></li>
                    <li>Binary Field Name: <span className="font-mono text-ink-900 dark:text-ink-200">data</span></li>
                    <li>Supported Formats: PDF, TXT, CSV up to 25 MB each</li>
                  </ul>
                  <div className="pt-2">
                    <a
                      href="https://docs.n8n.io/integrations/builtin/trigger-node/webhook/"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-brand-600 dark:text-brand-400 font-semibold hover:underline"
                    >
                      Read n8n Webhook Documentation <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* 4. KEYBOARD SHORTCUTS */}
            {activeTab === 'shortcuts' && (
              <div className="space-y-4 animate-fade-in">
                <div className="rounded-2xl border border-ink-200 dark:border-white/10 bg-white dark:bg-white/[0.02] overflow-hidden">
                  <div className="border-b border-ink-200 dark:border-white/10 px-4 py-3 bg-ink-50 dark:bg-white/[0.02]">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-700 dark:text-ink-300">
                      {copy.shortcutsInfo}
                    </h3>
                  </div>
                  <div className="divide-y divide-ink-200 dark:divide-white/5 text-xs">
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-ink-800 dark:text-ink-300">Quick find / Command palette</span>
                      <kbd className="rounded-lg border border-ink-200 dark:border-white/15 bg-ink-100 dark:bg-white/10 px-2 py-1 font-mono text-[11px] font-semibold text-ink-900 dark:text-white">Ctrl + K</kbd>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-ink-800 dark:text-ink-300">Close modal or dialog</span>
                      <kbd className="rounded-lg border border-ink-200 dark:border-white/15 bg-ink-100 dark:bg-white/10 px-2 py-1 font-mono text-[11px] font-semibold text-ink-900 dark:text-white">Esc</kbd>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-ink-800 dark:text-ink-300">Send chat message / submit form</span>
                      <kbd className="rounded-lg border border-ink-200 dark:border-white/15 bg-ink-100 dark:bg-white/10 px-2 py-1 font-mono text-[11px] font-semibold text-ink-900 dark:text-white">Enter</kbd>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-ink-800 dark:text-ink-300">New line in chat input</span>
                      <kbd className="rounded-lg border border-ink-200 dark:border-white/15 bg-ink-100 dark:bg-white/10 px-2 py-1 font-mono text-[11px] font-semibold text-ink-900 dark:text-white">Shift + Enter</kbd>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 5. ABOUT DOCUAI */}
            {activeTab === 'about' && (
              <div className="space-y-5 animate-fade-in text-center sm:text-left">
                <div className="rounded-2xl border border-ink-200 dark:border-white/10 bg-white dark:bg-white/[0.02] p-5">
                  <DocuAIBrand size="md" subtitle="Private Document Intelligence" />
                  <p className="mt-3 text-xs leading-relaxed text-ink-600 dark:text-ink-400">
                    DocuAI turns TXT, PDF, and CSV files into working knowledge with grounded AI retrieval, intelligent organization, and automated n8n webhook pipelines.
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px]">
                    <span className="rounded-md bg-brand-500/10 px-2 py-1 font-semibold text-brand-700 dark:text-brand-300">v2.4.0 (Latest)</span>
                    <span className="rounded-md bg-ink-100 dark:bg-white/5 px-2 py-1 text-ink-600 dark:text-ink-400">React 18 · TypeScript · Vite · Tailwind</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-ink-200 dark:border-white/10 pt-4">
                  <div className="text-xs text-ink-500">
                    <span className="font-medium text-ink-800 dark:text-ink-300">Crafted with care by Daff</span>
                  </div>
                  <CreatorSocialLinks compact />
                </div>
              </div>
            )}
          </main>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between border-t border-ink-200/80 dark:border-white/10 bg-ink-50/50 dark:bg-black/25 px-5 py-3.5 sm:px-6">
          <p className="text-xs text-ink-500">{copy.settingsSaveHint}</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-brand-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-400 shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
