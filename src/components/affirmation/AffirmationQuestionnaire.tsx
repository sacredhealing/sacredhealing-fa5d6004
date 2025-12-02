import React, { useState } from 'react';
import { Sparkles, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AffirmationQuestionnaireProps {
  packageType: string;
  paymentId?: string;
  onComplete?: () => void;
}

const AffirmationQuestionnaire: React.FC<AffirmationQuestionnaireProps> = ({
  packageType,
  paymentId,
  onComplete
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    goals: '',
    challenges: '',
    intentions: '',
    additional_notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.goals.trim() || !formData.challenges.trim() || !formData.intentions.trim()) {
      toast({
        title: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: 'Please sign in',
          description: 'You need to be signed in to submit the questionnaire',
          variant: 'destructive'
        });
        return;
      }

      const { error } = await supabase
        .from('affirmation_questionnaires')
        .insert({
          user_id: user.id,
          package_type: packageType,
          goals: formData.goals.trim(),
          challenges: formData.challenges.trim(),
          intentions: formData.intentions.trim(),
          additional_notes: formData.additional_notes.trim() || null,
          stripe_payment_id: paymentId || null,
          status: 'submitted'
        });

      if (error) throw error;

      // Send email notification
      try {
        await supabase.functions.invoke('send-questionnaire-notification', {
          body: {
            userEmail: user.email,
            userName: user.user_metadata?.full_name || '',
            packageType,
            goals: formData.goals.trim(),
            challenges: formData.challenges.trim(),
            intentions: formData.intentions.trim(),
            additionalNotes: formData.additional_notes.trim() || undefined,
          }
        });
      } catch (emailError) {
        console.error('Failed to send notification email:', emailError);
      }

      toast({
        title: 'Questionnaire Submitted!',
        description: 'Thank you! We will create your personalized soundtrack based on your responses.',
      });

      onComplete?.();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit questionnaire',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6 bg-gradient-card border-border/50">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 bg-accent/20 px-4 py-2 rounded-full mb-4">
          <Sparkles className="w-4 h-4 text-accent" />
          <span className="text-sm font-medium text-accent">Personalization Questionnaire</span>
        </div>
        <h2 className="text-xl font-heading font-semibold text-foreground mb-2">
          Tell Us About Your Journey
        </h2>
        <p className="text-muted-foreground text-sm">
          Your answers help us create a meditation perfectly aligned with your energy and needs.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="goals" className="text-foreground font-medium">
            What are your main goals and dreams? <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="goals"
            placeholder="Describe what you want to manifest in your life - career goals, relationships, health, spiritual growth..."
            value={formData.goals}
            onChange={(e) => setFormData(prev => ({ ...prev, goals: e.target.value }))}
            className="min-h-[100px] bg-background/50"
            maxLength={2000}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="challenges" className="text-foreground font-medium">
            What challenges or blocks are you facing? <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="challenges"
            placeholder="Share any limiting beliefs, fears, or obstacles you want to overcome..."
            value={formData.challenges}
            onChange={(e) => setFormData(prev => ({ ...prev, challenges: e.target.value }))}
            className="min-h-[100px] bg-background/50"
            maxLength={2000}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="intentions" className="text-foreground font-medium">
            What are your intentions for this meditation? <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="intentions"
            placeholder="How do you want to feel? What transformation do you seek? What energy do you want to embody?"
            value={formData.intentions}
            onChange={(e) => setFormData(prev => ({ ...prev, intentions: e.target.value }))}
            className="min-h-[100px] bg-background/50"
            maxLength={2000}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="additional_notes" className="text-foreground font-medium">
            Additional Notes (Optional)
          </Label>
          <Textarea
            id="additional_notes"
            placeholder="Any other information you'd like to share - preferred music style, specific themes, etc."
            value={formData.additional_notes}
            onChange={(e) => setFormData(prev => ({ ...prev, additional_notes: e.target.value }))}
            className="min-h-[80px] bg-background/50"
            maxLength={1000}
          />
        </div>

        <Button
          type="submit"
          variant="gold"
          size="lg"
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Send className="w-5 h-5 mr-2" />
              Submit Questionnaire
            </>
          )}
        </Button>
      </form>
    </Card>
  );
};

export default AffirmationQuestionnaire;
