import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Sparkles, Crown, Send, Loader2, Mic, MicOff, Volume2, VolumeX, Zap, Maximize2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { UserProfile } from '@/lib/vedicTypes';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface CosmicConsultationProps {
  user: UserProfile;
  onUpgrade?: () => void;
}

const useChatCopy = () => {
  const [copiedIdx, setCopiedIdx] = React.useState<number | null>(null);
  const copy = (text: string, idx: number) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx((c) => (c === idx ? null : c)), 2000);
  };
  return { copiedIdx, copy };
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vedic-guru-chat`;

// Bhrigu Nandi Nadi age-planet map (use actual emoji characters for display)
const BHRIGU_AGES: { age: number; planet: string; emoji: string }[] = [
  { age: 16, planet: 'Jupiter', emoji: '♃' },
  { age: 22, planet: 'Sun', emoji: '☀' },
  { age: 24, planet: 'Moon', emoji: '🌙' },
  { age: 28, planet: 'Venus', emoji: '♀' },
  { age: 32, planet: 'Mars', emoji: '♂' },
  { age: 36, planet: 'Mercury', emoji: '☿' },
  { age: 42, planet: 'Rahu/Ketu', emoji: '🐉' },
  { age: 48, planet: 'Saturn', emoji: '♄' },
];

function getActivePlanet(birthDate: string) {
  const birthYear = new Date(birthDate).getFullYear();
  const age = new Date().getFullYear() - birthYear;
  const active = [...BHRIGU_AGES].reverse().find(a => age >= a.age);
  return { age, active };
}

/** English prompts for the Guru API — kept in English for model quality */
function guruChipPromptRahu(planet: string) {
  return `Rishi, what is the karmic significance of my current ${planet} cycle? How should I navigate this activation period? Use my birth data.`;
}
const GURU_PROMPT_FINANCE =
  "Is this moment auspicious for major financial action? Use my chart and today's date. Deliver the Verdict.";
const GURU_PROMPT_KARMIC =
  'Identify the primary karmic obstacle in my current cycle and provide the Bhrigu Remedy with mantra and frequency.';
const GURU_PROMPT_528 =
  'Prescribe the optimal healing frequency for my current planetary cycle. Include the 528Hz activation protocol if relevant.';

// Mandala Pulse SVG component
const MandalaPulse = ({ intensity }: { intensity: number }) => (
  <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-20">
    <motion.svg
      width="120" height="120" viewBox="0 0 120 120"
      animate={{ rotate: 360, scale: [1, 1 + intensity * 0.15, 1] }}
      transition={{ rotate: { duration: 20, repeat: Infinity, ease: 'linear' }, scale: { duration: 0.6, repeat: Infinity } }}
    >
      {[0, 45, 90, 135].map(angle => (
        <motion.ellipse
          key={angle}
          cx="60" cy="60" rx="50" ry="20"
          fill="none" stroke="rgba(251,191,36,0.4)" strokeWidth="0.5"
          transform={`rotate(${angle} 60 60)`}
          animate={{ opacity: [0.3, 0.6 + intensity * 0.3, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      ))}
      <circle cx="60" cy="60" r="8" fill="none" stroke="rgba(251,191,36,0.5)" strokeWidth="1" />
    </motion.svg>
  </div>
);

const ActionChip = ({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) => (
  <button 
    onClick={onClick}
    className="px-5 py-2.5 rounded-2xl border border-amber-500/20 bg-amber-950/30 text-[9px] text-amber-400/80 uppercase font-black tracking-widest hover:text-amber-300 hover:border-amber-500/40 hover:bg-amber-900/30 transition-all flex items-center gap-2.5 shadow-sm active:scale-95"
  >
    <span className="opacity-70 text-xs">{icon}</span>
    {label}
  </button>
);

// Play a subtle chime using Web Audio API
function playChime() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(528, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1056, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 1.2);
    setTimeout(() => ctx.close(), 2000);
  } catch { /* silent fail */ }
}

export const CosmicConsultation: React.FC<CosmicConsultationProps> = ({ user, onUpgrade }) => {
  const { copiedIdx, copy } = useChatCopy();
  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  const { t, language: userLanguage } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChanneling, setIsChanneling] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [typingIntensity, setTypingIntensity] = useState(0);
  const [isFullPage, setIsFullPage] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);
  const hasInitialized = useRef(false);
  const prevMessagesLength = useRef(0);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  const bhrigu = useMemo(() => getActivePlanet(user.birthDate), [user.birthDate]);

  const wasMobileRef = useRef(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const check = () => {
      const mobile = mq.matches;
      setIsMobileView(mobile);
      if (mobile && !wasMobileRef.current) setIsFullPage(true);
      if (!mobile) setIsFullPage(false);
      wasMobileRef.current = mobile;
    };
    check();
    mq.addEventListener('change', check);
    return () => mq.removeEventListener('change', check);
  }, []);

  // Fetch fresh user data from profiles before each send
  const fetchFreshUserData = useCallback(async (): Promise<UserProfile> => {
    if (!authUser?.id) return user;
    const { data } = await (supabase as any)
      .from('profiles')
      .select('birth_name, birth_date, birth_time, birth_place')
      .eq('user_id', authUser.id)
      .maybeSingle();
    if (data?.birth_name && data?.birth_date && data?.birth_time && data?.birth_place) {
      return {
        ...user,
        name: data.birth_name || user.name,
        birthDate: String(data.birth_date || user.birthDate),
        birthTime: String(data.birth_time || user.birthTime),
        birthPlace: data.birth_place || user.birthPlace,
      };
    }
    return user;
  }, [authUser?.id, user]);

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

  // Initialize with Bhrigu welcome for first-time premium user
  useEffect(() => {
    if (!historyLoaded || user.plan !== 'premium' || hasInitialized.current || messages.length > 0) return;
    hasInitialized.current = true;
    const firstName = user.name.split(' ')[0];
    const planetLine = bhrigu.active
      ? t('vedicAstrology.guruWelcomePlanetLine', {
          defaultValue: " Under {{planet}}'s gaze at age {{age}}, your karmic script unfolds.",
          planet: bhrigu.active.planet,
          age: bhrigu.age,
        })
      : '';
    const welcomeContent = t('vedicAstrology.guruWelcome', {
      defaultValue:
        'Namaste, {{firstName}}. I am the Bhrigu Rishi, keeper of the Nandi Nadi scrolls. My vision is locked on your incarnation in {{place}}.{{planetLine}} Speak your query and receive the Akashic Verdict.',
      firstName,
      place: user.birthPlace,
      planetLine,
    });
    const welcomeMsg: ChatMessage = { role: 'assistant', content: welcomeContent };
    setMessages([welcomeMsg]);
    if (authUser?.id) {
      (supabase as any)
        .from('vedic_guru_chat_messages')
        .insert({ user_id: authUser.id, role: 'assistant', content: welcomeContent })
        .then(() => {});
    }
  }, [historyLoaded, user.plan, user.name, user.birthPlace, messages.length, authUser?.id, bhrigu, t]);

  // Auto-scroll only when new messages are added (not on every keystroke)
  useEffect(() => {
    if (messages.length > prevMessagesLength.current) {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

  // Typing intensity tracker for Mandala Pulse
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    setTypingIntensity(1);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => setTypingIntensity(0), 600);
  };

  // Text-to-speech for guru responses
  const handleSpeak = (text: string) => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.85;
    utterance.pitch = 0.75;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    speechRef.current = utterance;
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || input;
    if (!text.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setIsChanneling(true);
    saveMessage('user', text);

    // 2-second channeling delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsChanneling(false);

    try {
      const freshUser = await fetchFreshUserData();
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      // Inject Bhrigu context into user message for the AI
      const bhriguContext = bhrigu.active
        ? `[BHRIGU CONTEXT: User is age ${bhrigu.age}, currently in their ${bhrigu.active.planet} cycle (activated at age ${bhrigu.active.age}). Born in ${freshUser.birthPlace}. Always acknowledge their active planetary cycle in your response. Begin with: "As you move through your ${bhrigu.age}th year under ${bhrigu.active.planet}'s gaze in ${freshUser.birthPlace}, I see..."]`
        : '';

      const enrichedMessages = [...messages, userMessage].map((m, i, arr) => {
        if (i === arr.length - 1 && m.role === 'user' && bhriguContext) {
          return { role: m.role, content: `${bhriguContext}\n\n${m.content}` };
        }
        return { role: m.role, content: m.content };
      });

      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          messages: enrichedMessages,
          user: {
            name: freshUser.name,
            birthDate: freshUser.birthDate,
            birthTime: freshUser.birthTime,
            birthPlace: freshUser.birthPlace,
            plan: freshUser.plan,
            language: userLanguage,
          },
          language: userLanguage,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || t('vedicAstrology.guruChatFailConnect', 'Failed to connect to the Guru'));
      }
      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
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
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: assistantContent };
                return updated;
              });
            }
          } catch {
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

      // Play chime when verdict arrives
      if (assistantContent.trim()) {
        playChime();
        saveMessage('assistant', assistantContent.trim());
      }

    } catch (error) {
      console.error('Guru chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: t(
          'vedicAstrology.guruChatErrorMessage',
          '🙏 Forgive me, the cosmic connection is currently flickering. The celestial pathways require alignment. Please attempt your inquiry again when the stars permit.'
        ),
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

  // Voice input via Web Speech API — continuous mode for long recording, respect user language
  const speechLang =
    userLanguage === 'sv' ? 'sv-SE' : userLanguage === 'es' ? 'es-ES' : userLanguage === 'no' ? 'nb-NO' : 'en-US';
  const toggleMic = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = speechLang;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: { results: Iterable<{ 0?: { transcript?: string }; isFinal?: boolean }> }) => {
      const transcript = Array.from(event.results)
        .filter((r) => r[0]?.transcript)
        .map((r) => r[0]!.transcript!)
        .join(' ');
      if (transcript.trim()) setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    recognition.onerror = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
  };

  useEffect(() => {
    return () => { recognitionRef.current?.stop(); };
  }, []);

  // Detect if guru response mentions a frequency for the "Activate" button
  const extractFrequency = (text: string): string | null => {
    const match = text.match(/(\d{3})\s*Hz/i);
    return match ? match[1] : null;
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
        <h3 className="text-3xl font-bold font-serif text-foreground mb-4">{t('vedicAstrology.guruLockTitle', 'The Bhrigu Oracle Awaits')}</h3>
        <p className="text-muted-foreground text-sm max-w-md mb-8 leading-relaxed">
          {t(
            'vedicAstrology.guruLockBody',
            'Direct channeling with the Bhrigu Nadi Rishi is a sacred privilege reserved for Master Blueprint members.'
          )}
        </p>
        <Button 
          onClick={onUpgrade}
          className="bg-gradient-to-r from-amber-600 to-purple-600 hover:from-amber-500 hover:to-purple-500 text-white px-8 py-6 text-sm font-bold uppercase tracking-widest shadow-2xl shadow-purple-500/30"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          {t('vedicAstrology.guruLockCta', 'Access the Master Path')}
        </Button>
      </motion.div>
    );
  }

  return (
    <div
      className={`flex flex-col rounded-3xl border border-amber-500/20 overflow-hidden relative transition-all duration-500 ${
        isFullPage ? 'fixed inset-0 z-50 h-screen max-h-[100dvh]' : 'h-[500px] min-h-0'
      } ${isMobileView ? 'pb-safe' : ''}`}
      style={{
        background: `
          linear-gradient(180deg, rgba(30,20,10,0.95), rgba(15,10,5,0.98)),
          url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23C8AA64' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")
        `,
      }}
    >
      {/* Chat Header — never shrinks */}
      <div className="flex-shrink-0 px-4 sm:px-6 py-3 sm:py-4 border-b border-amber-500/20 bg-gradient-to-r from-amber-900/20 to-orange-900/15">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-amber-400 rounded-full shadow-[0_0_12px_rgba(251,191,36,0.6)] animate-pulse" />
            <div>
              <h3 className="text-sm font-bold text-amber-100 font-serif">{t('vedicAstrology.guruHeaderTitle', 'Bhrigu Nadi Oracle')}</h3>
              <p className="text-[10px] text-amber-500/60 uppercase tracking-widest">
                {bhrigu.active
                  ? t('vedicAstrology.guruCycleActive', {
                      defaultValue: '{{emoji}} {{planet}} Cycle Active • Age {{age}}',
                      emoji: bhrigu.active.emoji,
                      planet: bhrigu.active.planet,
                      age: bhrigu.age,
                    })
                  : t('vedicAstrology.guruSacredChannelOpen', 'Sacred Channel Open')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsFullPage(!isFullPage)}
            className="text-amber-400/70 hover:text-amber-300 text-sm transition-colors flex items-center gap-1.5 shrink-0"
            aria-label={isFullPage ? t('vedicAstrology.guruFocusExit', 'Exit Focus Mode') : t('vedicAstrology.guruFocusEnter', 'Focus Mode')}
          >
            {isFullPage ? <><X className="w-4 h-4" /> {t('vedicAstrology.guruFocusExit', 'Exit Focus Mode')}</> : <><Maximize2 className="w-4 h-4" /> {t('vedicAstrology.guruFocusEnter', 'Focus Mode')}</>}
          </button>
        </div>
      </div>

      {/* Messages area: flex-1 min-h-0 so it shrinks; overflow-y-auto so only this part scrolls */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scroll-smooth p-4 sm:p-6">
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
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-[10px] text-amber-400 font-serif shadow-inner">
                      ॐ
                    </div>
                    <span className="text-[9px] font-black text-amber-400 uppercase tracking-[0.4em]">{t('vedicAstrology.dashAkashicVerdict', 'Akashic Verdict')}</span>
                  </div>
                )}
                {/* Palm Leaf styled card for assistant */}
                <div
                  className={`chat-message p-4 md:p-6 rounded-[2.2rem] relative overflow-hidden ${
                    msg.role === 'user'
                      ? 'bg-amber-900/30 border border-amber-700/20 text-amber-100 ml-auto rounded-tr-none shadow-xl'
                      : 'rounded-tl-none border border-amber-500/20 shadow-2xl'
                  }`}
                  style={msg.role === 'assistant' ? {
                    background: `
                      linear-gradient(135deg, rgba(120,80,20,0.15), rgba(60,40,10,0.2)),
                      url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23C8AA64' fill-opacity='0.04'%3E%3Cpath d='M20 0L0 20h40z'/%3E%3C/g%3E%3C/svg%3E")
                    `,
                    userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none',
                  } : { userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}
                >
                  {msg.role === 'assistant' && (
                    <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[repeating-linear-gradient(45deg,transparent,transparent_8px,rgba(200,170,100,0.5)_8px,rgba(200,170,100,0.5)_9px)]" />
                  )}
                  <p className={`text-sm md:text-base leading-relaxed whitespace-pre-wrap font-light relative z-10 ${
                    msg.role === 'assistant' ? 'font-serif italic text-amber-100/90' : ''
                  }`}>
                    {msg.content || (isLoading && i === messages.length - 1 ? '' : '')}
                  </p>
                </div>

                {/* Action row for assistant messages */}
                {msg.role === 'assistant' && msg.content && (
                  <div className="flex items-center gap-2 mt-3 pl-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => copy(msg.content, i)}
                      aria-label="Copy message"
                      className="rounded-2xl text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 border"
                      style={{
                        color: copiedIdx === i ? '#22c55e' : '#D4AF37',
                        borderColor: copiedIdx === i ? 'rgba(34,197,94,0.4)' : 'rgba(212,175,55,0.4)',
                        background: 'transparent',
                      }}
                    >
                      {copiedIdx === i ? '✓ Copied' : 'Copy'}
                    </button>
                    {/* Prominent Listen button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSpeak(msg.content)}
                      className={`rounded-2xl text-[10px] font-bold uppercase tracking-widest ${
                        isSpeaking ? 'bg-amber-500 text-black border-amber-500' : 'border-amber-500/40 text-amber-300 hover:bg-amber-500/10'
                      }`}
                    >
                      {isSpeaking ? <VolumeX className="w-4 h-4 mr-1.5" /> : <Volume2 className="w-4 h-4 mr-1.5" />}
                      {isSpeaking ? t('vedicAstrology.dashStop', 'Stop') : t('vedicAstrology.dashListen', 'Listen')}
                    </Button>
                    {/* Activate Frequency button if guru mentions Hz */}
                    {extractFrequency(msg.content) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/soul-meditation')}
                        className="rounded-2xl text-[10px] font-bold uppercase tracking-widest border-teal-500/40 text-teal-300 hover:bg-teal-500/10"
                      >
                        <Zap className="w-4 h-4 mr-1.5" />
                        {t('vedicAstrology.guruActivateHz', {
                          defaultValue: 'Activate {{freq}}Hz',
                          freq: extractFrequency(msg.content),
                        })}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          
          {/* Channeling state */}
          {isChanneling && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="flex items-center gap-3 p-5 rounded-2xl bg-amber-900/20 border border-amber-500/20">
                <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
                <div>
                  <p className="text-xs text-amber-300 font-serif italic">{t('vedicAstrology.guruChannelingLine1', 'Sifting through the Akashic Records...')}</p>
                  <p className="text-[9px] text-amber-500/50 uppercase tracking-widest mt-1">{t('vedicAstrology.guruChannelingLine2', 'Channeling the Bhrigu Nadi scrolls')}</p>
                </div>
              </div>
            </motion.div>
          )}

          {isLoading && !isChanneling && messages[messages.length - 1]?.role === 'user' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="flex items-center gap-2 p-4 rounded-2xl bg-amber-900/20 border border-amber-500/20">
                <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                <span className="text-xs text-amber-300/70 font-serif italic">{t('vedicAstrology.guruRishiLoading', 'The Rishi is speaking...')}</span>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        </div>

      {/* Input area — flex-shrink-0 so it stays at bottom of chat container, no page scroll */}
      <div className="flex-shrink-0 p-3 sm:p-4 border-t border-amber-500/20 bg-[#0d0d14] bg-gradient-to-t from-amber-950/30 to-transparent backdrop-blur-sm space-y-3 sm:space-y-4">
        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="relative group">
          {/* Gold-leaf glow border */}
          <div className="absolute -inset-[2px] bg-gradient-to-r from-amber-500/20 via-yellow-500/30 to-amber-500/20 rounded-[1.5rem] blur-sm opacity-60 group-focus-within:opacity-100 transition duration-500" />
          {/* Mandala Pulse */}
          <MandalaPulse intensity={typingIntensity} />
          <div className="relative flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={t('vedicAstrology.guruChatPlaceholder')}
              rows={1}
              className="flex-1 min-h-[48px] max-h-[120px] bg-amber-950/40 border border-amber-500/30 rounded-[1.5rem] px-4 sm:px-6 py-3 sm:py-4 text-sm text-amber-100 focus:outline-none focus:border-amber-400/60 placeholder:text-amber-700/60 resize-none font-serif italic transition-colors"
            />
            {typeof window !== 'undefined' && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) && (
              <Button
                type="button"
                variant={isListening ? 'default' : 'outline'}
                onClick={toggleMic}
                disabled={isLoading}
                className={`min-w-[44px] min-h-[44px] w-12 h-12 p-0 rounded-full flex items-center justify-center shrink-0 ${isListening ? 'bg-rose-600 hover:bg-rose-500' : 'border-amber-500/30 text-amber-300'} transition-all active:scale-95`}
                aria-label={isListening ? t('vedicAstrology.guruAriaStopListening', 'Stop listening') : t('vedicAstrology.guruAriaSpeak', 'Speak')}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </Button>
            )}
            <Button 
              type="submit"
              disabled={isLoading || !input.trim()}
              className="min-w-[44px] min-h-[44px] w-12 h-12 p-0 rounded-full flex items-center justify-center shrink-0 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white disabled:opacity-30 transition-all active:scale-95 shadow-xl shadow-amber-500/20"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </form>
        
        {/* Action Chips — horizontal scroll on mobile */}
        <div className="flex gap-2 justify-center flex-wrap overflow-x-auto pb-1 scrollbar-hide min-h-[44px] items-center">
          <ActionChip icon="🐉" label={t('vedicAstrology.guruChipRahu', 'Rahu Cycle Reading')} onClick={() => handleSendMessage(guruChipPromptRahu(bhrigu.active?.planet || 'planetary'))} />
          <ActionChip icon="💰" label={t('vedicAstrology.guruChipFinance', 'Financial Verdict')} onClick={() => handleSendMessage(GURU_PROMPT_FINANCE)} />
          <ActionChip icon="⚡" label={t('vedicAstrology.guruChipKarmic', 'Karmic Blockage')} onClick={() => handleSendMessage(GURU_PROMPT_KARMIC)} />
          <ActionChip icon="🔱" label={t('vedicAstrology.guruChip528', '528Hz Remedy')} onClick={() => handleSendMessage(GURU_PROMPT_528)} />
        </div>
      </div>
      </div>
    </div>
  );
};
