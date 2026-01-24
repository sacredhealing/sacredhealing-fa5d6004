import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface EtherealPortalProps {
  className?: string;
}

export const EtherealPortal: React.FC<EtherealPortalProps> = ({ className }) => {
  return (
    <div className={cn("relative", className)}>
      {/* Outer glow ring */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(0, 242, 254, 0.15) 0%, transparent 70%)",
        }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Middle glow */}
      <motion.div
        className="absolute inset-[15%] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, rgba(0, 242, 254, 0.1) 50%, transparent 70%)",
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.6, 1, 0.6],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
      />

      {/* Sacred Geometry SVG - rotating slowly */}
      <motion.svg
        viewBox="0 0 100 100"
        className="absolute inset-0 w-full h-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      >
        {/* Outer circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke="rgba(0, 242, 254, 0.4)"
          fill="none"
          strokeWidth="0.5"
        />
        {/* Inner circle */}
        <circle
          cx="50"
          cy="50"
          r="30"
          stroke="rgba(139, 92, 246, 0.3)"
          fill="none"
          strokeWidth="0.5"
        />
        {/* Triangle pointing up */}
        <path
          d="M50 10 L85 75 L15 75 Z"
          stroke="rgba(0, 242, 254, 0.35)"
          fill="none"
          strokeWidth="0.5"
        />
        {/* Triangle pointing down */}
        <path
          d="M50 90 L85 25 L15 25 Z"
          stroke="rgba(139, 92, 246, 0.25)"
          fill="none"
          strokeWidth="0.5"
        />
      </motion.svg>

      {/* Center lotus glow */}
      <motion.div
        className="absolute inset-[30%] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(0, 242, 254, 0.4) 0%, rgba(139, 92, 246, 0.2) 40%, transparent 70%)",
          filter: "blur(8px)",
        }}
        animate={{
          scale: [0.9, 1.1, 0.9],
          opacity: [0.6, 1, 0.6],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Lotus Icon SVG */}
      <motion.svg
        viewBox="0 0 24 24"
        className="absolute inset-[35%] w-[30%] h-[30%]"
        fill="none"
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <path
          d="M12 2C12 2 8 6 8 10C8 12 10 14 12 14C14 14 16 12 16 10C16 6 12 2 12 2Z"
          fill="rgba(0, 242, 254, 0.6)"
        />
        <path
          d="M12 14C12 14 6 12 4 16C3 18 5 20 7 20C9 20 11 18 12 16"
          fill="rgba(0, 242, 254, 0.4)"
        />
        <path
          d="M12 14C12 14 18 12 20 16C21 18 19 20 17 20C15 20 13 18 12 16"
          fill="rgba(0, 242, 254, 0.4)"
        />
        <path
          d="M12 16C12 16 12 20 12 22"
          stroke="rgba(0, 242, 254, 0.5)"
          strokeWidth="1"
        />
      </motion.svg>
    </div>
  );
};
