import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import type { DocumentRecord, ToastMessage } from '../types';
import { deleteDocument, getDocumentDownloadUrl, getStoredDocumentFile, listDocuments, renameDocument, updateDocumentOrganization, updateDocumentStatus } from '../lib/documents';
import { estimatePdfPageCount, uploadFile } from '../lib/upload';
import { getFileKind } from '../lib/format';

export function useWorkspaceDocuments(user: User | null, addToast: (toast: Omit<ToastMessage, 'id'>) => void) {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [documentBusyId, setDocumentBusyId] = useState<string>();
  const [selectedDocument, setSelectedDocument] = useState<DocumentRecord>();
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [previewDocument, setPreviewDocument] = useState<DocumentRecord>();
  const [documentPendingDelete, setDocumentPendingDelete] = useState<DocumentRecord>();
  const [detailDocument, setDetailDocument] = useState<DocumentRecord>();

  const pendingDeleteTimers = useRef(new Map<string, { document: DocumentRecord; index: number; timeoutId: number }>());

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

  return {
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
  };
}
