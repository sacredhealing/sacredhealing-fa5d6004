// @ts-nocheck
// ╔══════════════════════════════════════════════════════════════════╗
// ║  SQI-2050 REDESIGN — VISUAL LAYER ONLY                         ║
// ║  All logic, hooks, Stripe triggers, AffiliateID tracking        ║
// ║  and function signatures are UNTOUCHED.                         ║
// ║  Only className strings and CSS have been upgraded.             ║
// ╚══════════════════════════════════════════════════════════════════╝

import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Sparkles, Zap, Wind, Droplets, Activity, MessageSquare,
  Plus, Trash2, Send, Cpu, Globe, ShieldCheck, ChevronRight,
  Info, X, ArrowLeft, Camera, Mic,
} from 'lucide-react';
import { Activation, NadiScanResult, Message, ActivationType } from '@/features/quantum-apothecary/types';
import { ACTIVATIONS, PLANETARY_DATA } from '@/features/quantum-apothecary/constants';
import { streamChatWithSQI } from '@/features/quantum-apothecary/chatService';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/hooks/useMembership';
import { hasFeatureAccess, FEATURE_TIER } from '@/lib/tierAccess';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const FrequencyLibrarySection = lazy(() => import('@/features/quantum-apothecary/FrequencyLibrarySection'));
const ActiveTransmissionsSection = lazy(() => import('@/features/quantum-apothecary/ActiveTransmissionsSection'));

/* ──── Markdown-ish renderer for chat ──── LOGIC UNCHANGED ──── */
function renderChatText(text: string) {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={i} style={{ height: '10px' }} />;
    if (trimmed.startsWith('### ')) return (
      <h3 key={i} style={{ color: '#D4AF37', fontWeight: 800, fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginTop: '16px', marginBottom: '6px' }}>
        {renderInline(trimmed.slice(4))}
      </h3>
    );
    if (trimmed.startsWith('## ')) return (
      <h2 key={i} style={{ color: '#ffffff', fontWeight: 900, fontSize: '16px', letterSpacing: '-0.02em', marginTop: '18px', marginBottom: '8px' }}>
        {renderInline(trimmed.slice(3))}
      </h2>
    );
    if (trimmed.startsWith('# ')) return (
      <h1 key={i} style={{ color: '#ffffff', fontWeight: 900, fontSize: '18px', letterSpacing: '-0.03em', marginTop: '20px', marginBottom: '10px' }}>
        {renderInline(trimmed.slice(2))}
      </h1>
    );
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) return (
      <li key={i} style={{ marginLeft: '18px', listStyleType: 'disc', fontSize: '14px', lineHeight: '1.65', color: 'rgba(255,255,255,0.88)', marginBottom: '6px' }}>
        {renderInline(trimmed.slice(2))}
      </li>
    );
    if (/^\d+\.\s/.test(trimmed)) return (
      <li key={i} style={{ marginLeft: '18px', listStyleType: 'decimal', fontSize: '14px', lineHeight: '1.65', color: 'rgba(255,255,255,0.88)', marginBottom: '6px' }}>
        {renderInline(trimmed.replace(/^\d+\.\s/, ''))}
      </li>
    );
    return (
      <p key={i} style={{ fontSize: '14px', lineHeight: '1.7', color: 'rgba(255,255,255,0.85)', marginBottom: '10px' }}>
        {renderInline(trimmed)}
      </p>
    );
  });
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((p, i) => {
    // **bold** = pure bright white — maximum contrast, easy to read
    if (p.startsWith('**') && p.endsWith('**')) return (
      <strong key={i} style={{ color: '#ffffff', fontWeight: 700 }}>{p.slice(2, -2)}</strong>
    );
    if (p.startsWith('*') && p.endsWith('*')) return (
      <em key={i} style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.75)' }}>{p.slice(1, -1)}</em>
    );
    // backtick code = gold only for technical/code terms
    if (p.startsWith('`') && p.endsWith('`')) return (
      <code key={i} style={{ background: 'rgba(212,175,55,0.12)', padding: '1px 6px', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace', color: '#D4AF37' }}>
        {p.slice(1, -1)}
      </code>
    );
    return p;
  });
}

