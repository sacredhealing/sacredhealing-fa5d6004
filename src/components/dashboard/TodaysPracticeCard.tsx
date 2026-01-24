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
      <Card className="glass-card-floating relative overflow-hidden border-secondary/30">
        {/* Purple to turquoise gradient overlay */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, hsl(271 76% 53% / 0.15) 0%, transparent 40%, hsl(185 100% 50% / 0.1) 100%)',
          }}
        />
        
        {/* Sacred geometry watermark in background */}
        <div className="absolute left-0 top-0 bottom-0 w-1/2 opacity-30 pointer-events-none">
          <motion.svg
            viewBox="0 0 200 200"
            className="w-full h-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 180, repeat: Infinity, ease: 'linear' }}
          >
            {[0, 60, 120, 180, 240, 300].map((angle) => {
              const x = 100 + 80 * Math.cos((angle * Math.PI) / 180);
              const y = 100 + 80 * Math.sin((angle * Math.PI) / 180);
              return (
                <circle
                  key={angle}
                  cx={x}
                  cy={y}
                  r="30"
                  fill="none"
                  stroke="hsl(185 100% 50% / 0.15)"
                  strokeWidth="0.5"
                />
              );
            })}
            <circle cx="100" cy="100" r="50" fill="none" stroke="hsl(185 100% 50% / 0.1)" strokeWidth="0.5" />
          </motion.svg>
        </div>
        
        {/* Content */}
        <div className="relative flex items-center p-6 gap-6">
          {/* Left: Sacred Geometry Visual */}
          <div className="hidden sm:flex w-36 h-36 shrink-0">
            <SacredGeometryHero className="w-full h-full" />
          </div>

          {/* Mobile: Smaller Sacred Geometry */}
          <div className="flex sm:hidden w-24 h-24 shrink-0">
            <SacredGeometryHero className="w-full h-full" />
          </div>

          {/* Right: Text and CTA */}
          <div className="flex-1 flex flex-col gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-heading font-bold text-foreground mb-1">
                {greeting}
              </h2>
              <p className="text-sm text-lavender opacity-80">
                {subtitle}
              </p>
            </div>

            <Link to="/meditations">
              <Button 
                className="w-full sm:w-auto gap-2 btn-glow-turquoise rounded-full px-8 py-3 font-semibold text-base"
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
