import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Leaf, Moon, Sun, Crown, Mic, Loader2, Stethoscope } from 'lucide-react';
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
  level, current, features, onSelect 
}: { 
  level: AyurvedaMembershipLevel; current: AyurvedaMembershipLevel;
  features: string[]; onSelect: (level: AyurvedaMembershipLevel) => void;
}) => {
  const isActive = level === current;
  const isPremium = level === 'PREMIUM';
  const isLifetime = level === 'LIFETIME';

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="relative p-6 rounded-3xl cursor-pointer transition-all"
      style={{
        background: isActive 
          ? 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(79,70,229,0.1))' 
          : 'rgba(255,255,255,0.02)',
        border: `1px solid ${isActive ? 'rgba(168,85,247,0.4)' : 'rgba(255,255,255,0.06)'}`,
      }}
      onClick={() => onSelect(level)}
    >
      {isPremium && (
        <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[10px]">
          Most Popular
        </Badge>
      )}
      
      <div className="text-center mb-4">
        <div className={`w-12 h-12 mx-auto mb-3 rounded-2xl flex items-center justify-center ${
          isLifetime ? 'bg-amber-500/10 text-amber-400' : isPremium ? 'bg-purple-500/10 text-purple-400' : 'bg-white/5 text-purple-300/50'
        }`}>
          {isLifetime ? <Crown className="w-6 h-6" /> : isPremium ? <Sparkles className="w-6 h-6" /> : <Leaf className="w-6 h-6" />}
        </div>
        <h3 className="text-lg font-bold text-white">{level}</h3>
      </div>
      
      <ul className="space-y-2 text-sm text-purple-300/60">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="text-purple-400">✓</span> {feature}
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
  const effectiveMembership = isAdmin ? 'LIFETIME' as AyurvedaMembershipLevel : membershipLevel;
  const [membership, setMembership] = useState<AyurvedaMembershipLevel>(effectiveMembership);
  const [activeTab, setActiveTab] = useState<'home' | 'assessment' | 'doctor' | 'chat'>('home');
  const [showChat, setShowChat] = useState(false);

  React.useEffect(() => {
    const newMembership = isAdmin ? 'LIFETIME' as AyurvedaMembershipLevel : membershipLevel;
    setMembership(newMembership);
  }, [isAdmin, membershipLevel]);
  
  const { 
    doshaProfile, userProfile, dailyGuidance, isLoading, isLoadingGuidance,
    isLoadingSaved, analyzeDosha, getDailyGuidance, reset 
  } = useAyurvedaAnalysis();

  const handleAssessmentComplete = async (profile: AyurvedaUserProfile) => {
    await analyzeDosha(profile);
    setActiveTab('home');
  };

  const handleFetchGuidance = useCallback(() => {
    if (userProfile) getDailyGuidance(userProfile);
  }, [userProfile, getDailyGuidance]);

  const handleRestart = async () => {
    await reset();
    setActiveTab('home');
  };

  if (isLoadingSaved) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
        <p className="mt-4 text-purple-300/50">{t('common.loading', 'Loading...')}</p>
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
                className="w-24 h-24 rounded-full flex items-center justify-center mb-8"
                style={{
                  background: 'radial-gradient(circle, rgba(168,85,247,0.2), rgba(79,70,229,0.1))',
                  boxShadow: '0 0 40px rgba(168,85,247,0.15)',
                  border: '1px solid rgba(168,85,247,0.2)',
                }}
              >
                <Sparkles className="w-10 h-10 text-purple-400" />
              </motion.div>
              <h1 className="text-4xl md:text-5xl font-serif text-white mb-6">{t('ayurveda.subtitle', 'Your Sacred Journey Awaits')}</h1>
              <p className="text-lg text-purple-300/50 mb-10 max-w-2xl leading-relaxed">
                {t('ayurveda.title', 'Experience a digital transformation through ancient wisdom. Our AI-driven Ayurvedic system matches your unique personality and life situation to a personalized healing path.')}
              </p>
              <Button 
                onClick={() => setActiveTab('assessment')}
                size="lg"
                className="font-bold py-6 px-12 rounded-2xl text-lg text-black"
                style={{
                  background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
                  boxShadow: '0 0 25px rgba(168,85,247,0.4)',
                  color: 'white',
                }}
              >
                {t('ayurveda.assessment', 'Reveal Your Prakriti')} <Sparkles className="ml-2 w-5 h-5" />
              </Button>
              
              {!isAdmin && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 w-full max-w-4xl">
                  <MembershipCard 
                    level={'FREE' as AyurvedaMembershipLevel}
                    current={membership} onSelect={setMembership}
                    features={[t('ayurveda.freeDesc', 'Basic Dosha Analysis'), t('common.free', 'General Daily Routine'), "Aura of Wellness"]}
                  />
                  <MembershipCard 
                    level={'PREMIUM' as AyurvedaMembershipLevel}
                    current={membership} onSelect={setMembership}
                    features={[t('ayurveda.premiumDesc', 'Personality Matching'), "Life Situation Advice", t('ayurveda.aiDoctor', 'AI Chat Consultations')]}
                  />
                  <MembershipCard 
                    level={'LIFETIME' as AyurvedaMembershipLevel}
                    current={membership} onSelect={setMembership}
                    features={[t('ayurveda.aiDoctor', 'Live Audio AI Doctor'), "Deep Vedic Astrology Sync", t('ayurveda.lifetimeDesc', 'Priority Healing Access')]}
                  />
                </div>
              )}
              
              {isAdmin && (
                <div className="mt-10 p-4 rounded-2xl text-center"
                  style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)' }}>
                  <Crown className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-purple-200">
                    Admin Access: Full Lifetime features unlocked
                  </p>
                </div>
              )}
            </div>
          );
        }
        return (
          <DoshaDashboard 
            profile={userProfile!} dosha={doshaProfile} 
            dailyGuidance={dailyGuidance} isLoadingGuidance={isLoadingGuidance}
            onRestart={handleRestart} onFetchGuidance={handleFetchGuidance}
            isPremium={membership !== 'FREE'}
          />
        );

      case 'assessment':
        return <DoshaQuiz onComplete={handleAssessmentComplete} isLoading={isLoading} />;

      case 'chat':
        return (
          <Card className="max-w-2xl mx-auto" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(168,85,247,0.15)' }}>
            <CardContent className="p-16 text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{ background: 'rgba(168,85,247,0.1)' }}>
                <Stethoscope className="w-10 h-10 text-purple-400" />
              </div>
              <h2 className="text-3xl font-serif text-white mb-4">Premium Access Required</h2>
              <p className="text-purple-300/50 mb-8 leading-relaxed">
                The Divine Physician is available to our Premium and Lifetime members.
              </p>
              <Button onClick={() => setActiveTab('home')} style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.4), rgba(79,70,229,0.3))', border: '1px solid rgba(168,85,247,0.3)' }} className="text-white">
                Explore Plans
              </Button>
            </CardContent>
          </Card>
        );

      case 'doctor':
        if (membership !== 'LIFETIME') {
          return (
            <Card className="max-w-2xl mx-auto" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(168,85,247,0.15)' }}>
              <CardContent className="p-16 text-center">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                  style={{ background: 'rgba(217,170,0,0.1)' }}>
                  <Crown className="w-10 h-10 text-amber-400" />
                </div>
                <h2 className="text-3xl font-serif text-white mb-4">Lifetime Sanctuary</h2>
                <p className="text-purple-300/50 mb-8 leading-relaxed">
                  Real-time audio healing sessions are exclusive to our Lifetime members.
                </p>
                <Button onClick={() => setActiveTab('home')} style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.4), rgba(79,70,229,0.3))', border: '1px solid rgba(168,85,247,0.3)' }} className="text-white">
                  View Membership
                </Button>
              </CardContent>
            </Card>
          );
        }
        return <AyurvedaLiveDoctor profile={userProfile} dosha={doshaProfile} />;

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
            className="rounded-full border-purple-500/20 text-purple-200"
            style={activeTab === 'home' ? { background: 'linear-gradient(135deg, rgba(168,85,247,0.3), rgba(79,70,229,0.2))', border: '1px solid rgba(168,85,247,0.4)' } : {}}
          >
            <Leaf className="w-4 h-4 mr-2" /> Dashboard
          </Button>
          <Button 
            variant="outline"
            onClick={() => {
              if (membership === ('FREE' as AyurvedaMembershipLevel)) { setActiveTab('chat'); } 
              else { setShowChat(true); }
            }}
            className="rounded-full border-purple-500/20 text-purple-200"
          >
            <Stethoscope className="w-4 h-4 mr-2" /> Divine Physician
          </Button>
          <Button 
            variant={activeTab === 'doctor' ? 'default' : 'outline'}
            onClick={() => setActiveTab('doctor')}
            className="rounded-full border-purple-500/20 text-purple-200"
            style={activeTab === 'doctor' ? { background: 'linear-gradient(135deg, rgba(168,85,247,0.3), rgba(79,70,229,0.2))', border: '1px solid rgba(168,85,247,0.4)' } : {}}
          >
            <Mic className="w-4 h-4 mr-2" /> Live Doctor
          </Button>
        </div>
      )}
      
      {renderContent()}

      {/* Full-screen Chat Overlay */}
      <AnimatePresence>
        {showChat && (
          <AyurvedaChatConsultation 
            profile={userProfile} 
            dosha={doshaProfile} 
            onClose={() => setShowChat(false)} 
          />
        )}
      </AnimatePresence>
      
      {/* Footer */}
      <div className="mt-12 text-center py-6" style={{ borderTop: '1px solid rgba(147,51,234,0.1)' }}>
        <div className="flex justify-center gap-6 mb-3 text-purple-500/20">
          <Leaf className="w-4 h-4" />
          <Moon className="w-4 h-4" />
          <Sun className="w-4 h-4" />
        </div>
        <p className="font-serif italic text-sm text-purple-300/40 mb-1">
          "Health is wealth, peace of mind is happiness, Yoga shows the way."
        </p>
        <p className="text-xs text-purple-400/20">Sacred Healing Ayurveda • Siddha AI Engine</p>
      </div>
    </div>
  );
};
