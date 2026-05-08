import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

/** Per-user sync turns for Apothecary / Ayurveda (not community `chat_messages`, which uses room_id). */
const TABLE = 'apothecary_chat_messages' as const;

export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

export function useChatMessages(context: 'apothecary' | 'ayurveda') {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadMessages() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from(TABLE)
        .select('id, role, content, created_at')
        .eq('user_id', user.id)
        .eq('chat_context', context)
        .order('created_at', { ascending: true })
        .limit(100);
      if (!cancelled && !error && data) {
        setMessages(data as ChatMessage[]);
      }
      if (!cancelled) setLoading(false);
    }
    loadMessages();
    return () => {
      cancelled = true;
    };
  }, [context]);

  const saveMessage = useCallback(async (message: Omit<ChatMessage, 'id' | 'created_at'>) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from(TABLE)
      .insert({
        user_id: user.id,
        chat_context: context,
        role: message.role,
        content: message.content,
      })
      .select()
      .single();
    if (!error && data) {
      setMessages((prev) => [...prev, data as ChatMessage]);
    }
  }, [context]);

  const clearMessages = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from(TABLE).delete().eq('user_id', user.id).eq('chat_context', context);
    setMessages([]);
  }, [context]);

  return { messages, loading, saveMessage, clearMessages };
}
