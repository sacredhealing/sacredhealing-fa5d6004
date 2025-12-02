import React, { useState } from 'react';
import { ArrowLeft, CheckCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AffirmationQuestionnaire from '@/components/affirmation/AffirmationQuestionnaire';

const AffirmationSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [submitted, setSubmitted] = useState(false);
  
  const packageType = searchParams.get('package') || 'basic';
  const sessionId = searchParams.get('session_id') || undefined;

  const packageName = packageType === 'ultimate' 
    ? 'The Ultimate Soulwave Activation Package' 
    : 'Personalized Affirmation Soundtrack';

  if (submitted) {
    return (
      <div className="min-h-screen pb-32 flex items-center justify-center px-4">
        <Card className="p-8 bg-gradient-card border-border/50 max-w-md text-center">
          <CheckCircle className="w-16 h-16 text-accent mx-auto mb-4" />
          <h1 className="text-2xl font-heading font-bold text-foreground mb-3">
            Thank You!
          </h1>
          <p className="text-muted-foreground mb-6">
            Your questionnaire has been submitted. We'll begin creating your personalized soundtrack based on your responses.
          </p>
          <Button variant="gold" onClick={() => navigate('/dashboard')}>
            Return to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32">
      <div className="relative bg-gradient-spiritual px-4 pt-6 pb-16">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate('/dashboard')}
          className="absolute top-4 left-4 text-foreground/80"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        <div className="text-center pt-12 max-w-lg mx-auto">
          <div className="inline-flex items-center gap-2 bg-accent/20 px-4 py-2 rounded-full mb-4">
            <CheckCircle className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-accent">Payment Successful</span>
          </div>
          <h1 className="text-2xl font-heading font-bold text-foreground mb-2">
            Welcome to Your Transformation
          </h1>
          <p className="text-foreground/80">
            You've purchased: {packageName}
          </p>
        </div>
      </div>

      <div className="px-4 -mt-8 max-w-2xl mx-auto space-y-6">
        <Card className="p-6 bg-gradient-card border-accent/30 animate-slide-up">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h2 className="font-heading font-semibold text-foreground mb-1">
                One More Step
              </h2>
              <p className="text-muted-foreground text-sm">
                Please complete the questionnaire below so we can create your personalized meditation. Your answers guide the creation of affirmations, frequencies, and sounds uniquely tailored to you.
              </p>
            </div>
          </div>
        </Card>

        <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <AffirmationQuestionnaire 
            packageType={packageType}
            paymentId={sessionId}
            onComplete={() => setSubmitted(true)}
          />
        </div>
      </div>
    </div>
  );
};

export default AffirmationSuccess;
