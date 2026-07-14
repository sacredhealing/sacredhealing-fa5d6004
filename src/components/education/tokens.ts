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
    fontWeight: 700,
    fontSize: '2rem',
    lineHeight: 1.15,
  },
  thesis: {
    // No italic: italic serif is measurably harder to read, especially for
    // older or low-vision readers. Plain weight, high contrast instead.
    fontFamily: "'Cormorant Garamond',serif",
    fontWeight: 600,
    fontSize: '1.3rem',
    lineHeight: 1.75,
    color: white(0.82),
  },
  body: {
    fontFamily: "'Cormorant Garamond',serif",
    fontSize: '1.4rem',      // ~22px -- sized for someone reading at arm's length, not a design sample
    fontWeight: 500,
    lineHeight: 1.75,        // above WCAG's 1.5 minimum
    maxWidth: '58ch',        // slightly tighter measure at this larger size
    color: white(0.92),      // high contrast, not a "quiet" gray
  },
  blockLabel: {
    fontFamily: "'Plus Jakarta Sans','Montserrat',sans-serif",
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: '0.3em',
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

/**
 * A "Module" in the Kajabi/Thinkific sense — a named group (e.g. an
 * academy phase) containing individual lessons. When an academy's content
 * has a real grouping field (like Agastyar's `phase`), pass railGroups to
 * ModuleReaderShell instead of a flat railItems list, and the sidebar
 * renders as a proper collapsible Module → Lesson accordion.
 */
export interface RailGroup {
  id: string;
  title: string;
  /** e.g. "4 / 21 lessons complete" */
  meta: string;
  /** true = every lesson in this group is done */
  done: boolean;
  /** true = the active lesson is inside this group (keeps it expanded, highlights the ring) */
  current: boolean;
  items: RailModule[];
}

export interface ContentBlock {
  label: string;       // e.g. "TEACHING", "PRACTICE", "REFLECTION"
  title?: string;
  body: string;         // plain text or simple paragraph HTML from module content
}
