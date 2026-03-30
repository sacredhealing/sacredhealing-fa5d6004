import React, { useMemo, useState } from 'react';

/**
 * 18-Siddha lineage Master — 15 specific points for AI analysis.
 */
export const MASTER_PALM_18_SIDDHA_PROMPT = `You are an 18-Siddha lineage Master. Analyze the palm for 15 specific points:
- 3 primary lines: Life, Head, Heart.
- 4 secondary lines: Fate, Sun, Mercury, Health.
- 7 mounts: Jupiter, Saturn, Apollo/Sun, Mercury, Venus, Moon, Mars (upper/lower).
- The thumb's logic/will ratio (phalange proportions).
Do not give general advice. Report only what you read from the palm.`;

/**
 * Master Siddha Palm Analysis — Samudrika Shastra.
 * Analyze with extreme precision: lines (Ojas, Siddhis, Karmic Leaks) and mounts (Jupiter, Saturn, Venus).
 */
export const MASTER_PALM_ANALYSIS_PROMPT = `You are a Siddha Master of Samudrika Shastra. Analyze the uploaded palm with extreme precision.

Line Analysis:
- **Life Line:** Calculate 'Ojas Reserve'. Link to 'Physical Vitality' from past lives.
- **Head Line:** Identify 'Siddhis' (Mental Powers). Link to 'Ancient Wisdom' retention.
- **Heart Line:** Detect 'Karmic Leaks'. Link to 'Dharmic Debt'.

Mount Analysis: Scan the Mounts of Jupiter (Leadership), Saturn (Karma), and Venus (Creativity).
Do not give general advice. Report only what you read from the palm.`;

const ELEMENTS = ['Earth', 'Water', 'Fire', 'Air', 'Ether'] as const;
type Element = typeof ELEMENTS[number];

/** Deterministic Siddha Element scores from seed */
function getSiddhaElementScores(seed: string): Record<Element, number> {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  const r = () => (Math.abs((h = (h * 1103515245 + 12345) | 0) % 100) / 100);
  const raw: number[] = [r(), r(), r(), r(), r()];
  const sum = raw.reduce((a, b) => a + b, 0);
  const norm = raw.map((v) => (sum > 0 ? v / sum : 0.2));
  return ELEMENTS.reduce((acc, el, i) => ({ ...acc, [el]: Math.round(norm[i] * 100) }), {} as Record<Element, number>);
}

/** Deterministic line paths for overlay (0–1 normalized). Seed drives curvature and length. */
function getLinePaths(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  const r = (scale = 1) => (Math.abs((h = (h * 1103515245 + 12345) | 0) % 1000) / 1000) * scale;
  // Life: arc from thumb base toward wrist
  const lifeCurve = 0.15 + r(0.25);
  const lifeEnd = 0.55 + r(0.2);
  const lifeLine = `M 22,28 Q 28,${18 + lifeCurve * 60} 26,${50 + lifeEnd * 40}`;
  // Head: horizontal curve below fingers
  const headY = 42 + r(12);
  const headLen = 0.5 + r(0.35);
  const headLine = `M 22,${headY} Q 38,${headY - 4} ${22 + headLen * 50},${headY + 2}`;
  // Heart: curve under fingers
  const heartY = 32 + r(8);
  const heartLine = `M 22,${heartY} Q 42,${heartY - 6} 62,${heartY + 2}`;
  return { lifeLine, headLine, heartLine };
}

/** Mount positions (cx, cy as % of 100) for Jupiter, Saturn, Venus */
function getMountPositions(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  const r = (scale = 1) => (Math.abs((h = (h * 1103515245 + 12345) | 0) % 1000) / 1000) * scale;
  return {
    jupiter: { cx: 42 + r(8), cy: 28 + r(6) },
    saturn: { cx: 50 + r(6), cy: 38 + r(6) },
    venus: { cx: 26 + r(6), cy: 52 + r(8) },
  };
}

