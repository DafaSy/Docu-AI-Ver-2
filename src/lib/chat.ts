const PROXY_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/n8n-proxy`;
const webhookMode = import.meta.env.VITE_N8N_WEBHOOK_MODE === 'test' ? 'webhook-test' : 'webhook';
const CHAT_WEBHOOK_PATH = `/${webhookMode}/chat`;

import type { ChatSource } from '../types';
import { supabase } from './supabase';

const SESSION_ID_ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export function generateSessionId(length = 16): string {
  const values = crypto.getRandomValues(new Uint32Array(length));
  let out = '';
  for (let i = 0; i < length; i++) {
    out += SESSION_ID_ALPHABET[values[i] % SESSION_ID_ALPHABET.length];
  }
  return out;
}

export interface ChatResult {
  ok: boolean;
  reply: string;
  sources: ChatSource[];
  status: number | 'network-error' | 'aborted' | 'unknown';
}

function normalizeSources(value: unknown): ChatSource[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((source): ChatSource[] => {
    if (typeof source === 'string') return [{ fileName: source }];
    if (!source || typeof source !== 'object') return [];
    const item = source as Record<string, unknown>;
    const metadata = item.metadata && typeof item.metadata === 'object'
      ? item.metadata as Record<string, unknown>
      : {};
    const fileName = item.fileName ?? item.filename ?? metadata.fileName ?? metadata.filename;
    if (typeof fileName !== 'string' || !fileName.trim()) return [];
    const page = item.page ?? item.pageNumber ?? metadata.page ?? metadata.pageNumber;
    const documentId = item.documentId ?? metadata.documentId;
    const excerpt = item.excerpt ?? item.content ?? item.text;
    return [{
      fileName,
      ...(typeof documentId === 'string' ? { documentId } : {}),
      ...(typeof page === 'string' || typeof page === 'number' ? { page } : {}),
      ...(typeof excerpt === 'string' ? { excerpt } : {}),
    }];
  });
}

function extractPayload(value: unknown, fallback: string): { reply: string; sources: ChatSource[] } {
  if (typeof value === 'string') {
    const jsonCandidate = value
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();
    try {
      return extractPayload(JSON.parse(jsonCandidate), value);
    } catch {
      return { reply: value, sources: [] };
    }
  }

  if (value && typeof value === 'object') {
    const item = value as Record<string, unknown>;
    const replyValue = item.reply ?? item.output ?? item.response ?? item.message ?? item.text;
    const reply = typeof replyValue === 'string' ? replyValue : fallback;
    return { reply, sources: normalizeSources(item.sources) };
  }

  return { reply: fallback, sources: [] };
}

export async function sendChatMessage(
  chatInput: string,
  sessionId: string,
  userId: string,
  signal?: AbortSignal,
  documentId?: string,
  documentIds?: string[],
): Promise<ChatResult> {
  const sourceDocumentIds = documentIds?.length ? documentIds : documentId ? [documentId] : [];
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      return { ok: false, reply: 'Your session has expired. Sign in again.', sources: [], status: 401 };
    }

    const res = await fetch(`${PROXY_BASE}${CHAT_WEBHOOK_PATH}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        chatinput: chatInput,
        // Keep the legacy camelCase field while n8n test and production
        // workflow revisions are being synchronized.
        chatInput,
        sessionId: sessionId,
        userID: userId,
        documentId,
        documentIds: sourceDocumentIds,
        sourceDocumentIds,
      }),
      signal,
    });

    if (!res.ok) {
      return {
        ok: false,
        reply: `Webhook responded with ${res.status}.`,
        sources: [],
        status: res.status,
      };
    }

    const text = await res.text();
    let reply = text;
    let sources: ChatSource[] = [];

    try {
      const json = JSON.parse(text);
      if (Array.isArray(json)) {
        const first = json[0];
        ({ reply, sources } = extractPayload(first, text));
      } else {
        ({ reply, sources } = extractPayload(json, text));
      }
    } catch {
      // not JSON — use raw text
    }

    return { ok: true, reply, sources, status: res.status };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return { ok: false, reply: 'Cancelled.', sources: [], status: 'aborted' };
    }
    return {
      ok: false,
      reply:
        err instanceof Error
          ? `Network error: ${err.message}`
          : 'Could not reach the n8n chat webhook.',
      sources: [],
      status: 'network-error',
    };
  }
}

export { CHAT_WEBHOOK_PATH };
