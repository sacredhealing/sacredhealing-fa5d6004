import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SriYantraProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Sri Yantra - Sacred geometry of 9 interlocking triangles
 * (4 upward/Shiva, 5 downward/Shakti) surrounding a central bindu.
 */
export const SriYantra: React.FC<SriYantraProps> = ({ className, style }) => {
  const stroke = "rgba(0, 242, 254, 0.4)";
  const strokeLight = "rgba(0, 242, 254, 0.25)";
  const strokeThin = "rgba(0, 242, 254, 0.15)";

  return (
    <div className={cn("relative", className)} style={style}>
      {/* Outer cyan glow - portal effect */}
      <motion.div
        className="absolute inset-[-40%] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(0, 242, 254, 0.45) 0%, rgba(0, 242, 254, 0.2) 40%, transparent 70%)",
          filter: "blur(30px) drop-shadow(0 0 40px rgba(0, 242, 254, 0.5))",
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

      {/* Sri Yantra SVG - 9 interlocking triangles (scaled from 504 to 200) */}
      <motion.svg
        viewBox="0 0 200 200"
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Outer square (bhupura) */}
        <rect
          x="12"
          y="12"
          width="176"
          height="176"
          fill="none"
          stroke={strokeThin}
          strokeWidth="0.5"
          rx="2"
        />

        {/* Lotus circles */}
        <circle cx="100" cy="100" r="88" fill="none" stroke={strokeThin} strokeWidth="0.3" />
        <circle cx="100" cy="100" r="78" fill="none" stroke={strokeLight} strokeWidth="0.4" />

        {/* 9 interlocking triangles - classic Sri Yantra structure */}
        {/* 5 downward triangles (Shakti) - outer to inner */}
        <polygon
          points="100,25 175,100 100,175 25,100"
          fill="none"
          stroke={strokeLight}
          strokeWidth="0.5"
        />
        <polygon
          points="100,38 162,100 100,162 38,100"
          fill="none"
          stroke={stroke}
          strokeWidth="0.6"
        />
        <polygon
          points="100,52 148,100 100,148 52,100"
          fill="none"
          stroke={stroke}
          strokeWidth="0.6"
        />
        <polygon
          points="100,68 132,100 100,132 68,100"
          fill="none"
          stroke={stroke}
          strokeWidth="0.5"
        />
        <polygon
          points="100,82 118,100 100,118 82,100"
          fill="none"
          stroke={strokeLight}
          strokeWidth="0.5"
        />

        {/* 4 upward triangles (Shiva) - interlocking */}
        <polygon
          points="100,138 35,55 165,55"
          fill="none"
          stroke={stroke}
          strokeWidth="0.6"
        />
        <polygon
          points="100,125 52,73 148,73"
          fill="none"
          stroke={stroke}
          strokeWidth="0.5"
        />
        <polygon
          points="100,112 68,88 132,88"
          fill="none"
          stroke={stroke}
          strokeWidth="0.5"
        />
        <polygon
          points="100,100 82,82 118,82"
          fill="none"
          stroke={strokeLight}
          strokeWidth="0.5"
        />

        {/* Central bindu (cosmic point) */}
        <circle cx="100" cy="100" r="5" fill="rgba(0, 242, 254, 0.6)" />
        <circle cx="100" cy="100" r="3" fill="rgba(0, 242, 254, 0.9)" />
      </motion.svg>

      {/* Center pulsing glow */}
      <motion.div
        className="absolute inset-[40%] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(0, 242, 254, 0.4) 0%, rgba(139, 92, 246, 0.15) 50%, transparent 70%)",
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
