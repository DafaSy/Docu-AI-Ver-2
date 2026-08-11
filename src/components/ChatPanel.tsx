import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Bot,
  Download,
  FileText,
  FolderOpen,
  Loader2,
  MessageSquare,
  Pencil,
  Plus,
  Search,
  Send,
  Trash2,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import type { ChatSource, ConversationRecord, DocumentRecord } from '../types';
import { generateId } from '../lib/format';
import { CHAT_WEBHOOK_PATH, generateSessionId, sendChatMessage } from '../lib/chat';
import {
  createConversation,
  deleteConversation,
  listConversationMessages,
  listConversations,
  renameConversation,
  saveConversationMessage,
} from '../lib/conversations';

interface ChatMessage {
  id: string;
  role: 'user' | 'bot' | 'error';
  text: string;
  timestamp: number;
  sources: ChatSource[];
}

function toChatMessage(message: { id: string; role: 'user' | 'assistant' | 'error'; content: string; created_at: string; sources: ChatSource[] }): ChatMessage {
  return {
    id: message.id,
    role: message.role === 'assistant' ? 'bot' : message.role,
    text: message.content,
    timestamp: new Date(message.created_at).getTime(),
    sources: message.sources,
  };
}

function conversationTitle(text: string) {
  return text.length > 48 ? `${text.slice(0, 48).trim()}…` : text;
}

