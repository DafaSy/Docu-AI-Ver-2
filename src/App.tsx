import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Trash2,
  Send,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Zap,
  LogOut,
  Settings,
  MessageSquare,
  ArrowRight,
  Languages,
  Library,
  MoonStar,
  Search,
  SunMedium,
  UploadCloud,
  X,
  type LucideIcon,
} from 'lucide-react';
import { Dropzone } from './components/Dropzone';
import { FileRow } from './components/FileRow';
import { ToastStack } from './components/Toasts';
import { AccountMenu } from './components/AccountMenu';
import { ChatPanel } from './components/ChatPanel';
import { DocumentLibrary } from './components/DocumentLibrary';
import { DocumentPreviewModal } from './components/DocumentPreviewModal';
import { DocumentDashboard } from './components/DocumentDashboard';
import { DeleteDocumentModal } from './components/DeleteDocumentModal';
import { DocumentDetailModal } from './components/DocumentDetailModal';
import { CreatorSocialLinks, DocuAIBrand } from './components/DocuAIBrand';
import { useAuth } from './AuthContext';
import type { DocumentRecord, ToastMessage, UploadItem } from './types';
import {
  generateId,
  getFileKind,
  formatBytes,
} from './lib/format';
import { estimatePdfPageCount, uploadFile, validateFile, WEBHOOK_URL } from './lib/upload';
import { createDocument, deleteDocument, getDocumentDownloadUrl, getStoredDocumentFile, listDocuments, renameDocument, updateDocumentOrganization, updateDocumentStatus } from './lib/documents';
import { DEFAULT_PREFERENCES, loadPreferences, readStoredPreferences, resolveTheme, savePreferences, storePreferences, type WorkspaceLanguage, type WorkspacePreferences, type WorkspaceTheme } from './lib/preferences';

