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
          {/* Left: Metatron's Cube Sacred Geometry - LARGER portal with cyan glow */}
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

          {/* Mobile: Larger Portal */}
          <div className="flex sm:hidden w-40 h-40 shrink-0 relative">
            <div 
              className="absolute inset-[-30%] rounded-full animate-pulse-slow"
              style={{
                background: "radial-gradient(circle, rgba(0, 242, 254, 0.3) 0%, transparent 60%)",
                filter: "blur(20px) drop-shadow(0 0 20px rgba(0, 242, 254, 0.35))",
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
              <p className="text-base text-[#94a3b8]">
                {subtitle}
              </p>
            </div>

            <Link to="/meditations">
              <Button 
                className="w-full sm:w-auto gap-2 bg-[#00F2FE] hover:bg-[#00D4E0] text-[#000000] font-extrabold shadow-[0_0_25px_rgba(0,242,254,0.5)] hover:shadow-[0_0_35px_rgba(0,242,254,0.6)] border-none transition-all text-base px-8 py-3"
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
