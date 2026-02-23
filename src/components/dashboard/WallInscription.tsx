import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';

/** The Oracle & Sync — Combined Celestial Sync + Quick Oracle as one expandable Wall Inscription. */
interface WallInscriptionProps {
  userName: string;
  dashaCycle: string;
  horaPlanet: string;
  successWindowPct: number;
  wisdomQuote: string | null;
}

export const WallInscription: React.FC<WallInscriptionProps> = ({
  userName,
  dashaCycle,
  horaPlanet,
  successWindowPct,
  wisdomQuote,
}) => {
  const [expanded, setExpanded] = useState(false);

  const oneLiner = wisdomQuote
    ? `"${wisdomQuote.slice(0, 60)}${wisdomQuote.length > 60 ? '…' : ''}"`
    : `${userName}, your ${dashaCycle} Cycle is active. Current window: ${horaPlanet} Hora.`;

  return (
    <motion.div
      className="rounded-xl border border-[#D4AF37]/10 bg-[#D4AF37]/5 overflow-hidden"
      initial={false}
      animate={{ borderColor: expanded ? 'rgba(212,175,55,0.2)' : 'rgba(212,175,55,0.1)' }}
      transition={{ duration: 0.3 }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left"
      >
        <p
          className="text-xs sm:text-sm font-serif italic text-[#D4AF37]/50 leading-snug flex-1 min-w-0 truncate"
          style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}
        >
          {oneLiner}
        </p>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-amber-400/70 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-amber-400/70 shrink-0" />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0 border-t border-amber-500/10 space-y-3">
              {/* Celestial Sync */}
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-amber-400/70 mb-1">Celestial Sync</p>
                <p className="text-sm text-amber-100/90 font-serif">
                  {userName}, your {dashaCycle} Cycle is active. Current Success Window: {horaPlanet} Hora — {successWindowPct}%.
                </p>
              </div>
              {/* Quick Oracle */}
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#D4AF37]/70 mb-1">Quick Oracle</p>
                {wisdomQuote ? (
                  <p className="text-sm font-serif italic text-amber-100/90 leading-relaxed">
                    &ldquo;{wisdomQuote}&rdquo;
                  </p>
                ) : (
                  <p className="text-sm text-white/70">
                    Align with the current {horaPlanet} Hora for clarity. Get your full Akashic Verdict in Jyotish.
                  </p>
                )}
                <Link
                  to="/vedic-astrology"
                  className="inline-block mt-2 text-xs text-amber-400/90 hover:text-amber-300 font-medium"
                >
                  See full verdict →
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
