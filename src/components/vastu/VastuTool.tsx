import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VastuChatWindow, VastuMessage } from './VastuChat';
import { MODULES } from './vastuConstants';
import { toast } from 'sonner';

// ─────────────────────────────────────────────
// SQI 2050 Design Tokens (inline for portability)
// Primary:   #D4AF37  (Siddha-Gold)
// Bg:        #050505  (Akasha-Black)
// Glass:     rgba(255,255,255,0.02)
// Border:    rgba(255,255,255,0.06)
// Cyan:      #22D3EE  (Vayu-Cyan – scanner pulses only)
// ─────────────────────────────────────────────

interface VastuToolProps {
  isAdmin?: boolean;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vastu-chat`;

// ── SQI Sidebar Module Button ──────────────────
const ModuleButton: React.FC<{
  module: { id: number; title: string };
  isCurrent: boolean;
  isCompleted: boolean;
  isAvailable: boolean;
  onClick: () => void;
}> = ({ module, isCurrent, isCompleted, isAvailable, onClick }) => (
  <button
    disabled={!isAvailable}
    onClick={onClick}
    style={{
      width: '100%',
      textAlign: 'left',
      padding: '12px 14px',
      borderRadius: '18px',
      border: `1px solid ${
        isCurrent
          ? 'rgba(212,175,55,0.4)'
          : isCompleted
          ? 'rgba(212,175,55,0.15)'
          : isAvailable
          ? 'rgba(255,255,255,0.06)'
          : 'rgba(255,255,255,0.03)'
      }`,
      background: isCurrent
        ? 'rgba(212,175,55,0.06)'
        : isCompleted
        ? 'rgba(212,175,55,0.03)'
        : 'rgba(255,255,255,0.015)',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '10px',
      cursor: isAvailable ? 'pointer' : 'not-allowed',
      opacity: isAvailable ? 1 : 0.35,
      transition: 'all 0.25s',
      boxShadow: isCurrent ? '0 0 20px rgba(212,175,55,0.08)' : 'none',
    }}
  >
    {/* Number badge */}
    <div
      style={{
        flexShrink: 0,
        width: '26px',
        height: '26px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '10px',
        fontWeight: 900,
        background: isCurrent
          ? '#D4AF37'
          : isCompleted
          ? 'rgba(212,175,55,0.3)'
          : 'rgba(255,255,255,0.06)',
        color: isCurrent ? '#050505' : isCompleted ? '#D4AF37' : 'rgba(255,255,255,0.5)',
        border: isCompleted && !isCurrent ? '1px solid rgba(212,175,55,0.3)' : 'none',
      }}
    >
      {isCompleted && !isCurrent ? '✓' : module.id}
    </div>

    {/* Title + label */}
    <div style={{ flexGrow: 1, minWidth: 0 }}>
      <p
        style={{
          fontSize: '11px',
          fontWeight: isCurrent ? 700 : 500,
          color: isCurrent ? '#fff' : 'rgba(255,255,255,0.55)',
          margin: 0,
          lineHeight: 1.4,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {module.title}
      </p>
      {isCurrent && (
        <span
          style={{
            display: 'block',
            marginTop: '3px',
            fontSize: '8px',
            fontWeight: 800,
            letterSpacing: '0.45em',
            textTransform: 'uppercase',
            color: '#D4AF37',
          }}
        >
          Current Focus
        </span>
      )}
      {!isAvailable && (
        <span
          style={{
            display: 'block',
            marginTop: '3px',
            fontSize: '8px',
            fontWeight: 700,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.25)',
          }}
        >
          🔒 Locked
        </span>
      )}
    </div>
  </button>
);

export const VastuTool: React.FC<VastuToolProps> = ({ isAdmin = false }) => {
  const [currentModule, setCurrentModule] = useState(1);
  const [messages, setMessages] = useState<VastuMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [isMasterUnlocked, setIsMasterUnlocked] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // ── handleSendMessage: LOGIC UNCHANGED ───────
  const handleSendMessage = useCallback(
    async (text: string, images?: string[]) => {
      const userMsg: VastuMessage = {
        role: 'user',
        text,
        images,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsThinking(true);
      let assistantContent = '';
      try {
        const apiMessages = [...messages, userMsg].map((m) => ({
          role: m.role === 'model' ? 'assistant' : 'user',
          content: m.text,
        }));
        const response = await fetch(CHAT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: apiMessages, images }),
        });
        if (!response.ok || !response.body) {
          if (response.status === 429) {
            toast.error('Rate limit exceeded. Please try again in a moment.');
          } else {
            toast.error('The cosmic connection was interrupted. Please try again.');
          }
          setIsThinking(false);
          return;
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let textBuffer = '';
        setMessages((prev) => [
          ...prev,
          { role: 'model', text: '', timestamp: Date.now() },
        ]);
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
              const content = parsed.choices?.[0]?.delta?.content as
                | string
                | undefined;
              if (content) {
                assistantContent += content;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: 'model',
                    text: assistantContent,
                    timestamp: Date.now(),
                  };
                  return updated;
                });
              }
            } catch {
              textBuffer = line + '\n' + textBuffer;
              break;
            }
          }
        }
        const startMatch = assistantContent.match(/\[MODULE_START:\s*(\d+)\]/);
        const completeMatch = assistantContent.match(
          /\[MODULE_COMPLETE:\s*(\d+)\]/
        );
        if (startMatch) {
          setCurrentModule(parseInt(startMatch[1]));
        } else if (completeMatch) {
          const next = Math.min(10, parseInt(completeMatch[1]) + 1);
          setCurrentModule(next);
        }
      } catch (error) {
        console.error('Vastu chat error:', error);
        setMessages((prev) => [
          ...prev,
          {
            role: 'model',
            text: 'The cosmic connection was interrupted. Please try again.',
            timestamp: Date.now(),
          },
        ]);
      } finally {
        setIsThinking(false);
      }
    },
    [messages]
  );

  const handleModuleClick = (id: number) => {
    const isCompleted = id < currentModule;
    const isCurrent = id === currentModule;
    const isAvailable = isMasterUnlocked || isCompleted || isCurrent;
    if (!isAvailable) return;
    setIsSidebarOpen(false);
    setCurrentModule(id);
    const moduleTitle = MODULES.find((m) => m.id === id)?.title;
    handleSendMessage(
      `Architect, I would like to jump directly to Module ${id}: ${moduleTitle}. Please introduce this module, provide the diagnostics, and the abundance guidelines for this space.`
    );
  };

  // ── RENDER ────────────────────────────────────
  return (
    <div
      style={{
        display: 'flex',
        flex: 1,
        minHeight: 0,
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '16px',
        border: '1px solid rgba(212,175,55,0.15)',
        background: '#050505',
        boxShadow: '0 0 80px rgba(212,175,55,0.06), 0 40px 100px rgba(0,0,0,0.6)',
        colorScheme: 'dark',
      }}
      className="vastu-sqi-root"
    >
      <style>{`
        .vastu-sqi-root, .vastu-sqi-root * {
          box-sizing: border-box !important;
        }
        /* Nuke any Tailwind/shadcn white backgrounds leaking into this tree */
        .vastu-sqi-root .bg-stone-50,
        .vastu-sqi-root .bg-white,
        .vastu-sqi-root .bg-background,
        .vastu-sqi-root [class*="bg-stone"],
        .vastu-sqi-root [class*="bg-amber"] {
          background: transparent !important;
        }
        /* Override stone borders */
        .vastu-sqi-root [class*="border-stone"],
        .vastu-sqi-root [class*="border-amber"] {
          border-color: rgba(255,255,255,0.07) !important;
        }
        /* Kill any white text that Tailwind might inject */
        .vastu-sqi-root .text-stone-800,
        .vastu-sqi-root .text-stone-900 {
          color: #fff !important;
        }
        .vastu-sqi-root .text-stone-600,
        .vastu-sqi-root .text-stone-500,
        .vastu-sqi-root .text-stone-400 {
          color: rgba(255,255,255,0.5) !important;
        }
        /* Input placeholder */
        .vastu-sqi-root input::placeholder {
          color: rgba(255,255,255,0.28) !important;
        }
        @keyframes sqiSpin { to { transform: rotate(360deg); } }
      `}</style>
      {/* ── STAR FIELD BG ── */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(212,175,55,0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* ── MOBILE OVERLAY ── */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.7)',
              zIndex: 40,
            }}
            className="md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── SIDEBAR ── */}
      <aside
        style={{
          position: 'relative',
          zIndex: 10,
          width: '256px',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(255,255,255,0.015)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
        className={`fixed md:relative z-50 md:z-auto top-0 left-0 h-full w-64 max-w-[85vw] transition-transform duration-300 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Sidebar header */}
        <div
          style={{
            padding: '20px 18px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h3
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 900,
                fontSize: '14px',
                letterSpacing: '-0.02em',
                color: '#fff',
                margin: 0,
              }}
            >
              Your Journey
            </h3>
            <p
              style={{
                fontSize: '8px',
                fontWeight: 800,
                letterSpacing: '0.45em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.3)',
                margin: '3px 0 0',
              }}
            >
              10-Module Path
            </p>
          </div>
          {/* Rotating yantra glyph */}
          <span
            style={{
              fontSize: '18px',
              color: '#D4AF37',
              filter: 'drop-shadow(0 0 8px rgba(212,175,55,0.5))',
              animation: 'sqiSpin 20s linear infinite',
            }}
          >
            🧭
          </span>
        </div>

        {/* Modules list */}
        <div
          style={{
            flexGrow: 1,
            overflowY: 'auto',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          {MODULES.map((module) => {
            const isCompleted = module.id < currentModule;
            const isCurrent = module.id === currentModule;
            const isAvailable = isMasterUnlocked || isCompleted || isCurrent;
            return (
              <ModuleButton
                key={module.id}
                module={module}
                isCurrent={isCurrent}
                isCompleted={isCompleted}
                isAvailable={isAvailable}
                onClick={() => handleModuleClick(module.id)}
              />
            );
          })}
        </div>

        {/* Dev tools — admin panel preserved */}
        <div
          style={{
            padding: '12px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <p
            style={{
              fontSize: '8px',
              fontWeight: 800,
              letterSpacing: '0.45em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.2)',
              marginBottom: '8px',
            }}
          >
            Dev Tools
          </p>
          <button
            onClick={() => setIsMasterUnlocked((v) => !v)}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '14px',
              fontSize: '9px',
              fontWeight: 800,
              letterSpacing: '0.35em',
              textTransform: 'uppercase',
              border: `1px solid ${
                isMasterUnlocked
                  ? 'rgba(212,175,55,0.4)'
                  : 'rgba(255,255,255,0.06)'
              }`,
              background: isMasterUnlocked
                ? 'rgba(212,175,55,0.12)'
                : 'rgba(255,255,255,0.03)',
              color: isMasterUnlocked ? '#D4AF37' : 'rgba(255,255,255,0.35)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {isMasterUnlocked ? '🔓 Lock Course' : '🔒 Unlock All'}
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 14px',
            flexShrink: 0,
            background:
              'linear-gradient(135deg, rgba(212,175,55,0.08) 0%, rgba(255,255,255,0.02) 100%)',
            borderBottom: '1px solid rgba(212,175,55,0.12)',
            flexShrink: 0,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          {/* Mobile hamburger */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden"
            style={{
              color: 'rgba(255,255,255,0.6)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
              padding: '4px',
            }}
          >
            ☰
          </button>

          {/* Avatar + title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '14px',
                background: 'rgba(212,175,55,0.12)',
                border: '1px solid rgba(212,175,55,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                boxShadow: '0 0 20px rgba(212,175,55,0.15)',
              }}
            >
              🕉
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                <span
                  style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: '17px',
                    fontWeight: 900,
                    letterSpacing: '-0.03em',
                    color: '#fff',
                  }}
                >
                  Vastu
                </span>
                <span
                  style={{
                    fontFamily: 'Georgia, serif',
                    fontSize: '13px',
                    fontWeight: 300,
                    fontStyle: 'italic',
                    color: '#D4AF37',
                    textShadow: '0 0 12px rgba(212,175,55,0.4)',
                  }}
                >
                  Abundance Architect
                </span>
              </div>
              <p
                style={{
                  fontSize: '8px',
                  fontWeight: 800,
                  letterSpacing: '0.45em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.3)',
                  margin: 0,
                }}
              >
                Conscious Space Design
              </p>
            </div>
          </div>

          {/* Module badge */}
          <div style={{ textAlign: 'right' }} className="hidden sm:block">
            <p
              style={{
                fontSize: '8px',
                fontWeight: 800,
                letterSpacing: '0.45em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.3)',
                margin: '0 0 2px',
              }}
            >
              Module
            </p>
            <p
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '20px',
                fontWeight: 900,
                color: '#D4AF37',
                margin: 0,
                lineHeight: 1,
                textShadow: '0 0 20px rgba(212,175,55,0.5)',
              }}
            >
              {currentModule}{' '}
              <span style={{ fontSize: '13px', opacity: 0.5 }}>/ 10</span>
            </p>
          </div>
        </div>

        {/* Chat window — passes through, styled inside VastuChat */}
        <div style={{ flex: 1, minHeight: 0 }}>
          <VastuChatWindow
            messages={messages}
            onSendMessage={handleSendMessage}
            isThinking={isThinking}
          />
        </div>
      </div>

    </div>
  );
};
