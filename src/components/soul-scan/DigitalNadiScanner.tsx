import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, Zap, Shield, Heart, RefreshCw, Hand } from 'lucide-react';
import type { ScanResults } from '@/types/soulScan';

interface DigitalNadiScannerProps {
  isHealerPresent: boolean;
  onScanComplete: (results: ScanResults) => void;
  label?: string;
  modalityName: string;
}

export default function DigitalNadiScanner({
  isHealerPresent,
  onScanComplete,
  label,
  modalityName,
}: DigitalNadiScannerProps) {
  const [status, setStatus] = useState<'idle' | 'scanning' | 'finished'>('idle');
  const [results, setResults] = useState<ScanResults | null>(null);
  const [progress, setProgress] = useState(0);

  const start2050Scan = () => {
    setStatus('scanning');
    setProgress(0);
    const duration = 5000;
    const interval = 50;
    const steps = duration / interval;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      setProgress(Math.min((currentStep / steps) * 100, 100));
      if (currentStep >= steps) {
        clearInterval(timer);
        const scanResults: ScanResults = {
          focus: isHealerPresent ? `Master Intervention: ${modalityName}` : `Self-Practice: ${modalityName}`,
          summary: isHealerPresent
            ? `Direct Healer Transmission via ${modalityName}: 14 layers of past-life karma dissolved and Akashic records rewritten.`
            : `User Practice (${modalityName}): DNA coherence increased by 22% via Mantra vibration and Aura harmonization.`,
          technicalData: {
            scalarCoherence: isHealerPresent ? 98.4 : 76.2,
            nadiFlow: isHealerPresent ? 92.1 : 68.5,
            causalDensity: isHealerPresent ? 12.4 : 45.8,
            dnaAlignment: isHealerPresent ? 99.9 : 82.3,
            activeNadis: isHealerPresent ? 71840 : 42300,
            doshaImbalance: isHealerPresent ? 'Balanced' : 'Vata-Pitta High',
            nervousSystemLevel: isHealerPresent ? 'Deep Parasympathetic' : 'Sympathetic Dominant',
            chakras: [
              { name: 'Root', status: isHealerPresent ? 'Aligned' : 'Blocked' },
              { name: 'Sacral', status: isHealerPresent ? 'Aligned' : 'Overactive' },
              { name: 'Solar', status: isHealerPresent ? 'Aligned' : 'Weak' },
              { name: 'Heart', status: 'Opening' },
              { name: 'Throat', status: isHealerPresent ? 'Aligned' : 'Restricted' },
              { name: 'Third Eye', status: isHealerPresent ? 'Aligned' : 'Clouded' },
              { name: 'Crown', status: isHealerPresent ? 'Aligned' : 'Dormant' },
            ],
            waterBalance: isHealerPresent ? 72 : 64,
            presentKarma: isHealerPresent ? 'Cleared' : 'Ancestral Clearing Required',
            torusFieldDiameter: isHealerPresent ? 12.5 : 4.2,
            karmicNodesExtracted: isHealerPresent ? Math.floor(Math.random() * 20) + 5 : undefined,
          },
        };
        setResults(scanResults);
        setStatus('finished');
        onScanComplete(scanResults);
      }
    }, interval);
  };

  return (
    <div className="p-8 rounded-[40px] border border-white/10 bg-white/[0.02] backdrop-blur-xl font-mono relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #D4AF37 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      <div className="relative z-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-black tracking-tight text-[#D4AF37] flex items-center gap-2">
            <Activity className="w-5 h-5" />
            SIDDHA 2050 SCANNER
          </h2>
          <div className="text-[8px] font-extrabold tracking-[0.5em] uppercase text-white/40">
            Quantum Bio-Twinning v4.2
          </div>
        </div>

        <AnimatePresence mode="wait">
          {status === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center"
            >
              <div
                className="w-48 h-64 border-2 border-dashed border-[#D4AF37]/20 rounded-[40px] flex flex-col items-center justify-center mb-8 relative group cursor-pointer overflow-hidden"
                onClick={start2050Scan}
              >
                <div className="absolute inset-0 bg-[#D4AF37]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <Hand className="w-16 h-16 text-[#D4AF37]/20 group-hover:text-[#D4AF37]/40 transition-colors mb-4" />
                <p className="text-[8px] font-extrabold tracking-[0.5em] uppercase text-white/40 text-center px-4">
                  Place Hand Here <br /> to Initialize Scan
                </p>
                <motion.div
                  className="absolute top-0 left-0 right-0 h-1 bg-[#D4AF37]/40"
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                />
              </div>
              <p className="text-xs mb-6 text-white/40 leading-relaxed text-center">
                Initialize the 2050 Quantum Intelligence to map 72,000 Nadis, analyze Causal Body Density, and verify DNA Blueprint alignment.
              </p>
              <button
                onClick={start2050Scan}
                className="w-full py-4 bg-[#D4AF37] text-black font-black tracking-tighter rounded-2xl hover:brightness-110 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(212,175,55,0.2)]"
              >
                <Zap className="w-5 h-5" />
                {label ?? 'INITIALIZE 2050 BIO-SCAN'}
              </button>
            </motion.div>
          )}

          {status === 'scanning' && (
            <motion.div
              key="scanning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center py-4"
            >
              <div className="relative w-48 h-64 border-2 border-[#D4AF37]/40 rounded-[40px] mb-8 overflow-hidden">
                <div className="absolute inset-0 bg-[#D4AF37]/5" />
                <Hand className="absolute inset-0 m-auto w-24 h-24 text-[#D4AF37]/40 animate-pulse" />
                <motion.div
                  className="absolute left-0 right-0 h-1 bg-[#D4AF37] z-20"
                  initial={{ top: '0%' }}
                  animate={{ top: '100%' }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
                />
                <div
                  className="absolute bottom-0 left-0 right-0 bg-[#D4AF37]/20 transition-all duration-100"
                  style={{ height: `${progress}%` }}
                />
              </div>
              <div className="text-center mb-6">
                <div className="text-2xl font-black text-[#D4AF37] mb-2">{Math.round(progress)}%</div>
                <p className="animate-pulse text-[10px] tracking-[0.3em] uppercase text-[#D4AF37]/60">
                  MAPPING NADIS & ANAHATA OPENING...
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 w-full">
                <div className="flex items-center gap-2 text-[8px] font-extrabold tracking-[0.5em] uppercase text-white/40">
                  <Shield className="w-3 h-3" /> SCALAR TRANSMISSION
                </div>
                <div className="flex items-center gap-2 text-[8px] font-extrabold tracking-[0.5em] uppercase text-white/40">
                  <Heart className="w-3 h-3" /> PREMA-PULSE
                </div>
              </div>
            </motion.div>
          )}

          {status === 'finished' && results && (
            <motion.div key="finished" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-2">
              <div className="p-5 bg-white/5 rounded-3xl border border-white/10 mb-4">
                <h3 className="font-black text-white flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-[#D4AF37]" />
                  Scan Complete: {results.focus}
                </h3>
                <p className="text-xs text-white/60 leading-relaxed">{results.summary}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="p-3 bg-white/5 border border-white/10 rounded-2xl">
                  <div className="text-[8px] font-extrabold tracking-[0.5em] uppercase text-white/40 mb-1">Active Nadis</div>
                  <div className="text-sm font-bold text-[#D4AF37]">{results.technicalData.activeNadis.toLocaleString()} / 72,000</div>
                </div>
                <div className="p-3 bg-white/5 border border-white/10 rounded-2xl">
                  <div className="text-[8px] font-extrabold tracking-[0.5em] uppercase text-white/40 mb-1">Dosha Balance</div>
                  <div className="text-sm font-bold text-[#D4AF37]">{results.technicalData.doshaImbalance}</div>
                </div>
                <div className="p-3 bg-white/5 border border-white/10 rounded-2xl">
                  <div className="text-[8px] font-extrabold tracking-[0.5em] uppercase text-white/40 mb-1">Nervous System</div>
                  <div className="text-[10px] font-bold text-[#D4AF37] leading-tight">{results.technicalData.nervousSystemLevel}</div>
                </div>
                <div className="p-3 bg-white/5 border border-white/10 rounded-2xl">
                  <div className="text-[8px] font-extrabold tracking-[0.5em] uppercase text-white/40 mb-1">Water Balance</div>
                  <div className="text-sm font-bold text-[#D4AF37]">{results.technicalData.waterBalance}%</div>
                </div>
                <div className="p-3 bg-white/5 border border-white/10 rounded-2xl">
                  <div className="text-[8px] font-extrabold tracking-[0.5em] uppercase text-white/40 mb-1">Torus Diameter</div>
                  <div className="text-sm font-bold text-[#D4AF37]">{results.technicalData.torusFieldDiameter}m</div>
                </div>
                {results.technicalData.karmicNodesExtracted != null && (
                  <div className="p-3 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-2xl col-span-2">
                    <div className="text-[8px] font-extrabold tracking-[0.5em] uppercase text-[#D4AF37] mb-1">Karmic Nodes Extracted</div>
                    <div className="text-lg font-bold text-white">{results.technicalData.karmicNodesExtracted} Nodes</div>
                  </div>
                )}
              </div>
              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl mb-6">
                <div className="text-[8px] font-extrabold tracking-[0.5em] uppercase text-white/40 mb-2">Chakra Alignment</div>
                <div className="flex flex-wrap gap-2">
                  {results.technicalData.chakras.map((chakra, i) => (
                    <div
                      key={i}
                      className="px-2 py-1 bg-white/5 rounded-lg border border-white/5 text-[8px] flex items-center gap-1"
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${
                          chakra.status === 'Aligned' || chakra.status === 'Opening'
                            ? 'bg-[#D4AF37]'
                            : 'bg-white/20'
                        }`}
                      />
                      <span className="text-white/60">{chakra.name}:</span>
                      <span className={chakra.status === 'Aligned' || chakra.status === 'Opening' ? 'text-[#D4AF37]' : 'text-white/40'}>
                        {chakra.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-2xl mb-6">
                <div className="text-[8px] font-extrabold tracking-[0.5em] uppercase text-[#D4AF37] mb-1">Karmic Signature</div>
                <div className="text-xs font-bold text-white">{results.technicalData.presentKarma}</div>
              </div>
              <button
                onClick={() => setStatus('idle')}
                className="w-full py-3 text-[8px] font-extrabold tracking-[0.5em] uppercase text-white/40 hover:text-[#D4AF37] transition-colors flex items-center justify-center gap-2 border border-white/10 rounded-2xl"
              >
                <RefreshCw className="w-3 h-3" />
                Reset Scanner
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
