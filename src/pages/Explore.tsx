import React from 'react';
import { ChevronRight, Wind, Heart, Zap, Moon, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Explore = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Keeping your exact original container padding and width */}
      <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto">
        
        <header className="mb-2">
          <h1 className="text-2xl font-semibold text-white">Library</h1>
          <p className="text-sm text-gray-400">Begin gently today.</p>
        </header>

        {/* SECTION: Daily Essentials (Keep original styles and functional links) */}
        <section>
          <h2 className="text-sm font-medium text-gray-400 mb-4 tracking-wide uppercase">Daily essentials</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: "Calm my mind", sub: "A short reset (2-3 min)", icon: <Wind size={20} className="text-cyan-400" />, path: "/meditate" },
              { label: "Soften the heart", sub: "Gentle support when it feels heavy", icon: <Heart size={20} className="text-rose-400" />, path: "/soul" },
              { label: "Take a small pause", sub: "One-minute breath reset", icon: <Zap size={20} className="text-amber-400" />, path: "/breathing" },
              { label: "Sleep deeply", sub: "Unwind into rest", icon: <Moon size={20} className="text-indigo-400" />, path: "/music" }
            ].map((item) => (
              <button 
                key={item.label}
                onClick={() => navigate(item.path)}
                className="flex items-center justify-between p-5 bg-[#1A1A1A]/50 border border-white/5 rounded-2xl hover:bg-white/5 transition-all text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-white/5 rounded-xl">{item.icon}</div>
                  <div>
                    <p className="text-sm font-medium text-white">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.sub}</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-600" />
              </button>
            ))}
          </div>
        </section>

        {/* SECTION: Your Space (Restored original style) */}
        <section className="mt-4">
          <h2 className="text-sm font-medium text-gray-400 mb-4 tracking-wide uppercase">Your Space</h2>
          <button 
            onClick={() => navigate('/membership')}
            className="w-full p-6 bg-gradient-to-r from-[#1A1A1A] to-[#2A1A3A] border border-purple-500/20 rounded-2xl text-left flex items-center justify-between group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-400">
                <Sparkles size={24} />
              </div>
              <div>
                <p className="text-lg font-medium text-white">Membership <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded-full ml-2">Premium</span></p>
                <p className="text-sm text-gray-400">Everything in one place. Yours to return to.</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-600 group-hover:text-white transition-colors" />
          </button>
        </section>

        {/* Invite Friends & Quote footer restored to your original look */}
        <div className="mt-8 pt-8 border-t border-white/5 text-center">
            <p className="text-xs italic text-gray-600">"Your life becomes meaningful when you live for others."</p>
        </div>
      </div>
    </div>
  );
};

export default Explore;
