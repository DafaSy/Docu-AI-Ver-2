import { supabase } from './supabase';
import type { ChatSource, ConversationMessage, ConversationRecord } from '../types';

export async function listConversations(userId: string): Promise<ConversationRecord[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as ConversationRecord[];
}

export async function createConversation(input: {
  userId: string;
  sessionId: string;
  title: string;
  documentId?: string;
}): Promise<ConversationRecord> {
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      user_id: input.userId,
      session_id: input.sessionId,
      title: input.title,
      document_id: input.documentId ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as ConversationRecord;
}

export async function listConversationMessages(conversationId: string): Promise<ConversationMessage[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((message) => ({
    ...message,
    sources: Array.isArray(message.sources) ? message.sources : [],
  })) as ConversationMessage[];
}

export async function saveConversationMessage(input: {
  conversationId: string;
  role: ConversationMessage['role'];
  content: string;
  sources?: ChatSource[];
}): Promise<void> {
  const { error } = await supabase.from('messages').insert({
    conversation_id: input.conversationId,
    role: input.role,
    content: input.content,
    sources: input.sources ?? [],
  });
  if (error) throw error;
}

export async function deleteConversation(conversationId: string): Promise<void> {
  const { error } = await supabase.from('conversations').delete().eq('id', conversationId);
  if (error) throw error;
}

export async function renameConversation(conversationId: string, title: string): Promise<ConversationRecord> {
  const { data, error } = await supabase
    .from('conversations')
    .update({ title: title.trim() })
    .eq('id', conversationId)
    .select()
    .single();
  if (error) throw error;
  return data as ConversationRecord;
}
