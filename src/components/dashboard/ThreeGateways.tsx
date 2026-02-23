import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Sparkles, Heart, Play } from 'lucide-react';

/** Three Gateways — Sacred Sound, Inner Light, Stillness. Circular portal design with gold glow by Hora. */
interface ThreeGatewaysProps {
  horaPlanet: string;
  isNight: boolean;
}

const GATEWAYS = [
  { id: 'sacredSound', route: '/mantras', icon: Sparkles, labelKey: 'dashboard.sacredSound' },
  { id: 'innerLight', route: '/healing', icon: Heart, labelKey: 'dashboard.innerLight' },
  { id: 'stillness', route: '/meditations', icon: Play, labelKey: 'dashboard.stillness' },
];

export const ThreeGateways: React.FC<ThreeGatewaysProps> = ({ horaPlanet, isNight }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const isMoonHora = horaPlanet.toLowerCase() === 'moon' || horaPlanet.toLowerCase() === 'chandra';
  const mantraPulse = isMoonHora;
  const soulGlow = isNight;

  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-4">
      {GATEWAYS.map((gate, index) => {
        const Icon = gate.icon;
        const isSoul = gate.id === 'innerLight';
        const isMantra = gate.id === 'sacredSound';
        const shouldGlow = (isSoul && soulGlow) || (isMantra && mantraPulse);

        return (
          <motion.button
            key={gate.id}
            onClick={() => navigate(gate.route)}
            className="group relative flex flex-col items-center"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div
              className={`relative rounded-2xl border transition-all duration-300 w-full flex flex-col items-center justify-center p-4 sm:p-5 min-h-[100px] sm:min-h-[110px]
                ${shouldGlow
                  ? 'bg-[rgba(212,175,55,0.08)] border-[rgba(212,175,55,0.2)]'
                  : 'bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.04)] hover:bg-[rgba(212,175,55,0.08)] hover:border-[rgba(212,175,55,0.2)]'
                }`}
            >
              {/* Circular portal */}
              <motion.div
                className="relative z-10 flex flex-col items-center gap-2"
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
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center border border-[rgba(212,175,55,0.2)] shrink-0"
                  style={{
                    background: 'radial-gradient(circle, rgba(212,175,55,0.12) 0%, transparent 70%)',
                  }}
                >
                  <Icon className={`w-6 h-6 ${shouldGlow ? 'text-[#D4AF37]' : 'text-[#D4AF37]'}`} />
                </div>
                <span
                  className="text-[11px] uppercase tracking-[0.15em] text-[#9C8E7A] text-center"
                  style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}
                >
                  {t(gate.labelKey, gate.id === 'sacredSound' ? 'Sacred Sound' : gate.id === 'innerLight' ? 'Inner Light' : 'Stillness')}
                </span>
              </motion.div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
};
