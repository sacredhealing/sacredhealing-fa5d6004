import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LotusIcon } from '@/components/icons/LotusIcon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Lock, User, ArrowRight, Sparkles, Loader2, Gift } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { usePhantomWallet } from '@/hooks/usePhantomWallet';
import { supabase } from '@/integrations/supabase/client';
import { AppDisclaimer } from '@/components/AppDisclaimer';

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get('ref');
  const { signIn, signUp, isAuthenticated, isLoading: authLoading } = useAuth();
  const { connectWallet, isConnecting } = usePhantomWallet();
  const { toast } = useToast();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState(() => {
    // Load saved email from localStorage
    if (typeof window !== 'undefined') {
      return localStorage.getItem('saved_email') || '';
    }
    return '';
  });
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If there's a referral code, default to signup mode
  useEffect(() => {
    if (referralCode) {
      setIsLogin(false);
    }
  }, [referralCode]);

  // Save email to localStorage when it changes
  useEffect(() => {
    if (email && typeof window !== 'undefined') {
      localStorage.setItem('saved_email', email);
    }
  }, [email]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: t('auth.missingFields'),
        description: t('auth.enterEmailPassword'),
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: t('auth.signInFailed'),
            description: error.message,
            variant: "destructive"
          });
        } else {
          // Save email for next time
          if (typeof window !== 'undefined') {
            localStorage.setItem('saved_email', email);
          }
          toast({
            title: t('auth.welcomeBackMessage'),
            description: t('auth.welcomeBackMessage')
          });
          navigate('/dashboard');
        }
      } else {
        if (!name) {
          toast({
            title: t('auth.missingName'),
            description: t('auth.enterName'),
            variant: "destructive"
          });
          setIsSubmitting(false);
          return;
        }
        
        const { data, error } = await signUp(email, password, name);
        if (error) {
          toast({
            title: t('auth.signUpFailed'),
            description: error.message,
            variant: "destructive"
          });
        } else {
          // Process referral if there's a code
          if (referralCode && data.user) {
            try {
              // Find the referrer by code
              const { data: referrerProfile } = await supabase
                .from('profiles')
                .select('user_id')
                .eq('referral_code', referralCode)
                .single();

              if (referrerProfile) {
                // Update the new user's profile with referred_by
                await supabase
                  .from('profiles')
                  .update({ referred_by: referrerProfile.user_id })
                  .eq('user_id', data.user.id);

                // Create referral signup record
                await supabase.from('referral_signups').insert({
                  referrer_user_id: referrerProfile.user_id,
                  referred_user_id: data.user.id,
                  referral_code: referralCode,
                  signup_bonus_shc: 100,
                  referred_bonus_shc: 50,
                });

                // Award bonus to referrer (100 SHC)
                const { data: referrerBalance } = await supabase
                  .from('user_balances')
                  .select('balance, total_earned')
                  .eq('user_id', referrerProfile.user_id)
                  .single();

                if (referrerBalance) {
                  await supabase
                    .from('user_balances')
                    .update({
                      balance: Number(referrerBalance.balance) + 100,
                      total_earned: Number(referrerBalance.total_earned) + 100
                    })
                    .eq('user_id', referrerProfile.user_id);

                  await supabase.from('shc_transactions').insert({
                    user_id: referrerProfile.user_id,
                    type: 'earned',
                    amount: 100,
                    description: 'Referral bonus - new user signup',
                    status: 'completed'
                  });
                }

                // Update referrer's total_referrals
                await supabase
                  .from('profiles')
                  .update({ total_referrals: (referrerProfile as any).total_referrals ? (referrerProfile as any).total_referrals + 1 : 1 })
                  .eq('user_id', referrerProfile.user_id);

                toast({
                  title: t('auth.welcomeBonus'),
                  description: t('auth.welcomeReferral')
                });
              } else {
                toast({
                  title: t('auth.welcomeBonus'),
                  description: t('auth.welcomeBonus')
                });
              }
            } catch (refError) {
              console.error('Referral processing error:', refError);
              toast({
                title: t('auth.welcomeBonus'),
                description: t('auth.welcomeBonus')
              });
            }
          } else {
            toast({
              title: t('auth.welcomeBonus'),
              description: t('auth.welcomeBonus')
            });
          }

          // Send welcome email (language chosen by edge function from IP geolocation; client language used as fallback)
          try {
            const { data: welcomeData, error: welcomeErr } = await supabase.functions.invoke('send-welcome-email', {
              body: { email, name, language: i18n.language },
            });
            if (welcomeErr) {
              console.error('[Auth] Welcome email invoke error:', welcomeErr);
            }
            if (welcomeData?.error) {
              console.error('[Auth] Welcome email returned error:', welcomeData.error);
            }
          } catch (welcomeErr) {
            console.error('[Auth] Welcome email exception:', welcomeErr);
          }

          navigate('/dashboard');
        }
      }
    } catch (err) {
      toast({
        title: t('auth.error'),
        description: t('auth.somethingWrong'),
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhantomConnect = async () => {
    const address = await connectWallet();
    if (address) {
      toast({
        title: t('auth.walletConnected'),
        description: t('auth.createAccountFirst')
      });
    }
  };

  if (authLoading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-[#050505] overflow-hidden">
        <div className="absolute inset-0 opacity-40 pointer-events-none">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] animate-[stardustMove_150s_linear_infinite]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_#D4AF3715_0%,_transparent_70%)]" />
        </div>
        <Loader2 className="relative z-10 w-8 h-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#050505] overflow-hidden">
      {/* Global Akasha Background */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] animate-[stardustMove_150s_linear_infinite]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_#D4AF3715_0%,_transparent_70%)]" />
      </div>

      <div className="relative z-10 w-full max-w-md px-8 py-12">
        {/* SQI 2050: Absolute Sovereign Logo (Auth) */}
        <div className="relative flex flex-col items-center justify-center pt-4">
          {/* The Portal Container - Forces a circle, no square boundaries */}
          <div className="relative w-72 h-72 rounded-full overflow-hidden border border-[#D4AF37]/10 bg-[radial-gradient(circle,_rgba(212,175,55,0.08)_0%,_transparent_70%)]">
            <img
              src="/Gemini_Generated_Image_v8j3v8j3v8j3v8j3.png"
              onError={(e) => { (e.target as HTMLImageElement).src = '/Gemini_Generated_Image_57v0zm57v0zm57v0.jpg'; }}
              alt="Siddha Sri Yantra"
              className="w-full h-full object-contain mix-blend-screen opacity-90 animate-[siddhiSpin_150s_linear_infinite]"
            />
            <div className="absolute inset-0 shadow-[inset_0_0_60px_rgba(0,0,0,0.9)] rounded-full pointer-events-none" />
          </div>

          {/* Auth Branding (Matching Profile Typography) */}
          <div className="text-center -mt-8 z-10 mb-4">
            <h1 className="text-white text-4xl font-black tracking-tighter">Sacred Healing</h1>
            <p className="text-[#D4AF37] text-[10px] font-black tracking-[0.4em] uppercase mt-2 opacity-80">
              {isLogin ? t('auth.welcomeBackBeautifulSoul', 'Welcome Back, Beautiful Soul') : t('auth.beginJourney', 'Initiate Transmission')}
            </p>
          </div>
        </div>

        {/* Referral Banner */}
        {referralCode && !isLogin && (
          <div className="mt-4 mb-6 p-4 rounded-2xl bg-white/[0.04] border border-[#D4AF37]/30 flex items-center gap-3">
            <Gift className="w-6 h-6 text-[#D4AF37] flex-shrink-0" />
            <div>
              <p className="font-medium text-white">{t('auth.youveBeenInvited')}</p>
              <p className="text-xs text-white/60">{t('auth.signUpBonus')}</p>
            </div>
          </div>
        )}

        {/* The Glass Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {!isLogin && (
            <div className="space-y-2">
              <label className="text-white/40 text-[9px] font-black tracking-widest uppercase ml-4">
                {t('auth.yourName')}
              </label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/10 rounded-full px-6 py-4 h-auto text-white text-sm focus:outline-none focus:border-[#D4AF37]/50 transition-all backdrop-blur-xl placeholder:text-white/30"
                placeholder={t('auth.yourName') || 'Your Name'}
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-white/40 text-[9px] font-black tracking-widest uppercase ml-4">
              {t('auth.emailAddress', 'Soul Email')}
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-full px-6 py-4 h-auto text-white text-sm focus:outline-none focus:border-[#D4AF37]/50 transition-all backdrop-blur-xl placeholder:text-white/30"
              placeholder={t('auth.emailPlaceholder', 'Enter your email...')}
            />
          </div>

          <div className="space-y-2">
            <label className="text-white/40 text-[9px] font-black tracking-widest uppercase ml-4">
              {t('auth.password', 'Password')}
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-full px-6 py-4 h-auto text-white text-sm focus:outline-none focus:border-[#D4AF37]/50 transition-all backdrop-blur-xl placeholder:text-white/30"
              placeholder={t('auth.passwordPlaceholder', 'Enter your password...')}
            />
          </div>

          {isLogin && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={async () => {
                  if (!email) {
                    toast({
                      title: t('auth.missingFields'),
                      description: 'Please enter your email address first.',
                      variant: 'destructive',
                    });
                    return;
                  }
                  try {
                    const { error } = await supabase.auth.resetPasswordForEmail(email, {
                      redirectTo: `${window.location.origin}/reset-password`,
                    });
                    if (error) throw error;
                    toast({
                      title: 'Check your email',
                      description: 'A password reset link has been sent to your email.',
                    });
                  } catch (err: any) {
                    toast({
                      title: 'Error',
                      description: err?.message || 'Could not send reset email.',
                      variant: 'destructive',
                    });
                  }
                }}
                className="text-xs text-white/60 hover:text-[#D4AF37] transition-colors"
              >
                Forgot password?
              </button>
            </div>
          )}

          <Button
            type="submit"
            size="xl"
            className="w-full mt-2 py-5 rounded-full bg-[#D4AF37] text-black font-black text-xs tracking-[0.3em] uppercase shadow-[0_10px_30px_rgba(212,175,55,0.3)] hover:scale-[1.02] transition-transform"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {isLogin ? t('auth.signIn') : t('auth.createAccount')}
                <ArrowRight size={20} className="ml-2" />
              </>
            )}
          </Button>

          {/* Social buttons */}
          <div className="mt-8 space-y-3">
            <Button
              variant="glass"
              size="lg"
              className="w-full bg-white/[0.04] border border-white/10 hover:border-[#D4AF37]/40"
              onClick={handlePhantomConnect}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <Sparkles className="w-5 h-5 mr-2 text-[#D4AF37]" />
              )}
              {t('auth.connectPhantomWallet')}
            </Button>
          </div>

          {/* Toggle */}
          <p className="mt-8 text-center text-white/40 text-[9px] tracking-widest uppercase">
            {isLogin ? t('auth.noAccount') : t('auth.haveAccount')}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="ml-2 text-[#D4AF37] hover:underline"
            >
              {isLogin ? t('auth.signUp') : t('auth.signIn')}
            </button>
          </p>

          <div className="mt-6 text-center">
            <p className="text-white/30 text-[9px] tracking-widest uppercase">
              {isLogin ? t('auth.newSeeker', 'New Seeker?') : t('auth.returningSeeker', 'Returning Seeker?')}{' '}
              <span className="text-[#D4AF37] cursor-pointer" onClick={() => setIsLogin(!isLogin)}>
                {isLogin ? t('auth.signUp', 'Register Here') : t('auth.signIn', 'Sign In')}
              </span>
            </p>
          </div>

          <AppDisclaimer className="mt-10" />
        </form>
      </div>

      <style>{`
        @keyframes stardustMove { 
          from { background-position: 0 0; } 
          to { background-position: 1000px 1000px; } 
        }
        @keyframes siddhiSpin { 
          from { transform: rotate(0deg); } 
          to { transform: rotate(360deg); } 
        }
      `}</style>
    </div>
  );
};

export default Auth;
