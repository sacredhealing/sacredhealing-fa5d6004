import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Leaf, Moon, Sun, Crown, MessageCircle, Mic, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DoshaQuiz } from './DoshaQuiz';
import { DoshaDashboard } from './DoshaDashboard';
import { AyurvedaChatConsultation } from './AyurvedaChatConsultation';
import { AyurvedaLiveDoctor } from './AyurvedaLiveDoctor';
import { useAyurvedaAnalysis } from '@/hooks/useAyurvedaAnalysis';
import type { AyurvedaUserProfile, AyurvedaMembershipLevel } from '@/lib/ayurvedaTypes';
import { useTranslation } from 'react-i18next';

interface AyurvedaToolProps {
  membershipLevel?: AyurvedaMembershipLevel;
  isAdmin?: boolean;
}

const MembershipCard = ({ 
  level, 
  current, 
  features,
  onSelect 
}: { 
  level: AyurvedaMembershipLevel; 
  current: AyurvedaMembershipLevel;
  features: string[];
  onSelect: (level: AyurvedaMembershipLevel) => void;
}) => {
  const isActive = level === current;
  const isPremium = level === 'PREMIUM';
  const isLifetime = level === 'LIFETIME';

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`relative p-6 rounded-3xl border-2 transition-all cursor-pointer ${
        isActive 
          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' 
          : 'border-border bg-card hover:border-emerald-300'
      }`}
      onClick={() => onSelect(level)}
    >
      {isPremium && (
        <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-500 text-white">
          Most Popular
        </Badge>
      )}
      
      <div className="text-center mb-4">
        <div className={`w-12 h-12 mx-auto mb-3 rounded-2xl flex items-center justify-center ${
          isLifetime ? 'bg-amber-100 text-amber-600' : isPremium ? 'bg-emerald-100 text-emerald-600' : 'bg-muted text-muted-foreground'
        }`}>
          {isLifetime ? <Crown className="w-6 h-6" /> : isPremium ? <Sparkles className="w-6 h-6" /> : <Leaf className="w-6 h-6" />}
        </div>
        <h3 className="text-lg font-bold text-foreground">{level}</h3>
      </div>
      
      <ul className="space-y-2 text-sm text-muted-foreground">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="text-emerald-500">✓</span> {feature}
          </li>
        ))}
      </ul>
    </motion.div>
  );
};

