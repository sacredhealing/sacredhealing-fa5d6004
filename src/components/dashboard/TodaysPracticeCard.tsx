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
      <Card className="glass-card relative overflow-hidden p-0">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-secondary/5 via-transparent to-primary/5 pointer-events-none" />
        
        {/* Content - responsive padding and layout */}
        <div className="relative flex items-center p-4 sm:p-8 gap-3 sm:gap-8">
          {/* Left: Metatron's Cube Sacred Geometry - responsive sizing */}
          <div className="hidden sm:flex w-56 h-56 shrink-0 relative">
            {/* Large cyan outer glow - portal effect */}
            <div 
              className="absolute inset-[-40%] rounded-full animate-pulse-slow"
              style={{
                background: "radial-gradient(circle, rgba(0, 242, 254, 0.35) 0%, rgba(0, 242, 254, 0.15) 40%, transparent 70%)",
                filter: "blur(25px) drop-shadow(0 0 30px rgba(0, 242, 254, 0.4))",
              }}
            />
            <MetatronsCube className="w-full h-full relative z-10" />
          </div>

          {/* Mobile: Smaller Portal to fit screen */}
          <div className="flex sm:hidden w-24 h-24 shrink-0 relative">
            <div 
              className="absolute inset-[-20%] rounded-full animate-pulse-slow"
              style={{
                background: "radial-gradient(circle, rgba(0, 242, 254, 0.3) 0%, transparent 60%)",
                filter: "blur(15px) drop-shadow(0 0 15px rgba(0, 242, 254, 0.35))",
              }}
            />
            <MetatronsCube className="w-full h-full relative z-10" />
          </div>

          {/* Right: Text and CTA */}
          <div className="flex-1 min-w-0 flex flex-col gap-3 sm:gap-5">
            <div>
              <h2 className="text-base sm:text-2xl font-heading font-bold text-white mb-1 sm:mb-2 leading-tight">
                {greeting}
              </h2>
              <p className="text-sm sm:text-base text-[#94a3b8] truncate">
                {subtitle}
              </p>
            </div>

            <Link to="/meditations">
              <Button 
                className="w-full gap-2 bg-[#00F2FE] hover:bg-[#00D4E0] text-[#000000] font-extrabold shadow-[0_0_25px_rgba(0,242,254,0.5)] hover:shadow-[0_0_35px_rgba(0,242,254,0.6)] border-none transition-all text-sm sm:text-base px-4 sm:px-8 py-2.5 sm:py-3"
              >
                Start Journey
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
