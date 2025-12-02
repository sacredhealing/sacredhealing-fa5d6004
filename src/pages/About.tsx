import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sparkles, Heart, Music, Star, ArrowRight } from 'lucide-react';
import lailaSmile from '@/assets/laila-smile.jpg';
import adamDrum from '@/assets/adam-drum.jpg';
import lailaAdamPink from '@/assets/laila-adam-pink.jpg';
import lailaYogaBeach from '@/assets/laila-yoga-beach.jpg';

const About: React.FC = () => {
  const values = [
    {
      icon: Heart,
      title: 'Sacred Healing',
      description: 'We believe in the power of divine energy to heal and transform.'
    },
    {
      icon: Music,
      title: 'Vibrational Medicine',
      description: 'Sound and frequency are gateways to higher consciousness.'
    },
    {
      icon: Star,
      title: 'Authentic Guidance',
      description: 'We walk the path ourselves and share from lived experience.'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple/10 via-transparent to-transparent" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <Sparkles className="w-12 h-12 text-gold mx-auto mb-6" />
            <h1 className="text-4xl md:text-6xl font-heading font-bold text-foreground mb-6">
              About <span className="text-gold">Sacred Healing</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Two souls united in the sacred mission of healing, awakening, and guiding others 
              toward their highest potential.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 bg-muted/20">
        <div className="container mx-auto px-4">
          <Card className="bg-gradient-to-r from-purple/10 via-gold/10 to-turquoise/10 border-none p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-4xl font-heading font-bold text-foreground mb-6">
              Our Sacred Mission
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              Our mission is to guide people toward <span className="text-gold font-semibold">holistic well-being, 
              inner clarity, and spiritual awakening</span> through sacred healing practices, sound, and meditation. 
              We envision a world where every individual can access their own power, align with their true purpose, 
              and live a life of balance, peace, and joy.
            </p>
          </Card>
        </div>
      </section>

      {/* Laila Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
                Laila Amrouche
              </h2>
              <p className="text-gold font-medium text-lg mb-6">Spiritual Guide, Yogi & Sound Healer</p>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Laila is a spiritual guide, yogi, and sound healer who channels divine energy through 
                  meditation, mantra, and transformational breathwork. Her journey began through deep 
                  personal transformation, leading her to dedicate her life to helping others awaken.
                </p>
                <p>
                  She empowers individuals to awaken their intuition, open their hearts, and master the mind. 
                  Through her gentle yet powerful presence, she creates a safe space for profound healing 
                  and spiritual growth.
                </p>
                <p>
                  Her teachings blend ancient yogic wisdom with modern understanding, making spiritual 
                  practices accessible to everyone regardless of their background or experience.
                </p>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <Card className="bg-card/50 backdrop-blur border-border/50 overflow-hidden">
                <img 
                  src={lailaSmile} 
                  alt="Laila Amrouche - Spiritual Guide"
                  className="w-full aspect-[4/5] object-cover object-top"
                />
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Adam Section */}
      <section className="py-20 bg-muted/10">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Card className="bg-card/50 backdrop-blur border-border/50 overflow-hidden">
                <img 
                  src={adamDrum} 
                  alt="Adam - Energy Practitioner"
                  className="w-full aspect-[4/5] object-cover object-center"
                />
              </Card>
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
                Adam
              </h2>
              <p className="text-gold font-medium text-lg mb-6">Energy Practitioner & Sacred Guide</p>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Adam is a grounding presence and energy practitioner who supports the healing process 
                  through vibrational medicine, meditation, and sacred guidance. With over 23 years of 
                  experience in music production, he brings a unique understanding of frequency and sound healing.
                </p>
                <p>
                  His work helps individuals realign with their life purpose and inner wisdom. He creates 
                  custom healing music in 432Hz frequencies, channeling divine energy into every composition.
                </p>
                <p>
                  Adam's approach combines practical wisdom with deep spiritual insight, helping seekers 
                  ground their spiritual experiences into everyday transformation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Together Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
              Together in Sacred Service
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              When Laila and Adam's paths merged, they discovered their combined energy creates 
              a powerful field for transformation.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 items-center max-w-5xl mx-auto">
            <Card className="bg-card/50 backdrop-blur border-border/50 overflow-hidden">
              <img 
                src={lailaAdamPink} 
                alt="Laila and Adam together"
                className="w-full aspect-[4/3] object-cover object-top"
              />
            </Card>
            <div className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                Together, they have guided thousands of seekers through healing sessions, courses, 
                and transformational programs. Their complementary energies—Laila's nurturing intuition 
                and Adam's grounding wisdom—create a balanced space where profound shifts occur naturally.
              </p>
              <blockquote className="border-l-4 border-gold pl-4 py-2 italic text-foreground">
                "Together, we create a sacred space where miracles happen and souls remember their divine nature."
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-gradient-to-b from-muted/20 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
              Our Core Values
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {values.map((value, index) => (
              <Card key={index} className="bg-card/50 backdrop-blur border-border/50 p-6 text-center">
                <value.icon className="w-12 h-12 text-gold mx-auto mb-4" />
                <h3 className="text-xl font-heading font-bold text-foreground mb-2">{value.title}</h3>
                <p className="text-muted-foreground text-sm">{value.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
              Moments of Sacred Practice
            </h2>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <Card className="bg-card/50 backdrop-blur border-border/50 overflow-hidden">
              <img 
                src={lailaYogaBeach} 
                alt="Laila practicing yoga on the beach"
                className="w-full aspect-video object-cover"
              />
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple/20 via-gold/20 to-turquoise/20">
        <div className="container mx-auto px-4 text-center">
          <Sparkles className="w-10 h-10 text-gold mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
            Begin Your Journey With Us
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
            Whether you're seeking healing, spiritual growth, or deeper self-understanding, 
            we're here to guide you every step of the way.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/private-sessions">
              <Button size="lg" className="bg-gold hover:bg-gold/90 text-background font-semibold px-8">
                Book a Session
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline" className="border-foreground text-foreground hover:bg-foreground/10">
                Join Free Today
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
