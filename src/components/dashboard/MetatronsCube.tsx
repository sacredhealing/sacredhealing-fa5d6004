import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MetatronsCubeProps {
  className?: string;
}

export const MetatronsCube: React.FC<MetatronsCubeProps> = ({ className }) => {
  return (
    <div className={cn("relative", className)}>
      {/* Outer turquoise glow */}
      <motion.div
        className="absolute inset-[-20%] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(0, 242, 254, 0.2) 0%, rgba(0, 242, 254, 0.05) 40%, transparent 70%)",
          filter: "blur(15px)",
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.6, 0.9, 0.6],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Inner purple glow */}
      <motion.div
        className="absolute inset-[10%] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 60%)",
          filter: "blur(10px)",
        }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
      />

      {/* Metatron's Cube SVG - slowly rotating */}
      <motion.svg
        viewBox="0 0 200 200"
        className="absolute inset-0 w-full h-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
      >
        {/* Outer circle */}
        <circle cx="100" cy="100" r="95" stroke="rgba(0, 242, 254, 0.3)" fill="none" strokeWidth="0.5" />
        
        {/* 6 outer circles forming the Flower of Life base */}
        <circle cx="100" cy="30" r="35" stroke="rgba(0, 242, 254, 0.25)" fill="none" strokeWidth="0.5" />
        <circle cx="160" cy="65" r="35" stroke="rgba(0, 242, 254, 0.25)" fill="none" strokeWidth="0.5" />
        <circle cx="160" cy="135" r="35" stroke="rgba(0, 242, 254, 0.25)" fill="none" strokeWidth="0.5" />
        <circle cx="100" cy="170" r="35" stroke="rgba(0, 242, 254, 0.25)" fill="none" strokeWidth="0.5" />
        <circle cx="40" cy="135" r="35" stroke="rgba(0, 242, 254, 0.25)" fill="none" strokeWidth="0.5" />
        <circle cx="40" cy="65" r="35" stroke="rgba(0, 242, 254, 0.25)" fill="none" strokeWidth="0.5" />
        
        {/* Center circle */}
        <circle cx="100" cy="100" r="35" stroke="rgba(0, 242, 254, 0.35)" fill="none" strokeWidth="0.5" />

        {/* Hexagon connecting outer points */}
        <polygon 
          points="100,30 160,65 160,135 100,170 40,135 40,65" 
          stroke="rgba(139, 92, 246, 0.3)" 
          fill="none" 
          strokeWidth="0.5" 
        />

        {/* Inner hexagon (rotated 30 degrees equivalent) */}
        <polygon 
          points="130,47 165,100 130,153 70,153 35,100 70,47" 
          stroke="rgba(0, 242, 254, 0.2)" 
          fill="none" 
          strokeWidth="0.5" 
        />

        {/* Lines connecting all 13 points (simplified Metatron's Cube) */}
        {/* Top to center */}
        <line x1="100" y1="30" x2="100" y2="100" stroke="rgba(0, 242, 254, 0.2)" strokeWidth="0.5" />
        {/* Top-right to center */}
        <line x1="160" y1="65" x2="100" y2="100" stroke="rgba(0, 242, 254, 0.2)" strokeWidth="0.5" />
        {/* Bottom-right to center */}
        <line x1="160" y1="135" x2="100" y2="100" stroke="rgba(0, 242, 254, 0.2)" strokeWidth="0.5" />
        {/* Bottom to center */}
        <line x1="100" y1="170" x2="100" y2="100" stroke="rgba(0, 242, 254, 0.2)" strokeWidth="0.5" />
        {/* Bottom-left to center */}
        <line x1="40" y1="135" x2="100" y2="100" stroke="rgba(0, 242, 254, 0.2)" strokeWidth="0.5" />
        {/* Top-left to center */}
        <line x1="40" y1="65" x2="100" y2="100" stroke="rgba(0, 242, 254, 0.2)" strokeWidth="0.5" />

        {/* Cross-connections for cube effect */}
        <line x1="100" y1="30" x2="160" y2="135" stroke="rgba(139, 92, 246, 0.15)" strokeWidth="0.5" />
        <line x1="100" y1="30" x2="40" y2="135" stroke="rgba(139, 92, 246, 0.15)" strokeWidth="0.5" />
        <line x1="160" y1="65" x2="40" y2="135" stroke="rgba(139, 92, 246, 0.15)" strokeWidth="0.5" />
        <line x1="160" y1="65" x2="100" y2="170" stroke="rgba(139, 92, 246, 0.15)" strokeWidth="0.5" />
        <line x1="40" y1="65" x2="160" y2="135" stroke="rgba(139, 92, 246, 0.15)" strokeWidth="0.5" />
        <line x1="40" y1="65" x2="100" y2="170" stroke="rgba(139, 92, 246, 0.15)" strokeWidth="0.5" />

        {/* Small circles at vertices for glow points */}
        <circle cx="100" cy="30" r="3" fill="rgba(0, 242, 254, 0.5)" />
        <circle cx="160" cy="65" r="3" fill="rgba(0, 242, 254, 0.4)" />
        <circle cx="160" cy="135" r="3" fill="rgba(0, 242, 254, 0.4)" />
        <circle cx="100" cy="170" r="3" fill="rgba(0, 242, 254, 0.5)" />
        <circle cx="40" cy="135" r="3" fill="rgba(0, 242, 254, 0.4)" />
        <circle cx="40" cy="65" r="3" fill="rgba(0, 242, 254, 0.4)" />
        <circle cx="100" cy="100" r="4" fill="rgba(0, 242, 254, 0.6)" />
      </motion.svg>

      {/* Center pulsing glow */}
      <motion.div
        className="absolute inset-[40%] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(0, 242, 254, 0.5) 0%, rgba(139, 92, 246, 0.2) 50%, transparent 70%)",
          filter: "blur(6px)",
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
