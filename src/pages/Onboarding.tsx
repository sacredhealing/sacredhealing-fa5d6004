import React, { useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GoalSelector } from '@/components/onboarding/GoalSelector';
import { DurationSelector } from '@/components/onboarding/DurationSelector';
import { TimeSelector } from '@/components/onboarding/TimeSelector';
import { PathRecommendation } from '@/components/onboarding/PathRecommendation';
import { useOnboarding } from '@/hooks/useOnboarding';
import { AppDisclaimer } from '@/components/AppDisclaimer';

const TOTAL_STEPS = 5;

const SriYantraSvg = () => (
  <div className="relative flex items-center justify-center w-[280px] h-[280px]">
    <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,175,55,0.12) 0%, transparent 70%)', animation: 'siddhiSpin 20s ease-in-out infinite' }} />
    <svg className="w-full h-full" width="280" height="280" viewBox="0 0 280 280" fill="none" style={{ animation: 'siddhiSpin 150s linear infinite' }}>
      <circle cx="140" cy="140" r="135" stroke="#D4AF37" strokeWidth="0.8" opacity="0.6" />
      <circle cx="140" cy="140" r="125" stroke="#D4AF37" strokeWidth="0.4" opacity="0.3" />
      {Array.from({ length: 16 }).map((_, i) => {
        const angle = (i * 22.5) * Math.PI / 180;
        const x = 140 + 118 * Math.cos(angle);
        const y = 140 + 118 * Math.sin(angle);
        const x2 = 140 + 118 * Math.cos(angle + 0.2);
        const y2 = 140 + 118 * Math.sin(angle + 0.2);
        return <path key={i} d={`M140 140 Q${x} ${y} ${x2} ${y2} Z`} stroke="#D4AF37" strokeWidth="0.6" fill="rgba(212,175,55,0.04)" opacity="0.7" />;
      })}
      <polygon points="140,30 242,198 38,198" stroke="#D4AF37" strokeWidth="1.2" fill="none" opacity="0.95" />
      <polygon points="140,250 242,82 38,82" stroke="#D4AF37" strokeWidth="1.2" fill="none" opacity="0.95" />
      <polygon points="140,55 222,183 58,183" stroke="#D4AF37" strokeWidth="0.8" fill="none" opacity="0.7" />
      <polygon points="140,225 222,97 58,97" stroke="#D4AF37" strokeWidth="0.8" fill="none" opacity="0.7" />
      <polygon points="140,82 202,168 78,168" stroke="#D4AF37" strokeWidth="0.7" fill="none" opacity="0.6" />
      <polygon points="140,198 202,112 78,112" stroke="#D4AF37" strokeWidth="0.7" fill="none" opacity="0.6" />
      <polygon points="140,105 186,155 94,155" stroke="#D4AF37" strokeWidth="0.6" fill="none" opacity="0.5" />
      <polygon points="140,175 186,125 94,125" stroke="#D4AF37" strokeWidth="0.6" fill="none" opacity="0.5" />
      <circle cx="140" cy="140" r="55" stroke="#D4AF37" strokeWidth="0.6" opacity="0.4" />
      <circle cx="140" cy="140" r="35" stroke="#D4AF37" strokeWidth="0.5" opacity="0.3" />
      <circle cx="140" cy="140" r="18" stroke="#D4AF37" strokeWidth="0.5" opacity="0.4" />
      <circle cx="140" cy="140" r="4" fill="#D4AF37" opacity="0.9" />
      <circle cx="140" cy="140" r="8" fill="rgba(212,175,55,0.2)" opacity="0.8" />
    </svg>
    <div style={{ position: 'absolute', width: 20, height: 20, borderRadius: '50%', background: '#D4AF37', opacity: 0.3, animation: 'glowBreathe 2s ease-in-out infinite', filter: 'blur(8px)' }} />
  </div>
);