function App() {
  const { user, loading, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<UploadItem[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [documentBusyId, setDocumentBusyId] = useState<string>();
  const [selectedDocument, setSelectedDocument] = useState<DocumentRecord>();
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [previewDocument, setPreviewDocument] = useState<DocumentRecord>();
  const [documentPendingDelete, setDocumentPendingDelete] = useState<DocumentRecord>();
  const [detailDocument, setDetailDocument] = useState<DocumentRecord>();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const [preferences, setPreferences] = useState<WorkspacePreferences>(() => readStoredPreferences() ?? DEFAULT_PREFERENCES);
  const [preferencesReady, setPreferencesReady] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const pendingDeleteTimers = useRef(new Map<string, { document: DocumentRecord; index: number; timeoutId: number }>());
  const uploadSectionRef = useRef<HTMLElement>(null);
  const librarySectionRef = useRef<HTMLElement>(null);
  const chatSectionRef = useRef<HTMLElement>(null);

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

  const copy = useMemo(() => {
    if (preferences.language === 'en') {
      return {
        appSubtitle: 'Private AI workspace for document teams',
        heroBadge: 'Premium upload, retrieval, and chat in one workspace',
        heroTitleLead: 'Turn files into',
        heroTitleAccent: 'working knowledge',
        heroDescription: 'Bring TXT, PDF, and CSV files into a polished DocuAI workspace. Every upload is routed to your webhook as multipart/form-data, so your automation stays lean and your team gets answers faster.',
        onboardingTitle: 'Your fastest path to value',
        onboardingDescription: 'A simple, high-conversion flow for teams that want useful answers, not another storage folder.',
        steps: [
          { title: '1. Add files', text: 'Drop TXT, PDF, or CSV files into the upload area.' },
          { title: '2. Organize', text: 'Open the document library and keep the best files ready.' },
          { title: '3. Ask anything', text: 'Get grounded answers from the assistant below.' },
        ],
        openUpload: 'Start uploading',
        openLibrary: 'Open library',
        openChat: 'Start chat',
        uploadTitle: 'Upload documents',
        uploadEmpty: 'No files yet. Add a TXT, PDF, or CSV file to start building your workspace.',
        sessionTitle: 'Session',
        webhookTitle: 'Delivery',
        goodTitle: 'What you get',
        docsTitle: 'Document library',
        docsSubtitle: 'A clean command center to search, organize, preview, and chat with private documents.',
        docsEmpty: 'No saved documents yet. Upload a file to create your first knowledge base.',
        docsEmptyFiltered: 'No documents match these filters.',
        docsOpenUpload: 'See upload tips',
        chatTitle: 'AI Chat Assistant',
        chatSubtitle: (selected?: DocumentRecord) => selected ? `Focused on ${selected.file_name}` : 'Answers powered by your webhook-connected knowledge base',
        chatEmptyTitle: 'Start a conversation',
        chatEmptyDescription: 'Ask about one document or your full knowledge base. Conversations save automatically for later.',
        chatEmptyHint: 'Tip: pick a ready document from the library, then continue here.',
        settingsTitle: 'Workspace settings',
        settingsTheme: 'Theme',
        settingsLanguage: 'Language',
        themeDark: 'Dark',
        themeLight: 'Light',
        themeSystem: 'System',
        languageId: 'Bahasa Indonesia',
        languageEn: 'English',
        settingsSaveHint: 'Changes are saved to your user preferences.',
      };
    }

    return {
      appSubtitle: 'Ruang kerja AI pribadi untuk tim dokumen',
      heroBadge: 'Upload premium, retrieval, dan chat dalam satu workspace',
      heroTitleLead: 'Ubah file jadi',
      heroTitleAccent: 'pengetahuan yang siap pakai',
      heroDescription: 'Masukkan file TXT, PDF, dan CSV ke workspace DocuAI yang rapi dan profesional. Setiap upload diteruskan ke webhook Anda sebagai multipart/form-data, sehingga automasi tetap ringan dan tim Anda bergerak lebih cepat.',
      onboardingTitle: 'Jalur tercepat ke hasil',
      onboardingDescription: 'Alur sederhana untuk tim yang ingin jawaban berguna, bukan sekadar tempat penyimpanan.',
      steps: [
        { title: '1. Tambahkan file', text: 'Tarik file TXT, PDF, atau CSV ke area upload.' },
        { title: '2. Susun', text: 'Buka library dokumen dan siapkan file terbaik.' },
        { title: '3. Tanya apa saja', text: 'Dapatkan jawaban yang tetap terhubung ke sumber.' },
      ],
      openUpload: 'Mulai upload',
      openLibrary: 'Buka library',
      openChat: 'Mulai chat',
      uploadTitle: 'Upload dokumen',
      uploadEmpty: 'Belum ada file. Tambahkan TXT, PDF, atau CSV untuk mulai membangun workspace Anda.',
      sessionTitle: 'Sesi',
      webhookTitle: 'Pengiriman',
      goodTitle: 'Yang Anda dapatkan',
      docsTitle: 'Library dokumen',
      docsSubtitle: 'Pusat kendali yang rapi untuk mencari, menyusun, pratinjau, dan chat dengan dokumen pribadi.',
      docsEmpty: 'Belum ada dokumen tersimpan. Upload file untuk membentuk knowledge base pertama Anda.',
      docsEmptyFiltered: 'Tidak ada dokumen yang cocok dengan filter ini.',
      docsOpenUpload: 'Lihat tips upload',
      chatTitle: 'AI Chat Assistant',
      chatSubtitle: (selected?: DocumentRecord) => selected ? `Fokus pada ${selected.file_name}` : 'Jawaban didukung knowledge base yang terhubung ke webhook Anda',
      chatEmptyTitle: 'Mulai percakapan',
      chatEmptyDescription: 'Tanya satu dokumen atau seluruh knowledge base Anda. Percakapan tersimpan otomatis untuk digunakan kembali.',
      chatEmptyHint: 'Tips: pilih dokumen yang sudah siap dari library, lalu lanjutkan di sini.',
      settingsTitle: 'Pengaturan ruang kerja',
      settingsTheme: 'Tema',
      settingsLanguage: 'Bahasa',
      themeDark: 'Gelap',
      themeLight: 'Terang',
      themeSystem: 'Sistem',
      languageId: 'Bahasa Indonesia',
      languageEn: 'English',
      settingsSaveHint: 'Perubahan disimpan ke preferensi pengguna Anda.',
    };
  }, [preferences.language]);

  const appliedTheme = useMemo(() => resolveTheme(preferences.theme), [preferences.theme]);

  const handleSignOut = useCallback(async () => {
    await signOut();
    navigate('/login');
  }, [signOut, navigate]);

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    setToasts((prev) => [...prev, { ...toast, id: generateId() }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const target = document.documentElement;
    target.dataset.theme = appliedTheme;
    target.style.colorScheme = appliedTheme;
  }, [appliedTheme]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void loadPreferences(user.id)
      .then((saved) => {
        if (cancelled) return;
        if (saved) {
          setPreferences(saved);
          storePreferences(saved);
        }
      })
      .catch(() => {
        const stored = readStoredPreferences();
        if (stored && !cancelled) setPreferences(stored);
      })
      .finally(() => {
        if (!cancelled) setPreferencesReady(true);
      });
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    if (!preferencesReady || !user) return;
    storePreferences(preferences);
    void savePreferences(user.id, preferences).catch(() => undefined);
  }, [preferences, preferencesReady, user]);

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

  const clearChatSources = useCallback(() => {
    setSelectedDocument(undefined);
    setSelectedDocumentIds([]);
  }, []);

  const toggleSelectedDocument = useCallback((document: DocumentRecord) => {
    setSelectedDocumentIds((current) => (
      current.includes(document.id)
        ? current.filter((id) => id !== document.id)
        : [...current, document.id]
    ));
  }, []);

  const selectedChatDocuments = useMemo(() => {
    if (selectedDocumentIds.length > 0) {
      const ids = new Set(selectedDocumentIds);
      return documents.filter((document) => ids.has(document.id));
    }
    return selectedDocument ? [selectedDocument] : [];
  }, [documents, selectedDocument, selectedDocumentIds]);

  const refreshDocuments = useCallback(async () => {
    if (!user) return;
    setDocumentsLoading(true);
    try {
      setDocuments(await listDocuments(user.id));
    } catch (error) {
      addToast({ variant: 'error', title: 'Could not load document library', description: error instanceof Error ? error.message : 'Please check the Supabase migration.' });
    } finally {
      setDocumentsLoading(false);
    }
  }, [user, addToast]);

  useEffect(() => { void refreshDocuments(); }, [refreshDocuments]);

  useEffect(() => {
    if (!user) return;
    const hasPending = documents.some((doc) => doc.processing_status === 'uploading' || doc.processing_status === 'processing');
    if (!hasPending) return;
    const interval = window.setInterval(() => { void refreshDocuments(); }, 5000);
    return () => window.clearInterval(interval);
  }, [documents, refreshDocuments, user]);

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const incoming = Array.from(files);
      const accepted: UploadItem[] = [];
      let rejected = 0;

      for (const file of incoming) {
        const result = validateFile(file);
        if (!result.ok) {
          rejected += 1;
          addToast({
            variant: 'error',
            title: file.name,
            description: result.reason,
          });
          continue;
        }
        accepted.push({
          id: generateId(),
          file,
          kind: getFileKind(file),
          status: 'queued',
          progress: 0,
        });
      }

      if (accepted.length > 0) {
        setItems((prev) => [...accepted, ...prev]);
        addToast({
          variant: 'info',
          title: `${accepted.length} file${accepted.length > 1 ? 's' : ''} added`,
          description: 'Ready to send to your n8n workflow.',
        });
      }
      if (rejected === 0 && accepted.length === 0) {
        addToast({
          variant: 'info',
          title: 'No files selected',
        });
      }
    },
    [addToast],
  );

  const updateItem = useCallback(
    (id: string, patch: Partial<UploadItem>) => {
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, ...patch } : it)),
      );
    },
    [],
  );

  const sendOne = useCallback(
    async (item: UploadItem, controller: AbortController) => {
      if (!user) {
        return { ok: false, status: 'unknown' as const, message: 'Please sign in before uploading.' };
      }
      const pageCount = item.kind === 'pdf' ? await estimatePdfPageCount(item.file) : null;
      updateItem(item.id, {
        status: 'uploading',
        progress: 0,
        startedAt: Date.now(),
        finishedAt: undefined,
        message: undefined,
        responsePreview: undefined,
      });
      let document: DocumentRecord | undefined;
      try {
        document = await createDocument(item.file, user.id);
        setDocuments((current) => [document!, ...current]);
        document = await updateDocumentStatus(document.id, 'processing');
        setDocuments((current) => current.map((entry) => entry.id === document!.id ? document! : entry));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Could not save the document to Supabase.';
        updateItem(item.id, { status: 'error', finishedAt: Date.now(), message });
        await refreshDocuments();
        return { ok: false, status: 'unknown' as const, message };
      }

      const result = await uploadFile(item, user.id, {
        signal: controller.signal,
        onProgress: (p) => updateItem(item.id, { progress: p }),
      }, document.id, pageCount ? { pageCount } : undefined);
      if (result.ok) {
        const processing = await updateDocumentStatus(document.id, 'processing');
        setDocuments((current) => current.map((entry) => entry.id === processing.id ? processing : entry));
        updateItem(item.id, {
          status: 'success',
          progress: 100,
          finishedAt: Date.now(),
          message: result.message,
          responsePreview: result.preview,
        });
      } else if (result.status === 'aborted') {
        const failed = await updateDocumentStatus(document.id, 'failed', 'Processing cancelled.');
        setDocuments((current) => current.map((entry) => entry.id === failed.id ? failed : entry));
        updateItem(item.id, {
          status: 'error',
          finishedAt: Date.now(),
          message: 'Cancelled.',
        });
      } else {
        const failed = await updateDocumentStatus(document.id, 'failed', result.message);
        setDocuments((current) => current.map((entry) => entry.id === failed.id ? failed : entry));
        updateItem(item.id, {
          status: 'error',
          finishedAt: Date.now(),
          message: result.message,
          responsePreview: result.preview,
        });
      }
      return result;
    },
    [updateItem, user, refreshDocuments],
  );

  const handleDownloadDocument = useCallback(async (document: DocumentRecord) => {
    try {
      const url = await getDocumentDownloadUrl(document);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      addToast({ variant: 'error', title: 'Download failed', description: error instanceof Error ? error.message : undefined });
    }
  }, [addToast]);

  const handleRenameDocument = useCallback(async (document: DocumentRecord, name: string) => {
    if (!name || name === document.file_name) return;
    try {
      const updated = await renameDocument(document.id, name);
      setDocuments((current) => current.map((entry) => entry.id === updated.id ? updated : entry));
      if (selectedDocument?.id === updated.id) setSelectedDocument(updated);
    } catch (error) {
      addToast({ variant: 'error', title: 'Rename failed', description: error instanceof Error ? error.message : undefined });
    }
  }, [addToast, selectedDocument]);

  const handleConfirmedDeleteDocument = useCallback(async (document: DocumentRecord) => {
    const index = documents.findIndex((entry) => entry.id === document.id);
    setDocumentPendingDelete(undefined);
    setDocuments((current) => current.filter((entry) => entry.id !== document.id));
    if (selectedDocument?.id === document.id) setSelectedDocument(undefined);
    setSelectedDocumentIds((current) => current.filter((id) => id !== document.id));

    const timeoutId = window.setTimeout(async () => {
      pendingDeleteTimers.current.delete(document.id);
      setDocumentBusyId(document.id);
      try {
        await deleteDocument(document);
        addToast({ variant: 'success', title: 'Document deleted', description: document.file_name });
      } catch (error) {
        setDocuments((current) => {
          if (current.some((entry) => entry.id === document.id)) return current;
          const next = [...current];
          next.splice(Math.min(index, next.length), 0, document);
          return next;
        });
        addToast({ variant: 'error', title: 'Delete failed', description: error instanceof Error ? error.message : undefined });
      } finally {
        setDocumentBusyId(undefined);
      }
    }, 8000);

    pendingDeleteTimers.current.set(document.id, { document, index, timeoutId });
    addToast({
      variant: 'info',
      title: 'Document removed',
      description: 'You can undo this for 8 seconds.',
      actionLabel: 'Undo',
      onAction: () => {
        const pending = pendingDeleteTimers.current.get(document.id);
        if (!pending) return;
        window.clearTimeout(pending.timeoutId);
        pendingDeleteTimers.current.delete(document.id);
        setDocuments((current) => {
          if (current.some((entry) => entry.id === document.id)) return current;
          const next = [...current];
          next.splice(Math.min(pending.index, next.length), 0, pending.document);
          return next;
        });
      },
    });
  }, [addToast, documents, selectedDocument]);

  const handleUpdateDocumentOrganization = useCallback(async (document: DocumentRecord, input: Partial<Pick<DocumentRecord, 'category' | 'tags' | 'is_favorite'>>) => {
    try {
      const updated = await updateDocumentOrganization(document.id, input);
      setDocuments((current) => current.map((entry) => entry.id === updated.id ? updated : entry));
      if (selectedDocument?.id === updated.id) setSelectedDocument(updated);
    } catch (error) {
      addToast({ variant: 'error', title: 'Could not update document', description: error instanceof Error ? error.message : undefined });
    }
  }, [addToast, selectedDocument]);

  const handleReprocessDocument = useCallback(async (document: DocumentRecord) => {
    if (!user) return;
    setDocumentBusyId(document.id);
    try {
      const processing = await updateDocumentStatus(document.id, 'processing');
      setDocuments((current) => current.map((entry) => entry.id === processing.id ? processing : entry));
      const file = await getStoredDocumentFile(document);
      const pageCount = document.file_type === 'pdf' ? (document.page_count || await estimatePdfPageCount(file)) : null;
      const result = await uploadFile({ id: document.id, file, kind: getFileKind(file), status: 'uploading', progress: 0 }, user.id, {}, document.id, pageCount ? { pageCount } : undefined);
      const updated = await updateDocumentStatus(document.id, result.ok ? 'processing' : 'failed', result.ok ? null : result.message);
      setDocuments((current) => current.map((entry) => entry.id === updated.id ? updated : entry));
      addToast(result.ok ? { variant: 'success', title: 'Document reprocessed' } : { variant: 'error', title: 'Reprocess failed', description: result.message });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not reprocess this document.';
      const failed = await updateDocumentStatus(document.id, 'failed', message).catch(() => undefined);
      if (failed) setDocuments((current) => current.map((entry) => entry.id === failed.id ? failed : entry));
      addToast({ variant: 'error', title: 'Reprocess failed', description: message });
    } finally { setDocumentBusyId(undefined); }
  }, [addToast, user]);

  const handleSendAll = useCallback(async () => {
    const pending = items.filter(
      (it) => it.status === 'queued' || it.status === 'error',
    );
    if (pending.length === 0) {
      addToast({
        variant: 'info',
        title: 'Nothing to send',
        description: 'Add a TXT, PDF, or CSV file first.',
      });
      return;
    }

    setIsSending(true);
    const controller = new AbortController();
    abortRef.current = controller;

    let success = 0;
    let failed = 0;

    for (const item of pending) {
      const result = await sendOne(item, controller);
      if (result.ok) success += 1;
      else if (result.status !== 'aborted') failed += 1;
    }

    setIsSending(false);
    abortRef.current = null;

    if (success > 0 && failed === 0) {
      addToast({
        variant: 'success',
        title: `All ${success} file${success > 1 ? 's' : ''} sent`,
        description: 'Your n8n workflow has received the uploads.',
      });
    } else if (success > 0 && failed > 0) {
      addToast({
        variant: 'error',
        title: `${success} sent, ${failed} failed`,
        description: 'Check the list for details and retry failed files.',
      });
    } else if (failed > 0) {
      addToast({
        variant: 'error',
        title: 'Upload failed',
        description:
          'Could not reach the n8n webhook. Verify n8n is running and the webhook is active.',
      });
    }
  }, [items, sendOne, addToast]);

  const handleCancel = useCallback(() => {
    abortRef.current?.abort();
    setIsSending(false);
  }, []);

  const handleRemove = useCallback(
    (id: string) => {
      setItems((prev) => prev.filter((it) => it.id !== id));
    },
    [],
  );

  const handleRetry = useCallback(
    async (id: string) => {
      const item = items.find((it) => it.id === id);
      if (!item) return;
      const controller = new AbortController();
      await sendOne({ ...item }, controller);
    },
    [items, sendOne],
  );

  const handleClearCompleted = useCallback(() => {
    setItems((prev) =>
      prev.filter((it) => it.status !== 'success' && it.status !== 'error'),
    );
  }, []);

  const handleClearAll = useCallback(() => {
    if (isSending) return;
    setItems([]);
  }, [isSending]);

  const stats = useMemo(() => {
    const total = items.length;
    const queued = items.filter((it) => it.status === 'queued').length;
    const uploading = items.filter((it) => it.status === 'uploading').length;
    const success = items.filter((it) => it.status === 'success').length;
    const error = items.filter((it) => it.status === 'error').length;
    const totalBytes = items.reduce((sum, it) => sum + it.file.size, 0);
    return { total, queued, uploading, success, error, totalBytes };
  }, [items]);

  const hasPending = stats.queued + stats.error > 0;
  const canSend = hasPending && !isSending;
  const readyDocuments = documents.filter((document) => document.processing_status === 'ready').length;
  const failedDocuments = documents.filter((document) => document.processing_status === 'failed').length;
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
    <div id="top" className="workspace-shell relative min-h-screen overflow-x-hidden bg-[#070b12] text-ink-100">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 grid-bg opacity-45" />
        <div className="absolute -top-40 left-1/2 h-[520px] w-[940px] -translate-x-1/2 rounded-full bg-brand-600/20 blur-[140px]" />
        <div className="absolute top-32 -right-24 h-[360px] w-[360px] rounded-full bg-accent-500/10 blur-[100px]" />
        <div className="absolute bottom-0 -left-24 h-[320px] w-[320px] rounded-full bg-brand-700/20 blur-[110px]" />
      </div>

      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-16 pt-3 sm:px-6 lg:px-8">
        {/* Header */}
        <header data-export-section="header" className="sticky top-3 z-50 flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/[0.08] bg-[#090e17]/80 px-3 py-2.5 shadow-[0_18px_60px_rgba(0,0,0,0.25)] backdrop-blur-2xl sm:gap-3 sm:px-4">
          <Link to="/" aria-label="DocuAI home" className="rounded-xl outline-none ring-brand-400/50 focus-visible:ring-2">
            <DocuAIBrand size="sm" />
          </Link>
          <nav className="hidden items-center gap-1 rounded-xl border border-white/[0.06] bg-black/20 p-1 xl:flex" aria-label="Workspace navigation">
            <WorkspaceNavButton label="Upload" icon={UploadCloud} onClick={() => scrollToSection(uploadSectionRef)} />
            <WorkspaceNavButton label="Library" icon={Library} onClick={() => scrollToSection(librarySectionRef)} />
            <WorkspaceNavButton label="AI Chat" icon={MessageSquare} onClick={() => scrollToSection(chatSectionRef)} />
          </nav>
          <div className="flex min-w-0 items-center gap-1.5 sm:gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-ink-300 sm:flex">
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
                  className="flex items-center gap-2 rounded-full border border-brand-400/20 bg-brand-500/10 px-3 py-1.5 text-xs text-brand-200 transition hover:bg-brand-500/20"
                >
                  <ShieldCheck size={14} />
                  <span className="hidden sm:inline">Admin</span>
                </Link>
              )}
              <button
                onClick={() => setCommandOpen(true)}
                className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs text-ink-400 transition hover:border-brand-400/30 hover:text-white md:flex"
              >
                <Search size={14} /> Quick find <kbd className="rounded border border-white/10 bg-black/25 px-1.5 py-0.5 font-mono text-[9px] text-ink-600">Ctrl K</kbd>
              </button>
              <button
                onClick={() => setSettingsOpen(true)}
                className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 text-xs text-ink-300 transition hover:border-brand-500/40 hover:text-brand-300"
              >
                <Settings size={14} className="shrink-0 text-ink-400" />
                <span className="hidden sm:inline">Settings</span>
              </button>
              <AccountMenu />
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-ink-300 transition hover:border-danger-500/40 hover:text-danger-300"
              >
                <LogOut size={14} className="shrink-0" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section data-export-section="hero" className="relative mt-6 overflow-hidden rounded-[28px] border border-white/[0.08] bg-gradient-to-br from-brand-950/35 via-[#0b111c]/95 to-accent-600/[0.08] p-5 shadow-[0_30px_100px_rgba(0,0,0,0.3)] sm:mt-8 sm:p-8 lg:p-10">
          <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full bg-brand-500/10 blur-[80px]" />
          <div className="relative grid items-end gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-success-400/15 bg-success-500/[0.07] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-success-300">
                <span className="h-1.5 w-1.5 rounded-full bg-success-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]" /> Private workspace online
              </div>
              <p className="mt-7 text-sm font-medium text-ink-400">{greeting}, {accountName}</p>
              <h1 className="mt-2 max-w-3xl text-4xl font-semibold leading-[1.03] tracking-[-0.045em] text-white sm:text-5xl lg:text-6xl">
                Turn documents into <span className="bg-gradient-to-r from-brand-200 via-brand-400 to-accent-400 bg-clip-text text-transparent">working knowledge.</span>
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-ink-400 sm:text-base">Upload, organize, retrieve, and discuss your private files from one focused command center.</p>
              <div className="mt-7 flex flex-wrap gap-2.5">
                <button type="button" onClick={() => scrollToSection(uploadSectionRef)} className="group inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-ink-950 transition hover:bg-brand-100"><UploadCloud size={16} /> Upload document <ArrowRight size={14} className="transition group-hover:translate-x-0.5" /></button>
                <button type="button" onClick={() => scrollToSection(chatSectionRef)} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-ink-200 transition hover:border-brand-400/30 hover:bg-white/10 hover:text-white"><MessageSquare size={15} /> Ask DocuAI</button>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/[0.09] bg-black/25 backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3"><span className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-600">Workspace pulse</span><span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-success-300">Live</span></div>
              <div className="grid grid-cols-2 gap-px bg-white/[0.07]">
                <WorkspacePulse value={documents.length} label="Documents" icon={Library} />
                <WorkspacePulse value={readyDocuments} label="Ready to ask" icon={CheckCircle2} tone="success" />
                <WorkspacePulse value={selectedDocumentIds.length} label="Selected sources" icon={MessageSquare} />
                <WorkspacePulse value={failedDocuments} label="Needs attention" icon={AlertTriangle} tone={failedDocuments ? 'danger' : 'muted'} />
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.13em] text-ink-600"><span>Private data path</span><span className="h-px flex-1 bg-white/[0.07]" /></div>
                <div className="mt-3 grid grid-cols-4 gap-1.5 text-center text-[9px] font-medium text-ink-400">
                  {['Upload', 'Index', 'Retrieve', 'Answer'].map((stage, index) => <span key={stage} className="relative rounded-lg border border-white/[0.07] bg-white/[0.035] px-1 py-2"><span className="mb-1 block font-mono text-[8px] text-brand-400">0{index + 1}</span>{stage}</span>)}
                </div>
              </div>
            </div>
          </div>
        </section>

        {items.length === 0 && documents.length === 0 && (
          <section data-export-section="onboarding" className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="glass rounded-2xl border border-white/10 p-4 shadow-soft sm:p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-300">{copy.onboardingTitle}</p>
              <p className="mt-2 text-xs leading-relaxed text-ink-400">{copy.onboardingDescription}</p>
            </div>
            {copy.steps.map((step) => <div key={step.title} className="glass rounded-2xl border border-white/10 p-4 shadow-soft sm:p-5"><p className="text-sm font-semibold text-white">{step.title}</p><p className="mt-2 text-xs leading-relaxed text-ink-400">{step.text}</p></div>)}
            <div className="glass flex items-center rounded-2xl border border-white/10 p-4 shadow-soft sm:p-5">
              <div className="space-y-2">
                <button type="button" onClick={() => scrollToSection(uploadSectionRef)} className="inline-flex items-center gap-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1.5 text-[11px] font-semibold text-brand-300 transition hover:bg-brand-500/20">{copy.openUpload}<ArrowRight size={12} /></button>
                <div className="flex flex-wrap gap-2 text-[11px] text-ink-500">
                  <button type="button" onClick={() => scrollToSection(librarySectionRef)} className="rounded-full border border-white/10 px-3 py-1.5 hover:text-white">{copy.openLibrary}</button>
                  <button type="button" onClick={() => scrollToSection(chatSectionRef)} className="rounded-full border border-white/10 px-3 py-1.5 hover:text-white">{copy.openChat}</button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Main card */}
        <div className="mt-8 flex items-end justify-between gap-4">
          <div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-300">Ingestion desk</p><h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Bring new context into your workspace.</h2></div>
          <span className="hidden rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[10px] uppercase tracking-[0.12em] text-ink-500 sm:inline">PDF · TXT · CSV</span>
        </div>
        <main data-export-section="ingestion" className="mt-4 grid gap-4 sm:gap-6 lg:grid-cols-[1.45fr_0.75fr]">
          {/* Upload panel */}
          <section ref={uploadSectionRef} className="workspace-panel min-w-0 rounded-3xl border border-white/[0.09] p-4 shadow-[0_24px_70px_rgba(0,0,0,0.2)] sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-300">
                {copy.uploadTitle}
              </h2>
              <span className="shrink-0 font-mono text-xs text-ink-500">
                {stats.total} file{stats.total === 1 ? '' : 's'}
              </span>
            </div>

            <Dropzone onFiles={handleFiles} disabled={isSending} />

            {/* Action bar */}
            <div className="mt-4 flex flex-wrap items-center gap-3 sm:mt-5">
              <button
                type="button"
                onClick={handleSendAll}
                disabled={!canSend}
                className={[
                  'group inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all',
                  canSend
                    ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-lift hover:from-brand-400 hover:to-brand-500'
                    : 'cursor-not-allowed bg-white/5 text-ink-500',
                ].join(' ')}
              >
                {isSending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send
                    size={16}
                    className={canSend ? 'transition group-hover:-translate-y-0.5' : ''}
                  />
                )}
                {isSending
                  ? 'Sending…'
                  : `Send ${stats.queued + stats.error > 0 ? `(${stats.queued + stats.error})` : 'all'} to n8n`}
              </button>

              {isSending && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Cancel
                </button>
              )}

              {stats.total > 0 && !isSending && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-sm font-medium text-ink-300 transition hover:border-danger-500/40 hover:text-danger-300"
                >
                  <Trash2 size={14} />
                  Clear all
                </button>
              )}

              {stats.success + stats.error > 0 && (
                <button
                  type="button"
                  onClick={handleClearCompleted}
                  className="ml-auto text-xs font-medium text-ink-400 transition hover:text-ink-200"
                >
                  Clear finished
                </button>
              )}
            </div>

            {/* File list */}
            {items.length > 0 ? (
              <ul className="scrollbar-thin mt-5 max-h-[50vh] space-y-3 overflow-y-auto pr-1 lg:max-h-[420px]">
                {items.map((item) => (
                  <FileRow
                    key={item.id}
                    item={item}
                    onRemove={handleRemove}
                    onRetry={handleRetry}
                  />
                ))}
              </ul>
            ) : (
              <div className="mt-6 flex items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-8 text-center">
                <p className="text-sm text-ink-400">
                  {copy.uploadEmpty}
                </p>
              </div>
            )}
          </section>

          {/* Side panel */}
          <aside className="min-w-0 space-y-4">
            {/* Stats */}
            <div className="workspace-panel rounded-3xl border border-white/[0.09] p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-ink-300">
                Session
              </h3>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Stat label="Total" value={String(stats.total)} />
                <Stat label="Sent" value={String(stats.success)} tone="success" />
                <Stat label="Queued" value={String(stats.queued)} tone="muted" />
                <Stat label="Failed" value={String(stats.error)} tone="danger" />
              </div>
              <div className="mt-4 flex items-center justify-between rounded-xl bg-white/[0.03] px-3 py-2.5 text-xs">
                <span className="text-ink-400">Total payload</span>
                <span className="font-mono font-semibold text-ink-100">
                  {formatBytes(stats.totalBytes)}
                </span>
              </div>
            </div>

            {/* Webhook info */}
            <div className="workspace-panel rounded-3xl border border-white/[0.09] p-5">
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-accent-400" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-ink-300">
                  Webhook
                </h3>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-ink-950/60 px-3 py-2.5 ring-1 ring-white/10">
                <code className="truncate font-mono text-xs text-ink-200">
                  {WEBHOOK_URL}
                </code>
                <span className="shrink-0 rounded-md bg-brand-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-brand-300">
                  POST
                </span>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-ink-400">
                Files are sent as <span className="font-mono text-ink-200">multipart/form-data</span> with the
                field name <span className="font-mono text-ink-200">data</span>. n8n's Webhook
                node exposes the upload as <span className="font-mono text-ink-200">data</span> (binary) in the workflow.
              </p>
            </div>

            {/* Tips */}
            <div className="workspace-panel rounded-3xl border border-white/[0.09] p-5">
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-success-400" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-ink-300">
                  Good to know
                </h3>
              </div>
              <ul className="mt-3 space-y-2.5 text-xs text-ink-400">
                <li className="flex gap-2">
                  <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-success-400" />
                  <span>Accepted: TXT, PDF, CSV — up to 25 MB each.</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-success-400" />
                  <span>Files are sent directly from your browser to n8n.</span>
                </li>
                <li className="flex gap-2">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0 text-warning-400" />
                  <span>
                    If n8n runs on another host, enable CORS on the webhook
                    response.
                  </span>
                </li>
              </ul>
            </div>
          </aside>
        </main>

        <section data-export-section="overview" className="mt-10 sm:mt-12">
          <SectionHeading eyebrow="Workspace overview" title="Your document system at a glance." description="Live totals from your private library." />
          <DocumentDashboard documents={documents} />
        </section>

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
              <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-300">
                {copy.chatTitle}
              </h2>
              <p className="text-xs text-ink-500">
                {selectedChatDocuments.length > 1 ? `${selectedChatDocuments.length} selected documents` : copy.chatSubtitle(selectedDocument)}
              </p>
            </div></div>
            <span className="hidden items-center gap-2 rounded-full border border-success-400/15 bg-success-500/[0.06] px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-success-300 sm:inline-flex"><span className="h-1.5 w-1.5 rounded-full bg-success-400" /> Source-aware assistant</span>
          </div>
          <div className="mx-auto w-full max-w-4xl">
            <ChatPanel document={selectedDocument} sourceDocuments={selectedChatDocuments} onClearDocument={clearChatSources} copy={{ emptyTitle: copy.chatEmptyTitle, emptyDescription: copy.chatEmptyDescription, emptyHint: copy.chatEmptyHint }} />
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-12 border-t border-white/10 pt-10 text-sm text-ink-500 sm:mt-16">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4"><div className="lg:col-span-1"><DocuAIBrand size="sm" subtitle="Private document workspace" /><p className="mt-3 max-w-xs text-xs leading-relaxed">A private workspace for turning documents into useful, grounded answers.</p></div><FooterColumn title="Workspace" links={[['Home', '/'], ['Document library', '#top'], ['AI Chat', '#document-chat'], ['About DocuAI', '/about']]} /><FooterColumn title="Coming next" links={[['Multi-document chat', '#document-chat'], ['Page-level citations', '/about'], ['Document activity', '#top'], ['Team workspaces', '/about']]} /><FooterColumn title="Platform" links={[['Private storage', '/about'], ['Supabase + n8n', '/about'], ['Webhook documentation', 'https://docs.n8n.io/integrations/builtin/trigger-node/webhook/'], ['Source code', 'https://github.com']]} /></div><div className="mt-10 flex flex-col justify-between gap-4 border-t border-white/10 py-5 text-xs sm:flex-row sm:items-center"><span>© {new Date().getFullYear()} DocuAI. All rights reserved.</span><div className="flex items-center gap-4"><span className="font-medium text-ink-400">by Daff</span><CreatorSocialLinks compact /></div></div>
        </footer>
      </div>

      {settingsOpen && <WorkspaceSettingsModal
        title={copy.settingsTitle}
        theme={preferences.theme}
        language={preferences.language}
        themeDarkLabel={copy.themeDark}
        themeLightLabel={copy.themeLight}
        themeSystemLabel={copy.themeSystem}
        languageIdLabel={copy.languageId}
        languageEnLabel={copy.languageEn}
        saveHint={copy.settingsSaveHint}
        onClose={() => setSettingsOpen(false)}
        onThemeChange={(theme) => setPreferences((prev) => ({ ...prev, theme }))}
        onLanguageChange={(language) => setPreferences((prev) => ({ ...prev, language }))}
      />}
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
  return <button type="button" onClick={onClick} className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-ink-400 transition hover:bg-white/[0.06] hover:text-white"><Icon size={14} />{label}</button>;
}

