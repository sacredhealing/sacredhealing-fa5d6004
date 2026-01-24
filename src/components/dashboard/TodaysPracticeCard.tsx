import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MetatronsCube } from './MetatronsCube';

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
      <Card className="glass-card relative overflow-hidden">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-secondary/5 via-transparent to-primary/5 pointer-events-none" />
        
        {/* Content */}
        <div className="relative flex items-center p-6 gap-6">
          {/* Left: Metatron's Cube Sacred Geometry */}
          <div className="hidden sm:flex w-36 h-36 shrink-0">
            <MetatronsCube className="w-full h-full" />
          </div>

          {/* Mobile: Smaller Geometry */}
          <div className="flex sm:hidden w-24 h-24 shrink-0">
            <MetatronsCube className="w-full h-full" />
          </div>

          {/* Right: Text and CTA */}
          <div className="flex-1 flex flex-col gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-heading font-bold text-white mb-1">
                {greeting}
              </h2>
              <p className="text-sm text-[#A5B4FC]">
                {subtitle}
              </p>
            </div>

            <Link to="/meditations">
              <Button 
                className="w-full sm:w-auto gap-2 bg-[#00F2FE] hover:bg-[#00D4E0] text-[#0B0A1A] font-semibold shadow-[0_0_15px_rgba(0,242,254,0.6)] hover:shadow-[0_0_25px_rgba(0,242,254,0.7)] transition-all"
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
