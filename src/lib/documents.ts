import { supabase } from './supabase';
import type { DocumentRecord, DocumentStatus, FileKind } from '../types';
import { generateId, getFileKind } from './format';

export const DOCUMENTS_BUCKET = 'documents';

export async function listDocuments(userId: string): Promise<DocumentRecord[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as DocumentRecord[];
}

export async function createDocument(file: File, userId: string): Promise<DocumentRecord> {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? 'file';
  const filePath = `${userId}/${generateId()}.${extension}`;
  const { data: inserted, error: insertError } = await supabase
    .from('documents')
    .insert({
      user_id: userId,
      file_name: file.name,
      file_path: filePath,
      file_type: getFileKind(file),
      file_size: file.size,
      processing_status: 'uploading',
      page_count: 0,
      source_metadata: {},
    })
    .select()
    .single();
  if (insertError) throw insertError;

  const { error: storageError } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(filePath, file, { contentType: file.type || undefined, upsert: false });
  if (storageError) {
    await supabase.from('documents').update({
      processing_status: 'failed',
      error_message: storageError.message,
    }).eq('id', inserted.id);
    throw storageError;
  }
  return inserted as DocumentRecord;
}

export async function updateDocumentStatus(
  id: string,
  status: DocumentStatus,
  errorMessage: string | null = null,
): Promise<DocumentRecord> {
  const { data, error } = await supabase
    .from('documents')
    .update({ processing_status: status, error_message: errorMessage })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as DocumentRecord;
}

export async function renameDocument(id: string, fileName: string): Promise<DocumentRecord> {
  const { data, error } = await supabase
    .from('documents')
    .update({ file_name: fileName.trim() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as DocumentRecord;
}

export async function updateDocumentOrganization(
  id: string,
  input: Partial<Pick<DocumentRecord, 'category' | 'tags' | 'is_favorite'>>,
): Promise<DocumentRecord> {
  const { data, error } = await supabase
    .from('documents')
    .update(input)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as DocumentRecord;
}

export async function deleteDocument(document: DocumentRecord): Promise<void> {
  const { error: storageError } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .remove([document.file_path]);
  if (storageError) throw storageError;
  const { error } = await supabase.from('documents').delete().eq('id', document.id);
  if (error) throw error;
}

export async function getDocumentDownloadUrl(document: DocumentRecord): Promise<string> {
  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(document.file_path, 60);
  if (error) throw error;
  return data.signedUrl;
}

export async function getStoredDocumentFile(document: DocumentRecord): Promise<File> {
  const { data, error } = await supabase.storage.from(DOCUMENTS_BUCKET).download(document.file_path);
  if (error) throw error;
  return new File([data], document.file_name, { type: data.type || mimeForKind(document.file_type) });
}

export interface DocumentActivity { id: number; action: string; details: { fileName?: string }; created_at: string; }
export async function listDocumentActivities(documentId: string): Promise<DocumentActivity[]> {
  const { data, error } = await supabase.from('document_activities').select('*').eq('document_id', documentId).order('created_at', { ascending: false }).limit(12);
  if (error) throw error;
  return (data ?? []) as DocumentActivity[];
}

function mimeForKind(kind: string): string {
  const types: Record<FileKind, string> = { txt: 'text/plain', pdf: 'application/pdf', csv: 'text/csv', unknown: 'application/octet-stream' };
  return types[kind as FileKind] ?? types.unknown;
}
