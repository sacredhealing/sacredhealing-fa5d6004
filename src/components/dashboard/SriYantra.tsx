import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SriYantraProps {
  className?: string;
  style?: React.CSSProperties;
  variant?: 'default' | 'gold';
}

/**
 * Sri Yantra - Traditional sacred geometry with 9 interlocking triangles
 * (4 upward/Shiva, 5 downward/Shakti) forming 43 smaller triangles,
 * 8 inner + 16 outer lotus petals, central bindu.
 */
export const SriYantra: React.FC<SriYantraProps> = ({ className, style, variant = 'default' }) => {
  const cx = 100;
  const cy = 100;
  const isGold = variant === 'gold';
  const stroke = isGold ? "rgba(212, 175, 55, 0.5)" : "rgba(0, 242, 254, 0.45)";
  const strokeLight = isGold ? "rgba(212, 175, 55, 0.35)" : "rgba(0, 242, 254, 0.3)";
  const strokeThin = isGold ? "rgba(212, 175, 55, 0.25)" : "rgba(0, 242, 254, 0.2)";
  const binduColor = isGold ? "rgba(212, 175, 55, 0.7)" : "rgba(0, 242, 254, 0.7)";
  const binduColorInner = isGold ? "rgba(212, 175, 55, 0.95)" : "rgba(0, 242, 254, 0.95)";
  const glowColor = isGold ? "rgba(212, 175, 55, 0.5)" : "rgba(0, 242, 254, 0.45)";
  const glowColor2 = isGold ? "rgba(139, 92, 246, 0.2)" : "rgba(139, 92, 246, 0.15)";

  // Base angle ~52° (golden ratio), tan(52°) ≈ 1.28
  const tan52 = 1.28;

  // 5 downward triangles (Shakti) - apex at bottom, sized to fit within lotus ring
  const downHeights = [52, 40, 28, 16, 5];
  const downTriangles = downHeights.map((h) => {
    const halfBase = h * tan52;
    return `M ${cx - halfBase},${cy - h} L ${cx + halfBase},${cy - h} L ${cx},${cy + h} Z`;
  });

  // 4 upward triangles (Shiva) - apex at top
  const upHeights = [44, 30, 18, 6];
  const upTriangles = upHeights.map((h) => {
    const halfBase = h * tan52;
    return `M ${cx - halfBase},${cy + h} L ${cx + halfBase},${cy + h} L ${cx},${cy - h} Z`;
  });

  // 8 lotus petals (inner ring - Ashtadala Padma)
  const petal8 = Array.from({ length: 8 }, (_, i) => {
    const centerDeg = (i * 360) / 8 - 90;
    const halfSpan = 22.5;
    const rIn = 58;
    const rOut = 72;
    const deg = (d: number) => (d * Math.PI) / 180;
    const x = (r: number, a: number) => cx + r * Math.cos(deg(a));
    const y = (r: number, a: number) => cy - r * Math.sin(deg(a));
    const start = centerDeg - halfSpan;
    const end = centerDeg + halfSpan;
    return `M ${x(rIn, start)},${y(rIn, start)} A ${rIn},${rIn} 0 0,1 ${x(rIn, end)},${y(rIn, end)} L ${x(rOut, centerDeg)},${y(rOut, centerDeg)} Z`;
  });

  // 16 lotus petals (outer ring - Shodasabala Padma)
  const petal16 = Array.from({ length: 16 }, (_, i) => {
    const centerDeg = (i * 360) / 16 - 90;
    const halfSpan = 11.25;
    const rIn = 74;
    const rOut = 88;
    const deg = (d: number) => (d * Math.PI) / 180;
    const x = (r: number, a: number) => cx + r * Math.cos(deg(a));
    const y = (r: number, a: number) => cy - r * Math.sin(deg(a));
    const start = centerDeg - halfSpan;
    const end = centerDeg + halfSpan;
    return `M ${x(rIn, start)},${y(rIn, start)} A ${rIn},${rIn} 0 0,1 ${x(rIn, end)},${y(rIn, end)} L ${x(rOut, centerDeg)},${y(rOut, centerDeg)} Z`;
  });

  return (
    <div className={cn("relative", className)} style={style}>
      {/* Outer glow */}
      <motion.div
        className="absolute inset-[-40%] rounded-full"
        style={{
          background: isGold
            ? "radial-gradient(circle, rgba(212, 175, 55, 0.5) 0%, rgba(212, 175, 55, 0.2) 40%, transparent 70%)"
            : "radial-gradient(circle, rgba(0, 242, 254, 0.45) 0%, rgba(0, 242, 254, 0.2) 40%, transparent 70%)",
          filter: isGold
            ? `blur(30px) drop-shadow(0 0 40px ${glowColor})`
            : "blur(30px) drop-shadow(0 0 40px rgba(0, 242, 254, 0.5))",
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.8, 1, 0.8],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.svg
        viewBox="0 0 200 200"
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Outer circular frame */}
        <circle
          cx={cx}
          cy={cy}
          r="92"
          fill="none"
          stroke={strokeThin}
          strokeWidth="0.5"
        />

        {/* 16 lotus petals (outer ring - Shodasabala Padma) */}
        <g fill="none" stroke={strokeLight} strokeWidth="0.5">
          {petal16.map((d, i) => (
            <path key={`p16-${i}`} d={d} />
          ))}
        </g>

        {/* 8 lotus petals (inner ring - Ashtadala Padma) */}
        <g fill="none" stroke={strokeLight} strokeWidth="0.5">
          {petal8.map((d, i) => (
            <path key={`p8-${i}`} d={d} />
          ))}
        </g>

        {/* Inner circle between petals and triangles */}
        <circle
          cx={cx}
          cy={cy}
          r="54"
          fill="none"
          stroke={strokeThin}
          strokeWidth="0.3"
        />

        {/* 9 interlocking triangles - 5 downward (Shakti) */}
        <g fill="none" stroke={stroke} strokeWidth="0.6" strokeLinejoin="round">
          {downTriangles.map((d, i) => (
            <path key={`down-${i}`} d={d} />
          ))}
        </g>

        {/* 4 upward (Shiva) */}
        <g fill="none" stroke={stroke} strokeWidth="0.6" strokeLinejoin="round">
          {upTriangles.map((d, i) => (
            <path key={`up-${i}`} d={d} />
          ))}
        </g>

        {/* Central bindu (cosmic point) */}
        <circle cx={cx} cy={cy} r="4" fill={binduColor} />
        <circle cx={cx} cy={cy} r="2" fill={binduColorInner} />
      </motion.svg>

      {/* Center pulsing glow */}
      <motion.div
        className="absolute inset-[40%] rounded-full"
        style={{
          background: isGold
            ? `radial-gradient(circle, ${glowColor} 0%, ${glowColor2} 50%, transparent 70%)`
            : "radial-gradient(circle, rgba(0, 242, 254, 0.4) 0%, rgba(139, 92, 246, 0.15) 50%, transparent 70%)",
          filter: "blur(8px)",
        }}
        animate={{
          scale: [0.8, 1.2, 0.8],
          opacity: [0.5, 0.9, 0.5],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
};
