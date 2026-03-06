import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import { useJyotishProfile } from '@/hooks/useJyotishProfile';
import { getGitaVerseForCycle } from '@/lib/gitaVerses';

const ExplorePage = () => {
  const [gitaExpanded, setGitaExpanded] = useState(false);
  const { mahadasha, isLoading } = useJyotishProfile();
  const verse = getGitaVerseForCycle(mahadasha);

  const categories = [
    { title: 'Deep Focus', freq: '432Hz', desc: 'Clarity & Wisdom', color: 'from-blue-500/20' },
    { title: 'Heart Opening', freq: '528Hz', desc: 'Love & Repair', color: 'from-green-500/20' },
    { title: 'Astral Journey', freq: '963Hz', desc: 'Divine Connection', color: 'from-purple-500/20' },
    { title: 'Physical Healing', freq: '174Hz', desc: 'Pain Relief', color: 'from-red-500/20' },
  ];

  const rishiInsight = `This verse aligns with your ${mahadasha} transit, providing the specific mental frequency needed to transmute today's karmic load.`;

  return (
    <div className="min-h-screen bg-[#0f051a] text-white p-6 pb-24">
      {/* 3RD EYE HERO BANNER */}
      <div className="relative h-64 rounded-3xl overflow-hidden mb-10">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0b2e] via-[#D4AF37]/20 to-[#0f051a]" />
        <div className="absolute inset-0 flex flex-col justify-center p-8">
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[#D4AF37] text-xs uppercase tracking-widest mb-2">
            Rishi Recommendation
          </motion.span>
          <h1 className="text-3xl font-bold mb-2">Venus Sound Bath</h1>
          <p className="text-white/60 max-w-[250px]">Today&apos;s alignment favors abundance and creative flow.</p>
          <Link
            to="/healing"
            className="mt-6 bg-white text-black px-6 py-2 rounded-full w-fit font-bold text-sm inline-block"
          >
            Play Now
          </Link>
        </div>
      </div>

      {/* BHAGAVAD GITA DAILY VERSE */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 rounded-2xl overflow-hidden border border-[#D4AF37]/30 bg-gradient-to-b from-[#1a0f08] to-[#0f051a]"
      >
        {/* Header — always visible, clickable */}
        <button
          onClick={() => setGitaExpanded(!gitaExpanded)}
          className="w-full flex items-center justify-between px-5 py-3 bg-[#1a0f08]/80 border-b border-[#D4AF37]/20"
        >
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-[#D4AF37] text-xs uppercase tracking-widest font-semibold">
              The Lord&apos;s Song (Gita)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-white/40" />
            {gitaExpanded ? (
              <ChevronUp className="w-4 h-4 text-white/40" />
            ) : (
              <ChevronDown className="w-4 h-4 text-white/40" />
            )}
          </div>
        </button>

        {/* Collapsed preview */}
        {!gitaExpanded && (
          <div className="px-5 py-4">
            <p className="text-[#D4AF37]/80 text-sm font-serif text-center leading-relaxed line-clamp-2">
              {verse.sanskrit}
            </p>
            <p className="text-white/40 text-xs text-center mt-2">
              Tap to read today&apos;s verse · Chapter {verse.chapter}, Verse {verse.verse}
            </p>
          </div>
        )}

        {/* Expanded content */}
        <AnimatePresence>
          {gitaExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="px-6 py-6 space-y-5">
                {/* Sanskrit */}
                <p className="text-[#D4AF37] text-lg font-serif text-center leading-relaxed">
                  {verse.sanskrit}
                </p>

                {/* Transliteration */}
                <p className="text-white/50 text-xs text-center uppercase tracking-wider whitespace-pre-line font-mono">
                  {verse.transliteration}
                </p>

                {/* Translation */}
                <p className="text-white/90 text-sm text-center leading-relaxed max-w-md mx-auto">
                  {verse.producersTranslation}
                </p>

                {/* Chapter reference */}
                <p className="text-[#D4AF37]/60 text-xs text-center uppercase tracking-widest">
                  Chapter {verse.chapter}, Verse {verse.verse}
                </p>

                {/* Divider */}
                <div className="border-t border-[#D4AF37]/15 pt-4">
                  <p className="text-white/40 text-[10px] text-center uppercase tracking-[0.2em] italic">
                    Rishi Insight: {rishiInsight}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <span className="text-[#D4AF37]">ॐ</span> Explore Frequencies
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
              <span className="text-[#D4AF37] font-bold text-xs">{cat.freq}</span>
              <h3 className="text-lg font-bold mt-1">{cat.title}</h3>
            </div>
            <p className="text-white/40 text-xs">{cat.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* COMMUNITY PREVIEW */}
      <div className="mt-10 p-6 rounded-3xl bg-white/5 border border-dashed border-white/20 text-center">
        <p className="text-white/60 mb-4 italic">&quot;Joining the circle enhances the resonance.&quot;</p>
        <Link
          to="/community"
          className="text-[#D4AF37] text-sm font-bold uppercase tracking-widest"
        >
          Open Community
        </Link>
      </div>
    </div>
  );
};

export default ExplorePage;
