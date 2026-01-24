import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SacredGeometryHero } from './SacredGeometryHero';

interface TodaysPracticeCardProps {
  greeting?: string;
  subtitle?: string;
}

export const TodaysPracticeCard: React.FC<TodaysPracticeCardProps> = ({
  greeting = "Today's Sacred Practice",
  subtitle = "Morning: Rise with Clarity"
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="glass-card relative overflow-hidden border-[#00F2FE]/30">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-[#00F2FE]/10 pointer-events-none" />
        
        {/* Content */}
        <div className="relative flex items-center p-6 gap-6">
          {/* Left: Sacred Geometry Visual */}
          <div className="hidden sm:flex w-32 h-32 shrink-0">
            <SacredGeometryHero className="w-full h-full" />
          </div>

          {/* Mobile: Smaller Sacred Geometry */}
          <div className="flex sm:hidden w-20 h-20 shrink-0">
            <SacredGeometryHero className="w-full h-full" />
          </div>

          {/* Right: Text and CTA */}
          <div className="flex-1 flex flex-col gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-heading font-bold text-foreground mb-1">
                {greeting}
              </h2>
              <p className="text-sm text-muted-foreground">
                {subtitle}
              </p>
            </div>

            <Link to="/meditations">
              <Button 
                className="w-full sm:w-auto gap-2 bg-[#00F2FE] hover:bg-[#00D4E0] text-[#0F0C29] font-semibold shadow-[0_0_20px_rgba(0,242,254,0.5)] hover:shadow-[0_0_30px_rgba(0,242,254,0.6)] transition-all"
              >
                Start Journey
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
