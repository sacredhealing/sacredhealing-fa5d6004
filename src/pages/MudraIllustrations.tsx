/**
 * MudraIllustrations.tsx
 * Golden line-art SVG diagrams for each key mudra.
 * Schematic / sacred-geometry style — clear hand positions at a glance.
 * Import into MudraAcademy.tsx and map MUDRA_SVGS[mudra.id] → <MudraImage id={mudra.id} />
 */

import React from "react";

// ── Palette ──────────────────────────────────────────────────────────────────
const G  = "#D4AF37";          // Siddha-Gold stroke
const GF = "rgba(212,175,55,0.08)";  // light fill for hand shapes
const GF2= "rgba(212,175,55,0.22)";  // stronger fill for touch indicators
const CY = "#22D3EE";          // Vayu-Cyan for contact glow

// ── Shared primitives ─────────────────────────────────────────────────────────

/** Upright pill-shaped finger */
const Finger = ({
  cx, cy, h = 65, w = 17,
  opacity = 1
}: { cx: number; cy: number; h?: number; w?: number; opacity?: number }) => (
  <rect
    x={cx - w / 2} y={cy - h} width={w} height={h} rx={w / 2}
    fill={GF} stroke={G} strokeWidth="1.5" opacity={opacity}
  />
);

/** Finger bent/tilted — rotated around its base point */
const TiltedFinger = ({
  cx, cy, h = 55, w = 17, deg = 0
}: { cx: number; cy: number; h?: number; w?: number; deg?: number }) => (
  <rect
    x={cx - w / 2} y={cy - h} width={w} height={h} rx={w / 2}
    fill={GF} stroke={G} strokeWidth="1.5"
    transform={`rotate(${deg} ${cx} ${cy})`}
  />
);

/** Finger curled into a small oval at the palm */
const CurledFinger = ({ cx, cy }: { cx: number; cy: number }) => (
  <ellipse cx={cx} cy={cy - 9} rx={9} ry={8} fill={GF} stroke={G} strokeWidth="1.5" />
);

/** Half-length finger (bent mid-way) */
const HalfFinger = ({
  cx, cy, w = 17
}: { cx: number; cy: number; w?: number }) => (
  <rect
    x={cx - w / 2} y={cy - 28} width={w} height={28} rx={w / 2}
    fill={GF} stroke={G} strokeWidth="1.5"
  />
);

/** Palm base */
const Palm = () => (
  <path
    d="M 26 155 L 26 105 Q 26 90 42 90 L 118 90 Q 134 90 134 105 L 134 155 Q 134 172 110 172 L 50 172 Q 26 172 26 155 Z"
    fill={GF} stroke={G} strokeWidth="1.5"
  />
);

/** Wrist */
const Wrist = () => (
  <rect x={48} y={170} width={64} height={22} rx={11} fill={GF} stroke={G} strokeWidth="1.5" />
);

/** Standard right-hand thumb (left side, angled up) */
const Thumb = ({ deg = -22, cx = 18, cy = 138, ry = 26 }: {
  deg?: number; cx?: number; cy?: number; ry?: number
}) => (
  <ellipse cx={cx} cy={cy} rx={10} ry={ry}
    fill={GF} stroke={G} strokeWidth="1.5"
    transform={`rotate(${deg} ${cx} ${cy})`}
  />
);

/** Golden contact dot with glow ring */
const TouchDot = ({ cx, cy, color = G }: { cx: number; cy: number; color?: string }) => (
  <g>
    <circle cx={cx} cy={cy} r={11} fill="none" stroke={color} strokeWidth="1" opacity="0.25" />
    <circle cx={cx} cy={cy} r={6}  fill="none" stroke={color} strokeWidth="1" opacity="0.5" />
    <circle cx={cx} cy={cy} r={4}  fill={color} opacity="0.95" />
  </g>
);

/** Curved path line connecting two points (for arc connections) */
const ArcLine = ({ x1, y1, x2, y2, cx: cpx, cy: cpy }: {
  x1: number; y1: number; x2: number; y2: number; cx: number; cy: number
}) => (
  <path d={`M ${x1} ${y1} Q ${cpx} ${cpy} ${x2} ${y2}`}
    fill="none" stroke={G} strokeWidth="1.5" strokeDasharray="3 3" opacity="0.5" />
);

