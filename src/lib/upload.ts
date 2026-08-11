import type { UploadItem } from '../types';
import { MAX_FILE_SIZE } from '../types';
import { getFileKind } from './format';
import { supabase } from './supabase';

const PROXY_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/n8n-proxy`;
const webhookMode = import.meta.env.VITE_N8N_WEBHOOK_MODE === 'test' ? 'webhook-test' : 'webhook';
export const WEBHOOK_URL = `${PROXY_BASE}/${webhookMode}/Upload`;

export interface ValidationResult {
  ok: boolean;
  reason?: string;
}

export function validateFile(file: File): ValidationResult {
  const kind = getFileKind(file);
  if (kind === 'unknown') {
    return {
      ok: false,
      reason: 'Only TXT, PDF, and CSV files are allowed.',
    };
  }
  if (file.size === 0) {
    return { ok: false, reason: 'File is empty.' };
  }
  if (file.size > MAX_FILE_SIZE) {
    return {
      ok: false,
      reason: `File exceeds the 25 MB limit (you uploaded ${(
        file.size /
        1024 /
        1024
      ).toFixed(1)} MB).`,
    };
  }
  return { ok: true };
}

export interface UploadOptions {
  signal?: AbortSignal;
  onProgress?: (progress: number) => void;
}

export async function estimatePdfPageCount(file: File): Promise<number | null> {
  if (getFileKind(file) !== 'pdf') return null;
  try {
    const buffer = await file.arrayBuffer();
    const text = new TextDecoder('latin1').decode(buffer);
    const matches = text.match(/\/Type\s*\/Page\b/g);
    return matches ? matches.length : null;
  } catch {
    return null;
  }
}

export interface UploadResult {
  ok: boolean;
  status: number | 'network-error' | 'aborted' | 'unknown';
  message: string;
  preview?: string;
}

/**
 * Send a single file to the n8n webhook as multipart/form-data.
 * The file is attached under the field name `data`, so n8n's Webhook
 * node exposes it as `data` (binary) in the workflow.
 */
export async function uploadFile(
  item: UploadItem,
  userId: string,
  options: UploadOptions = {},
  documentId?: string,
  metadata?: Record<string, string | number | boolean | null | undefined>,
): Promise<UploadResult> {
  const { signal, onProgress } = options;
  const { file } = item;

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    return {
      ok: false,
      status: 401,
      message: 'Your session has expired. Sign in again before uploading.',
    };
  }

  const form = new FormData();
  form.append('data', file, file.name);
  form.append('filename', file.name);
  form.append('contentType', file.type || 'application/octet-stream');
  form.append('size', String(file.size));
  form.append('userID', userId);
  if (documentId) form.append('documentId', documentId);
  if (metadata) {
    for (const [key, value] of Object.entries(metadata)) {
      if (value === undefined || value === null) continue;
      form.append(key, String(value));
    }
  }

  return new Promise<UploadResult>((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', WEBHOOK_URL, true);
    xhr.responseType = 'text';
    // ngrok-free tunnels serve an interstitial warning page to browsers.
    // This header tells ngrok to skip it and forward the request to n8n.
    xhr.setRequestHeader('ngrok-skip-browser-warning', 'true');
    xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`);
    xhr.setRequestHeader('apikey', import.meta.env.VITE_SUPABASE_ANON_KEY);

    if (signal) {
      if (signal.aborted) {
        resolve({
          ok: false,
          status: 'aborted',
          message: 'Upload cancelled.',
        });
        return;
      }
      signal.addEventListener(
        'abort',
        () => {
          xhr.abort();
        },
        { once: true },
      );
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const pct = Math.min(100, Math.round((event.loaded / event.total) * 100));
        onProgress(pct);
      }
    };

    xhr.onload = () => {
      const status = xhr.status;
      const body = typeof xhr.responseText === 'string' ? xhr.responseText : '';
      const preview = body.slice(0, 280);

      if (status >= 200 && status < 300) {
        resolve({
          ok: true,
          status,
          message: `Uploaded (${status})`,
          preview,
        });
      } else if (status === 0) {
        resolve({
          ok: false,
          status: 'network-error',
          message:
            'Could not reach the n8n webhook. Make sure n8n is running and the webhook URL is reachable from this browser.',
        });
      } else {
        let serverMessage = '';
        try {
          const parsed = JSON.parse(body) as { message?: string; error?: string };
          serverMessage = parsed.message || parsed.error || '';
        } catch {
          serverMessage = '';
        }
        resolve({
          ok: false,
          status,
          message: serverMessage || `Upload rejected by the server (${status}).`,
          preview,
        });
      }
    };

    xhr.onerror = () => {
      resolve({
        ok: false,
        status: 'network-error',
        message:
          'Network error while contacting the n8n webhook. Check that n8n is running and CORS is allowed for this origin.',
      });
    };

    xhr.ontimeout = () => {
      resolve({
        ok: false,
        status: 'network-error',
        message: 'The request to the n8n webhook timed out.',
      });
    };

    try {
      xhr.send(form);
    } catch (err) {
      resolve({
        ok: false,
        status: 'unknown',
        message:
          err instanceof Error
            ? `Failed to send: ${err.message}`
            : 'Failed to send the file.',
      });
    }
  });
}
