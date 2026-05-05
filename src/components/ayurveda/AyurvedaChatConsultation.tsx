import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Sparkles, Loader2, Leaf, Flame, Moon, Heart } from 'lucide-react';
import { toast } from 'sonner';
import type { AyurvedaUserProfile, DoshaProfile } from '@/lib/ayurvedaTypes';
import { useTranslation } from '@/hooks/useTranslation';
import { CopyMessageButton } from '@/components/chat/CopyMessageButton';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ayurveda-chat`;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AyurvedaChatConsultationProps {
  profile: AyurvedaUserProfile | null;
  dosha: DoshaProfile | null;
  onClose?: () => void;
}

const STYLES = `
  .sqi-chat-portal {
    --sqi-chat-gold: 42 68% 54%;
    --sqi-chat-gold-deep: 41 79% 44%;
    --sqi-chat-ink: 28 55% 4%;
    --sqi-chat-panel-top: 29 73% 7%;
    --sqi-chat-panel-bottom: 24 62% 3%;
    --sqi-chat-muted: 38 16% 63%;
    position: fixed !important;
    inset: 0 !important;
    z-index: 999999 !important;
    display: flex !important;
    align-items: stretch !important;
    justify-content: center !important;
    padding: 14px;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .sqi-chat-backdrop {
    position: absolute;
    inset: 0;
    background: hsl(24 35% 2% / 0.92);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }
  .sqi-chat-panel {
    position: relative;
    width: min(100%, 560px);
    height: calc(100vh - 28px);
    height: calc(100dvh - 28px);
    max-height: calc(100vh - 28px);
    max-height: calc(100dvh - 28px);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-radius: 28px;
    border: 1px solid hsl(var(--sqi-chat-gold) / 0.38);
    background:
      radial-gradient(circle at top center, hsl(var(--sqi-chat-gold) / 0.08), transparent 28%),
      linear-gradient(180deg, hsl(var(--sqi-chat-panel-top) / 0.99) 0%, hsl(var(--sqi-chat-panel-bottom) / 1) 100%);
    box-shadow:
      0 30px 90px hsl(var(--sqi-chat-gold) / 0.08),
      inset 0 1px 0 hsl(var(--sqi-chat-gold) / 0.18);
  }
  .sqi-chat-topbar {
    height: 2px;
    flex-shrink: 0;
    background: linear-gradient(90deg, transparent, hsl(var(--sqi-chat-gold)), transparent);
    opacity: 0.8;
  }
  .sqi-chat-header {
    padding: 16px 18px 14px;
    display: flex;
    align-items: flex-start;
    gap: 12px;
    border-bottom: 1px solid hsl(var(--sqi-chat-gold) / 0.16);
    background: linear-gradient(180deg, hsl(var(--sqi-chat-gold) / 0.05), transparent);
    flex-shrink: 0;
  }
  .sqi-dv-icon {
    width: 44px;
    height: 44px;
    border-radius: 999px;
    border: 1px solid hsl(var(--sqi-chat-gold) / 0.38);
    background: radial-gradient(circle at 35% 35%, hsl(var(--sqi-chat-gold) / 0.18), hsl(var(--sqi-chat-gold) / 0.04));
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: hsl(var(--sqi-chat-gold));
    font-size: 20px;
    box-shadow: 0 0 18px hsl(var(--sqi-chat-gold) / 0.14);
  }
  .sqi-chat-name {
    color: hsl(var(--sqi-chat-gold));
    font-family: 'Cormorant Garamond', serif;
    font-size: 17px;
    font-weight: 700;
    letter-spacing: 0.01em;
    line-height: 1;
  }
  .sqi-chat-sub {
    margin-top: 4px;
    color: hsl(var(--sqi-chat-gold) / 0.72);
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 0.42em;
    text-transform: uppercase;
    line-height: 1.6;
  }
  .sqi-live-pill {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    border-radius: 999px;
    background: hsl(var(--sqi-chat-gold) / 0.08);
    border: 1px solid hsl(var(--sqi-chat-gold) / 0.22);
    margin-top: 1px;
  }
  .sqi-live-dot {
    width: 5px;
    height: 5px;
    border-radius: 999px;
    background: hsl(var(--sqi-chat-gold));
    box-shadow: 0 0 8px hsl(var(--sqi-chat-gold));
    animation: sqiGP 2s ease-in-out infinite;
  }
  .sqi-live-lbl {
    color: hsl(var(--sqi-chat-gold));
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 0.4em;
    text-transform: uppercase;
  }
  .sqi-close {
    width: 36px;
    height: 36px;
    border-radius: 999px;
    border: 1px solid hsl(var(--sqi-chat-gold) / 0.18);
    background: hsl(30 18% 14% / 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: hsl(var(--sqi-chat-muted) / 0.82);
    cursor: pointer;
    transition: 0.2s ease;
  }
  .sqi-close:hover {
    color: hsl(var(--sqi-chat-gold));
    border-color: hsl(var(--sqi-chat-gold) / 0.42);
    background: hsl(var(--sqi-chat-gold) / 0.08);
  }
  .sqi-msgs {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 22px 16px 18px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    scrollbar-width: thin;
    scrollbar-color: hsl(var(--sqi-chat-gold) / 0.15) transparent;
  }
  .sqi-msgs::-webkit-scrollbar {
    width: 6px;
  }
  .sqi-msgs::-webkit-scrollbar-thumb {
    background: hsl(var(--sqi-chat-gold) / 0.14);
    border-radius: 999px;
  }
  .sqi-welcome {
    text-align: center;
    padding: 10px 8px 18px;
  }
  .sqi-welcome-emoji {
    font-size: 44px;
    margin-bottom: 14px;
    color: hsl(var(--sqi-chat-gold));
    text-shadow: 0 0 20px hsl(var(--sqi-chat-gold) / 0.32);
  }
  .sqi-welcome-title {
    color: hsl(var(--sqi-chat-gold));
    font-family: 'Cormorant Garamond', serif;
    font-size: 21px;
    font-style: italic;
    font-weight: 700;
    line-height: 1.15;
    margin-bottom: 10px;
  }
  .sqi-welcome-lead {
    color: hsl(var(--sqi-chat-gold) / 0.92);
    font-family: 'Cormorant Garamond', serif;
    font-size: 17px;
    font-style: italic;
    line-height: 1.5;
    max-width: 430px;
    margin: 0 auto 10px;
  }
  .sqi-welcome-sub {
    color: hsl(var(--sqi-chat-muted) / 0.62);
    font-size: 14px;
    line-height: 1.65;
    max-width: 440px;
    margin: 0 auto 16px;
  }
  .sqi-om-divider {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin: 0 auto 18px;
    color: hsl(var(--sqi-chat-gold) / 0.75);
    font-family: 'Cormorant Garamond', serif;
    font-size: 16px;
    max-width: 420px;
  }
  .sqi-om-divider::before,
  .sqi-om-divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, transparent, hsl(var(--sqi-chat-gold) / 0.2), transparent);
  }
  .sqi-sugg {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-width: 440px;
    margin: 0 auto;
  }
  .sqi-sugg-btn {
    width: 100%;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 10px;
    border-radius: 16px;
    border: 1px solid hsl(var(--sqi-chat-gold) / 0.22);
    background: hsl(28 34% 9% / 0.78);
    color: hsl(var(--sqi-chat-muted) / 0.95);
    font-family: inherit;
    font-size: 13px;
    line-height: 1.4;
    text-align: left;
    cursor: pointer;
    transition: 0.2s ease;
  }
  .sqi-sugg-btn:hover {
    color: hsl(var(--sqi-chat-gold));
    border-color: hsl(var(--sqi-chat-gold) / 0.44);
    background: hsl(28 34% 11% / 0.92);
    transform: translateY(-1px);
  }
  .sqi-sugg-btn:focus-visible {
    outline: 2px solid hsl(var(--sqi-chat-gold) / 0.4);
    outline-offset: 2px;
  }
  .sqi-sugg-icon {
    width: 18px;
    height: 18px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .sqi-msg-row {
    display: flex;
  }
  .sqi-msg-row.user {
    justify-content: flex-end;
  }
  .sqi-msg-row.ai {
    justify-content: flex-start;
  }
  .sqi-bubble {
    max-width: 84%;
    padding: 12px 15px;
    border-radius: 18px;
    font-size: 13px;
    line-height: 1.7;
    white-space: pre-wrap;
    -webkit-user-select: none;
    user-select: none;
    -webkit-touch-callout: none;
  }
  .sqi-bubble.user {
    color: hsl(30 45% 94%);
    background: linear-gradient(135deg, hsl(var(--sqi-chat-gold) / 0.24), hsl(var(--sqi-chat-gold-deep) / 0.12));
    border: 1px solid hsl(var(--sqi-chat-gold) / 0.42);
    border-radius: 18px 18px 6px 18px;
    box-shadow: 0 0 14px hsl(var(--sqi-chat-gold) / 0.1);
  }
  .sqi-bubble.ai {
    color: hsl(33 15% 84% / 0.96);
    background: hsl(26 20% 11% / 0.94);
    border: 1px solid hsl(var(--sqi-chat-gold) / 0.12);
    border-radius: 18px 18px 18px 6px;
  }
  .sqi-role {
    display: flex;
    align-items: center;
    gap: 5px;
    margin-bottom: 6px;
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 0.38em;
    text-transform: uppercase;
  }
  .sqi-input-bar {
    flex-shrink: 0;
    padding: 12px 14px;
    padding-bottom: max(12px, env(safe-area-inset-bottom, 12px));
    display: flex;
    align-items: center;
    gap: 10px;
    border-top: 1px solid hsl(var(--sqi-chat-gold) / 0.14);
    background: linear-gradient(180deg, hsl(24 28% 5% / 0.1), hsl(24 28% 5% / 0.95));
  }
  .sqi-input {
    flex: 1;
    min-width: 0;
    padding: 14px 18px;
    border-radius: 999px;
    border: 1px solid hsl(var(--sqi-chat-gold) / 0.24);
    background: hsl(26 19% 10% / 0.96);
    color: hsl(32 42% 92%);
    font-size: 14px;
    font-family: inherit;
    outline: none;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }
  .sqi-input:focus {
    border-color: hsl(var(--sqi-chat-gold) / 0.55);
    box-shadow: 0 0 0 3px hsl(var(--sqi-chat-gold) / 0.08);
  }
  .sqi-input::placeholder {
    color: hsl(var(--sqi-chat-gold) / 0.34);
  }
  .sqi-send {
    width: 50px;
    height: 50px;
    border-radius: 999px;
    flex-shrink: 0;
    border: 1px solid hsl(var(--sqi-chat-gold-deep));
    background: linear-gradient(135deg, hsl(40 92% 57%), hsl(var(--sqi-chat-gold-deep)));
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 0 22px hsl(var(--sqi-chat-gold) / 0.18);
    transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
  }
  .sqi-send:hover {
    transform: scale(1.05);
    box-shadow: 0 0 28px hsl(var(--sqi-chat-gold) / 0.34);
    filter: saturate(1.05);
  }
  .sqi-send:disabled {
    cursor: not-allowed;
    transform: none;
    filter: none;
    box-shadow: none;
    border-color: hsl(var(--sqi-chat-gold) / 0.18);
    background: hsl(28 16% 16% / 0.9);
  }
  .sqi-nadi-pulse {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 18px 0 10px;
  }
  @keyframes sqiGP {
    0%, 100% { box-shadow: 0 0 0 0 hsl(var(--sqi-chat-gold) / 0.46); }
    50% { box-shadow: 0 0 0 9px hsl(var(--sqi-chat-gold) / 0); }
  }
  @keyframes sqiSpin {
    to { transform: rotate(360deg); }
  }
  @media (max-width: 640px) {
    .sqi-chat-portal {
      padding: 12px;
    }
    .sqi-chat-panel {
      width: 100%;
      height: calc(100vh - 24px);
      height: calc(100dvh - 24px);
      max-height: calc(100vh - 24px);
      max-height: calc(100dvh - 24px);
      border-radius: 24px;
    }
    .sqi-chat-header {
      padding: 16px 14px 14px;
      gap: 10px;
    }
    .sqi-msgs {
      padding: 18px 12px 16px;
    }
    .sqi-bubble {
      max-width: 88%;
    }
    .sqi-input-bar {
      padding-left: 12px;
      padding-right: 12px;
    }
    .sqi-input {
      padding-left: 16px;
      padding-right: 16px;
    }
  }
`;

const NadiPulse = () => {
  const { t } = useTranslation();

  return (
    <div className="sqi-nadi-pulse">
      <div style={{ position: 'relative', width: 52, height: 52 }}>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            style={{
              position: 'absolute',
              borderRadius: '50%',
              border: `1px solid ${i === 0 ? 'hsl(42 68% 54% / 0.58)' : 'hsl(42 68% 54% / 0.2)'}`,
              width: 24 + i * 14,
              height: 24 + i * 14,
              top: -(i * 7),
              left: -(i * 7),
            }}
            animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0.1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.35 }}
          />
        ))}
        <div
          style={{
            position: 'relative',
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: 'radial-gradient(circle, hsl(42 68% 54% / 0.32), hsl(42 68% 54% / 0.06))',
            border: '1px solid hsl(42 68% 54% / 0.32)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
          }}
        >
          🔱
        </div>
      </div>
      <p
        style={{
          color: 'hsl(38 16% 63% / 0.68)',
          fontSize: 11,
          fontStyle: 'italic',
          letterSpacing: '0.08em',
          margin: 0,
        }}
      >
        {t('ayurvedaChat.pulseReading', 'Agastya Muni reads your Nadi pulse…')}
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

  useEffect(() => {
    const id = 'sqi-chat-styles';
    if (!document.getElementById(id)) {
      const el = document.createElement('style');
      el.id = id;
      el.textContent = STYLES;
      document.head.appendChild(el);
    }

    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    if (msgsRef.current) {
      msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    let assistantContent = '';

    try {
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({
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
        setIsLoading(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

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
              setMessages((prev) => {
                const next = [...prev];
                next[next.length - 1] = { role: 'assistant', content: assistantContent };
                return next;
              });
            }
          } catch {
            textBuffer = `${line}\n${textBuffer}`;
            break;
          }
        }
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: t('ayurvedaChat.connectionInterrupted', 'Forgive me, dear seeker — my Akasha channel is briefly interrupted. Please try again.'),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestions = [
    {
      key: 'suggestion1',
      label: t('ayurvedaChat.suggestion1', 'What herbs balance my Vata-Pitta dosha?'),
      icon: <Leaf style={{ width: 16, height: 16, color: 'hsl(120 39% 59%)' }} />,
    },
    {
      key: 'suggestion2',
      label: t('ayurvedaChat.suggestion2', 'How do I strengthen my Agni digestive fire?'),
      icon: <Flame style={{ width: 16, height: 16, color: 'hsl(21 93% 58%)' }} />,
    },
    {
      key: 'suggestion3',
      label: t('ayurvedaChat.suggestion3', 'Design my sacred Dinacharya daily ritual'),
      icon: <Moon style={{ width: 16, height: 16, color: 'hsl(49 88% 62%)' }} />,
    },
    {
      key: 'suggestion4',
      label: t('ayurvedaChat.suggestion4', 'How do I heal anxiety through Siddha medicine?'),
      icon: <Heart style={{ width: 16, height: 16, color: 'hsl(128 49% 51%)' }} />,
    },
    {
      key: 'suggestion5',
      label: t('ayurvedaChat.suggestion5', 'What does the Agastya Samhita say about trauma?'),
      icon: <span style={{ color: 'hsl(42 68% 54%)', fontSize: 15, lineHeight: 1 }}>🔱</span>,
    },
  ];

  const overlay = (
    <AnimatePresence>
      <motion.div
        className="sqi-chat-portal"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        key="chat-portal"
      >
        <div className="sqi-chat-backdrop" onClick={onClose} />

        <motion.div
          className="sqi-chat-panel"
          initial={{ y: '8%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '8%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        >
          <div className="sqi-chat-topbar" />

          <div className="sqi-chat-header">
            <div className="sqi-dv-icon">🔱</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="sqi-chat-name">{t('ayurvedaChat.headerTitle', 'Agastya Muni')}</div>
              <div className="sqi-chat-sub">
                {t('ayurvedaChat.headerSubtitle', {
                  defaultValue: 'Divine Physician · Agastya Samhita · {{protocol}} Protocol',
                  protocol: dosha?.primary || t('ayurvedaChat.unknownProtocol', 'Unknown'),
                })}
              </div>
            </div>
            <div className="sqi-live-pill">
              <div className="sqi-live-dot" />
              <span className="sqi-live-lbl">{t('ayurvedaChat.liveBadge', 'Live')}</span>
            </div>
            {onClose && (
              <button type="button" className="sqi-close" onClick={onClose}>
                <X style={{ width: 15, height: 15 }} />
              </button>
            )}
          </div>

          <div className="sqi-msgs" ref={msgsRef}>
            {messages.length === 0 && (
              <div className="sqi-welcome">
                <div className="sqi-welcome-emoji">🔱</div>
                <div className="sqi-welcome-title">{t('ayurvedaChat.namasteTitle', 'Namaste, Dear Seeker')}</div>
                <p className="sqi-welcome-lead">
                  {t(
                    'ayurvedaChat.namasteLead',
                    'I am Agastya Muni, the immortal Siddha sage who brought Ayurveda from the Himalayas to the South.',
                  )}
                </p>
                <p className="sqi-welcome-sub">
                  {t(
                    'ayurvedaChat.namasteSub',
                    'Your Prakriti has been read. The Akasha Field has transmitted your constitution to me. Ask freely.',
                  )}
                </p>
                <div className="sqi-om-divider">
                  <span>✧ OM ✧</span>
                </div>
                <div className="sqi-sugg">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.key}
                      type="button"
                      className="sqi-sugg-btn"
                      onClick={() => setInput(suggestion.label)}
                    >
                      <span className="sqi-sugg-icon">{suggestion.icon}</span>
                      <span>{suggestion.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`sqi-msg-row ${msg.role === 'user' ? 'user' : 'ai'}`}
              >
                <div className={`sqi-bubble ${msg.role === 'user' ? 'user' : 'ai'}`}>
                  <div
                    className="sqi-role"
                    style={{
                      color:
                        msg.role === 'user'
                          ? 'hsl(42 68% 54%)'
                          : 'hsl(42 68% 54% / 0.56)',
                    }}
                  >
                    {msg.role === 'assistant' && <Sparkles style={{ width: 9, height: 9 }} />}
                    {msg.role === 'user'
                      ? t('ayurvedaChat.roleYou', 'You')
                      : t('ayurvedaChat.roleAgastya', 'Agastya Muni')}
                  </div>
                  {msg.content}
                </div>
              </motion.div>
            ))}

            {isLoading && messages[messages.length - 1]?.role !== 'assistant' && <NadiPulse />}
          </div>

          <form className="sqi-input-bar" onSubmit={handleSend}>
            <input
              className="sqi-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('ayurvedaChat.inputPlaceholder', 'Ask Agastya Muni about your healing path...')}
              disabled={isLoading}
            />
            <button type="submit" className="sqi-send" disabled={isLoading || !input.trim()}>
              {isLoading ? (
                <Loader2
                  style={{
                    width: 18,
                    height: 18,
                    color: 'hsl(42 68% 54%)',
                    animation: 'sqiSpin 1s linear infinite',
                  }}
                />
              ) : (
                <Send style={{ width: 18, height: 18, color: 'hsl(28 55% 7%)' }} />
              )}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(overlay, document.body);
};