/** Outer wrapper SVG for all mudra illustrations */
const MudraBase = ({ children, label }: { children: React.ReactNode; label: string }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
    <svg viewBox="0 0 160 200" style={{ width: "120px", height: "150px", display: "block" }}>
      {/* Subtle background circle */}
      <circle cx="80" cy="110" r="74"
        fill="rgba(212,175,55,0.03)" stroke="rgba(212,175,55,0.08)" strokeWidth="1" />
      {children}
    </svg>
    <span style={{
      fontSize: "8px", fontWeight: 800, letterSpacing: "0.3em",
      textTransform: "uppercase", color: "rgba(212,175,55,0.6)"
    }}>{label}</span>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
//  MUDRA ILLUSTRATIONS
// ─────────────────────────────────────────────────────────────────────────────

/** GYAN MUDRA — index tip to thumb tip, 3 fingers extended */
export const GyanMudra = () => (
  <MudraBase label="Gyan Mudra">
    <Wrist />
    <Palm />
    {/* Little, Ring, Middle — extended */}
    <Finger cx={40} cy={90} h={52} />
    <Finger cx={62} cy={90} h={64} />
    <Finger cx={84} cy={90} h={72} />
    {/* Index — angled down-left toward thumb */}
    <TiltedFinger cx={106} cy={90} h={58} deg={-28} />
    {/* Thumb — angled up-right to meet index */}
    <Thumb deg={-18} cx={19} cy={130} ry={24} />
    {/* Touch point where index tip meets thumb tip */}
    <TouchDot cx={38} cy={100} />
    {/* Dashed arc showing the O formed */}
    <path d="M 42 96 Q 64 68 88 82" fill="none" stroke={G} strokeWidth="1"
      strokeDasharray="2 3" opacity="0.3" />
  </MudraBase>
);

/** CHIN MUDRA — same shape as Gyan, palm FACING DOWN */
export const ChinMudra = () => (
  <MudraBase label="Chin Mudra">
    {/* Slightly grayed to show back of hand */}
    <Wrist />
    <path
      d="M 26 155 L 26 105 Q 26 90 42 90 L 118 90 Q 134 90 134 105 L 134 155 Q 134 172 110 172 L 50 172 Q 26 172 26 155 Z"
      fill="rgba(212,175,55,0.05)" stroke={G} strokeWidth="1.5" strokeDasharray="4 3" />
    {/* Knuckle lines on back of hand */}
    <line x1="50" y1="110" x2="50" y2="100" stroke={G} strokeWidth="1" opacity="0.3" />
    <line x1="72" y1="108" x2="72" y2="98" stroke={G} strokeWidth="1" opacity="0.3" />
    <line x1="94" y1="107" x2="94" y2="97" stroke={G} strokeWidth="1" opacity="0.3" />
    {/* Fingers — back-of-hand view, slightly different proportions */}
    <Finger cx={40} cy={90} h={50} />
    <Finger cx={62} cy={90} h={62} />
    <Finger cx={84} cy={90} h={70} />
    <TiltedFinger cx={106} cy={90} h={56} deg={-28} />
    <Thumb deg={-18} cx={19} cy={132} ry={23} />
    <TouchDot cx={38} cy={102} />
    {/* PALM DOWN label */}
    <text x="80" y="186" textAnchor="middle" fill={G} fontSize="7" fontWeight="700"
      letterSpacing="1" opacity="0.5">PALM DOWN</text>
  </MudraBase>
);

/** PRANA MUDRA — ring + little touch thumb, index + middle extended */
export const PranaMudra = () => (
  <MudraBase label="Prana Mudra">
    <Wrist />
    <Palm />
    {/* Little — angled toward thumb (tip touching) */}
    <TiltedFinger cx={40} cy={90} h={52} deg={22} />
    {/* Ring — angled toward thumb (tip touching) */}
    <TiltedFinger cx={62} cy={90} h={62} deg={16} />
    {/* Middle — extended straight */}
    <Finger cx={84} cy={90} h={72} />
    {/* Index — extended straight */}
    <Finger cx={106} cy={90} h={62} />
    {/* Thumb — coming up to meet ring + little */}
    <Thumb deg={-15} cx={20} cy={125} ry={26} />
    {/* Triple touch point (ring + little + thumb) */}
    <TouchDot cx={40} cy={103} color={CY} />
    {/* Dashed line showing both fingers meeting thumb */}
    <path d="M 44 104 Q 35 112 32 118" fill="none" stroke={CY} strokeWidth="1"
      strokeDasharray="2 2" opacity="0.4" />
  </MudraBase>
);

/** APANA MUDRA — middle + ring touch thumb, index + little extended */
export const ApanamudraIllustration = () => (
  <MudraBase label="Apana Mudra">
    <Wrist />
    <Palm />
    {/* Little — extended */}
    <Finger cx={40} cy={90} h={52} />
    {/* Ring — angled toward thumb */}
    <TiltedFinger cx={62} cy={90} h={60} deg={15} />
    {/* Middle — angled toward thumb */}
    <TiltedFinger cx={84} cy={90} h={68} deg={10} />
    {/* Index — extended */}
    <Finger cx={106} cy={90} h={62} />
    {/* Thumb meeting middle + ring */}
    <Thumb deg={-12} cx={20} cy={122} ry={26} />
    {/* Touch dot at meeting point */}
    <TouchDot cx={46} cy={108} />
    <path d="M 56 110 Q 50 116 42 113" fill="none" stroke={G} strokeWidth="1"
      strokeDasharray="2 2" opacity="0.35" />
  </MudraBase>
);

/** PRITHVI MUDRA — ring tip to thumb, others extended */
export const PrithviMudra = () => (
  <MudraBase label="Prithvi Mudra">
    <Wrist />
    <Palm />
    <Finger cx={40} cy={90} h={52} />
    {/* Ring — tilted toward thumb */}
    <TiltedFinger cx={62} cy={90} h={62} deg={18} />
    <Finger cx={84} cy={90} h={72} />
    <Finger cx={106} cy={90} h={62} />
    <Thumb deg={-14} cx={20} cy={126} ry={25} />
    <TouchDot cx={37} cy={108} />
  </MudraBase>
);

/** SURYA MUDRA — ring finger pressed under thumb */
export const SuryaMudra = () => (
  <MudraBase label="Surya Mudra">
    <Wrist />
    <Palm />
    <Finger cx={40} cy={90} h={52} />
    {/* Ring — bent down, thumb presses on it */}
    <HalfFinger cx={62} cy={90} />
    <Finger cx={84} cy={90} h={72} />
    <Finger cx={106} cy={90} h={62} />
    {/* Thumb presses DOWN on ring finger's second phalanx */}
    <Thumb deg={5} cx={22} cy={118} ry={22} />
    {/* Pressure indicator */}
    <circle cx="52" cy="87" r="7" fill={GF2} stroke={G} strokeWidth="1.5" />
    <text x="52" y="91" textAnchor="middle" fill={G} fontSize="8" fontWeight="800">↓</text>
  </MudraBase>
);

/** HAKINI MUDRA — all fingertips of both hands touching */
export const HakiniMudra = () => (
  <MudraBase label="Hakini Mudra">
    {/* LEFT HAND — lighter, behind */}
    <g opacity="0.55">
      <rect x={6} y={138} width={48} height={18} rx={9} fill={GF} stroke={G} strokeWidth="1.2" />
      <path d="M 6 138 L 6 100 Q 6 88 18 88 L 54 88 Q 60 88 60 100 L 60 138 Z"
        fill={GF} stroke={G} strokeWidth="1.2" />
      {/* Left hand fingers pointing right */}
      <rect x={60} y={104} width={42} height={14} rx={7} fill={GF} stroke={G} strokeWidth="1.2" />
      <rect x={60} y={122} width={38} height={14} rx={7} fill={GF} stroke={G} strokeWidth="1.2" />
      <rect x={60} y={140} width={34} height={14} rx={7} fill={GF} stroke={G} strokeWidth="1.2" />
    </g>
    {/* RIGHT HAND — lighter, behind */}
    <g opacity="0.55">
      <rect x={106} y={138} width={48} height={18} rx={9} fill={GF} stroke={G} strokeWidth="1.2" />
      <path d="M 154 138 L 154 100 Q 154 88 142 88 L 106 88 Q 100 88 100 100 L 100 138 Z"
        fill={GF} stroke={G} strokeWidth="1.2" />
      {/* Right hand fingers pointing left */}
      <rect x={58} y={104} width={42} height={14} rx={7} fill={GF} stroke={G} strokeWidth="1.2" />
      <rect x={62} y={122} width={38} height={14} rx={7} fill={GF} stroke={G} strokeWidth="1.2" />
      <rect x={66} y={140} width={34} height={14} rx={7} fill={GF} stroke={G} strokeWidth="1.2" />
    </g>
    {/* Fingertip meeting line — center vertical */}
    <line x1="80" y1="84" x2="80" y2="158" stroke={G} strokeWidth="1"
      strokeDasharray="3 3" opacity="0.3" />
    {/* Touch dots at fingertip pairs */}
    {[100, 115, 130, 145, 158].map((cy, i) => (
      <TouchDot key={i} cx={80} cy={cy} color={i === 2 ? G : CY} />
    ))}
    {/* Third Eye label */}
    <text x="80" y="78" textAnchor="middle" fill={G} fontSize="7" fontWeight="700"
      letterSpacing="1" opacity="0.6">◎ AJNA</text>
  </MudraBase>
);

/** APAN VAYU MUDRA — index folded to thumb base, middle+ring to thumb tip */
export const ApanVayuMudra = () => (
  <MudraBase label="Apan Vayu Mudra">
    <Wrist />
    <Palm />
    {/* Little — extended */}
    <Finger cx={40} cy={90} h={52} />
    {/* Ring — angled to touch thumb tip */}
    <TiltedFinger cx={62} cy={90} h={60} deg={14} />
    {/* Middle — angled to touch thumb tip */}
    <TiltedFinger cx={84} cy={90} h={66} deg={8} />
    {/* Index — bent all the way to THUMB BASE (mount of Venus) */}
    <TiltedFinger cx={106} cy={90} h={44} deg={-45} />
    {/* Index tip rests at thumb base — dot there */}
    <TouchDot cx={60} cy={132} color={CY} />
    {/* Thumb */}
    <Thumb deg={-10} cx={21} cy={120} ry={26} />
    {/* Touch dot at thumb tip (ring + middle) */}
    <TouchDot cx={42} cy={106} />
    {/* Labels */}
    <text x="60" y="148" textAnchor="middle" fill={CY} fontSize="6"
      fontWeight="700" letterSpacing="1" opacity="0.6">INDEX BASE</text>
  </MudraBase>
);

/** DHYANA MUDRA — right hand resting in left, thumbs forming oval */
export const DhyanaMudra = () => (
  <MudraBase label="Dhyana Mudra">
    {/* Left hand (bottom) */}
    <path d="M 22 158 Q 22 130 40 118 L 136 118 Q 138 130 138 158 Q 138 172 100 172 L 60 172 Q 22 172 22 158 Z"
      fill="rgba(212,175,55,0.05)" stroke={G} strokeWidth="1.5" />
    {/* Right hand (on top) */}
    <path d="M 30 145 Q 30 118 48 108 L 128 108 Q 130 118 130 145 Q 130 158 96 158 L 64 158 Q 30 158 30 145 Z"
      fill={GF} stroke={G} strokeWidth="1.5" />
    {/* Fingers of top hand — just rounded bumps visible at top */}
    {[48, 65, 83, 100, 118].map((cx, i) => (
      <rect key={i} x={cx - 8} y={88} width={16} height={22} rx={8}
        fill={GF} stroke={G} strokeWidth="1.3" />
    ))}
    {/* The Oval formed by two thumbs touching — center of composition */}
    <ellipse cx="80" cy="130" rx="22" ry="14"
      fill="rgba(212,175,55,0.12)" stroke={G} strokeWidth="1.8" />
    {/* Glow inside oval */}
    <ellipse cx="80" cy="130" rx="10" ry="6"
      fill="rgba(212,175,55,0.25)" stroke="none" />
    {/* Two thumb labels */}
    <text x="54" y="134" fill={G} fontSize="6" fontWeight="700" opacity="0.5">SHIVA</text>
    <text x="92" y="134" fill={G} fontSize="6" fontWeight="700" opacity="0.5">SHAKTI</text>
  </MudraBase>
);

/** SHANKHA MUDRA — conch shell hand shape */
export const ShankhaMusra = () => (
  <MudraBase label="Shankha Mudra">
    {/* Left hand wrapping around right thumb */}
    <g>
      {/* Right hand base */}
      <rect x={52} y={170} width={56} height={20} rx={10} fill={GF} stroke={G} strokeWidth="1.5" />
      <path d="M 38 160 L 38 112 Q 38 96 54 96 L 122 96 Q 136 96 136 112 L 136 160 Z"
        fill={GF} stroke={G} strokeWidth="1.5" />
      {/* Right thumb — pointing upward through left fingers */}
      <rect x={72} y={52} width={16} height={48} rx={8}
        fill={GF2} stroke={G} strokeWidth="2" />
      {/* Left hand fingers wrapping around the right thumb area */}
      {/* Left fingers 1-4 cross horizontally over right hand */}
      {[76, 91, 106, 120].map((cy, i) => (
        <rect key={i} x={30} y={cy - 7} width={70 - i * 4} height={13} rx={6.5}
          fill={GF} stroke={G} strokeWidth="1.3" />
      ))}
      {/* Left thumb presses right middle finger tip */}
      <ellipse cx={100} cy={70} rx={10} ry={8}
        fill={GF} stroke={G} strokeWidth="1.5" transform="rotate(-15 100 70)" />
      {/* Touch point */}
      <TouchDot cx={84} cy={72} />
      {/* Conch shape outline hint */}
      <path d="M 45 130 Q 38 112 52 96 Q 80 78 120 90 Q 136 100 136 120"
        fill="none" stroke={G} strokeWidth="1" strokeDasharray="4 3" opacity="0.25" />
    </g>
    <text x="80" y="186" textAnchor="middle" fill={G} fontSize="7" fontWeight="700"
      letterSpacing="1" opacity="0.5">CONCH SHAPE</text>
  </MudraBase>
);

/** BHAIRAVA MUDRA — right palm up in lap, left on top */
export const BhairavaMudra = () => (
  <MudraBase label="Bhairava Mudra">
    {/* Bottom hand (right = Shiva) */}
    <path d="M 18 172 Q 18 148 34 138 L 142 138 Q 144 148 144 172 Q 144 185 100 185 L 62 185 Q 18 185 18 172 Z"
      fill="rgba(212,175,55,0.05)" stroke={G} strokeWidth="1.5" />
    {/* Top hand (left = Shakti) */}
    <path d="M 26 162 Q 26 140 42 130 L 136 130 Q 138 140 138 162 Q 138 174 100 174 L 64 174 Q 26 174 26 162 Z"
      fill={GF} stroke={G} strokeWidth="1.5" />
    {/* Fingers of top hand (5 small rounded bumps at top) */}
    {[42, 62, 82, 102, 122].map((cx, i) => (
      <rect key={i} x={cx - 9} y={108} width={17} height={24} rx={8.5}
        fill={GF} stroke={G} strokeWidth="1.3" />
    ))}
    {/* Thumb touch point — both thumbs touching at top */}
    <TouchDot cx={80} cy={122} />
    <ArcLine x1={42} y1={122} x2={80} y2={119} cx={60} cy={112} />
    <ArcLine x1={118} y1={122} x2={80} y2={119} cx={100} cy={112} />
    {/* Label: Shiva / Shakti */}
    <text x="42" y="180" fill={G} fontSize="7" fontWeight="700" opacity="0.45">SHIVA</text>
    <text x="106" y="180" fill={G} fontSize="7" fontWeight="700" opacity="0.45">SHAKTI</text>
    {/* Om symbol center */}
    <text x="80" y="158" textAnchor="middle" fill={G} fontSize="14" opacity="0.4">ॐ</text>
  </MudraBase>
);

/** VAYU MUDRA — index finger folded, thumb pressing on it */
export const VayuMudra = () => (
  <MudraBase label="Vayu Mudra">
    <Wrist />
    <Palm />
    <Finger cx={40} cy={90} h={52} />
    <Finger cx={62} cy={90} h={64} />
    <Finger cx={84} cy={90} h={72} />
    {/* Index — bent down fully, tip at base of thumb */}
    <rect x={97} y={76} width={17} height={16} rx={8}
      fill={GF} stroke={G} strokeWidth="1.5" />
    {/* Arrow showing downward pressure */}
    <text x="106" y="100" textAnchor="middle" fill={G} fontSize="10" opacity="0.7">↓</text>
    {/* Thumb — pressing OVER the bent index */}
    <rect x={75} y={90} width={30} height={14} rx={7}
      fill={GF2} stroke={G} strokeWidth="2" transform="rotate(-8 80 97)" />
    {/* Pressure glow */}
    <circle cx="99" cy="88" r="8" fill="rgba(212,175,55,0.2)" stroke={G}
      strokeWidth="1" opacity="0.6" />
    <text x="80" y="186" textAnchor="middle" fill={G} fontSize="7" fontWeight="700"
      letterSpacing="1" opacity="0.5">THUMB OVER INDEX</text>
  </MudraBase>
);

/** KHECHARI MUDRA — tongue position diagram (cross-section) */
export const KhechariMudra = () => (
  <MudraBase label="Khechari Mudra">
    {/* Stylized cross-section of the mouth/throat - sacred geometry style */}
    {/* Skull outline */}
    <ellipse cx="80" cy="90" rx="58" ry="52" fill={GF} stroke={G} strokeWidth="1.5" />
    {/* Nasal cavity area */}
    <path d="M 46 72 Q 60 58 80 58 Q 100 58 114 72"
      fill="none" stroke={G} strokeWidth="1.2" opacity="0.5" />
    {/* Palate — hard then soft */}
    <path d="M 38 110 L 76 110 Q 90 108 100 116" fill="none" stroke={G} strokeWidth="2" />
    {/* Uvula */}
    <ellipse cx="100" cy="120" rx="5" ry="8" fill={GF} stroke={G} strokeWidth="1.3" />
    {/* Stage 1 tongue position — to soft palate */}
    <path d="M 36 130 Q 50 118 68 110"
      fill="none" stroke={CY} strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="68" cy="110" r="4" fill={CY} opacity="0.9" />
    {/* Stage 2 tongue — reaching uvula */}
    <path d="M 36 130 Q 58 115 88 112"
      fill="none" stroke={G} strokeWidth="2" strokeLinecap="round"
      strokeDasharray="4 2" opacity="0.5" />
    <circle cx="88" cy="112" r="3.5" fill={G} opacity="0.6" />
    {/* Stage 3 — nasal cavity */}
    <path d="M 36 130 Q 66 110 102 98"
      fill="none" stroke={G} strokeWidth="1.5" strokeLinecap="round"
      strokeDasharray="3 3" opacity="0.3" />
    <circle cx="102" cy="98" r="3" fill={G} opacity="0.35" />
    {/* Amrit drop */}
    <text x="80" y="76" textAnchor="middle" fill={G} fontSize="9" opacity="0.6">✦ AMRIT</text>
    {/* Stage labels */}
    <text x="32" y="162" fill={CY} fontSize="6" fontWeight="700">I</text>
    <text x="44" y="162" fill={G} fontSize="6" fontWeight="700" opacity="0.6">II</text>
    <text x="58" y="162" fill={G} fontSize="6" fontWeight="700" opacity="0.35">III</text>
    <text x="80" y="175" textAnchor="middle" fill={G} fontSize="6.5"
      fontWeight="700" letterSpacing="1" opacity="0.5">3 STAGES</text>
  </MudraBase>
);

/** SHAMBHAVI MUDRA — inner eye gaze diagram */
export const ShambhaviMudra = () => (
  <MudraBase label="Shambhavi Mudra">
    {/* Face outline */}
    <ellipse cx="80" cy="100" rx="55" ry="65" fill={GF} stroke={G} strokeWidth="1.5" />
    {/* Two closed eyes */}
    {/* Left eye */}
    <path d="M 46 88 Q 56 82 66 88 Q 56 94 46 88 Z" fill={GF2} stroke={G} strokeWidth="1.5" />
    {/* Right eye */}
    <path d="M 94 88 Q 104 82 114 88 Q 104 94 94 88 Z" fill={GF2} stroke={G} strokeWidth="1.5" />
    {/* Eyeballs turned UPWARD — gaze lines going up toward center brow */}
    <line x1="56" y1="87" x2="56" y2="80" stroke={CY} strokeWidth="1.5" opacity="0.7" />
    <line x1="104" y1="87" x2="104" y2="80" stroke={CY} strokeWidth="1.5" opacity="0.7" />
    {/* Arrows showing upward convergence */}
    <path d="M 56 78 L 59 73 L 62 78" fill="none" stroke={CY} strokeWidth="1.2" />
    <path d="M 104 78 L 101 73 L 98 78" fill="none" stroke={CY} strokeWidth="1.2" />
    {/* Third eye / Ajna point */}
    <circle cx="80" cy="72" r="10"
      fill="rgba(212,175,55,0.2)" stroke={G} strokeWidth="2" />
    <circle cx="80" cy="72" r="5" fill={G} opacity="0.8" />
    <circle cx="80" cy="72" r="2" fill="white" opacity="0.9" />
    {/* Gaze convergence lines */}
    <line x1="58" y1="75" x2="74" y2="72" stroke={G} strokeWidth="1"
      strokeDasharray="3 2" opacity="0.4" />
    <line x1="102" y1="75" x2="86" y2="72" stroke={G} strokeWidth="1"
      strokeDasharray="3 2" opacity="0.4" />
    {/* Nose */}
    <path d="M 72 108 Q 80 118 88 108" fill="none" stroke={G} strokeWidth="1.2" opacity="0.4" />
    {/* Ajna label */}
    <text x="80" y="56" textAnchor="middle" fill={G} fontSize="7"
      fontWeight="800" letterSpacing="2" opacity="0.7">◉ AJNA</text>
    {/* Radiance lines */}
    {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
      const rad = deg * Math.PI / 180;
      const x1 = 80 + Math.cos(rad) * 13;
      const y1 = 72 + Math.sin(rad) * 13;
      const x2 = 80 + Math.cos(rad) * 20;
      const y2 = 72 + Math.sin(rad) * 20;
      return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={G}
        strokeWidth="0.8" opacity="0.3" />;
    })}
  </MudraBase>
);

