export type UploadStatus =
  | 'queued'
  | 'uploading'
  | 'success'
  | 'error'
  | 'sent-unconfirmed';

export type FileKind = 'txt' | 'pdf' | 'csv' | 'unknown';

export interface UploadItem {
  id: string;
  file: File;
  kind: FileKind;
  status: UploadStatus;
  progress: number;
  message?: string;
  startedAt?: number;
  finishedAt?: number;
  responsePreview?: string;
}

export type DocumentStatus = 'uploading' | 'processing' | 'ready' | 'failed';

export interface DocumentRecord {
  id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  processing_status: DocumentStatus;
  chunk_count: number;
  page_count: number;
  source_metadata: Record<string, unknown>;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  category: string;
  tags: string[];
  is_favorite: boolean;
}

export interface ChatSource {
  documentId?: string;
  fileName: string;
  page?: number | string;
  excerpt?: string;
}

export interface ConversationRecord {
  id: string;
  user_id: string;
  document_id: string | null;
  session_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'error';
  content: string;
  sources: ChatSource[];
  created_at: string;
}

export interface ToastMessage {
  id: string;
  variant: 'success' | 'error' | 'info';
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const ACCEPTED_EXTENSIONS = ['txt', 'pdf', 'csv'] as const;
export const ACCEPTED_MIME = [
  'text/plain',
  'application/pdf',
  'text/csv',
  'application/csv',
  'text/comma-separated-values',
] as const;

export const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
