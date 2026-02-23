import React, { useState } from 'react';

interface TempleSectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

/**
 * Collapsible "temple door" section — collapsed by default, click header to expand.
 */
export const TempleSection: React.FC<TempleSectionProps> = ({
  title,
  icon,
  children,
  defaultOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-amber-900/20">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-5 px-4 text-left hover:bg-amber-900/5 transition-colors duration-300"
      >
        <div className="flex items-center gap-3">
          {icon != null && (
            <span className="text-amber-400/60 text-lg" aria-hidden>
              {icon}
            </span>
          )}
          <h3 className="text-lg font-serif tracking-widest text-amber-200/80 uppercase">
            {title}
          </h3>
        </div>
        <span
          className={`text-amber-400/40 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden
        >
          ▾
        </span>
      </button>
      <div
        className={`overflow-hidden transition-all duration-500 ease-in-out ${
          isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 pb-6">{children}</div>
      </div>
    </div>
  );
};