export function ChatPanel({
  document,
  sourceDocuments,
  onClearDocument,
  copy,
}: {
  document?: DocumentRecord;
  sourceDocuments?: DocumentRecord[];
  onClearDocument?: () => void;
  copy?: { emptyTitle: string; emptyDescription: string; emptyHint: string; };
}) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<ConversationRecord[]>([]);
  const [conversation, setConversation] = useState<ConversationRecord>();
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyQuery, setHistoryQuery] = useState('');
  const [showMobileHistory, setShowMobileHistory] = useState(false);
  void showMobileHistory;
  const sessionIdRef = useRef<string>(generateSessionId());
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const activeDocuments = useMemo(() => {
    if (sourceDocuments && sourceDocuments.length > 0) return sourceDocuments;
    return document ? [document] : [];
  }, [document, sourceDocuments]);

  const refreshConversations = useCallback(async () => {
    if (!user) return;
    try {
      setConversations(await listConversations(user.id));
    } catch (error) {
      console.error('Could not load chat history', error);
    }
  }, [user]);

  useEffect(() => { void refreshConversations(); }, [refreshConversations]);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  const startNewChat = useCallback(() => {
    abortRef.current?.abort();
    setConversation(undefined);
    setMessages([]);
    sessionIdRef.current = generateSessionId();
    inputRef.current?.focus();
  }, []);

  const selectConversation = useCallback(async (item: ConversationRecord) => {
    if (isSending) return;
    setConversation(item);
    sessionIdRef.current = item.session_id;
    setIsLoadingHistory(true);
    try {
      const savedMessages = await listConversationMessages(item.id);
      setMessages(savedMessages.map(toChatMessage));
    } catch (error) {
      console.error('Could not load conversation messages', error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [isSending]);

  const ensureConversation = useCallback(async (firstMessage: string) => {
    if (conversation) return conversation;
    if (!user) return undefined;
    const created = await createConversation({
      userId: user.id,
      sessionId: sessionIdRef.current,
      title: conversationTitle(firstMessage),
      documentId: activeDocuments.length === 1 ? activeDocuments[0].id : undefined,
    });
    setConversation(created);
    setConversations((prev) => [created, ...prev]);
    return created;
  }, [activeDocuments, conversation, user]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isSending || !user) return;

    const userMsg: ChatMessage = { id: generateId(), role: 'user', text, timestamp: Date.now(), sources: [] };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsSending(true);

    let savedConversation: ConversationRecord | undefined;
    try {
      savedConversation = await ensureConversation(text);
      if (savedConversation) {
        await saveConversationMessage({ conversationId: savedConversation.id, role: 'user', content: text });
      }
    } catch (error) {
      console.error('Could not save conversation', error);
    }

    const controller = new AbortController();
    abortRef.current = controller;
    const result = await sendChatMessage(
      text,
      sessionIdRef.current,
      user.id,
      controller.signal,
      activeDocuments[0]?.id,
      activeDocuments.map((item) => item.id),
    );
    setIsSending(false);
    abortRef.current = null;

    if (result.status === 'aborted') return;

    const sources = result.sources.length > 0
      ? result.sources
      : activeDocuments.map((item) => ({ documentId: item.id, fileName: item.file_name }));
    const botMessage: ChatMessage = {
      id: generateId(),
      role: result.ok ? 'bot' : 'error',
      text: result.reply,
      timestamp: Date.now(),
      sources,
    };
    setMessages((prev) => [...prev, botMessage]);

    if (savedConversation) {
      try {
        await saveConversationMessage({
          conversationId: savedConversation.id,
          role: result.ok ? 'assistant' : 'error',
          content: result.reply,
          sources,
        });
        await refreshConversations();
      } catch (error) {
        console.error('Could not save assistant reply', error);
      }
    }
  }, [activeDocuments, ensureConversation, input, isSending, refreshConversations, user]);

  const handleDeleteConversation = useCallback(async (event: React.MouseEvent, id: string) => {
    event.stopPropagation();
    try {
      await deleteConversation(id);
      setConversations((prev) => prev.filter((item) => item.id !== id));
      if (conversation?.id === id) startNewChat();
    } catch (error) {
      console.error('Could not delete conversation', error);
    }
  }, [conversation?.id, startNewChat]);

  const handleRenameConversation = useCallback(async () => {
    if (!conversation) return;
    const title = window.prompt('Conversation title', conversation.title)?.trim();
    if (!title || title === conversation.title) return;
    try {
      const updated = await renameConversation(conversation.id, title);
      setConversation(updated);
      setConversations((items) => items.map((item) => item.id === updated.id ? updated : item));
    } catch (error) { console.error('Could not rename conversation', error); }
  }, [conversation]);

  const handleExportConversation = useCallback(() => {
    if (messages.length === 0) return;
    const content = messages.map((message) => {
      const author = message.role === 'user' ? 'You' : message.role === 'bot' ? 'AI Assistant' : 'Error';
      const sources = message.sources.length ? `\nSources: ${message.sources.map((source) => source.fileName).join(', ')}` : '';
      return `${author}: ${message.text}${sources}`;
    }).join('\n\n');
    const blob = new Blob([`${conversation?.title ?? 'Conversation'}\n\n${content}\n`], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob); const anchor = window.document.createElement('a');
    anchor.href = url; anchor.download = `${(conversation?.title ?? 'conversation').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'conversation'}.txt`;
    anchor.click(); URL.revokeObjectURL(url);
  }, [conversation?.title, messages]);

  const clearSourcesLabel = activeDocuments.length > 1 ? 'Clear sources' : 'Clear document';

  return (
    <div className="glass relative flex h-[min(72svh,560px)] min-h-[420px] overflow-hidden rounded-2xl border border-white/10 shadow-soft">
      <aside className="hidden w-52 shrink-0 flex-col border-r border-white/10 bg-black/10 sm:flex">
        <div className="p-3">
          <button onClick={startNewChat} className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-brand-500/30 bg-brand-500/10 px-2 py-2 text-xs font-medium text-brand-300 hover:bg-brand-500/20">
            <Plus size={14} /> New chat
          </button>
        </div>
        <div className="px-3 pb-2"><label className="relative block"><Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-ink-600" /><input value={historyQuery} onChange={(event) => setHistoryQuery(event.target.value)} placeholder="Search chats" className="w-full rounded-md border border-white/10 bg-white/5 py-1.5 pl-7 pr-2 text-[11px] text-ink-300 placeholder:text-ink-600 focus:border-brand-500 focus:outline-none" /></label></div>
        <div className="scrollbar-thin flex-1 space-y-1 overflow-y-auto px-2 pb-3">
          <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-ink-600">History</p>
          {conversations.filter((item) => item.title.toLowerCase().includes(historyQuery.toLowerCase())).map((item) => (
            <button key={item.id} onClick={() => void selectConversation(item)} className={`group flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs transition ${conversation?.id === item.id ? 'bg-white/10 text-white' : 'text-ink-400 hover:bg-white/5 hover:text-ink-200'}`}>
              <MessageSquare size={13} className="shrink-0" />
              <span className="min-w-0 flex-1 truncate">{item.title}</span>
              <span onClick={(event) => void handleDeleteConversation(event, item.id)} className="hidden shrink-0 rounded p-0.5 text-ink-500 hover:bg-danger-500/15 hover:text-danger-300 group-hover:block" role="button" aria-label="Delete conversation">
                <Trash2 size={12} />
              </span>
            </button>
          ))}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-3.5 sm:px-5">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-500/15 ring-1 ring-brand-500/20"><MessageSquare size={16} className="text-brand-400" /></div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-white">AI Assistant</h3>
              <p className="truncate text-[11px] text-ink-500">
                {activeDocuments.length > 1 ? `${activeDocuments.length} selected documents` : document ? `Document: ${document.file_name}` : conversation?.title ?? 'Knowledge base chat'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowMobileHistory(true)} className="rounded-lg border border-white/10 p-1.5 text-ink-400 sm:hidden" title="Chat history"><MessageSquare size={13} /></button>
            <button onClick={startNewChat} className="rounded-lg border border-white/10 p-1.5 text-ink-400 sm:hidden" title="New chat"><Plus size={13} /></button>
            <span className="hidden rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-medium text-ink-400 lg:block">Saved automatically</span>
            {conversation && <><button onClick={handleRenameConversation} className="hidden rounded-lg border border-white/10 p-1.5 text-ink-400 hover:text-white sm:block" title="Rename chat"><Pencil size={13} /></button><button onClick={handleExportConversation} className="hidden rounded-lg border border-white/10 p-1.5 text-ink-400 hover:text-white sm:block" title="Export .txt"><Download size={13} /></button></>}
            {activeDocuments.length > 0 && <button onClick={onClearDocument} className="max-w-24 truncate rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-ink-400 hover:text-white sm:max-w-none">{clearSourcesLabel}</button>}
          </div>
        </div>

        {activeDocuments.length > 0 && (
          <div className="flex flex-wrap gap-2 border-b border-white/10 px-5 py-3 text-[11px] text-ink-400">
            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-ink-300"><FolderOpen size={12} /> Sources</span>
            {activeDocuments.map((item) => <span key={item.id} className="rounded-full border border-brand-500/20 bg-brand-500/10 px-2.5 py-1 text-brand-200">{item.file_name}</span>)}
          </div>
        )}

        <div ref={scrollRef} className="scrollbar-thin flex-1 space-y-4 overflow-y-auto px-3 py-4 sm:px-5">
          {isLoadingHistory ? <div className="flex h-full items-center justify-center"><Loader2 size={20} className="animate-spin text-brand-400" /></div> : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/10 ring-1 ring-brand-500/20"><Bot size={22} className="text-brand-400" /></div>
              <p className="text-sm font-medium text-ink-300">{copy?.emptyTitle ?? 'Start a conversation'}</p>
              <p className="mt-1 max-w-[260px] text-xs leading-relaxed text-ink-500">{copy?.emptyDescription ?? 'Ask about a selected document or your full knowledge base. This chat will be saved automatically.'}</p>
              {!document && activeDocuments.length === 0 && <p className="mt-3 max-w-[280px] text-[11px] leading-relaxed text-ink-600">{copy?.emptyHint ?? 'Tip: open the document library first, pick a ready document, then continue here.'}</p>}
            </div>
          ) : messages.map((msg) => (
            <div key={msg.id} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role !== 'user' && <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${msg.role === 'error' ? 'bg-danger-500/15' : 'bg-brand-500/15'}`}>{msg.role === 'error' ? <AlertCircle size={14} className="text-danger-400" /> : <Bot size={14} className="text-brand-400" />}</div>}
              <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed sm:max-w-[75%] ${msg.role === 'user' ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white' : msg.role === 'error' ? 'border border-danger-500/30 bg-danger-500/10 text-danger-200' : 'border border-white/10 bg-white/5 text-ink-100'}`}>
                <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                {msg.role === 'bot' && msg.sources.length > 0 && <div className="mt-3 border-t border-white/10 pt-2"><p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-ink-500">Sources</p>{msg.sources.map((source, index) => <div key={`${source.fileName}-${index}`} className="flex items-center gap-1.5 text-[11px] text-brand-300"><FileText size={12} /><span className="truncate">{source.fileName}{source.page !== undefined ? ` — Page ${source.page}` : ''}</span></div>)}</div>}
                <p className={`mt-1 text-[10px] ${msg.role === 'user' ? 'text-white/50' : 'text-ink-500'}`}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              {msg.role === 'user' && <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10"><UserIcon size={14} className="text-ink-300" /></div>}
            </div>
          ))}
          {isSending && <div className="flex gap-2.5"><div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-500/15"><Bot size={14} className="text-brand-400" /></div><div className="flex items-center gap-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"><span className="h-2 w-2 animate-bounce rounded-full bg-brand-400 [animation-delay:-0.3s]" /><span className="h-2 w-2 animate-bounce rounded-full bg-brand-400 [animation-delay:-0.15s]" /><span className="h-2 w-2 animate-bounce rounded-full bg-brand-400" /></div></div>}
        </div>

        <div className="border-t border-white/10 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <input ref={inputRef} type="text" value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); void handleSend(); } }} placeholder={activeDocuments.length > 1 ? 'Ask across selected documents…' : 'Ask about this document…'} disabled={isSending} className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-ink-500 focus:border-brand-500 focus:outline-none disabled:opacity-50" />
            <button type="button" onClick={() => void handleSend()} disabled={!input.trim() || isSending} className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${input.trim() && !isSending ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white' : 'cursor-not-allowed bg-white/5 text-ink-500'}`}>{isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}</button>
          </div>
          <p className="mt-2 truncate text-[10px] text-ink-600">Webhook: <span className="font-mono text-ink-500">{CHAT_WEBHOOK_PATH}</span></p>
        </div>
      </div>
    </div>
  );
}
