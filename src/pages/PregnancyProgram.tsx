import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Heart, Baby, Sparkles, Calendar, Play, CheckCircle, Loader2, Star, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const PregnancyProgram: React.FC = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<'onetime' | 'monthly' | null>(null);

  const handleEnroll = async (paymentType: 'onetime' | 'monthly') => {
    setIsLoading(paymentType);
    try {
      const { data, error } = await supabase.functions.invoke('create-pregnancy-checkout', {
        body: { paymentType }
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to start checkout',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(null);
    }
  };

  const benefits = [
    'Relieve pregnancy-related tension and stress',
    'Prepare emotionally and energetically for birth',
    'Strengthen intuition and connection with your baby',
    'Support mental clarity, calm, and confidence',
    'Safe, pregnancy-adapted practices for each trimester',
    'Access recordings anytime for practice at home'
  ];

  const included = [
    { icon: Calendar, title: 'Live Zoom Calls', desc: 'One personalized session per trimester with Q&A' },
    { icon: Heart, title: 'Yoga & Breathwork', desc: 'Pregnancy-safe practices for relaxation and alignment' },
    { icon: Sparkles, title: 'Meditation & Visualization', desc: 'Foster deep connection with your baby' },
    { icon: Star, title: 'Energetic Support', desc: 'Gentle healing and chakra balancing throughout' }
  ];

  const trimesters = [
    {
      title: 'Trimester 1',
      subtitle: 'Foundation & Connection',
      content: 'Practices for early pregnancy focusing on grounding, nausea relief, and establishing connection with your baby.'
    },
    {
      title: 'Trimester 2',
      subtitle: 'Energy & Growth',
      content: 'Focus on energy, posture, emotional support, and heart-opening practices as your baby grows.'
    },
    {
      title: 'Trimester 3',
      subtitle: 'Preparation & Visualization',
      content: 'Birth preparation, relaxation techniques, labor breathing, and empowering birth visualization.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-pink-50 to-purple-50 dark:from-background dark:via-background dark:to-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/courses" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Courses</span>
          </Link>
          <Badge variant="secondary" className="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
            <Baby className="w-3 h-3 mr-1" />
            Sacred Pregnancy
          </Badge>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-rose-200/30 via-pink-200/30 to-purple-200/30 dark:from-rose-900/10 dark:via-pink-900/10 dark:to-purple-900/10" />
        <div className="absolute top-10 left-10 w-64 h-64 bg-rose-300/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/60 dark:bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
            <Heart className="w-5 h-5 text-rose-500" />
            <span className="text-sm font-medium text-rose-700 dark:text-rose-300">Body • Mind • Spirit</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
            Sacred Pregnancy Program
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            Support your body, mind, and spirit throughout pregnancy with gentle yoga, meditation, breathwork, and energetic guidance.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Button 
              size="lg" 
              onClick={() => handleEnroll('onetime')}
              disabled={isLoading !== null}
              className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white px-8 py-6 text-lg shadow-lg shadow-rose-500/25"
            >
              {isLoading === 'onetime' ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <Heart className="w-5 h-5 mr-2" />
              )}
              Enroll Now – €297
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => handleEnroll('monthly')}
              disabled={isLoading !== null}
              className="border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-700 dark:text-rose-300 dark:hover:bg-rose-900/20 px-8 py-6 text-lg"
            >
              {isLoading === 'monthly' ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <Calendar className="w-5 h-5 mr-2" />
              )}
              €97/month for 3 months
            </Button>
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4 text-foreground">What's Included</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Everything you need for a supported, sacred pregnancy journey
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {included.map((item, index) => (
              <Card key={index} className="p-6 bg-white/70 dark:bg-card/70 backdrop-blur-sm border-rose-100 dark:border-border hover:shadow-lg hover:shadow-rose-500/10 transition-all">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-900/30 dark:to-pink-900/30 flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Trimesters */}
      <section className="py-16 px-4 bg-white/50 dark:bg-card/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4 text-foreground">Your Journey</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Guided support through each stage of your pregnancy
          </p>
          
          <div className="space-y-6">
            {trimesters.map((trimester, index) => (
              <Card key={index} className="p-6 md:p-8 bg-white dark:bg-card border-rose-100 dark:border-border">
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl font-bold text-white">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-foreground">{trimester.title}</h3>
                      <Badge variant="outline" className="border-rose-200 text-rose-600 dark:border-rose-800 dark:text-rose-400">
                        {trimester.subtitle}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground">{trimester.content}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Play className="w-4 h-4" />
                    <span>Zoom + Audio</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4 text-foreground">Benefits</h2>
          <p className="text-center text-muted-foreground mb-12">
            Transform your pregnancy experience
          </p>
          
          <div className="grid md:grid-cols-2 gap-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-3 p-4 rounded-xl bg-white/70 dark:bg-card/50 backdrop-blur-sm">
                <CheckCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                <span className="text-foreground">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4 bg-white/50 dark:bg-card/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4 text-foreground">What Mothers Say</h2>
          <p className="text-center text-muted-foreground mb-12">
            Real experiences from our sacred pregnancy community
          </p>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Emma S.",
                trimester: "3rd Trimester",
                quote: "The birth visualization meditation was life-changing. I felt so calm and empowered during labor. This program gave me tools I'll use forever.",
                avatar: "🌸"
              },
              {
                name: "Sofia L.",
                trimester: "2nd Trimester",
                quote: "I connected with my baby on such a deep level through these practices. The Zoom calls with Laila were incredibly supportive and personalized.",
                avatar: "🌺"
              },
              {
                name: "Anna K.",
                trimester: "Postpartum",
                quote: "The breathwork techniques helped me through my entire pregnancy and birth. I recommend this to every expecting mother. Truly sacred.",
                avatar: "🌷"
              }
            ].map((testimonial, index) => (
              <Card key={index} className="p-6 bg-white dark:bg-card border-rose-100 dark:border-border relative">
                <Quote className="w-8 h-8 text-rose-200 dark:text-rose-900/50 absolute top-4 right-4" />
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-900/30 dark:to-pink-900/30 flex items-center justify-center text-2xl">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                    <p className="text-xs text-rose-500">{testimonial.trimester}</p>
                  </div>
                </div>
                <p className="text-muted-foreground italic leading-relaxed">"{testimonial.quote}"</p>
                <div className="flex gap-1 mt-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 md:p-12 bg-gradient-to-br from-rose-500 via-pink-500 to-purple-500 border-0 text-white text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnYtMmgtMnYtMmgydi0ySDMydi0yaDR2MmgydjJoMnYyaC0ydjJoLTJ2NGgtMnYyaC0ydi0yem0wLTEwdi0yaDJ2MmgtMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
            
            <div className="relative z-10">
              <Baby className="w-12 h-12 mx-auto mb-6 opacity-90" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Begin Your Sacred Journey</h2>
              <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">
                Join mothers who have transformed their pregnancy experience with our holistic approach
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button 
                  size="lg"
                  onClick={() => handleEnroll('onetime')}
                  disabled={isLoading !== null}
                  className="bg-white text-rose-600 hover:bg-white/90 px-8 py-6 text-lg font-semibold"
                >
                  {isLoading === 'onetime' ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : null}
                  Full Program – €297
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  onClick={() => handleEnroll('monthly')}
                  disabled={isLoading !== null}
                  className="border-white/50 text-white hover:bg-white/10 px-8 py-6 text-lg"
                >
                  {isLoading === 'monthly' ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : null}
                  3 Payments of €97
                </Button>
              </div>
              
              <p className="text-sm opacity-75 mt-6">
                Includes all 3 trimester modules, live Zoom calls, audio practices & lifetime access
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 text-center text-muted-foreground text-sm">
        <p>Sacred Healing • Supporting mothers on their sacred journey</p>
      </footer>
    </div>
  );
};

export default PregnancyProgram;
