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
        
        {/* Content with luxury spacing */}
        <div className="relative flex items-center p-8 gap-8">
          {/* Left: Metatron's Cube Sacred Geometry - 3x LARGER with cyan glow */}
          <div className="hidden sm:flex w-48 h-48 shrink-0 relative">
            {/* Large cyan outer glow */}
            <div 
              className="absolute inset-[-30%] rounded-full animate-pulse-slow"
              style={{
                background: "radial-gradient(circle, rgba(0, 242, 254, 0.25) 0%, rgba(0, 242, 254, 0.1) 40%, transparent 70%)",
                filter: "blur(20px)",
              }}
            />
            <MetatronsCube className="w-full h-full relative z-10" />
          </div>

          {/* Mobile: Larger Portal */}
          <div className="flex sm:hidden w-32 h-32 shrink-0 relative">
            <div 
              className="absolute inset-[-25%] rounded-full animate-pulse-slow"
              style={{
                background: "radial-gradient(circle, rgba(0, 242, 254, 0.2) 0%, transparent 60%)",
                filter: "blur(15px)",
              }}
            />
            <MetatronsCube className="w-full h-full relative z-10" />
          </div>

          {/* Right: Text and CTA */}
          <div className="flex-1 flex flex-col gap-5">
            <div>
              <h2 className="text-xl sm:text-2xl font-heading font-bold text-white mb-2">
                {greeting}
              </h2>
              <p className="text-base text-[#A5B4FC]">
                {subtitle}
              </p>
            </div>

            <Link to="/meditations">
              <Button 
                className="w-full sm:w-auto gap-2 bg-[#00F2FE] hover:bg-[#00D4E0] text-[#050505] font-extrabold shadow-[0_0_20px_rgba(0,242,254,0.6)] hover:shadow-[0_0_30px_rgba(0,242,254,0.7)] border-none transition-all text-base px-8 py-3"
              >
                Start Journey
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
