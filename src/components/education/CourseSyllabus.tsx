import React, { useState } from 'react';
import { Check, Lock, ChevronDown } from 'lucide-react';
import { fade, white, teal } from './tokens';

export interface SyllabusLesson {
  id: string;
  number: number;
  title: string;
  state: 'done' | 'current' | 'available' | 'locked';
}

export interface SyllabusGroup {
  id: string;
  title: string;      // "1. Adhi Vidya"
  meta: string;        // "0 / 12 lessons"
  done: boolean;
  current: boolean;
  lessons: SyllabusLesson[];
}

export interface CourseSyllabusProps {
  /** rgba token for this academy, e.g. teal(0.9), amber(0.9) — the ONLY thing that changes per academy */
  accent: string;
  courseIcon: string;   // emoji
  courseTitle: string;
  academyName: string;
  progressLabel: string;   // "0 / 108 · 0%"
  progressPercent: number;
  groups: SyllabusGroup[];
  onLessonClick: (lessonId: string, locked: boolean) => void;
  /** default-open group id */
  defaultOpenId?: string;
}

/**
 * CourseSyllabus — the single reusable "browse this academy's curriculum"
 * component. Every academy renders through this. Only `accent`, icon,
 * title, and data change; the structure is identical everywhere by
 * construction, not by convention.
 *
 * Rows are single-line (title only, no description, no duration/video
 * meta — this is a text-only platform). This is the Kajabi/Thinkific
 * pattern: compact list, click a lesson, it either opens or sends you to
 * the upgrade page. Nothing else on the row.
 */
export default function CourseSyllabus({
  accent,
  courseIcon,
  courseTitle,
  academyName,
  progressLabel,
  progressPercent,
  groups,
  onLessonClick,
  defaultOpenId,
}: CourseSyllabusProps) {
  const [openId, setOpenId] = useState<string | undefined>(
    defaultOpenId ?? groups.find((g) => g.current)?.id ?? groups[0]?.id
  );

  const acBorder = fade(accent, 0.35);
  const acFaint = fade(accent, 0.1);

  return (
    <div>
      {/* Course header — identical anatomy every time, only accent/icon/title change */}
      <div className="flex items-center gap-4 mb-2">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl"
          style={{ background: `radial-gradient(120% 120% at 20% 20%, ${fade(accent, 0.3)}, rgba(5,5,5,0.9))`, border: `1px solid ${acBorder}` }}
        >
          {courseIcon}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[26px] font-semibold leading-tight" style={{ fontFamily: "'Cormorant Garamond',serif" }}>
            {courseTitle}
          </p>
          <p className="mt-1 text-[11px] font-extrabold" style={{ color: accent }}>{progressLabel}</p>
        </div>
      </div>
      <div className="h-[3px] overflow-hidden rounded-full bg-white/[0.07] mb-8">
        <div
          className="h-full rounded-full transition-[width] duration-700"
          style={{ width: `${progressPercent}%`, background: `linear-gradient(90deg,${accent},${fade(accent, 0.55)})` }}
        />
      </div>

      {/* Accordion — one row per lesson, nothing else */}
      <div className="rounded-[20px] border border-white/[0.07] bg-white/[0.012] overflow-hidden">
        {groups.map((g, idx) => {
          const isOpen = openId === g.id;
          const ringBg = g.done ? teal(0.16) : isOpen ? fade(accent, 0.14) : 'rgba(255,255,255,0.04)';
          const ringBorder = g.done ? teal(0.5) : isOpen ? accent : 'rgba(255,255,255,0.12)';
          const ringColor = g.done ? teal(0.95) : isOpen ? accent : white(0.4);
          return (
            <div key={g.id} className={idx > 0 ? 'border-t border-white/[0.05]' : ''}>
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? undefined : g.id)}
                className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-white/[0.02]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black"
                    style={{ background: ringBg, border: `1.5px solid ${ringBorder}`, color: ringColor }}
                  >
                    {g.done ? <Check size={14} /> : idx + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold" style={{ fontFamily: "'Cormorant Garamond',serif", color: white(0.92) }}>
                      {g.title}
                    </p>
                    <p className="text-[10px]" style={{ color: white(0.35) }}>{g.meta}</p>
                  </div>
                </div>
                <ChevronDown
                  size={15}
                  className="shrink-0 transition-transform duration-200"
                  style={{ color: white(0.3), transform: isOpen ? 'rotate(180deg)' : 'none' }}
                />
              </button>

              {isOpen && (
                <div className="pb-2">
                  {g.lessons.map((l) => {
                    const isDone = l.state === 'done';
                    const isCurrent = l.state === 'current';
                    const isLocked = l.state === 'locked';
                    const dotBorder = isDone ? teal(0.5) : isCurrent ? accent : 'rgba(255,255,255,0.15)';
                    const dotBg = isDone ? teal(0.16) : isCurrent ? fade(accent, 0.14) : 'transparent';
                    const dotColor = isDone ? teal(0.95) : isCurrent ? accent : white(0.3);
                    return (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => onLessonClick(l.id, isLocked)}
                        className="flex w-full items-center gap-3 py-2.5 pl-[52px] pr-5 text-left transition hover:bg-white/[0.02]"
                      >
                        <div
                          className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full"
                          style={{ border: `1.5px solid ${dotBorder}`, background: dotBg, color: dotColor }}
                        >
                          {isDone ? <Check size={10} /> : isLocked ? <Lock size={9} /> : null}
                        </div>
                        <span
                          className="text-[15px] leading-snug"
                          style={{
                            fontFamily: "'Cormorant Garamond',serif",
                            color: isCurrent ? white(0.95) : isLocked ? white(0.32) : white(0.68),
                            fontWeight: isCurrent ? 700 : 500,
                          }}
                        >
                          {l.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
