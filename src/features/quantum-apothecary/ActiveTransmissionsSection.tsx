// ╔══════════════════════════════════════════════════════════════════╗
// ║  ActiveTransmissionsSection-SQI2050.tsx                        ║
// ║  → src/features/quantum-apothecary/ActiveTransmissionsSection.tsx ║
// ╚══════════════════════════════════════════════════════════════════╝
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ShieldCheck, X } from 'lucide-react';
import type { Activation } from '@/features/quantum-apothecary/types';
import { useTranslation } from '@/hooks/useTranslation';

interface Props {
  activeTransmissions: Activation[];
  setActiveTransmissions: React.Dispatch<React.SetStateAction<Activation[]>>;
}

export default function ActiveTransmissionsSection({ activeTransmissions, setActiveTransmissions }: Props) {
  const { t } = useTranslation();
  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      backdropFilter: 'blur(40px)',
      WebkitBackdropFilter: 'blur(40px)',
      border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: 40,
      overflow: 'hidden',
      boxShadow: '0 0 48px rgba(212,175,55,0.05)',
    }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: activeTransmissions.length > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Zap size={14} style={{ color: '#D4AF37', filter: 'drop-shadow(0 0 6px rgba(212,175,55,0.6))' }} />
          <h2 style={{ fontSize: 14, fontWeight: 900, letterSpacing: '-0.05em', color: '#D4AF37', textShadow: '0 0 15px rgba(212,175,55,0.3)' }}>{t('quantumApothecary.activeTransmissionsSection.title')}</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.22)', borderRadius: 100 }}>
          <div style={{ width: 5, height: 5, background: '#22D3EE', borderRadius: '50%', boxShadow: '0 0 8px #22D3EE', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: '0.35em', textTransform: 'uppercase', color: '#22D3EE' }}>{t('quantumApothecary.activeTransmissionsSection.live247')}</span>
        </div>
      </div>

      {/* Transmissions */}
      <div style={{ padding: activeTransmissions.length > 0 ? '12px 16px 16px' : '0', maxHeight: 220, overflowY: 'auto', scrollbarWidth: 'thin' }}>
        {activeTransmissions.length === 0 ? (
          <div style={{ padding: '28px 20px', textAlign: 'center' }}>
            <ShieldCheck size={24} style={{ margin: '0 auto 10px', color: 'rgba(255,255,255,0.1)', display: 'block' }} />
            <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)' }}>{t('quantumApothecary.activeTransmissionsSection.noActive')}</p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.15)', marginTop: 4 }}>{t('quantumApothecary.activeTransmissionsSection.selectHint')}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <AnimatePresence>
              {activeTransmissions.map(act => (
                <motion.div
                  key={act.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10, height: 0, marginBottom: 0 }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 12px',
                    background: `${act.color}08`,
                    border: `1px solid ${act.color}25`,
                    borderRadius: 14,
                    gap: 10,
                  }}
                >
                  {/* Pulsing dot */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: act.color, boxShadow: `0 0 8px ${act.color}` }} />
                    <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: act.color, opacity: 0.4, animation: 'ping 1.5s infinite' }} />
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 800, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{act.name}</p>
                    <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: act.color, opacity: 0.7, marginTop: 1 }}>{t('quantumApothecary.activeTransmissionsSection.transmitting')}</p>
                  </div>

                  {/* Dissolve */}
                  <button
                    onClick={() => setActiveTransmissions(t => t.filter(x => x.id !== act.id))}
                    style={{
                      width: 24, height: 24, borderRadius: '50%',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', color: 'rgba(255,255,255,0.3)',
                      transition: 'all 0.2s', flexShrink: 0,
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.15)'; (e.currentTarget as HTMLElement).style.color = '#f87171'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(239,68,68,0.3)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.3)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; }}
                    title={t('quantumApothecary.activeTransmissionsSection.dissolveTitle')}
                    aria-label={t('quantumApothecary.activeTransmissionsSection.dissolveTitle')}
                  >
                    <X size={11} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <style>{`
        @keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
}
