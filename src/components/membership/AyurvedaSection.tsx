import React from 'react';
import { motion } from 'framer-motion';
import { Leaf, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { AyurvedaTool } from '@/components/ayurveda/AyurvedaTool';
import type { AyurvedaMembershipLevel } from '@/lib/ayurvedaTypes';

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
  // Map membership tiers to Ayurveda levels - Admins get LIFETIME access
  const getAyurvedaLevel = (): AyurvedaMembershipLevel => {
    if (isAdmin) return 'LIFETIME' as AyurvedaMembershipLevel;
    if (membershipTier === 'lifetime') return 'LIFETIME' as AyurvedaMembershipLevel;
    if (isPremium || membershipTier?.includes('premium')) return 'PREMIUM' as AyurvedaMembershipLevel;
    return 'FREE' as AyurvedaMembershipLevel;
  };

  return (
    <Card className="overflow-hidden border-2 border-emerald-500/20 bg-gradient-to-br from-emerald-50/50 to-background dark:from-emerald-950/20">
      <CardContent className="p-0">
        <div className="p-6 md:p-8">
          <div className="flex items-start gap-4 mb-6">
            <motion.div 
              className="p-4 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30"
              whileHover={{ scale: 1.05, rotate: 5 }}
            >
              <Leaf className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </motion.div>
            <div>
              <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 mb-2">
                <Sparkles className="w-3 h-3 mr-1" />
                AI-Powered Ayurveda
              </Badge>
              <h2 className="text-2xl font-serif font-bold text-foreground">
                Discover Your Prakriti
              </h2>
              <p className="text-muted-foreground mt-1">
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

          <Dialog>
            <DialogTrigger asChild>
              <Button 
                size="lg"
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-2xl py-6"
              >
                Begin Your Ayurvedic Journey
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-0">
              <div className="p-6">
                <AyurvedaTool membershipLevel={getAyurvedaLevel()} isAdmin={isAdmin} />
              </div>
            </DialogContent>
          </Dialog>

          {!isPremium && !isAdmin && (
            <p className="text-center text-xs text-muted-foreground mt-4">
              Free tier includes basic analysis. Upgrade for AI chat consultations and live audio sessions.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};