function WorkspacePulse({ value, label, icon: Icon, tone = 'brand' }: { value: number; label: string; icon: LucideIcon; tone?: 'brand' | 'success' | 'danger' | 'muted' }) {
  const toneClass = tone === 'success' ? 'text-success-300 bg-success-500/10 border-success-400/15' : tone === 'danger' ? 'text-danger-300 bg-danger-500/10 border-danger-400/15' : tone === 'muted' ? 'text-ink-500 bg-white/[0.03] border-white/[0.07]' : 'text-brand-300 bg-brand-500/10 border-brand-400/15';
  return <div className="bg-[#0a101a] p-4 transition hover:bg-[#0d1522]"><div className={`flex h-8 w-8 items-center justify-center rounded-lg border ${toneClass}`}><Icon size={14} /></div><p className="mt-4 text-2xl font-semibold tracking-tight text-white">{value}</p><p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-ink-600">{label}</p></div>;
}

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-end"><div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-300">{eyebrow}</p><h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">{title}</h2></div><p className="max-w-sm text-xs leading-5 text-ink-500">{description}</p></div>;
}

function WorkspaceCommandPalette({ query, onQueryChange, documentCount, selectedCount, onClose, onUpload, onLibrary, onChat, onSettings }: { query: string; onQueryChange: (value: string) => void; documentCount: number; selectedCount: number; onClose: () => void; onUpload: () => void; onLibrary: () => void; onChat: () => void; onSettings: () => void }) {
  const actions: Array<{ title: string; description: string; keywords: string; icon: LucideIcon; shortcut: string; onClick: () => void }> = [
    { title: 'Upload documents', description: 'Add PDF, TXT, or CSV to this workspace', keywords: 'upload add file import', icon: UploadCloud, shortcut: 'U', onClick: onUpload },
    { title: 'Open document library', description: `${documentCount} documents available`, keywords: 'library documents files search', icon: Library, shortcut: 'L', onClick: onLibrary },
    { title: 'Ask DocuAI', description: selectedCount ? `Chat with ${selectedCount} selected sources` : 'Start a knowledge base conversation', keywords: 'chat ask ai assistant', icon: MessageSquare, shortcut: 'A', onClick: onChat },
    { title: 'Workspace preferences', description: 'Change theme and language', keywords: 'settings theme language preferences', icon: Settings, shortcut: 'S', onClick: onSettings },
  ];
  const normalized = query.trim().toLowerCase();
  const visible = actions.filter((action) => !normalized || `${action.title} ${action.description} ${action.keywords}`.toLowerCase().includes(normalized));

  return (
    <div className="fixed inset-0 z-[110] flex items-start justify-center px-4 pt-[12vh] sm:pt-[16vh]">
      <button type="button" aria-label="Close quick find" onClick={onClose} className="absolute inset-0 bg-black/75 backdrop-blur-md" />
      <div role="dialog" aria-modal="true" aria-label="Workspace quick find" className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-white/10 bg-[#0a0f18]/95 shadow-[0_35px_120px_rgba(0,0,0,0.65)] backdrop-blur-2xl">
        <div className="flex items-center gap-3 border-b border-white/[0.08] px-5 py-4"><Search size={18} className="shrink-0 text-brand-300" /><input autoFocus value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Search workspace actions..." className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-ink-600" /><button type="button" onClick={onClose} className="rounded-lg border border-white/10 p-1.5 text-ink-500 transition hover:bg-white/5 hover:text-white"><X size={14} /></button></div>
        <div className="p-2">
          <p className="px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-ink-700">Quick actions</p>
          {visible.map(({ title, description, icon: Icon, shortcut, onClick }) => <button key={title} type="button" onClick={onClick} className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-brand-500/[0.09]"><span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.035] text-ink-400 transition group-hover:border-brand-400/20 group-hover:text-brand-300"><Icon size={17} /></span><span className="min-w-0 flex-1"><span className="block text-sm font-medium text-ink-200 group-hover:text-white">{title}</span><span className="mt-0.5 block text-[11px] text-ink-600">{description}</span></span><kbd className="rounded-md border border-white/[0.08] bg-black/25 px-2 py-1 font-mono text-[9px] text-ink-600">{shortcut}</kbd></button>)}
          {!visible.length && <div className="px-4 py-10 text-center"><Search size={22} className="mx-auto text-ink-700" /><p className="mt-3 text-sm text-ink-500">No matching workspace action.</p></div>}
        </div>
        <div className="flex items-center justify-between border-t border-white/[0.07] px-5 py-3 text-[9px] uppercase tracking-[0.12em] text-ink-700"><span>DocuAI command center</span><span>ESC to close</span></div>
      </div>
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

function WorkspaceSettingsModal({
  title,
  theme,
  language,
  themeDarkLabel,
  themeLightLabel,
  themeSystemLabel,
  languageIdLabel,
  languageEnLabel,
  saveHint,
  onClose,
  onThemeChange,
  onLanguageChange,
}: {
  title: string;
  theme: WorkspaceTheme;
  language: WorkspaceLanguage;
  themeDarkLabel: string;
  themeLightLabel: string;
  themeSystemLabel: string;
  languageIdLabel: string;
  languageEnLabel: string;
  saveHint: string;
  onClose: () => void;
  onThemeChange: (theme: WorkspaceTheme) => void;
  onLanguageChange: (language: WorkspaceLanguage) => void;
}) {
  return <div className="fixed inset-0 z-[60] flex items-end bg-black/70 p-0 sm:items-center sm:justify-center sm:p-4"><div className="glass w-full max-w-lg rounded-t-2xl border border-white/15 p-5 shadow-2xl sm:rounded-2xl"><div className="flex items-start justify-between gap-4"><div><h3 className="text-base font-semibold text-white">{title}</h3><p className="mt-1 text-xs text-ink-500">{saveHint}</p></div><button onClick={onClose} className="rounded-lg p-1.5 text-ink-400 hover:bg-white/5 hover:text-white" aria-label="Close settings"><Settings size={17} /></button></div><div className="mt-5 space-y-5"><PreferenceGroup label="Theme" icon={theme === 'light' ? SunMedium : MoonStar}><div className="grid grid-cols-3 gap-2">{(['dark', 'light', 'system'] as WorkspaceTheme[]).map((option) => <button key={option} type="button" onClick={() => onThemeChange(option)} className={`rounded-xl border px-3 py-2 text-sm transition ${theme === option ? 'border-brand-500/50 bg-brand-500/15 text-white' : 'border-white/10 bg-white/5 text-ink-300 hover:text-white'}`}>{option === 'dark' ? themeDarkLabel : option === 'light' ? themeLightLabel : themeSystemLabel}</button>)}</div></PreferenceGroup><PreferenceGroup label="Language" icon={Languages}><div className="grid grid-cols-2 gap-2">{([{ value: 'id', label: languageIdLabel }, { value: 'en', label: languageEnLabel }] as const).map((option) => <button key={option.value} type="button" onClick={() => onLanguageChange(option.value)} className={`rounded-xl border px-3 py-2 text-sm transition ${language === option.value ? 'border-brand-500/50 bg-brand-500/15 text-white' : 'border-white/10 bg-white/5 text-ink-300 hover:text-white'}`}>{option.label}</button>)}</div></PreferenceGroup></div><div className="mt-6 flex justify-end"><button onClick={onClose} className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-400">Done</button></div></div></div>;
}

function PreferenceGroup({ label, icon: Icon, children }: { label: string; icon: typeof MoonStar; children: React.ReactNode; }) {
  return <div><div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-300"><Icon size={14} className="text-brand-300" />{label}</div>{children}</div>;
}

function FooterColumn({ title, links }: { title: string; links: [string, string][] }) {
  return <div><p className="text-xs font-semibold uppercase tracking-wider text-ink-300">{title}</p><div className="mt-3 space-y-2.5">{links.map(([label, href]) => href.startsWith('http') ? <a key={label} href={href} target="_blank" rel="noreferrer" className="block text-xs hover:text-white">{label}</a> : href.startsWith('/') ? <Link key={label} to={href} className="block text-xs hover:text-white">{label}</Link> : <a key={label} href={href} className="block text-xs hover:text-white">{label}</a>)}</div></div>;
}

function Stat({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string;
  tone?: 'default' | 'success' | 'danger' | 'muted';
}) {
  const toneClass = (() => {
    switch (tone) {
      case 'success':
        return 'text-success-300';
      case 'danger':
        return 'text-danger-300';
      case 'muted':
        return 'text-ink-300';
      default:
        return 'text-white';
    }
  })();
  return (
    <div className="rounded-xl bg-white/[0.03] px-3 py-2.5 ring-1 ring-white/5">
      <p className="text-[11px] uppercase tracking-wider text-ink-500">{label}</p>
      <p className={`mt-0.5 text-xl font-bold ${toneClass}`}>{value}</p>
    </div>
  );
}

export default App;
