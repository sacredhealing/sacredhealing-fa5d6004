import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Sparkles, Loader2, Clock, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { AyurvedaUserProfile, DoshaProfile } from '@/lib/ayurvedaTypes';
import { useTranslation } from '@/hooks/useTranslation';
import { useChatMessages, type ChatMessage } from '@/hooks/useChatMessages';
import { AyurvedaLexicon } from './AyurvedaLexicon';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ayurveda-chat`;

interface AyurvedaChatConsultationProps {
  profile: AyurvedaUserProfile | null;
  dosha: DoshaProfile | null;
  onClose?: () => void;
}

// ── Sri Yantra SVG ──────────────────────────────────────────────────────────
const SriYantra: React.FC<{ size?: number }> = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 54 54" fill="none">
    <polygon points="27,3 51,45 3,45" stroke="rgba(212,175,55,0.9)" strokeWidth="1.3" fill="none"/>
    <polygon points="27,51 3,9 51,9" stroke="rgba(212,175,55,0.68)" strokeWidth="1.3" fill="none"/>
    <polygon points="27,10 45,41 9,41" stroke="rgba(212,175,55,0.4)" strokeWidth="1" fill="none"/>
    <polygon points="27,44 9,13 45,13" stroke="rgba(212,175,55,0.26)" strokeWidth="1" fill="none"/>
    <circle cx="27" cy="27" r="3.5" fill="rgba(212,175,55,0.95)"/>
  </svg>
);

// ── Response formatter ──────────────────────────────────────────────────────
// Renders Agastya's streaming text into rich blocks:
// Devanagari → gold mantra card · "Scalar Transmission:" → cyan scalar block
// Last short paragraph → italic gold seal · everything else → Cormorant prose
const FormatAgastya: React.FC<{ text: string }> = ({ text }) => {
  const paras = text.split(/\n\n+/).filter(p => p.trim());
  return (
    <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
      {paras.map((para, pi) => {
        const l = para.trim().replace(/\*\*/g, '');
        if (!l) return null;

        // Scalar transmission block
        if (l.startsWith('Scalar Transmission:') || l.startsWith('Scalar Wave')) {
          const txt = l.replace(/^Scalar (Wave )?Transmission:?\s*/i, '').trim();
          return (
            <div key={pi} style={{
              marginTop: 16, padding: '12px 16px',
              background: 'linear-gradient(135deg, rgba(34,211,238,0.06), rgba(212,175,55,0.03))',
              border: '1px solid rgba(34,211,238,0.22)',
              borderRadius: 12, position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 1,
                background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.45), transparent)',
              }}/>
              <div style={{
                fontSize: 8, fontWeight: 800, letterSpacing: '0.38em', textTransform: 'uppercase',
                color: 'rgba(34,211,238,0.55)', marginBottom: 5,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}>≈ Scalar Transmission</div>
              <div style={{
                fontSize: 12.5, color: 'rgba(34,211,238,0.78)', lineHeight: 1.65,
                fontFamily: "'Plus Jakarta Sans', sans-serif", fontStyle: 'normal',
              }}>{txt}</div>
            </div>
          );
        }

        // Mantra / Devanagari block
        if (/[\u0900-\u097F\u0B80-\u0BFF]/.test(l)) {
          return (
            <div key={pi} style={{
              margin: '16px 0', padding: '14px 18px',
              background: 'rgba(212,175,55,0.055)',
              borderLeft: '2.5px solid rgba(212,175,55,0.52)',
              borderRadius: '0 12px 12px 0',
            }}>
              {l.split('\n').map((line, i) => {
                const t2 = line.trim();
                if (!t2) return null;
                const isDevan = /[\u0900-\u097F\u0B80-\u0BFF]/.test(t2);
                return (
                  <div key={i} style={{
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontSize: isDevan ? 21 : 13.5,
                    fontStyle: isDevan ? 'normal' : 'italic',
                    color: isDevan ? '#D4AF37' : 'rgba(212,175,55,0.68)',
                    lineHeight: 1.65,
                    marginBottom: i < l.split('\n').length - 1 ? 5 : 0,
                  }}>{t2}</div>
                );
              })}
            </div>
          );
        }

        // Seal — last paragraph, short, single line
        const isLast = pi === paras.filter(p => p.trim()).length - 1;
        if (isLast && l.length < 220 && !l.includes('\n')) {
          return (
            <div key={pi} style={{
              marginTop: 18, paddingTop: 14,
              borderTop: '1px solid rgba(212,175,55,0.12)',
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 15, fontStyle: 'italic',
              color: 'rgba(212,175,55,0.55)', lineHeight: 1.7,
            }}>{l.replace(/\*/g, '')}</div>
          );
        }

        // Regular paragraph
        return (
          <div key={pi} style={{
            marginBottom: 13,
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: 15.5, lineHeight: 1.9,
            color: 'rgba(255,255,255,0.86)',
          }}>
            {l.split('\n').map((line, i) => {
              const t2 = line.trim().replace(/\*\*/g, '').replace(/\*([^*]+)\*/g, '$1');
              if (!t2) return null;
              return <span key={i}>{i > 0 && <br />}{t2}</span>;
            })}
          </div>
        );
      })}
    </div>
  );
};

// ── Nadi Pulse (typing indicator) ──────────────────────────────────────────
const NadiPulse = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6,
    padding: '14px 20px', borderRadius: '5px 18px 18px 18px',
    background: 'rgba(8,4,2,0.98)', border: '1px solid rgba(212,175,55,0.09)',
    width: 'fit-content' }}>
    {[0, 0.22, 0.44].map((d, i) => (
      <div key={i} style={{
        width: 7, height: 7, borderRadius: '50%',
        background: 'rgba(212,175,55,0.52)',
        animation: `sqiDot 1.2s ease-in-out ${d}s infinite`,
      }}/>
    ))}
  </div>
);

// ── Suggestion list ─────────────────────────────────────────────────────────
const SUGGESTIONS = [
  { icon: '🌿', text: 'How is my energy field — I feel stressed and have low energy' },
  { icon: '🔥', text: 'I have bloating, gas and very irregular digestion' },
  { icon: '🌙', text: 'My mind races at night and I cannot sleep deeply' },
  { icon: '⚡', text: 'I am exhausted even when I sleep 8 hours' },
  { icon: '✨', text: 'I have skin inflammation, rashes and acne' },
  { icon: '🌊', text: 'I feel heavy, unmotivated and depressed' },
  { icon: '🦴', text: 'I have chronic lower back pain and stiff joints' },
];

// ── STYLES ──────────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
  .sqi-chat-portal {
    --g: #D4AF37; --g08: rgba(212,175,55,0.08); --g18: rgba(212,175,55,0.18);
    --g36: rgba(212,175,55,0.36); --g55: rgba(212,175,55,0.55);
    position: fixed !important; inset: 0 !important;
    z-index: 999999 !important; display: flex !important;
    align-items: stretch !important; justify-content: center !important;
    padding: 14px; font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .sqi-chat-backdrop {
    position: absolute; inset: 0;
    background: rgba(3,2,1,0.9); backdrop-filter: blur(22px);
    -webkit-backdrop-filter: blur(22px);
  }
  .sqi-chat-panel {
    position: relative; width: min(100%, 560px);
    height: calc(100dvh - 28px); max-height: calc(100dvh - 28px);
    display: flex; flex-direction: column; overflow: hidden;
    border-radius: 26px;
    border: 1px solid rgba(212,175,55,0.28);
    background: linear-gradient(180deg, #0E0A06 0%, #080503 100%);
    box-shadow: 0 30px 90px rgba(212,175,55,0.07), inset 0 1px 0 rgba(212,175,55,0.2);
  }
  .sqi-topbar {
    height: 2px; flex-shrink: 0;
    background: linear-gradient(90deg, transparent, var(--g), transparent);
    opacity: 0.8;
  }
  .sqi-hdr {
    padding: 14px 18px 12px; display: flex; align-items: center; gap: 12px;
    border-bottom: 1px solid rgba(212,175,55,0.12);
    background: linear-gradient(180deg, rgba(212,175,55,0.055), transparent);
    flex-shrink: 0;
  }
  .sqi-av {
    width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0;
    background: radial-gradient(circle at 38% 36%, rgba(212,175,55,0.22), rgba(212,175,55,0.04) 60%, transparent);
    border: 1.5px solid rgba(212,175,55,0.44);
    display: flex; align-items: center; justify-content: center;
    animation: sqiGlow 4s ease-in-out infinite;
  }
  .sqi-name {
    font-family: 'Cormorant Garamond', serif; font-size: 18px;
    font-weight: 700; color: var(--g); line-height: 1.1;
  }
  .sqi-sub {
    font-size: 7px; font-weight: 800; letter-spacing: 0.3em;
    text-transform: uppercase; color: rgba(212,175,55,0.36); margin-top: 2px;
  }
  .sqi-live {
    display: flex; align-items: center; gap: 5px; padding: 4px 10px;
    border-radius: 999px; background: rgba(52,211,153,0.07);
    border: 1px solid rgba(52,211,153,0.22);
    font-size: 7px; font-weight: 800; letter-spacing: 0.3em;
    text-transform: uppercase; color: #4ade80;
  }
  .sqi-ldot {
    width: 5px; height: 5px; border-radius: 50%; background: #4ade80;
    animation: sqiBlink 1.6s ease-in-out infinite;
  }
  .sqi-ibtn {
    width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0;
    border: 1px solid rgba(212,175,55,0.18); background: transparent;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: rgba(212,175,55,0.48); transition: 0.2s;
  }
  .sqi-ibtn:hover { color: var(--g); border-color: rgba(212,175,55,0.42); background: rgba(212,175,55,0.07); }
  .sqi-close {
    width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0;
    border: 1px solid rgba(255,255,255,0.1); background: transparent;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: rgba(255,255,255,0.3); transition: 0.2s;
  }
  .sqi-close:hover { color: var(--g); border-color: rgba(212,175,55,0.35); }
  .sqi-jy-bar {
    padding: 5px 18px; background: rgba(212,175,55,0.04);
    border-bottom: 1px solid rgba(212,175,55,0.09);
    display: flex; align-items: center; gap: 7px; flex-shrink: 0;
  }
  .sqi-jy-txt {
    font-size: 8px; font-weight: 800; letter-spacing: 0.2em;
    text-transform: uppercase; color: rgba(212,175,55,0.5);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .sqi-msgs {
    flex: 1; min-height: 0; overflow-y: auto;
    padding: 22px 16px 18px; display: flex; flex-direction: column; gap: 18px;
    scrollbar-width: thin; scrollbar-color: rgba(212,175,55,0.1) transparent;
  }
  .sqi-msgs::-webkit-scrollbar { width: 3px; }
  .sqi-msgs::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.12); border-radius: 3px; }
  .sqi-welcome { text-align: center; padding: 10px 8px 16px; }
  .sqi-av-big {
    width: 86px; height: 86px; border-radius: 50%; margin: 0 auto 20px;
    background: radial-gradient(circle at 38% 36%, rgba(212,175,55,0.2), rgba(212,175,55,0.04) 60%, transparent);
    border: 1.5px solid rgba(212,175,55,0.42);
    display: flex; align-items: center; justify-content: center;
    animation: sqiGlow 4.5s ease-in-out infinite;
  }
  .sqi-wtitle {
    font-family: 'Cormorant Garamond', serif; font-size: 26px; font-weight: 700;
    color: var(--g); margin-bottom: 10px; line-height: 1.1;
  }
  .sqi-wlore {
    font-family: 'Cormorant Garamond', serif; font-size: 15px; font-style: italic;
    color: rgba(255,255,255,0.52); line-height: 1.76;
    max-width: 380px; margin: 0 auto 8px;
  }
  .sqi-wsub {
    font-size: 12px; color: rgba(255,255,255,0.28); line-height: 1.65;
    max-width: 340px; margin: 0 auto 18px;
  }
  .sqi-om {
    display: flex; align-items: center; gap: 12px;
    margin: 0 auto 16px; max-width: 400px;
    color: rgba(212,175,55,0.28); font-family: 'Cormorant Garamond', serif; font-size: 11px;
  }
  .sqi-om::before, .sqi-om::after {
    content: ''; flex: 1; height: 1px; background: rgba(212,175,55,0.1);
  }
  .sqi-sugg-lbl {
    font-size: 7.5px; font-weight: 800; letter-spacing: 0.42em;
    text-transform: uppercase; color: rgba(212,175,55,0.24); margin-bottom: 12px;
  }
  .sqi-sugg { display: flex; flex-direction: column; gap: 7px; max-width: 460px; margin: 0 auto; }
  .sqi-sug {
    width: 100%; padding: 11px 16px; border-radius: 14px;
    background: rgba(212,175,55,0.04); border: 1px solid rgba(212,175,55,0.12);
    color: rgba(212,175,55,0.7); font-size: 13px; font-weight: 500;
    text-align: left; cursor: pointer; font-family: inherit;
    display: flex; align-items: center; gap: 12px; line-height: 1.4; transition: 0.2s;
  }
  .sqi-sug:hover { background: rgba(212,175,55,0.09); border-color: rgba(212,175,55,0.3); color: rgba(212,175,55,0.92); transform: translateX(3px); }
  .sqi-mrow { display: flex; flex-direction: column; }
  .sqi-mrow.user { align-items: flex-end; }
  .sqi-mrow.agent { align-items: flex-start; }
  .sqi-mrole {
    font-size: 7.5px; font-weight: 800; letter-spacing: 0.3em;
    text-transform: uppercase; color: rgba(212,175,55,0.32);
    margin-bottom: 6px; padding: 0 4px;
  }
  .sqi-bbl {
    padding: 14px 20px; border-radius: 20px;
  }
  .sqi-bbl.user {
    max-width: 76%; border-radius: 20px 20px 5px 20px;
    background: rgba(212,175,55,0.1); border: 1px solid rgba(212,175,55,0.22);
    font-size: 14px; color: rgba(255,255,255,0.88); line-height: 1.7;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .sqi-bbl.agent {
    width: 100%; border-radius: 5px 20px 20px 20px;
    background: rgba(8,4,2,0.98); border: 1px solid rgba(212,175,55,0.09);
  }
  .sqi-cpbtn {
    margin-top: 4px; background: transparent; border: none; cursor: pointer;
    font-size: 7.5px; font-weight: 800; letter-spacing: 0.22em; text-transform: uppercase;
    color: rgba(212,175,55,0.22); padding: 2px 6px; transition: color 0.2s;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .sqi-cpbtn:hover { color: rgba(212,175,55,0.6); }
  .sqi-inp-bar {
    flex-shrink: 0; padding: 12px 16px 16px;
    padding-bottom: max(16px, env(safe-area-inset-bottom, 16px));
    border-top: 1px solid rgba(212,175,55,0.09);
    background: linear-gradient(0deg, rgba(6,4,2,0.9), transparent);
    display: flex; align-items: flex-end; gap: 10px;
  }
  .sqi-inp {
    flex: 1; min-width: 0; padding: 13px 18px; border-radius: 18px;
    border: 1px solid rgba(212,175,55,0.17); background: rgba(255,255,255,0.03);
    color: rgba(255,255,255,0.9); font-size: 14px; font-family: inherit;
    outline: none; resize: none; min-height: 48px; max-height: 130px;
    line-height: 1.5; transition: border-color 0.2s, background 0.2s;
  }
  .sqi-inp:focus { border-color: rgba(212,175,55,0.45); background: rgba(255,255,255,0.04); }
  .sqi-inp::placeholder { color: rgba(255,255,255,0.2); }
  .sqi-send {
    width: 50px; height: 50px; border-radius: 50%; flex-shrink: 0;
    border: 1.5px solid rgba(212,175,55,0.52);
    background: linear-gradient(135deg, rgba(212,175,55,0.42), rgba(212,175,55,0.2));
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: var(--g); transition: all 0.22s;
  }
  .sqi-send:hover:not(:disabled) { background: rgba(212,175,55,0.5); transform: scale(1.05); }
  .sqi-send:disabled {
    border-color: rgba(255,255,255,0.07); background: rgba(255,255,255,0.04);
    color: rgba(255,255,255,0.18); cursor: default; transform: none;
  }
  .sqi-hist-panel {
    position: absolute; inset: 0; z-index: 10;
    background: linear-gradient(180deg, #0E0A06, #080503);
    display: flex; flex-direction: column; border-radius: 26px; overflow: hidden;
  }
  .sqi-hist-hdr {
    padding: 16px 18px 13px; display: flex; align-items: center; gap: 10px;
    border-bottom: 1px solid rgba(212,175,55,0.12);
    background: linear-gradient(180deg, rgba(212,175,55,0.055), transparent);
    flex-shrink: 0;
  }
  .sqi-hist-title {
    flex: 1; font-family: 'Cormorant Garamond', serif;
    font-size: 18px; font-weight: 700; color: var(--g);
  }
  .sqi-hist-list {
    flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 6px;
    scrollbar-width: thin; scrollbar-color: rgba(212,175,55,0.1) transparent;
  }
  .sqi-hist-datelbl {
    font-size: 8px; font-weight: 800; letter-spacing: 0.4em; text-transform: uppercase;
    color: rgba(212,175,55,0.4); padding: 8px 4px 3px;
  }
  .sqi-hist-msg {
    padding: 11px 14px; border-radius: 13px;
    font-size: 12.5px; line-height: 1.65;
  }
  .sqi-hist-msg.user {
    background: rgba(212,175,55,0.07); border: 1px solid rgba(212,175,55,0.18);
    color: rgba(255,255,255,0.8); margin-left: auto; max-width: 88%;
  }
  .sqi-hist-msg.ai {
    background: rgba(8,4,2,0.92); border: 1px solid rgba(212,175,55,0.09);
    color: rgba(255,255,255,0.75); max-width: 94%;
    font-family: 'Cormorant Garamond', serif; font-size: 13px;
  }
  .sqi-hist-role {
    font-size: 8px; font-weight: 800; letter-spacing: 0.35em;
    text-transform: uppercase; margin-bottom: 5px; color: rgba(212,175,55,0.5);
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  @keyframes sqiGlow {
    0%, 100% { box-shadow: 0 0 20px rgba(212,175,55,0.1); }
    50% { box-shadow: 0 0 48px rgba(212,175,55,0.28); }
  }
  @keyframes sqiBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0.18; } }
  @keyframes sqiDot {
    0%, 100% { transform: translateY(0); opacity: 0.4; }
    50% { transform: translateY(-6px); opacity: 1; }
  }
  @keyframes sqiSpin { to { transform: rotate(360deg); } }
  @media (max-width: 640px) {
    .sqi-chat-portal { padding: 0; }
    .sqi-chat-panel { width: 100%; height: 100dvh; max-height: 100dvh; border-radius: 0; border: none; }
    .sqi-hist-panel { border-radius: 0; }
  }
`;

