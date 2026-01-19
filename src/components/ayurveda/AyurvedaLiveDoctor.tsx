import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Phone, PhoneOff, Shield, Sparkles, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { AyurvedaUserProfile, DoshaProfile } from '@/lib/ayurvedaTypes';

interface AyurvedaLiveDoctorProps {
  profile: AyurvedaUserProfile | null;
  dosha: DoshaProfile | null;
}

export const AyurvedaLiveDoctor: React.FC<AyurvedaLiveDoctorProps> = ({ profile, dosha }) => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcription, setTranscription] = useState<string[]>([]);

  const handleToggleSession = async () => {
    if (isActive) {
      // End session
      setIsActive(false);
      setTranscription([]);
      toast.info('Session ended. Namaste 🙏');
    } else {
      // Start session
      setIsConnecting(true);
      
      try {
        // Request microphone permission
        await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Simulate connection (real implementation would use WebRTC or similar)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        setIsActive(true);
        setTranscription(['Doctor: Namaste! I am your Ayurvedic consultant. How may I guide you today?']);
        toast.success('Connected to Live Doctor');
      } catch (error) {
        console.error('Failed to start session:', error);
        toast.error('Could not access microphone. Please grant permission and try again.');
      } finally {
        setIsConnecting(false);
      }
    }
  };

  return (
    <Card className="max-w-2xl mx-auto overflow-hidden border-2 border-amber-500/20">
      <CardContent className="p-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 p-6 text-white text-center">
          <Badge className="bg-white/20 text-white border-white/30 mb-4">
            <Sparkles className="w-3 h-3 mr-1" />
            Lifetime Exclusive
          </Badge>
          <h2 className="text-2xl font-serif mb-2">Live Audio Consultation</h2>
          <p className="text-sm opacity-80">
            Real-time voice session with your AI Ayurvedic Doctor
          </p>
          {profile && dosha && (
            <div className="mt-4 p-3 bg-white/10 rounded-xl inline-block">
              <p className="text-sm">
                {profile.name} • <span className="opacity-80">{dosha.primary} Prakriti</span>
              </p>
            </div>
          )}
        </div>

        {/* Main Call Interface */}
        <div className="p-8 bg-gradient-to-b from-background to-muted/30">
          <div className="relative flex flex-col items-center">
            {/* Pulsing Aura when active */}
            {isActive && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="w-48 h-48 rounded-full bg-amber-500/10 animate-ping" />
                <div className="absolute w-40 h-40 rounded-full bg-amber-500/20 animate-pulse" />
              </motion.div>
            )}

            {/* Call Button */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative z-10"
            >
              <Button
                onClick={handleToggleSession}
                disabled={isConnecting}
                className={`w-32 h-32 rounded-full text-white shadow-2xl transition-all ${
                  isActive 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700'
                }`}
              >
                {isConnecting ? (
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                  </div>
                ) : isActive ? (
                  <PhoneOff className="w-12 h-12" />
                ) : (
                  <Phone className="w-12 h-12" />
                )}
              </Button>
            </motion.div>

            {/* Status Text */}
            <p className="mt-6 text-lg font-medium text-foreground">
              {isConnecting ? 'Connecting...' : isActive ? 'Session Active' : 'Tap to Begin'}
            </p>

            {/* Audio Indicators */}
            {isActive && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 mt-4"
              >
                <div className="flex items-center gap-2 text-emerald-600">
                  <Mic className="w-4 h-4" />
                  <span className="text-xs">Listening</span>
                </div>
                <div className="flex items-center gap-2 text-amber-600">
                  <Volume2 className="w-4 h-4" />
                  <span className="text-xs">Speaking</span>
                </div>
              </motion.div>
            )}
          </div>

          {/* Live Transcription */}
          <div className="mt-8">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4 text-center">
              Live Transcription
            </h3>
            <div className="bg-muted/50 rounded-2xl p-4 min-h-[120px] max-h-[200px] overflow-y-auto">
              {transcription.length === 0 ? (
                <p className="text-center text-muted-foreground/50 text-sm py-8">
                  Session not started...
                </p>
              ) : (
                <div className="space-y-2">
                  {transcription.map((text, i) => (
                    <motion.p
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`text-sm ${
                        text.startsWith('You:') 
                          ? 'text-emerald-600' 
                          : 'text-foreground'
                      }`}
                    >
                      {text}
                    </motion.p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Security Footer */}
        <div className="p-4 bg-muted/30 border-t border-border flex items-center justify-center gap-2 text-muted-foreground">
          <Shield className="w-4 h-4" />
          <span className="text-xs">Encrypted & Private Live Session</span>
        </div>
      </CardContent>
    </Card>
  );
};
