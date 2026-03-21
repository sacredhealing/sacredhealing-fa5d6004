import React from 'react';
import type { CourseModule, Language } from '@/types/academy';

interface ModuleCardProps {
  module: CourseModule;
  language: Language;
  onClick: () => void;
  isActive: boolean;
}

export const ModuleCard: React.FC<ModuleCardProps> = ({ module, language, onClick, isActive }) => {
  const displayTitle = module.content?.title?.[language] || module.topic.split(':')[0];
  const isGenerated = !!module.content;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full text-left outline-none"
      style={{
        position: 'relative',
        padding: '14px 16px',
        borderRadius: 16,
        border: isActive
          ? '1px solid rgba(212,175,55,0.35)'
          : '1px solid rgba(255,255,255,0.04)',
        background: isActive
          ? 'rgba(212,175,55,0.06)'
          : 'rgba(255,255,255,0.015)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: isActive
          ? '0 0 20px rgba(212,175,55,0.12), inset 0 0 20px rgba(212,175,55,0.04)'
          : 'none',
        cursor: 'pointer',
        transition: 'all 0.4s ease',
        overflow: 'hidden',
      }}
      onMouseEnter={e => {
        if (!isActive) {
          (e.currentTarget as HTMLButtonElement).style.border = '1px solid rgba(212,175,55,0.15)';
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(212,175,55,0.03)';
        }
      }}
      onMouseLeave={e => {
        if (!isActive) {
          (e.currentTarget as HTMLButtonElement).style.border = '1px solid rgba(255,255,255,0.04)';
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.015)';
        }
      }}
    >
      {/* Active left-edge gold bar */}
      {isActive && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 3,
            height: '100%',
            background: 'linear-gradient(180deg, #F5D06A, #D4AF37, #B8960C)',
            boxShadow: '0 0 12px rgba(212,175,55,0.8)',
            borderRadius: '999px 0 0 999px',
          }}
        />
      )}

      {/* Row 1: Month label + Status dot */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span
          style={{
            fontSize: 8,
            fontWeight: 800,
            letterSpacing: '0.5em',
            textTransform: 'uppercase',
            color: isActive ? '#D4AF37' : 'rgba(255,255,255,0.3)',
            transition: 'color 0.3s ease',
          }}
        >
          Month {module.month}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {!isGenerated && (
            <span
              style={{
                fontSize: 7,
                fontWeight: 800,
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                color: 'rgba(139,92,246,0.8)',
                background: 'rgba(139,92,246,0.08)',
                border: '1px solid rgba(139,92,246,0.15)',
                padding: '2px 6px',
                borderRadius: 999,
              }}
            >
              Planned
            </span>
          )}
          {/* Status indicator dot */}
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: isActive
                ? '#D4AF37'
                : isGenerated
                  ? 'rgba(212,175,55,0.4)'
                  : 'rgba(255,255,255,0.12)',
              boxShadow: isActive ? '0 0 8px rgba(212,175,55,0.8)' : 'none',
              transition: 'all 0.4s ease',
            }}
          />
        </div>
      </div>

      {/* Row 2: Module Title */}
      <h3
        style={{
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.55)',
          marginBottom: 6,
          lineHeight: 1.3,
          transition: 'color 0.3s ease',
        }}
      >
        {displayTitle}
      </h3>

      {/* Row 3: Objective preview */}
      <p
        style={{
          fontSize: 11,
          lineHeight: 1.5,
          color: isActive ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.25)',
          fontStyle: 'italic',
          fontWeight: 400,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          transition: 'color 0.3s ease',
        }}
      >
        {module.content?.objective?.[language] || 'Wisdom transmission awaiting generation...'}
      </p>

      {/* Hover: SELECT PATH arrow — only for generated non-active */}
      {isGenerated && !isActive && (
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            right: 14,
            fontSize: 8,
            fontWeight: 800,
            letterSpacing: '0.2em',
            color: '#D4AF37',
            opacity: 0,
            transform: 'translateX(-4px)',
            transition: 'all 0.3s ease',
          }}
          className="group-hover:opacity-100 group-hover:translate-x-0"
        >
          SELECT PATH →
        </div>
      )}
    </button>
  );
};
