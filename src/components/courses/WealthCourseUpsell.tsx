import React, { useState } from 'react';
import { Sparkles, Loader2, Check, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface WealthCourseUpsellProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const WealthCourseUpsell: React.FC<WealthCourseUpsellProps> = ({ isOpen, onOpenChange }) => {
  const { isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePurchase = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to purchase');
      return;
    }

    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await supabase.functions.invoke('create-wealth-meditation-checkout', {
        body: { email, discounted: true },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.url) {
        window.open(response.data.url, '_blank');
        onOpenChange(false);
        toast.success('Redirecting to checkout with your exclusive discount!');
      }
    } catch (error: unknown) {
      console.error('Purchase error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process purchase');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-[40px] border border-white/[0.1] bg-white/[0.04] backdrop-blur-[40px] shadow-[0_0_56px_-8px_rgba(212,175,55,0.3)] sm:rounded-[40px]">
        <DialogHeader>
          <p className="sqi-label-text mb-2 text-[#D4AF37]/65">Prema-Pulse · Vedic Light-Code</p>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Gift className="text-[#D4AF37] shrink-0" size={22} />
            <span className="rounded-full border border-[#D4AF37]/35 bg-[#D4AF37]/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.28em] text-[#D4AF37]">
              Exklusivt Erbjudande - Spara €20!
            </span>
          </div>
          <DialogTitle className="text-xl font-black tracking-[-0.05em] font-heading text-[#D4AF37] gold-glow">
            108 Rikedoms-Affirmationer Meditation
          </DialogTitle>
          <DialogDescription className="sqi-body-text !text-white/60">
            Komplettera din kurs med en personlig rikedomsmeditation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="p-4 rounded-[28px] border border-[#D4AF37]/25 bg-white/[0.03] backdrop-blur-[40px] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <p className="text-sm sqi-body-text !text-white/75">
              🎁 <strong className="text-[#D4AF37]">Som kursdeltagare får du €20 rabatt!</strong> Din personliga rikedomsmeditation med 108 affirmationer förvandlar ditt undermedvetna till en magnet för överflöd.
            </p>
          </div>

          <div className="space-y-3 p-4 rounded-[28px] border border-white/[0.08] bg-white/[0.02] backdrop-blur-[40px]">
            <h4 className="font-black tracking-[-0.02em] text-sm text-[#D4AF37]">Du får:</h4>
            <ul className="text-sm sqi-body-text space-y-2">
              <li className="flex items-center gap-2">
                <Check size={14} className="text-[#D4AF37] shrink-0" />
                108 kraftfulla rikedoms-affirmationer
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-[#D4AF37] shrink-0" />
                Din röst omvandlad till studioklassad meditation
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-[#22D3EE] shrink-0" />
                528Hz & 639Hz frekvenser för djup transformation
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-[#22D3EE] shrink-0" />
                Theta-aktivering för undermedveten omprogrammering
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="sqi-label-text !text-[#D4AF37]/80 !tracking-[0.35em]">
              E-postadress *
            </h4>
            <p className="text-sm sqi-body-text">
              Vi skickar de 108 affirmationerna till denna e-post efter köp.
            </p>
            <Input
              type="email"
              placeholder="din@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-[24px] border-white/[0.1] bg-white/[0.04] text-white placeholder:text-white/35 backdrop-blur-[40px] focus-visible:border-[#D4AF37]/45 focus-visible:ring-[#D4AF37]/20"
            />
          </div>

          <div className="space-y-4 pt-4 border-t border-white/[0.08]">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="sqi-body-text line-through text-sm">€47</span>
                <span className="text-2xl font-black tracking-[-0.04em] text-gradient-gold ml-2 font-heading">€27</span>
              </div>
              <span className="rounded-full border border-[#22D3EE]/30 bg-[#22D3EE]/10 px-3 py-1 text-xs font-bold text-[#22D3EE]">
                Spara €20
              </span>
            </div>

            <Button
              onClick={handlePurchase}
              disabled={!email || isLoading || !isAuthenticated}
              variant="gold"
              className="w-full rounded-[40px] h-12 text-xs font-black tracking-[0.2em] uppercase shadow-[0_0_32px_-6px_rgba(212,175,55,0.45)]"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="mr-2 animate-spin" />
                  Bearbetar...
                </>
              ) : (
                <>
                  <Sparkles size={18} className="mr-2" />
                  Lägg till för €27
                </>
              )}
            </Button>

            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="w-full rounded-[28px] text-[#D4AF37] hover:text-[#D4AF37] hover:bg-white/[0.06]"
            >
              Nej tack, fortsätt utan
            </Button>

            {!isAuthenticated && (
              <p className="text-sm text-center sqi-body-text">
                Logga in för att köpa
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WealthCourseUpsell;
