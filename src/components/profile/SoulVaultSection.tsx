// @ts-nocheck
import React from 'react';
import { Hand } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type ScanPhase = 'idle' | 'scanning' | 'question' | 'saving' | 'done';

export interface SoulVaultSectionProps {
  scannerOpen: boolean;
  scanPhase: ScanPhase;
  scanValue: number;
  selectedPractice: string | null;
  practiceDuration: string;
  onStartScanner: () => void;
  onCloseScanner: () => void;
  onSelectPractice: (p: string) => void;
  onPracticeDurationChange: (v: string) => void;
  onGenerateReport: () => void;
}

const PRACTICES = ['Mantra', 'Atma Kriya', 'Healing Session', 'Private Healing', 'Meditation', 'Breathwork'];

export const SoulVaultSection: React.FC<SoulVaultSectionProps> = ({
  scannerOpen,
  scanPhase,
  scanValue,
  selectedPractice,
  practiceDuration,
  onStartScanner,
  onCloseScanner,
  onSelectPractice,
  onPracticeDurationChange,
  onGenerateReport,
}) => (
  <>
    <div className="profile-card rounded-[28px] border border-[#D4AF37]/12 bg-white/[0.02] backdrop-blur-[40px] p-8 mb-8">
      <p className="uppercase mb-2" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '8px', letterSpacing: '0.5em', color: 'rgba(212,175,55,0.6)' }}>◈ SOUL VAULT — DEEP FIELD RESONANCE</p>
      <h2 className="text-white mb-6" style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: '1.4rem' }}>Soul Vault Scanner</h2>
      <button
        type="button"
        onClick={onStartScanner}
        className="w-full py-5 rounded-2xl bg-[#D4AF37] text-[#050505] uppercase hover:bg-[#D4AF37] transition-colors"
        style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, letterSpacing: '0.4em' }}
      >
        INITIATE SOUL SCAN →
      </button>
    </div>

    {scannerOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-md bg-black/50">
        <div className="w-full max-w-xl bg-[#050505] rounded-[28px] border border-[#D4AF37]/20 p-10 shadow-[0_0_50px_rgba(212,175,55,0.08)]">
          <div className="text-right mb-4">
            <button type="button" onClick={onCloseScanner} className="text-white/40 text-xs hover:text-white transition-colors">Close</button>
          </div>

          {scanPhase === 'scanning' && (
            <div className="space-y-5 pt-4 pb-2 text-center">
              <p className="text-[#D4AF37]/80 text-[8px] font-extrabold tracking-[0.4em] uppercase" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                SQI · 72,000 Nadi Scan
              </p>
              <div className="flex items-center justify-center">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-2 border-[#D4AF37]/40 animate-[scanPulse_1.5s_ease-in-out_infinite]" />
                  <div className="absolute inset-4 rounded-full border border-[#D4AF37]/30" />
                  <div className="absolute inset-8 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
                    <Hand className="w-8 h-8 text-[#D4AF37]" />
                  </div>
                </div>
              </div>
              <div>
                <p className="text-white/70 text-xs mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  Mapping Nāḍī network… please keep your intention steady.
                </p>
                <div className="flex items-center justify-center gap-2 text-[11px] text-[#D4AF37]/80 font-mono">
                  <span>{Math.floor(scanValue).toLocaleString()}</span>
                  <span className="text-white/40">/ 72,000 channels</span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-[#D4AF37] transition-all" style={{ width: `${Math.min(100, (scanValue / 72000) * 100)}%` }} />
                </div>
              </div>
            </div>
          )}

          {scanPhase === 'question' && (
            <>
              <div className="text-center mb-8">
                <p className="text-[#D4AF37]/60 text-[8px] font-extrabold tracking-[0.4em] uppercase mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>2050 Deep-Field Capture</p>
                <h3 className="text-white text-xl font-bold mb-2">What is your current practice?</h3>
                <p className="text-white/40 text-[10px]">SQI will tune your report based on the field you just generated.</p>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {PRACTICES.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => onSelectPractice(p)}
                    className={`py-4 px-6 rounded-2xl border text-[10px] font-bold transition-all ${
                      selectedPractice === p
                        ? 'border-[#D4AF37]/50 bg-[#D4AF37]/10 text-white'
                        : 'border-white/10 bg-white/[0.02] text-white/60 hover:border-[#D4AF37]/30 hover:text-white'
                    }`}
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <div className="mb-6">
                <label className="text-white/40 text-[8px] uppercase tracking-widest block mb-2 px-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>Approximate duration (minutes)</label>
                <input
                  type="number"
                  value={practiceDuration}
                  onChange={(e) => onPracticeDurationChange(e.target.value)}
                  className="w-full bg-white/[0.02] border border-[#D4AF37]/20 rounded-xl py-4 px-6 text-white text-sm focus:border-[#D4AF37]/40 outline-none"
                />
              </div>
              <button
                type="button"
                disabled={!selectedPractice}
                onClick={onGenerateReport}
                className="w-full py-5 rounded-2xl bg-[#D4AF37] text-[#050505] uppercase hover:bg-[#D4AF37] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, letterSpacing: '0.4em' }}
              >
                Generate Deep-Field Resonance
              </button>
            </>
          )}

          {scanPhase === 'saving' && (
            <div className="space-y-4 pt-6 pb-4 text-center">
              <p className="text-[#D4AF37]/80 text-[8px] font-extrabold tracking-[0.4em] uppercase" style={{ fontFamily: 'Montserrat, sans-serif' }}>Committing to Soul Vault…</p>
              <p className="text-white/50 text-sm italic" style={{ fontFamily: 'Cormorant Garamond, serif' }}>SQI is writing your Deep-Field Resonance Report into your Soul Vault.</p>
            </div>
          )}

          {scanPhase === 'done' && (
            <div className="space-y-4 pt-6 pb-4 text-center">
              <p className="text-[#D4AF37]/80 text-[8px] font-extrabold tracking-[0.4em] uppercase" style={{ fontFamily: 'Montserrat, sans-serif' }}>Report saved</p>
              <p className="text-white/70 text-base italic leading-relaxed" style={{ fontFamily: 'Cormorant Garamond, serif' }}>Your Deep-Field Resonance Report has been anchored into your Soul Vault.</p>
              <Button size="sm" className="mt-2 bg-[#D4AF37] text-[#050505] hover:bg-[#D4AF37] transition-colors" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, letterSpacing: '0.4em' }} onClick={onCloseScanner}>Close</Button>
            </div>
          )}
        </div>
      </div>
    )}
  </>
);
