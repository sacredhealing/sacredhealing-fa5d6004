import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LotusIcon } from '@/components/icons/LotusIcon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Listen for the PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true);
      }
    });

    // Also check hash for recovery token
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) {
      setIsRecovery(true);
    }

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast({ title: 'Password too short', description: 'Password must be at least 6 characters.', variant: 'destructive' });
      return;
    }

    if (password !== confirmPassword) {
      toast({ title: 'Passwords do not match', description: 'Please make sure both passwords are the same.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        setSuccess(true);
        toast({ title: 'Password updated', description: 'Your password has been reset successfully.' });
        setTimeout(() => navigate('/auth'), 2000);
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isRecovery && !success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
        <LotusIcon size={60} className="drop-shadow-[0_0_20px_hsl(var(--primary))]" />
        <h1 className="mt-4 text-xl font-heading font-bold text-foreground">Invalid Reset Link</h1>
        <p className="mt-2 text-muted-foreground text-center text-sm">This link is invalid or has expired.</p>
        <Button className="mt-6" onClick={() => navigate('/auth')}>Back to Login</Button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
        <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
        <h1 className="text-xl font-heading font-bold text-foreground">Password Reset!</h1>
        <p className="mt-2 text-muted-foreground text-sm">Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/15 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
        <LotusIcon size={60} className="drop-shadow-[0_0_20px_hsl(var(--primary))]" />
        <h1 className="mt-4 text-2xl font-heading font-bold text-gradient-spiritual">Set New Password</h1>
        <p className="mt-2 text-muted-foreground text-sm">Enter your new password below.</p>

        <form onSubmit={handleSubmit} className="mt-8 w-full max-w-sm space-y-4">
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <Input
              type="password"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-12 h-14 bg-muted/50 border-border/50 rounded-xl"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <Input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-12 h-14 bg-muted/50 border-border/50 rounded-xl"
            />
          </div>
          <Button type="submit" size="xl" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Reset Password <ArrowRight size={20} /></>}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
