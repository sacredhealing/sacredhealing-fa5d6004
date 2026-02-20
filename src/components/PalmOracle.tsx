import React, { useMemo } from 'react';

/**
 * Deep Siddha Palm Analysis prompt — do not give general advice.
 * Analyze the three main lines and map to 5 Elements for Siddha Element score.
 */
export const DEEP_PALM_ANALYSIS_PROMPT = `Do not give general advice. Analyze the three main lines:
- **Prana Rekha (Life Line):** Depth indicates the vitality reserve brought from past lives.
- **Dharma Rekha (Heart Line):** Curvature indicates the emotional karmic debt.
- **Buddhi Rekha (Head Line):** Length indicates the mental 'Vasanas' (tendencies) being cleared.
Map these lines to the 5 Elements (Earth, Water, Fire, Air, Ether) and provide a Siddha Element score.`;

const ELEMENTS = ['Earth', 'Water', 'Fire', 'Air', 'Ether'] as const;
type Element = typeof ELEMENTS[number];

/** Deterministic Siddha Element scores from seed (e.g. image hash or timestamp) */
function getSiddhaElementScores(seed: string): Record<Element, number> {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  const r = () => (Math.abs((h = (h * 1103515245 + 12345) | 0) % 100) / 100);
  const raw: number[] = [r(), r(), r(), r(), r()];
  const sum = raw.reduce((a, b) => a + b, 0);
  const norm = raw.map((v) => (sum > 0 ? v / sum : 0.2));
  return ELEMENTS.reduce((acc, el, i) => ({ ...acc, [el]: Math.round(norm[i] * 100) }), {} as Record<Element, number>);
}

export interface PalmOracleProps {
  /** Optional seed for deterministic Siddha Element score (e.g. imageData slice or session id) */
  seed?: string;
  /** Optional precomputed line depths 0–1 (for future AI); otherwise derived from seed */
  pranaDepth?: number;
  dharmaCurvature?: number;
  buddhiLength?: number;
  className?: string;
}

const PalmOracle: React.FC<PalmOracleProps> = ({ seed = String(Date.now()), className = '' }) => {
  const elementScores = useMemo(() => getSiddhaElementScores(seed), [seed]);
  const dominantElement = useMemo(() => {
    const entries = Object.entries(elementScores) as [Element, number][];
    const best = entries.reduce((a, b) => (a[1] >= b[1] ? a : b), entries[0]);
    return best[0];
  }, [elementScores]);

  return (
    <div className={`space-y-5 text-left ${className}`}>
      <h3 className="text-[#D4AF37] font-serif text-lg font-bold border-b border-[#D4AF37]/30 pb-2">
        Deep Siddha Palm Analysis
      </h3>
      <p className="text-white/70 text-xs italic">
        Analysis of the three main lines. No general advice — vitality, karmic debt, and vasanas only.
      </p>

      <section>
        <h4 className="text-sm font-bold uppercase tracking-widest text-[#D4AF37]/90">Prana Rekha (Life Line)</h4>
        <p className="text-white/90 text-sm mt-1">
          Depth indicates the <strong>vitality reserve</strong> brought from past lives. A deep line suggests strong
          pranic carryover; a faint line suggests a soul choosing to rebuild vitality in this incarnation.
        </p>
      </section>

      <section>
        <h4 className="text-sm font-bold uppercase tracking-widest text-[#D4AF37]/90">Dharma Rekha (Heart Line)</h4>
        <p className="text-white/90 text-sm mt-1">
          Curvature indicates the <strong>emotional karmic debt</strong>. The curve toward the fingers relates to
          attachment and relationship karma; the curve toward the mount of Moon relates to inner emotional clearing.
        </p>
      </section>

      <section>
        <h4 className="text-sm font-bold uppercase tracking-widest text-[#D4AF37]/90">Buddhi Rekha (Head Line)</h4>
        <p className="text-white/90 text-sm mt-1">
          Length indicates the mental <strong>Vasanas (tendencies)</strong> being cleared. A long line suggests
          sustained mental patterns from past lives; a shorter line suggests a soul focusing on core clarity in this
          life.
        </p>
      </section>

      <section className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl p-4">
        <h4 className="text-sm font-bold uppercase tracking-widest text-[#D4AF37] mb-3">Siddha Element Score</h4>
        <p className="text-white/80 text-xs mb-3">
          Mapping of the three lines to the five elements (Earth, Water, Fire, Air, Ether).
        </p>
        <div className="space-y-2">
          {ELEMENTS.map((el) => (
            <div key={el} className="flex items-center gap-3">
              <span className="text-white/90 text-sm w-16 shrink-0">{el}</span>
              <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#D4AF37] rounded-full transition-all duration-500"
                  style={{ width: `${elementScores[el]}%` }}
                />
              </div>
              <span className="text-[#D4AF37] text-sm font-mono w-8">{elementScores[el]}%</span>
            </div>
          ))}
        </div>
        <p className="text-[#D4AF37] text-sm font-serif mt-3">
          Dominant element: <strong>{dominantElement}</strong> — your palm resonates most with {dominantElement.toLowerCase()} in this incarnation.
        </p>
      </section>
    </div>
  );
};

export default PalmOracle;
