import React from 'react';
import { useTranslation } from 'react-i18next';
import { useDailyQuote } from '@/hooks/useDailyQuote';

const FlameSVG = () => (
  <svg
    viewBox="0 0 24 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{
      width: 26,
      height: 26,
      animation: 'vishFlameFlicker 2.4s ease-in-out infinite',
      transformOrigin: 'center bottom',
    }}
  >
    <defs>
      <radialGradient id="vfg1" cx="50%" cy="80%" r="60%">
        <stop offset="0%"   stopColor="#FFF4B0" stopOpacity="1"/>
        <stop offset="35%"  stopColor="#F5C842" stopOpacity="1"/>
        <stop offset="70%"  stopColor="#D4861A" stopOpacity="0.95"/>
        <stop offset="100%" stopColor="#8B3A00" stopOpacity="0.6"/>
      </radialGradient>
      <radialGradient id="vfg2" cx="50%" cy="70%" r="55%">
        <stop offset="0%"   stopColor="#FFE566" stopOpacity="0.9"/>
        <stop offset="50%"  stopColor="#E8A020" stopOpacity="0.7"/>
        <stop offset="100%" stopColor="#C05000" stopOpacity="0"/>
      </radialGradient>
      <radialGradient id="vfg3" cx="50%" cy="60%" r="40%">
        <stop offset="0%"   stopColor="#FFFFFF" stopOpacity="0.85"/>
        <stop offset="60%"  stopColor="#FFE480" stopOpacity="0.5"/>
        <stop offset="100%" stopColor="#F5C842" stopOpacity="0"/>
      </radialGradient>
    </defs>
    {/* Outer flame body */}
    <path
      d="M12 27 C5 27 2 21 3 16 C4 12 6 10 7 7 C8 5 8 2 8 2 C8 2 10 5 10 8 C10 8 11 6 12 3 C13 6 13 8 13 8 C13 5 15 2 16 2 C16 2 17 5 17 9 C18 7 19 5 20 4 C20 4 22 9 21 14 C20 19 19 23 12 27Z"
      fill="url(#vfg1)" opacity="0.95"
    />
    {/* Mid flame */}
    <path
      d="M12 25 C7 25 5 20 6 16 C7 13 8.5 11 9 9 C9.5 8 9.5 6 9.5 6 C9.5 6 11 9 11 11 C11.5 9 12 7 12 5 C12.5 7 13 9 13 11 C13 9 14.5 7 14.5 7 C14.5 7 16 10 15 14 C14 18 17 21 12 25Z"
      fill="url(#vfg2)" opacity="0.9"
    />
    {/* Inner hot core */}
    <path
      d="M12 22 C9 22 8 18 9 15 C9.5 13 10.5 12 11 10 C11.5 12 11.5 14 12 15 C12.5 13 13 11 13.5 10 C14 12 15 14 14 17 C13 20 15 20 12 22Z"
      fill="url(#vfg3)" opacity="0.95"
    />
    {/* White hot tip */}
    <ellipse cx="12" cy="11" rx="1.5" ry="2.5" fill="rgba(255,255,255,0.7)" opacity="0.8"/>
  </svg>
);

