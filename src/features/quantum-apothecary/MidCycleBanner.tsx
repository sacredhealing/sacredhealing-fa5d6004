// MidCycleBanner — SQI 2050
// Shows inside Quantum Apothecary when any active transmission hits its midpoint.
// This is the conscious re-anchoring trigger — mirrors Limbic Arc's intermittent app triggers.
// Dismissed per-session via sessionStorage. Never blocks the user.
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap } from 'lucide-react';
import type { Activation } from '@/features/quantum-apothecary/types';
import { useMidCycleTrigger } from '@/hooks/useMidCycleTrigger';

interface Props {
  activeTransmissions: Activation[];
}

const DISMISS_KEY = 'sqi_midcycle_dismissed';

function getDismissed(): Set<string> {
  try {
    const raw = sessionStorage.getItem(DISMISS_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch { return new Set(); }
}

function addDismissed(id: string) {
  try {
    const set = getDismissed();
    set.add(id);
    sessionStorage.setItem(DISMISS_KEY, JSON.stringify([...set]));
  } catch {}
}

export default function MidCycleBanner({ activeTransmissions }: Props) {
  const triggers = useMidCycleTrigger(activeTransmissions);
  const [dismissed, setDismissed] = useState<Set<string>>(getDismissed);

  // Filter to undismissed triggers
  const visible = triggers.filter(t => !dismissed.has(t.activation.id ?? t.activation.name));

  if (visible.length === 0) return null;

  const primary = visible[0];
  const act = primary.activation;
  const c = act.color || '#D4AF37';
  const isExpiring = primary.daysRemaining <= 2;

  const dismiss = () => {
    const key = act.id ?? act.name;
    addDismissed(key);
    setDismissed(prev => new Set([...prev, key]));
  };

  return (
    <AnimatePresence>
      <motion.div
        key={act.id}
        initial={{ opacity: 0, y: -10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -6, scale: 0.97 }}
        transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
        style={{
          position: 'relative',
          marginBottom: 16,
          padding: '14px 16px',
          borderRadius: 20,
          background: isExpiring
            ? 'rgba(251,146,60,0.06)'
            : 'rgba(212,175,55,0.05)',
          border: `1px solid ${isExpiring ? 'rgba(251,146,60,0.25)' : 'rgba(212,175,55,0.18)'}`,
          backdropFilter: 'blur(20px)',
          overflow: 'hidden',
        }}
      >
        {/* Shimmer line top */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          background: `linear-gradient(90deg, transparent, ${isExpiring ? 'rgba(251,146,60,0.4)' : 'rgba(212,175,55,0.3)'}, transparent)`,
        }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          {/* Icon */}
          <div style={{
            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
            background: `${c}15`, border: `1px solid ${c}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Zap size={14} style={{ color: isExpiring ? '#FB923C' : '#D4AF37' }} />
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontSize: 10, fontWeight: 900, letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: isExpiring ? '#FB923C' : '#D4AF37',
              marginBottom: 4,
            }}>
              {isExpiring ? 'Field Completing Soon' : 'Mid-Cycle Anchor Point'}
            </p>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.88)', marginBottom: 4, lineHeight: 1.4 }}>
              {act.name}
            </p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
              {isExpiring
                ? `${primary.daysRemaining} day${primary.daysRemaining !== 1 ? 's' : ''} remaining — bring your awareness to this field now to complete the cycle.`
                : `Day ${primary.daysActive} of ${primary.totalDays} — your field is at midpoint. Return your conscious attention to this transmission now.`
              }
            </p>

            {/* Pulse dots — visual re-anchor cue */}
            <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
              {Array.from({ length: primary.totalDays }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: Math.max(3, Math.min(6, 240 / primary.totalDays)),
                    height: 3,
                    borderRadius: 2,
                    background: i < primary.daysActive
                      ? (isExpiring ? '#FB923C' : '#D4AF37')
                      : 'rgba(255,255,255,0.1)',
                    transition: 'background 0.3s',
                  }}
                />
              ))}
            </div>
            <p style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginTop: 5 }}>
              Field duration progress
            </p>
          </div>

          {/* Dismiss */}
          <button
            type="button"
            onClick={dismiss}
            style={{
              flexShrink: 0, width: 22, height: 22, borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(255,255,255,0.03)',
              color: 'rgba(255,255,255,0.3)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={10} />
          </button>
        </div>

        {/* Multiple triggers indicator */}
        {visible.length > 1 && (
          <p style={{
            marginTop: 8, fontSize: 9, fontWeight: 700, letterSpacing: '0.2em',
            textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)',
            paddingLeft: 44,
          }}>
            +{visible.length - 1} more transmission{visible.length - 1 !== 1 ? 's' : ''} at anchor point
          </p>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
