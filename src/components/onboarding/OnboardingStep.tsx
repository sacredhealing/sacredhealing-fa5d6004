import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface OnboardingStepProps {
  title: string;
  subtitle?: string;
  currentStep: number;
  totalSteps: number;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  isLoading?: boolean;
  children: React.ReactNode;
}

export const OnboardingStep: React.FC<OnboardingStepProps> = ({
  title,
  subtitle,
  currentStep,
  totalSteps,
  onBack,
  onNext,
  nextLabel = 'Continue',
  nextDisabled = false,
  isLoading = false,
  children,
}) => {
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-4 mb-4">
          {onBack && currentStep > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="shrink-0"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          )}
          <Progress value={progress} className="flex-1 h-2" />
          <span className="text-sm text-muted-foreground shrink-0">
            {currentStep + 1}/{totalSteps}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 pb-24 overflow-auto">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          <div className="text-center pt-4 pb-2">
            <h1 className="text-2xl font-heading font-bold text-foreground mb-2">
              {title}
            </h1>
            {subtitle && (
              <p className="text-muted-foreground">{subtitle}</p>
            )}
          </div>
          
          {children}
        </motion.div>
      </div>

      {/* Footer */}
      {onNext && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent pt-8">
          <Button
            onClick={onNext}
            disabled={nextDisabled || isLoading}
            className="w-full h-12 text-base"
            variant="spiritual"
          >
            {isLoading ? 'Please wait...' : nextLabel}
          </Button>
        </div>
      )}
    </div>
  );
};
