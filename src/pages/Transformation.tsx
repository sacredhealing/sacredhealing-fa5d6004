import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Sparkles, 
  Video, 
  MessageCircle, 
  Heart, 
  BookOpen, 
  Award, 
  Users, 
  Check,
  ChevronDown,
  ChevronUp,
  Calendar
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Module {
  number: number;
  name: string;
  duration_months: number;
  description: string;
}

interface TransformationProgram {
  id: string;
  name: string;
  description: string;
  price_eur: number;
  duration_months: number;
  modules: Module[];
  features: string[];
}

const featureIcons: Record<string, React.ElementType> = {
  'zoom': Video,
  'whatsapp': MessageCircle,
  'healing': Heart,
  'materials': BookOpen,
  'certificate': Award,
  'community': Users,
};

const getFeatureIcon = (feature: string): React.ElementType => {
  const lower = feature.toLowerCase();
  if (lower.includes('zoom')) return Video;
  if (lower.includes('whatsapp')) return MessageCircle;
  if (lower.includes('healing')) return Heart;
  if (lower.includes('material')) return BookOpen;
  if (lower.includes('certificate')) return Award;
  if (lower.includes('community')) return Users;
  return Check;
};

const Transformation = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [program, setProgram] = useState<TransformationProgram | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    fetchProgram();
  }, []);

  const fetchProgram = async () => {
    const { data, error } = await supabase
      .from('transformation_programs')
      .select('*')
      .single();

    if (data) {
      setProgram({
        ...data,
        modules: (data.modules as unknown) as Module[],
        features: (data.features as unknown) as string[],
      });
    }
    setLoading(false);
  };

  const handleEnroll = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    setEnrolling(true);
    // TODO: Implement Stripe checkout for €2497
    toast.info('Payment integration coming soon!');
    setEnrolling(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="p-8 text-center">
          <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-foreground mb-2">Program Not Available</h3>
          <p className="text-muted-foreground text-sm">
            The transformation program is currently being prepared.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-amber-500/30 via-primary/20 to-purple-500/30 px-4 py-10 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,215,0,0.1),transparent_70%)]" />
        <div className="relative">
          <Badge className="bg-amber-500 text-white mb-4">Life-Changing Journey</Badge>
          <h1 className="text-3xl font-bold text-foreground mb-3">{program.name}</h1>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            {program.description}
          </p>
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {program.duration_months} months
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="w-4 h-4" />
              {program.modules.length} modules
            </span>
          </div>
        </div>
      </div>

      {/* Price Card */}
      <div className="px-4 -mt-4 relative z-10">
        <Card className="p-6 bg-gradient-to-br from-amber-500/10 to-purple-500/10 border-amber-500/30">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Investment in Your Transformation</p>
            <div className="text-4xl font-bold text-foreground mb-2">€{program.price_eur.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground mb-4">One-time payment • Lifetime access to materials</p>
            <Button 
              onClick={handleEnroll}
              disabled={enrolling}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white"
              size="lg"
            >
              {enrolling ? 'Processing...' : 'Begin Your Transformation'}
            </Button>
          </div>
        </Card>
      </div>

      {/* What's Included */}
      <div className="px-4 py-6">
        <h2 className="text-lg font-bold text-foreground mb-4">What's Included</h2>
        <div className="grid grid-cols-2 gap-3">
          {program.features.map((feature, idx) => {
            const Icon = getFeatureIcon(feature);
            return (
              <Card key={idx} className="p-4 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Icon className="w-5 h-5 text-amber-500" />
                </div>
                <span className="text-sm text-foreground leading-snug">{feature}</span>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Modules */}
      <div className="px-4 py-6">
        <h2 className="text-lg font-bold text-foreground mb-4">The 3 Modules</h2>
        <Accordion type="single" collapsible className="space-y-3">
          {program.modules.map((module) => (
            <AccordionItem key={module.number} value={`module-${module.number}`} className="border rounded-lg overflow-hidden">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-purple-500 flex items-center justify-center text-white font-bold">
                    {module.number}
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-foreground">{module.name}</h3>
                    <p className="text-xs text-muted-foreground">{module.duration_months} months</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <p className="text-sm text-muted-foreground pl-13">
                  {module.description}
                </p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {/* Daily Support Highlight */}
      <div className="px-4 py-6">
        <Card className="p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-green-500/20">
              <MessageCircle className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">Daily WhatsApp Connection</h3>
              <p className="text-sm text-muted-foreground">
                Stay connected with your practitioner every day. Get guidance, share your experiences, 
                and receive healing support whenever you need it throughout your transformation journey.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Testimonial placeholder */}
      <div className="px-4 py-6">
        <Card className="p-6 bg-muted/30 border-dashed">
          <div className="text-center">
            <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground italic">
              "This program changed my life completely. The daily support and healing sessions 
              helped me release years of trauma and step into my true power."
            </p>
            <p className="text-sm font-medium text-foreground mt-3">— Transformation Graduate</p>
          </div>
        </Card>
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-20 left-0 right-0 px-4 pb-4 bg-gradient-to-t from-background via-background to-transparent pt-8">
        <Button 
          onClick={handleEnroll}
          disabled={enrolling}
          className="w-full bg-amber-500 hover:bg-amber-600 text-white shadow-lg"
          size="lg"
        >
          {enrolling ? 'Processing...' : `Enroll Now • €${program.price_eur.toLocaleString()}`}
        </Button>
      </div>
    </div>
  );
};

export default Transformation;
