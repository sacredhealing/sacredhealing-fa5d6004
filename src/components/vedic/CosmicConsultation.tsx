import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Lock, Sparkles, Crown, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { UserProfile, MembershipTier } from '@/lib/vedicTypes';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface CosmicConsultationProps {
  user: UserProfile;
  onUpgrade?: () => void;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vedic-guru-chat`;

const PromptChip = ({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) => (
  <button 
    onClick={onClick}
    className="px-4 py-2 rounded-full border border-slate-800 bg-slate-900/40 text-[9px] text-slate-500 uppercase font-black tracking-widest hover:text-indigo-400 hover:border-indigo-500/30 hover:bg-slate-800 transition-all flex items-center gap-2"
  >
    <span>{icon}</span>
    {label}
  </button>
);

export const CosmicConsultation: React.FC<CosmicConsultationProps> = ({ user, onUpgrade }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasInitialized = useRef(false);
  const prevMessagesLength = useRef(0);

  // Auto-scroll only when new messages are added (not on every render)
  useEffect(() => {
    if (messages.length > prevMessagesLength.current) {
      // Small delay to let DOM update
      requestAnimationFrame(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      });
    }
    prevMessagesLength.current = messages.length;
  }, [messages.length]);

  // Initialize with welcome message for premium users - only ONCE
  useEffect(() => {
    if (user.plan === 'premium' && !hasInitialized.current && messages.length === 0) {
      hasInitialized.current = true;
      setMessages([{
        role: 'assistant',
        content: `🙏 Namaste, ${user.name.split(' ')[0]}. The celestial gates are open. I am your Grand Master Jyotish, keeper of the ancient Vedic star wisdom.\n\nYour birth coordinates (${user.birthDate}, ${user.birthTime} in ${user.birthPlace}) have been imprinted upon the cosmic records. I can see the dance of the Navagrahas in your chart.\n\nWhat sacred inquiry brings you before the Oracle today?`
      }]);
    }
  }, [user.plan, user.name, user.birthDate, user.birthTime, user.birthPlace, messages.length]);

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || input;
    if (!text.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

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
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500/20 to-purple-500/20 border border-amber-500/30 flex items-center justify-center">
                      <span className="text-sm">ॐ</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Grand Master Jyotish</span>
                  </div>
                )}
                <div className={`p-4 rounded-2xl ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white ml-auto' 
                    : 'bg-slate-900/80 border border-slate-800 text-foreground'
                }`}>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {msg.content || (isLoading && i === messages.length - 1 ? '...' : '')}
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
      <div className="p-4 border-t border-slate-800/50 bg-slate-950/80 space-y-4">
        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Speak your query to the Guru..."
              rows={1}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl px-5 py-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 placeholder:text-slate-600 resize-none"
            />
          </div>
          <Button 
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-30 shadow-xl shadow-indigo-500/30"
          >
            <Send className="w-5 h-5" />
          </Button>
        </form>
        
        {/* Prompt Chips */}
        <div className="flex flex-wrap gap-2 justify-center">
          <PromptChip icon="✨" label="Personal Mantra" onClick={() => handleSendMessage("What is my personalized Beeja Mantra based on my chart's current planetary weaknesses?")} />
          <PromptChip icon="🧭" label="Soul Purpose" onClick={() => handleSendMessage("Can you analyze my Atmakaraka and tell me what my soul's main lesson is in this life?")} />
          <PromptChip icon="💼" label="Career Clarity" onClick={() => handleSendMessage("Is my current profession aligned with my 10th house ruler and Amatyakaraka?")} />
          <PromptChip icon="🌿" label="Health Remedy" onClick={() => handleSendMessage("Which spiritual remedy (Upaya) will help balance my health according to my current Dasha?")} />
        </div>
      </div>
    </motion.div>
  );
};
