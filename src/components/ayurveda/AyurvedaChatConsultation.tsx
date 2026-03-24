/**
 * ████████████████████████████████████████████████████████████████
 *  SQI 2050 — DIVINE PHYSICIAN CHAT (AyurvedaChatConsultation)
 *  FIX: z-index raised above bottom nav, full-viewport lock,
 *       proper scroll area height, gold SQI aesthetic
 *  FUNCTIONAL LOGIC: 100% PRESERVED — stream, fetch, messages
 * ████████████████████████████████████████████████████████████████
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, X, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { AyurvedaUserProfile, DoshaProfile } from '@/lib/ayurvedaTypes';
import { useTranslation } from '@/hooks/useTranslation';

// ── SQI Design tokens ────────────────────────────────────────────
const G = {
  gold:       '#D4AF37',
  goldBorder: 'rgba(212,175,55,0.25)',
  goldStrong: 'rgba(212,175,55,0.5)',
  goldGlow:   'rgba(212,175,55,0.18)',
  glass:      'rgba(255,255,255,0.03)',
  bg:         'rgba(5,5,5,0.97)',
  w60:        'rgba(255,255,255,0.6)',
  w40:        'rgba(255,255,255,0.4)',
  w20:        'rgba(255,255,255,0.2)',
};

interface ChatMessage { role: 'user' | 'assistant'; content: string; }
interface AyurvedaChatConsultationProps {
  profile: AyurvedaUserProfile | null;
  dosha: DoshaProfile | null;
  onClose?: () => void;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ayurveda-chat`;

/* ─── NADI PULSE ANIMATION (replaces purple circles) ─── */
const NadiPulseAnimation = () => {
  const { t } = useTranslation();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '24px 0' }}>
      <div style={{ position: 'relative', width: 80, height: 80 }}>
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            style={{
              position: 'absolute',
              borderRadius: '50%',
              border: `1px solid ${i === 0 ? G.goldStrong : G.goldBorder}`,
              width: 40 + i * 20, height: 40 + i * 20,
              top: -(i * 10), left: -(i * 10),
            }}
            animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0.1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.35 }}
          />
        ))}
        <motion.div
          style={{
            position: 'relative', width: 40, height: 40,
            borderRadius: '50%', zIndex: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: `radial-gradient(circle, rgba(212,175,55,0.3), rgba(212,175,55,0.05))`,
            boxShadow: `0 0 20px ${G.goldGlow}`,
            border: `1px solid ${G.goldBorder}`,
          }}
          animate={{ scale: [1, 1.07, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <span style={{ fontSize: 18 }}>🔱</span>
        </motion.div>
      </div>
      <p style={{ color: G.w40, fontSize: 11, fontStyle: 'italic', letterSpacing: '0.1em' }}>
        {t('ayurvedaChat.pulseReading', 'Dhanvantari reads your Nadi pulse…')}
      </p>
    </div>
  );
};

export const AyurvedaChatConsultation: React.FC<AyurvedaChatConsultationProps> = ({
  profile, dosha, onClose
}) => {
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

  // ── FUNCTIONAL LOGIC: UNTOUCHED ──────────────────────────────────
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
          profile, dosha, language,
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
        content: t('ayurvedaChat.connectionInterrupted', 'Forgive me, my connection to the ether is interrupted. Please try again.'),
      }]);
    } finally {
      setIsLoading(false);
    }
  };
  // ── END FUNCTIONAL LOGIC ─────────────────────────────────────────

  return (
    <motion.div
      // ★ KEY FIX: z-index 9999 ensures it's above bottom nav (z-50) AND top nav
      // ★ KEY FIX: items-end so panel anchors to BOTTOM of screen on mobile
      // ★ KEY FIX: pt-0 removed, panel fills full viewport height correctly
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,             // ← CRITICAL: was z-50 (50), now 9999 to clear bottom nav
        display: 'flex',
        alignItems: 'flex-end',   // ← panel slides up from bottom, always accessible
        justifyContent: 'center',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <div
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(5,2,10,0.93)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        }}
        onClick={onClose}
      />

      {/* Chat panel */}
      <motion.div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 680,
          marginLeft: 'auto',
          marginRight: 'auto',
          // ★ KEY FIX: height is 100svh minus safe area, NOT fixed maxHeight that clips
          height: '100svh',
          maxHeight: '100svh',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(170deg, rgba(12,8,4,0.99) 0%, rgba(5,5,5,0.99) 100%)',
          border: `1px solid ${G.goldBorder}`,
          borderRadius: '40px 40px 0 0',    // ← rounded only top, sits flush at bottom
          overflow: 'hidden',
          boxShadow: `0 -20px 80px ${G.goldGlow}, 0 0 0 1px ${G.goldBorder}`,
        }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
      >
        {/* ── Top shimmer bar ── */}
        <div style={{
          height: 2,
          background: `linear-gradient(90deg, transparent 0%, ${G.gold} 50%, transparent 100%)`,
          opacity: 0.5,
        }} />

        {/* ── Header ── */}
        <div style={{
          padding: '20px 24px 18px',
          borderBottom: `1px solid ${G.goldBorder}`,
          display: 'flex', alignItems: 'center', gap: 14,
          background: 'rgba(212,175,55,0.03)',
          flexShrink: 0,
        }}>
          {/* Dhanvantari icon */}
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: `radial-gradient(circle, rgba(212,175,55,0.2), rgba(212,175,55,0.04))`,
            border: `1px solid ${G.goldBorder}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, flexShrink: 0,
            boxShadow: `0 0 16px ${G.goldGlow}`,
          }}>
            🏥
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 15, fontWeight: 900, letterSpacing: '-0.03em',
              color: G.gold,
            }}>
              {t('ayurvedaChat.headerTitle', 'Dhanvantari — Divine Physician')}
            </div>
            <div style={{
              fontSize: 8, fontWeight: 800, letterSpacing: '0.45em',
              textTransform: 'uppercase', color: 'rgba(212,175,55,0.5)',
              marginTop: 2,
            }}>
              {t('ayurvedaChat.headerSubtitle', {
                defaultValue: 'Bhrigu Nadi Enhanced • {{protocol}} Protocol',
                protocol: dosha?.primary || t('ayurvedaChat.unknownProtocol', 'Unknown'),
              })}
            </div>
          </div>

          {/* Nadi live indicator */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '4px 12px', borderRadius: 999,
            background: 'rgba(212,175,55,0.08)',
            border: `1px solid ${G.goldBorder}`,
          }}>
            <div style={{
              width: 5, height: 5, borderRadius: '50%',
              background: G.gold, boxShadow: `0 0 6px ${G.gold}`,
              animation: 'sqiGoldPulse 2s ease-in-out infinite',
            }} />
            <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.4em', color: G.gold, textTransform: 'uppercase' }}>
              Live
            </span>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${G.goldBorder}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: G.w40, flexShrink: 0,
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(212,175,55,0.12)'; (e.currentTarget as HTMLElement).style.color = G.gold; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLElement).style.color = G.w40; }}
            >
              <X style={{ width: 16, height: 16 }} />
            </button>
          )}
        </div>

        {/* ── Messages scroll area ── */}
        {/* ★ KEY FIX: flex:1 + overflow-y:auto means it fills EXACTLY the remaining space */}
        <div
          ref={scrollRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px 20px',
            display: 'flex', flexDirection: 'column', gap: 16,
            // Custom scrollbar
            scrollbarWidth: 'thin',
            scrollbarColor: `${G.goldBorder} transparent`,
          }}
        >
          {/* Welcome state */}
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 16px' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🙏</div>
              <div style={{
                fontSize: 20, fontWeight: 900, letterSpacing: '-0.04em',
                color: G.gold, marginBottom: 8,
              }}>
                {t('ayurvedaChat.namasteTitle', 'Namaste, Seeker of Balance')}
              </div>
              <p style={{ fontSize: 13, color: G.w40, lineHeight: 1.65 }}>
                {t('ayurvedaChat.namasteSub', 'The Divine Physician awaits your concern…')}
              </p>

              {/* Suggested questions */}
              <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  'How can I balance my Vata dosha?',
                  'What herbs help with stress and anxiety?',
                  'Design my daily Dinacharya routine',
                ].map((q, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(q)}
                    style={{
                      padding: '10px 16px', borderRadius: 12,
                      background: 'rgba(212,175,55,0.05)',
                      border: `1px solid ${G.goldBorder}`,
                      color: G.w60, fontSize: 12, fontFamily: "'Plus Jakarta Sans', sans-serif",
                      cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = G.goldStrong; (e.currentTarget as HTMLElement).style.color = G.gold; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = G.goldBorder; (e.currentTarget as HTMLElement).style.color = G.w60; }}
                  >
                    ✦ {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message list */}
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <div style={{
                maxWidth: '82%',
                padding: '12px 16px',
                borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                background: msg.role === 'user'
                  ? `linear-gradient(135deg, rgba(212,175,55,0.25), rgba(212,175,55,0.12))`
                  : 'rgba(255,255,255,0.04)',
                border: `1px solid ${msg.role === 'user' ? G.goldStrong : 'rgba(255,255,255,0.06)'}`,
                boxShadow: msg.role === 'user' ? `0 0 16px ${G.goldGlow}` : 'none',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  marginBottom: 6,
                }}>
                  {msg.role === 'assistant' && (
                    <Sparkles style={{ width: 10, height: 10, color: G.gold }} />
                  )}
                  <span style={{
                    fontSize: 8, fontWeight: 800, letterSpacing: '0.4em',
                    textTransform: 'uppercase',
                    color: msg.role === 'user' ? G.gold : 'rgba(212,175,55,0.5)',
                  }}>
                    {msg.role === 'user'
                      ? t('ayurvedaChat.roleYou', 'You')
                      : t('ayurvedaChat.roleDhanvantari', 'Dhanvantari')
                    }
                  </span>
                </div>
                <p style={{
                  fontSize: 14, lineHeight: 1.65, margin: 0,
                  color: msg.role === 'user' ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.78)',
                  whiteSpace: 'pre-wrap',
                }}>
                  {msg.content}
                </p>
              </div>
            </motion.div>
          ))}

          {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
            <NadiPulseAnimation />
          )}
        </div>

        {/* ── Input form ── */}
        {/* ★ KEY FIX: paddingBottom includes safe area for iOS notch bars */}
        <form
          onSubmit={handleSend}
          style={{
            padding: '12px 16px',
            paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
            borderTop: `1px solid ${G.goldBorder}`,
            display: 'flex', gap: 10, alignItems: 'center',
            background: 'rgba(5,5,5,0.98)',
            flexShrink: 0,
          }}
        >
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={t('ayurvedaChat.inputPlaceholder', 'Describe your concern to the Divine Physician…')}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '14px 20px',
                borderRadius: 20,
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${G.goldBorder}`,
                color: 'rgba(255,255,255,0.88)',
                fontSize: 14,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.currentTarget.style.borderColor = G.goldStrong}
              onBlur={e => e.currentTarget.style.borderColor = G.goldBorder}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            style={{
              width: 50, height: 50, borderRadius: '50%',
              background: input.trim() && !isLoading
                ? `linear-gradient(135deg, ${G.gold}, #B8960C)`
                : 'rgba(255,255,255,0.06)',
              border: `1px solid ${input.trim() && !isLoading ? G.gold : G.goldBorder}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
              boxShadow: input.trim() && !isLoading ? `0 0 20px ${G.goldGlow}` : 'none',
              flexShrink: 0,
            }}
          >
            {isLoading
              ? <Loader2 style={{ width: 18, height: 18, color: G.gold, animation: 'spin 1s linear infinite' }} />
              : <Send style={{ width: 18, height: 18, color: input.trim() ? '#050505' : G.w40 }} />
            }
          </button>
        </form>
      </motion.div>

      {/* Inline keyframes for pulse */}
      <style>{`
        @keyframes sqiGoldPulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(212,175,55,0.5); }
          50%      { box-shadow: 0 0 0 6px rgba(212,175,55,0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </motion.div>
  );
};
