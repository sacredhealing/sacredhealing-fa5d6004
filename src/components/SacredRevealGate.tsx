import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

export interface SacredRevealGateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** High-Ticket Akashic Gate — shown when user taps Akashic Decoder. */
const SacredRevealGate: React.FC<SacredRevealGateProps> = ({ open, onOpenChange }) => {
  const navigate = useNavigate();

  const handleUnlock = () => {
    onOpenChange(false);
    navigate('/membership?product=akashic');
  };

  const handleMasterBundle = () => {
    onOpenChange(false);
    navigate('/membership?product=master-bundle');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md bg-gradient-to-b from-[#1a0a2e] to-black border-2 border-purple-500/40 p-0 overflow-hidden"
        style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}
      >
        <div className="p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center mx-auto mb-4 shadow-[0_0_24px_rgba(168,85,247,0.3)]">
            <Sparkles className="w-7 h-7 text-purple-300" />
          </div>
          <h2 className="text-xl font-bold text-[#D4AF37] mb-3 uppercase tracking-wider">Sacred Reveal</h2>
          <p className="text-white/90 text-sm leading-relaxed mb-6">
            The Akashic Record is a personalized transmission. This deep soul-reading requires a specific energy exchange to unlock your 15-page manuscript.
          </p>
          <Button
            onClick={handleUnlock}
            className="w-full py-6 rounded-xl bg-gradient-to-r from-[#D4AF37] to-amber-600 text-black font-bold text-base uppercase tracking-wider hover:opacity-95 transition-opacity shadow-[0_0_20px_rgba(212,175,55,0.4)]"
          >
            Unlock My Soul&apos;s Origin — $49
          </Button>
          <p className="text-center text-purple-200/80 text-xs mt-3">Premium Members save 20% on all Akashic Deep Readings.</p>
          <div className="mt-4 pt-4 border-t border-purple-500/20">
            <p className="text-xs text-purple-200/80 mb-3">Or choose the Master Bundle</p>
            <Button
              onClick={handleMasterBundle}
              variant="outline"
              className="w-full py-4 rounded-xl border-2 border-purple-400/50 text-purple-200 hover:bg-purple-500/20 font-semibold"
            >
              1 Year Premium + 2 Akashic Readings — Special Price
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SacredRevealGate;
