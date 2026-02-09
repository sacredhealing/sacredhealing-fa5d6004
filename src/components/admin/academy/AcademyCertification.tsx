import React, { useState } from 'react';
import type { CourseModule, Language } from '@/types/academy';
import { ALL_MONTHS_SKELETON } from '@/constants/academy';
import { LanguageToggle } from './LanguageToggle';
import { ModuleCard } from './ModuleCard';
import { ContentSection } from './ContentSection';
import { generateModule } from '@/services/academyGeminiService';

export const AcademyCertification: React.FC = () => {
  const [language, setLanguage] = useState<Language>('en');
  const [modules, setModules] = useState<CourseModule[]>(ALL_MONTHS_SKELETON);
  const [activeModuleId, setActiveModuleId] = useState<number>(1);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const activeModule = modules.find(m => m.id === activeModuleId) || modules[0];

  const handleGenerateContent = async (id: number) => {
    const moduleToGen = modules.find(m => m.id === id);
    if (!moduleToGen) return;

    setIsGenerating(true);
    setError(null);

    try {
      const content = await generateModule(moduleToGen.month, moduleToGen.topic);
      setModules(prev => prev.map(m => m.id === id ? { ...m, content } : m));
    } catch (err) {
      console.error(err);
      setError('Energy transmission failed. Check API configuration.');
    } finally {
      setIsGenerating(false);
    }
  };

  const progress = (modules.filter(m => !!m.content).length / 12) * 100;

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col selection:bg-teal-500/40 academy-certification">
      {/* Header - Sacred Branding */}
      <header className="flex-none glass border-b border-white/10 py-5 px-6 md:px-12 flex items-center justify-between z-50">
        <div className="flex items-center gap-4 group cursor-pointer">
          <div className="w-12 h-12 md:w-14 md:h-14 bg-turquoise-gradient rounded-2xl flex items-center justify-center text-slate-900 font-serif text-3xl md:text-4xl font-bold shadow-[0_0_40px_rgba(45,212,191,0.4)] transition-all duration-700 group-hover:rotate-[360deg]">
            S
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white leading-none mb-1 serif">Sacred Healing</h1>
            <p className="text-[8px] md:text-[10px] font-black tracking-[0.4em] text-teal-400 uppercase opacity-90">Academy Certification</p>
          </div>
        </div>

        <LanguageToggle language={language} onToggle={setLanguage} />
      </header>

      {/* Main Container - Dashboard Layout */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Sidebar - Path of Mastery */}
        <aside className="w-full md:w-[400px] flex-none bg-black/40 md:border-r border-white/10 flex flex-col h-[40vh] md:h-full">
          <div className="p-8 md:p-10 border-b border-white/10 bg-white/[0.03]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Mastery Path</h2>
              <span className="text-xs font-black text-teal-400 tracking-widest">{modules.filter(m => !!m.content).length} / 12</span>
            </div>
            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden border border-white/5">
              <div
                className="bg-turquoise-gradient h-full transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(45,212,191,0.6)]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-4 custom-scrollbar">
            {modules.map((m) => (
              <ModuleCard
                key={m.id}
                module={m}
                language={language}
                isActive={activeModuleId === m.id}
                onClick={() => setActiveModuleId(m.id)}
              />
            ))}
          </div>

          {error && (
            <div className="m-6 p-4 bg-red-950/40 text-red-400 text-[9px] font-black uppercase tracking-[0.2em] rounded-2xl border border-red-500/30 animate-pulse">
              {error}
            </div>
          )}
        </aside>

        {/* Content Area - Transmission Portal */}
        <section className="flex-1 overflow-y-auto custom-scrollbar relative bg-black/10">
          <div className="max-w-5xl mx-auto px-6 py-12 md:px-16 md:py-24 relative z-10">
            {activeModule.content ? (
              <ContentSection
                content={activeModule.content}
                language={language}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-1000">
                <div className="w-32 h-32 glass rounded-[3rem] flex items-center justify-center mb-10 text-teal-400 group relative">
                  <div className="absolute inset-0 bg-turquoise-gradient blur-3xl opacity-10 group-hover:opacity-30 transition-all duration-1000" />
                  <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>

                <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 serif italic tracking-tight">
                  {activeModule.topic.split(':')[0]}
                </h2>

                <p className="text-slate-400 max-w-xl mb-12 text-lg md:text-2xl font-light leading-relaxed italic px-4">
                  The energetic blueprint for Month {activeModule.month} is awaiting transmission.
                  Channel the bilingual curriculum for this professional certification.
                </p>

                <button
                  type="button"
                  onClick={() => handleGenerateContent(activeModule.id)}
                  disabled={isGenerating}
                  className="relative group px-12 py-6 md:px-16 md:py-7 rounded-[2rem] transition-all duration-500 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="absolute inset-0 bg-turquoise-gradient rounded-[2rem] shadow-[0_20px_50px_rgba(45,212,191,0.4)] group-hover:shadow-[0_25px_60px_rgba(45,212,191,0.6)]" />
                  <div className="relative flex items-center gap-4 text-slate-900 font-black uppercase tracking-[0.3em] text-[10px] md:text-xs">
                    {isGenerating ? (
                      <>
                        <div className="animate-spin h-5 w-5 border-3 border-slate-900 border-t-transparent rounded-full" />
                        <span>Channeling Wisdom...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span>Activate Curriculum</span>
                      </>
                    )}
                  </div>
                </button>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};
