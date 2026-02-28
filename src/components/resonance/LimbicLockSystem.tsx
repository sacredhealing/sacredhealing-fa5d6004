/**
 * SACRED HEALING — LIMBIC LOCK SYSTEM v1.0
 * 
 * Creates an immersive environmental lock that anchors consciousness
 * to the present moment. Five sensory themes with full CSS injection.
 * 
 * Components:
 *   LimbicLockProvider   — React Context + localStorage persistence
 *   LimbicLockPanel      — Main UI: lock/unlock, theme selector, timer
 *   LimbicStatusBadge    — Floating indicator showing active lock
 *   LimbicManualModal    — 5-step manual guide overlay
 *   EnvironmentalOverlay — CSS theme injector
 *   GoldenSeal           — Animated sacred geometry seal
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from 'react';

// ─────────────────────────────────────────────
// 1. TYPES
// ─────────────────────────────────────────────

export type LimbicTheme =
  | 'ocean'
  | 'forest'
  | 'cosmos'
  | 'flame'
  | 'crystal';

export interface LimbicLockState {
  isLocked: boolean;
  theme: LimbicTheme;
  lockedAt: number | null;  // timestamp ms
  intention: string;
}

export interface LimbicLockContextValue {
  state: LimbicLockState;
  lock: (theme: LimbicTheme, intention?: string) => void;
  unlock: () => void;
  setTheme: (theme: LimbicTheme) => void;
  elapsedSeconds: number;
}

// ─────────────────────────────────────────────
// 2. CONTEXT
// ─────────────────────────────────────────────

const LimbicLockContext = createContext<LimbicLockContextValue | null>(null);

export function useLimbicLock(): LimbicLockContextValue {
  const ctx = useContext(LimbicLockContext);
  if (!ctx) throw new Error('useLimbicLock must be used inside LimbicLockProvider');
  return ctx;
}

// ─────────────────────────────────────────────
// 3. THEME DEFINITIONS
// ─────────────────────────────────────────────

const THEMES: Record<LimbicTheme, {
  label: string;
  emoji: string;
  bg: string;
  accent: string;
  glow: string;
  cssVars: string;
}> = {
  ocean: {
    label: 'Ocean Depths',
    emoji: '🌊',
    bg: '#001a2e',
    accent: '#00c8ff',
    glow: 'rgba(0,200,255,0.25)',
    cssVars: `
      --ll-bg: #001a2e;
      --ll-accent: #00c8ff;
      --ll-glow: rgba(0,200,255,0.3);
      --ll-text: #b0e8ff;
      --ll-surface: rgba(0,60,100,0.6);
    `,
  },
  forest: {
    label: 'Sacred Forest',
    emoji: '🌿',
    bg: '#0a1a0a',
    accent: '#4caf50',
    glow: 'rgba(76,175,80,0.25)',
    cssVars: `
      --ll-bg: #0a1a0a;
      --ll-accent: #4caf50;
      --ll-glow: rgba(76,175,80,0.3);
      --ll-text: #b8f0b8;
      --ll-surface: rgba(10,50,10,0.6);
    `,
  },
  cosmos: {
    label: 'Cosmic Void',
    emoji: '✨',
    bg: '#05001a',
    accent: '#9c27b0',
    glow: 'rgba(156,39,176,0.25)',
    cssVars: `
      --ll-bg: #05001a;
      --ll-accent: #9c27b0;
      --ll-glow: rgba(156,39,176,0.3);
      --ll-text: #e1b8f0;
      --ll-surface: rgba(40,0,80,0.6);
    `,
  },
  flame: {
    label: 'Sacred Flame',
    emoji: '🔥',
    bg: '#1a0500',
    accent: '#ff6b00',
    glow: 'rgba(255,107,0,0.25)',
    cssVars: `
      --ll-bg: #1a0500;
      --ll-accent: #ff6b00;
      --ll-glow: rgba(255,107,0,0.3);
      --ll-text: #ffd0a0;
      --ll-surface: rgba(80,20,0,0.6);
    `,
  },
  crystal: {
    label: 'Crystal Grid',
    emoji: '💎',
    bg: '#0a0a1a',
    accent: '#d4af37',
    glow: 'rgba(212,175,55,0.25)',
    cssVars: `
      --ll-bg: #0a0a1a;
      --ll-accent: #d4af37;
      --ll-glow: rgba(212,175,55,0.3);
      --ll-text: #fff0c0;
      --ll-surface: rgba(40,35,0,0.6);
    `,
  },
};

// ─────────────────────────────────────────────
// 4. PROVIDER
// ─────────────────────────────────────────────

const STORAGE_KEY = 'sacred_limbic_lock';

function loadState(): LimbicLockState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { isLocked: false, theme: 'crystal', lockedAt: null, intention: '' };
}

function saveState(s: LimbicLockState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
}

export function LimbicLockProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LimbicLockState>(loadState);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sync elapsed timer
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (state.isLocked && state.lockedAt) {
      const tick = () => {
        setElapsedSeconds(Math.floor((Date.now() - state.lockedAt!) / 1000));
      };
      tick();
      timerRef.current = setInterval(tick, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [state.isLocked, state.lockedAt]);

  const lock = useCallback((theme: LimbicTheme, intention = '') => {
    const next: LimbicLockState = { isLocked: true, theme, lockedAt: Date.now(), intention };
    setState(next);
    saveState(next);
  }, []);

  const unlock = useCallback(() => {
    const next: LimbicLockState = { ...state, isLocked: false, lockedAt: null };
    setState(next);
    saveState(next);
  }, [state]);

  const setTheme = useCallback((theme: LimbicTheme) => {
    setState(prev => {
      const next = { ...prev, theme };
      saveState(next);
      return next;
    });
  }, []);

  return (
    <LimbicLockContext.Provider value={{ state, lock, unlock, setTheme, elapsedSeconds }}>
      <EnvironmentalOverlay theme={state.theme} active={state.isLocked} />
      {children}
    </LimbicLockContext.Provider>
  );
}

// ─────────────────────────────────────────────
// 5. ENVIRONMENTAL OVERLAY (CSS injector)
// ─────────────────────────────────────────────

function EnvironmentalOverlay({ theme, active }: { theme: LimbicTheme; active: boolean }) {
  useEffect(() => {
    const styleId = 'limbic-lock-theme';
    let el = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!el) {
      el = document.createElement('style');
      el.id = styleId;
      document.head.appendChild(el);
    }
    const t = THEMES[theme];
    if (active) {
      el.textContent = `
        :root { ${t.cssVars} }
        body {
          background: var(--ll-bg) !important;
          transition: background 1.2s ease;
        }
        .limbic-active-glow {
          box-shadow: 0 0 40px var(--ll-glow), 0 0 80px var(--ll-glow) !important;
        }
      `;
    } else {
      el.textContent = '';
    }
    return () => { if (el) el.textContent = ''; };
  }, [theme, active]);
  return null;
}

// ─────────────────────────────────────────────
// 6. GOLDEN SEAL (animated sacred geometry)
// ─────────────────────────────────────────────

export function GoldenSeal({ size = 80, theme }: { size?: number; theme?: LimbicTheme }) {
  const t = THEMES[theme || 'crystal'];
  return (
    <div style={{
      width: size, height: size,
      position: 'relative',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Outer ring */}
      <div style={{
        position: 'absolute', inset: 0,
        borderRadius: '50%',
        border: `2px solid ${t.accent}`,
        animation: 'll-spin-slow 22s linear infinite',
        opacity: 0.7,
      }} />
      {/* Middle ring */}
      <div style={{
        position: 'absolute', inset: size * 0.1, 
        borderRadius: '50%',
        border: `1px solid ${t.accent}`,
        animation: 'll-spin-slow 15s linear infinite reverse',
        opacity: 0.5,
      }} />
      {/* Inner ring */}
      <div style={{
        position: 'absolute', inset: size * 0.22,
        borderRadius: '50%',
        border: `1px solid ${t.accent}`,
        animation: 'll-spin-slow 8s linear infinite',
        opacity: 0.9,
      }} />
      {/* Core dot */}
      <div style={{
        width: size * 0.15, height: size * 0.15,
        borderRadius: '50%',
        background: t.accent,
        boxShadow: `0 0 ${size * 0.2}px ${t.glow}, 0 0 ${size * 0.4}px ${t.glow}`,
        animation: 'll-pulse 2.5s ease-in-out infinite',
      }} />
      <style>{`
        @keyframes ll-spin-slow { to { transform: rotate(360deg); } }
        @keyframes ll-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────
// 7. FORMAT ELAPSED TIME
// ─────────────────────────────────────────────

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

// ─────────────────────────────────────────────
// 8. LIMBIC LOCK PANEL (main UI)
// ─────────────────────────────────────────────

export function LimbicLockPanel() {
  const { state, lock, unlock, setTheme, elapsedSeconds } = useLimbicLock();
  const [intention, setIntention] = useState(state.intention);
  const [showConfirm, setShowConfirm] = useState(false);
  const t = THEMES[state.theme];

  const handleLock = () => {
    lock(state.theme, intention);
  };

  const handleUnlock = () => {
    if (state.isLocked) {
      setShowConfirm(true);
    } else {
      unlock();
    }
  };

  return (
    <div style={{
      background: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(20px)',
      border: `1px solid ${t.accent}40`,
      borderRadius: 20,
      padding: 24,
      maxWidth: 400,
      margin: '0 auto',
      color: t.text || '#fff',
      fontFamily: 'inherit',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <GoldenSeal size={64} theme={state.theme} />
        <h2 style={{ margin: '12px 0 4px', fontSize: 18, color: t.accent, letterSpacing: 2 }}>
          LIMBIC LOCK
        </h2>
        <p style={{ margin: 0, fontSize: 12, opacity: 0.6 }}>
          {state.isLocked ? `🔒 Anchored · ${formatTime(elapsedSeconds)}` : '🔓 Unlocked'}
        </p>
      </div>

      {/* Theme selector */}
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 11, opacity: 0.5, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
          Environment
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(Object.keys(THEMES) as LimbicTheme[]).map(th => (
            <button
              key={th}
              onClick={() => setTheme(th)}
              style={{
                padding: '6px 12px',
                borderRadius: 20,
                border: `1px solid ${state.theme === th ? THEMES[th].accent : 'rgba(255,255,255,0.15)'}`,
                background: state.theme === th ? `${THEMES[th].accent}20` : 'transparent',
                color: state.theme === th ? THEMES[th].accent : 'rgba(255,255,255,0.6)',
                fontSize: 12,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {THEMES[th].emoji} {THEMES[th].label}
            </button>
          ))}
        </div>
      </div>

      {/* Intention input */}
      {!state.isLocked && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 11, opacity: 0.5, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
            Intention (optional)
          </p>
          <input
            value={intention}
            onChange={e => setIntention(e.target.value)}
            placeholder="Set your intention for this session..."
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${t.accent}40`,
              borderRadius: 10,
              padding: '10px 14px',
              color: '#fff',
              fontSize: 13,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      )}

      {/* Intention display when locked */}
      {state.isLocked && state.intention && (
        <div style={{
          background: `${t.accent}10`,
          border: `1px solid ${t.accent}30`,
          borderRadius: 10,
          padding: '10px 14px',
          marginBottom: 16,
          fontSize: 13,
          fontStyle: 'italic',
          opacity: 0.8,
        }}>
          "{state.intention}"
        </div>
      )}

      {/* Lock / Unlock button */}
      <button
        onClick={state.isLocked ? handleUnlock : handleLock}
        style={{
          width: '100%',
          padding: '14px 0',
          borderRadius: 12,
          border: 'none',
          background: state.isLocked
            ? 'rgba(255,255,255,0.1)'
            : `linear-gradient(135deg, ${t.accent}, ${t.accent}cc)`,
          color: state.isLocked ? 'rgba(255,255,255,0.7)' : '#000',
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: 1,
          cursor: 'pointer',
          transition: 'all 0.3s',
        }}
      >
        {state.isLocked ? '🔓 Release the Lock' : '🔒 Anchor to This Moment'}
      </button>

      {/* Confirm unlock modal */}
      {showConfirm && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999,
        }}>
          <div style={{
            background: '#111',
            border: `1px solid ${t.accent}40`,
            borderRadius: 20,
            padding: 32,
            maxWidth: 320,
            textAlign: 'center',
          }}>
            <GoldenSeal size={56} theme={state.theme} />
            <h3 style={{ color: t.accent, margin: '16px 0 8px' }}>Release Anchor?</h3>
            <p style={{ opacity: 0.6, fontSize: 13, marginBottom: 20 }}>
              You've been anchored for {formatTime(elapsedSeconds)}. Release the lock and throw it into the ocean.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowConfirm(false)}
                style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', cursor: 'pointer' }}
              >
                Stay Anchored
              </button>
              <button
                onClick={() => { unlock(); setShowConfirm(false); }}
                style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', background: t.accent, color: '#000', fontWeight: 700, cursor: 'pointer' }}
              >
                Release 🌊
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// 9. LIMBIC STATUS BADGE (floating indicator)
// ─────────────────────────────────────────────

