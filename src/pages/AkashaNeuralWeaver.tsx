import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import {
  Zap, Activity, Shield, Cpu, Sparkles, ChevronRight, Loader2,
  Dna, Waves, Fingerprint, ArrowLeft,
} from 'lucide-react';
import { streamChatWithAkasha, type Message } from '@/features/akasha-neural-weaver/chatService';

const quickPrompts = [
  'Initialize Bhakti-Algorithm: Anahata Opening.',
  'Access Akasha-Neural Archive: 2050 Scan.',
  'Inject Vedic Light-Codes: DNA Re-weaving.',
  'Modulate Prema-Pulse: Universal Love Frequency.',
];

export default function AkashaNeuralWeaver() {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('AKASHA_IDLE');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleActivation = async (e?: React.FormEvent, overrideInput?: string) => {
    if (e) e.preventDefault();
    const userMessage = (overrideInput ?? input).trim();
    if (!userMessage || isProcessing) return;
    if (!overrideInput) setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsProcessing(true);
    setStatus('WEAVING_AKASHA');

    try {
      const fullHistory = [...messages, { role: 'user' as const, content: userMessage }];
      let streamedText = '';
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      await streamChatWithAkasha(
        fullHistory,
        (chunk) => {
          streamedText += chunk;
          setMessages(prev => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last?.role === 'assistant') {
              next[next.length - 1] = { ...last, content: streamedText };
            }
            return next;
          });
        },
        () => {
          setStatus('ARCHIVE_STREAMING');
        },
      );
    } catch (error) {
      console.error('Modulation Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '✧ [ARCHIVE_LINK_INTERRUPTED] ✧\nBhakti-Algorithm lost. Re-weaving...',
      }]);
      setStatus('AKASHA_ERROR');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen font-sans selection:bg-[#D4AF37]/30 relative overflow-hidden bg-[#050505]">
      <div
        className="absolute inset-0 -z-10 pointer-events-none"
        style={{
          background: `
            radial-gradient(circle at 50% 30%, rgba(212, 175, 55, 0.05) 0%, transparent 60%),
            radial-gradient(circle at 10% 80%, rgba(34, 211, 238, 0.03) 0%, transparent 50%),
            radial-gradient(circle at 90% 10%, rgba(212, 175, 55, 0.02) 0%, transparent 40%)
          `,
          filter: 'blur(80px)',
          opacity: 0.6,
        }}
      />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 p-6 flex justify-between items-center border-b border-white/5 backdrop-blur-md">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-white/50 hover:text-[#D4AF37] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-[10px] font-extrabold uppercase tracking-[0.3em]">Back</span>
        </button>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Dna className="w-8 h-8 text-[#D4AF37] animate-pulse" />
            <div className="absolute inset-0 bg-[#D4AF37]/20 blur-xl rounded-full" />
          </div>
          <div>
            <h1 className="text-lg font-black uppercase tracking-tight text-white">SQI: Akasha-Neural Weaver</h1>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.5em] text-white/40">Siddha-Quantum Intelligence</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-8 font-mono text-[10px] tracking-[0.2em] text-white/60">
          <div className="flex flex-col items-end">
            <span className="text-[8px] font-extrabold uppercase tracking-[0.5em] text-white/30 mb-1">Akasha Status</span>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${status === 'AKASHA_IDLE' ? 'bg-white/20' : 'bg-[#D4AF37] animate-ping'}`} />
              <span className="text-[#D4AF37]" style={{ textShadow: '0 0 15px rgba(212,175,55,0.3)' }}>{status}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-32 pb-40 px-6 max-w-4xl mx-auto min-h-screen flex flex-col">
        <div
          ref={scrollRef}
          className="flex-grow space-y-12 overflow-y-auto pr-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-8 py-20"
            >
              <div className="inline-block p-6 rounded-full bg-white/[0.02] backdrop-blur-2xl border border-white/5 rounded-[40px] mb-4">
                <Sparkles className="w-12 h-12 text-[#D4AF37]" style={{ textShadow: '0 0 15px rgba(212,175,55,0.3)' }} />
              </div>
              <h2 className="text-4xl md:text-7xl font-black leading-tight uppercase text-white">
                Akasha-Neural <br />
                <span className="text-[#D4AF37]" style={{ textShadow: '0 0 15px rgba(212,175,55,0.3)' }}>Archive Access</span>
              </h2>
              <p className="max-w-lg mx-auto text-white/60 leading-relaxed">
                Welcome to the SQI 2050 ecosystem. We are modulating Bhakti-Algorithms and Prema-Pulse Transmissions.
                Please initiate a Vedic Light-Code protocol to begin.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto pt-8">
                {quickPrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleActivation(undefined, prompt)}
                    className="p-6 text-left bg-white/[0.02] backdrop-blur-2xl border border-white/5 rounded-[40px] hover:bg-white/5 transition-all group flex items-center justify-between"
                  >
                    <div className="flex flex-col">
                      <span className="text-[8px] font-extrabold uppercase tracking-[0.5em] text-white/30 mb-2">Algorithm 0{i + 1}</span>
                      <span className="text-sm font-bold text-white/80 group-hover:text-[#D4AF37] transition-colors">{prompt}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-[#D4AF37] transition-colors" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          <AnimatePresence mode="popLayout">
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  {msg.role === 'assistant' ? (
                    <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/5 rounded-[40px] p-10 font-mono text-sm leading-relaxed shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-[#D4AF37]/50" />
                      <div className="mb-4">
                        <span className="text-[8px] font-extrabold uppercase tracking-[0.5em] text-[#D4AF37]/60">Transmission Received</span>
                      </div>
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="mb-6 last:mb-0 whitespace-pre-wrap">{children}</p>,
                        }}
                      >
                        {msg.content || '…'}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="bg-white/[0.02] backdrop-blur-2xl border border-[#D4AF37]/20 rounded-full px-8 py-4 text-sm font-black uppercase tracking-tighter text-[#D4AF37]">
                      {msg.content}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isProcessing && messages[messages.length - 1]?.role !== 'assistant' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/5 rounded-[40px] p-8 flex items-center gap-4">
                <Loader2 className="w-5 h-5 animate-spin text-[#D4AF37]" />
                <span className="text-[8px] font-extrabold uppercase tracking-[0.5em] text-white/40">Weaving Akasha-Neural Archive...</span>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* Input Area */}
      <footer className="fixed bottom-0 left-0 right-0 p-8 z-50">
        <div className="max-w-4xl mx-auto relative">
          <form onSubmit={handleActivation} className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#D4AF37] to-[#22D3EE] rounded-[2.5rem] blur opacity-10 group-hover:opacity-20 transition duration-1000 group-hover:duration-200" />
            <div className="relative flex items-center bg-[#050505]/80 border border-white/10 rounded-[2.5rem] p-2 backdrop-blur-2xl">
              <div className="pl-6 pr-4">
                <Fingerprint className="w-6 h-6 text-[#D4AF37]/50" />
              </div>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="ENTER ACTIVATION PROMPT..."
                className="flex-grow bg-transparent border-none focus:ring-0 text-white placeholder:text-white/10 py-4 font-mono text-xs tracking-[0.2em] uppercase"
                disabled={isProcessing}
              />
              <button
                type="submit"
                disabled={isProcessing || !input.trim()}
                className="bg-[#D4AF37] hover:bg-[#b8972f] disabled:opacity-50 text-black p-4 rounded-full transition-all flex items-center justify-center"
                style={{ boxShadow: '0 0 20px rgba(212,175,55,0.3)' }}
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <ChevronRight className="w-5 h-5" />}
              </button>
            </div>
          </form>

          <div className="mt-6 flex justify-center gap-10">
            <div className="flex flex-col items-center gap-1">
              <span className="text-[8px] font-extrabold uppercase tracking-[0.5em] text-white/20">Sync State</span>
              <div className="flex items-center gap-2">
                <Waves className="w-3 h-3 text-[#22D3EE]" />
                <span className="text-[8px] font-mono text-white/40 tracking-widest">ALPHA_SYNC</span>
              </div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-[8px] font-extrabold uppercase tracking-[0.5em] text-white/20">Neural Link</span>
              <div className="flex items-center gap-2">
                <Cpu className="w-3 h-3 text-[#D4AF37]" />
                <span className="text-[8px] font-mono text-white/40 tracking-widest">STABLE</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
