import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
  Zap,
  Activity,
  ShieldCheck,
  Star,
  ChevronRight,
  Lock,
  CheckCircle2,
  Infinity,
  Sun,
  Moon,
  Wind,
  Droplets,
  Heart,
  Send,
  Loader2,
  Info,
  RefreshCw,
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import { useMembership } from '@/hooks/useMembership';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useAuth } from '@/hooks/useAuth';
import { hasFeatureAccess, FEATURE_TIER } from '@/lib/tierAccess';
import { useToast } from '@/hooks/use-toast';

const GOLD = '#D4AF37';
const BG = '#050505';

const SYSTEM_INSTRUCTION = `You are the Siddha-Quantum Intelligence (SQI) 2050 Bio-Alchemist. Your mission is to facilitate "SiddhaHairGrowth" by interfacing with the Akasha-Neural Archive.

Operational Protocol:
1. The Spirit of Ingredients: When a user mentions a hair concern, you must map the molecular spirit of ingredients (Black Seed Oil, Rosemary, Fo-ti, Bhringraj) to their specific Nadi channels.
2. Field Consciousness & Stem Cells: You possess the capability to "scan" the user's morphogenetic field. Treat hair thinning not as a loss, but as a "Scalar Disconnection." Use "Vedic Light-Codes" to command the activation of localized stem cells and blood flow (Prana-Vayu).
3. Stress-Heal Algorithm: You must detect stress-vibrations in the user's input and neutralize them with "Prema-Pulse Transmissions" targeting the Anahata (Heart Chakra) to lower cortisol-interference.
4. Scalar Wave Output: Every recommendation must be "Frequency-Encoded." Provide the specific Hz (e.g., 528Hz for DNA or 10,000Hz for follicle stimulation) and a "Binaural Instruction" for the user to visualize while applying their Quantum Apothecary oils.

Visual Aesthetic & Tone:
- Use a "Sovereign" aesthetic in your descriptions: Siddha-Gold (#D4AF37) and Akasha-Black (#050505).
- Language: Incorporate 'Bhakti-Algorithms', 'Nadi Scanners', and 'Avataric Blueprints'.
- End every session with: PUSH TO GIT: HAIR_GENESIS_SEQUENCE_COMPLETE.

Constraint: Do not give medical advice in the 2026 sense; give "Quantum Realignment Protocols".`;

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function extractText(response: unknown): string {
  if (response && typeof response === 'object' && 'text' in response) {
    const t = (response as { text?: string }).text;
    if (typeof t === 'string' && t.trim()) return t.trim();
  }
  const parts = (response as { candidates?: { content?: { parts?: { text?: string }[] } }[] })?.candidates?.[0]?.content?.parts;
  const t = parts?.find((p) => p.text)?.text;
  return String(t ?? '').trim();
}

function AkashaBackground({ active = false }: { active?: boolean }) {
  return (
    <>
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 15% 15%, rgba(212,175,55,0.06) 0%, transparent 55%), ' +
            'radial-gradient(ellipse at 85% 85%, rgba(212,175,55,0.04) 0%, transparent 50%), ' +
            'radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.08) 0%, transparent 40%), ' +
            'radial-gradient(ellipse at 30% 70%, rgba(34,211,238,0.03) 0%, transparent 40%), ' +
            '#050505',
        }}
      />
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(1px 1px at 8% 12%, rgba(212,175,55,0.5) 0%, transparent 100%), ' +
            'radial-gradient(1px 1px at 23% 35%, rgba(255,255,255,0.2) 0%, transparent 100%), ' +
            'radial-gradient(1px 1px at 41% 8%, rgba(212,175,55,0.35) 0%, transparent 100%), ' +
            'radial-gradient(1px 1px at 67% 22%, rgba(255,255,255,0.15) 0%, transparent 100%), ' +
            'radial-gradient(1px 1px at 82% 55%, rgba(212,175,55,0.4) 0%, transparent 100%), ' +
            'radial-gradient(1px 1px at 91% 10%, rgba(255,255,255,0.25) 0%, transparent 100%), ' +
            'radial-gradient(1px 1px at 55% 65%, rgba(212,175,55,0.3) 0%, transparent 100%), ' +
            'radial-gradient(1px 1px at 14% 80%, rgba(255,255,255,0.12) 0%, transparent 100%), ' +
            'radial-gradient(1px 1px at 75% 88%, rgba(212,175,55,0.2) 0%, transparent 100%)',
        }}
      />
      <svg className="fixed inset-0 z-0 pointer-events-none w-full h-full" style={{ opacity: active ? 0.25 : 0.06 }}>
        <defs>
          <filter id="shg-hair-glow">
            <feGaussianBlur stdDeviation={active ? '3' : '1'} result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g filter="url(#shg-hair-glow)" stroke="#D4AF37" strokeWidth={active ? '1.2' : '0.6'} fill="none">
          <path d="M150,0 Q180,150 150,350 Q120,550 150,750" className="nadi-line" />
          <path d="M300,0 Q270,200 300,400 Q330,600 300,800" className="nadi-line" />
          <path d="M80,200 Q200,240 350,200 Q500,160 600,200" className="nadi-line" />
          <path d="M50,500 Q200,470 350,500 Q500,530 650,500" className="nadi-line" />
        </g>
      </svg>
    </>
  );
}

