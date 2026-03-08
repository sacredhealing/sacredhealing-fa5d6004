import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  GraduationCap, 
  Heart, 
  Sparkles, 
  Music, 
  Brain, 
  Users, 
  Shield, 
  CheckCircle2,
  Star,
  Clock,
  Award,
  BookOpen
} from 'lucide-react';

const PractitionerCertification = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState<'onetime' | 'monthly' | null>(null);

  const handleEnroll = async (paymentType: 'onetime' | 'monthly') => {
    if (!isAuthenticated) {
      toast.error('Please sign in to enroll');
      return;
    }

    setIsLoading(paymentType);
    try {
      const { data, error } = await supabase.functions.invoke('create-certification-checkout', {
        body: { paymentType }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error('Failed to start checkout');
    } finally {
      setIsLoading(null);
    }
  };

  const modules = [
    {
      icon: Heart,
      title: "Foundational Healing & Energy Work",
      items: [
        "Nervous system regulation techniques",
        "Chakra balancing and energy flow",
        "Clearing and protection practices"
      ]
    },
    {
      icon: Sparkles,
      title: "Yogic Knowledge & Practice",
      items: [
        "Yoga asanas to support healing",
        "Pranayama and Transformational Breath® techniques",
        "Breathing exercises for energy and emotional release"
      ]
    },
    {
      icon: Music,
      title: "Mantra & Sound Healing",
      items: [
        "Using sacred sounds and mantras for deep healing",
        "Creating sound fields for personal and client transformation",
        "Integration of vibration into healing practice"
      ]
    },
    {
      icon: Brain,
      title: "Meditation & Visualization",
      items: [
        "Deep meditation techniques",
        "Guided visualizations for clients and self-healing",
        "Expansion of consciousness and energy alignment"
      ]
    },
    {
      icon: Users,
      title: "Personal Development & Coaching",
      items: [
        "Mastering the mind",
        "Opening the heart",
        "Developing intuition and energetic guidance",
        "Practical tools to support clients"
      ]
    },
    {
      icon: Shield,
      title: "Professional Practice & Ethics",
      items: [
        "Client management",
        "Ethical guidelines for healers",
        "Structuring professional healing sessions"
      ]
    }
  ];

  const outcomes = [
    "Work independently as a Siddha Quantum Nexus Vibration Practitioner",
    "Support clients in nervous system regulation, trauma healing, and energy balancing",
    "Apply sound, mantra, meditation, and yogic practices professionally",
    "Expand intuition and deepen connection with the heart"
  ];

  const bonuses = [
    "Membership in Stargate community & Telegram group",
    "Direct guidance from Laila and Adam throughout the year",
    "Meditations, mantras, and sound healing recordings for support",
    "Optional personal coaching sessions"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background">
      {/* Hero Section */}
      <section className="relative py-20 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        <div className="relative max-w-4xl mx-auto">
          <Badge className="mb-6 bg-primary/20 text-primary border-primary/30">
            <GraduationCap className="w-4 h-4 mr-2" />
            1-Year Certification Program
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Siddha Quantum Nexus Vibration Practitioner Certification
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Become a certified Siddha Quantum Nexus Vibration Practitioner through our comprehensive 1-year online program. 
            Master the art of healing, open your heart, and awaken your intuition.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-5 h-5 text-primary" />
              <span>12 Months</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <BookOpen className="w-5 h-5 text-primary" />
              <span>6 Core Modules</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Award className="w-5 h-5 text-primary" />
              <span>Official Certification</span>
            </div>
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            What's Included
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module, index) => (
              <Card key={index} className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all duration-300">
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                    <module.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{module.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {module.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Certification Requirements */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Certification Requirements</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              "Active participation for 1 full year",
              "Completion of all online modules",
              "Passing tests and practical assignments",
              "Practical experience (client practice or guided exercises)"
            ].map((req, i) => (
              <div key={i} className="flex items-center gap-3 p-4 bg-card rounded-lg border border-border/50">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                <span>{req}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Program Outcomes */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Program Outcomes</h2>
          <p className="text-center text-muted-foreground mb-8">
            After completing the certification, you will be able to:
          </p>
          <div className="space-y-4">
            {outcomes.map((outcome, i) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
                <Star className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span>{outcome}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bonus Access */}
      <section className="py-16 px-4 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Bonus Access</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {bonuses.map((bonus, i) => (
              <div key={i} className="flex items-center gap-3 p-4 bg-card/80 backdrop-blur-sm rounded-lg border border-primary/20">
                <Sparkles className="w-5 h-5 text-accent flex-shrink-0" />
                <span>{bonus}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">How It Works</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              "Fully online program",
              "Flexible study schedule with guided support",
              "Integration of live sessions, exercises, and community learning",
              "Designed for personal transformation while training professionally"
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-4 bg-card rounded-lg border border-border/50">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Investment in Your Future</h2>
          <p className="text-center text-muted-foreground mb-12">
            Choose the payment option that works best for you
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {/* One-time Payment */}
            <Card className="border-primary/50 bg-gradient-to-b from-primary/5 to-transparent relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <Badge className="bg-primary text-primary-foreground">Best Value</Badge>
              </div>
              <CardHeader className="text-center pt-12">
                <CardTitle className="text-2xl mb-2">One-Time Payment</CardTitle>
                <div className="text-4xl font-bold text-primary">€2,997</div>
                <p className="text-muted-foreground">Full year access</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span>Save €567 compared to monthly</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span>Immediate full access</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span>All bonuses included</span>
                  </li>
                </ul>
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => handleEnroll('onetime')}
                  disabled={isLoading !== null}
                >
                  {isLoading === 'onetime' ? 'Processing...' : 'Enroll Now - €2,997'}
                </Button>
              </CardContent>
            </Card>

            {/* Monthly Payment */}
            <Card className="border-border/50 bg-card/50">
              <CardHeader className="text-center pt-12">
                <CardTitle className="text-2xl mb-2">Monthly Payment</CardTitle>
                <div className="text-4xl font-bold">€297</div>
                <p className="text-muted-foreground">per month for 12 months</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span>Flexible payment plan</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span>Cancel anytime</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span>All bonuses included</span>
                  </li>
                </ul>
                <Button 
                  className="w-full" 
                  size="lg"
                  variant="outline"
                  onClick={() => handleEnroll('monthly')}
                  disabled={isLoading !== null}
                >
                  {isLoading === 'monthly' ? 'Processing...' : 'Start Monthly - €297/mo'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PractitionerCertification;
