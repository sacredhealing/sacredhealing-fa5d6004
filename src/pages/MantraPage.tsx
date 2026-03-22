import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '@/hooks/useTranslation';

const MantraPage = () => {
  const { t } = useTranslation();
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-[#0f051a] text-white p-6 pb-24 font-serif">
      {/* DIN HELIGA TIMME BANNER */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl p-6 mb-8 shadow-[0_0_40px_rgba(212,175,55,0.1)]"
      >
        <div className="flex justify-between items-center relative z-10">
          <div>
            <h2 className="text-[#D4AF37] text-xs tracking-widest uppercase mb-1">{t('mantras.ritual.sacredHour')}</h2>
            <p className="text-2xl font-bold">{t('mantras.ritual.demoHora', { planet: 'Venus', pct: 80 })}</p>
          </div>
          <div className="text-4xl animate-pulse">♀️</div>
        </div>
        {/* Glow progress bar */}
        <div className="w-full h-1 bg-white/10 mt-4 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '80%' }}
            className="h-full bg-gradient-to-r from-[#D4AF37] to-[#f3e5ab]"
          />
        </div>
      </motion.div>

      {/* 108 COUNTER */}
      <div className="flex flex-col items-center justify-center my-12">
        <div className="relative w-64 h-64 flex items-center justify-center">
          <svg className="absolute w-full h-full transform -rotate-90">
            <circle cx="128" cy="128" r="120" stroke="rgba(212,175,55,0.1)" strokeWidth="4" fill="none" />
            <motion.circle
              cx="128"
              cy="128"
              r="120"
              stroke="#D4AF37"
              strokeWidth="6"
              fill="none"
              strokeDasharray="753"
              strokeDashoffset={753 - (753 * (count / 108))}
              strokeLinecap="round"
            />
          </svg>
          <div className="text-center">
            <span className="text-7xl font-light text-[#D4AF37]">{count}</span>
            <p className="text-white/40 uppercase tracking-widest text-xs mt-2">{t('mantras.of108')}</p>
          </div>
        </div>
      </div>

      {/* SOVEREIGN START BUTTON */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={{ boxShadow: ['0px 0px 0px rgba(212,175,55,0)', '0px 0px 30px rgba(212,175,55,0.4)', '0px 0px 0px rgba(212,175,55,0)'] }}
        transition={{ repeat: Infinity, duration: 2 }}
        onClick={() => setCount(prev => (prev < 108 ? prev + 1 : 0))}
        className="w-full py-5 rounded-2xl bg-[#D4AF37] text-[#0f051a] font-bold text-xl uppercase tracking-widest mb-10"
      >
        {t('mantras.ritual.startRitual')}
      </motion.button>

      {/* MANTRA LIST */}
      <h3 className="text-white/60 mb-4 text-sm uppercase tracking-widest">{t('mantras.ritual.selectFrequency')}</h3>
      <div className="space-y-4">
        {['Om Shukraya Namah', 'Om Gurave Namah', 'Om Namah Shivaya'].map((m, i) => (
          <div key={i} className={`p-5 rounded-2xl border ${i === 0 ? 'border-[#D4AF37] bg-white/5' : 'border-white/5 bg-transparent'}`}>
            <p className={`text-lg ${i === 0 ? 'text-[#D4AF37]' : 'text-white/80'}`}>{m}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MantraPage;