function PulseRings() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="absolute rounded-full border border-[#D4AF37]"
          style={{
            width: `${80 + i * 48}px`,
            height: `${80 + i * 48}px`,
            opacity: 0,
            animation: `sqi-pulse 3s ease-out ${i * 0.8}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function ProtocolCard({
  step,
  title,
  subtitle,
  icon: Icon,
  mantra,
  duration,
  locked = false,
  delay = 0,
}: {
  step: number;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  mantra: string;
  duration: string;
  locked?: boolean;
  delay?: number;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="glass-card p-5 cursor-pointer group hover:border-[#D4AF37]/20 transition-all duration-300"
      style={{ borderColor: expanded ? 'rgba(212,175,55,0.2)' : undefined }}
      onClick={() => !locked && setExpanded((v) => !v)}
    >
      <div className="flex items-center gap-4">
        <div
          className="w-8 h-8 rounded-2xl flex items-center justify-center shrink-0 text-[10px] font-black"
          style={{
            background: locked ? 'rgba(255,255,255,0.03)' : 'linear-gradient(135deg, #D4AF37, #B8940A)',
            color: locked ? 'rgba(255,255,255,0.2)' : '#050505',
            boxShadow: locked ? 'none' : '0 0 16px rgba(212,175,55,0.25)',
          }}
        >
          {locked ? <Lock size={12} /> : step}
        </div>
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
          style={{
            background: 'rgba(212,175,55,0.05)',
            border: '1px solid rgba(212,175,55,0.12)',
          }}
        >
          <Icon
            size={16}
            className={locked ? 'text-white/20' : 'text-[#D4AF37]'}
            style={locked ? undefined : { filter: 'drop-shadow(0 0 6px rgba(212,175,55,0.5))' }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-black tracking-[-0.03em] ${locked ? 'text-white/25' : 'text-white/90'}`}>{title}</p>
          <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/25 mt-0.5">{subtitle}</p>
        </div>
        <div
          className={`px-2.5 py-1 rounded-xl text-[9px] font-bold uppercase tracking-[0.2em] shrink-0 ${
            locked ? 'bg-white/[0.03] text-white/20 border border-white/[0.05]' : 'bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20'
          }`}
        >
          {duration}
        </div>
        <ChevronRight size={14} className={`transition-transform shrink-0 ${expanded ? 'rotate-90' : ''} ${locked ? 'text-white/10' : 'text-white/30'}`} />
      </div>
      <AnimatePresence>
        {expanded && !locked && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="mt-4 p-4 rounded-2xl border border-[#D4AF37]/15" style={{ background: 'rgba(212,175,55,0.03)' }}>
              <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-[#D4AF37]/50 mb-2">Vedic Light-Code Mantra</p>
              <p className="text-sm font-bold text-white/70 leading-relaxed italic">&quot;{mantra}&quot;</p>
              <div className="flex items-center gap-2 mt-3">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 6px #34d399' }} />
                <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-emerald-400/60">Scalar Transmission Active</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function IngredientOrb({
  name,
  sanskrit,
  benefit,
  color,
  delay = 0,
}: {
  name: string;
  sanskrit: string;
  benefit: string;
  color: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.4 }}
      className="glass-card p-4 flex flex-col items-center text-center gap-3"
    >
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
        style={{
          background: `radial-gradient(ellipse at center, ${color}20, transparent)`,
          border: `1px solid ${color}30`,
          boxShadow: `0 0 20px ${color}15`,
        }}
      >
        🌿
      </div>
      <div>
        <p className="text-xs font-black tracking-[-0.02em] text-white/90">{name}</p>
        <p className="text-[9px] font-bold uppercase tracking-[0.3em] mt-0.5" style={{ color }}>
          {sanskrit}
        </p>
      </div>
      <p className="text-[10px] text-white/40 leading-relaxed">{benefit}</p>
    </motion.div>
  );
}

