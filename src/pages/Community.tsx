import React from 'react';
import { Users, MessageCircle, Heart, ChevronRight } from 'lucide-react';

const Community = () => {
  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="flex flex-col gap-8 p-6 max-w-2xl mx-auto">
        
        {/* Simple, Human Header */}
        <header className="space-y-1 mt-4">
          <h1 className="text-3xl font-light tracking-wide">Community</h1>
          <p className="text-purple-200/50 font-light text-sm italic">"A quiet space to share and heal together..."</p>
        </header>

        {/* Community Spaces */}
        <section className="space-y-4">
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-3xl overflow-hidden">
            {[
              { label: "Healing Circle", sub: "General sharing & support", icon: <Heart size={18}/> },
              { label: "Daily Reflections", sub: "Share your daily intentions", icon: <MessageCircle size={18}/> },
              { label: "Global Members", sub: "Connect with others on the path", icon: <Users size={18}/> }
            ].map((item, index, arr) => (
              <button 
                key={item.label} 
                className={`flex w-full items-center justify-between p-6 hover:bg-white/[0.05] transition-colors ${index !== arr.length - 1 ? 'border-b border-white/[0.05]' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className="text-purple-400/70">{item.icon}</div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-white/90">{item.label}</p>
                    <p className="text-xs text-white/40">{item.sub}</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-white/20"/>
              </button>
            ))}
          </div>
        </section>

        {/* Gentle Call to Action */}
        <div className="mt-8 p-8 border-2 border-dashed border-white/5 rounded-3xl text-center">
          <p className="text-sm text-white/30 italic">"The community is a mirror of your own healing. Enter with love."</p>
        </div>
      </div>
    </div>
  );
};

export default Community;

// FINISHED: PUSH TO GIT
// git add . && git commit -m "UX: Cleaned Community page, removed redundant Guide and tools" && git push
