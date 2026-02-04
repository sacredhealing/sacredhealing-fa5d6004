import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Lock, Sparkles, Crown, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { UserProfile } from '@/lib/vedicTypes';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface CosmicConsultationProps {
  user: UserProfile;
  onUpgrade?: () => void;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vedic-guru-chat`;

const ActionChip = ({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) => (
  <button 
    onClick={onClick}
    className="px-5 py-2.5 rounded-2xl border border-slate-800 bg-slate-900/60 text-[9px] text-slate-400 uppercase font-black tracking-widest hover:text-indigo-400 hover:border-indigo-500/30 hover:bg-slate-800 transition-all flex items-center gap-2.5 shadow-sm active:scale-95"
  >
    <span className="opacity-70 text-xs">{icon}</span>
    {label}
  </button>
);

export const CosmicConsultation: React.FC<CosmicConsultationProps> = ({ user, onUpgrade }) => {
  const { user: authUser } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasInitialized = useRef(false);
  const prevMessagesLength = useRef(0);

  // Load saved conversation history on mount (premium only)
  useEffect(() => {
    if (user.plan !== 'premium') {
      setHistoryLoaded(true);
      return;
    }
    if (!authUser?.id) return;

    const loadHistory = async () => {
      const { data, error } = await (supabase as any)
        .from('vedic_guru_chat_messages')
        .select('role, content')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: true });

      if (!error && data?.length > 0) {
        setMessages(data.map((r: { role: string; content: string }) => ({ role: r.role as 'user' | 'assistant', content: r.content })));
      }
      setHistoryLoaded(true);
    };

    loadHistory();
  }, [authUser?.id, user.plan]);

  // Initialize with Rishi welcome only when history is empty (first-time premium user)
  useEffect(() => {
    if (!historyLoaded || user.plan !== 'premium' || hasInitialized.current || messages.length > 0) return;

    hasInitialized.current = true;
    const firstName = user.name.split(' ')[0];
    const welcomeContent = `Namaste, ${firstName}. My vision is locked on your incarnation in ${user.birthPlace}. The transits of 2026 are already testing your resolve. Your ${user.plan} path is known to me. Speak your query and receive the Shastric verdict.`;
    const welcomeMsg: ChatMessage = { role: 'assistant', content: welcomeContent };
    setMessages([welcomeMsg]);

    // Persist welcome so guru remembers on next visit
    if (authUser?.id) {
      (supabase as any)
        .from('vedic_guru_chat_messages')
        .insert({ user_id: authUser.id, role: 'assistant', content: welcomeContent })
        .then(() => {});
    }
  }, [historyLoaded, user.plan, user.name, user.birthPlace, messages.length, authUser?.id]);

  // Auto-scroll only when new messages are added (not on every render)
  useEffect(() => {
    if (messages.length > prevMessagesLength.current) {
      requestAnimationFrame(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      });
    }
    prevMessagesLength.current = messages.length;
  }, [messages.length]);

  const saveMessage = async (role: 'user' | 'assistant', content: string) => {
    if (!authUser?.id) return;
    await (supabase as any)
      .from('vedic_guru_chat_messages')
      .insert({ user_id: authUser.id, role, content });
  };

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || input;
    if (!text.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Persist user message so guru remembers
    saveMessage('user', text);

    try {
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
          user
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to connect to the Guru');
      }

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let textBuffer = '';

      // Add empty assistant message to update
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: assistantContent };
                return updated;
              });
            }
          } catch {
            // Incomplete JSON, put back and wait
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split('\n')) {
          if (!raw) continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (raw.startsWith(':') || raw.trim() === '') continue;
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: assistantContent };
                return updated;
              });
            }
          } catch { /* ignore */ }
        }
      }

      // Persist assistant response so guru remembers on next visit
      if (assistantContent.trim()) {
        saveMessage('assistant', assistantContent.trim());
      }

    } catch (error) {
      console.error('Guru chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '🙏 Forgive me, the cosmic connection is currently flickering. The celestial pathways require alignment. Please attempt your inquiry again when the stars permit.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Sacred Lock UI for non-premium users
  if (user.plan !== 'premium') {
    return (
      <motion.div 
        className="flex flex-col items-center justify-center min-h-[500px] p-8 text-center"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="relative p-8 rounded-full border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-purple-500/10">
            <div className="relative">
              <Crown className="w-16 h-16 text-amber-400" />
              <Lock className="w-6 h-6 text-amber-500 absolute -bottom-1 -right-1" />
            </div>
          </div>
        </div>

        <h3 className="text-3xl font-bold font-serif text-foreground mb-4">
          The High Oracle Awaits
        </h3>
        
        <p className="text-muted-foreground text-sm max-w-md mb-8 leading-relaxed">
          Direct consultations with the <span className="text-amber-400 font-semibold">Grand Master Jyotish</span> are a sacred privilege reserved for our <span className="text-purple-400 font-semibold">Master Blueprint</span> members. 
          Unlock this path to receive personalized mantras, karmic guidance, and soul-level clarity.
        </p>

        <Button 
          onClick={onUpgrade}
          className="bg-gradient-to-r from-amber-600 to-purple-600 hover:from-amber-500 hover:to-purple-500 text-white px-8 py-6 text-sm font-bold uppercase tracking-widest shadow-2xl shadow-purple-500/30"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Access the Master Path
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="flex flex-col h-[600px] bg-slate-950/50 rounded-3xl border border-slate-800/50 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-slate-800/50 bg-gradient-to-r from-indigo-900/20 to-purple-900/20">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" />
          <div>
            <h3 className="text-sm font-bold text-foreground">Grand Master Jyotish</h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Oracle Channel Active</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-6">
        <div className="space-y-6">
          {messages.map((msg, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-2' : ''}`}>
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-[10px] text-indigo-400 font-serif shadow-inner">ॐ</div>
                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.4em]">Akashic Verdict</span>
                  </div>
                )}
                <div className={`p-4 md:p-6 rounded-[2.2rem] ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white ml-auto rounded-tr-none border border-white/10 shadow-xl' 
                    : 'glass text-slate-200 rounded-tl-none border-indigo-500/10 shadow-2xl'
                }`}>
                  <p className={`text-sm md:text-base leading-relaxed whitespace-pre-wrap font-light ${msg.role === 'assistant' ? 'font-serif italic text-slate-100/90' : ''}`}>
                    {msg.content || (isLoading && i === messages.length - 1 ? 'Decoding 2026 transits...' : '')}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
          
          {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="flex items-center gap-2 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                <span className="text-xs text-muted-foreground">The Oracle is channeling...</span>
              </div>
            </motion.div>
          )}
          
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t border-slate-800/50 bg-slate-950/95 backdrop-blur-3xl space-y-4">
        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 rounded-[1.5rem] blur opacity-50 group-hover:opacity-100 transition duration-700" />
          <div className="relative flex gap-3">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Command the Rishi's vision..."
              rows={1}
              className="flex-1 bg-slate-900/90 border border-slate-800 rounded-[1.5rem] px-6 py-4 text-sm text-white focus:outline-none placeholder:text-slate-600 resize-none font-serif italic"
            />
            <Button 
              type="submit"
              disabled={isLoading || !input.trim()}
              className="p-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-30 transition-all active:scale-95 shadow-xl"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </form>
        
        {/* Action Chips */}
        <div className="flex flex-wrap gap-2 justify-center">
          <ActionChip icon="🌏" label="2026 World Outlook" onClick={() => handleSendMessage("Rishi, scan the world events of early 2026. Use Google Search. How do these mundane shifts impact my personal destiny?")} />
          <ActionChip icon="💰" label="Financial Verdict" onClick={() => handleSendMessage("Is this moment auspicious for major financial action? Deliver the Verdict.")} />
          <ActionChip icon="⚡" label="Karmic Blockage" onClick={() => handleSendMessage("Identify the primary karmic obstacle in my current 2026 cycle and provide the Shastric Remedy.")} />
          <ActionChip icon="🔱" label="Dharma path" onClick={() => handleSendMessage("What is the highest alignment for my soul this week? No questions, just the path.")} />
        </div>
      </div>
    </motion.div>
  );
};
