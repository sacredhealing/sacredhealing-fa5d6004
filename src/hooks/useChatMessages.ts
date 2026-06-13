import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

/** 
 * useChatMessages — reads/writes apothecary_chat_messages (same table the edge function uses).
 * The edge function already saves assistant replies server-side; the frontend only saves user messages.
 * FIX 2026-06-13: 8s loading timeout prevents permanent black screen on slow/failed auth.
 */
const TABLE_AYURVEDA = 'apothecary_chat_messages' as const;
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

  const isAyurveda = context === 'ayurveda';

  useEffect(() => {
    let cancelled = false;
    // Safety timeout: never leave loading=true longer than 8s — prevents black screen
    const timeout = setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 8000);

    async function loadMessages() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          if (!cancelled) setLoading(false);
          clearTimeout(timeout);
          return;
        }

        let query;
        if (isAyurveda) {
          query = (supabase as any)
            .from(TABLE_AYURVEDA)
            .select('id, role, content, created_at')
            .eq('user_id', user.id)
            .eq('chat_context', 'ayurveda')
            .order('created_at', { ascending: true })
            .limit(500);
        } else {
          query = (supabase as any)
            .from(TABLE_APOTHECARY)
            .select('id, role, content, created_at')
            .eq('user_id', user.id)
            .eq('chat_context', context)
            .order('created_at', { ascending: true })
            .limit(500);
        }

        const { data, error } = await query;
        if (!cancelled && !error && data) {
          setMessages(data as ChatMessage[]);
        }
      } catch {
        // non-fatal: loading will resolve via timeout or here
      }
      if (!cancelled) {
        setLoading(false);
        clearTimeout(timeout);
      }
    }
    loadMessages();
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [context, isAyurveda]);

  const saveMessage = useCallback(async (message: Omit<ChatMessage, 'id' | 'created_at'>) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // For ayurveda: the edge function saves assistant messages server-side.
    // Add optimistically to local state; edge fn handles DB persistence.
    if (isAyurveda && message.role === 'assistant') {
      const optimistic: ChatMessage = {
        id: `opt-${Date.now()}`,
        role: message.role,
        content: message.content,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => {
        // Deduplicate: don't add if same content already in list (edge fn may have written)
        if (prev.some(m => m.role === 'assistant' && m.content === message.content)) return prev;
        return [...prev, optimistic];
      });
      return;
    }

    if (isAyurveda) {
      const { data, error } = await (supabase as any)
        .from(TABLE_AYURVEDA)
        .insert({
          user_id: user.id,
          chat_context: 'ayurveda',
          role: message.role,
          content: message.content,
        })
        .select()
        .single();
      if (!error && data) {
        setMessages((prev) => {
          if (prev.some(m => m.id === data.id)) return prev;
          return [...prev, data as ChatMessage];
        });
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
        setMessages((prev) => {
          if (prev.some(m => m.id === data.id)) return prev;
          return [...prev, data as ChatMessage];
        });
      }
    }
  }, [context, isAyurveda]);

  const clearMessages = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    if (isAyurveda) {
      await (supabase as any).from(TABLE_AYURVEDA).delete().eq('user_id', user.id).eq('chat_context', 'ayurveda');
    } else {
      await (supabase as any).from(TABLE_APOTHECARY).delete().eq('user_id', user.id).eq('chat_context', context);
    }
    setMessages([]);
  }, [context, isAyurveda]);

  const refreshMessages = useCallback(async () => {
    if (!isAyurveda) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    // Wait 1200ms for edge function to finish writing to DB
    await new Promise(r => setTimeout(r, 1200));
    const { data, error } = await (supabase as any)
      .from(TABLE_AYURVEDA)
      .select('id, role, content, created_at')
      .eq('user_id', user.id)
      .eq('chat_context', 'ayurveda')
      .order('created_at', { ascending: true })
      .limit(500);
    if (!error && data) {
      setMessages(data as ChatMessage[]);
    }
  }, [isAyurveda]);

  return { messages, loading, saveMessage, clearMessages, refreshMessages };
}
