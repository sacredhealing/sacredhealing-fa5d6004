import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Heart, 
  Music, 
  BookOpen, 
  Users, 
  Star, 
  Sparkles,
  ArrowRight,
  Play,
  Shield,
  Zap
} from 'lucide-react';
import heroImage from '@/assets/hero-together.jpg';
import lailaSmile from '@/assets/laila-smile.jpg';
import adamDrum from '@/assets/adam-drum.jpg';
import lailaAdamPink from '@/assets/laila-adam-pink.jpg';

const Home: React.FC = () => {
  const services = [
    {
      icon: Heart,
      title: 'Healing Sessions',
      description: 'Experience profound energy healing and chakra balancing for deep transformation.',
      link: '/healing'
    },
    {
      icon: Music,
      title: 'Sacred Music',
      description: 'Immerse yourself in 432Hz healing frequencies and custom meditation soundtracks.',
      link: '/music'
    },
    {
      icon: BookOpen,
      title: 'Spiritual Courses',
      description: 'Learn ancient wisdom and modern practices through our comprehensive programs.',
      link: '/courses'
    },
    {
      icon: Users,
      title: 'Community',
      description: 'Connect with like-minded souls on the path of spiritual awakening.',
      link: '/community'
    }
  ];

  const testimonials = [
    {
      name: 'Anna S.',
      text: "Laila and Adam's sessions have completely transformed my energy. I feel lighter, clearer, and more connected to myself.",
      rating: 5
    },
    {
      name: 'Johan M.',
      text: "The Soulwave Activation helped me release years of limiting beliefs. I now feel empowered to follow my dreams.",
      rating: 5
    },
    {
      name: 'Maria L.',
      text: "Their teachings are gentle yet profound. I've experienced real healing and a deeper connection to my intuition.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
        
        <div className="relative z-10 container mx-auto px-4 text-center py-20">
          <div className="animate-fade-in">
            <Sparkles className="w-12 h-12 text-gold mx-auto mb-6" />
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold text-foreground mb-6 leading-tight">
              Awaken Your Energy.
              <span className="block text-gold mt-2">Heal Your Mind.</span>
              <span className="block text-turquoise mt-2">Transform Your Life.</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Join Laila & Adam on a journey of sacred healing, meditation, and vibrational transformation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" className="bg-gold hover:bg-gold/90 text-background font-semibold px-8">
                  Begin Your Journey
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="/spiritual-education">
                <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/10">
                  <Play className="mr-2 w-5 h-5" />
                  Explore Free Content
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-muted-foreground rounded-full flex justify-center">
            <div className="w-1 h-3 bg-muted-foreground rounded-full mt-2 animate-pulse" />
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section className="py-20 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-heading font-bold text-foreground mb-4">
              Meet Your Guides
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Two souls united in the sacred mission of healing and awakening
            </p>
          </div>

          {/* Mission Statement */}
          <Card className="bg-gradient-to-r from-purple/10 via-gold/10 to-turquoise/10 border-none p-8 md:p-12 mb-16 text-center">
            <h3 className="text-2xl md:text-3xl font-heading text-foreground mb-4">Our Sacred Mission</h3>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Our mission is to guide people toward <span className="text-gold font-semibold">holistic well-being, inner clarity, and spiritual awakening</span> through 
              sacred healing practices, sound, and meditation. We envision a world where every individual can access 
              their own power, align with their true purpose, and live a life of balance, peace, and joy.
            </p>
          </Card>

          {/* Laila & Adam Bios */}
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {/* Laila */}
            <Card className="bg-card/50 backdrop-blur border-border/50 overflow-hidden group">
              <div className="aspect-[4/5] overflow-hidden">
                <img 
                  src={lailaSmile} 
                  alt="Laila Amrouche - Spiritual Guide"
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6 md:p-8">
                <h3 className="text-2xl font-heading font-bold text-foreground mb-2">Laila Amrouche</h3>
                <p className="text-gold font-medium mb-4">Spiritual Guide, Yogi & Sound Healer</p>
                <p className="text-muted-foreground leading-relaxed">
                  Laila is a spiritual guide, yogi, and sound healer who channels divine energy through meditation, 
                  mantra, and transformational breathwork. She empowers individuals to awaken their intuition, 
                  open their hearts, and master the mind.
                </p>
              </div>
            </Card>

            {/* Adam */}
            <Card className="bg-card/50 backdrop-blur border-border/50 overflow-hidden group">
              <div className="aspect-[4/5] overflow-hidden">
                <img 
                  src={adamDrum} 
                  alt="Adam - Energy Practitioner"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6 md:p-8">
                <h3 className="text-2xl font-heading font-bold text-foreground mb-2">Adam</h3>
                <p className="text-gold font-medium mb-4">Energy Practitioner & Sacred Guide</p>
                <p className="text-muted-foreground leading-relaxed">
                  Adam is a grounding presence and energy practitioner who supports the healing process through 
                  vibrational medicine, meditation, and sacred guidance. His work helps individuals realign with 
                  their life purpose and inner wisdom.
                </p>
              </div>
            </Card>
          </div>

          {/* Together Image */}
          <div className="mt-16 text-center">
            <Card className="bg-card/50 backdrop-blur border-border/50 overflow-hidden inline-block max-w-2xl mx-auto">
              <img 
                src={lailaAdamPink} 
                alt="Laila and Adam together"
                className="w-full aspect-[4/3] object-cover object-top"
              />
              <div className="p-6">
                <p className="text-muted-foreground italic">
                  "Together, we create a sacred space where miracles happen and souls remember their divine nature."
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-heading font-bold text-foreground mb-4">
              What We Offer
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Comprehensive tools and guidance for your spiritual journey
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => (
              <Link key={index} to={service.link}>
                <Card className="bg-card/50 backdrop-blur border-border/50 p-6 h-full hover:bg-card/80 hover:border-gold/50 transition-all duration-300 group">
                  <service.icon className="w-12 h-12 text-gold mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="text-xl font-heading font-bold text-foreground mb-2">{service.title}</h3>
                  <p className="text-muted-foreground text-sm">{service.description}</p>
                </Card>
              </Link>
            ))}
          </div>

          {/* Featured offerings */}
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <Link to="/stargate" className="block">
              <Card className="bg-gradient-to-br from-purple/20 to-purple/5 border-purple/30 p-6 hover:border-purple/50 transition-all h-full">
                <Shield className="w-10 h-10 text-purple mb-3" />
                <h4 className="font-heading font-bold text-foreground mb-2">Stargate Membership</h4>
                <p className="text-sm text-muted-foreground">Weekly live sessions, Telegram community, and spiritual support for €25/month</p>
              </Card>
            </Link>
            <Link to="/certification" className="block">
              <Card className="bg-gradient-to-br from-gold/20 to-gold/5 border-gold/30 p-6 hover:border-gold/50 transition-all h-full">
                <Star className="w-10 h-10 text-gold mb-3" />
                <h4 className="font-heading font-bold text-foreground mb-2">Practitioner Certification</h4>
                <p className="text-sm text-muted-foreground">Become a certified Sacred Healing Vibration Practitioner in 12 months</p>
              </Card>
            </Link>
            <Link to="/transformation" className="block">
              <Card className="bg-gradient-to-br from-turquoise/20 to-turquoise/5 border-turquoise/30 p-6 hover:border-turquoise/50 transition-all h-full">
                <Zap className="w-10 h-10 text-turquoise mb-3" />
                <h4 className="font-heading font-bold text-foreground mb-2">6-Month Transformation</h4>
                <p className="text-sm text-muted-foreground">Deep personal transformation with private coaching and daily support</p>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-heading font-bold text-foreground mb-4">
              Voices of Transformation
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Real stories from our sacred community
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-card/50 backdrop-blur border-border/50 p-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-gold text-gold" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4 italic">"{testimonial.text}"</p>
                <p className="font-heading font-bold text-foreground">{testimonial.name}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple/20 via-gold/20 to-turquoise/20">
        <div className="container mx-auto px-4 text-center">
          <Sparkles className="w-10 h-10 text-gold mx-auto mb-6" />
          <h2 className="text-3xl md:text-5xl font-heading font-bold text-foreground mb-4">
            Ready to Transform?
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
            Join thousands of seekers who have discovered their sacred gifts and stepped into their power.
            Your journey begins with a single step.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="bg-gold hover:bg-gold/90 text-background font-semibold px-8">
                Start Free Today
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link to="/private-sessions">
              <Button size="lg" variant="outline" className="border-foreground text-foreground hover:bg-foreground/10">
                Book a Session
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-muted/30 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <h3 className="font-heading font-bold text-xl text-foreground">Sacred Healing Vibration</h3>
              <p className="text-muted-foreground text-sm">Awakening sacred gifts worldwide</p>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link to="/auth" className="hover:text-foreground transition-colors">Get Started</Link>
              <Link to="/spiritual-education" className="hover:text-foreground transition-colors">Free Content</Link>
              <Link to="/private-sessions" className="hover:text-foreground transition-colors">Sessions</Link>
              <Link to="/community" className="hover:text-foreground transition-colors">Community</Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border/30 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Sacred Healing Vibration. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