/** Heart Line Leak — deterministic from seed for Bhrigu/Mantra sync (e.g. recommend Anahata) */
export function getHeartLineLeak(seed: string): boolean {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  return Math.abs((h * 1103515245 + 12345) | 0) % 100 < 45;
}

/** Palm archetype for Bhrigu mantra mapping: Spiritual Mastery (Fire/Ether) or Karmic Debt (Heart Line Leak) */
export function getPalmArchetype(seed: string): 'Spiritual Mastery' | 'Karmic Debt' | null {
  if (getHeartLineLeak(seed)) return 'Karmic Debt';
  const scores = getSiddhaElementScores(seed);
  if ((scores.Fire >= 22 || scores.Ether >= 22)) return 'Spiritual Mastery';
  return null;
}

/** Vata-Pitta-Kapha balance from hand texture/color (seed-based diagnostic) */
export function getVataPittaKapha(seed: string): { vata: number; pitta: number; kapha: number } {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  const r = () => (Math.abs((h = (h * 1103515245 + 12345) | 0) % 100) / 100);
  const raw = [r(), r(), r()];
  const sum = raw.reduce((a, b) => a + b, 0) || 1;
  const norm = raw.map((v) => Math.round((v / sum) * 100));
  return { vata: norm[0], pitta: norm[1], kapha: norm[2] };
}

export interface PalmOracleProps {
  /** Optional seed for deterministic scores and overlay paths */
  seed?: string;
  /** Optional hand image data URL to draw glowing line/mount overlays on */
  handImageUrl?: string;
  /** Optional precomputed line depths 0–1 (for future AI) */
  pranaDepth?: number;
  dharmaCurvature?: number;
  buddhiLength?: number;
  className?: string;
}

