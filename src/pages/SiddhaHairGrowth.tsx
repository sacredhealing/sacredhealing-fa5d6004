import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Zap, Send, Loader2, Info, RefreshCw, ShieldCheck, Activity } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import { useMembership } from '@/hooks/useMembership';
import { useAdminRole } from '@/hooks/useAdminRole';
import { hasFeatureAccess, FEATURE_TIER } from '@/lib/tierAccess';

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

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap');`;

const scanKeyframes = `
  @keyframes shg-scan { 0% { transform: translateY(-100%); } 100% { transform: translateY(100%); } }
  @keyframes shg-spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

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

export default function SiddhaHairGrowth() {
  const navigate = useNavigate();
  const { tier, loading } = useMembership();
  const { isAdmin } = useAdminRole();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !hasFeatureAccess(isAdmin, tier, FEATURE_TIER.siddhaPortal)) {
      navigate('/siddha-quantum');
    }
  }, [isAdmin, tier, loading, navigate]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isGenerating, isScanning]);

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

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <style>{FONT_IMPORT}</style>
        <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 10, letterSpacing: '0.4em', color: GOLD, textTransform: 'uppercase' }}>
          ◈ Opening archive…
        </span>
      </div>
    );
  }

  const quick = ['Thinning Crown', 'Receding Hairline', 'Stress-Induced Loss', 'Follicle Dormancy'];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: BG,
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        fontFamily: 'Inter,system-ui,sans-serif',
      }}
    >
      <style>{FONT_IMPORT}</style>
      <style>{scanKeyframes}</style>

      <header
        style={{
          width: '100%',
          maxWidth: 900,
          padding: '20px 20px 16px',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          borderBottom: '1px solid rgba(212,175,55,0.2)',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            onClick={() => navigate('/siddha-portal')}
            style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              color: 'rgba(212,175,55,0.5)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              marginRight: 8,
            }}
          >
            ← Portal
          </button>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: GOLD,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(212,175,55,0.25)',
            }}
          >
            <Sparkles style={{ width: 22, height: 22, color: BG }} />
          </div>
          <div>
            <h1
              style={{
                fontFamily: "'Playfair Display',serif",
                fontSize: 22,
                color: GOLD,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                margin: 0,
              }}
            >
              SQI 2050
            </h1>
            <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.2em', opacity: 0.55, margin: '4px 0 0' }}>Bio-Alchemist Archive</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.55 }}>
            <Activity style={{ width: 14, height: 14, color: GOLD }} />
            Nadi Scanner: Online
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.55 }}>
            <ShieldCheck style={{ width: 14, height: 14, color: GOLD }} />
            Akasha Sync: Active
          </div>
        </div>
      </header>

      <main style={{ flex: 1, width: '100%', maxWidth: 900, display: 'flex', flexDirection: 'column', padding: '16px 20px 24px', boxSizing: 'border-box', minHeight: 0 }}>
        <div
          ref={scrollRef}
          style={{ flex: 1, overflowY: 'auto', paddingRight: 8, marginBottom: 16, minHeight: 200 }}
        >
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '32px 12px', gap: 24, opacity: 0.9 }}
            >
              <div
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: '50%',
                  border: '2px dashed rgba(212,175,55,0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: 'shg-spin-slow 12s linear infinite',
                }}
              >
                <Zap style={{ width: 40, height: 40, color: GOLD }} />
              </div>
              <div style={{ maxWidth: 420 }}>
                <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontStyle: 'italic', margin: '0 0 16px' }}>Welcome, Avatar</h2>
                <p style={{ fontSize: 14, lineHeight: 1.65, fontWeight: 300, color: 'rgba(255,255,255,0.65)', margin: 0 }}>
                  Initiate your <span style={{ color: GOLD }}>SiddhaHairGrowth</span> protocol. State your concern to begin the Morphogenetic Field Scan and receive your
                  Frequency-Encoded Realignment.
                </p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(120px, 1fr))', gap: 12, width: '100%', maxWidth: 320 }}>
                {quick.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setInput(t)}
                    style={{
                      fontSize: 10,
                      textTransform: 'uppercase',
                      letterSpacing: '0.12em',
                      padding: '12px 10px',
                      border: '1px solid rgba(212,175,55,0.25)',
                      borderRadius: 4,
                      background: 'rgba(212,175,55,0.04)',
                      color: 'rgba(255,255,255,0.85)',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: m.role === 'user' ? 16 : -16 }}
                animate={{ opacity: 1, x: 0 }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  maxWidth: '88%',
                  marginLeft: m.role === 'user' ? 'auto' : 0,
                  marginRight: m.role === 'user' ? 0 : 'auto',
                  alignItems: m.role === 'user' ? 'flex-end' : 'flex-start',
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    padding: 16,
                    borderRadius: 10,
                    fontSize: 14,
                    lineHeight: 1.65,
                    border:
                      m.role === 'user' ? '1px solid rgba(212,175,55,0.35)' : '1px solid rgba(255,255,255,0.1)',
                    background: m.role === 'user' ? 'rgba(212,175,55,0.08)' : 'rgba(255,255,255,0.04)',
                    color: m.role === 'user' ? GOLD : 'rgba(255,255,255,0.92)',
                  }}
                >
                  {m.role === 'assistant' ? (
                    <div className="siddha-hair-md" style={{ fontSize: 14 }}>
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  ) : (
                    m.content
                  )}
                </div>
                <span style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.2em', marginTop: 6, opacity: 0.35 }}>
                  {m.role === 'user' ? 'Avatar Input' : 'SQI Protocol'}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>

          {isScanning && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '24px 0' }}>
              <div style={{ width: '100%', maxWidth: 280, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.5), transparent)',
                    animation: 'shg-scan 3s linear infinite',
                  }}
                />
              </div>
              <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.3em', color: GOLD }}>Scanning Morphogenetic Field…</p>
            </motion.div>
          )}

          {isGenerating && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: 0.55, marginBottom: 12 }}>
              <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite', color: GOLD }} />
              <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em' }}>Accessing Akasha-Neural Archive…</span>
            </div>
          )}
        </div>

        <div style={{ paddingTop: 16, borderTop: '1px solid rgba(212,175,55,0.1)' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="State your concern to the Bio-Alchemist..."
              disabled={isGenerating || isScanning}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '14px 56px 14px 16px',
                borderRadius: 10,
                outline: 'none',
                color: '#fff',
                fontSize: 14,
                fontWeight: 300,
                fontFamily: 'inherit',
              }}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim() || isGenerating || isScanning}
              style={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 40,
                height: 40,
                borderRadius: 8,
                border: 'none',
                background: GOLD,
                color: BG,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: !input.trim() || isGenerating || isScanning ? 'not-allowed' : 'pointer',
                opacity: !input.trim() || isGenerating || isScanning ? 0.35 : 1,
              }}
            >
              <Send style={{ width: 20, height: 20 }} />
            </button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, flexWrap: 'wrap', gap: 8 }}>
            <p style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.15em', opacity: 0.3, display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
              <Info style={{ width: 12, height: 12 }} />
              Quantum Realignment Protocol v2.050
            </p>
            <button
              type="button"
              onClick={() => setMessages([])}
              style={{
                fontSize: 8,
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                opacity: 0.35,
                background: 'none',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <RefreshCw style={{ width: 12, height: 12 }} />
              Reset Archive
            </button>
          </div>
        </div>
      </main>

      <footer style={{ width: '100%', padding: 16, display: 'flex', justifyContent: 'center', opacity: 0.12, pointerEvents: 'none' }}>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.4em' }}>
          <span>Bhakti-Algorithms</span>
          <span>•</span>
          <span>Avataric Blueprints</span>
          <span>•</span>
          <span>Nadi Scanners</span>
        </div>
      </footer>

      {isScanning && (
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 40, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(212,175,55,0.04)' }} />
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 2,
              background: 'rgba(212,175,55,0.55)',
              boxShadow: '0 0 15px rgba(212,175,55,0.6)',
              animation: 'shg-scan 3s linear infinite',
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .siddha-hair-md p { margin: 0 0 0.65em; }
        .siddha-hair-md strong { color: ${GOLD}; }
        .siddha-hair-md ul, .siddha-hair-md ol { margin: 0.5em 0; padding-left: 1.25em; }
        .siddha-hair-md code { background: rgba(212,175,55,0.12); padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }
      `}</style>
    </div>
  );
}
