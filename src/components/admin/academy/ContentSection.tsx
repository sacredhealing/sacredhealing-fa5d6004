import React from 'react';
import type { ModuleContent, Language } from '@/types/academy';

interface ContentSectionProps {
  content: ModuleContent;
  language: Language;
}

export const ContentSection: React.FC<ContentSectionProps> = ({ content, language }) => {
  if (!content) return null;

  return (
    <div className="space-y-24 pb-40 animate-in fade-in slide-in-from-bottom-12 duration-1000 ease-out">
      {/* Title & Frequency Overview */}
      <section className="relative">
        <div className="absolute -top-10 -left-10 w-60 h-60 bg-teal-500/5 blur-[120px] rounded-full pointer-events-none" />
        <h2 className="text-5xl md:text-7xl font-bold mb-10 leading-[1.05] text-white serif">{content.title?.[language] || 'Loading...'}</h2>
        <div className="glass p-10 md:p-14 rounded-[3rem] relative overflow-hidden group border-white/10">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-teal-500/5 to-transparent pointer-events-none" />
          <h4 className="text-[10px] font-black text-teal-400 uppercase tracking-[0.5em] mb-6">The Frequency Objective</h4>
          <p className="text-2xl md:text-3xl text-slate-200 leading-relaxed font-extralight italic serif">{content.objective?.[language] || 'No objective provided.'}</p>
        </div>
      </section>

      {/* Video Master Script */}
      <section>
        <div className="flex items-center gap-6 mb-12">
          <div className="w-16 h-16 bg-turquoise-gradient rounded-[1.5rem] flex items-center justify-center text-slate-900 shadow-[0_15px_45px_-10px_rgba(45,212,191,0.5)]">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-4xl md:text-5xl font-bold text-white serif">Sacred Transmission</h3>
        </div>
        <div className="grid grid-cols-1 gap-8">
          {content.videoScript?.sections?.map((section, idx) => (
            <div key={idx} className="glass p-10 md:p-12 rounded-[2.5rem] border-white/5 hover:border-teal-500/30 transition-all duration-700 group">
              <div className="flex flex-col md:flex-row gap-10">
                <div className="md:w-1/4">
                  <span className="text-teal-400 font-black tracking-[0.4em] uppercase text-[9px]">Module Verse 0{idx + 1}</span>
                  <h4 className="text-white font-bold text-xl mt-2 group-hover:text-teal-300 transition-colors duration-500">
                    {section.label?.[language] || 'Segment'}
                  </h4>
                </div>
                <div className="md:w-3/4 text-slate-400 text-xl leading-relaxed font-light italic group-hover:text-slate-100 transition-colors duration-500 border-l border-white/5 pl-10 md:pl-12">
                  &quot;{section.content?.[language] || '...'}&quot;
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Meditation Portal */}
      <section className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-teal-600/10 blur-[100px] opacity-40 pointer-events-none" />
        <div className="glass p-16 md:p-24 rounded-[4rem] relative z-10 border-white/10 group">
          <div className="flex justify-center mb-12">
            <div className="w-24 h-24 rounded-full border border-teal-500/20 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full border-2 border-teal-500/40 flex items-center justify-center animate-spin-slow">
                <div className="w-4 h-4 bg-teal-400 rounded-full shadow-[0_0_30px_#2dd4bf]" />
              </div>
            </div>
          </div>
          <h3 className="text-center text-teal-400 text-[10px] font-black uppercase tracking-[0.6em] mb-10">Guided Energy Practice</h3>
          <div className="text-3xl md:text-5xl text-center leading-[1.2] serif italic text-white max-w-4xl mx-auto font-light transition-all duration-1000 group-hover:scale-[1.01]">
            &quot;{content.meditationScript?.[language] || '...'}&quot;
          </div>
        </div>
      </section>

      {/* Field Journal & Integration */}
      <section>
        <div className="flex items-center gap-6 mb-12">
          <div className="w-16 h-16 bg-gold-gradient rounded-[1.5rem] flex items-center justify-center text-slate-900 shadow-[0_15px_45px_-10px_rgba(251,191,36,0.5)]">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-4xl md:text-5xl font-bold text-white serif">Initiate&apos;s Almanac</h3>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="glass p-12 rounded-[3.5rem] border-white/5">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-teal-400 mb-10 border-b border-white/5 pb-5">Core Reflection</h4>
            <div className="space-y-10">
              {content.workbook?.reflectionQuestions?.map((q, idx) => (
                <div key={idx} className="group cursor-default">
                  <span className="text-gold-gradient font-serif text-4xl opacity-30 group-hover:opacity-100 transition-opacity duration-700 block mb-2">0{idx + 1}</span>
                  <p className="text-slate-300 text-xl font-light leading-relaxed">{q?.[language] || '...'}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-10">
            <div className="glass p-12 rounded-[3.5rem] border-amber-500/20 flex-1 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gold-gradient opacity-60" />
              <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-8">Sacred Ritual Integration</h4>
              <div className="text-slate-200 leading-relaxed text-2xl font-light italic serif">
                {content.workbook?.practicalExercise?.[language] || 'No ritual provided.'}
              </div>
            </div>

            {/* Social Hook - Aura Broadcast */}
            <div className="bg-white/[0.03] p-10 rounded-[3.5rem] border border-white/5 relative group cursor-pointer hover:bg-white/[0.05] transition-colors">
              <div className="absolute top-6 right-10">
                <svg className="w-6 h-6 text-teal-500/40" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                </svg>
              </div>
              <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4">Aura Broadcast Signal</h4>
              <p className="text-teal-400 text-2xl font-light italic leading-snug">&quot;{content.socialHook?.[language] || '...'}&quot;</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
