/**
 * ████████████████████████████████████████████████████████████████
 *  SQI 2050 — AyurvedaChatConsultation.tsx
 *  ROOT FIX: Uses ReactDOM.createPortal to render DIRECTLY into
 *  document.body — escapes the fixed(position:relative) wrapper
 *  that was pushing the panel 1620px below the viewport.
 *
 *  THE BUG: The parent z-9999 wrapper had position:relative and
 *  height:2506px. The chat panel was position:relative inside it,
 *  so it landed at top:1620px — below the fold, invisible.
 *
 *  THE FIX: createPortal(content, document.body) renders the
 *  overlay at the true document root, not inside the layout tree.
 *  z-index:9999 then correctly overlays everything.
 * ████████████████████████████████████████████████████████████████
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { AyurvedaUserProfile, DoshaProfile } from '@/lib/ayurvedaTypes';
import { useTranslation } from '@/hooks/useTranslation';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ayurveda-chat`;

interface ChatMessage { role: 'user' | 'assistant'; content: string; }
interface AyurvedaChatConsultationProps {
  profile: AyurvedaUserProfile | null;
  dosha: DoshaProfile | null;
  onClose?: () => void;
}

// Inject styles once
const STYLES = `
  .sqi-chat-portal {
    position: fixed !important;
    inset: 0 !important;
    z-index: 999999 !important;
    display: flex !important;
    align-items: flex-end !important;
    justify-content: center !important;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .sqi-chat-backdrop {
    position: absolute;
    inset: 0;
    background: rgba(3, 1, 8, 0.94);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
  }
  .sqi-chat-panel {
    position: relative;
    width: 100%;
    max-width: 680px;
    /* Robust viewport sizing across browsers (prevents off-screen panel) */
    height: 100vh;
    height: 100dvh;
    max-height: 100vh;
    max-height: 100dvh;
    display: flex;
    flex-direction: column;
    background: linear-gradient(170deg, rgba(10,6,2,0.99) 0%, rgba(5,3,1,0.99) 100%);
    border: 1px solid rgba(212,175,55,0.25);
    border-radius: 40px 40px 0 0;
    overflow: hidden;
    box-shadow: 0 -24px 80px rgba(212,175,55,0.12);
  }
  .sqi-chat-topbar {
    height: 2px;
    background: linear-gradient(90deg, transparent, #D4AF37, transparent);
    opacity: 0.6;
    flex-shrink: 0;
  }
  .sqi-chat-header {
    padding: 18px 20px 16px;
    border-bottom: 1px solid rgba(212,175,55,0.15);
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(212,175,55,0.025);
    flex-shrink: 0;
  }
  .sqi-dv-icon {
    width: 44px;
    height: 44px;
    border-radius: 14px;
    background: radial-gradient(circle, rgba(212,175,55,0.2), rgba(212,175,55,0.04));
    border: 1px solid rgba(212,175,55,0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    flex-shrink: 0;
    box-shadow: 0 0 16px rgba(212,175,55,0.14);
  }
  .sqi-chat-name { font-size: 15px; font-weight: 900; letter-spacing: -0.03em; color: #D4AF37; }
  .sqi-chat-sub  { font-size: 8px; font-weight: 800; letter-spacing: 0.45em; text-transform: uppercase; color: rgba(212,175,55,0.45); margin-top: 2px; }
  .sqi-live-pill {
    display: flex; align-items: center; gap: 5px;
    padding: 3px 10px; border-radius: 999px;
    background: rgba(212,175,55,0.07); border: 1px solid rgba(212,175,55,0.2);
  }
  .sqi-live-dot {
    width: 5px; height: 5px; border-radius: 50%;
    background: #D4AF37; box-shadow: 0 0 6px #D4AF37;
    animation: sqiGP 2s ease-in-out infinite;
  }
  .sqi-live-lbl { font-size: 8px; font-weight: 800; letter-spacing: 0.4em; text-transform: uppercase; color: #D4AF37; }
  .sqi-close {
    width: 36px; height: 36px; border-radius: 50%;
    background: rgba(255,255,255,0.04); border: 1px solid rgba(212,175,55,0.2);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: rgba(255,255,255,0.35); flex-shrink: 0;
    transition: all 0.2s;
  }
  .sqi-close:hover { background: rgba(212,175,55,0.12); color: #D4AF37; }
  /* MESSAGES: flex:1 gives it all remaining space */
  .sqi-msgs {
    flex: 1;
    overflow-y: auto;
    padding: 20px 18px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    scrollbar-width: thin;
    scrollbar-color: rgba(212,175,55,0.15) transparent;
    min-height: 0; /* critical for flex children to scroll */
  }
  .sqi-welcome { text-align: center; padding: 28px 12px; }
  .sqi-welcome-emoji { font-size: 48px; margin-bottom: 14px; }
  .sqi-welcome-title { font-size: 20px; font-weight: 900; letter-spacing: -0.04em; color: #D4AF37; margin-bottom: 8px; }
  .sqi-welcome-sub { font-size: 13px; color: rgba(255,255,255,0.38); line-height: 1.65; margin-bottom: 20px; }
  .sqi-sugg { display: flex; flex-direction: column; gap: 7px; max-width: 360px; margin: 0 auto; }
  .sqi-sugg-btn {
    padding: 9px 14px; border-radius: 12px;
    background: rgba(212,175,55,0.05); border: 1px solid rgba(212,175,55,0.18);
    color: rgba(255,255,255,0.5); font-family: inherit; font-size: 12px;
    cursor: pointer; text-align: left; transition: all 0.2s;
  }
  .sqi-sugg-btn:hover { border-color: rgba(212,175,55,0.5); color: #D4AF37; }
  .sqi-msg-row { display: flex; }
  .sqi-msg-row.user { justify-content: flex-end; }
  .sqi-msg-row.ai   { justify-content: flex-start; }
  .sqi-bubble { max-width: 82%; padding: 11px 15px; font-size: 13px; line-height: 1.65; white-space: pre-wrap; }
  .sqi-bubble.user { background: linear-gradient(135deg, rgba(212,175,55,0.22), rgba(212,175,55,0.1)); border: 1px solid rgba(212,175,55,0.5); border-radius: 18px 18px 4px 18px; color: rgba(255,255,255,0.9); box-shadow: 0 0 14px rgba(212,175,55,0.12); }
  .sqi-bubble.ai   { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 18px 18px 18px 4px; color: rgba(255,255,255,0.78); }
  .sqi-role { font-size: 8px; font-weight: 800; letter-spacing: 0.4em; text-transform: uppercase; margin-bottom: 5px; display: flex; align-items: center; gap: 5px; }
  /* INPUT BAR: flex-shrink:0 always pinned to bottom */
  .sqi-input-bar {
    flex-shrink: 0;
    padding: 12px 14px;
    padding-bottom: max(12px, env(safe-area-inset-bottom, 12px));
    border-top: 1px solid rgba(212,175,55,0.15);
    display: flex;
    gap: 9px;
    align-items: center;
    background: rgba(5,3,1,0.98);
  }
  .sqi-input {
    flex: 1; padding: 13px 18px; border-radius: 20px;
    background: rgba(255,255,255,0.04); border: 1px solid rgba(212,175,55,0.2);
    color: rgba(255,255,255,0.88); font-size: 14px; font-family: inherit;
    outline: none; transition: border-color 0.2s;
  }
  .sqi-input:focus { border-color: rgba(212,175,55,0.55); }
  .sqi-input::placeholder { color: rgba(212,175,55,0.3); }
  .sqi-send {
    width: 48px; height: 48px; border-radius: 50%; flex-shrink: 0;
    background: linear-gradient(135deg, #D4AF37, #B8960C);
    border: 1px solid #D4AF37; display: flex; align-items: center; justify-content: center;
    cursor: pointer; box-shadow: 0 0 18px rgba(212,175,55,0.18);
    transition: all 0.2s;
  }
  .sqi-send:hover { box-shadow: 0 0 28px rgba(212,175,55,0.4); transform: scale(1.06); }
  .sqi-send:disabled { background: rgba(255,255,255,0.06); border-color: rgba(212,175,55,0.2); box-shadow: none; cursor: not-allowed; transform: none; }
  .sqi-nadi-pulse { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 20px 0; }
  @keyframes sqiGP { 0%,100% { box-shadow: 0 0 0 0 rgba(212,175,55,0.5); } 50% { box-shadow: 0 0 0 8px rgba(212,175,55,0); } }
  @keyframes sqiSpin { to { transform: rotate(360deg); } }
`;

const NadiPulse = () => {
  const { t } = useTranslation();
  return (
    <div className="sqi-nadi-pulse">
      <div style={{ position: 'relative', width: 52, height: 52 }}>
        {[0, 1, 2].map(i => (
          <motion.div key={i} style={{ position: 'absolute', borderRadius: '50%', border: `1px solid ${i === 0 ? 'rgba(212,175,55,0.6)' : 'rgba(212,175,55,0.2)'}`, width: 24 + i * 14, height: 24 + i * 14, top: -(i * 7), left: -(i * 7) }}
            animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0.1, 0.6] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.35 }} />
        ))}
        <div style={{ position: 'relative', width: 24, height: 24, borderRadius: '50%', background: 'radial-gradient(circle,rgba(212,175,55,0.3),rgba(212,175,55,0.05))', border: '1px solid rgba(212,175,55,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>🔱</div>
      </div>
      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontStyle: 'italic', letterSpacing: '0.1em' }}>
        {t('ayurvedaChat.pulseReading', 'Dhanvantari reads your Nadi pulse…')}
      </p>
    </div>
  );
};

export const AyurvedaChatConsultation: React.FC<AyurvedaChatConsultationProps> = ({ profile, dosha, onClose }) => {
  const { t, language } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const msgsRef = useRef<HTMLDivElement>(null);

  // Inject styles once
  useEffect(() => {
    const id = 'sqi-chat-styles';
    if (!document.getElementById(id)) {
      const el = document.createElement('style');
      el.id = id;
      el.textContent = STYLES;
      document.head.appendChild(el);
    }
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
  }, [messages]);

  // ── FUNCTIONAL LOGIC: PRESERVED ─────────────────────────────
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
          messages: [...messages, userMsg].map(m => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content,
          })),
          profile,
          dosha,
          language,
        }),
      });
      if (!response.ok || !response.body) {
        if (response.status === 429) toast.error(t('ayurvedaChat.rateLimit', 'Rate limit exceeded.'));
        else if (response.status === 402) toast.error(t('ayurvedaChat.usageLimit', 'Usage limits reached.'));
        else toast.error(t('ayurvedaChat.connectFail', 'Failed to connect. Please try again.'));
        setIsLoading(false); return;
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
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
            if (content) {
              assistantContent += content;
              setMessages(prev => { const n = [...prev]; n[n.length - 1] = { role: 'assistant', content: assistantContent }; return n; });
            }
          } catch { textBuffer = line + '\n' + textBuffer; break; }
        }
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: t('ayurvedaChat.connectionInterrupted', 'Forgive me, my connection to the ether is interrupted. Please try again.') }]);
    } finally { setIsLoading(false); }
  };

  const suggestions = [
    t('ayurvedaChat.suggestion1', 'How do I balance my Vata dosha?'),
    t('ayurvedaChat.suggestion2', 'What herbs help anxiety and insomnia?'),
    t('ayurvedaChat.suggestion3', 'Create my daily Dinacharya routine'),
  ];

  const overlay = (
    <AnimatePresence>
      <motion.div className="sqi-chat-portal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} key="chat-portal">
        <div className="sqi-chat-backdrop" onClick={onClose} />
        <motion.div className="sqi-chat-panel" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 260 }}>
          <div className="sqi-chat-topbar" />

          {/* Header */}
          <div className="sqi-chat-header">
            <div className="sqi-dv-icon">🏥</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="sqi-chat-name">{t('ayurvedaChat.headerTitle', 'Dhanvantari — Divine Physician')}</div>
              <div className="sqi-chat-sub">{t('ayurvedaChat.headerSubtitle', { defaultValue: 'Bhrigu Nadi Enhanced • {{protocol}} Protocol', protocol: dosha?.primary || t('ayurvedaChat.unknownProtocol', 'Unknown') })}</div>
            </div>
            <div className="sqi-live-pill"><div className="sqi-live-dot" /><span className="sqi-live-lbl">{t('ayurvedaChat.liveBadge', 'Live')}</span></div>
            {onClose && <button type="button" className="sqi-close" onClick={onClose}><X style={{ width: 15, height: 15 }} /></button>}
          </div>

          {/* Messages */}
          <div className="sqi-msgs" ref={msgsRef}>
            {messages.length === 0 && (
              <div className="sqi-welcome">
                <div className="sqi-welcome-emoji">🙏</div>
                <div className="sqi-welcome-title">{t('ayurvedaChat.namasteTitle', 'Namaste, Seeker of Balance')}</div>
                <p className="sqi-welcome-sub">{t('ayurvedaChat.namasteSub', 'The Divine Physician awaits your concern…')}</p>
                <div className="sqi-sugg">
                  {suggestions.map(s => <button key={s} type="button" className="sqi-sugg-btn" onClick={() => setInput(s)}>✦ {s}</button>)}
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`sqi-msg-row ${msg.role === 'user' ? 'user' : 'ai'}`}>
                <div className={`sqi-bubble ${msg.role === 'user' ? 'user' : 'ai'}`}>
                  <div className="sqi-role" style={{ color: msg.role === 'user' ? '#D4AF37' : 'rgba(212,175,55,0.5)' }}>
                    {msg.role === 'assistant' && <Sparkles style={{ width: 9, height: 9 }} />}
                    {msg.role === 'user' ? t('ayurvedaChat.roleYou', 'You') : t('ayurvedaChat.roleDhanvantari', 'Dhanvantari')}
                  </div>
                  {msg.content}
                </div>
              </motion.div>
            ))}
            {isLoading && messages[messages.length - 1]?.role !== 'assistant' && <NadiPulse />}
          </div>

          {/* Input — always visible at bottom */}
          <form className="sqi-input-bar" onSubmit={handleSend}>
            <input
              className="sqi-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={t('ayurvedaChat.inputPlaceholder', 'Describe your concern to the Divine Physician…')}
              disabled={isLoading}
            />
            <button type="submit" className="sqi-send" disabled={isLoading || !input.trim()}>
              {isLoading
                ? <Loader2 style={{ width: 18, height: 18, color: '#D4AF37', animation: 'sqiSpin 1s linear infinite' }} />
                : <Send style={{ width: 17, height: 17, color: '#050505' }} />
              }
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(overlay, document.body);
};
