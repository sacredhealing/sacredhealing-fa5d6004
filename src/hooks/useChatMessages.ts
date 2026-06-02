import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

/** 
 * useChatMessages — reads/writes ayurveda_chat_messages (same table the edge function uses).
 * The edge function already saves assistant replies server-side; the frontend only saves user messages.
 */
const TABLE_AYURVEDA = 'ayurveda_chat_messages' as const;
const TABLE_APOTHECARY = 'apothecary_chat_messages' as const;

export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

export function useChatMessages(context: 'apothecary' | 'ayurveda') {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  // Ayurveda uses its own table (ayurveda_chat_messages, no chat_context column)
  // Apothecary uses apothecary_chat_messages with chat_context column
  const isAyurveda = context === 'ayurveda';

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

      let query;
      if (isAyurveda) {
        query = (supabase as any)
          .from(TABLE_AYURVEDA)
          .select('id, role, content, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })
          .limit(100);
      } else {
        query = (supabase as any)
          .from(TABLE_APOTHECARY)
          .select('id, role, content, created_at')
          .eq('user_id', user.id)
          .eq('chat_context', context)
          .order('created_at', { ascending: true })
          .limit(100);
      }

      const { data, error } = await query;
      if (!cancelled && !error && data) {
        setMessages(data as ChatMessage[]);
      }
      if (!cancelled) setLoading(false);
    }
    loadMessages();
    return () => {
      cancelled = true;
    };
  }, [context, isAyurveda]);

  const saveMessage = useCallback(async (message: Omit<ChatMessage, 'id' | 'created_at'>) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // For ayurveda: the edge function saves assistant messages server-side.
    // Only save user messages from the frontend to avoid duplicates.
    if (isAyurveda && message.role === 'assistant') {
      // Optimistically add to local state without persisting (edge function handles persistence)
      const optimistic: ChatMessage = {
        id: `opt-${Date.now()}`,
        role: message.role,
        content: message.content,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimistic]);
      return;
    }

    if (isAyurveda) {
      // Save user message to ayurveda_chat_messages
      const { data, error } = await (supabase as any)
        .from(TABLE_AYURVEDA)
        .insert({
          user_id: user.id,
          role: message.role,
          content: message.content,
        })
        .select()
        .single();
      if (!error && data) {
        setMessages((prev) => [...prev, data as ChatMessage]);
      }
    } else {
      const { data, error } = await (supabase as any)
        .from(TABLE_APOTHECARY)
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
    }
  }, [context, isAyurveda]);

  const clearMessages = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    if (isAyurveda) {
      await (supabase as any).from(TABLE_AYURVEDA).delete().eq('user_id', user.id);
    } else {
      await (supabase as any).from(TABLE_APOTHECARY).delete().eq('user_id', user.id).eq('chat_context', context);
    }
    setMessages([]);
  }, [context, isAyurveda]);

  // After streaming completes, re-fetch from DB to get the real persisted assistant message
  const refreshMessages = useCallback(async () => {
    if (!isAyurveda) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    // Wait 800ms for edge function to finish writing
    await new Promise(r => setTimeout(r, 800));
    const { data, error } = await (supabase as any)
      .from(TABLE_AYURVEDA)
      .select('id, role, content, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(100);
    if (!error && data) {
      setMessages(data as ChatMessage[]);
    }
  }, [isAyurveda]);

  return { messages, loading, saveMessage, clearMessages, refreshMessages };
}
