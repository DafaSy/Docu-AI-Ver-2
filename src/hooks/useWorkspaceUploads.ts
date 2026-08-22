import { useCallback, useRef, useState, useMemo } from 'react';
import type { User } from '@supabase/supabase-js';
import type { DocumentRecord, ToastMessage, UploadItem } from '../types';
import { generateId, getFileKind } from '../lib/format';
import { estimatePdfPageCount, uploadFile, validateFile } from '../lib/upload';
import { createDocument, updateDocumentStatus } from '../lib/documents';

export function useWorkspaceUploads(
  user: User | null,
  addToast: (toast: Omit<ToastMessage, 'id'>) => void,
  setDocuments: React.Dispatch<React.SetStateAction<DocumentRecord[]>>,
  refreshDocuments: () => Promise<void>
) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [isSending, setIsSending] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

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
    [updateItem, user, refreshDocuments, setDocuments],
  );

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

  return {
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
  };
}
