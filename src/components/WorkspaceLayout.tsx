import React from 'react';
import { Link } from 'react-router-dom';
import { UploadCloud, Library, MessageSquare, ShieldCheck, Search, Settings, LogOut, type LucideIcon } from 'lucide-react';
import { DocuAIBrand, CreatorSocialLinks } from './DocuAIBrand';
import { AccountMenu } from './AccountMenu';

interface WorkspaceLayoutProps {
  children: React.ReactNode;
  isAdmin: boolean;
  onSignOut: () => void;
  onOpenCommand: () => void;
  onOpenSettings: () => void;
  onScrollToUpload: () => void;
  onScrollToLibrary: () => void;
  onScrollToChat: () => void;
}

export function WorkspaceLayout({
  children,
  isAdmin,
  onSignOut,
  onOpenCommand,
  onOpenSettings,
  onScrollToUpload,
  onScrollToLibrary,
  onScrollToChat
}: WorkspaceLayoutProps) {
  return (
    <div id="top" className="flex h-screen w-full overflow-hidden bg-ink-50 dark:bg-[#070b12] text-ink-950 dark:text-ink-100 selection:bg-brand-500/30">
      {/* Ambient background for the whole app */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay dark:opacity-10" />
        <div className="absolute -top-40 left-1/2 h-[520px] w-[940px] -translate-x-1/2 rounded-full bg-brand-600/10 blur-[140px]" />
        <div className="absolute top-32 -right-24 h-[360px] w-[360px] rounded-full bg-accent-500/5 blur-[100px]" />
        <div className="absolute bottom-0 -left-24 h-[320px] w-[320px] rounded-full bg-brand-700/10 blur-[110px]" />
      </div>

      {/* Sidebar */}
      <aside className="relative flex w-64 flex-col border-r border-ink-200/70 dark:border-white/[0.06] bg-white/72 dark:bg-[#0a0f18]/40 shadow-[8px_0_30px_rgba(17,25,40,0.06)] dark:shadow-none backdrop-blur-2xl">
        <div className="flex h-16 items-center px-6">
          <Link to="/" aria-label="DocuAI home" className="rounded-xl outline-none ring-brand-400/50 focus-visible:ring-2">
            <DocuAIBrand size="sm" />
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="mb-6 px-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-500">Workspace</p>
          </div>
          
          <nav className="flex flex-col gap-1.5" aria-label="Workspace navigation">
            <WorkspaceNavButton label="Quick find" icon={Search} onClick={onOpenCommand} shortcut="Ctrl K" />
            <div className="my-2 border-t border-ink-200/50 dark:border-white/5" />
            <WorkspaceNavButton label="Upload Document" icon={UploadCloud} onClick={onScrollToUpload} />
            <WorkspaceNavButton label="Document Library" icon={Library} onClick={onScrollToLibrary} />
            <WorkspaceNavButton label="AI Chat" icon={MessageSquare} onClick={onScrollToChat} />
          </nav>

          {isAdmin && (
            <div className="mt-8">
              <div className="mb-3 px-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-500">Administration</p>
              </div>
              <Link
                to="/admin"
                className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-brand-600 dark:text-brand-300 transition hover:bg-brand-500/10"
              >
                <ShieldCheck size={16} className="text-brand-500/70 group-hover:text-brand-500" />
                Admin Panel
              </Link>
            </div>
          )}
        </div>

        <div className="border-t border-ink-200/60 dark:border-white/[0.06] p-4">
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-ink-200 dark:border-white/10 bg-white/50 dark:bg-white/[0.02] px-3 py-2 text-xs text-ink-700 dark:text-ink-400 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success-500/60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success-400" />
            </span>
            Webhook ready
          </div>
          
          <div className="flex flex-col gap-1">
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-700 dark:text-ink-300 transition hover:bg-ink-200/60 dark:hover:bg-white/[0.06] hover:text-ink-950 dark:hover:text-white"
            >
              <Settings size={16} className="text-ink-500" />
              Settings
            </button>
            <div className="flex items-center justify-between px-1">
              <AccountMenu />
              <button
                onClick={onSignOut}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-500 transition hover:bg-danger-500/10 hover:text-danger-500"
                title="Sign out"
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-6 py-8 sm:px-10 lg:py-12">
          {children}

          <footer className="mt-20 border-t border-ink-200/60 dark:border-white/[0.06] pt-10 text-sm text-ink-600 dark:text-ink-500">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <div className="flex items-center gap-3">
                <DocuAIBrand size="sm" />
                <span className="text-xs">© {new Date().getFullYear()}</span>
              </div>
              <div className="flex items-center gap-4">
                <Link to="/about" className="text-xs hover:text-ink-950 dark:hover:text-white transition">About DocuAI</Link>
                <span className="h-1 w-1 rounded-full bg-ink-300 dark:bg-ink-700" />
                <CreatorSocialLinks compact />
              </div>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}

function WorkspaceNavButton({ label, icon: Icon, onClick, shortcut }: { label: string; icon: LucideIcon; onClick: () => void; shortcut?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-ink-700 dark:text-ink-300 transition hover:bg-ink-200/50 dark:hover:bg-white/[0.06] hover:text-ink-950 dark:hover:text-white"
    >
      <div className="flex items-center gap-3">
        <Icon size={16} className="text-ink-500 group-hover:text-ink-950 dark:group-hover:text-white transition" />
        {label}
      </div>
      {shortcut && (
        <kbd className="hidden rounded-md border border-ink-200 dark:border-white/10 bg-white dark:bg-black/20 px-1.5 py-0.5 font-mono text-[9px] text-ink-500 sm:inline-block">
          {shortcut}
        </kbd>
      )}
    </button>
  );
}