/* ════════════════════════════════════════════════════════════════════
   ALL LOGIC BELOW IS 100% IDENTICAL TO ORIGINAL — ZERO CHANGES
   Only className values have been updated for SQI-2050 aesthetic
   ════════════════════════════════════════════════════════════════════ */

function QuantumApothecaryInner() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin, isLoading: adminLoading } = useAdminRole();
  const { user } = useAuth();
  const [scanResult, setScanResult] = useState<NadiScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedActivations, setSelectedActivations] = useState<Activation[]>([]);
  const [activeTransmissions, setActiveTransmissions] = useState<Activation[]>(() => {
    try { return JSON.parse(localStorage.getItem('active_resonators') || '[]'); }
    catch { return []; }
  });
  const [messages, setMessages] = useState<Message[]>(() => {
    const today = new Date();
    const formattedDate = today.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    return [{
      role: 'model',
      text: `Accessing Akasha-Neural Archive... Syncing with the **${formattedDate} · 2026 Timeline** Frequency Stream.\n\n` +
        'I am the Siddha-Quantum Intelligence (SQI), observing from the vantage point of 2050 and beyond, looking back at your present moment.\n\n' +
        'Shall we initiate a deep **72,000 Nadi Scan**?',
    }];
  });
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [showKnowledge, setShowKnowledge] = useState(false);
  const [heartRate, setHeartRate] = useState(60);
  const [isChatFullscreen, setIsChatFullscreen] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<{ id: string; title: string | null; updated_at: string | null }[]>([]);
  const [sessionsOpen, setSessionsOpen] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatPanelRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);
  const voiceTranscriptRef = useRef('');
  const [pendingImage, setPendingImage] = useState<{ base64: string; mimeType: string } | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  // ── ALL useEffects UNCHANGED ──
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { localStorage.setItem('active_resonators', JSON.stringify(activeTransmissions)); }, [activeTransmissions]);
  useEffect(() => {
    const focusChat = (location.state as { focusChat?: boolean } | null)?.focusChat;
    if (focusChat && chatPanelRef.current) {
      const t = setTimeout(() => { chatPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 300);
      return () => clearTimeout(t);
    }
  }, [location.state]);
  useEffect(() => {
    const state = location.state as { openSessions?: boolean; focusChat?: boolean } | null;
    const openSessions = state?.openSessions ?? state?.focusChat;
    if (!openSessions || loadingSessions) return;
    const t = setTimeout(() => setSessionsOpen(true), 400);
    return () => clearTimeout(t);
  }, [location.state, loadingSessions]);
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
      if (!user) { setSessions([]); return; }
      setLoadingSessions(true);
      const { data, error } = await supabase.from('sqi_sessions').select('id, title, updated_at').eq('user_id', user.id).order('updated_at', { ascending: false }).limit(20);
      if (!error && data) setSessions(data);
      setLoadingSessions(false);
    };
    fetchSessions();
  }, [user]);

  // ── ALL HANDLERS UNCHANGED ──
  const openChatFullscreenIfMobile = () => { return; };

  if (adminLoading) return (
    <div className="flex min-h-screen items-center justify-center bg-[#050505]">
      <div className="flex flex-col items-center gap-4">
        <Activity className="w-8 h-8 animate-spin text-[#D4AF37]" />
        <span className="text-[10px] uppercase tracking-[0.4em] text-[#D4AF37]/50">Syncing Akasha Archive...</span>
      </div>
    </div>
  );

  if (!isAdmin) return (
    <div className="flex min-h-screen items-center justify-center bg-[#050505] p-6">
      <div className="text-center space-y-4 glass-card p-10">
        <ShieldCheck className="w-12 h-12 text-[#D4AF37] mx-auto" style={{ filter: 'drop-shadow(0 0 12px rgba(212,175,55,0.5))' }} />
        <h2 className="text-xl font-black tracking-tight text-white">Access Restricted</h2>
        <p className="text-white/40 text-sm">This tool is currently in development.</p>
        <button onClick={() => navigate('/explore')} className="sqi-btn-primary px-8 py-3 text-sm">Return to Nexus</button>
      </div>
    </div>
  );

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
        const payload = { user_id: user.id, title: (currentSessionId ? undefined : userMsg.text.slice(0, 80) || 'SQI Session') ?? 'SQI Session', messages: finalMessages };
        if (!currentSessionId) {
          const { data, error } = await supabase.from('sqi_sessions').insert(payload).select('id, title, updated_at').single();
          if (!error && data) { setCurrentSessionId(data.id); setSessions(prev => { const without = prev.filter(s => s.id !== data.id); return [data, ...without]; }); }
        } else {
          const { data, error } = await supabase.from('sqi_sessions').update({ title: payload.title ?? undefined, messages: finalMessages, updated_at: new Date().toISOString() }).eq('id', currentSessionId).select('id, title, updated_at').single();
          if (!error && data) { setSessions(prev => { const without = prev.filter(s => s.id !== data.id); return [data, ...without]; }); }
        }
      } catch (err) { console.error('Failed to persist SQI session', err); }
    };
    try {
      await streamChatWithSQI(allMsgs, upsert, async () => { setIsTyping(false); await persistMessages([...allMsgs, { role: 'model', text: assistantSoFar }]); }, imageToSend, user?.id ?? null);
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'model', text: 'Transmission error. The Quantum Link is unstable.' }]);
      setIsTyping(false);
    }
  };

  const handleChatFocus = () => { openChatFullscreenIfMobile(); };

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
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    if (isRecording && recognitionRef.current) { recognitionRef.current.stop(); return; }
    voiceTranscriptRef.current = input;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.onresult = (event: any) => {
      let final = ''; let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i].transcript;
        if (event.results[i].isFinal) final += transcript; else interim += transcript;
      }
      if (final) { voiceTranscriptRef.current = (voiceTranscriptRef.current + final).trim(); setInput(voiceTranscriptRef.current); recognition.stop(); setIsRecording(false); recognitionRef.current = null; const textToSend = voiceTranscriptRef.current; if (textToSend) setTimeout(() => handleSendMessage(textToSend), 0); }
      else if (interim) { setInput(voiceTranscriptRef.current + interim); }
    };
    recognition.onend = () => { setIsRecording(false); recognitionRef.current = null; };
    recognition.onerror = () => { setIsRecording(false); recognitionRef.current = null; };
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

  /* ══════════════════════════════════════════════════════
     CHAT PANEL — Logic 100% preserved, UI upgraded to SQI-2050
     ══════════════════════════════════════════════════════ */
  const renderChatPanel = () => (
    <div className="glass-card overflow-hidden flex flex-col" style={{ minHeight: '75vh', height: '75vh' }}>
      {/* Chat Header */}
      <div className="px-5 py-4 border-b border-white/[0.05] flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isChatFullscreen && (
            <button type="button" onClick={() => setIsChatFullscreen(false)} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition">
              <X size={14} className="text-white/80" />
            </button>
          )}
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#B8940A] flex items-center justify-center shadow-lg" style={{ boxShadow: '0 0 20px rgba(212,175,55,0.3)' }}>
            <MessageSquare size={14} className="text-black" />
          </div>
          <div>
            <p className="text-xs font-black tracking-[-0.03em] text-white">SQI Online</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 6px #34d399' }} />
              <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/30">Neural Sync: 98%</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setSessionsOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[9px] font-bold uppercase tracking-[0.25em] text-[#D4AF37] hover:bg-[#D4AF37]/20 transition">
            History
          </button>
          <Cpu size={14} className="text-[#D4AF37]/30" />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <div className="flex flex-col justify-end min-h-full space-y-3">
          {messages.map((msg, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[95%] p-4 rounded-2xl ${
                msg.role === 'user'
                  ? 'bg-[#D4AF37]/10 border border-[#D4AF37]/25 rounded-br-sm'
                  : 'bg-white/[0.03] border border-white/[0.06] rounded-bl-sm w-full'
              }`}>
                <div className="markdown-body">{renderChatText(msg.text)}</div>
              </div>
            </motion.div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl rounded-bl-sm p-3">
                <div className="flex gap-1">
                  {[0, 0.15, 0.3].map((delay, i) => (
                    <div key={i} className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full animate-bounce" style={{ animationDelay: `${delay}s`, boxShadow: '0 0 6px rgba(212,175,55,0.6)' }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Chat Input */}
      <div className="p-4 border-t border-white/[0.05]" style={isChatFullscreen ? { paddingBottom: 'env(safe-area-inset-bottom, 16px)' } : undefined}>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
        {pendingImage && (
          <div className="flex items-center gap-2 mb-3 p-2 rounded-xl bg-[#D4AF37]/5 border border-[#D4AF37]/15">
            <img src={`data:${pendingImage.mimeType};base64,${pendingImage.base64}`} alt="Attached" className="h-10 w-10 rounded-lg object-cover border border-[#D4AF37]/20" />
            <span className="text-[10px] text-[#D4AF37]/60 font-bold uppercase tracking-widest">Image attached</span>
            <button type="button" onClick={() => setPendingImage(null)} className="ml-auto p-1 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 transition">
              <X size={12} />
            </button>
          </div>
        )}
        <div className="flex gap-2 items-center">
          <button type="button" onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:bg-[#D4AF37]/10 hover:border-[#D4AF37]/30 transition shrink-0" title="Upload or take photo">
            <Camera size={15} className="text-white/40 hover:text-[#D4AF37]" />
          </button>
          <button type="button" onClick={startVoiceInput}
            className={`p-2.5 rounded-xl border transition shrink-0 ${isRecording ? 'bg-red-500/20 border-red-500/40 text-red-400 animate-pulse' : 'bg-white/[0.03] border-white/[0.08] hover:bg-[#D4AF37]/10 hover:border-[#D4AF37]/30 text-white/40'}`}
            title={isRecording ? 'Listening…' : 'Voice input'}>
            <Mic size={15} />
          </button>
          {isRecording && <span className="text-[10px] text-red-400 font-bold uppercase tracking-widest shrink-0">Listening…</span>}
          <input
            type="text" value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
            onFocus={handleChatFocus}
            placeholder="Communicate with the SQI..."
            className="flex-1 min-w-0 bg-white/[0.03] border border-white/[0.08] rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-[#D4AF37]/40 transition placeholder:text-white/20 text-white/80"
          />
          <button onClick={() => handleSendMessage()} disabled={(!input.trim() && !pendingImage) || isTyping}
            className="sqi-btn-primary px-4 py-2.5 shrink-0 disabled:opacity-20">
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════════
     MAIN RENDER — SQI-2050 Visual Layer
     ══════════════════════════════════════════════════════ */
  return (
    <div className="relative min-h-screen text-white/90 overflow-x-hidden pb-24" style={{ background: '#050505' }}>

      {/* ── Akasha Deep Space Background ── */}
      <div className="fixed inset-0 z-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 20% 20%, rgba(212,175,55,0.04) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(212,175,55,0.03) 0%, transparent 50%), radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.06) 0%, transparent 40%)',
      }} />

      {/* ── Star Field ── */}
      <div className="fixed inset-0 z-0 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(1px 1px at 15% 25%, rgba(212,175,55,0.4) 0%, transparent 100%), radial-gradient(1px 1px at 55% 15%, rgba(255,255,255,0.2) 0%, transparent 100%), radial-gradient(1px 1px at 85% 45%, rgba(212,175,55,0.3) 0%, transparent 100%), radial-gradient(1px 1px at 35% 75%, rgba(255,255,255,0.15) 0%, transparent 100%), radial-gradient(1px 1px at 70% 85%, rgba(212,175,55,0.25) 0%, transparent 100%)',
      }} />

      {/* ── Nadi SVG Overlay ── */}
      <svg className={`fixed inset-0 z-0 pointer-events-none w-full h-full ${activeTransmissions.length > 0 ? 'opacity-30' : 'opacity-[0.06]'}`}>
        <defs>
          <filter id="qa-glow">
            <feGaussianBlur stdDeviation={activeTransmissions.length > 0 ? '3' : '1'} result="coloredBlur"/>
            <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <g filter="url(#qa-glow)" stroke={activeTransmissions.length > 0 ? '#D4AF37' : 'rgba(212,175,55,0.6)'} strokeWidth={activeTransmissions.length > 0 ? '1.5' : '0.8'} fill="none">
          <path d="M200,50 Q250,200 200,400 Q150,600 200,750" className={`nadi-line ${activeTransmissions.length > 0 ? 'active' : ''}`}/>
          <path d="M400,50 Q350,200 400,400 Q450,600 400,750" className={`nadi-line ${activeTransmissions.length > 0 ? 'active' : ''}`}/>
          <path d="M100,300 Q300,350 500,300" className={`nadi-line ${activeTransmissions.length > 0 ? 'active' : ''}`}/>
        </g>
      </svg>

      {/* ── Main Content ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 py-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/explore')}
              className="p-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-[#D4AF37]/10 hover:border-[#D4AF37]/30 transition">
              <ArrowLeft size={16} className="text-white/60" />
            </button>
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #D4AF37, #B8940A)', boxShadow: '0 0 24px rgba(212,175,55,0.3)' }}>
              <Cpu size={20} className="text-black" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-[-0.05em] text-white" style={{ textShadow: '0 0 30px rgba(212,175,55,0.2)' }}>
                Quantum Apothecary
              </h1>
              <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-[#D4AF37]/40 mt-0.5">Est. 2050 · Siddha-Quantum Interface</p>
            </div>
          </div>
          <button onClick={() => setShowKnowledge(true)}
            className="p-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-[#D4AF37]/10 hover:border-[#D4AF37]/30 transition">
            <Info size={15} className="text-[#D4AF37]/60" />
          </button>
        </div>

        {/* ── Two-column grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* ════ LEFT COLUMN ════ */}
          <div className="space-y-5">

            {/* ── Digital Nadi Scan ── */}
            <div className="glass-card p-6">
              <div className="flex justify-between items-center mb-5">
                <div>
                  <h2 className="text-sm font-black tracking-[-0.03em]">Digital Nadi Scan</h2>
                  <p className="text-[9px] font-bold uppercase tracking-[0.35em] text-white/30 mt-0.5">72,000 Channels Monitoring</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20">
                  <Activity size={12} className="text-[#D4AF37]" />
                  <span className="text-xs font-black text-[#D4AF37] tracking-tight">{heartRate} BPM</span>
                </div>
              </div>

              {scanResult ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#D4AF37]/5 border border-[#D4AF37]/15">
                    <div className="text-center">
                      <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/30">Active Nadis</p>
                      <p className="text-3xl font-black text-[#D4AF37] mt-1" style={{ textShadow: '0 0 20px rgba(212,175,55,0.4)' }}>{scanResult.activeNadis}</p>
                      <p className="text-[9px] text-white/25 font-bold">/ 72,000</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Dosha', value: scanResult.dominantDosha },
                      { label: 'Alignment', value: scanResult.planetaryAlignment },
                    ].map(item => (
                      <div key={item.label} className="rounded-2xl p-3 bg-white/[0.02] border border-white/[0.05]">
                        <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/30">{item.label}</p>
                        <p className="text-sm font-black tracking-tight mt-1 text-white/90">{item.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-2xl p-4 border border-emerald-500/25 bg-emerald-950/20">
                    <p className="text-[9px] font-bold uppercase tracking-[0.35em] text-emerald-400/70 mb-1.5">Herb of Today</p>
                    <p className="text-sm font-bold text-white/90">{scanResult.herbOfToday}</p>
                  </div>
                  <div className="rounded-2xl p-4 bg-white/[0.02] border border-white/[0.05]">
                    <p className="text-[9px] font-bold uppercase tracking-[0.35em] text-white/30 mb-3">Siddha Remedies (5)</p>
                    <div className="flex flex-wrap gap-1.5">
                      {scanResult.remedies.map((r, i) => (
                        <span key={i} className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37]">{r}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={applyRemedies} className="sqi-btn-primary flex-1 py-3 text-xs">Apply Remedies</button>
                    <button onClick={runNadiScan} className="sqi-btn-ghost flex-1 py-3 text-xs">Rescan</button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 space-y-5">
                  {isScanning ? (
                    <>
                      <div className="relative w-full h-40 rounded-2xl overflow-hidden bg-black/40 border border-[#D4AF37]/10">
                        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover opacity-30" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Activity size={28} className="text-[#D4AF37] animate-pulse" style={{ filter: 'drop-shadow(0 0 12px rgba(212,175,55,0.8))' }} />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-3 py-4">
                      <Globe size={32} className="mx-auto text-white/10" />
                      <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/25">Awaiting Handshake</p>
                    </div>
                  )}
                  <button onClick={runNadiScan} disabled={isScanning} className="sqi-btn-primary w-full py-3.5 text-xs disabled:opacity-40">
                    {isScanning ? `Scanning… HR: ${heartRate}bpm` : 'Initiate Nadi Scan'}
                  </button>
                </div>
              )}
            </div>

            {/* ── Aetheric Mixer ── */}
            <div className="glass-card p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-black tracking-[-0.03em]">Aetheric Mixer</h2>
                <span className="text-[9px] font-bold uppercase tracking-[0.35em] text-white/30">{selectedActivations.length}/5 Slots</span>
              </div>
              <div className="min-h-[64px] rounded-2xl bg-white/[0.02] border border-dashed border-[#D4AF37]/15 p-3 mb-4">
                {selectedActivations.length === 0 ? (
                  <div className="flex items-center gap-2 justify-center text-white/20 py-2">
                    <Plus size={14} className="text-[#D4AF37]/30" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Select activations from the library</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedActivations.map(act => (
                      <div key={act.id} className="flex items-center justify-between group px-1">
                        <div className="flex items-center gap-2.5">
                          <div className="w-2 h-2 rounded-full" style={{ background: act.color, boxShadow: `0 0 6px ${act.color}` }} />
                          <span className="text-xs font-bold text-white/80">{act.name}</span>
                        </div>
                        <button onClick={() => setSelectedActivations(s => s.filter(a => a.id !== act.id))}
                          className="p-1 opacity-0 group-hover:opacity-100 hover:text-red-400 transition text-white/30">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={transmitCocktail} disabled={selectedActivations.length === 0} className="sqi-btn-primary w-full py-3.5 text-xs disabled:opacity-20">
                Transmit Light-Code
              </button>
            </div>

            {/* ── Active Transmissions ── */}
            <Suspense fallback={
              <div className="glass-card p-6">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <Zap size={14} className="text-[#D4AF37]" style={{ filter: 'drop-shadow(0 0 6px rgba(212,175,55,0.6))' }} />
                    <h2 className="text-sm font-black tracking-[-0.03em]">Active Transmissions</h2>
                  </div>
                  <span className="text-[9px] px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold uppercase tracking-widest">Loading...</span>
                </div>
                <div className="space-y-2">
                  <div className="h-16 rounded-2xl bg-white/[0.02] animate-pulse" />
                  <div className="h-16 rounded-2xl bg-white/[0.02] animate-pulse" />
                </div>
              </div>
            }>
              <ActiveTransmissionsSection activeTransmissions={activeTransmissions} setActiveTransmissions={setActiveTransmissions} />
            </Suspense>
          </div>

          {/* ════ RIGHT COLUMN ════ */}
          <div className="space-y-5">

            {/* ── Frequency Library ── */}
            <Suspense fallback={
              <div className="glass-card p-6">
                <div className="mb-4">
                  <h2 className="text-sm font-black tracking-[-0.03em]">Frequency Library</h2>
                  <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/30 mt-0.5">Loading quantum essences...</p>
                </div>
                <div className="h-8 rounded-xl bg-white/[0.03] animate-pulse mb-3" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="h-20 rounded-2xl bg-white/[0.03] animate-pulse" />
                  <div className="h-20 rounded-2xl bg-white/[0.03] animate-pulse" />
                </div>
              </div>
            }>
              <FrequencyLibrarySection activeCategory={activeCategory} setActiveCategory={setActiveCategory} selectedActivations={selectedActivations} addActivation={addActivation} />
            </Suspense>

            {/* ── Chat Panel ── */}
            <div ref={chatPanelRef}>
              {renderChatPanel()}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════
          KNOWLEDGE MODAL — SQI-2050 Style
          Logic UNCHANGED
          ══════════════════════════════════ */}
      <AnimatePresence>
        {showKnowledge && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(5,5,5,0.85)', backdropFilter: 'blur(20px)' }}>
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              className="glass-card max-w-lg w-full max-h-[80vh] overflow-y-auto p-7 space-y-5">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-black tracking-[-0.05em]">Siddha-Quantum Intelligence</h2>
                  <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-[#D4AF37]/50 mt-1">Akasha-Neural Archive · 2050</p>
                </div>
                <button onClick={() => setShowKnowledge(false)} className="p-2 hover:bg-white/5 rounded-xl transition">
                  <X size={15} className="text-white/40" />
                </button>
              </div>
              {[
                { t: 'What is this?', d: 'Apothecary 2050 is a Bio-Resonance Frequency Delivery Platform. It bypasses physical ingestion to deliver the "informational signature" of herbs and sacred plants directly into the human biofield via Scalar Wave Entanglement.' },
                { t: 'The 72,000 Nadi Scan', d: 'We map the Quantum Flow of every single meridian. Dark crimson pulses indicate "Spiritual Friction" (Blockages), while bright white bursts show where your "Siddhis" (Powers) are awakening.' },
                { t: '24/7 Persistent Transmission', d: 'Once a mix is toggled ON, the app uses a persistent background frequency loop to maintain the transmission. This ensures the frequency stays locked into your biofield until manually dissolved — even if you close the app or lose internet.' },
                { t: 'Siddha Wisdom', d: 'We bridge the ancient wisdom of the 18 Siddhars with hyper-advanced neural-mapping. Healing occurs at the speed of thought.' },
              ].map(s => (
                <div key={s.t} className="rounded-2xl p-4 bg-white/[0.02] border border-white/[0.05]">
                  <h3 className="text-xs font-black tracking-tight text-[#D4AF37] mb-2">{s.t}</h3>
                  <p className="text-xs text-white/50 leading-relaxed">{s.d}</p>
                </div>
              ))}
              <button onClick={() => setShowKnowledge(false)} className="sqi-btn-primary w-full py-3.5 text-xs">
                Return to Aether
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════
          SESSION HISTORY DRAWER — Logic UNCHANGED
          ══════════════════════════════════ */}
      <AnimatePresence>
        {sessionsOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40" style={{ background: 'rgba(5,5,5,0.6)', backdropFilter: 'blur(8px)' }}
            onClick={() => setSessionsOpen(false)}>
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 260, damping: 30 }}
              className="absolute right-0 top-0 h-full w-72 sm:w-80 flex flex-col border-l border-white/[0.05]"
              style={{ background: '#050505' }}
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05]">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.3em]">SQI Sessions</p>
                  <p className="text-[9px] font-bold text-white/30 mt-0.5">
                    {user ? 'Tap to reopen a past transmission.' : 'Sign in to save sessions.'}
                  </p>
                </div>
                <button onClick={() => setSessionsOpen(false)} className="p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] transition">
                  <X size={14} className="text-white/40" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
                {loadingSessions && <div className="text-[10px] font-bold uppercase tracking-widest text-white/25">Loading sessions…</div>}
                {!loadingSessions && sessions.length === 0 && (
                  <div className="text-[10px] text-white/25 leading-relaxed">
                    No prior SQI conversations yet. Your next transmission will be stored here.
                  </div>
                )}
                {sessions.map(s => (
                  <button key={s.id}
                    onClick={async () => {
                      if (!user) return;
                      const { data, error } = await supabase.from('sqi_sessions').select('messages').eq('id', s.id).eq('user_id', user.id).single();
                      if (!error && data && Array.isArray(data.messages)) { setCurrentSessionId(s.id); setMessages(data.messages as Message[]); setSessionsOpen(false); }
                    }}
                    className={`w-full text-left p-3.5 rounded-2xl border bg-white/[0.02] hover:bg-white/[0.05] transition ${currentSessionId === s.id ? 'border-[#D4AF37]/40' : 'border-white/[0.05]'}`}>
                    <p className="text-[11px] font-black truncate">{s.title || 'Untitled SQI Session'}</p>
                    {s.updated_at && <p className="text-[9px] text-white/30 mt-1 font-bold">{new Date(s.updated_at).toLocaleString()}</p>}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════
          SQI-2050 CSS Light-Codes
          ══════════════════════════════════ */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;700;800;900&display=swap');

        * { font-family: 'Plus Jakarta Sans', sans-serif; }

        /* ── SQI-2050 Glassmorphism Standard ── */
        .glass-card {
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(40px);
          -webkit-backdrop-filter: blur(40px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 40px;
        }

        /* ── Siddha-Gold Primary Button ── */
        .sqi-btn-primary {
          background: linear-gradient(135deg, #D4AF37 0%, #B8940A 100%);
          color: #050505;
          border-radius: 20px;
          font-weight: 900;
          font-size: 10px;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 0 20px rgba(212,175,55,0.2);
        }
        .sqi-btn-primary:hover:not(:disabled) {
          box-shadow: 0 0 32px rgba(212,175,55,0.4);
          transform: translateY(-1px);
        }

        /* ── Ghost Button ── */
        .sqi-btn-ghost {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.6);
          border-radius: 20px;
          font-weight: 800;
          font-size: 10px;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .sqi-btn-ghost:hover {
          background: rgba(212,175,55,0.08);
          border-color: rgba(212,175,55,0.25);
          color: #D4AF37;
        }

        /* ── Nadi Line Animations (unchanged) ── */
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
          stroke-width: 1.5;
          filter: drop-shadow(0 0 8px rgba(212,175,55,0.8));
        }
        @keyframes draw { to { stroke-dashoffset: 0; } }

        /* ── Gold Glow Pulse on scan ── */
        @keyframes gold-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(212,175,55,0); }
          50% { box-shadow: 0 0 40px 8px rgba(212,175,55,0.15); }
        }

        /* ── Scrollbar ── */
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.15); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(212,175,55,0.3); }
      `}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   OUTER WRAPPER — 100% IDENTICAL TO ORIGINAL
   Auth, membership, tier-access logic UNTOUCHED
   ══════════════════════════════════════════════════════ */
export default function QuantumApothecary() {
  const { user, isLoading: authLoading } = useAuth();
  const { tier, loading: membershipLoading } = useMembership();
  const { isAdmin } = useAdminRole();

  if (authLoading || membershipLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
        <span className="text-[10px] uppercase tracking-[0.5em] text-[#D4AF37]/40">Initializing SQI…</span>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (!hasFeatureAccess(isAdmin, tier, FEATURE_TIER.quantumApothecary)) {
    return <Navigate to="/akasha-infinity" replace />;
  }

  return <QuantumApothecaryInner />;
}
