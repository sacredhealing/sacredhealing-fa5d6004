import React from 'react';
import type { ModuleContent, Language } from '@/types/academy';

interface ContentSectionProps {
  content: ModuleContent;
  language: Language;
}

export const ContentSection: React.FC<ContentSectionProps> = ({ content, language }) => {
  if (!content) return null;

  return (
    <div
      className="animate-in fade-in slide-in-from-bottom-12 duration-1000 ease-out"
      style={{ paddingBottom: 80 }}
    >

      {/* ── TITLE & FREQUENCY OVERVIEW ── */}
      <section style={{ position: 'relative', marginBottom: 48 }}>
        {/* Ambient glow blob */}
        <div
          style={{
            position: 'absolute',
            top: -40,
            left: -40,
            width: 240,
            height: 240,
            background: 'radial-gradient(circle, rgba(212,175,55,0.07) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Frequency label */}
        <p
          style={{
            fontSize: 8,
            fontWeight: 800,
            letterSpacing: '0.5em',
            textTransform: 'uppercase',
            color: '#D4AF37',
            marginBottom: 12,
            opacity: 0.9,
          }}
        >
          The Frequency Objective
        </p>

        {/* Main Title */}
        <h2
          style={{
            fontSize: 'clamp(28px, 4vw, 48px)',
            fontWeight: 900,
            letterSpacing: '-0.05em',
            color: '#FFFFFF',
            lineHeight: 1.05,
            marginBottom: 16,
            textShadow: '0 0 60px rgba(212,175,55,0.1)',
          }}
        >
          {content.title?.[language] || 'Loading...'}
        </h2>

        {/* Glass divider card with objective */}
        <div
          style={{
            background: 'rgba(212,175,55,0.04)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            border: '1px solid rgba(212,175,55,0.12)',
            borderRadius: 20,
            padding: '20px 24px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Inner left gold stripe */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 3,
              height: '100%',
              background: 'linear-gradient(180deg, #F5D06A, #D4AF37)',
              borderRadius: '999px 0 0 999px',
            }}
          />
          <p
            style={{
              fontSize: 16,
              fontWeight: 300,
              lineHeight: 1.7,
              color: 'rgba(255,255,255,0.7)',
              fontStyle: 'italic',
              paddingLeft: 8,
            }}
          >
            {content.objective?.[language] || 'No objective provided.'}
          </p>
        </div>
      </section>

      {/* ── VIDEO MASTER SCRIPT ── */}
      <section style={{ marginBottom: 48 }}>
        {/* Section header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              background: 'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.05))',
              border: '1px solid rgba(212,175,55,0.2)',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(212,175,55,0.1)',
            }}
          >
            <svg width={18} height={18} fill="none" stroke="#D4AF37" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <p
              style={{
                fontSize: 8,
                fontWeight: 800,
                letterSpacing: '0.5em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.3)',
                marginBottom: 2,
              }}
            >
              Sacred Transmission
            </p>
            <h3
              style={{
                fontSize: 18,
                fontWeight: 900,
                letterSpacing: '-0.03em',
                color: '#FFFFFF',
              }}
            >
              Video Master Script
            </h3>
          </div>
        </div>

        {/* Script sections grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
          {content.videoScript?.sections?.map((section, idx) => (
            <div
              key={idx}
              style={{
                background: 'rgba(255,255,255,0.02)',
                backdropFilter: 'blur(40px)',
                WebkitBackdropFilter: 'blur(40px)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: 16,
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                transition: 'all 0.5s ease',
                cursor: 'default',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.border = '1px solid rgba(212,175,55,0.2)';
                (e.currentTarget as HTMLDivElement).style.background = 'rgba(212,175,55,0.03)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.border = '1px solid rgba(255,255,255,0.05)';
                (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.02)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                {/* Verse number */}
                <div style={{ flexShrink: 0, minWidth: 80 }}>
                  <span
                    style={{
                      fontSize: 8,
                      fontWeight: 800,
                      letterSpacing: '0.4em',
                      textTransform: 'uppercase',
                      color: '#D4AF37',
                      opacity: 0.8,
                    }}
                  >
                    Verse {idx + 1}
                  </span>
                  <h4
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#FFFFFF',
                      marginTop: 4,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {section.label?.[language] || 'Segment'}
                  </h4>
                </div>

                {/* Content with gold left border */}
                <div
                  style={{
                    flex: 1,
                    borderLeft: '1px solid rgba(212,175,55,0.15)',
                    paddingLeft: 16,
                    fontSize: 14,
                    lineHeight: 1.65,
                    color: 'rgba(255,255,255,0.55)',
                    fontWeight: 300,
                    fontStyle: 'italic',
                  }}
                >
                  "{section.content?.[language] || '...'}"
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Additional content sections can be added here following same pattern ── */}

    </div>
  );
};
