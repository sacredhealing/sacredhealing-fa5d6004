import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { SQIApothecaryBanner } from '@/components/banners/SQIApothecaryBanner';

const ExplorePage = () => {
  const { t } = useTranslation();

  const categories = [
    { titleKey: 'exploreFrequencies.catDeepFocus' as const, freqKey: 'exploreFrequencies.catDeepFocusFreq' as const, descKey: 'exploreFrequencies.catDeepFocusDesc' as const, color: 'from-blue-500/20' },
    { titleKey: 'exploreFrequencies.catHeart' as const, freqKey: 'exploreFrequencies.catHeartFreq' as const, descKey: 'exploreFrequencies.catHeartDesc' as const, color: 'from-green-500/20' },
    { titleKey: 'exploreFrequencies.catAstral' as const, freqKey: 'exploreFrequencies.catAstralFreq' as const, descKey: 'exploreFrequencies.catAstralDesc' as const, color: 'from-purple-500/20' },
    { titleKey: 'exploreFrequencies.catPhysical' as const, freqKey: 'exploreFrequencies.catPhysicalFreq' as const, descKey: 'exploreFrequencies.catPhysicalDesc' as const, color: 'from-red-500/20' },
  ];

  return (
    <div className="min-h-screen bg-[#0f051a] text-white pb-24">
      {/* SQI QUANTUM APOTHECARY BANNER — full width, edge-to-edge */}
      <div className="px-0 pt-0">
        <SQIApothecaryBanner />
      </div>

      {/* Content body — padded */}
      <div className="px-6 pt-6">

      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <span className="text-[#D4AF37]">ॐ</span> {t('exploreFrequencies.exploreFrequenciesTitle')}
      </h2>

      {/* GRID CARDS */}
      <div className="grid grid-cols-2 gap-4">
        {categories.map((cat, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -5 }}
            className={`p-6 rounded-3xl bg-gradient-to-br ${cat.color} to-white/5 border border-white/10 flex flex-col justify-between h-48`}
          >
            <div>
              <span className="text-[#D4AF37] font-bold text-xs">{t(cat.freqKey)}</span>
              <h3 className="text-lg font-bold mt-1">{t(cat.titleKey)}</h3>
            </div>
            <p className="text-white/40 text-xs">{t(cat.descKey)}</p>
          </motion.div>
        ))}
      </div>

      {/* COMMUNITY PREVIEW */}
      <div className="mt-10 p-6 rounded-3xl bg-white/5 border border-dashed border-white/20 text-center">
        <p className="text-white/60 mb-4 italic">&quot;{t('exploreFrequencies.communityQuote')}&quot;</p>
        <Link
          to="/community"
          className="text-[#D4AF37] text-sm font-bold uppercase tracking-widest"
        >
          {t('exploreFrequencies.openCommunity')}
        </Link>
      </div>
    </div>
  </div>
  );
};

export default ExplorePage;

