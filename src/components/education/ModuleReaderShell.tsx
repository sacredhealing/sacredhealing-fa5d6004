import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronDown, Lock, Check } from 'lucide-react';
import { fade, white, teal, READER_TYPE, type RailModule, type ContentBlock } from './tokens';
import EducationKeyframes from './EducationKeyframes';

export interface ModuleReaderShellProps {
  /** rgba token for this academy's category, e.g. teal(0.9) from tokens.ts */
  accent: string;
  academyName: string;
  academyHref: string;
  moduleNumber: number;
  totalModules: number;
  moduleTitle: string;
  /** One-sentence thesis/objective, shown in italic under the title */
  thesis?: string;
  progressLabel: string;   // "68 / 108 modules · 63%"
  progressPercent: number; // 0-100, academy-wide (not this module alone)
  railItems: RailModule[];
  contentBlocks: ContentBlock[];
  /** True if this module is beyond the user's current tier */
  locked?: boolean;
  lockedCta?: React.ReactNode;
  onMarkComplete: () => void;
  markingComplete?: boolean;
  isComplete?: boolean;
  prevHref?: string | null;
  nextHref?: string | null;
  /** Slot for academy-specific extras (bookmark button, notes box, audio player) */
  headerExtra?: React.ReactNode;
  footerExtra?: React.ReactNode;
}

/**
 * ModuleReaderShell — the single template every academy's module page
 * renders through. Only `accent`, the copy, and the data change per
 * academy; the structure, fonts, spacing, and progress UI never do.
 *
 * Typography follows tokens.READER_TYPE: ~20px Cormorant Garamond body,
 * 1.75 line-height, 62ch measure — see tokens.ts for the readability
 * research behind those numbers.
 */
