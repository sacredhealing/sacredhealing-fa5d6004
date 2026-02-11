import React from "react";
import {
  ChevronRight,
  Wind,
  Heart,
  Zap,
  Moon,
  Sparkles,
} from "lucide-react";

const Explore = () => {
  const intentions = [
    {
      label: "Calm my mind",
      sub: "A short reset for busy thoughts",
      icon: <Wind size={20} />,
    },
    {
      label: "Soften the heart",
      sub: "Gentle support for heavy days",
      icon: <Heart size={20} />,
    },
    {
      label: "Take a small pause",
      sub: "One-minute breath reset",
      icon: <Zap size={20} />,
    },
    {
      label: "Sleep deeply",
      sub: "Unwind into restful peace",
      icon: <Moon size={20} />,
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="flex flex-col gap-8 p-6 max-w-2xl mx-auto">
        {/* Simple Header */}
        <header className="space-y-1 mt-4">
          <h1 className="text-3xl font-light tracking-wide">Library</h1>
          <p className="text-purple-200/50 font-light text-sm italic">
            "Begin gently today..."
          </p>
        </header>

        {/* Section 1: Intentions (The "Feelings" Row) */}
        <section className="space-y-4">
          <h2 className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-semibold ml-1">
            How do you feel?
          </h2>
          <div className="grid grid-cols-1 gap-3">
            {intentions.map((item) => (
              <button
                key={item.label}
                className="flex items-center justify-between p-5 bg-white/[0.03] border border-white/[0.08] rounded-2xl hover:bg-white/[0.06] transition-all group active:scale-[0.98]"
              >
                <div className="flex items-center gap-4">
                  <div className="text-purple-400/80 group-hover:text-purple-300 transition-colors">
                    {item.icon}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-white/90 tracking-wide">
                      {item.label}
                    </p>
                    <p className="text-xs text-white/40 font-light">
                      {item.sub}
                    </p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-white/20" />
              </button>
            ))}
          </div>
        </section>

        {/* Section 2: Sanctuary Guide (Onboarding) */}
        <section className="mt-4 p-5 rounded-2xl bg-gradient-to-br from-purple-900/20 to-transparent border border-purple-500/20">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-white/90">
                Your Sanctuary Guide
              </h3>
              <p className="text-xs text-white/50 mt-1 leading-relaxed">
                Everything included in your membership: bonuses, courses, and
                healing coins.
              </p>
              <button className="mt-3 text-xs font-semibold text-purple-300 hover:text-purple-200 flex items-center gap-1">
                Learn how it works <ChevronRight size={12} />
              </button>
            </div>
          </div>
        </section>

        {/* Footer Note */}
        <footer className="mt-8 text-center">
          <p className="text-[10px] text-white/20 font-light italic">
            "You are exactly where you need to be."
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Explore;
