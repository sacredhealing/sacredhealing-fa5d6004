import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LotusIcon } from '@/components/icons/LotusIcon';
import { supabase } from '@/integrations/supabase/client';

const Splash: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [fadeOut, setFadeOut] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session check error:', error);
        }

        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setFadeOut(true);
        setAuthChecked(true);
        
        setTimeout(() => {
          if (session?.access_token) {
            navigate('/dashboard', { replace: true });
          } else {
            navigate('/auth', { replace: true });
          }
        }, 500);
      } catch (err) {
        console.error('Auth check failed:', err);
        setFadeOut(true);
        setTimeout(() => navigate('/auth', { replace: true }), 500);
      }
    };

    checkAuthAndRedirect();
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
          {t('splash.title')}
        </h1>
        
        <p className="mt-4 text-lg text-muted-foreground font-light tracking-wide">
          {t('splash.subtitle')}
        </p>

        {/* Loading indicator */}
        <div className="mt-12 flex flex-col items-center gap-3">
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-primary animate-pulse-slow"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
          {authChecked && (
            <p className="text-xs text-muted-foreground animate-fade-in">
              {fadeOut ? t('splash.redirecting') : t('splash.checkingSession')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Splash;