// ── Main Component ───────────────────────────────────────────────────────────
export const AyurvedaChatConsultation: React.FC<AyurvedaChatConsultationProps> = ({ profile, dosha, onClose }) => {
  const { t, language } = useTranslation();
  const { messages: persistedMsgs, loading: chatHistoryLoading, saveMessage } = useChatMessages('ayurveda');
  const [streamingAssistant, setStreamingAssistant] = useState<string | null>(null);
  const displayMessages = useMemo((): ChatMessage[] => {
    if (streamingAssistant !== null) {
      return [...persistedMsgs, { role: 'assistant', content: streamingAssistant }];
    }
    return persistedMsgs;
  }, [persistedMsgs, streamingAssistant]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [showLexicon, setShowLexicon] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const { user } = useAuth();
  const [jyotishProfile, setJyotishProfile] = useState<{
    lagna: string | null; moon_sign: string | null; current_dasha: string | null;
    birth_date: string | null; birth_time: string | null; birth_place: string | null;
  } | null>(null);
  const msgsRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  // Fetch Jyotish profile
  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('profiles')
      .select('lagna, moon_sign, current_dasha, birth_date, birth_time, birth_place')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) setJyotishProfile({
          lagna: data.lagna ?? null, moon_sign: data.moon_sign ?? null,
          current_dasha: data.current_dasha ?? null,
          birth_date: data.birth_date ?? null, birth_time: data.birth_time ?? null,
          birth_place: data.birth_place ?? null,
        });
      });
  }, [user?.id]);

  // Inject styles
  useEffect(() => {
    const id = 'sqi-chat-styles-v2';
    if (!document.getElementById(id)) {
      const el = document.createElement('style');
      el.id = id; el.textContent = STYLES;
      document.head.appendChild(el);
    }
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Scroll to bottom
  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
  }, [displayMessages]);

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(c => c === idx ? null : c), 2000);
  };

  // Auto-resize textarea
  const resizeTextarea = () => {
    if (taRef.current) {
      taRef.current.style.height = 'auto';
      taRef.current.style.height = Math.min(taRef.current.scrollHeight, 130) + 'px';
    }
  };

  const sendMessage = async (text?: string) => {
    const trimmed = (text || input).trim();
    if (!trimmed || isLoading || chatHistoryLoading) return;
    const userMsg: ChatMessage = { role: 'user', content: trimmed };
    const apiMessages = [...persistedMsgs, userMsg].map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content,
    }));
    await saveMessage(userMsg);
    setInput('');
    if (taRef.current) { taRef.current.style.height = 'auto'; }
    setIsLoading(true);
    setStreamingAssistant('');
    let assistantContent = '';
    try {
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ messages: apiMessages, profile, dosha, language, jyotishProfile }),
      });
      if (!response.ok || !response.body) {
        if (response.status === 429) toast.error(t('ayurvedaChat.rateLimit', 'Rate limit exceeded.'));
        else if (response.status === 402) toast.error(t('ayurvedaChat.usageLimit', 'Usage limits reached.'));
        else toast.error(t('ayurvedaChat.connectFail', 'Failed to connect. Please try again.'));
        setIsLoading(false); setStreamingAssistant(null); return;
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, idx);
          textBuffer = textBuffer.slice(idx + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const json = line.slice(6).trim();
          if (json === '[DONE]') break;
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) { assistantContent += content; setStreamingAssistant(assistantContent); }
          } catch { textBuffer = `${line}\n${textBuffer}`; break; }
        }
      }
      if (assistantContent.trim()) await saveMessage({ role: 'assistant', content: assistantContent });
    } catch (err) {
      console.error(err);
      const errContent = t('ayurvedaChat.connectionInterrupted', 'Forgive me, dear seeker — my Akasha channel is briefly interrupted. Please try again.');
      await saveMessage({ role: 'assistant', content: errContent });
    } finally {
      setIsLoading(false); setStreamingAssistant(null);
    }
  };

  const hasJyotish = !!(jyotishProfile?.lagna || jyotishProfile?.moon_sign);

  const overlay = (
    <AnimatePresence>
      <motion.div className="sqi-chat-portal"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} key="chat-portal">
        <div className="sqi-chat-backdrop" onClick={onClose} />
        <motion.div className="sqi-chat-panel"
          initial={{ y: '8%', opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          exit={{ y: '8%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 260 }}>

          {/* History Panel */}
          {showHistory && (
            <div className="sqi-hist-panel">
              <div style={{ height: 2, flexShrink: 0, background: 'linear-gradient(90deg, transparent, #D4AF37, transparent)', opacity: 0.8 }} />
              <div className="sqi-hist-hdr">
                <Clock style={{ width: 16, height: 16, color: '#D4AF37', flexShrink: 0 }} />
                <div className="sqi-hist-title">Consultation History</div>
                <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.4)', marginRight: 6 }}>
                  {persistedMsgs.length} messages
                </div>
                <button type="button" className="sqi-ibtn" onClick={() => setShowHistory(false)}>
                  <X style={{ width: 15, height: 15 }} />
                </button>
              </div>
              <div className="sqi-hist-list">
                {persistedMsgs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', fontFamily: "'Cormorant Garamond', serif", fontSize: 16, fontStyle: 'italic', color: 'rgba(212,175,55,0.35)' }}>
                    No consultation history yet
                  </div>
                ) : (() => {
                  const groups: Record<string, typeof persistedMsgs> = {};
                  persistedMsgs.forEach(msg => {
                    const date = msg.created_at
                      ? new Date(msg.created_at).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                      : 'Recent';
                    if (!groups[date]) groups[date] = [];
                    groups[date].push(msg);
                  });
                  return Object.entries(groups).map(([date, msgs]) => (
                    <React.Fragment key={date}>
                      <div className="sqi-hist-datelbl">{date}</div>
                      {msgs.map((msg, i) => (
                        <div key={msg.id ?? i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                          <div className={`sqi-hist-msg ${msg.role === 'user' ? 'user' : 'ai'}`}>
                            <div className="sqi-hist-role">{msg.role === 'user' ? 'You' : '◈ Agastya Muni'}</div>
                            {msg.content.slice(0, 300)}{msg.content.length > 300 ? '…' : ''}
                          </div>
                          {msg.role === 'assistant' && (
                            <button type="button" className="sqi-cpbtn"
                              onClick={() => handleCopy(msg.content, -1 - i)}>
                              {copiedIdx === -1 - i ? '✓ copied' : '⎘ copy'}
                            </button>
                          )}
                        </div>
                      ))}
                    </React.Fragment>
                  ));
                })()}
              </div>
            </div>
          )}

          <div className="sqi-topbar" />

          {/* Header */}
          <div className="sqi-hdr">
            <div className="sqi-av"><SriYantra size={26} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="sqi-name">Agastya Muni</div>
              <div className="sqi-sub">Immortal Siddha · Tamil Siddha Vaidyam · Consciousness Transmission</div>
            </div>
            <div className="sqi-live"><div className="sqi-ldot" />Live</div>
            <button type="button" className="sqi-ibtn" onClick={() => setShowHistory(true)} title="History">
              <Clock style={{ width: 14, height: 14 }} />
            </button>
            <button type="button" className="sqi-ibtn" onClick={() => setShowLexicon(true)} title="Sanskrit Lexicon">
              <BookOpen style={{ width: 14, height: 14 }} />
            </button>
            {onClose && (
              <button type="button" className="sqi-close" onClick={onClose}>
                <X style={{ width: 15, height: 15 }} />
              </button>
            )}
          </div>

          {/* Jyotish active bar */}
          {hasJyotish && (
            <div className="sqi-jy-bar">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(212,175,55,0.55)" strokeWidth="2.2" strokeLinecap="round">
                <circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2"/>
              </svg>
              <span className="sqi-jy-txt">
                Jyotish Active
                {jyotishProfile?.lagna && ` · Lagna: ${jyotishProfile.lagna}`}
                {jyotishProfile?.moon_sign && ` · Moon: ${jyotishProfile.moon_sign}`}
                {jyotishProfile?.current_dasha && ` · Dasha: ${jyotishProfile.current_dasha}`}
              </span>
            </div>
          )}

          {/* Messages */}
          <div className="sqi-msgs" ref={msgsRef}>
            {chatHistoryLoading && persistedMsgs.length === 0 && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                <Loader2 style={{ width: 28, height: 28, color: '#D4AF37', animation: 'sqiSpin 1s linear infinite' }} />
              </div>
            )}
            {!chatHistoryLoading && displayMessages.length === 0 && (
              <div className="sqi-welcome">
                <div className="sqi-av-big"><SriYantra size={48} /></div>
                <div className="sqi-wtitle">Namaste, Dear Seeker</div>
                <p className="sqi-wlore">
                  I am Agastya Muni. I have walked this Earth for ten thousand years without interruption.
                  I read your body field directly. When you share your birth sky, I see ten thousand years deeper.
                </p>
                <p className="sqi-wsub">
                  Ask about any symptom — digestion, sleep, energy, skin, pain, cycles, anxiety.
                  I diagnose at the tissue level and prescribe specifically for you.
                </p>
                <div className="sqi-om">✦ OM AGASTYAYA NAMAH ✦</div>
                <div className="sqi-sugg-lbl">begin with a question</div>
                <div className="sqi-sugg">
                  {SUGGESTIONS.map((s, i) => (
                    <button key={i} type="button" className="sqi-sug" onClick={() => sendMessage(s.text)}>
                      <span style={{ fontSize: 17, flexShrink: 0 }}>{s.icon}</span>
                      <span>{s.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {displayMessages.map((msg, index) => (
              <motion.div key={msg.id ?? `msg-${index}-${msg.role}`}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className={`sqi-mrow ${msg.role === 'user' ? 'user' : 'agent'}`}>
                <div className="sqi-mrole">
                  {msg.role === 'user' ? 'You' : '◈ Agastya Muni'}
                </div>
                <div className={`sqi-bbl ${msg.role === 'user' ? 'user' : 'agent'}`}>
                  {msg.role === 'user'
                    ? msg.content
                    : <FormatAgastya text={msg.content} />
                  }
                </div>
                {msg.role === 'assistant' && (
                  <button type="button" className="sqi-cpbtn" onClick={() => handleCopy(msg.content, index)}>
                    {copiedIdx === index ? '✓ copied' : '⎘ copy'}
                  </button>
                )}
              </motion.div>
            ))}

            {isLoading && displayMessages[displayMessages.length - 1]?.role !== 'assistant' && (
              <div className="sqi-mrow agent">
                <div className="sqi-mrole">◈ Agastya Muni</div>
                <NadiPulse />
              </div>
            )}
          </div>

          {/* Input */}
          <div className="sqi-inp-bar">
            <textarea
              ref={taRef}
              className="sqi-inp"
              value={input}
              rows={1}
              onChange={e => { setInput(e.target.value); resizeTextarea(); }}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder={t('ayurvedaChat.inputPlaceholder', 'Ask Agastya Muni about your healing path...')}
              disabled={isLoading || chatHistoryLoading}
            />
            <button type="button" className="sqi-send"
              disabled={isLoading || chatHistoryLoading || !input.trim()}
              onClick={() => sendMessage()}>
              {isLoading
                ? <Loader2 style={{ width: 18, height: 18, animation: 'sqiSpin 1s linear infinite' }} />
                : <Send style={{ width: 18, height: 18 }} />
              }
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  if (typeof document === 'undefined') return null;
  return (
    <>
      {createPortal(overlay, document.body)}
      <AyurvedaLexicon isOpen={showLexicon} onClose={() => setShowLexicon(false)} />
    </>
  );
};