/** YONI MUDRA — nine gates sealed, hands over face */
export const YoniMudra = () => (
  <MudraBase label="Yoni Mudra">
    {/* Face */}
    <ellipse cx="80" cy="100" rx="52" ry="60" fill={GF} stroke={G} strokeWidth="1.5" />
    {/* Two hands covering the face */}
    {/* Left hand */}
    <path d="M 14 88 Q 14 70 28 68 L 82 68 Q 84 80 84 95 L 82 130 Q 68 136 28 130 Q 14 124 14 110 Z"
      fill={GF2} stroke={G} strokeWidth="1.5" />
    {/* Right hand */}
    <path d="M 146 88 Q 146 70 132 68 L 78 68 Q 76 80 76 95 L 78 130 Q 92 136 132 130 Q 146 124 146 110 Z"
      fill={GF2} stroke={G} strokeWidth="1.5" />
    {/* Gate seal dots — 9 gates */}
    {/* 2 ears */}
    <TouchDot cx={24} cy={100} color={CY} />
    <TouchDot cx={136} cy={100} color={CY} />
    {/* 2 eyes */}
    <TouchDot cx={60} cy={83} color={G} />
    <TouchDot cx={100} cy={83} color={G} />
    {/* 2 nostrils */}
    <circle cx="72" cy="108" r="3.5" fill={G} opacity="0.7" />
    <circle cx="88" cy="108" r="3.5" fill={G} opacity="0.7" />
    {/* 1 mouth (upper) */}
    <circle cx="80" cy="120" r="3.5" fill={G} opacity="0.7" />
    {/* Interlocked fingers at top — stylized */}
    <text x="80" y="55" textAnchor="middle" fill={G} fontSize="9" opacity="0.5">🤝</text>
    <text x="80" y="178" textAnchor="middle" fill={G} fontSize="7" fontWeight="700"
      letterSpacing="1" opacity="0.5">9 GATES SEALED</text>
  </MudraBase>
);

