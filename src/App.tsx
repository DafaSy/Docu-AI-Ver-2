import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Loader2,
  LogOut,
  Settings,
  MessageSquare,
  Library,
  Search,
  UploadCloud,
  type LucideIcon,
} from 'lucide-react';
import { ToastStack } from './components/Toasts';
import { AccountMenu } from './components/AccountMenu';
import { ChatPanel } from './components/ChatPanel';
import { DocumentLibrary } from './components/DocumentLibrary';
import { DocumentPreviewModal } from './components/DocumentPreviewModal';
import { DocumentDashboard } from './components/DocumentDashboard';
import { DeleteDocumentModal } from './components/DeleteDocumentModal';
import { DocumentDetailModal } from './components/DocumentDetailModal';
import { WorkspaceDashboard } from './components/WorkspaceDashboard';
import { UploadSection } from './components/UploadSection';
import { WorkspaceCommandPalette } from './components/WorkspaceCommandPalette';
import { WorkspaceSettingsModal } from './components/WorkspaceSettingsModal';
import { CreatorSocialLinks, DocuAIBrand } from './components/DocuAIBrand';
import { useAuth } from './AuthContext';
import { useWorkspaceDocuments } from './hooks/useWorkspaceDocuments';
import { useWorkspaceUploads } from './hooks/useWorkspaceUploads';
import { useWorkspacePreferences } from './hooks/useWorkspacePreferences';
import type { ToastMessage } from './types';
import { generateId } from './lib/format';