export const ParamahamsaVishwanandaDailyCard: React.FC = () => {
  const { t } = useTranslation();
  const { quote, isVisible } = useDailyQuote();

  return (
    <div style={{ position: 'relative' }}>
      {/* Card */}
      <div style={{
        position: 'relative',
        borderRadius: 28,
        padding: '28px 24px',
        background: 'radial-gradient(ellipse at 30% 20%, rgba(60,35,0,0.95) 0%, rgba(18,10,0,0.98) 55%, #050505 100%)',
        border: '1px solid rgba(212,175,55,0.45)',
        overflow: 'hidden',
        boxShadow: '0 0 60px rgba(212,175,55,0.10), 0 0 120px rgba(212,175,55,0.05), inset 0 1px 0 rgba(212,175,55,0.12)',
      }}>

        {/* Animated rim glow overlay */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 28,
          border: '1px solid rgba(212,175,55,0.18)',
          animation: 'vishRimG 4s ease-in-out infinite',
          pointerEvents: 'none',
        }} />

        {/* Sheen sweep */}
        <div style={{
          position: 'absolute', top: 0, left: '-110%',
          width: '60%', height: '100%',
          background: 'linear-gradient(105deg, transparent 40%, rgba(212,175,55,0.04) 50%, transparent 60%)',
          animation: 'vishShimmer 7s 1s ease-in-out infinite',
          pointerEvents: 'none',
        }} />

        {/* Sacred geometry background */}
        <svg
          viewBox="0 0 180 180"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            position: 'absolute', top: -30, right: -30,
            width: 180, height: 180, opacity: 0.18, pointerEvents: 'none',
          }}
        >
          <circle cx="90" cy="90" r="80" fill="none" stroke="rgba(212,175,55,0.9)" strokeWidth="0.6" strokeDasharray="4 12">
            <animateTransform attributeName="transform" type="rotate" values="0 90 90;360 90 90" dur="50s" repeatCount="indefinite"/>
          </circle>
          <polygon points="90,12 160,145 20,145" fill="rgba(212,175,55,0.06)" stroke="rgba(212,175,55,0.7)" strokeWidth="0.8"/>
          <polygon points="90,168 20,35 160,35" fill="rgba(212,175,55,0.04)" stroke="rgba(212,175,55,0.5)" strokeWidth="0.7"/>
          <circle cx="90" cy="90" r="46" fill="none" stroke="rgba(212,175,55,0.4)" strokeWidth="0.5">
            <animateTransform attributeName="transform" type="rotate" values="360 90 90;0 90 90" dur="22s" repeatCount="indefinite"/>
          </circle>
          <circle cx="90" cy="90" r="28" fill="rgba(212,175,55,0.05)" stroke="rgba(212,175,55,0.6)" strokeWidth="0.5"/>
        </svg>

        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, position: 'relative', zIndex: 1 }}>

          {/* Flame ring */}
          <div style={{
            width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
            background: 'radial-gradient(circle, rgba(212,175,55,0.14) 0%, rgba(212,175,55,0.03) 70%)',
            border: '1px solid rgba(212,175,55,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 22px rgba(212,175,55,0.22), inset 0 0 10px rgba(212,175,55,0.07)',
            animation: 'vishPulseRing 3.5s ease-in-out infinite',
            position: 'relative',
          }}>
            {/* Outer orbit ring */}
            <div style={{
              position: 'absolute', inset: -5, borderRadius: '50%',
              border: '1px solid rgba(212,175,55,0.15)',
              animation: 'vishRotate 8s linear infinite',
            }} />
            <FlameSVG />
          </div>

          {/* Titles */}
          <div style={{ flex: 1 }}>
            <span style={{
              display: 'inline-block', fontSize: 6, fontWeight: 800,
              letterSpacing: '0.18em', textTransform: 'uppercase' as const,
              padding: '3px 10px', borderRadius: 20,
              background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.25)',
              color: 'rgba(212,175,55,0.7)', marginBottom: 8,
              fontFamily: "'Montserrat', sans-serif",
            }}>
              ✦ Avataric Blueprint · Bhakti-Algorithm
            </span>
            <div style={{
              fontFamily: "'Cinzel', serif", fontSize: 15, fontWeight: 700,
              letterSpacing: '0.04em', lineHeight: 1.2,
              background: 'linear-gradient(135deg, #D4AF37 0%, #F5E17A 40%, #D4AF37 60%, #A07C10 100%)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
              animation: 'vishHShimmer 5s linear infinite',
            }}>
              Paramahamsa Vishwananda
            </div>
            <div style={{
              fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic',
              fontSize: 11.5, color: 'rgba(212,175,55,0.45)', marginTop: 3, letterSpacing: '0.02em',
            }}>
              {t('explore.vishwanandaDaily', "Today's inspiration & wisdom")}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{
          position: 'relative', zIndex: 1, height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.25) 30%, rgba(212,175,55,0.12) 70%, transparent)',
          margin: '18px 0 16px',
        }} />

        {/* Quote */}
        <div style={{ position: 'relative', zIndex: 1, padding: '0 4px' }}>
          <span style={{
            fontFamily: "'Cinzel', serif", fontSize: 36, lineHeight: 1,
            color: 'rgba(212,175,55,0.18)', marginBottom: -10, display: 'block',
          }}>"</span>
          {quote && (
            <blockquote
              style={{
                fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic',
                fontSize: '0.92rem', lineHeight: 1.7,
                color: 'rgba(212,175,55,0.75)', letterSpacing: '0.01em',
                transition: 'opacity 0.3s',
                opacity: isVisible ? 1 : 0,
              }}
            >
              {quote}
            </blockquote>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginTop: 20, position: 'relative', zIndex: 1,
        }}>
          <span style={{
            fontFamily: "'Montserrat', sans-serif",
            fontSize: 6, fontWeight: 800, letterSpacing: '0.38em',
            textTransform: 'uppercase' as const, color: 'rgba(212,175,55,0.38)',
          }}>
            Today's Inspiration & Wisdom
          </span>
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            {[4, 6, 4].map((size, i) => (
              <span key={i} style={{
                display: 'block', width: size, height: size, borderRadius: '50%',
                background: i === 1 ? 'rgba(212,175,55,0.55)' : 'rgba(212,175,55,0.3)',
                boxShadow: i === 1 ? '0 0 6px rgba(212,175,55,0.4)' : undefined,
              }} />
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes vishHShimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes vishRimG { 0%,100%{box-shadow:0 0 12px rgba(212,175,55,.06)} 50%{box-shadow:0 0 45px rgba(212,175,55,.22)} }
        @keyframes vishShimmer { 0%{left:-110%} 60%,100%{left:110%} }
        @keyframes vishPulseRing {
          0%,100%{box-shadow:0 0 22px rgba(212,175,55,0.2),inset 0 0 10px rgba(212,175,55,0.07)}
          50%{box-shadow:0 0 40px rgba(212,175,55,0.45),inset 0 0 18px rgba(212,175,55,0.14)}
        }
        @keyframes vishRotate { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes vishFlameFlicker {
          0%,100%{transform:scaleY(1) scaleX(1);filter:drop-shadow(0 0 6px rgba(212,175,55,0.8)) drop-shadow(0 0 14px rgba(255,160,20,0.5));}
          25%{transform:scaleY(1.07) scaleX(0.96);filter:drop-shadow(0 0 10px rgba(212,175,55,1)) drop-shadow(0 0 22px rgba(255,140,0,0.7));}
          50%{transform:scaleY(0.96) scaleX(1.04);filter:drop-shadow(0 0 8px rgba(212,175,55,0.9)) drop-shadow(0 0 18px rgba(255,180,40,0.6));}
          75%{transform:scaleY(1.05) scaleX(0.97);filter:drop-shadow(0 0 12px rgba(212,175,55,1)) drop-shadow(0 0 24px rgba(255,120,0,0.5));}
        }
      `}</style>
    </div>
  );
};
