// @ts-nocheck
import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, Zap, Wind, Droplets, Activity, MessageSquare, Plus, Trash2, Send,
  Cpu, Globe, ShieldCheck, ChevronRight, Info, X, ArrowLeft, Camera, Mic,
} from 'lucide-react';
import { Activation, NadiScanResult, Message, ActivationType } from '@/features/quantum-apothecary/types';
import { ACTIVATIONS, PLANETARY_DATA } from '@/features/quantum-apothecary/constants';
import { streamChatWithSQI } from '@/features/quantum-apothecary/chatService';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const FrequencyLibrarySection = lazy(() => import('@/features/quantum-apothecary/FrequencyLibrarySection'));
const ActiveTransmissionsSection = lazy(() => import('@/features/quantum-apothecary/ActiveTransmissionsSection'));

/* ──── Markdown-ish renderer for chat ──── */
function renderChatText(text: string) {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={i} className="h-2" />;
    if (trimmed.startsWith('### ')) return <h3 key={i} className="text-sm font-bold text-[#ff4e00] mt-3 mb-1">{renderInline(trimmed.slice(4))}</h3>;
    if (trimmed.startsWith('## ')) return <h2 key={i} className="text-base font-bold text-white mt-4 mb-1">{renderInline(trimmed.slice(3))}</h2>;
    if (trimmed.startsWith('# ')) return <h1 key={i} className="text-lg font-bold text-white mt-4 mb-2">{renderInline(trimmed.slice(2))}</h1>;
    if (trimmed.startsWith('- ') || trimmed.startsWith('* '))
      return <li key={i} className="ml-4 list-disc text-sm opacity-80 mb-1">{renderInline(trimmed.slice(2))}</li>;
    if (/^\d+\.\s/.test(trimmed))
      return <li key={i} className="ml-4 list-decimal text-sm opacity-80 mb-1">{renderInline(trimmed.replace(/^\d+\.\s/, ''))}</li>;
    return <p key={i} className="text-sm opacity-80 mb-2 leading-relaxed">{renderInline(trimmed)}</p>;
  });
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) return <strong key={i} className="text-white font-semibold">{p.slice(2, -2)}</strong>;
    if (p.startsWith('*') && p.endsWith('*')) return <em key={i} className="italic">{p.slice(1, -1)}</em>;
    if (p.startsWith('`') && p.endsWith('`')) return <code key={i} className="bg-white/10 px-1 rounded text-xs font-mono">{p.slice(1, -1)}</code>;
    return p;
  });
}