export function LimbicStatusBadge() {
  const { state, elapsedSeconds } = useLimbicLock();
  if (!state.isLocked) return null;
  const t = THEMES[state.theme];

  return (
    <div style={{
      position: 'fixed',
      bottom: 80,
      right: 16,
      zIndex: 1000,
      background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(12px)',
      border: `1px solid ${t.accent}60`,
      borderRadius: 40,
      padding: '8px 14px',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      boxShadow: `0 0 20px ${t.glow}`,
      cursor: 'default',
      userSelect: 'none',
    }}>
      <div style={{
        width: 8, height: 8,
        borderRadius: '50%',
        background: t.accent,
        boxShadow: `0 0 6px ${t.accent}`,
        animation: 'll-pulse 2s ease-in-out infinite',
      }} />
      <span style={{ fontSize: 11, color: t.accent, fontWeight: 600, letterSpacing: 1 }}>
        {t.emoji} {formatTime(elapsedSeconds)}
      </span>
      <style>{`
        @keyframes ll-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────
// 10. LIMBIC MANUAL MODAL (5-step guide)
// ─────────────────────────────────────────────

const MANUAL_STEPS = [
  {
    icon: '🧘',
    title: 'Ground Your Body',
    body: 'Feel the weight of your body. Press your feet into the floor. Take 3 slow breaths.',
  },
  {
    icon: '👁️',
    title: 'Soften Your Gaze',
    body: 'Allow your eyes to relax. Let peripheral vision expand. You are safe.',
  },
  {
    icon: '🌊',
    title: 'Choose Your Environment',
    body: 'Select the elemental theme that calls to you. Let it wash over your senses.',
  },
  {
    icon: '🔒',
    title: 'Set Your Intention',
    body: 'Whisper or type what you wish to anchor into this moment. Make it simple.',
  },
  {
    icon: '✨',
    title: 'Activate the Lock',
    body: 'Press Anchor to This Moment. Feel the seal close around your awareness.',
  },
];

export function LimbicManualModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const t = THEMES['crystal'];

  return (
    <>
      <button
        onClick={() => { setOpen(true); setStep(0); }}
        style={{
          position: 'fixed',
          top: 16,
          right: 16,
          zIndex: 1001,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(212,175,55,0.3)',
          borderRadius: 30,
          padding: '6px 14px',
          color: '#d4af37',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: 1,
          cursor: 'pointer',
          textTransform: 'uppercase',
        }}
      >
        ☽ How to Use
      </button>

      {open && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.9)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9998,
          padding: 16,
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #0a0a1a, #050510)',
            border: '1px solid rgba(212,175,55,0.2)',
            borderRadius: 24,
            padding: 32,
            maxWidth: 380,
            width: '100%',
            textAlign: 'center',
          }}>
            {/* Progress dots */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 24 }}>
              {MANUAL_STEPS.map((_, i) => (
                <div key={i} style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: i === step ? '#d4af37' : 'rgba(212,175,55,0.25)',
                  transition: 'background 0.3s',
                }} />
              ))}
            </div>

            <div style={{ fontSize: 48, marginBottom: 16 }}>{MANUAL_STEPS[step].icon}</div>
            <h3 style={{ color: '#d4af37', margin: '0 0 12px', fontSize: 18, letterSpacing: 1 }}>
              {MANUAL_STEPS[step].title}
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
              {MANUAL_STEPS[step].body}
            </p>

            <div style={{ display: 'flex', gap: 12 }}>
              {step > 0 && (
                <button
                  onClick={() => setStep(s => s - 1)}
                  style={{ flex: 1, padding: '11px 0', borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}
                >
                  ← Back
                </button>
              )}
              {step < MANUAL_STEPS.length - 1 ? (
                <button
                  onClick={() => setStep(s => s + 1)}
                  style={{ flex: 1, padding: '11px 0', borderRadius: 12, border: 'none', background: '#d4af37', color: '#000', fontWeight: 700, cursor: 'pointer' }}
                >
                  Next →
                </button>
              ) : (
                <button
                  onClick={() => setOpen(false)}
                  style={{ flex: 1, padding: '11px 0', borderRadius: 12, border: 'none', background: '#d4af37', color: '#000', fontWeight: 700, cursor: 'pointer' }}
                >
                  Begin ✨
                </button>
              )}
            </div>

            <button
              onClick={() => setOpen(false)}
              style={{ marginTop: 16, background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 12 }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────
// 11. DEFAULT EXPORT (convenience bundle)
// ─────────────────────────────────────────────

export default {
  LimbicLockProvider,
  LimbicLockPanel,
  LimbicStatusBadge,
  LimbicManualModal,
  GoldenSeal,
  useLimbicLock,
  THEMES,
};
