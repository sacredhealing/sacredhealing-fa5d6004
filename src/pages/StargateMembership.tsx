import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Star, Calendar, Heart, Users, MessageCircle, Sparkles, Check, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const StargateMembership = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);

  const [telegramLink, setTelegramLink] = useState<string | null>(null);

  useEffect(() => {
    const handleSuccess = async () => {
      if (searchParams.get('success') === 'true' && user) {
        toast.success('Välkommen till Stargate Membership!');
        
        // Get Telegram invite link
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const { data, error } = await supabase.functions.invoke('send-telegram-invite', {
            headers: {
              Authorization: `Bearer ${session?.access_token}`,
            },
          });
          
          if (!error && data?.invite_link) {
            setTelegramLink(data.invite_link);
            toast.success('Din Telegram-inbjudan är klar!');
          }
        } catch (err) {
          console.error('Error getting Telegram invite:', err);
        }
      }
    };

    handleSuccess();

    if (searchParams.get('canceled') === 'true') {
      toast.info('Betalningen avbröts.');
    }
  }, [searchParams, user]);

  const handleSubscribe = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('create-stargate-checkout', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      console.error('Error creating checkout:', error);
      toast.error('Kunde inte starta betalningen. Försök igen.');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: Star,
      title: "Mantrachanting (Måndagar)",
      description: "Helig ljudsession för att lugna sinnet, öppna hjärtat och höja frekvensen. Perfekt start på veckan."
    },
    {
      icon: Sparkles,
      title: "Healing Chamber (Tisdagar)",
      description: "Guidad meditationsupplevelse i ett högfrekvent healingfält som arbetar på nervsystem, chakran och blockeringar."
    },
    {
      icon: Heart,
      title: "Bhagavad Gita Class + Q&A",
      description: "Levande undervisning med yogiska perspektiv på livets frågor. Ställ frågor och få djup andlig vägledning."
    },
    {
      icon: MessageCircle,
      title: "Telegram-grupp",
      description: "Privat community med daglig inspiration, stöd mellan sessionerna och möjlighet att dela upplevelser."
    },
  ];

  const benefits = [
    "Leva i högre klarhet och hjärtenergi",
    "Släppa stress, oro och gamla mönster",
    "Stärka nervsystemet",
    "Utveckla intuition och andlig förståelse",
    "Få regelbunden healing och guidning",
    "Vara del av ett helande community"
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Telegram Invite Card */}
      {telegramLink && (
        <div className="px-4 py-6">
          <Card className="max-w-lg mx-auto p-6 bg-gradient-to-br from-green-500/20 to-teal-500/10 border-green-500/30 text-center">
            <MessageCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-foreground mb-2">
              Välkommen till Stargate! 🎉
            </h3>
            <p className="text-muted-foreground mb-4">
              Klicka nedan för att gå med i vår privata Telegram-grupp:
            </p>
            <Button 
              asChild
              className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white"
            >
              <a href={telegramLink} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="w-4 h-4 mr-2" />
                Gå med i Telegram-gruppen
                <ExternalLink className="w-4 h-4 ml-2" />
              </a>
            </Button>
          </Card>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-purple-900/40 via-background to-amber-900/20 px-4 py-12 text-center overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTMwIDBjMTYuNTY5IDAgMzAgMTMuNDMxIDMwIDMwIDAgMTYuNTY5LTEzLjQzMSAzMC0zMCAzMEMxMy40MzEgNjAgMCA0Ni41NjkgMCAzMCAwIDEzLjQzMSAxMy40MzEgMCAzMCAwem0wIDEwYy0xMS4wNDYgMC0yMCA4Ljk1NC0yMCAyMHM4Ljk1NCAyMCAyMCAyMCAyMC04Ljk1NCAyMC0yMC04Ljk1NC0yMC0yMC0yMHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-50"></div>
        
        <div className="relative z-10">
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 mb-4">
            Andligt Medlemskap
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            ✨ Stargate Membership ✨
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
            Ett andligt och helande medlemskap med regelbundna livesessioner, djup energihealing, 
            mantrachanting och vägledning i yogisk visdom.
          </p>
          
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="text-4xl font-bold text-foreground">$25</span>
            <span className="text-muted-foreground">/månad</span>
          </div>

          <Button 
            onClick={handleSubscribe}
            disabled={loading}
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-amber-500 hover:from-purple-700 hover:to-amber-600 text-white px-8"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Laddar...
              </>
            ) : (
              <>
                <Star className="w-4 h-4 mr-2" />
                Bli Medlem Nu
              </>
            )}
          </Button>
        </div>
      </div>

      {/* What's Included */}
      <div className="px-4 py-8">
        <h2 className="text-2xl font-bold text-foreground text-center mb-6">
          Vad som ingår
        </h2>
        
        <div className="grid gap-4 max-w-2xl mx-auto">
          {features.map((feature, index) => (
            <Card key={index} className="p-5 bg-gradient-to-br from-muted/50 to-background border-border">
              <div className="flex gap-4">
                <div className="p-3 rounded-xl bg-primary/10 h-fit">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Schedule */}
      <div className="px-4 py-8 bg-muted/30">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Calendar className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Hur ofta vi ses</h2>
          </div>
          
          <Card className="p-6 bg-background border-border">
            <p className="text-center text-muted-foreground mb-4">
              Vi möts <strong className="text-foreground">2 gånger per vecka</strong>, <strong className="text-foreground">3 veckor varje månad</strong>, live via Zoom:
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-500/10">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span className="text-foreground"><strong>Måndagar:</strong> Mantrachanting</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span className="text-foreground"><strong>Tisdagar:</strong> Healing Chamber eller Bhagavad Gita</span>
              </div>
            </div>
            
            <p className="text-center text-sm text-muted-foreground mt-4 italic">
              Den fjärde veckan är en integrationsvecka för vila, reflektion och integration av energin.
            </p>
          </Card>
        </div>
      </div>

      {/* Purpose */}
      <div className="px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Users className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Syftet med medlemskapet</h2>
          </div>
          
          <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-amber-500/10 border-border">
            <p className="text-center text-muted-foreground mb-4">
              Stargate är för dig som vill:
            </p>
            
            <ul className="space-y-3">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-foreground">{benefit}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      {/* How It Works */}
      <div className="px-4 py-8 bg-muted/30">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground text-center mb-6">
            Hur det fungerar
          </h2>
          
          <div className="grid gap-3">
            {[
              "Alla sessioner sker online via Zoom",
              "Du får länkar och tider direkt i appen",
              "Du kan delta hemifrån, slappna av och ta emot",
              "Du får både live-sessioner och community-stöd"
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-semibold">{index + 1}</span>
                </div>
                <span className="text-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="px-4 py-12">
        <Card className="max-w-2xl mx-auto p-8 bg-gradient-to-br from-purple-900/30 via-background to-amber-900/20 border-amber-500/30 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-3">
            Är du redo att transformera ditt liv?
          </h2>
          <p className="text-muted-foreground mb-6">
            Gå med i Stargate Membership idag och börja din resa mot klarhet, healing och andlig utveckling.
          </p>
          
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="text-3xl font-bold text-foreground">$25</span>
            <span className="text-muted-foreground">/månad</span>
          </div>
          
          <Button 
            onClick={handleSubscribe}
            disabled={loading}
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-amber-500 hover:from-purple-700 hover:to-amber-600 text-white px-8"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Laddar...
              </>
            ) : (
              <>
                <Star className="w-4 h-4 mr-2" />
                Starta Ditt Medlemskap
              </>
            )}
          </Button>
          
          <p className="text-xs text-muted-foreground mt-4">
            Du kan avsluta när som helst. Inga bindningstider.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default StargateMembership;