function App() {
  const { user, loading, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');

  const uploadSectionRef = useRef<HTMLElement>(null);
  const librarySectionRef = useRef<HTMLElement>(null);
  const chatSectionRef = useRef<HTMLElement>(null);

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    setToasts((prev) => [...prev, { ...toast, id: generateId() }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Hook for unified preferences & theme state
  const {
    preferences,
    copy,
    updateTheme,
    updateLanguage,
    updateDensity,
  } = useWorkspacePreferences(user);

  // Hook for documents state and actions
  const {
    documents,
    setDocuments,
    documentsLoading,
    documentBusyId,
    selectedDocument,
    setSelectedDocument,
    selectedDocumentIds,
    setSelectedDocumentIds,
    previewDocument,
    setPreviewDocument,
    documentPendingDelete,
    setDocumentPendingDelete,
    detailDocument,
    setDetailDocument,
    clearChatSources,
    toggleSelectedDocument,
    selectedChatDocuments,
    refreshDocuments,
    handleDownloadDocument,
    handleRenameDocument,
    handleConfirmedDeleteDocument,
    handleUpdateDocumentOrganization,
    handleReprocessDocument,
  } = useWorkspaceDocuments(user, addToast);

  // Hook for uploads state and actions
  const {
    items,
    isSending,
    handleFiles,
    handleSendAll,
    handleCancel,
    handleRemove,
    handleRetry,
    handleClearCompleted,
    handleClearAll,
    stats,
    canSend,
  } = useWorkspaceUploads(user, addToast, setDocuments, refreshDocuments);

  useEffect(() => {
    const handleCommandShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandOpen((current) => !current);
      }
      if (event.key === 'Escape') setCommandOpen(false);
    };
    window.addEventListener('keydown', handleCommandShortcut);
    return () => window.removeEventListener('keydown', handleCommandShortcut);
  }, []);

  const handleSignOut = useCallback(async () => {
    await signOut();
    navigate('/login');
  }, [signOut, navigate]);

  useEffect(() => {
    const handleJumpToUpload = () => {
      uploadSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    window.addEventListener('docuai:jump-to-upload', handleJumpToUpload as EventListener);
    return () => window.removeEventListener('docuai:jump-to-upload', handleJumpToUpload as EventListener);
  }, []);

  const scrollToSection = useCallback((ref: React.RefObject<HTMLElement>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const readyDocuments = documents.filter((doc) => doc.processing_status === 'ready').length;
  const failedDocuments = documents.filter((doc) => doc.processing_status === 'failed').length;
  const accountName = displayNameFromUser(user);
  const greeting = getWorkspaceGreeting();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-950">
        <Loader2 size={32} className="animate-spin text-brand-500" />
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div id="top" className="workspace-shell relative min-h-screen overflow-x-hidden bg-ink-50 dark:bg-[#070b12] text-ink-950 dark:text-ink-100">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 grid-bg opacity-45" />
        <div className="absolute -top-40 left-1/2 h-[520px] w-[940px] -translate-x-1/2 rounded-full bg-brand-600/20 blur-[140px]" />
        <div className="absolute top-32 -right-24 h-[360px] w-[360px] rounded-full bg-accent-500/10 blur-[100px]" />
        <div className="absolute bottom-0 -left-24 h-[320px] w-[320px] rounded-full bg-brand-700/20 blur-[110px]" />
      </div>

      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-16 pt-3 sm:px-6 lg:px-8">
        {/* Header */}
        <header data-export-section="header" className="sticky top-3 z-50 flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-2xl border border-ink-200/70 dark:border-white/[0.08] bg-white/78 dark:bg-[#090e17]/80 px-3 py-2.5 shadow-[0_18px_60px_rgba(17,25,40,0.16)] dark:shadow-[0_18px_60px_rgba(0,0,0,0.25)] backdrop-blur-2xl sm:gap-3 sm:px-4">
          <Link to="/" aria-label="DocuAI home" className="rounded-xl outline-none ring-brand-400/50 focus-visible:ring-2">
            <DocuAIBrand size="sm" />
          </Link>
          <nav className="hidden items-center gap-1 rounded-xl border border-ink-200 dark:border-white/[0.06] bg-ink-100/65 dark:bg-black/20 p-1 xl:flex" aria-label="Workspace navigation">
            <WorkspaceNavButton label="Upload" icon={UploadCloud} onClick={() => scrollToSection(uploadSectionRef)} />
            <WorkspaceNavButton label="Library" icon={Library} onClick={() => scrollToSection(librarySectionRef)} />
            <WorkspaceNavButton label="AI Chat" icon={MessageSquare} onClick={() => scrollToSection(chatSectionRef)} />
          </nav>
          <div className="flex min-w-0 items-center gap-1.5 sm:gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-ink-200 dark:border-white/10 bg-white/75 dark:bg-white/5 px-3 py-1.5 text-xs text-ink-700 dark:text-ink-300 sm:flex">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success-500/60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-success-400" />
              </span>
              Webhook ready
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <Link
                  to="/admin"
                  className="flex items-center gap-2 rounded-full border border-brand-300/35 dark:border-brand-400/20 bg-brand-500/10 px-3 py-1.5 text-xs text-brand-700 dark:text-brand-200 transition hover:bg-brand-500/20"
                >
                  <ShieldCheck size={14} />
                  <span className="hidden sm:inline">Admin</span>
                </Link>
              )}
              <button
                onClick={() => setCommandOpen(true)}
                className="hidden items-center gap-2 rounded-xl border border-ink-200 dark:border-white/10 bg-white/75 dark:bg-white/[0.035] px-3 py-2 text-xs text-ink-700 dark:text-ink-400 transition hover:border-brand-400/30 hover:text-ink-950 dark:hover:text-white md:flex"
              >
                <Search size={14} /> Quick find <kbd className="rounded border border-ink-200 dark:border-white/10 bg-white dark:bg-black/25 px-1.5 py-0.5 font-mono text-[9px] text-ink-500 dark:text-ink-600">Ctrl K</kbd>
              </button>
              <button
                onClick={() => setSettingsOpen(true)}
                className="flex h-10 items-center gap-2 rounded-xl border border-ink-200 dark:border-white/10 bg-white/75 dark:bg-white/5 px-3 text-xs text-ink-700 dark:text-ink-300 transition hover:border-brand-500/40 hover:text-brand-600 dark:hover:text-brand-300"
              >
                <Settings size={14} className="shrink-0 text-ink-500 dark:text-ink-400" />
                <span className="hidden sm:inline">Settings</span>
              </button>
              <AccountMenu />
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 rounded-lg border border-ink-200 dark:border-white/10 bg-white/75 dark:bg-white/5 px-2.5 py-1.5 text-xs font-medium text-ink-700 dark:text-ink-300 transition hover:border-danger-500/40 hover:text-danger-600 dark:hover:text-danger-300"
              >
                <LogOut size={14} className="shrink-0" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Hero & Onboarding */}
        <WorkspaceDashboard
          greeting={greeting}
          accountName={accountName}
          documents={documents}
          readyDocuments={readyDocuments}
          failedDocuments={failedDocuments}
          selectedDocumentIds={selectedDocumentIds}
          items={items}
          copy={copy}
          onUploadClick={() => scrollToSection(uploadSectionRef)}
          onChatClick={() => scrollToSection(chatSectionRef)}
          onLibraryClick={() => scrollToSection(librarySectionRef)}
        />

        {/* Ingestion section */}
        <div className="mt-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-600 dark:text-brand-300">Ingestion desk</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink-950 dark:text-white">Bring new context into your workspace.</h2>
          </div>
          <span className="hidden rounded-full border border-ink-200 dark:border-white/10 bg-white/80 dark:bg-white/[0.03] px-3 py-1.5 text-[10px] uppercase tracking-[0.12em] text-ink-600 dark:text-ink-500 sm:inline">PDF · TXT · CSV</span>
        </div>

        <UploadSection
          uploadRef={uploadSectionRef}
          copy={copy}
          stats={stats}
          isSending={isSending}
          canSend={canSend}
          items={items}
          handleFiles={handleFiles}
          handleSendAll={handleSendAll}
          handleCancel={handleCancel}
          handleClearAll={handleClearAll}
          handleClearCompleted={handleClearCompleted}
          handleRemove={handleRemove}
          handleRetry={handleRetry}
        />

        {/* Overview section */}
        <section data-export-section="overview" className="mt-10 sm:mt-12">
          <SectionHeading eyebrow="Workspace overview" title="Your document system at a glance." description="Live totals from your private library." />
          <DocumentDashboard documents={documents} />
        </section>

        {/* Library section */}
        <section ref={librarySectionRef} data-export-section="library" className="mt-10 scroll-mt-28 sm:mt-12">
          <SectionHeading eyebrow="Knowledge library" title="Every source, organized and ready." description="Search, filter, preview, tag, and select documents for AI chat." />
          <DocumentLibrary
            documents={documents}
            loading={documentsLoading}
            selectedId={selectedDocument?.id}
            selectedIds={selectedDocumentIds}
            busyId={documentBusyId}
            onChat={(selected) => {
              setSelectedDocument(selected);
              setSelectedDocumentIds([selected.id]);
              window.document.getElementById('document-chat')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            onChatSelected={() => {
              window.document.getElementById('document-chat')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            onPreview={setPreviewDocument}
            onDetails={setDetailDocument}
            onReprocess={handleReprocessDocument}
            onDownload={handleDownloadDocument}
            onRename={handleRenameDocument}
            onDelete={setDocumentPendingDelete}
            onUpdateOrganization={handleUpdateDocumentOrganization}
            onToggleSelect={toggleSelectedDocument}
            onClearSelection={() => setSelectedDocumentIds([])}
            copy={{
              title: copy.docsTitle,
              subtitle: copy.docsSubtitle,
              empty: copy.docsEmpty,
              emptyFiltered: copy.docsEmptyFiltered,
              openUpload: copy.docsOpenUpload,
            }}
          />
        </section>

        <DocumentPreviewModal document={previewDocument} onClose={() => setPreviewDocument(undefined)} />
        <DocumentDetailModal document={detailDocument} onClose={() => setDetailDocument(undefined)} />
        <DeleteDocumentModal document={documentPendingDelete} loading={documentBusyId === documentPendingDelete?.id} onClose={() => setDocumentPendingDelete(undefined)} onConfirm={() => documentPendingDelete && void handleConfirmedDeleteDocument(documentPendingDelete)} />

        {/* Chat section */}
        <section id="document-chat" ref={chatSectionRef} data-export-section="chat" className="mt-10 scroll-mt-28 sm:mt-14">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-500/15 ring-1 ring-brand-500/20">
                <MessageSquare size={16} className="text-brand-400" />
              </div>
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-700 dark:text-ink-300">
                  {copy.chatTitle}
                </h2>
                <p className="text-xs text-ink-600 dark:text-ink-500">
                  {selectedChatDocuments.length > 1 ? `${selectedChatDocuments.length} selected documents` : copy.chatSubtitle(selectedDocument)}
                </p>
              </div>
            </div>
            <span className="hidden items-center gap-2 rounded-full border border-success-400/20 bg-success-500/[0.08] px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-success-700 dark:text-success-300 sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-success-400" /> Source-aware assistant
            </span>
          </div>
          <div className="mx-auto w-full max-w-4xl">
            <ChatPanel
              document={selectedDocument}
              sourceDocuments={selectedChatDocuments}
              onClearDocument={clearChatSources}
              copy={{ emptyTitle: copy.chatEmptyTitle, emptyDescription: copy.chatEmptyDescription, emptyHint: copy.chatEmptyHint }}
            />
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-12 border-t border-ink-200 dark:border-white/10 pt-10 text-sm text-ink-600 dark:text-ink-500 sm:mt-16">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-1">
              <DocuAIBrand size="sm" subtitle="Private document workspace" />
              <p className="mt-3 max-w-xs text-xs leading-relaxed">A private workspace for turning documents into useful, grounded answers.</p>
            </div>
            <FooterColumn title="Workspace" links={[['Home', '/'], ['Document library', '#top'], ['AI Chat', '#document-chat'], ['About DocuAI', '/about']]} />
            <FooterColumn title="Coming next" links={[['Multi-document chat', '#document-chat'], ['Page-level citations', '/about'], ['Document activity', '#top'], ['Team workspaces', '/about']]} />
            <FooterColumn title="Platform" links={[['Private storage', '/about'], ['Supabase + n8n', '/about'], ['Webhook documentation', 'https://docs.n8n.io/integrations/builtin/trigger-node/webhook/'], ['Source code', 'https://github.com']]} />
          </div>
          <div className="mt-10 flex flex-col justify-between gap-4 border-t border-ink-200 dark:border-white/10 py-5 text-xs sm:flex-row sm:items-center">
            <span>© {new Date().getFullYear()} DocuAI. All rights reserved.</span>
            <div className="flex items-center gap-4">
              <span className="font-medium text-ink-700 dark:text-ink-400">by Daff</span>
              <CreatorSocialLinks compact />
            </div>
          </div>
        </footer>
      </div>

      {settingsOpen && (
        <WorkspaceSettingsModal
          user={user}
          isAdmin={isAdmin}
          preferences={preferences}
          copy={copy}
          onClose={() => setSettingsOpen(false)}
          onThemeChange={updateTheme}
          onLanguageChange={updateLanguage}
          onDensityChange={updateDensity}
          onSignOut={handleSignOut}
        />
      )}

      {commandOpen && (
        <WorkspaceCommandPalette
          query={commandQuery}
          onQueryChange={setCommandQuery}
          documentCount={documents.length}
          selectedCount={selectedDocumentIds.length}
          onClose={() => { setCommandOpen(false); setCommandQuery(''); }}
          onUpload={() => { setCommandOpen(false); setCommandQuery(''); scrollToSection(uploadSectionRef); }}
          onLibrary={() => { setCommandOpen(false); setCommandQuery(''); scrollToSection(librarySectionRef); }}
          onChat={() => { setCommandOpen(false); setCommandQuery(''); scrollToSection(chatSectionRef); }}
          onSettings={() => { setCommandOpen(false); setCommandQuery(''); setSettingsOpen(true); }}
        />
      )}

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

function WorkspaceNavButton({ label, icon: Icon, onClick }: { label: string; icon: LucideIcon; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-ink-700 dark:text-ink-400 transition hover:bg-ink-200/50 dark:hover:bg-white/[0.06] hover:text-ink-950 dark:hover:text-white"
    >
      <Icon size={14} />
      {label}
    </button>
  );
}

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-600 dark:text-brand-300">{eyebrow}</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink-950 dark:text-white">{title}</h2>
      </div>
      <p className="max-w-sm text-xs leading-5 text-ink-600 dark:text-ink-500">{description}</p>
    </div>
  );
}

function displayNameFromUser(user: { email?: string; user_metadata?: Record<string, unknown> } | null) {
  const metadataName = user?.user_metadata?.display_name ?? user?.user_metadata?.name;
  return typeof metadataName === 'string' && metadataName.trim() ? metadataName : user?.email?.split('@')[0] || 'there';
}

function getWorkspaceGreeting() {
  const hour = new Date().getHours();
  if (hour < 11) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function FooterColumn({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-ink-700 dark:text-ink-300">{title}</p>
      <div className="mt-3 space-y-2.5">
        {links.map(([label, href]) =>
          href.startsWith('http') ? (
            <a key={label} href={href} target="_blank" rel="noreferrer" className="block text-xs hover:text-ink-950 dark:hover:text-white">
              {label}
            </a>
          ) : href.startsWith('/') ? (
            <Link key={label} to={href} className="block text-xs hover:text-ink-950 dark:hover:text-white">
              {label}
            </Link>
          ) : (
            <a key={label} href={href} className="block text-xs hover:text-ink-950 dark:hover:text-white">
              {label}
            </a>
          )
        )}
      </div>
    </div>
  );
}

export default App;
