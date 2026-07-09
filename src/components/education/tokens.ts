/**
 * Shared design tokens for every education surface (Education Library hub +
 * every academy's Module Reader). This is the single source of truth for
 * colors and typography so no academy page hand-rolls its own values again.
 *
 * Colors match the existing SiddhaPortal.tsx rgba token functions exactly —
 * this file just makes them importable instead of redefined per-page.
 */

export const gold = (a: number) => `rgba(212,175,55,${a})`;
export const white = (a: number) => `rgba(255,255,255,${a})`;
export const cyan = (a: number) => `rgba(34,211,238,${a})`;
export const green = (a: number) => `rgba(74,222,128,${a})`;
export const violet = (a: number) => `rgba(167,139,250,${a})`;
export const amber = (a: number) => `rgba(245,158,11,${a})`;
export const teal = (a: number) => `rgba(52,211,153,${a})`;
export const rose = (a: number) => `rgba(251,113,133,${a})`;

/** Swap the alpha value at the end of any rgba(...) token string. */
export const fade = (color: string, alpha: number) =>
  color.replace(/[\d.]+\)$/, `${alpha})`);

/**
 * The accent color for each academy category — same assignment used on the
 * live /siddha-portal page. Import this instead of re-deciding a color
 * per academy. If a new academy is added, add its category mapping here.
 */
export const CATEGORY_ACCENT: Record<string, string> = {
  'ayurveda-siddha-medicine': teal(0.9),
  'yoga-kriya-breath': gold(0.9),
  'sacred-texts-sages': violet(0.9),
  'body-immortality': teal(0.9),
  'sound-mantra-nada': amber(0.9),
  'consciousness-mystical': violet(0.9),
  'vedic-astrology-nadi': cyan(0.9),
  'wealth-abundance': gold(0.9),
  'sacred-rituals-cosmology': amber(0.9),
  'sqi-technology': cyan(0.9),
};

/**
 * READABLE TYPOGRAPHY — grounded in WCAG 2.2 SC 1.4.12 (1.5 line-height
 * minimum) and the 50-75 characters-per-line research consensus (Bringhurst;
 * Baymard; Nielsen Norman). Cormorant Garamond reads smaller optically than
 * a sans-serif at the same pixel size, so reader body text is set above the
 * bare accessibility minimum, not at it — this is "big enough to read
 * comfortably," matching the ~21px long-form benchmark that Medium measured
 * a 40% reading-time increase from, not just a legibility floor.
 */
export const READER_TYPE = {
  label: {
    fontFamily: "'Plus Jakarta Sans','Montserrat',sans-serif",
    fontSize: 8,
    fontWeight: 800,
    letterSpacing: '0.35em',
    textTransform: 'uppercase' as const,
  },
  title: {
    fontFamily: "'Cormorant Garamond',serif",
    fontWeight: 600,
    fontSize: '1.9rem',
    lineHeight: 1.1,
  },
  thesis: {
    fontFamily: "'Cormorant Garamond',serif",
    fontStyle: 'italic' as const,
    fontSize: '1.05rem',
    lineHeight: 1.7,
  },
  body: {
    fontFamily: "'Cormorant Garamond',serif",
    fontSize: '1.25rem',     // ~20px — above the 16-18px floor, sized for long-form reading
    lineHeight: 1.75,        // above WCAG's 1.5 minimum
    maxWidth: '62ch',        // inside the 50-75 char research range
    color: white(0.85),
  },
  blockLabel: {
    fontFamily: "'Plus Jakarta Sans','Montserrat',sans-serif",
    fontSize: 8,
    fontWeight: 800,
    letterSpacing: '0.35em',
    textTransform: 'uppercase' as const,
  },
} as const;

export type ModuleState = 'done' | 'current' | 'available' | 'locked';

export interface RailModule {
  id: string;
  number: number;
  title: string;
  state: ModuleState;
  href: string;
}

export interface ContentBlock {
  label: string;       // e.g. "TEACHING", "PRACTICE", "REFLECTION"
  title?: string;
  body: string;         // plain text or simple paragraph HTML from module content
}