export default function ModuleReaderShell({
  accent,
  academyName,
  academyHref,
  moduleNumber,
  totalModules,
  moduleTitle,
  thesis,
  progressLabel,
  progressPercent,
  railItems,
  contentBlocks,
  locked = false,
  lockedCta,
  onMarkComplete,
  markingComplete = false,
  isComplete = false,
  prevHref,
  nextHref,
  headerExtra,
  footerExtra,
}: ModuleReaderShellProps) {
  const navigate = useNavigate();
  const [railOpen, setRailOpen] = useState(false);

  const acFaint = fade(accent, 0.1);
  const acGlow = fade(accent, 0.22);
  const acBorder = fade(accent, 0.42);

  const rail = (
    <>
      {railItems.map((m) => {
        const isDone = m.state === 'done';
        const isCurrent = m.state === 'current';
        const isLocked = m.state === 'locked';
        const isClickable = !isLocked;
        const dotBg = isDone ? teal(0.16) : isCurrent ? fade(accent, 0.16) : 'rgba(255,255,255,.04)';
        const dotBorder = isDone ? teal(0.5) : isCurrent ? fade(accent, 0.6) : 'rgba(255,255,255,.08)';
        const dotColor = isDone ? teal(0.95) : isCurrent ? accent : isLocked ? 'rgba(255,255,255,.3)' : white(0.4);
        const textColor = isCurrent ? white(0.95) : isLocked ? white(0.3) : white(0.6);
        return (
          <div
            key={m.id}
            onClick={() => isClickable && navigate(m.href)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 14,
              background: isCurrent ? fade(accent, 0.08) : 'transparent',
              marginBottom: 2, cursor: isClickable ? 'pointer' : 'default',
            }}
          >
            <div style={{
              width: 22, height: 22, borderRadius: '50%', background: dotBg, border: `1.5px solid ${dotBorder}`,
              color: dotColor, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9, fontWeight: 800, flexShrink: 0,
            }}>
              {isDone ? <Check size={11} /> : isLocked ? <Lock size={10} /> : m.number}
            </div>
            <span style={{ fontSize: 12.5, fontWeight: isCurrent ? 800 : 600, color: textColor }}>{m.title}</span>
          </div>
        );
      })}
    </>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#050505', color: white(0.9), paddingBottom: 120 }}>
      <EducationKeyframes />

      {/* STICKY TOP BAR */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid rgba(255,255,255,.06)',
        background: 'rgba(5,5,5,.9)', backdropFilter: 'blur(40px)', padding: '14px 16px',
      }}>
        <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <button
            onClick={() => navigate(academyHref)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,.04)',
              border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, padding: '8px 12px',
              color: white(0.6), fontSize: 11, fontWeight: 700, cursor: 'pointer',
            }}
          >
            <ChevronLeft size={14} /> {academyName}
          </button>
          <span style={{ fontSize: 10, fontWeight: 800, color: fade(accent, 0.85) }}>
            {progressLabel}
          </span>
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '20px 16px 0' }}>

        {/* MODULE HEADER — same visual grammar as the hub's HeroCard */}
        <div style={{ position: 'relative', marginBottom: 20, animation: 'sqFadeUp .45s ease both' }}>
          <div aria-hidden style={{
            position: 'absolute', inset: -16, borderRadius: 34, filter: 'blur(22px)',
            background: `radial-gradient(50% 50% at 30% 40%, ${acGlow}, transparent 65%)`,
            animation: 'sqGlowPulse 4s ease-in-out infinite', pointerEvents: 'none', zIndex: 0,
          }} />
          <div style={{
            position: 'relative', zIndex: 1, borderRadius: 22, padding: '22px 20px 20px', overflow: 'hidden',
            background: `linear-gradient(135deg, ${acFaint}, rgba(5,5,5,0.72))`,
            border: `1px solid ${acBorder}`, boxShadow: `0 0 40px ${acGlow}`,
          }}>
            <div aria-hidden style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 1,
              background: `linear-gradient(90deg,transparent,${fade(accent, 0.85)},transparent)`,
            }} />
            <div style={{ ...READER_TYPE.label, color: fade(accent, 0.65), marginBottom: 6 }}>
              {academyName} · Module {moduleNumber} of {totalModules}
            </div>
            <h1 style={{ ...READER_TYPE.title, color: white(0.97), textShadow: `0 0 20px ${acGlow}`, margin: '0 0 10px' }}>
              {moduleTitle}
            </h1>
            {thesis && <p style={{ ...READER_TYPE.thesis, color: white(0.6), margin: '0 0 14px' }}>{thesis}</p>}

            <div style={{ marginBottom: headerExtra ? 12 : 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: '.25em', textTransform: 'uppercase', color: white(0.4) }}>
                  Academy Progress
                </span>
                <span style={{ fontSize: 10, fontWeight: 800, color: accent }}>{progressLabel}</span>
              </div>
              <div style={{ height: 3, borderRadius: 10, background: 'rgba(255,255,255,.07)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${progressPercent}%`, borderRadius: 10,
                  background: `linear-gradient(90deg,${accent},${fade(accent, 0.6)})`, boxShadow: `0 0 8px ${acGlow}`,
                }} />
              </div>
            </div>
            {headerExtra}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>

          {/* DESKTOP RAIL */}
          <div className="reader-rail-desktop" style={{
            flex: '0 0 220px', position: 'sticky', top: 76,
            background: 'rgba(255,255,255,.015)', border: '1px solid rgba(255,255,255,.06)',
            borderRadius: 20, padding: '14px 10px', display: 'none',
          }}>
            <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: '.25em', textTransform: 'uppercase', color: white(0.35), padding: '4px 10px 10px' }}>
              This Academy
            </div>
            {rail}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>

            {/* MOBILE RAIL — collapsible */}
            <div
              className="reader-rail-mobile"
              style={{ marginBottom: 18, background: 'rgba(255,255,255,.015)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 16, padding: '12px 14px' }}
            >
              <button
                onClick={() => setRailOpen((o) => !o)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  fontSize: 10, fontWeight: 800, letterSpacing: '.15em', textTransform: 'uppercase', color: accent,
                }}
              >
                Module list — tap to browse
                <ChevronDown size={14} style={{ transform: railOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
              </button>
              {railOpen && <div style={{ marginTop: 10 }}>{rail}</div>}
            </div>

            {/* CONTENT — locked or readable */}
            {locked ? (
              <div style={{
                borderRadius: 22, padding: '32px 22px', textAlign: 'center',
                background: `linear-gradient(135deg, ${acFaint}, rgba(5,5,5,.7))`, border: `1px solid ${acBorder}`,
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', margin: '0 auto 14px', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', background: fade(accent, 0.12), border: `1px solid ${acBorder}`,
                }}>
                  <Lock size={18} color={accent} />
                </div>
                <p style={{ ...READER_TYPE.thesis, color: white(0.55), maxWidth: '46ch', margin: '0 auto 18px' }}>
                  This module is part of a higher tier. Unlock it to continue the path.
                </p>
                {lockedCta}
              </div>
            ) : (
              <>
                {contentBlocks.map((block, i) => (
                  <div key={i} style={{ marginBottom: 30 }}>
                    <div style={{ ...READER_TYPE.blockLabel, color: accent, marginBottom: 10 }}>{block.label}</div>
                    {block.title && (
                      <h4 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 14, fontWeight: 800, color: white(0.9), margin: '0 0 10px' }}>
                        {block.title}
                      </h4>
                    )}
                    <p style={{ ...READER_TYPE.body }}>{block.body}</p>
                  </div>
                ))}

                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 36,
                  paddingTop: 20, borderTop: '1px solid rgba(255,255,255,.07)', flexWrap: 'wrap', gap: 12,
                }}>
                  <button
                    disabled={!prevHref}
                    onClick={() => prevHref && navigate(prevHref)}
                    style={{
                      background: 'transparent', border: '1px solid rgba(255,255,255,.12)', color: white(0.5),
                      padding: '11px 18px', borderRadius: 100, fontSize: 11, fontWeight: 700,
                      cursor: prevHref ? 'pointer' : 'default', opacity: prevHref ? 1 : 0.35,
                    }}
                  >
                    ← Previous
                  </button>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      onClick={onMarkComplete}
                      disabled={markingComplete}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 20px', borderRadius: 999,
                        background: isComplete ? teal(0.14) : `linear-gradient(135deg,${acGlow},${fade(accent, 0.07)})`,
                        border: `1px solid ${isComplete ? teal(0.4) : acBorder}`,
                        color: isComplete ? teal(0.95) : fade(accent, 0.98),
                        fontSize: 11, fontWeight: 800, letterSpacing: '.15em', textTransform: 'uppercase', cursor: 'pointer',
                      }}
                    >
                      {isComplete ? <><Check size={13} /> Completed</> : markingComplete ? 'Saving…' : 'Mark Complete'}
                    </button>
                    {nextHref && (
                      <button
                        onClick={() => navigate(nextHref)}
                        style={{
                          background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', color: white(0.7),
                          padding: '11px 18px', borderRadius: 100, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                        }}
                      >
                        Next →
                      </button>
                    )}
                  </div>
                </div>
                {footerExtra}
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 860px) {
          .reader-rail-desktop { display: block !important; }
          .reader-rail-mobile { display: none !important; }
        }
      `}</style>
    </div>
  );
}