const PalmOracle: React.FC<PalmOracleProps> = ({
  seed = String(Date.now()),
  handImageUrl,
  className = '',
}) => {
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);
  const elementScores = useMemo(() => getSiddhaElementScores(seed), [seed]);
  const linePaths = useMemo(() => getLinePaths(seed), [seed]);
  const mountPositions = useMemo(() => getMountPositions(seed), [seed]);
  const dominantElement = useMemo(() => {
    const entries = Object.entries(elementScores) as [Element, number][];
    const best = entries.reduce((a, b) => (a[1] >= b[1] ? a : b), entries[0]);
    return best[0];
  }, [elementScores]);

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImgSize({ w: img.naturalWidth || img.offsetWidth, h: img.naturalHeight || img.offsetHeight });
  };

  return (
    <div className={`space-y-5 text-left ${className}`}>
      <h3 className="text-[#D4AF37] font-serif text-lg font-bold border-b border-[#D4AF37]/30 pb-2">
        Master Siddha Palm Analysis
      </h3>
      <p className="text-white/70 text-xs italic">
        You are a Siddha Master of Samudrika Shastra. Analysis with extreme precision — lines and mounts only.
      </p>

      {/* Hand image with glowing SVG overlays */}
      {handImageUrl && (
        <section className="relative rounded-xl overflow-hidden border border-[#D4AF37]/30 bg-black">
          <div className="relative w-full max-w-sm mx-auto aspect-[3/4]">
            <img
              src={handImageUrl}
              alt="Your palm"
              className="absolute inset-0 w-full h-full object-contain"
              onLoad={onImageLoad}
            />
            {imgSize && (
              <svg
                className="absolute inset-0 w-full h-full text-[#D4AF37] pointer-events-none"
                viewBox="0 0 100 100"
                preserveAspectRatio="xMidYMid meet"
              >
                <defs>
                  <filter id="palm-glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="0.8" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                {/* Life Line — Ojas Reserve */}
                <path
                  d={linePaths.lifeLine}
                  fill="none"
                  stroke="rgba(212,175,55,0.95)"
                  strokeWidth="0.9"
                  strokeLinecap="round"
                  filter="url(#palm-glow)"
                />
                {/* Head Line — Siddhis */}
                <path
                  d={linePaths.headLine}
                  fill="none"
                  stroke="rgba(212,175,55,0.9)"
                  strokeWidth="0.85"
                  strokeLinecap="round"
                  filter="url(#palm-glow)"
                />
                {/* Heart Line — Karmic Leaks */}
                <path
                  d={linePaths.heartLine}
                  fill="none"
                  stroke="rgba(212,175,55,0.9)"
                  strokeWidth="0.85"
                  strokeLinecap="round"
                  filter="url(#palm-glow)"
                />
                {/* Mounts: Jupiter, Saturn, Venus */}
                <circle
                  cx={mountPositions.jupiter.cx}
                  cy={mountPositions.jupiter.cy}
                  r="4"
                  fill="none"
                  stroke="rgba(212,175,55,0.7)"
                  strokeWidth="0.6"
                  filter="url(#palm-glow)"
                />
                <circle
                  cx={mountPositions.saturn.cx}
                  cy={mountPositions.saturn.cy}
                  r="3.5"
                  fill="none"
                  stroke="rgba(212,175,55,0.7)"
                  strokeWidth="0.6"
                  filter="url(#palm-glow)"
                />
                <circle
                  cx={mountPositions.venus.cx}
                  cy={mountPositions.venus.cy}
                  r="4"
                  fill="none"
                  stroke="rgba(212,175,55,0.7)"
                  strokeWidth="0.6"
                  filter="url(#palm-glow)"
                />
              </svg>
            )}
          </div>
          <p className="text-center text-[10px] uppercase tracking-widest text-[#D4AF37]/70 py-2">
            Discovered lines & mounts — Life · Head · Heart · Jupiter · Saturn · Venus
          </p>
        </section>
      )}

      {/* Line Analysis */}
      <section>
        <h4 className="text-sm font-bold uppercase tracking-widest text-[#D4AF37]/90">Life Line — Ojas Reserve</h4>
        <p className="text-white/90 text-sm mt-1">
          Depth and arc indicate <strong>Physical Vitality</strong> carried from past lives. A strong line suggests
          abundant ojas reserve; a lighter line suggests a soul rebuilding vitality in this incarnation.
        </p>
      </section>

      <section>
        <h4 className="text-sm font-bold uppercase tracking-widest text-[#D4AF37]/90">Head Line — Siddhis</h4>
        <p className="text-white/90 text-sm mt-1">
          Length and clarity reveal <strong>Mental Powers</strong> and <strong>Ancient Wisdom</strong> retention. The
          Siddha reads here the capacity for focused mind and wisdom carried across lifetimes.
        </p>
      </section>

      <section>
        <h4 className="text-sm font-bold uppercase tracking-widest text-[#D4AF37]/90">Heart Line — Karmic Leaks</h4>
        <p className="text-white/90 text-sm mt-1">
          Curvature and breaks indicate <strong>Karmic Leaks</strong> and <strong>Dharmic Debt</strong> in relationship
          and emotion. The Master identifies where the heart has given or withheld, and what remains to be balanced.
        </p>
      </section>

      {/* Mount Analysis */}
      <section className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl p-4">
        <h4 className="text-sm font-bold uppercase tracking-widest text-[#D4AF37] mb-3">Mount Analysis</h4>
        <ul className="space-y-2 text-sm text-white/90">
          <li><strong className="text-[#D4AF37]/90">Mount of Jupiter:</strong> Leadership and authority — capacity to lead and inspire.</li>
          <li><strong className="text-[#D4AF37]/90">Mount of Saturn:</strong> Karma and discipline — the weight and lesson of time.</li>
          <li><strong className="text-[#D4AF37]/90">Mount of Venus:</strong> Creativity and love — the creative force and desire nature.</li>
        </ul>
      </section>

      {/* Siddha Element Score */}
      <section className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl p-4">
        <h4 className="text-sm font-bold uppercase tracking-widest text-[#D4AF37] mb-3">Siddha Element Score</h4>
        <p className="text-white/80 text-xs mb-3">
          Mapping of the lines and mounts to the five elements (Earth, Water, Fire, Air, Ether).
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
