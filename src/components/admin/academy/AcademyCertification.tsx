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
    <div
      className="h-[calc(100vh-8rem)] flex flex-col academy-certification"
      style={{ background: '#050505', fontFamily: "'Plus Jakarta Sans', 'Montserrat', sans-serif" }}
    >
      {/* ── HEADER ── */}
      <header
        className="flex-none py-5 px-6 md:px-12 flex items-center justify-between z-50"
        style={{
          background: 'rgba(5,5,5,0.85)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          borderBottom: '1px solid rgba(212,175,55,0.12)',
        }}
      >
        {/* Logo + Title */}
        <div className="flex items-center gap-4 group cursor-pointer">
          {/* Siddha-Gold Sigil */}
          <div
            style={{
              width: 48,
              height: 48,
              background: 'linear-gradient(135deg, #D4AF37 0%, #F5D06A 50%, #B8960C 100%)',
              borderRadius: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              fontWeight: 900,
              color: '#050505',
              boxShadow: '0 0 24px rgba(212,175,55,0.45), 0 0 48px rgba(212,175,55,0.15)',
              transition: 'all 0.7s ease',
              letterSpacing: '-0.05em',
            }}
            className="group-hover:rotate-[360deg]"
          >
            S
          </div>
          <div>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 900,
                letterSpacing: '-0.05em',
                color: '#FFFFFF',
                lineHeight: 1,
                marginBottom: 3,
              }}
            >
              Siddha Quantum Nexus
            </h1>
            <p
              style={{
                fontSize: 8,
                fontWeight: 800,
                letterSpacing: '0.5em',
                textTransform: 'uppercase',
                color: '#D4AF37',
                opacity: 0.9,
              }}
            >
              Academy Certification
            </p>
          </div>
        </div>

        {/* Progress Pill + Language Toggle */}
        <div className="flex items-center gap-6">
          {/* Progress indicator */}
          <div style={{ textAlign: 'right' }}>
            <p
              style={{
                fontSize: 8,
                fontWeight: 800,
                letterSpacing: '0.5em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.4)',
                marginBottom: 6,
              }}
            >
              Modules Activated
            </p>
            <div
              style={{
                width: 140,
                height: 4,
                background: 'rgba(255,255,255,0.05)',
                borderRadius: 999,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #B8960C, #D4AF37, #F5D06A)',
                  borderRadius: 999,
                  boxShadow: '0 0 12px rgba(212,175,55,0.6)',
                  transition: 'width 1s ease-out',
                }}
              />
            </div>
            <p
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: '#D4AF37',
                marginTop: 4,
                textShadow: '0 0 10px rgba(212,175,55,0.4)',
              }}
            >
              {Math.round(progress)}% Complete
            </p>
          </div>
          <LanguageToggle language={language} onToggle={setLanguage} />
        </div>
      </header>

      {/* ── MAIN LAYOUT ── */}
      <main className="flex flex-1 overflow-hidden">

        {/* ── SIDEBAR — Module List ── */}
        <aside
          style={{
            width: 280,
            flexShrink: 0,
            background: 'rgba(255,255,255,0.015)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            borderRight: '1px solid rgba(212,175,55,0.08)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Sidebar Header */}
          <div
            style={{
              padding: '20px 20px 14px',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <p
              style={{
                fontSize: 8,
                fontWeight: 800,
                letterSpacing: '0.5em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.35)',
              }}
            >
              12-Month Curriculum
            </p>
          </div>

          {/* Module Cards */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
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

          {/* Error Banner */}
          {error && (
            <div
              style={{
                margin: '0 16px 16px',
                padding: '12px 16px',
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 16,
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: '#FCA5A5',
              }}
              className="animate-pulse"
            >
              {error}
            </div>
          )}
        </aside>

        {/* ── CONTENT AREA ── */}
        <section
          className="flex-1 overflow-y-auto custom-scrollbar"
          style={{ background: 'rgba(0,0,0,0.3)', position: 'relative' }}
        >
          {/* Ambient gold glow top-right */}
          <div
            style={{
              position: 'absolute',
              top: -100,
              right: -100,
              width: 400,
              height: 400,
              background: 'radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 70%)',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />

          <div
            style={{ maxWidth: 900, margin: '0 auto', padding: '48px 40px', position: 'relative', zIndex: 1 }}
          >
            {activeModule.content ? (
              <ContentSection
                content={activeModule.content}
                language={language}
              />
            ) : (
              /* ── EMPTY STATE — Await Transmission ── */
              <div
                className="flex flex-col items-center justify-center animate-in fade-in zoom-in duration-1000"
                style={{ minHeight: '60vh', textAlign: 'center' }}
              >
                {/* Sacred Geometry Icon */}
                <div style={{ position: 'relative', marginBottom: 32 }}>
                  <div
                    style={{
                      width: 96,
                      height: 96,
                      borderRadius: '50%',
                      background: 'radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 70%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid rgba(212,175,55,0.2)',
                      boxShadow: '0 0 40px rgba(212,175,55,0.1)',
                    }}
                  >
                    {/* Animated ring */}
                    <div
                      style={{
                        position: 'absolute',
                        inset: -8,
                        borderRadius: '50%',
                        border: '1px solid rgba(212,175,55,0.15)',
                        animation: 'spin 8s linear infinite',
                      }}
                    />
                    <svg
                      width={40}
                      height={40}
                      fill="none"
                      stroke="#D4AF37"
                      viewBox="0 0 24 24"
                      style={{ opacity: 0.8 }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                      />
                    </svg>
                  </div>
                </div>

                <h2
                  style={{
                    fontSize: 36,
                    fontWeight: 900,
                    letterSpacing: '-0.05em',
                    color: '#FFFFFF',
                    marginBottom: 16,
                    textShadow: '0 0 40px rgba(212,175,55,0.15)',
                  }}
                >
                  {activeModule.topic.split(':')[0]}
                </h2>

                <p
                  style={{
                    fontSize: 8,
                    fontWeight: 800,
                    letterSpacing: '0.5em',
                    textTransform: 'uppercase',
                    color: '#D4AF37',
                    marginBottom: 12,
                    opacity: 0.8,
                  }}
                >
                  Month {activeModule.month} · Vedic Light-Code Awaiting
                </p>

                <p
                  style={{
                    color: 'rgba(255,255,255,0.4)',
                    fontSize: 16,
                    fontWeight: 400,
                    lineHeight: 1.6,
                    maxWidth: 480,
                    marginBottom: 40,
                    fontStyle: 'italic',
                  }}
                >
                  The energetic blueprint for Month {activeModule.month} is awaiting transmission.
                  Channel the bilingual curriculum for this professional certification.
                </p>

                {/* ── ACTIVATE BUTTON ── */}
                <button
                  type="button"
                  onClick={() => handleGenerateContent(activeModule.id)}
                  disabled={isGenerating}
                  style={{
                    position: 'relative',
                    padding: '14px 36px',
                    borderRadius: 16,
                    border: 'none',
                    cursor: isGenerating ? 'not-allowed' : 'pointer',
                    opacity: isGenerating ? 0.6 : 1,
                    background: 'linear-gradient(135deg, #B8960C 0%, #D4AF37 50%, #F5D06A 100%)',
                    color: '#050505',
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: '0.3em',
                    textTransform: 'uppercase',
                    boxShadow: isGenerating
                      ? 'none'
                      : '0 0 30px rgba(212,175,55,0.4), 0 0 60px rgba(212,175,55,0.15)',
                    transition: 'all 0.5s ease',
                    transform: 'scale(1)',
                  }}
                  onMouseEnter={e => {
                    if (!isGenerating) {
                      (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)';
                      (e.currentTarget as HTMLButtonElement).style.boxShadow =
                        '0 0 40px rgba(212,175,55,0.6), 0 0 80px rgba(212,175,55,0.2)';
                    }
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow =
                      '0 0 30px rgba(212,175,55,0.4), 0 0 60px rgba(212,175,55,0.15)';
                  }}
                >
                  {isGenerating ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span
                        style={{
                          display: 'inline-block',
                          width: 16,
                          height: 16,
                          border: '2px solid rgba(5,5,5,0.3)',
                          borderTop: '2px solid #050505',
                          borderRadius: '50%',
                          animation: 'spin 0.8s linear infinite',
                        }}
                      />
                      Channeling Wisdom...
                    </span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <svg width={16} height={16} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Activate Curriculum
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Global spin keyframe */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.2); border-radius: 999px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(212,175,55,0.4); }
      `}</style>
    </div>
  );
};
