import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LotusIcon } from '@/components/icons/LotusIcon';

const Splash: React.FC = () => {
  const navigate = useNavigate();
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => navigate('/auth'), 500);
    }, 2500);
    
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div 
      className={`min-h-screen flex flex-col items-center justify-center bg-background transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
    >
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/30 rounded-full blur-[100px] animate-pulse-slow" />
        <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-secondary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/3 right-1/3 w-48 h-48 bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center animate-fade-in">
        <div className="animate-float">
          <LotusIcon size={120} className="drop-shadow-[0_0_30px_hsl(var(--primary))]" />
        </div>
        
        <h1 className="mt-8 text-5xl font-heading font-bold text-gradient-spiritual">
          Sacred Healing
        </h1>
        
        <p className="mt-4 text-lg text-muted-foreground font-light tracking-wide">
          Awaken Your Inner Light
        </p>

        {/* Loading dots */}
        <div className="mt-12 flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-primary animate-pulse-slow"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Splash;
