import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSHC } from '@/contexts/SHCContext';
import { toast } from 'sonner';

export type GoalType = 'stress' | 'sleep' | 'focus' | 'healing' | 'awakening' | 'peace';

export interface OnboardingData {
  goals: GoalType[];
  practiceDuration: number;
  morningTime: string;
  middayTime: string;
  eveningTime: string;
  notificationStyle: string;
}

export const useOnboarding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { earnSHC, refreshBalance } = useSHC();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  const [data, setData] = useState<OnboardingData>({
    goals: [],
    practiceDuration: 10,
    morningTime: '07:00',
    middayTime: '12:00',
    eveningTime: '21:00',
    notificationStyle: 'gentle',
  });

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const toggleGoal = (goal: GoalType) => {
    setData(prev => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter(g => g !== goal)
        : [...prev.goals, goal]
    }));
  };

  const nextStep = () => setCurrentStep(prev => prev + 1);
  const prevStep = () => setCurrentStep(prev => Math.max(0, prev - 1));

  const completeOnboarding = async () => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      // Save goals to user_spiritual_goals
      for (let i = 0; i < data.goals.length; i++) {
        await supabase.from('user_spiritual_goals').insert({
          user_id: user.id,
          goal_type: data.goals[i],
          priority: i + 1,
        });
      }

      // Ensure times are valid (not empty) - use defaults if empty
      const morningTime = data.morningTime || '07:00';
      const middayTime = data.middayTime || '12:00';
      const eveningTime = data.eveningTime || '21:00';

      // Update profile with preferences
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          onboarding_completed: true,
          preferred_practice_duration: data.practiceDuration,
          daily_goal_minutes: data.practiceDuration,
          notification_style: data.notificationStyle,
          morning_reminder_time: morningTime,
          midday_reminder_time: middayTime,
          evening_reminder_time: eveningTime,
        })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      // Award welcome bonus SHC using the earnSHC function from context
      await earnSHC(50, 'Onboarding completion bonus');

      await refreshBalance();
      toast.success('Welcome to your spiritual journey! +50 SHC earned');
      navigate('/dashboard');
    } catch (error) {
      console.error('Onboarding error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    data,
    updateData,
    toggleGoal,
    currentStep,
    setCurrentStep,
    nextStep,
    prevStep,
    completeOnboarding,
    isSubmitting,
  };
};
