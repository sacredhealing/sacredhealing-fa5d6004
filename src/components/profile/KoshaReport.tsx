/* SQI 2050: KOSHA RESONANCE REPORT */
import React from 'react';

interface KoshaResult {
  name: string;
  layer: string;
  result: string;
}

interface KoshaReportProps {
  sessionData?: {
    practice?: string;
    duration?: string | number | null;
    koshas?: Partial<Record<string, string>>;
  };
  onSave?: () => void;
}

const KoshaReport: React.FC<KoshaReportProps> = ({ sessionData, onSave }) => {
  const defaultKoshas: KoshaResult[] = [
    { name: 'ANNAMAYA', layer: 'Physical Body', result: 'Bio-Signature Locked' },
    { name: 'PRANAMAYA', layer: 'Energy/Nadi', result: '41,760 / 72,000 Channels Aligned' },
    { name: 'MANOMAYA', layer: 'Mind & Emotions', result: 'Frequency Stabilized' },
    { name: 'VIJNANAMAYA', layer: 'Past Lives & Intellect', result: 'Karmic Decryption Complete' },
    { name: 'ANANDAMAYA', layer: 'Soul & Bliss', result: '98% Samadhi Sync' },
  ];

  const koshas = defaultKoshas.map((k) => ({
    ...k,
    result: sessionData?.koshas?.[k.name] ?? k.result,
  }));

  return (
    <div className="w-full bg-[#050505] rounded-[40px] border border-[#D4AF37]/20 p-8 backdrop-blur-3xl">
      <div className="text-center mb-8">
        <h3 className="text-[#D4AF37] text-xl font-black tracking-tighter uppercase italic">Resonance Report</h3>
        <p className="text-white/20 text-[8px] font-black tracking-[0.4em] uppercase mt-1">Deep-Field Mapping 2050.4</p>
      </div>

      <div className="space-y-4">
        {koshas.map((k, i) => (
          <div key={i} className="group p-5 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-[#D4AF37]/30 transition-all">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[#D4AF37] text-[10px] font-black tracking-widest italic">{k.name}</span>
              <span className="text-white/20 text-[7px] uppercase font-mono">{k.layer}</span>
            </div>
            <p className="text-white text-xs font-bold">{k.result}</p>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onSave}
        className="w-full mt-8 py-4 rounded-2xl bg-white/[0.05] border border-white/10 text-white/40 text-[9px] font-black uppercase tracking-widest hover:text-white transition-all"
      >
        Save to Soul Vault
      </button>
    </div>
  );
};

export default KoshaReport;
