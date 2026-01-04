import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { LotusIcon } from '@/components/icons/LotusIcon';
import { Button } from '@/components/ui/button';
import { OnboardingStep } from '@/components/onboarding/OnboardingStep';
import { GoalSelector } from '@/components/onboarding/GoalSelector';
import { DurationSelector } from '@/components/onboarding/DurationSelector';
import { TimeSelector } from '@/components/onboarding/TimeSelector';
import { PathRecommendation } from '@/components/onboarding/PathRecommendation';
import { useOnboarding } from '@/hooks/useOnboarding';

const TOTAL_STEPS = 5;

const Onboarding: React.FC = () => {
  const {
    data,
    updateData,
    toggleGoal,
    currentStep,
    nextStep,
    prevStep,
    completeOnboarding,
    isSubmitting,
  } = useOnboarding();

  // Step 0: Welcome
  if (currentStep === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{ 
              duration: 4, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="mb-8 relative"
          >
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl scale-150" />
            <LotusIcon size={120} className="relative z-10 text-primary mx-auto" />
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-heading font-bold text-foreground mb-3"
          >
            Welcome, Sacred Soul
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-muted-foreground text-lg mb-8"
          >
            Let's personalize your spiritual journey
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex items-center justify-center gap-2 text-accent text-sm mb-8"
          >
            <Sparkles className="w-4 h-4" />
            <span>Earn +50 SHC for completing setup</span>
            <Sparkles className="w-4 h-4" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <Button
              onClick={nextStep}
              variant="spiritual"
              size="lg"
              className="px-12"
            >
              Begin Your Journey
            </Button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Step 1: Goals
  if (currentStep === 1) {
    return (
      <OnboardingStep
        title="What brings you here?"
        subtitle="Select all that resonate with you"
        currentStep={currentStep}
        totalSteps={TOTAL_STEPS}
        onBack={prevStep}
        onNext={nextStep}
        nextDisabled={data.goals.length === 0}
      >
        <GoalSelector
          selectedGoals={data.goals}
          onToggle={toggleGoal}
        />
      </OnboardingStep>
    );
  }

  // Step 2: Duration
  if (currentStep === 2) {
    return (
      <OnboardingStep
        title="How much time can you dedicate?"
        subtitle="Choose your ideal daily practice duration"
        currentStep={currentStep}
        totalSteps={TOTAL_STEPS}
        onBack={prevStep}
        onNext={nextStep}
      >
        <DurationSelector
          selectedDuration={data.practiceDuration}
          onSelect={(duration) => updateData({ practiceDuration: duration })}
        />
      </OnboardingStep>
    );
  }

  // Step 3: Times
  if (currentStep === 3) {
    return (
      <OnboardingStep
        title="Set your daily rhythm"
        subtitle="We'll gently remind you at these times"
        currentStep={currentStep}
        totalSteps={TOTAL_STEPS}
        onBack={prevStep}
        onNext={nextStep}
      >
        <TimeSelector
          morningTime={data.morningTime}
          middayTime={data.middayTime}
          eveningTime={data.eveningTime}
          onMorningChange={(time) => updateData({ morningTime: time })}
          onMiddayChange={(time) => updateData({ middayTime: time })}
          onEveningChange={(time) => updateData({ eveningTime: time })}
        />
      </OnboardingStep>
    );
  }

  // Step 4: Path Recommendation & Complete
  if (currentStep === 4) {
    return (
      <OnboardingStep
        title="Your Recommended Path"
        subtitle="Based on your goals, we suggest starting here"
        currentStep={currentStep}
        totalSteps={TOTAL_STEPS}
        onBack={prevStep}
        onNext={completeOnboarding}
        nextLabel="Complete Setup"
        isLoading={isSubmitting}
      >
        <PathRecommendation userGoals={data.goals} />
      </OnboardingStep>
    );
  }

  return null;
};

export default Onboarding;
