import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Play, Clock, Sparkles, Leaf, Moon, Sun, Heart, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CustomMeditationBooking from '@/components/meditation/CustomMeditationBooking';
import CustomMeditationCreation from '@/components/meditation/CustomMeditationCreation';
import WealthMeditationService from '@/components/meditation/WealthMeditationService';
import MeditationMembershipBanner from '@/components/meditation/MeditationMembershipBanner';
import { toast } from 'sonner';

const meditations = [
  { id: 1, title: 'Morning Awakening', duration: '10 min', category: 'morning', reward: 5, premium: false },
  { id: 2, title: 'Deep Sleep Journey', duration: '25 min', category: 'sleep', reward: 8, premium: false },
  { id: 3, title: 'Heart Chakra Healing', duration: '15 min', category: 'healing', reward: 5, premium: true },
  { id: 4, title: 'Focus & Clarity', duration: '12 min', category: 'focus', reward: 5, premium: false },
  { id: 5, title: 'Forest Bathing', duration: '20 min', category: 'nature', reward: 8, premium: false },
  { id: 6, title: 'Anxiety Release', duration: '18 min', category: 'healing', reward: 5, premium: true },
  { id: 7, title: 'Sunrise Gratitude', duration: '8 min', category: 'morning', reward: 3, premium: false },
  { id: 8, title: 'Third Eye Activation', duration: '30 min', category: 'focus', reward: 10, premium: true },
];

const Meditations: React.FC = () => {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchParams] = useSearchParams();

  const categories = [
    { id: 'all', label: t('meditations.categories.all', 'All'), icon: Sparkles },
    { id: 'morning', label: t('meditations.categories.morning', 'Morning'), icon: Sun },
    { id: 'sleep', label: t('meditations.categories.sleep', 'Sleep'), icon: Moon },
    { id: 'healing', label: t('meditations.categories.healing', 'Healing'), icon: Heart },
    { id: 'focus', label: t('meditations.categories.focus', 'Focus'), icon: Brain },
    { id: 'nature', label: t('meditations.categories.nature', 'Nature'), icon: Leaf },
  ];

  const filteredMeditations = activeCategory === 'all' 
    ? meditations 
    : meditations.filter(m => m.category === activeCategory);

  // Handle payment success/cancel
  useEffect(() => {
    const success = searchParams.get('success');
    const wealthSuccess = searchParams.get('wealth_success');
    const cancelled = searchParams.get('cancelled');
    const membershipSuccess = searchParams.get('membership_success');
    const membershipCancelled = searchParams.get('membership_cancelled');
    
    if (success === 'true') {
      toast.success(t('meditations.paymentSuccess', 'Payment successful! Adam will begin channeling your meditation.'));
    } else if (wealthSuccess === 'true') {
      toast.success(t('meditations.wealthSuccess', 'Payment successful! Check your email for the 108 affirmations.'));
    } else if (membershipSuccess) {
      toast.success(t('meditations.membershipSuccess', 'Welcome to Meditation Membership! Your subscription is now active.'));
    } else if (cancelled === 'true' || membershipCancelled === 'true') {
      toast.info(t('meditations.paymentCancelled', 'Payment was cancelled'));
    }
  }, [searchParams, t]);

  return (
    <div className="min-h-screen px-4 pt-6">
      {/* Header */}
      <header className="mb-6 animate-fade-in">
        <h1 className="text-3xl font-heading font-bold text-foreground">{t('meditations.title', 'Meditations')}</h1>
        <p className="text-muted-foreground mt-1">{t('meditations.subtitle', 'Find your inner peace')}</p>
      </header>

      {/* Meditation Membership */}
      <MeditationMembershipBanner />

      {/* 108 Wealth Reprogramming Meditation */}
      <div className="mb-8">
        <WealthMeditationService />
      </div>

      {/* Custom Channeled Meditation Booking */}
      <div className="mb-8">
        <CustomMeditationBooking />
      </div>

      {/* Custom Meditation Creation for Creators */}
      <div className="mb-8">
        <CustomMeditationCreation />
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide animate-slide-up">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all duration-300 ${
              activeCategory === cat.id
                ? 'bg-primary text-primary-foreground glow-purple'
                : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
            }`}
          >
            <cat.icon size={16} />
            <span className="text-sm font-medium">{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Meditation List */}
      <div className="space-y-4">
        {filteredMeditations.map((meditation, index) => (
          <div
            key={meditation.id}
            className="relative overflow-hidden rounded-2xl bg-gradient-card border border-border/50 p-5 animate-slide-up hover:scale-[1.02] transition-transform duration-300"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            {meditation.premium && (
              <div className="absolute top-3 right-3 px-2 py-1 bg-accent/20 rounded-full">
                <span className="text-xs font-medium text-accent">{t('meditations.premium', 'Premium')}</span>
              </div>
            )}
            
            <div className="flex items-center gap-4">
              <button className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center glow-purple hover:scale-110 transition-transform">
                <Play size={24} className="text-primary ml-1" />
              </button>
              
              <div className="flex-1">
                <h3 className="font-heading font-semibold text-foreground">{meditation.title}</h3>
                <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock size={14} />
                    {meditation.duration}
                  </span>
                  <span className="flex items-center gap-1">
                    <Sparkles size={14} className="text-accent" />
                    +{meditation.reward} SHC
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Featured */}
      <div className="mt-8 mb-8 animate-slide-up" style={{ animationDelay: '0.4s' }}>
        <h2 className="text-lg font-heading font-semibold text-foreground mb-4">{t('meditations.featuredSeries', 'Featured Series')}</h2>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-healing p-6 glow-turquoise">
          <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-accent/30 rounded-full blur-2xl" />
          <h3 className="text-xl font-heading font-bold text-foreground mb-2">
            {t('meditations.healingJourney', '21-Day Healing Journey')}
          </h3>
          <p className="text-foreground/80 text-sm mb-4">
            {t('meditations.healingJourneyDesc', 'Transform your life with daily guided meditations')}
          </p>
          <div className="flex items-center gap-3">
            <Button variant="glass" size="sm">
              <Play size={16} />
              {t('meditations.startJourney', 'Start Journey')}
            </Button>
            <span className="text-sm text-foreground/70">
              <Sparkles size={14} className="inline text-accent mr-1" />
              +200 SHC
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Meditations;