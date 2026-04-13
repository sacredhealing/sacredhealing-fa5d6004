import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LotusIcon } from '@/components/icons/LotusIcon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Lock, User, ArrowRight, Sparkles, Loader2, Gift, Eye, EyeOff } from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  // Particle canvas (visual only)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let animId: number;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    class Particle {
      x = 0; y = 0; size = 0; speedX = 0; speedY = 0; life = 0; maxLife = 0; growing = true; color = '212,175,55';
      constructor() { this.reset(); }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 1.5 + 0.3;
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.speedY = (Math.random() - 0.5) * 0.3;
        this.life = Math.random();
        this.maxLife = Math.random() * 0.005 + 0.001;
        this.growing = true;
        const c = ['212,175,55', '255,255,255', '34,211,238'];
        this.color = c[Math.floor(Math.random() * 3)];
      }
      update() {
        this.x += this.speedX; this.y += this.speedY;
        if (this.growing) { this.life += this.maxLife; if (this.life >= 1) this.growing = false; }
        else { this.life -= this.maxLife; if (this.life <= 0) this.reset(); }
        if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) this.reset();
      }
      draw() {
        ctx.save(); ctx.globalAlpha = this.life * 0.6;
        ctx.fillStyle = `rgba(${this.color},1)`;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
    }
    const particles = Array.from({ length: 200 }, () => new Particle());
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => { p.update(); p.draw(); });
      animId = requestAnimationFrame(animate);
    };
    animate();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

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
    <div className="relative min-h-screen flex flex-col md:flex-row bg-[#050505] overflow-hidden">
      {/* Global background + particles */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] animate-[stardustMove_150s_linear_infinite]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_#D4AF3715_0%,_transparent_70%)]" />
      </div>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-[1] opacity-50" />

      {/* LEFT PANEL — desktop: 50%; mobile: image + title only */}
      <div
        className="relative z-10 flex flex-col items-center justify-center flex-1 min-h-[280px] md:min-h-screen py-8 md:py-12 px-6"
        style={{
          background: '#050505',
          backgroundImage: 'radial-gradient(ellipse at center, rgba(212,175,55,0.12) 0%, transparent 60%)',
        }}
      >
        <div className="auth-left-content flex flex-col items-center text-center">
          {/* Sacred geometry SVG bg */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.06]" aria-hidden>
            <svg className="w-[min(400px,80vw)] h-[min(400px,80vw)] animate-[siddhiSpin_150s_linear_infinite]" viewBox="0 0 500 500" fill="none">
              <circle cx="250" cy="250" r="220" stroke="#D4AF37" strokeWidth="0.5" opacity="0.5" />
              <polygon points="250,30 470,420 30,420" stroke="#D4AF37" strokeWidth="0.6" fill="none" opacity="0.7" />
              <polygon points="250,470 30,80 470,80" stroke="#D4AF37" strokeWidth="0.6" fill="none" opacity="0.7" />
              <circle cx="250" cy="250" r="5" fill="#D4AF37" opacity="0.8" />
            </svg>
          </div>
          <div className="relative flex items-center justify-center w-[280px] h-[280px] md:w-[280px] md:h-[280px]">
            {/* Outer glow rings */}
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,175,55,0.12) 0%, transparent 70%)', animation: 'siddhiSpin 20s ease-in-out infinite' }} />
            <svg className="w-full h-full" width="280" height="280" viewBox="0 0 280 280" fill="none" style={{ animation: 'siddhiSpin 150s linear infinite' }}>
              {/* Outer circles */}
              <circle cx="140" cy="140" r="135" stroke="#D4AF37" strokeWidth="0.8" opacity="0.6" />
              <circle cx="140" cy="140" r="125" stroke="#D4AF37" strokeWidth="0.4" opacity="0.3" />
              {/* Lotus petals outer ring - 16 petals */}
              {Array.from({ length: 16 }).map((_, i) => {
                const angle = (i * 22.5) * Math.PI / 180;
                const x = 140 + 118 * Math.cos(angle);
                const y = 140 + 118 * Math.sin(angle);
                const x2 = 140 + 118 * Math.cos(angle + 0.2);
                const y2 = 140 + 118 * Math.sin(angle + 0.2);
                return <path key={i} d={`M140 140 Q${x} ${y} ${x2} ${y2} Z`} stroke="#D4AF37" strokeWidth="0.6" fill="rgba(212,175,55,0.04)" opacity="0.7" />;
              })}
              {/* Large upward triangle */}
              <polygon points="140,30 242,198 38,198" stroke="#D4AF37" strokeWidth="1.2" fill="none" opacity="0.95" />
              {/* Large downward triangle */}
              <polygon points="140,250 242,82 38,82" stroke="#D4AF37" strokeWidth="1.2" fill="none" opacity="0.95" />
              {/* Medium upward triangle */}
              <polygon points="140,55 222,183 58,183" stroke="#D4AF37" strokeWidth="0.8" fill="none" opacity="0.7" />
              {/* Medium downward triangle */}
              <polygon points="140,225 222,97 58,97" stroke="#D4AF37" strokeWidth="0.8" fill="none" opacity="0.7" />
              {/* Inner upward triangle */}
              <polygon points="140,82 202,168 78,168" stroke="#D4AF37" strokeWidth="0.7" fill="none" opacity="0.6" />
              {/* Inner downward triangle */}
              <polygon points="140,198 202,112 78,112" stroke="#D4AF37" strokeWidth="0.7" fill="none" opacity="0.6" />
              {/* Small upward triangle */}
              <polygon points="140,105 186,155 94,155" stroke="#D4AF37" strokeWidth="0.6" fill="none" opacity="0.5" />
              {/* Small downward triangle */}
              <polygon points="140,175 186,125 94,125" stroke="#D4AF37" strokeWidth="0.6" fill="none" opacity="0.5" />
              {/* Inner circle rings */}
              <circle cx="140" cy="140" r="55" stroke="#D4AF37" strokeWidth="0.6" opacity="0.4" />
              <circle cx="140" cy="140" r="35" stroke="#D4AF37" strokeWidth="0.5" opacity="0.3" />
              <circle cx="140" cy="140" r="18" stroke="#D4AF37" strokeWidth="0.5" opacity="0.4" />
              {/* Bindu - center dot */}
              <circle cx="140" cy="140" r="4" fill="#D4AF37" opacity="0.9" />
              <circle cx="140" cy="140" r="8" fill="rgba(212,175,55,0.2)" opacity="0.8" />
            </svg>
            {/* Gold pulse glow at center */}
            <div style={{ position: 'absolute', width: 20, height: 20, borderRadius: '50%', background: '#D4AF37', opacity: 0.3, animation: 'glowBreathe 2s ease-in-out infinite', filter: 'blur(8px)' }} />
          </div>
          <h2 className="mt-6 font-[350] italic text-[2rem] md:text-[3rem] text-[#D4AF37] leading-tight" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            Enter the Field
          </h2>
          <p className="text-white/40 text-[9px] font-extrabold tracking-[0.35em] uppercase mt-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            SIDDHA-QUANTUM INTELLIGENCE · 2050
          </p>
          {/* Badges: hide on mobile */}
          <div className="hidden md:flex flex-wrap justify-center gap-3 mt-8">
            <span className="px-4 py-2 rounded-full bg-white/[0.03] border border-[#D4AF37]/30 text-[#D4AF37] text-[7px] font-extrabold tracking-widest uppercase" style={{ fontFamily: 'Montserrat, sans-serif' }}>⟁ 72,000 NADIS</span>
            <span className="px-4 py-2 rounded-full bg-white/[0.03] border border-[#D4AF37]/30 text-[#D4AF37] text-[7px] font-extrabold tracking-widest uppercase" style={{ fontFamily: 'Montserrat, sans-serif' }}>◈ SRI YANTRA SHIELD</span>
            <span className="px-4 py-2 rounded-full bg-white/[0.03] border border-[#D4AF37]/30 text-[#D4AF37] text-[7px] font-extrabold tracking-widest uppercase" style={{ fontFamily: 'Montserrat, sans-serif' }}>✦ AKASHIC ARCHIVE</span>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL — form */}
      <div
        className="auth-right-panel relative z-10 w-full md:max-w-[50%] md:min-h-screen flex items-center justify-center px-6 py-12 md:py-0 md:px-0"
        style={{
          background: 'rgba(255,255,255,0.02)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        }}
      >
        <div className="auth-right-content w-full max-w-md md:max-w-lg md:px-[48px] md:py-[60px]">
          <p className="text-[#D4AF37]/60 text-[8px] font-extrabold tracking-[0.4em] uppercase mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            {isLogin ? '◈ SOVEREIGN SIGN IN' : '◈ INITIATE TRANSMISSION'}
          </p>
          <h1 className="text-white font-[300] italic text-[2rem] md:text-[2.5rem] leading-tight whitespace-pre-line mb-8" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            {isLogin ? 'Welcome Back,\nBeautiful Soul' : 'Begin Your\nJourney'}
          </h1>

          {/* Referral Banner — keep as-is, add gold border */}
          {referralCode && !isLogin && (
            <div className="mb-6 p-4 rounded-2xl bg-white/[0.04] border border-[#D4AF37]/30 flex items-center gap-3">
              <Gift className="w-6 h-6 text-[#D4AF37] flex-shrink-0" />
              <div>
                <p className="font-medium text-white">{t('auth.youveBeenInvited')}</p>
                <p className="text-xs text-white/60">{t('auth.signUpBonus')}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-white/40 text-[8px] font-extrabold tracking-[0.35em] uppercase block ml-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  {t('auth.yourName')}
                </label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="auth-input w-full rounded-[100px] px-6 py-4 h-auto text-white text-[14px] bg-white/[0.03] border border-white/10 focus:border-[#D4AF37]/50 focus:outline-none focus:ring-0 focus:shadow-[0_0_20px_rgba(212,175,55,0.1)] placeholder:text-white/30 transition-all"
                  placeholder={t('auth.yourName') || 'Your Name'}
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-white/40 text-[8px] font-extrabold tracking-[0.35em] uppercase block ml-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                {t('auth.emailAddress', 'Soul Email')}
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input w-full rounded-[100px] px-6 py-4 h-auto text-white text-[14px] bg-white/[0.03] border border-white/10 focus:border-[#D4AF37]/50 focus:outline-none focus:ring-0 focus:shadow-[0_0_20px_rgba(212,175,55,0.1)] placeholder:text-white/30 transition-all"
                placeholder={t('auth.emailPlaceholder', 'Enter your email...')}
              />
            </div>

            <div className="space-y-2">
              <label className="text-white/40 text-[8px] font-extrabold tracking-[0.35em] uppercase block ml-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                {t('auth.password.label', 'Password')}
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="auth-input w-full rounded-[100px] px-6 py-4 h-auto pr-14 text-white text-[14px] bg-white/[0.03] border border-white/10 focus:border-[#D4AF37]/50 focus:outline-none focus:ring-0 focus:shadow-[0_0_20px_rgba(212,175,55,0.1)] placeholder:text-white/30 transition-all"
                  placeholder={t('auth.password.placeholder', 'Enter your password...')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-white/30 hover:text-[#D4AF37] transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
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
                        title: t('auth.resetEmailTitle'),
                        description: t('auth.resetEmailDescription'),
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
              className="auth-submit-btn w-full mt-2 py-5 rounded-full bg-[#D4AF37] hover:bg-[#D4AF37] active:bg-[#C9A227] text-black font-black text-xs tracking-[0.4em] uppercase shadow-[0_0_30px_rgba(212,175,55,0.3)] hover:shadow-[0_0_50px_rgba(212,175,55,0.5)] hover:scale-[1.02] transition-all"
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

            <div className="mt-8 space-y-3">
              <Button
                variant="glass"
                size="lg"
                className="w-full bg-white/[0.04] border border-white/10 hover:border-[#D4AF37]/40 backdrop-blur-xl"
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

            <p className="mt-8 text-center text-white/40 text-[9px] font-extrabold tracking-widest uppercase" style={{ fontFamily: 'Montserrat, sans-serif' }}>
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
              <p className="text-white/30 text-[9px] font-extrabold tracking-widest uppercase" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                {isLogin ? t('auth.newSeeker', 'New Seeker?') : t('auth.returningSeeker', 'Returning Seeker?')}{' '}
                <span className="text-[#D4AF37] cursor-pointer" onClick={() => setIsLogin(!isLogin)}>
                  {isLogin ? t('auth.signUp', 'Register Here') : t('auth.signIn', 'Sign In')}
                </span>
              </p>
            </div>

            <AppDisclaimer className="mt-10" />
          </form>
        </div>
      </div>

      <style>{`
        @keyframes stardustMove { from { background-position: 0 0; } to { background-position: 1000px 1000px; } }
        @keyframes siddhiSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes glow-breathe { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
        @keyframes glowBreathe { 0%, 100% { opacity: 0.2; transform: scale(1); } 50% { opacity: 0.6; transform: scale(1.5); } }
        .auth-left-content { animation: fadeUp 0.8s ease both; animation-delay: 0.1s; }
        .auth-right-content { animation: fadeUp 0.8s ease both; animation-delay: 0.3s; }
        .auth-submit-btn { background-color: #D4AF37 !important; }
        .auth-submit-btn:hover { background-color: #D4AF37 !important; transform: scale(1.02); box-shadow: 0 0 50px rgba(212,175,55,0.5) !important; }
        .auth-submit-btn:active { background-color: #C9A227 !important; }
        @media (min-width: 768px) {
          .auth-right-panel { border-left: 1px solid rgba(255,255,255,0.05); }
        }
      `}</style>
    </div>
  );
};

export default Auth;