/** MAHA MUDRA — seated, holding big toe, chin lock */
export const MahaMudra = () => (
  <MudraBase label="Maha Mudra">
    {/* Seated figure — schematic */}
    {/* Torso */}
    <rect x={62} y={64} width={36} height={52} rx={10}
      fill={GF} stroke={G} strokeWidth="1.5" />
    {/* Head */}
    <ellipse cx="80" cy="52" rx="18" ry="20" fill={GF} stroke={G} strokeWidth="1.5" />
    {/* Chin lock indicator */}
    <path d="M 70 67 Q 80 74 90 67" fill="none" stroke={CY} strokeWidth="1.5" />
    <text x="80" y="60" textAnchor="middle" fill={CY} fontSize="6" fontWeight="700">CHIN LOCK</text>
    {/* Left leg bent */}
    <path d="M 62 116 Q 40 118 35 138 Q 34 152 50 155 Q 66 158 68 142 L 70 116"
      fill={GF} stroke={G} strokeWidth="1.5" />
    {/* Heel to perineum dot */}
    <circle cx="65" cy="148" r="4" fill={CY} opacity="0.7" />
    {/* Right leg extended */}
    <path d="M 98 116 Q 108 118 118 118 L 148 118 Q 152 118 152 124 Q 152 130 148 130 L 116 130 Q 108 130 98 128 L 98 116"
      fill={GF} stroke={G} strokeWidth="1.5" />
    {/* Hands holding big toe */}
    <ellipse cx="148" cy="124" rx="10" ry="8" fill={GF2} stroke={G} strokeWidth="1.8" />
    <TouchDot cx={148} cy={124} color={G} />
    {/* Sushumna line */}
    <line x1="80" y1="62" x2="80" y2="116" stroke={G} strokeWidth="1"
      strokeDasharray="4 3" opacity="0.4" />
    {/* Chakra dots along sushumna */}
    {[66, 76, 88, 100, 110].map((cy, i) => (
      <circle key={i} cx="80" cy={cy} r="2.5"
        fill={i === 2 ? G : "none"} stroke={G} strokeWidth="1" opacity="0.5" />
    ))}
    <text x="80" y="188" textAnchor="middle" fill={G} fontSize="6.5" fontWeight="700"
      letterSpacing="1" opacity="0.5">SUSHUMNA AWAKENED</text>
  </MudraBase>
);

