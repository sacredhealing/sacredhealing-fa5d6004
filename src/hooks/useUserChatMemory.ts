// src/hooks/useUserChatMemory.ts
// SQI 2050 :: Akasha-Neural Archive Hook
// Persistent chat memory for Ayurveda, Jyotish, Apothecary & EOTIS oracles

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type ChatType = 'ayurveda' | 'jyotish' | 'apothecary' | 'eotis';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  chat_type: ChatType;
  session_title: string | null;
  messages: ChatMessage[];
  context_summary: string | null;
  message_count: number;
  last_message_at: string;
  created_at: string;
}

interface UseUserChatMemoryOptions {
  chatType: ChatType;
  /** If true, loads the most recent session on mount and continues it */
  resumeLatest?: boolean;
  /** Max previous messages to inject as context (default: 12) */
  contextWindow?: number;
}

interface UseUserChatMemoryReturn {
  sessionId: string | null;
  messages: ChatMessage[];
  pastSessions: ChatSession[];
  isLoading: boolean;
  addMessage: (message: ChatMessage) => Promise<void>;
  startNewSession: () => void;
  loadSession: (sessionId: string) => Promise<void>;
  getContextForPrompt: () => string;
  deleteSession: (sessionId: string) => Promise<void>;
}

export function useUserChatMemory({
  chatType,
  resumeLatest = true,
  contextWindow = 12,
}: UseUserChatMemoryOptions): UseUserChatMemoryReturn {
  const { user } = useAuth();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pastSessions, setPastSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingMessagesRef = useRef<ChatMessage[]>([]);

  const loadPastSessions = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('user_chat_sessions')
      .select('id, chat_type, session_title, context_summary, message_count, last_message_at, created_at')
      .eq('user_id', user.id)
      .eq('chat_type', chatType)
      .order('last_message_at', { ascending: false })
      .limit(20);

    if (!error && data) {
      setPastSessions(data.map((s) => ({ ...s, messages: [] })));
    }
  }, [user, chatType]);

  const loadSession = useCallback(
    async (id: string) => {
      if (!user) return;
      const { data, error } = await supabase
        .from('user_chat_sessions')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (!error && data) {
        setSessionId(data.id);
        setMessages(data.messages as ChatMessage[]);
      }
    },
    [user],
  );

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    const init = async () => {
      setIsLoading(true);
      await loadPastSessions();
      if (resumeLatest) {
        const { data } = await supabase
          .from('user_chat_sessions')
          .select('*')
          .eq('user_id', user.id)
          .eq('chat_type', chatType)
          .order('last_message_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (data) {
          setSessionId(data.id);
          setMessages(data.messages as ChatMessage[]);
        }
      }
      setIsLoading(false);
    };
    void init();
  }, [user, chatType, resumeLatest, loadPastSessions]);

  const scheduleSave = useCallback(
    (currentSessionId: string | null, currentMessages: ChatMessage[]) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      pendingMessagesRef.current = currentMessages;

      saveTimerRef.current = setTimeout(async () => {
        if (!user || pendingMessagesRef.current.length === 0) return;
        const msgs = pendingMessagesRef.current;
        const firstUserMsg = msgs.find((m) => m.role === 'user');
        const autoTitle = firstUserMsg
          ? firstUserMsg.content.slice(0, 60) + (firstUserMsg.content.length > 60 ? '…' : '')
          : 'Sacred Session';

        if (currentSessionId) {
          await supabase
            .from('user_chat_sessions')
            .update({
              messages: msgs as unknown as never,
              message_count: msgs.length,
              session_title: autoTitle,
            })
            .eq('id', currentSessionId)
            .eq('user_id', user.id);
        } else {
          const { data } = await supabase
            .from('user_chat_sessions')
            .insert({
              user_id: user.id,
              chat_type: chatType,
              messages: msgs as unknown as never,
              message_count: msgs.length,
              session_title: autoTitle,
            })
            .select('id')
            .single();
          if (data) setSessionId(data.id);
        }

        await loadPastSessions();
      }, 1200);
    },
    [user, chatType, loadPastSessions],
  );

  const addMessage = useCallback(
    async (message: ChatMessage) => {
      setMessages((prev) => {
        const updated = [...prev, message];
        scheduleSave(sessionId, updated);
        return updated;
      });
    },
    [sessionId, scheduleSave],
  );

  const startNewSession = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSessionId(null);
    setMessages([]);
  }, []);

  const getContextForPrompt = useCallback((): string => {
    if (messages.length === 0) return '';
    const recent = messages.slice(-contextWindow);
    const formatted = recent
      .map((m) => `${m.role === 'user' ? 'Seeker' : 'Oracle'}: ${m.content}`)
      .join('\n');
    return `\n\n--- AKASHIC MEMORY (previous transmissions in this session) ---\n${formatted}\n--- END MEMORY ---\n`;
  }, [messages, contextWindow]);

  const deleteSession = useCallback(
    async (id: string) => {
      if (!user) return;
      await supabase.from('user_chat_sessions').delete().eq('id', id).eq('user_id', user.id);
      if (id === sessionId) startNewSession();
      await loadPastSessions();
    },
    [user, sessionId, startNewSession, loadPastSessions],
  );

  return {
    sessionId,
    messages,
    pastSessions,
    isLoading,
    addMessage,
    startNewSession,
    loadSession,
    getContextForPrompt,
    deleteSession,
  };
}
