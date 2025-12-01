import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LotusIcon } from '@/components/icons/LotusIcon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Lock, User, ArrowRight, Sparkles, Loader2, Gift } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { usePhantomWallet } from '@/hooks/usePhantomWallet';
import { supabase } from '@/integrations/supabase/client';

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get('ref');
  const { signIn, signUp, isAuthenticated, isLoading: authLoading } = useAuth();
  const { connectWallet, isConnecting } = usePhantomWallet();
  const { toast } = useToast();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If there's a referral code, default to signup mode
  useEffect(() => {
    if (referralCode) {
      setIsLogin(false);
    }
  }, [referralCode]);

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
        title: "Missing fields",
        description: "Please enter your email and password",
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
            title: "Sign in failed",
            description: error.message,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Welcome back!",
            description: "You've signed in successfully"
          });
          navigate('/dashboard');
        }
      } else {
        if (!name) {
          toast({
            title: "Missing name",
            description: "Please enter your name",
            variant: "destructive"
          });
          setIsSubmitting(false);
          return;
        }
        
        const { data, error } = await signUp(email, password, name);
        if (error) {
          toast({
            title: "Sign up failed",
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
                  title: "Welcome to Sacred Healing!",
                  description: "You've received 50 SHC welcome bonus! Your referrer got 100 SHC too!"
                });
              } else {
                toast({
                  title: "Welcome to Sacred Healing!",
                  description: "You've received 50 SHC as a welcome bonus!"
                });
              }
            } catch (refError) {
              console.error('Referral processing error:', refError);
              toast({
                title: "Welcome to Sacred Healing!",
                description: "You've received 50 SHC as a welcome bonus!"
              });
            }
          } else {
            toast({
              title: "Welcome to Sacred Healing!",
              description: "You've received 50 SHC as a welcome bonus!"
            });
          }
          navigate('/dashboard');
        }
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
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
        title: "Wallet connected",
        description: "Please also create an account to use the app"
      });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/15 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col px-6 pt-12 pb-8">
        {/* Header */}
        <div className="flex flex-col items-center animate-fade-in">
          <LotusIcon size={80} className="drop-shadow-[0_0_20px_hsl(var(--primary))]" />
          <h1 className="mt-4 text-3xl font-heading font-bold text-gradient-spiritual">
            Sacred Healing
          </h1>
          <p className="mt-2 text-muted-foreground">
            {isLogin ? 'Welcome back, beautiful soul' : 'Begin your healing journey'}
          </p>
        </div>

        {/* Referral Banner */}
        {referralCode && !isLogin && (
          <div className="mt-6 p-4 rounded-xl bg-secondary/20 border border-secondary/30 flex items-center gap-3 animate-fade-in">
            <Gift className="w-6 h-6 text-secondary flex-shrink-0" />
            <div>
              <p className="font-medium text-foreground">You've been invited!</p>
              <p className="text-sm text-muted-foreground">Sign up now and get 50 SHC bonus</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-10 space-y-4 animate-slide-up">
          {!isLogin && (
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <Input
                type="text"
                placeholder="Your Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-12 h-14 bg-muted/50 border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground focus:ring-primary"
              />
            </div>
          )}
          
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <Input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-12 h-14 bg-muted/50 border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground focus:ring-primary"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-12 h-14 bg-muted/50 border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground focus:ring-primary"
            />
          </div>

          <Button type="submit" size="xl" className="w-full mt-6" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {isLogin ? 'Sign In' : 'Create Account'}
                <ArrowRight size={20} />
              </>
            )}
          </Button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-8">
          <div className="flex-1 h-px bg-border/50" />
          <span className="text-sm text-muted-foreground">or continue with</span>
          <div className="flex-1 h-px bg-border/50" />
        </div>

        {/* Social buttons */}
        <div className="space-y-3">
          <Button 
            variant="glass" 
            size="lg" 
            className="w-full"
            onClick={handlePhantomConnect}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <Sparkles className="w-5 h-5 mr-2 text-purple" />
            )}
            Connect Phantom Wallet
          </Button>
        </div>

        {/* Toggle */}
        <p className="mt-8 text-center text-muted-foreground">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="ml-2 text-primary font-medium hover:underline"
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;