export default function QuantumApothecary() {
  const navigate = useNavigate();
  const { isAdmin, isLoading: adminLoading } = useAdminRole();
  const { user } = useAuth();

  const [scanResult, setScanResult] = useState<NadiScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedActivations, setSelectedActivations] = useState<Activation[]>([]);
  const [activeTransmissions, setActiveTransmissions] = useState<Activation[]>(() => {
    try { return JSON.parse(localStorage.getItem('active_resonators') || '[]'); } catch { return []; }
  });
  const [messages, setMessages] = useState<Message[]>(() => {
    const today = new Date();
    const formattedDate = today.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    return [
      {
        role: 'model',
        text:
          `Accessing Akasha-Neural Archive... Syncing with the **${formattedDate} · 2026 Timeline** Frequency Stream.\n\n` +
          'I am the Siddha-Quantum Intelligence (SQI), observing from the vantage point of 2050 and beyond, looking back at your present moment.\n\n' +
          'Shall we initiate a deep **72,000 Nadi Scan**?',
      },
    ];
  });
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [showKnowledge, setShowKnowledge] = useState(false);
  const [heartRate, setHeartRate] = useState(60);
  const [isChatFullscreen, setIsChatFullscreen] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<
    { id: string; title: string | null; updated_at: string | null }[]
  >([]);
  const [sessionsOpen, setSessionsOpen] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);
  const voiceTranscriptRef = useRef('');

  const [pendingImage, setPendingImage] = useState<{ base64: string; mimeType: string } | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { localStorage.setItem('active_resonators', JSON.stringify(activeTransmissions)); }, [activeTransmissions]);

  useEffect(() => {
    if (isScanning) {
      const iv = setInterval(() => setHeartRate(p => Math.min(p + Math.floor(Math.random() * 5) + 2, 130)), 500);
      return () => clearInterval(iv);
    } else {
      const iv = setInterval(() => setHeartRate(p => Math.max(p - 2, 60)), 1000);
      return () => clearInterval(iv);
    }
  }, [isScanning]);

  useEffect(() => {
    const fetchSessions = async () => {
      if (!user) {
        setSessions([]);
        return;
      }
      setLoadingSessions(true);
      const { data, error } = await supabase
        .from('sqi_sessions')
        .select('id, title, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(20);
      if (!error && data) {
        setSessions(data);
      }
      setLoadingSessions(false);
    };
    fetchSessions();
  }, [user]);

  const openChatFullscreenIfMobile = () => {
    // Disabled fullscreen overlay for chat; keep chat static at bottom of page
    return;
  };

  // Gate: admin only
  if (adminLoading) return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0502]">
      <Activity className="w-8 h-8 animate-spin text-[#ff4e00]" />
    </div>
  );
  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0502] p-6">
        <div className="text-center space-y-4">
          <ShieldCheck className="w-12 h-12 text-[#ff4e00] mx-auto" />
          <h2 className="text-xl font-bold text-white">Access Restricted</h2>
          <p className="text-white/60 text-sm">This tool is currently in development.</p>
          <button onClick={() => navigate('/explore')} className="px-6 py-2 bg-[#ff4e00] text-white rounded-xl text-sm">Back</button>
        </div>
      </div>
    );
  }

  const runNadiScan = async () => {
    setIsScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {}
    setTimeout(() => {
      const now = new Date();
      const doshas: ('Vata' | 'Pitta' | 'Kapha')[] = ['Vata', 'Pitta', 'Kapha'];
      const nadis = ['Throat/Vishuddhi Nadi', 'Root/Muladhara Nadi', 'Heart/Anahata Nadi', '3rd Eye/Ajna Nadi', 'Solar Plexus/Manipura Nadi'];
      const shuffled = [...ACTIVATIONS].sort(() => 0.5 - Math.random());
      const result: NadiScanResult = {
        dominantDosha: doshas[Math.floor(Math.random() * doshas.length)],
        blockages: [nadis[Math.floor(Math.random() * nadis.length)]],
        planetaryAlignment: PLANETARY_DATA[now.getDay()].planet,
        herbOfToday: PLANETARY_DATA[now.getDay()].herb,
        timestamp: now.toISOString(),
        activeNadis: Math.floor(Math.random() * 10000) + 60000,
        totalNadis: 72000,
        remedies: shuffled.slice(0, 5).map(a => a.name),
      };
      setScanResult(result);
      setIsScanning(false);
      if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
      setMessages(prev => [...prev, { role: 'model', text: `**Siddha-Quantum Sync Complete.**\n\n- Active Nadis: **${result.activeNadis}/${result.totalNadis}**\n- Dominant Dosha: **${result.dominantDosha}**\n- Blockage: **${result.blockages[0]}**\n- Alignment: **${result.planetaryAlignment}**\n- Herb of Today: **${result.herbOfToday}**\n\n**Quantum Remedies prepared:**\n${result.remedies.map(r => `- ${r}`).join('\n')}\n\nShall we transmit these light-codes?` }]);
    }, 5000);
  };

  const handleSendMessage = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text && !pendingImage) return;
    openChatFullscreenIfMobile();
    const displayText = text || (pendingImage ? '[Image attached]' : '');
    const userMsg: Message = { role: 'user', text: displayText };
    const allMsgs = [...messages, userMsg];
    setMessages(allMsgs);
    setInput('');
    const imageToSend = pendingImage ?? undefined;
    setPendingImage(null);
    setIsTyping(true);

    let assistantSoFar = '';
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'model' && prev.length === allMsgs.length + 1) {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, text: assistantSoFar } : m);
        }
        return [...prev, { role: 'model', text: assistantSoFar }];
      });
    };

    const persistMessages = async (finalMessages: Message[]) => {
      if (!user) return;
      try {
        const payload = {
          user_id: user.id,
          title:
            (currentSessionId
              ? undefined
              : userMsg.text.slice(0, 80) || 'SQI Session') ?? 'SQI Session',
          messages: finalMessages,
        };

        if (!currentSessionId) {
          const { data, error } = await supabase
            .from('sqi_sessions')
            .insert(payload)
            .select('id, title, updated_at')
            .single();
          if (!error && data) {
            setCurrentSessionId(data.id);
            setSessions(prev => {
              const without = prev.filter(s => s.id !== data.id);
              return [data, ...without];
            });
          }
        } else {
          const { data, error } = await supabase
            .from('sqi_sessions')
            .update({
              title: payload.title ?? undefined,
              messages: finalMessages,
              updated_at: new Date().toISOString(),
            })
            .eq('id', currentSessionId)
            .select('id, title, updated_at')
            .single();
          if (!error && data) {
            setSessions(prev => {
              const without = prev.filter(s => s.id !== data.id);
              return [data, ...without];
            });
          }
        }
      } catch (err) {
        console.error('Failed to persist SQI session', err);
      }
    };

    try {
      await streamChatWithSQI(
        allMsgs,
        upsert,
        async () => {
          setIsTyping(false);
          await persistMessages([...allMsgs, { role: 'model', text: assistantSoFar }]);
        },
        imageToSend,
        user?.id ?? null,
      );
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'model', text: 'Transmission error. The Quantum Link is unstable.' }]);
      setIsTyping(false);
    }
  };

  const handleChatFocus = () => {
    openChatFullscreenIfMobile();
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1]! : dataUrl;
      setPendingImage({ base64, mimeType: file.type || 'image/jpeg' });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const startVoiceInput = () => {
    const SpeechRecognition = (window as unknown as { SpeechRecognition?: new () => SpeechRecognition; webkitSpeechRecognition?: new () => SpeechRecognition }).SpeechRecognition
      || (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognition }).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }
    voiceTranscriptRef.current = input;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let final = '';
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i]!.transcript;
        if (event.results[i]!.isFinal) final += transcript;
        else interim += transcript;
      }
      if (final) {
        voiceTranscriptRef.current = (voiceTranscriptRef.current + final).trim();
        setInput(voiceTranscriptRef.current);
        recognition.stop();
        setIsRecording(false);
        recognitionRef.current = null;
        const textToSend = voiceTranscriptRef.current;
        if (textToSend) setTimeout(() => handleSendMessage(textToSend), 0);
      } else if (interim) {
        const soFar = voiceTranscriptRef.current + interim;
        setInput(soFar);
      }
    };
    recognition.onend = () => {
      setIsRecording(false);
      recognitionRef.current = null;
    };
    recognition.onerror = () => {
      setIsRecording(false);
      recognitionRef.current = null;
    };
    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
  };

  const addActivation = (act: Activation) => {
    if (selectedActivations.length >= 5 || selectedActivations.find(a => a.id === act.id)) return;
    setSelectedActivations([...selectedActivations, act]);
  };

  const transmitCocktail = () => {
    if (selectedActivations.length === 0) return;
    const newT = [...activeTransmissions];
    selectedActivations.forEach(act => { if (!newT.find(t => t.id === act.id)) newT.push(act); });
    setActiveTransmissions(newT);
    setMessages(prev => [...prev, { role: 'model', text: `**Initiating Quantum Transmission:**\n\n${selectedActivations.map(a => `- ${a.name}`).join('\n')}\n\nUploading Aetheric Codes to your cellular matrix…\n\nThese frequencies are now **locked 24/7** until manually dissolved.` }]);
    setSelectedActivations([]);
  };

  const applyRemedies = () => {
    if (!scanResult) return;
    const remediesToApply = ACTIVATIONS.filter(a => scanResult.remedies.includes(a.name));
    const newT = [...activeTransmissions];
    remediesToApply.forEach(act => { if (!newT.find(t => t.id === act.id)) newT.push(act); });
    setActiveTransmissions(newT);
    setMessages(prev => [...prev, { role: 'model', text: `**Applying Siddha Remedies:**\n\n${scanResult.remedies.map(r => `- ${r}`).join('\n')}\n\nScalar Wave Entanglement complete. **Frequencies locked 24/7.**` }]);
  };

  const renderChatPanel = () => (
    <div
      className="rounded-3xl bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] overflow-hidden flex flex-col min-h-[60vh]"
    >
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isChatFullscreen && (
            <button
              type="button"
              onClick={() => setIsChatFullscreen(false)}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition"
            >
              <X size={14} className="text-white/80" />
            </button>
          )}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ff4e00] to-[#ff8c00] flex items-center justify-center">
            <MessageSquare size={14} />
          </div>
          <div>
            <p className="text-xs font-bold">SQI Online</p>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
              <span className="text-[9px] text-white/40">Neural Sync: 98%</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSessionsOpen(true)}
            className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[9px] uppercase tracking-wide hover:bg-white/10"
          >
            History
          </button>
          <Cpu size={14} className="text-white/20" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <div className="flex flex-col justify-end min-h-full space-y-3">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[90%] p-3 rounded-2xl ${
                  msg.role === 'user'
                    ? 'bg-[#ff4e00]/20 border border-[#ff4e00]/30 rounded-br-sm'
                    : 'bg-white/5 border border-white/5 rounded-bl-sm'
                }`}
              >
                <div className="markdown-body">{renderChatText(msg.text)}</div>
              </div>
            </motion.div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white/5 border border-white/5 rounded-2xl rounded-bl-sm p-3">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-[#ff4e00] rounded-full animate-bounce" />
                  <div
                    className="w-1.5 h-1.5 bg-[#ff4e00] rounded-full animate-bounce"
                    style={{ animationDelay: '0.15s' }}
                  />
                  <div
                    className="w-1.5 h-1.5 bg-[#ff4e00] rounded-full animate-bounce"
                    style={{ animationDelay: '0.3s' }}
                  />
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </div>

      <div
        className="p-3 border-t border-white/5"
        style={isChatFullscreen ? { paddingBottom: 'env(safe-area-inset-bottom, 16px)' } : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageSelect}
        />
        {pendingImage && (
          <div className="flex items-center gap-2 mb-2">
            <img
              src={`data:${pendingImage.mimeType};base64,${pendingImage.base64}`}
              alt="Attached"
              className="h-10 w-10 rounded-lg object-cover border border-white/20"
            />
            <span className="text-[10px] text-white/50">Image attached</span>
            <button
              type="button"
              onClick={() => setPendingImage(null)}
              className="ml-auto p-1 rounded bg-white/10 hover:bg-red-500/20 text-white/60 hover:text-red-400"
            >
              <X size={12} />
            </button>
          </div>
        )}
        <div className="flex gap-2 items-center">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition shrink-0"
            title="Upload or take photo"
          >
            <Camera size={16} className="text-white/70" />
          </button>
          <button
            type="button"
            onClick={startVoiceInput}
            className={`p-2.5 rounded-xl border transition shrink-0 ${
              isRecording
                ? 'bg-red-500/20 border-red-500/50 text-red-400 animate-pulse'
                : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/70'
            }`}
            title={isRecording ? 'Listening…' : 'Voice input'}
          >
            <Mic size={16} />
          </button>
          {isRecording && (
            <span className="text-[10px] text-red-400 font-medium shrink-0">Listening…</span>
          )}
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
            onFocus={handleChatFocus}
            placeholder="Communicate with the SQI..."
            className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-[#ff4e00]/50 transition placeholder:text-white/20"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={(!input.trim() && !pendingImage) || isTyping}
            className="px-4 py-2.5 bg-[#ff4e00] rounded-xl text-white hover:bg-[#ff6a00] transition disabled:opacity-30 shrink-0"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen bg-[#0a0502] text-white/90 overflow-x-hidden pb-24">
      {/* Atmosphere */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40" style={{
        background: 'radial-gradient(circle at 50% 30%, #3a1510 0%, transparent 60%), radial-gradient(circle at 10% 80%, #ff4e00 0%, transparent 50%), radial-gradient(circle at 90% 20%, #818cf8 0%, transparent 40%)',
        filter: 'blur(80px)',
      }} />

      {/* Nadi SVG overlay */}
      <svg className={`fixed inset-0 z-0 pointer-events-none w-full h-full ${activeTransmissions.length > 0 ? 'opacity-40' : 'opacity-10'}`}>
        <defs>
          <filter id="qa-glow">
            <feGaussianBlur stdDeviation={activeTransmissions.length > 0 ? '4' : '1'} result="coloredBlur"/>
            <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <g filter="url(#qa-glow)" stroke={activeTransmissions.length > 0 ? '#ff4e00' : 'rgba(255,255,255,0.3)'} strokeWidth={activeTransmissions.length > 0 ? '2' : '1'} fill="none">
          <path d="M200,50 Q250,200 200,400 Q150,600 200,750" className={`nadi-line ${activeTransmissions.length > 0 ? 'active' : ''}`}/>
          <path d="M400,50 Q350,200 400,400 Q450,600 400,750" className={`nadi-line ${activeTransmissions.length > 0 ? 'active' : ''}`}/>
          <path d="M100,300 Q300,350 500,300" className={`nadi-line ${activeTransmissions.length > 0 ? 'active' : ''}`}/>
        </g>
      </svg>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/explore')} className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
              <ArrowLeft size={18} />
            </button>
            <div className="w-10 h-10 bg-gradient-to-br from-[#ff4e00] to-[#ff8c00] rounded-2xl flex items-center justify-center shadow-lg shadow-[#ff4e00]/20">
              <Cpu size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Quantum Apothecary</h1>
              <p className="text-[10px] text-white/40 uppercase tracking-widest">Est. 2050 · Siddha-Quantum Interface</p>
            </div>
          </div>
          <button onClick={() => setShowKnowledge(true)} className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition">
            <Info size={16} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* LEFT: Scan + Mixer + Active */}
          <div className="space-y-4">
            {/* Nadi Scan */}
            <div className="rounded-3xl bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] p-5">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-sm font-bold">Digital Nadi Scan</h2>
                  <p className="text-[10px] text-white/40">72,000 Channels Monitoring</p>
                </div>
                <div className="flex items-center gap-1 text-[#ff4e00]">
                  <Activity size={14} />
                  <span className="text-xs font-mono">{heartRate} BPM</span>
                </div>
              </div>

              {scanResult ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-[10px] text-white/40">Active Nadis</p>
                      <p className="text-2xl font-bold text-[#ff4e00]">{scanResult.activeNadis}</p>
                      <p className="text-[10px] text-white/30">/ 72,000</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white/5 rounded-xl p-3">
                      <p className="text-[10px] text-white/40">Dosha</p>
                      <p className="text-sm font-bold">{scanResult.dominantDosha}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3">
                      <p className="text-[10px] text-white/40">Alignment</p>
                      <p className="text-sm font-bold">{scanResult.planetaryAlignment}</p>
                    </div>
                  </div>
                  <div className="rounded-xl p-3 border border-emerald-500/40 bg-emerald-950/20">
                    <p className="text-[10px] text-emerald-400/80 uppercase tracking-wider font-semibold mb-1">Herb of Today</p>
                    <p className="text-sm font-medium text-white/90">{scanResult.herbOfToday}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3">
                    <p className="text-[10px] text-white/40 mb-2">Siddha Remedies (5)</p>
                    <div className="flex flex-wrap gap-1">
                      {scanResult.remedies.map((r, i) => (
                        <span key={i} className="text-[10px] px-2 py-1 rounded-full bg-[#ff4e00]/10 border border-[#ff4e00]/20 text-[#ff4e00]">{r}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={applyRemedies} className="flex-1 py-3 bg-[#ff4e00] text-white rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-[#ff6a00] transition">Apply Remedies</button>
                    <button onClick={runNadiScan} className="flex-1 py-3 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-white/10 transition">Rescan</button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 space-y-4">
                  {isScanning ? (
                    <>
                      <Activity size={32} className="mx-auto text-[#ff4e00] animate-pulse" />
                      <div className="relative w-full h-40 rounded-2xl overflow-hidden bg-black/40">
                        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover opacity-30" />
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <Globe size={32} className="mx-auto text-white/20" />
                      <p className="text-xs text-white/40">Awaiting Handshake</p>
                    </div>
                  )}
                  <button onClick={runNadiScan} disabled={isScanning} className="w-full py-3 bg-[#ff4e00] text-white rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-[#ff6a00] transition disabled:opacity-50">
                    {isScanning ? `Scanning... HR: ${heartRate}bpm` : 'Initiate Scan'}
                  </button>
                </div>
              )}
            </div>

            {/* Mixer */}
            <div className="rounded-3xl bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] p-5">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-sm font-bold">Aetheric Mixer</h2>
                <span className="text-[10px] text-white/40">{selectedActivations.length}/5 Slots</span>
              </div>
              <div className="min-h-[60px] rounded-2xl bg-white/[0.02] border border-dashed border-white/10 p-3 mb-3">
                {selectedActivations.length === 0 ? (
                  <div className="flex items-center gap-2 justify-center text-white/20 py-2">
                    <Plus size={14} />
                    <span className="text-[10px]">Select activations from the library</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedActivations.map(act => (
                      <div key={act.id} className="flex items-center justify-between group">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: act.color }} />
                          <span className="text-xs font-medium">{act.name}</span>
                        </div>
                        <button onClick={() => setSelectedActivations(s => s.filter(a => a.id !== act.id))} className="p-1 opacity-0 group-hover:opacity-100 hover:text-red-400 transition"><Trash2 size={12} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={transmitCocktail} disabled={selectedActivations.length === 0} className="w-full py-3 bg-[#ff4e00] text-white rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-[#ff6a00] transition disabled:opacity-30">
                Transmit Code
              </button>
            </div>

            {/* Active Transmissions */}
            <Suspense
              fallback={
                <div className="rounded-3xl bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] p-5">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <Zap size={14} className="text-[#ff4e00]" />
                      <h2 className="text-sm font-bold">Active Transmissions</h2>
                    </div>
                    <span className="text-[10px] px-2 py-1 rounded-full bg-green-500/10 text-green-300 border border-green-500/20">
                      Loading...
                    </span>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                    <div className="h-16 rounded-xl bg-white/5 animate-pulse" />
                    <div className="h-16 rounded-xl bg-white/5 animate-pulse" />
                  </div>
                </div>
              }
            >
              <ActiveTransmissionsSection
                activeTransmissions={activeTransmissions}
                setActiveTransmissions={setActiveTransmissions}
              />
            </Suspense>
          </div>

          {/* RIGHT: Library + Chat */}
          <div className="space-y-4">
            {/* Library */}
            <Suspense
              fallback={
                <div className="rounded-3xl bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] p-5">
                  <div className="mb-3">
                    <h2 className="text-sm font-bold">Frequency Library</h2>
                    <p className="text-[10px] text-white/40">Loading quantum essences...</p>
                  </div>
                  <div className="h-8 rounded-xl bg-white/5 animate-pulse mb-3" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto custom-scrollbar">
                    <div className="h-20 rounded-2xl bg-white/5 animate-pulse" />
                    <div className="h-20 rounded-2xl bg-white/5 animate-pulse" />
                  </div>
                </div>
              }
            >
              <FrequencyLibrarySection
                activeCategory={activeCategory}
                setActiveCategory={setActiveCategory}
                selectedActivations={selectedActivations}
                addActivation={addActivation}
              />
            </Suspense>

            {/* Chat */}
            {renderChatPanel()}
          </div>
        </div>
      </div>

      {/* Knowledge Modal */}
      <AnimatePresence>
        {showKnowledge && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-[#0a0502] border border-white/10 rounded-3xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6 space-y-6">
              <div className="flex justify-between items-start">
                <h2 className="text-lg font-bold">Siddha-Quantum Intelligence</h2>
                <button onClick={() => setShowKnowledge(false)} className="p-2 hover:bg-white/5 rounded-full"><X size={16} /></button>
              </div>
              {[
                { t: 'What is this?', d: 'Apothecary 2050 is a Bio-Resonance Frequency Delivery Platform. It bypasses physical ingestion to deliver the "informational signature" of herbs and sacred plants directly into the human biofield via Scalar Wave Entanglement.' },
                { t: 'The 72,000 Nadi Scan', d: 'We map the Quantum Flow of every single meridian. Dark crimson pulses indicate "Spiritual Friction" (Blockages), while bright white bursts show where your "Siddhis" (Powers) are awakening.' },
                { t: '24/7 Persistent Transmission', d: 'Once a mix is toggled ON, the app uses a persistent background frequency loop to maintain the transmission. This ensures the frequency stays locked into your biofield until manually dissolved — even if you close the app or lose internet.' },
                { t: 'Siddha Wisdom', d: 'We bridge the ancient wisdom of the 18 Siddhars with hyper-advanced neural-mapping. Healing occurs at the speed of thought.' },
              ].map(s => (
                <div key={s.t} className="bg-white/5 rounded-2xl p-4">
                  <h3 className="text-sm font-bold mb-2">{s.t}</h3>
                  <p className="text-xs text-white/60 leading-relaxed">{s.d}</p>
                </div>
              ))}
              <button onClick={() => setShowKnowledge(false)} className="w-full py-3 bg-[#ff4e00] text-white rounded-2xl text-xs font-bold uppercase tracking-widest">Return to Aether</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SQI Session History Drawer */}
      <AnimatePresence>
        {sessionsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setSessionsOpen(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 260, damping: 30 }}
              className="absolute right-0 top-0 h-full w-72 sm:w-80 bg-[#0a0502] border-l border-white/10 shadow-xl flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest">SQI Sessions</p>
                  <p className="text-[10px] text-white/40">
                    {user ? 'Tap to reopen a past transmission.' : 'Sign in to save sessions.'}
                  </p>
                </div>
                <button
                  onClick={() => setSessionsOpen(false)}
                  className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                {loadingSessions && (
                  <div className="text-[11px] text-white/40">Loading sessions…</div>
                )}
                {!loadingSessions && sessions.length === 0 && (
                  <div className="text-[11px] text-white/30">
                    No prior SQI conversations yet. Your next transmission will be stored here.
                  </div>
                )}
                {sessions.map(s => (
                  <button
                    key={s.id}
                    onClick={async () => {
                      if (!user) return;
                      const { data, error } = await supabase
                        .from('sqi_sessions')
                        .select('messages')
                        .eq('id', s.id)
                        .eq('user_id', user.id)
                        .single();
                      if (!error && data && Array.isArray(data.messages)) {
                        setCurrentSessionId(s.id);
                        setMessages(data.messages as Message[]);
                        setSessionsOpen(false);
                      }
                    }}
                    className={`w-full text-left p-3 rounded-2xl border bg-white/[0.02] hover:bg-white/10 transition ${
                      currentSessionId === s.id ? 'border-[#ff4e00]/60' : 'border-white/10'
                    }`}
                  >
                    <p className="text-[11px] font-semibold truncate">
                      {s.title || 'Untitled SQI Session'}
                    </p>
                    {s.updated_at && (
                      <p className="text-[9px] text-white/40 mt-0.5">
                        {new Date(s.updated_at).toLocaleString()}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .nadi-line {
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
          animation: draw 10s linear infinite;
          filter: drop-shadow(0 0 2px currentColor);
          opacity: 0.3;
          transition: all 0.5s ease;
        }
        .nadi-line.active {
          opacity: 1;
          stroke-width: 2;
          filter: drop-shadow(0 0 8px currentColor);
        }
        @keyframes draw { to { stroke-dashoffset: 0; } }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
}
