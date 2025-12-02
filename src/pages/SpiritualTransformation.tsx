import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { 
  Heart, 
  Users, 
  Clock, 
  MapPin, 
  Sparkles, 
  Music, 
  Coffee,
  ArrowLeft
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const SpiritualTransformation = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-transformation-checkout", {
        body: { priceId: "price_1SZtRzAPsnbrivP0W0WL5UZR" },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast.error("Kunde inte starta betalning. Försök igen.");
    } finally {
      setIsLoading(false);
    }
  };

  const schedule = [
    { time: "10:00 - 12:00", activity: "Lär känna gruppenergin & vägledning av Adam & Laila" },
    { time: "12:00 - 13:00", activity: "Lunch" },
    { time: "13:00 - 13:45", activity: "OM Chanting" },
    { time: "13:45 - 14:00", activity: "Kort paus" },
    { time: "14:00 - 16:00", activity: "Andlig praktik tillsammans (meditation, mantra, yoga, dela upplevelser)" },
  ];

  const benefits = [
    { icon: Users, text: "Härlig gemenskap" },
    { icon: Heart, text: "Support på din resa" },
    { icon: Sparkles, text: "Healing" },
    { icon: Music, text: "Meditation & Mantra" },
    { icon: Coffee, text: "Andlig Praktik" },
    { icon: Heart, text: "Bli påfylld av kärlek och energi" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Header */}
      <div className="container mx-auto px-4 py-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Tillbaka
        </Button>
      </div>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-8 text-center">
        <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
          En Söndag i Månaden
        </Badge>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Andlig Transformation
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
          En hel dag med meditation, healing, OM Chanting och gemenskap med likasinnade
        </p>
        <div className="flex items-center justify-center gap-4 text-muted-foreground mb-8">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            <span>Uddevalla</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <span>10:00 - 16:00</span>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Description */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-2xl">Om Dagen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                Söker du gemenskap med andra som också är på den inre andliga resan? Önskar du vara 
                tillsammans med likasinnade i ett community som supportar dig? Där du kan vara öppen 
                och sårbar?
              </p>
              <p>
                Med oss kan du dela dina upplevelser, bli hållen och vägledd. Inre tankar och konflikter 
                som du brottas med eller funderar över är mer än välkommet att dela under dagen.
              </p>
              <p>
                Dagen leds av oss (Adam & Laila) som ser gruppens energi, och därefter skapas en röd 
                tråd om var vi hamnar i vår energi och vad för inre arbete som behövs göras, både 
                individuellt och som grupp.
              </p>
              <p>
                Med förmågan att se och känna in människors energi kan vi vägleda dig inåt till en 
                djupare plats inom dig, och ge vägledning på vägen så att du sedan kan se klarare 
                och navigera lättare fram på din stig.
              </p>
              <p className="font-medium text-foreground">
                Oavsett tro, om du är erfaren eller oerfaren inom andlighet spelar ingen roll - 
                detta är för alla som har en önskan om att gå djupare i sig själv eller är nyfiken 
                på det andliga.
              </p>
            </CardContent>
          </Card>

          {/* Benefits & Schedule */}
          <div className="space-y-6">
            {/* Benefits */}
            <Card className="border-accent/20">
              <CardHeader>
                <CardTitle className="text-2xl">Vad du kan förvänta dig</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <benefit.icon className="w-5 h-5 text-primary" />
                      </div>
                      <span className="text-sm">{benefit.text}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Schedule */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-2xl">Schema</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {schedule.map((item, index) => (
                    <div key={index} className="flex gap-4 pb-3 border-b border-border/50 last:border-0 last:pb-0">
                      <span className="text-primary font-medium whitespace-nowrap">{item.time}</span>
                      <span className="text-muted-foreground">{item.activity}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* OM Chanting Section */}
      <section className="container mx-auto px-4 py-8">
        <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">OM Chanting</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Varje gång kommer vi även att ha OM Chanting, vilket är en fantastisk healingteknik 
              där vi chantar/sjunger Mantrat OM i 45 minuter tillsammans. Adam & Laila har djup 
              erfarenhet inom Yoga, Musik, Healing och Andlig Vägledning som vi kommer dela med 
              oss av under dagen.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Pricing & CTA */}
      <section className="container mx-auto px-4 py-12">
        <Card className="max-w-md mx-auto border-2 border-primary/30 bg-gradient-to-b from-background to-primary/5">
          <CardContent className="p-8 text-center">
            <h2 className="text-3xl font-bold mb-2">500 kr</h2>
            <p className="text-muted-foreground mb-6">per dag</p>
            
            <Button 
              size="lg" 
              className="w-full mb-4"
              onClick={handleCheckout}
              disabled={isLoading}
            >
              {isLoading ? "Laddar..." : "Boka din plats"}
            </Button>
            
            <p className="text-sm text-muted-foreground">
              Swish: 0729071385
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default SpiritualTransformation;
