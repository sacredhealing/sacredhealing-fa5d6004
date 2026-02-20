import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const ExplorePage = () => {
  const categories = [
    { title: 'Deep Focus', freq: '432Hz', desc: 'Clarity & Wisdom', color: 'from-blue-500/20' },
    { title: 'Heart Opening', freq: '528Hz', desc: 'Love & Repair', color: 'from-green-500/20' },
    { title: 'Astral Journey', freq: '963Hz', desc: 'Divine Connection', color: 'from-purple-500/20' },
    { title: 'Physical Healing', freq: '174Hz', desc: 'Pain Relief', color: 'from-red-500/20' },
  ];

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
