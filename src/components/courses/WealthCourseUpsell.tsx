import React, { useState } from 'react';
import { Sparkles, Loader2, Check, DollarSign, Gift } from 'lucide-react';
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
  const { user, isAuthenticated } = useAuth();
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
    } catch (error: any) {
      console.error('Purchase error:', error);
      toast.error(error.message || 'Failed to process purchase');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Gift className="text-yellow-500" size={24} />
            <span className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
              Exklusivt Erbjudande - Spara €20!
            </span>
          </div>
          <DialogTitle className="text-xl font-heading">
            108 Rikedoms-Affirmationer Meditation
          </DialogTitle>
          <DialogDescription>
            Komplettera din kurs med en personlig rikedomsmeditation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="p-4 rounded-lg bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
            <p className="text-sm text-foreground/90">
              🎁 <strong>Som kursdeltagare får du €20 rabatt!</strong> Din personliga rikedomsmeditation med 108 affirmationer förvandlar ditt undermedvetna till en magnet för överflöd.
            </p>
          </div>

          <div className="space-y-3 p-4 rounded-lg bg-muted/30 border border-border">
            <h4 className="font-semibold text-sm">Du får:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li className="flex items-center gap-2">
                <Check size={14} className="text-green-500" />
                108 kraftfulla rikedoms-affirmationer
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-green-500" />
                Din röst omvandlad till studioklassad meditation
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-green-500" />
                528Hz & 639Hz frekvenser för djup transformation
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-green-500" />
                Theta-aktivering för undermedveten omprogrammering
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              E-postadress *
            </h4>
            <p className="text-sm text-muted-foreground">
              Vi skickar de 108 affirmationerna till denna e-post efter köp.
            </p>
            <Input
              type="email"
              placeholder="din@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-muted-foreground line-through text-sm">€47</span>
                <span className="text-2xl font-heading font-bold text-gradient-gold ml-2">€27</span>
              </div>
              <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-sm font-medium">
                Spara €20
              </span>
            </div>
            
            <Button
              onClick={handlePurchase}
              disabled={!email || isLoading || !isAuthenticated}
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
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
              className="w-full"
            >
              Nej tack, fortsätt utan
            </Button>

            {!isAuthenticated && (
              <p className="text-sm text-center text-muted-foreground">
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
