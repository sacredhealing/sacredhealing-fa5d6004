import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Sparkles, Heart, Play } from 'lucide-react';

/** The Inner Sanctum — Three Gateways (arched/lotus) with dynamic glow by time & Hora. */
interface ThreeGatewaysProps {
  horaPlanet: string;
  isNight: boolean;
}

const GATEWAYS = [
  { id: 'mantra', route: '/mantras', icon: Sparkles, labelKey: 'dashboard.mantra' },
  { id: 'soul', route: '/healing', icon: Heart, labelKey: 'dashboard.soul' },
  { id: 'meditate', route: '/meditations', icon: Play, labelKey: 'dashboard.meditate' },
];

export const ThreeGateways: React.FC<ThreeGatewaysProps> = ({ horaPlanet, isNight }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Dynamic intensity: Soul glows brighter at night; Mantra pulses when Moon Hora suggests action
  const isMoonHora = horaPlanet.toLowerCase() === 'moon' || horaPlanet.toLowerCase() === 'chandra';
  const mantraPulse = isMoonHora;
  const soulGlow = isNight;

  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-4">
      {GATEWAYS.map((gate, index) => {
        const Icon = gate.icon;
        const isSoul = gate.id === 'soul';
        const isMantra = gate.id === 'mantra';
        const shouldGlow = (isSoul && soulGlow) || (isMantra && mantraPulse);

        return (
          <motion.button
            key={gate.id}
            onClick={() => navigate(gate.route)}
            className="group relative"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Lotus/arch silhouette */}
            <div
              className={`relative overflow-hidden rounded-2xl border p-4 sm:p-5 flex flex-col items-center justify-center min-h-[100px] sm:min-h-[110px] transition-all duration-500
                ${isSoul && soulGlow
                  ? 'bg-gradient-to-b from-amber-900/50 via-purple-900/30 to-amber-950/40 border-amber-500/40 shadow-[0_0_30px_rgba(212,175,55,0.25)]'
                  : isMantra && mantraPulse
                    ? 'bg-gradient-to-b from-purple-900/40 via-violet-800/30 to-purple-950/40 border-purple-400/40 shadow-[0_0_20px_rgba(139,92,246,0.2)]'
                    : 'bg-gradient-to-b from-white/5 via-white/[0.02] to-white/5 border-white/10 hover:border-white/20'
                }`}
            >
              {/* Arch shape overlay */}
              <div className="absolute inset-0 flex items-end justify-center pointer-events-none overflow-hidden rounded-2xl">
                <svg viewBox="0 0 120 80" className="w-full h-16 text-white/5 group-hover:text-white/10 transition-colors">
                  <path
                    d="M 10 80 Q 60 0 110 80"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                  />
                </svg>
              </div>

              <motion.div
                className={`relative z-10 flex flex-col items-center gap-1.5
                  ${shouldGlow ? 'text-amber-300' : 'text-white/90'}`}
                animate={
                  shouldGlow
                    ? {
                        filter: [
                          'drop-shadow(0 0 6px rgba(212,175,55,0.4))',
                          'drop-shadow(0 0 12px rgba(212,175,55,0.6))',
                          'drop-shadow(0 0 6px rgba(212,175,55,0.4))',
                        ],
                      }
                    : {}
                }
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <Icon className={`w-8 h-8 sm:w-9 sm:h-9 ${shouldGlow ? 'text-[#D4AF37]' : 'text-white/80'}`} />
                <span className="text-xs sm:text-sm font-heading font-semibold">
                  {t(gate.labelKey)}
                </span>
              </motion.div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
};
