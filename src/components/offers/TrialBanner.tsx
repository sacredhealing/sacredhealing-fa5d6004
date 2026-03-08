import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Clock, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface TrialBannerProps {
  onTrialStarted?: () => void;
}

export const TrialBanner = ({ onTrialStarted }: TrialBannerProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isStarting, setIsStarting] = useState(false);

  const handleStartTrial = async () => {
    if (!user) {
      navigate("/auth?redirect=/membership");
      return;
    }

    setIsStarting(true);
    try {
      const { data, error } = await supabase.functions.invoke("start-free-trial");

      if (error) throw error;

      if (data.success) {
        toast.success("Your 14-day free trial has started!", {
          description: "Enjoy full access to all premium content."
        });
        onTrialStarted?.();
      } else {
        toast.error(data.error || "Could not start trial");
      }
    } catch (error: any) {
      console.error("Error starting trial:", error);
      toast.error(error.message || "Failed to start trial");
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <Card className="relative overflow-hidden border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
      
      <div className="relative p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex-shrink-0">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2">
              Start Your 14-Day Free Trial
            </h3>
            <p className="text-muted-foreground mb-4">
              Experience the full power of Siddha Quantum Nexus Club with unlimited access to all premium content.
            </p>
            
            <div className="flex flex-wrap gap-4 justify-center md:justify-start text-sm">
              <div className="flex items-center gap-2 text-foreground">
                <Check className="w-4 h-4 text-primary" />
                <span>All meditations</span>
              </div>
              <div className="flex items-center gap-2 text-foreground">
                <Check className="w-4 h-4 text-primary" />
                <span>Premium courses</span>
              </div>
              <div className="flex items-center gap-2 text-foreground">
                <Check className="w-4 h-4 text-primary" />
                <span>Spiritual paths</span>
              </div>
              <div className="flex items-center gap-2 text-foreground">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>No credit card required</span>
              </div>
            </div>
          </div>
          
          <div className="w-full md:w-auto md:flex-shrink-0">
            <Button
              size="lg"
              onClick={handleStartTrial}
              disabled={isStarting}
              className="w-full md:w-auto bg-primary hover:bg-primary/90 text-primary-foreground px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg font-semibold"
            >
              {isStarting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Start Free Trial
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