export const AyurvedaTool: React.FC<AyurvedaToolProps> = ({ 
  membershipLevel = 'FREE' as AyurvedaMembershipLevel,
  isAdmin = false
}) => {
  const { t } = useTranslation();
  // Admins always get LIFETIME access
  const effectiveMembership = isAdmin ? 'LIFETIME' as AyurvedaMembershipLevel : membershipLevel;
  const [membership, setMembership] = useState<AyurvedaMembershipLevel>(effectiveMembership);
  const [activeTab, setActiveTab] = useState<'home' | 'assessment' | 'doctor' | 'chat'>('home');

  // Update membership when props change (e.g., when isAdmin loads)
  React.useEffect(() => {
    const newMembership = isAdmin ? 'LIFETIME' as AyurvedaMembershipLevel : membershipLevel;
    setMembership(newMembership);
  }, [isAdmin, membershipLevel]);
  
  const { 
    doshaProfile, 
    userProfile,
    dailyGuidance, 
    isLoading, 
    isLoadingGuidance,
    isLoadingSaved,
    analyzeDosha, 
    getDailyGuidance,
    reset 
  } = useAyurvedaAnalysis();

  const handleAssessmentComplete = async (profile: AyurvedaUserProfile) => {
    await analyzeDosha(profile);
    setActiveTab('home');
  };

  const handleFetchGuidance = useCallback(() => {
    if (userProfile) {
      getDailyGuidance(userProfile);
    }
  }, [userProfile, getDailyGuidance]);

  const handleRestart = async () => {
    await reset();
    setActiveTab('home');
  };

  // Show loading while checking for saved profile
  if (isLoadingSaved) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
        <p className="mt-4 text-muted-foreground">{t('common.loading', 'Loading...')}</p>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        if (!doshaProfile) {
          return (
            <div className="flex flex-col items-center justify-center text-center px-4 py-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-700 dark:text-emerald-400 mb-8 shadow-inner"
              >
                <Sparkles className="w-10 h-10" />
              </motion.div>
              <h1 className="text-4xl md:text-5xl font-serif text-foreground mb-6">{t('ayurveda.subtitle', 'Your Sacred Journey Awaits')}</h1>
              <p className="text-lg text-muted-foreground mb-10 max-w-2xl leading-relaxed">
                {t('ayurveda.title', 'Experience a digital transformation through ancient wisdom. Our AI-driven Ayurvedic system matches your unique personality and life situation to a personalized healing path.')}
              </p>
              <Button 
                onClick={() => setActiveTab('assessment')}
                size="lg"
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-6 px-12 rounded-2xl text-lg"
              >
                {t('ayurveda.assessment', 'Reveal Your Prakriti')} <Sparkles className="ml-2 w-5 h-5" />
              </Button>
              
              {/* Only show membership selection if not admin (admins have full access) */}
              {!isAdmin && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 w-full max-w-4xl">
                  <MembershipCard 
                    level={'FREE' as AyurvedaMembershipLevel}
                    current={membership} 
                    onSelect={setMembership}
                    features={[t('ayurveda.freeDesc', 'Basic Dosha Analysis'), t('common.free', 'General Daily Routine'), "Aura of Wellness"]}
                  />
                  <MembershipCard 
                    level={'PREMIUM' as AyurvedaMembershipLevel}
                    current={membership} 
                    onSelect={setMembership}
                    features={[t('ayurveda.premiumDesc', 'Personality Matching'), "Life Situation Advice", t('ayurveda.aiDoctor', 'AI Chat Consultations')]}
                  />
                  <MembershipCard 
                    level={'LIFETIME' as AyurvedaMembershipLevel}
                    current={membership} 
                    onSelect={setMembership}
                    features={[t('ayurveda.aiDoctor', 'Live Audio AI Doctor'), "Deep Vedic Astrology Sync", t('ayurveda.lifetimeDesc', 'Priority Healing Access')]}
                  />
                </div>
              )}
              
              {isAdmin && (
                <div className="mt-10 p-4 rounded-2xl bg-amber-100 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 text-center">
                  <Crown className="w-8 h-8 text-amber-600 dark:text-amber-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    Admin Access: Full Lifetime features unlocked
                  </p>
                </div>
              )}
            </div>
          );
        }
        return (
          <DoshaDashboard 
            profile={userProfile!} 
            dosha={doshaProfile} 
            dailyGuidance={dailyGuidance}
            isLoadingGuidance={isLoadingGuidance}
            onRestart={handleRestart}
            onFetchGuidance={handleFetchGuidance}
            isPremium={membership !== 'FREE'}
          />
        );

      case 'assessment':
        return <DoshaQuiz onComplete={handleAssessmentComplete} isLoading={isLoading} />;

      case 'chat':
        if (membership === 'FREE') {
          return (
            <Card className="max-w-2xl mx-auto border-2 border-amber-200">
              <CardContent className="p-16 text-center">
                <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 mb-6 mx-auto">
                  <MessageCircle className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-serif text-foreground mb-4">Premium Access Required</h2>
                <p className="text-muted-foreground mb-8 leading-relaxed">
                  The AI Chat Doctor is available to our Premium and Lifetime members for deep, conversational guidance.
                </p>
                <Button onClick={() => setActiveTab('home')} className="bg-emerald-700 hover:bg-emerald-800">
                  Explore Plans
                </Button>
              </CardContent>
            </Card>
          );
        }
        return (
          <AyurvedaChatConsultation profile={userProfile} dosha={doshaProfile} />
        );

      case 'doctor':
        if (membership !== 'LIFETIME') {
          return (
            <Card className="max-w-2xl mx-auto border-2 border-amber-200">
              <CardContent className="p-16 text-center">
                <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 mb-6 mx-auto">
                  <Crown className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-serif text-foreground mb-4">Lifetime Sanctuary</h2>
                <p className="text-muted-foreground mb-8 leading-relaxed">
                  Speak directly with our most advanced AI. Real-time audio healing sessions are exclusive to our Lifetime members.
                </p>
                <Button onClick={() => setActiveTab('home')} className="bg-emerald-700 hover:bg-emerald-800">
                  View Membership
                </Button>
              </CardContent>
            </Card>
          );
        }
        return (
          <AyurvedaLiveDoctor profile={userProfile} dosha={doshaProfile} />
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full">
      {/* Navigation */}
      {doshaProfile && (
        <div className="flex justify-center gap-2 mb-8">
          <Button 
            variant={activeTab === 'home' ? 'default' : 'outline'}
            onClick={() => setActiveTab('home')}
            className="rounded-full"
          >
            <Leaf className="w-4 h-4 mr-2" /> Dashboard
          </Button>
          <Button 
            variant={activeTab === 'chat' ? 'default' : 'outline'}
            onClick={() => setActiveTab('chat')}
            className="rounded-full"
          >
            <MessageCircle className="w-4 h-4 mr-2" /> Chat Doctor
          </Button>
          <Button 
            variant={activeTab === 'doctor' ? 'default' : 'outline'}
            onClick={() => setActiveTab('doctor')}
            className="rounded-full"
          >
            <Mic className="w-4 h-4 mr-2" /> Live Doctor
          </Button>
        </div>
      )}
      
      {renderContent()}
      
      {/* Footer */}
      <div className="mt-12 text-center py-6 border-t border-border">
        <div className="flex justify-center gap-6 mb-3 text-muted-foreground/30">
          <Leaf className="w-4 h-4" />
          <Moon className="w-4 h-4" />
          <Sun className="w-4 h-4" />
        </div>
        <p className="font-serif italic text-sm text-muted-foreground mb-1">
          "Health is wealth, peace of mind is happiness, Yoga shows the way."
        </p>
        <p className="text-xs text-muted-foreground/50">Sacred Healing Ayurveda • Powered by AI</p>
      </div>
    </div>
  );
};