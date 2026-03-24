import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import type { AyurvedaUserProfile, DoshaProfile } from '@/lib/ayurvedaTypes';
import { useTranslation } from '@/hooks/useTranslation';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AyurvedaChatConsultationProps {
  profile: AyurvedaUserProfile | null;
  dosha: DoshaProfile | null;
  onClose?: () => void;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ayurveda-chat`;

/* ─── PULSE READING ANIMATION ─── */
const PulseReadingAnimation = () => {
  const { t } = useTranslation();
  return (
  <div className="flex flex-col items-center gap-4 py-6">
    <div className="relative">
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 60 + i * 30,
            height: 60 + i * 30,
            left: -(i * 15),
            top: -(i * 15),
            border: '1px solid rgba(168,85,247,0.3)',
          }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
        />
      ))}
      <motion.div
        className="relative w-[60px] h-[60px] rounded-full flex items-center justify-center"
        style={{
          background: 'radial-gradient(circle, rgba(168,85,247,0.4), rgba(79,70,229,0.2))',
          boxShadow: '0 0 30px rgba(168,85,247,0.3)',
        }}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <span className="text-2xl">🔮</span>
      </motion.div>
    </div>
    <p className="text-purple-300/60 text-xs italic mt-4">{t('ayurvedaChat.pulseReading', 'The Divine Physician reads your pulse...')}</p>
  </div>
  );
};

export const AyurvedaChatConsultation: React.FC<AyurvedaChatConsultationProps> = ({ profile, dosha, onClose }) => {
  const { t, language } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    let assistantContent = '';

    try {
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
          profile,
          dosha,
          language,
        }),
      });

      if (!response.ok || !response.body) {
        if (response.status === 429) toast.error(t('ayurvedaChat.rateLimit', 'Rate limit exceeded. Please try again in a moment.'));
        else if (response.status === 402) toast.error(t('ayurvedaChat.usageLimit', 'Usage limits reached. Please try again later.'));
        else toast.error(t('ayurvedaChat.connectFail', 'Failed to connect to the healer. Please try again.'));
        setIsLoading(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

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
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = { role: 'assistant', content: assistantContent };
                return newMessages;
              });
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: t('ayurvedaChat.connectionInterrupted', 'Forgive me, my connection to the ether is interrupted. Please try again.') 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-start justify-center pt-0 md:items-center md:pt-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0"
        style={{ background: 'rgba(5,2,15,0.92)', backdropFilter: 'blur(20px)' }}
        onClick={onClose}
      />

      {/* Chat container */}
      <motion.div
        className="relative w-full max-w-2xl mx-0 md:mx-4 rounded-none md:rounded-3xl overflow-hidden flex flex-col self-start"
        style={{
          background: 'linear-gradient(135deg, rgba(20,10,40,0.98), rgba(10,5,25,0.99))',
          border: '1px solid rgba(168,85,247,0.25)',
          maxHeight: '100svh',
          boxShadow: '0 0 60px rgba(168,85,247,0.15)',
        }}
        initial={{ scale: 0.95, y: -20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25 }}
      >
        {/* Header */}
        <div className="p-5 flex items-center gap-4" style={{ borderBottom: '1px solid rgba(168,85,247,0.15)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.3), rgba(79,70,229,0.2))' }}>
            <span className="text-lg">🏥</span>
          </div>
          <div className="flex-1">
            <h3 className="font-serif text-lg text-white">{t('ayurvedaChat.headerTitle', 'Dhanvantari — Divine Physician')}</h3>
            <p className="text-[10px] uppercase text-purple-400/50 tracking-[0.2em] font-bold">
              {t('ayurvedaChat.headerSubtitle', { defaultValue: 'Bhrigu Nadi Enhanced • {{protocol}} Protocol', protocol: dosha?.primary || t('ayurvedaChat.unknownProtocol', 'Unknown') })}
            </p>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="text-purple-400/50 hover:text-white rounded-full">
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>

        {/* Messages */}
        <ScrollArea className="p-5" ref={scrollRef} style={{ maxHeight: '42svh' }}>
          {messages.length === 0 && (
            <div className="text-center py-4">
              <div className="text-4xl mb-3">🙏</div>
              <p className="text-lg font-serif text-purple-200 mb-1">{t('ayurvedaChat.namasteTitle', 'Namaste, Seeker of Balance')}</p>
              <p className="text-purple-400/50 text-sm">{t('ayurvedaChat.namasteSub', 'The Divine Physician awaits your concern...')}</p>
            </div>
          )}
          
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                  msg.role === 'user' 
                    ? 'rounded-br-sm text-white'
                    : 'rounded-bl-sm text-purple-100'
                }`} style={{
                  background: msg.role === 'user'
                    ? 'linear-gradient(135deg, rgba(168,85,247,0.4), rgba(79,70,229,0.3))'
                    : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${msg.role === 'user' ? 'rgba(168,85,247,0.3)' : 'rgba(255,255,255,0.06)'}`,
                }}>
                  <div className="flex items-center gap-2 mb-1">
                    {msg.role === 'assistant' && <Sparkles className="w-3 h-3 text-amber-400" />}
                    <span className="text-[10px] uppercase tracking-wider text-purple-400/50">
                      {msg.role === 'user' ? t('ayurvedaChat.roleYou', 'You') : t('ayurvedaChat.roleDhanvantari', 'Dhanvantari')}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
              </motion.div>
            ))}
            
            {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
              <PulseReadingAnimation />
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <form onSubmit={handleSend} className="p-4 flex gap-2" style={{ borderTop: '1px solid rgba(168,85,247,0.1)' }}>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('ayurvedaChat.inputPlaceholder', 'Describe your concern to the Divine Physician...')}
            className="flex-1 rounded-xl bg-white/5 border-purple-500/15 text-white placeholder:text-purple-400/30 focus:border-purple-400/40"
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            size="icon"
            className="w-12 h-12 rounded-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(168,85,247,0.5), rgba(79,70,229,0.4))',
              border: '1px solid rgba(168,85,247,0.3)',
            }}
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin text-purple-200" /> : <Send className="w-5 h-5 text-purple-200" />}
          </Button>
        </form>
      </motion.div>
    </motion.div>
  );
};
