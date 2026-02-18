import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export const QuickActions: React.FC = () => {
  const handleCreativeSoulClick = () => {
    // Navigation target: /healing
    window.location.href = '/healing';
  };

  return (
    <Link
      to="/healing"
      className="flex flex-col items-center gap-2 p-3 rounded-xl bg-muted/30 border border-border/30 hover:bg-muted/50 transition-all duration-300 cursor-pointer"
      onClick={handleCreativeSoulClick}
    >
      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-pink-500/20">
        <Sparkles className="text-purple-500" size={20} />
      </div>
      <span className="text-xs font-medium text-foreground text-center">Creative Soul</span>
    </Link>
  );
};

