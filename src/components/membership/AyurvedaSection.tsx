import React from 'react';
import { motion } from 'framer-motion';
import { Leaf, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useMembershipTier } from '@/features/membership/useMembershipTier';
import { AccessTag } from '@/features/membership/AccessTag';
import { hasTierAccess } from '@/features/membership/tier';

const AYURVEDA_REQUIRED_TIER = 'monthly' as const;

interface AyurvedaSectionProps {
  isPremium?: boolean;
  membershipTier?: string;
  isAdmin?: boolean;
}

export const AyurvedaSection: React.FC<AyurvedaSectionProps> = ({
  isPremium = false,
  membershipTier = 'free',
  isAdmin = false
}) => {
  const navigate = useNavigate();
  const tier = useMembershipTier();
  const hasAccess = isAdmin || hasTierAccess(tier, AYURVEDA_REQUIRED_TIER);

  return (
    <Card className="overflow-hidden border-2 border-emerald-500/20 bg-gradient-to-br from-emerald-50/50 to-background dark:from-emerald-950/20">
      <CardContent className="p-0">
        <div className="p-4 sm:p-6 md:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 mb-6">
            <motion.div 
              className="p-3 sm:p-4 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 self-start"
              whileHover={{ scale: 1.05, rotate: 5 }}
            >
              <Leaf className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-600 dark:text-emerald-400" />
            </motion.div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI-Powered Ayurveda
                </Badge>
                <AccessTag userTier={tier} requiredTier={AYURVEDA_REQUIRED_TIER} />
              </div>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-foreground">
                Discover Your Prakriti
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">
                Ancient Ayurvedic wisdom meets modern AI for personalized health guidance
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30">
              <div className="text-2xl mb-2">🌬️</div>
              <h3 className="font-bold text-blue-900 dark:text-blue-100 text-sm">Vata Analysis</h3>
              <p className="text-xs text-blue-700 dark:text-blue-300/80">Air & Ether elements</p>
            </div>
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30">
              <div className="text-2xl mb-2">🔥</div>
              <h3 className="font-bold text-red-900 dark:text-red-100 text-sm">Pitta Analysis</h3>
              <p className="text-xs text-red-700 dark:text-red-300/80">Fire & Water elements</p>
            </div>
            <div className="p-4 rounded-2xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30">
              <div className="text-2xl mb-2">🌍</div>
              <h3 className="font-bold text-green-900 dark:text-green-100 text-sm">Kapha Analysis</h3>
              <p className="text-xs text-green-700 dark:text-green-300/80">Earth & Water elements</p>
            </div>
          </div>

          <div className="bg-muted/30 rounded-2xl p-4 mb-6">
            <h4 className="font-bold text-foreground text-sm mb-3">What You'll Discover:</h4>
            <ul className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="text-emerald-500">✓</span> Your unique Dosha constitution
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-500">✓</span> Personalized diet recommendations
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-500">✓</span> Mental constitution (Manas Prakriti)
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-500">✓</span> Lifestyle rituals for balance
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-500">✓</span> Life situation healing path
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-500">✓</span> Herbal & botanical support
              </li>
            </ul>
          </div>

          {hasAccess ? (
            <Button 
              size="lg"
              onClick={() => navigate('/ayurveda')}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-2xl py-4 sm:py-6 text-sm sm:text-base whitespace-normal h-auto min-h-[52px]"
            >
              <span className="flex items-center justify-center gap-2">
                <span>Begin Your Ayurvedic Journey</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              </span>
            </Button>
          ) : (
            <button
              type="button"
              className="mt-3 w-full rounded-full bg-white px-5 py-3 text-sm font-semibold text-black"
              onClick={() => navigate('/membership')}
            >
              Upgrade
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};