const Onboarding: React.FC = () => {
  const {
    data,
    updateData,
    toggleGoal,
    currentStep,
    nextStep,
    prevStep,
    completeOnboarding,
    isSubmitting,
  } = useOnboarding();

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let animId: number;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    class Particle {
      x = 0; y = 0; size = 0; speedX = 0; speedY = 0; life = 0; maxLife = 0; growing = true; color = '212,175,55';
      constructor() { this.reset(); }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 1.5 + 0.3;
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.speedY = (Math.random() - 0.5) * 0.3;
        this.life = Math.random();
        this.maxLife = Math.random() * 0.005 + 0.001;
        this.growing = true;
        const c = ['212,175,55', '255,255,255', '34,211,238'];
        this.color = c[Math.floor(Math.random() * 3)];
      }
      update() {
        this.x += this.speedX; this.y += this.speedY;
        if (this.growing) { this.life += this.maxLife; if (this.life >= 1) this.growing = false; }
        else { this.life -= this.maxLife; if (this.life <= 0) this.reset(); }
        if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) this.reset();
      }
      draw() {
        ctx.save(); ctx.globalAlpha = this.life * 0.6;
        ctx.fillStyle = `rgba(${this.color},1)`;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
    }
    const particles = Array.from({ length: 200 }, () => new Particle());
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => { p.update(); p.draw(); });
      animId = requestAnimationFrame(animate);
    };
    animate();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  const showProgress = currentStep >= 1 && currentStep <= 4;
  const progressWidth = (currentStep / 4) * 100;

  return (
    <div className="min-h-screen flex flex-col bg-[#050505] overflow-hidden relative">
      {/* Shared background + particles — always mounted */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] animate-[stardustMove_150s_linear_infinite]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,_rgba(212,175,55,0.08)_0%,_transparent_60%)]" />
      </div>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-[1] opacity-50" />

      {/* Step 0: Welcome */}
      {currentStep === 0 && (
        <>
          <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12">
            <div className="onb-step text-center flex flex-col items-center">
              <SriYantraSvg />
              <p className="mt-6 text-[#D4AF37]/60 text-[8px] font-extrabold tracking-[0.5em] uppercase" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                ◈ SIDDHA-QUANTUM INTELLIGENCE · 2050
              </p>
              <h1 className="mt-3 text-white font-[300] italic leading-tight" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(2.5rem, 6vw, 4rem)' }}>
                Welcome, Sacred Soul
              </h1>
              <p className="mt-4 text-white/50 text-[0.9rem] leading-[1.7] max-w-md" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 400 }}>
                Let's attune your field to the frequencies that serve you most.
              </p>
              <div className="mt-6 px-5 py-3 rounded-full bg-white/[0.03] border border-[#D4AF37]/30 flex items-center gap-2 text-[#D4AF37] text-sm">
                <Sparkles className="w-4 h-4 flex-shrink-0" />
                <span>✦ Earn +50 SHC for completing your attunement</span>
              </div>
              <Button
                onClick={nextStep}
                className="mt-8 w-full max-w-sm py-5 rounded-full bg-[#D4AF37] hover:bg-[#D4AF37] text-black font-extrabold text-[9px] tracking-[0.4em] uppercase shadow-[0_0_30px_rgba(212,175,55,0.3)]"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                BEGIN ATTUNEMENT →
              </Button>
            </div>
          </div>
          <AppDisclaimer className="relative z-10 pb-6" />
        </>
      )}

      {/* Steps 1–4: progress bar + content + nav */}
      {currentStep >= 1 && (
        <>
      {showProgress && (
        <div className="relative z-20 pt-0 px-0">
          <div className="h-[1px] bg-white/10" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div
              className="h-full bg-gradient-to-r from-[#D4AF37] to-[#22D3EE] transition-[width] duration-[0.6s] ease-out"
              style={{ width: `${progressWidth}%` }}
            />
          </div>
          <p className="text-center text-white/30 text-[7px] font-extrabold tracking-[0.5em] uppercase mt-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            STEP {currentStep} OF 4
          </p>
        </div>
      )}

      <div className="relative z-10 flex-1 flex flex-col items-center overflow-auto px-6 pt-8 pb-32">
        <div className="onb-step w-full max-w-[500px] mx-auto">

          {currentStep === 1 && (
            <>
              <h2 className="text-white font-[300] italic text-[3rem] leading-tight text-center mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                Why are you here?
              </h2>
              <p className="text-white/40 text-[9px] font-normal tracking-[0.4em] uppercase text-center mb-8" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                CHOOSE WHAT CALLS TO YOUR SOUL · SELECT ALL THAT APPLY
              </p>
              <GoalSelector selectedGoals={data.goals} onToggle={toggleGoal} />
              {data.goals.length > 0 && (
                <p className="text-center text-sm text-white/40 mt-4">{data.goals.length} selected</p>
              )}
            </>
          )}

          {currentStep === 2 && (
            <>
              <h2 className="text-white font-[300] italic text-[3rem] leading-tight text-center mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                How deep can you go?
              </h2>
              <p className="text-white/40 text-[9px] font-normal tracking-[0.4em] uppercase text-center mb-8" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                CHOOSE YOUR DAILY TRANSMISSION WINDOW
              </p>
              <DurationSelector
                selectedDuration={data.practiceDuration}
                onSelect={(duration) => updateData({ practiceDuration: duration })}
              />
            </>
          )}

          {currentStep === 3 && (
            <>
              <h2 className="text-white font-[300] italic text-[3rem] leading-tight text-center mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                Set your sacred rhythm
              </h2>
              <p className="text-white/40 text-[9px] font-normal tracking-[0.4em] uppercase text-center mb-8" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                YOUR FIELD WILL BE PRIMED AT THESE MOMENTS
              </p>
              <TimeSelector
                morningTime={data.morningTime}
                middayTime={data.middayTime}
                eveningTime={data.eveningTime}
                onMorningChange={(time) => updateData({ morningTime: time })}
                onMiddayChange={(time) => updateData({ middayTime: time })}
                onEveningChange={(time) => updateData({ eveningTime: time })}
              />
            </>
          )}

          {currentStep === 4 && (
            <>
              <h2 className="text-white font-[300] italic text-[3rem] leading-tight text-center mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                Your Sovereign Path
              </h2>
              <p className="text-white/40 text-[9px] font-normal tracking-[0.4em] uppercase text-center mb-6" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                AKASHA-NEURAL ARCHIVE · TRANSMISSION LOCKED
              </p>
              <div className="rounded-3xl border border-[#D4AF37]/20 bg-white/[0.02] backdrop-blur-xl p-8">
                <p className="text-[#D4AF37] text-[8px] font-extrabold tracking-widest uppercase mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  ◈ YOUR FIELD HAS BEEN READ
                </p>
                <PathRecommendation userGoals={data.goals} />
              </div>
            </>
          )}

        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-20 flex justify-center px-6 py-6 bg-gradient-to-t from-[#050505] via-[#050505]/95 to-transparent pt-8">
        <div className="w-full max-w-[500px] flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            onClick={prevStep}
            className="text-white/30 hover:text-white/50 font-extrabold text-[8px] tracking-widest uppercase px-4"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            ← BACK
          </Button>
          <Button
            onClick={currentStep === 4 ? completeOnboarding : nextStep}
            disabled={(currentStep === 1 && data.goals.length === 0) || isSubmitting}
            className="rounded-full bg-[#D4AF37] hover:bg-[#D4AF37] text-black font-extrabold text-[9px] tracking-[0.4em] uppercase shadow-[0_0_30px_rgba(212,175,55,0.3)] py-5 px-8"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            {isSubmitting ? 'Please wait...' : currentStep === 4 ? 'SEAL THE TRANSMISSION →' : 'NEXT →'}
          </Button>
        </div>
      </div>

      <AppDisclaimer className="relative z-10 pb-2" />
        </>
      )}

      <style>{`
        @keyframes stardustMove { from{background-position:0 0} to{background-position:1000px 1000px} }
        @keyframes siddhiSpin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes glowBreathe { 0%,100%{opacity:0.3;transform:scale(1)} 50%{opacity:0.8;transform:scale(1.2)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse-scale { 0%,100%{transform:scale(1)} 50%{transform:scale(1.1)} }
        .onb-step { animation: fadeUp 0.6s ease both; }
        .onb-card { transition: all 0.3s cubic-bezier(0.23,1,0.32,1); }
        .onb-card:hover { transform: translateY(-3px); border-color: rgba(212,175,55,0.2); }
      `}</style>
    </div>
  );
};

export default Onboarding;