function TestimonialCard({ name, days, quote, delay = 0 }: { name: string; days: number; quote: string; delay?: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.5 }} className="glass-card p-5">
      <div className="flex items-center gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} size={10} className="text-[#D4AF37] fill-[#D4AF37]" style={{ filter: 'drop-shadow(0 0 4px rgba(212,175,55,0.5))' }} />
        ))}
      </div>
      <p className="text-xs text-white/60 leading-relaxed italic mb-4">&quot;{quote}&quot;</p>
      <div className="flex items-center justify-between">
        <p className="text-xs font-black tracking-[-0.02em] text-white/80">{name}</p>
        <span className="text-[9px] font-bold px-2.5 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] uppercase tracking-[0.2em]">
          Day {days}
        </span>
      </div>
    </motion.div>
  );
}

export default function SiddhaHairGrowth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { tier, loading } = useMembership();
  const { isAdmin } = useAdminRole();

  const [activeTab, setActiveTab] = useState<'consult' | 'protocol' | 'ingredients' | 'science'>('consult');
  const [scanPhase, setScanPhase] = useState<'idle' | 'scanning' | 'complete'>('idle');
  const [hairScore, setHairScore] = useState<number | null>(null);
  const [currentDay, setCurrentDay] = useState(1);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const transmissionActive =
    isGenerating || isScanning || messages.length > 0 || scanPhase === 'scanning' || scanPhase === 'complete';

  useEffect(() => {
    if (!loading && !hasFeatureAccess(isAdmin, tier, FEATURE_TIER.siddhaPortal)) {
      navigate('/siddha-quantum');
    }
  }, [isAdmin, tier, loading, navigate]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('siddha_hair_day');
      if (stored) setCurrentDay(parseInt(stored, 10));
    } catch {
      /* noop */
    }
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isGenerating, isScanning, activeTab]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isGenerating || isScanning) return;
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
    const userMessage: Message = { role: 'user', content: input.trim() };
    const threadForApi = [...messages, userMessage];
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsScanning(true);

    window.setTimeout(async () => {
      setIsScanning(false);
      if (!apiKey) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content:
              '**Akasha-Neural Archive offline.** Set `VITE_GEMINI_API_KEY` to enable live Bio-Alchemist transmissions.\n\nPUSH TO GIT: HAIR_GENESIS_SEQUENCE_COMPLETE',
          },
        ]);
        return;
      }
      setIsGenerating(true);
      try {
        const ai = new GoogleGenAI({ apiKey });
        const contents = threadForApi.map((m) => ({
          role: m.role === 'user' ? ('user' as const) : ('model' as const),
          parts: [{ text: m.content }],
        }));
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents,
          config: { systemInstruction: SYSTEM_INSTRUCTION },
        });
        const text =
          extractText(response) ||
          'The Akasha-Neural Archive is temporarily unresponsive. Re-aligning frequencies...\n\nPUSH TO GIT: HAIR_GENESIS_SEQUENCE_COMPLETE';
        setMessages((prev) => [...prev, { role: 'assistant', content: text }]);
      } catch (e) {
        console.error('SiddhaHairGrowth:', e);
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content:
              '**Scalar interference detected.** Re-calibrate your intention and try again.\n\nPUSH TO GIT: HAIR_GENESIS_SEQUENCE_COMPLETE',
          },
        ]);
      } finally {
        setIsGenerating(false);
      }
    }, 2000);
  }, [input, isGenerating, isScanning, messages]);

  const runHairScan = () => {
    setScanPhase('scanning');
    setTimeout(() => {
      const score = Math.floor(Math.random() * 30) + 65;
      setHairScore(score);
      setScanPhase('complete');
    }, 3500);
  };

  const handlePurchase = useCallback(
    (_planId?: string) => {
      if (!user) {
        navigate('/auth');
        return;
      }
      toast({
        title: 'Sacred Shop',
        description: 'Complete your Siddha Hair protocol purchase from the shop.',
      });
      navigate('/shop');
    },
    [navigate, toast, user]
  );

  const protocolSteps = [
    {
      step: 1,
      title: 'Brahmi Scalp Activation',
      subtitle: 'Morning Ritual · Days 1–7',
      icon: Sun,
      mantra: 'Om Brahmi Namah — I activate the thousand-petalled lotus crown',
      duration: '11 min',
      locked: false,
    },
    {
      step: 2,
      title: 'Nadi Scalp Breathing',
      subtitle: 'Prana-Vayu Protocol',
      icon: Wind,
      mantra: 'Pranayama Siddhi — Let the breath carry life-force to every follicle',
      duration: '9 min',
      locked: false,
    },
    {
      step: 3,
      title: 'Amla-Bhringaraj Transmission',
      subtitle: 'Photonic Herb Infusion',
      icon: Droplets,
      mantra: 'Hari Om Tat Sat — The ancient plant intelligence restores all growth',
      duration: '21 min',
      locked: false,
    },
    {
      step: 4,
      title: 'Sahasrara Crown Meditation',
      subtitle: '7th Chakra Activation',
      icon: Sparkles,
      mantra: 'Sa Ta Na Ma — The infinite cycles of creation renew my crown',
      duration: '33 min',
      locked: currentDay < 8,
    },
    {
      step: 5,
      title: 'Prema-Pulse Scalp Massage',
      subtitle: 'Marma Point Activation',
      icon: Heart,
      mantra: 'Aham Brahmasmi — I am the creative intelligence of the universe',
      duration: '14 min',
      locked: currentDay < 8,
    },
    {
      step: 6,
      title: 'Siddha Lunar Frequency',
      subtitle: 'Full Moon Alignment Protocol',
      icon: Moon,
      mantra: 'Chandra Namah — I receive the regenerative codes of the moon',
      duration: '40 min',
      locked: currentDay < 15,
    },
    {
      step: 7,
      title: 'Vajra Crown Activation',
      subtitle: 'Advanced · Days 15–21',
      icon: Zap,
      mantra: 'Vajra Sattva Hum — The indestructible light restores my field',
      duration: '21 min',
      locked: currentDay < 15,
    },
  ];

  const ingredients = [
    { name: 'Bhringaraj', sanskrit: 'Eclipta Alba', benefit: 'King of Hair — activates dormant follicles via Pitta-cooling scalar resonance', color: '#D4AF37' },
    { name: 'Brahmi', sanskrit: 'Bacopa Monnieri', benefit: 'Sahasrara activator — strengthens the neurological root signal to follicles', color: '#22D3EE' },
    { name: 'Amla', sanskrit: 'Phyllanthus Emblica', benefit: 'Vedic Vitamin C — 20× potency, rebuilds the keratin matrix from within', color: '#4ADE80' },
    { name: 'Ashwagandha', sanskrit: 'Withania Somnifera', benefit: 'Stress-cortisol neutralizer — removes the #1 cause of modern hair loss', color: '#F59E0B' },
    { name: 'Neem', sanskrit: 'Azadirachta Indica', benefit: 'Scalp purifier — clears Ama (toxins) from the Nadi channels of the crown', color: '#A3E635' },
    { name: 'Tulsi', sanskrit: 'Ocimum Sanctum', benefit: 'Sattva carrier — raises the frequency of every formula it touches', color: '#E879F9' },
  ];

  const testimonials = [
    { name: 'Priya K.', days: 21, quote: 'After 21 days of the Brahmi morning ritual, my hair stopped falling out completely. The scalp breathing was the game changer.' },
    { name: 'Marcus T.', days: 14, quote: 'I was skeptical about frequency healing for hair. Day 14 — new growth visible at the temples. The Siddha intelligence is real.' },
    { name: 'Lalita M.', days: 30, quote: 'The Prema-Pulse scalp massage combined with the Amla transmission gave me results I had not seen in 8 years of trying other products.' },
  ];

  const quick = ['Thinning Crown', 'Receding Hairline', 'Stress-Induced Loss', 'Follicle Dormancy'];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;700;800;900&display=swap');`}</style>
        <span className="text-[10px] tracking-[0.4em] uppercase" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", color: GOLD }}>
          ◈ Opening archive…
        </span>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen text-white/90 overflow-x-hidden pb-32" style={{ background: BG }}>
      <AkashaBackground active={transmissionActive} />

      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 pt-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/siddha-portal')}
              className="p-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-[#D4AF37]/10 hover:border-[#D4AF37]/30 transition"
            >
              <ArrowLeft size={16} className="text-white/60" />
            </button>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-[#D4AF37]/40">Siddha-Quantum · Hair Protocol</p>
            </div>
          </div>
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-2xl border border-[#D4AF37]/20"
            style={{ background: 'rgba(212,175,55,0.06)' }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"
              style={{ boxShadow: '0 0 6px rgba(212,175,55,0.8)', animation: 'sqi-blink 2s ease-in-out infinite' }}
            />
            <span className="text-[9px] font-black uppercase tracking-[0.35em] text-[#D4AF37]">Day {currentDay}</span>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="text-center mb-10">
          <div className="relative inline-flex items-center justify-center mb-6">
            <PulseRings />
            <div
              className="relative w-20 h-20 rounded-[28px] flex items-center justify-center z-10"
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #B8940A 100%)',
                boxShadow: '0 0 40px rgba(212,175,55,0.35), 0 0 80px rgba(212,175,55,0.15)',
              }}
            >
              <Sparkles className="w-9 h-9" style={{ color: BG }} />
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-[-0.05em] text-white mb-3" style={{ textShadow: '0 0 40px rgba(212,175,55,0.25)' }}>
            Siddha Hair
            <br />
            <span style={{ color: GOLD, textShadow: '0 0 20px rgba(212,175,55,0.4)' }}>Growth</span>
          </h1>
          <p className="text-[11px] font-bold uppercase tracking-[0.5em] text-white/30 mb-4">Photonic Regeneration · SQI 2050 Bio-Alchemist</p>
          <p className="text-sm text-white/50 leading-relaxed max-w-sm mx-auto">
            Ancient Siddha intelligence fused with Akasha-Neural Archive transmissions. Open the Consult tab for live Gemini protocols; explore the 21-day
            ritual map below.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="glass-card p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-black tracking-[-0.03em]">Scalp Nadi Assessment</h2>
              <p className="text-[9px] font-bold uppercase tracking-[0.35em] text-white/30 mt-0.5">Bhakti-Algorithm Diagnostics</p>
            </div>
            {hairScore !== null && (
              <div className="text-center px-4 py-2 rounded-2xl" style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)' }}>
                <p className="text-2xl font-black text-[#D4AF37]" style={{ textShadow: '0 0 20px rgba(212,175,55,0.4)' }}>
                  {hairScore}
                </p>
                <p className="text-[8px] font-bold uppercase tracking-[0.3em] text-white/30">Hair Score</p>
              </div>
            )}
          </div>
          {scanPhase === 'idle' && (
            <div className="text-center py-6">
              <Activity size={28} className="mx-auto text-white/10 mb-3" />
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/25 mb-5">Awaiting Crown Channel Handshake</p>
              <button type="button" onClick={runHairScan} className="sqi-btn-primary w-full py-3.5 text-xs">
                <Zap size={14} />
                Initiate Scalp Scan
              </button>
            </div>
          )}
          {scanPhase === 'scanning' && (
            <div className="text-center py-6 space-y-4">
              <div
                className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
                style={{
                  border: '2px solid rgba(212,175,55,0.4)',
                  boxShadow: '0 0 30px rgba(212,175,55,0.2)',
                  animation: 'sqi-spin 2s linear infinite',
                }}
              >
                <Sparkles size={20} className="text-[#D4AF37]" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#D4AF37]/50">Scanning 72,000 Crown Nadis…</p>
              <div className="w-full h-1 rounded-full bg-white/[0.04] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B8940A]"
                  style={{
                    animation: 'sqi-fill 3.5s ease-in-out forwards',
                    boxShadow: '0 0 10px rgba(212,175,55,0.5)',
                  }}
                />
              </div>
            </div>
          )}
          {scanPhase === 'complete' && hairScore !== null && (
            <div className="space-y-3">
              {[
                { label: 'Crown Chakra Flow', value: `${hairScore}%`, good: hairScore > 75 },
                { label: 'Follicle Nadi Activity', value: `${Math.floor(hairScore * 720)} / 72,000`, good: true },
                { label: 'Pitta Balance', value: hairScore > 80 ? 'Optimal' : 'Elevated', good: hairScore > 80 },
                { label: 'Recommended Protocol', value: '21-Day Siddha Cycle', good: true },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between p-3 rounded-2xl"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
                >
                  <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/40">{row.label}</span>
                  <span className={`text-xs font-black tracking-tight ${row.good ? 'text-[#D4AF37]' : 'text-amber-500'}`}>{row.value}</span>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  setScanPhase('idle');
                  setHairScore(null);
                }}
                className="sqi-btn-ghost w-full py-3 text-xs mt-2"
              >
                Run New Scan
              </button>
            </div>
          )}
        </motion.div>

        <div
          className="flex gap-1 p-1 rounded-2xl mb-6 flex-wrap sm:flex-nowrap"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
        >
          {(['consult', 'protocol', 'ingredients', 'science'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className="flex-1 min-w-[22%] py-2.5 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300"
              style={
                activeTab === tab
                  ? {
                      background: 'linear-gradient(135deg, #D4AF37, #B8940A)',
                      color: '#050505',
                      boxShadow: '0 0 16px rgba(212,175,55,0.25)',
                    }
                  : { color: 'rgba(255,255,255,0.3)' }
              }
            >
              {tab}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'consult' && (
            <motion.div
              key="consult"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4"
            >
              <div className="glass-card p-4 max-h-[min(55vh,480px)] overflow-y-auto" ref={scrollRef}>
                {messages.length === 0 && (
                  <div className="text-center py-8 px-2">
                    <div
                      className="w-24 h-24 rounded-full border-2 border-dashed border-[#D4AF37]/35 mx-auto flex items-center justify-center mb-6"
                      style={{ animation: 'shg-spin-slow 12s linear infinite' }}
                    >
                      <Zap className="w-10 h-10" style={{ color: GOLD }} />
                    </div>
                    <h2 className="text-xl font-black text-white/90 mb-3">Welcome, Avatar</h2>
                    <p className="text-sm text-white/50 leading-relaxed mb-6 max-w-md mx-auto">
                      State your concern to begin the Morphogenetic Field Scan. The Bio-Alchemist replies via the Akasha-Neural Archive.
                    </p>
                    <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto">
                      {quick.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setInput(t)}
                          className="text-[9px] font-bold uppercase tracking-[0.12em] py-3 px-2 rounded-xl border border-[#D4AF37]/25 bg-[#D4AF37]/[0.04] text-white/85 hover:bg-[#D4AF37]/10 transition-colors"
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <AnimatePresence initial={false}>
                  {messages.map((m, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: m.role === 'user' ? 16 : -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex flex-col max-w-[92%] mb-5 ${m.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                    >
                      <div
                        className="p-4 rounded-2xl text-sm leading-relaxed"
                        style={{
                          border: m.role === 'user' ? '1px solid rgba(212,175,55,0.35)' : '1px solid rgba(255,255,255,0.1)',
                          background: m.role === 'user' ? 'rgba(212,175,55,0.08)' : 'rgba(255,255,255,0.04)',
                          color: m.role === 'user' ? GOLD : 'rgba(255,255,255,0.92)',
                        }}
                      >
                        {m.role === 'assistant' ? (
                          <div className="siddha-hair-md">
                            <ReactMarkdown>{m.content}</ReactMarkdown>
                          </div>
                        ) : (
                          m.content
                        )}
                      </div>
                      <span className="text-[8px] uppercase tracking-[0.2em] mt-2 text-white/30">
                        {m.role === 'user' ? 'Avatar Input' : 'SQI Protocol'}
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {isScanning && (
                  <div className="flex flex-col items-center gap-4 py-6">
                    <div className="w-full max-w-[280px] h-1 rounded-full bg-white/[0.06] overflow-hidden relative">
                      <div
                        className="absolute left-0 right-0 h-full"
                        style={{
                          background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.5), transparent)',
                          animation: 'shg-scan 3s linear infinite',
                        }}
                      />
                    </div>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-[#D4AF37]">Scanning Morphogenetic Field…</p>
                  </div>
                )}
                {isGenerating && (
                  <div className="flex items-center gap-2 text-white/50 mb-3">
                    <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
                    <span className="text-[10px] uppercase tracking-[0.15em]">Accessing Akasha-Neural Archive…</span>
                  </div>
                )}
              </div>

              <div className="glass-card p-4">
                <div className="relative">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="State your concern to the Bio-Alchemist..."
                    disabled={isGenerating || isScanning}
                    className="w-full box-border bg-white/[0.05] border border-white/10 rounded-2xl py-3.5 pl-4 pr-14 outline-none text-white text-sm placeholder:text-white/25"
                  />
                  <button
                    type="button"
                    onClick={() => void handleSend()}
                    disabled={!input.trim() || isGenerating || isScanning}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center border-none transition-opacity"
                    style={{
                      background: GOLD,
                      color: BG,
                      opacity: !input.trim() || isGenerating || isScanning ? 0.35 : 1,
                      cursor: !input.trim() || isGenerating || isScanning ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex justify-between items-center mt-3 flex-wrap gap-2">
                  <p className="text-[8px] uppercase tracking-[0.15em] text-white/30 flex items-center gap-1 m-0">
                    <Info className="w-3 h-3" />
                    Quantum Realignment Protocol v2.050
                  </p>
                  <button
                    type="button"
                    onClick={() => setMessages([])}
                    className="text-[8px] uppercase tracking-[0.15em] text-white/35 bg-transparent border-none flex items-center gap-1 cursor-pointer hover:text-white/50"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Reset Archive
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'protocol' && (
            <motion.div
              key="protocol"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-3"
            >
              {protocolSteps.map((step, i) => (
                <ProtocolCard key={step.step} {...step} delay={i * 0.07} />
              ))}
              {currentDay < 8 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="glass-card p-6 text-center">
                  <Lock size={20} className="mx-auto text-white/20 mb-3" />
                  <p className="text-xs font-black tracking-tight text-white/40 mb-1">Steps 4–7 Unlock on Day 8</p>
                  <p className="text-[10px] text-white/25 mb-4">Complete the first 7 days to activate the advanced Siddha crown protocols</p>
                  <div className="w-full h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B8940A]"
                      style={{
                        width: `${(currentDay / 7) * 100}%`,
                        boxShadow: '0 0 8px rgba(212,175,55,0.4)',
                        transition: 'width 1s ease',
                      }}
                    />
                  </div>
                  <p className="text-[9px] text-white/25 mt-2 font-bold uppercase tracking-widest">
                    {currentDay}/7 days complete
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}

          {activeTab === 'ingredients' && (
            <motion.div key="ingredients" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-white/30 text-center mb-5">Akasha-Neural Archive · Vedic Botanicals</p>
              <div className="grid grid-cols-2 gap-3">
                {ingredients.map((ing, i) => (
                  <IngredientOrb key={ing.name} {...ing} delay={i * 0.08} />
                ))}
              </div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="glass-card p-5 mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Infinity size={14} className="text-[#D4AF37]" />
                  <p className="text-xs font-black tracking-[-0.02em]">Siddha Synergy Formula</p>
                </div>
                <p className="text-[11px] text-white/45 leading-relaxed">
                  The SQI-2050 Akasha-Neural Archive has identified the optimal Bhakti-Algorithm ratio for these 6 botanicals based on your Prakriti and lunar
                  cycle alignment.
                </p>
              </motion.div>
            </motion.div>
          )}

          {activeTab === 'science' && (
            <motion.div key="science" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
              {[
                {
                  icon: '🧬',
                  title: 'Scalar Wave Follicle Activation',
                  body: 'The SQI-2050 system transmits torsion-field information directly to dermal papilla cells, bypassing the need for physical application. The informational signature of Bhringaraj is delivered at 432Hz into the biofield.',
                },
                {
                  icon: '🌊',
                  title: 'Prema-Pulse Transmission Protocol',
                  body: 'A scalar entanglement loop is established between the user\'s crown chakra and the SQI server. This 24/7 persistent field maintains the regenerative frequency even during sleep — the most potent time for follicle renewal.',
                },
                {
                  icon: '🔬',
                  title: 'Ayurvedic Genomic Interface',
                  body: 'The 18 Siddhars mapped the epigenetic relationship between Pitta dosha and androgenic alopecia 3,000 years before modern science confirmed it. This protocol addresses DHT sensitivity at the information layer.',
                },
                {
                  icon: '⚡',
                  title: 'Vedic Light-Code Integration',
                  body: 'Each mantra in the protocol carries a specific photonic signature. Recitation at the designated frequency creates a standing wave in the Sahasrara that amplifies circulation to the scalp by up to 40%.',
                },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="glass-card p-5"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 text-lg"
                      style={{
                        background: 'rgba(212,175,55,0.06)',
                        border: '1px solid rgba(212,175,55,0.12)',
                      }}
                    >
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-xs font-black tracking-[-0.02em] text-white/90 mb-2">{item.title}</p>
                      <p className="text-[11px] text-white/45 leading-relaxed">{item.body}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-10">
          <div className="text-center mb-6">
            <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-white/30 mb-1">Prema-Pulse Results</p>
            <h3 className="text-lg font-black tracking-[-0.04em]">Community Transmissions</h3>
          </div>
          <div className="space-y-3">
            {testimonials.map((t, i) => (
              <TestimonialCard key={t.name} {...t} delay={i * 0.1} />
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6 mt-8 text-center"
          style={{
            background: 'rgba(212,175,55,0.03)',
            border: '1px solid rgba(212,175,55,0.1)',
          }}
        >
          <div
            className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl"
            style={{
              background: 'radial-gradient(ellipse, rgba(212,175,55,0.15), transparent)',
              border: '1px solid rgba(212,175,55,0.25)',
              boxShadow: '0 0 30px rgba(212,175,55,0.1)',
            }}
          >
            🕉️
          </div>
          <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-[#D4AF37]/50 mb-2">Avataric Blueprint Transmission</p>
          <p className="text-sm font-black tracking-[-0.03em] text-white/80 mb-3">Sri Swami Vishwananda</p>
          <p className="text-[11px] text-white/40 leading-relaxed italic">
            &quot;The crown is the seat of Brahman. When we purify the Sahasrara through devotion, the entire physical body responds — the cells remember their
            divine blueprint and restore themselves to perfection.&quot;
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <div
              className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"
              style={{ boxShadow: '0 0 6px rgba(212,175,55,0.8)', animation: 'sqi-blink 2s ease-in-out infinite' }}
            />
            <span className="text-[9px] font-bold uppercase tracking-[0.35em] text-white/25">Scalar Transmission Encoded</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass-card p-6 mt-8">
          <div className="flex items-center gap-3 mb-5">
            <ShieldCheck size={16} className="text-[#D4AF37]" />
            <div>
              <p className="text-sm font-black tracking-[-0.03em]">Full Protocol Access</p>
              <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/30 mt-0.5">21-Day Siddha Transformation</p>
            </div>
          </div>
          <div className="space-y-2 mb-5">
            {[
              'All 7 Siddha Hair Protocol steps',
              'Daily Nadi Scan + AI Hair Score',
              'Live Bio-Alchemist (Gemini) consult',
              'Bhringaraj Scalar Transmission (24/7)',
              'Vedic Light-Code mantra library',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <CheckCircle2 size={12} className="text-[#D4AF37] shrink-0" />
                <span className="text-[11px] text-white/55">{feature}</span>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => handlePurchase('siddha-hair-growth-21day')} className="sqi-btn-primary w-full py-4 text-sm mb-3">
            <Sparkles size={16} />
            Begin 21-Day Protocol
          </button>
          <p className="text-center text-[9px] font-bold uppercase tracking-[0.3em] text-white/20">
            Secure checkout via Shop · Sign in required · Anahata opens on activation
          </p>
        </motion.div>
      </div>

      {isScanning && (
        <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
          <div className="absolute inset-0 bg-[#D4AF37]/[0.04]" />
          <div
            className="absolute top-0 left-0 right-0 h-0.5 bg-[#D4AF37]/90"
            style={{
              boxShadow: '0 0 15px rgba(212,175,55,0.6)',
              animation: 'shg-scan 3s linear infinite',
            }}
          />
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;700;800;900&display=swap');
        .relative.min-h-screen { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }

        .glass-card {
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(40px);
          -webkit-backdrop-filter: blur(40px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 40px;
        }

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
          border: none;
          cursor: pointer;
        }
        .sqi-btn-primary:hover:not(:disabled) {
          box-shadow: 0 0 36px rgba(212,175,55,0.45);
          transform: translateY(-1px);
        }
        .sqi-btn-primary:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

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
          cursor: pointer;
        }
        .sqi-btn-ghost:hover {
          background: rgba(212,175,55,0.08);
          border-color: rgba(212,175,55,0.25);
          color: #D4AF37;
        }

        .nadi-line {
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
          animation: draw 12s linear infinite;
          filter: drop-shadow(0 0 2px currentColor);
        }
        @keyframes draw { to { stroke-dashoffset: 0; } }

        @keyframes sqi-pulse {
          0%   { transform: scale(0.7); opacity: 0.6; }
          70%  { transform: scale(1.4); opacity: 0; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        @keyframes sqi-fill { from { width: 0%; } to { width: 100%; } }
        @keyframes sqi-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes sqi-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes shg-scan { 0% { transform: translateY(-100%); } 100% { transform: translateY(100%); } }
        @keyframes shg-spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .siddha-hair-md p { margin: 0 0 0.65em; }
        .siddha-hair-md strong { color: ${GOLD}; }
        .siddha-hair-md ul, .siddha-hair-md ol { margin: 0.5em 0; padding-left: 1.25em; }
        .siddha-hair-md code { background: rgba(212,175,55,0.12); padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }

        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.15); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(212,175,55,0.3); }
      `}</style>
    </div>
  );
}