// ─── MASTER MAP — keyed by mudra.id ──────────────────────────────────────────
export const MUDRA_ILLUSTRATION_MAP: Record<string, React.FC> = {
  "gyan":             GyanMudra,
  "chin":             ChinMudra,
  "prana-mudra":      PranaMudra,
  "apana-mudra":      ApanamudraIllustration,
  "prithvi-mudra":    PrithviMudra,
  "surya":            SuryaMudra,
  "hakini":           HakiniMudra,
  "apan-vayu":        ApanVayuMudra,
  "dhyana":           DhyanaMudra,
  "shankha":          ShankhaMusra,
  "bhairava":         BhairavaMudra,
  "vayu":             VayuMudra,
  "khechari":         KhechariMudra,
  "shambhavi":        ShambhaviMudra,
  "yoni":             YoniMudra,
  "maha-mudra":       MahaMudra,
};

/** Drop-in component — renders illustration for any mudra by ID */
export const MudraImage = ({ id }: { id: string }) => {
  const Illustration = MUDRA_ILLUSTRATION_MAP[id];
  if (!Illustration) return null;
  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      padding: "16px 0 8px",
      background: "rgba(212,175,55,0.03)",
      borderRadius: "12px",
      border: "1px solid rgba(212,175,55,0.08)",
      marginBottom: "16px"
    }}>
      <Illustration />
    </div>
  );
};
