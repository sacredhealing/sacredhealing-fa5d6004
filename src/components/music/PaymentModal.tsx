import React, { useState } from 'react';
import { X, CreditCard, Wallet, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { usePhantomWallet } from '@/hooks/usePhantomWallet';

interface Track {
  id: number;
  title: string;
  price: number;
  shcReward: number;
  cover: string;
}

interface PaymentModalProps {
  track: Track;
  isOpen: boolean;
  onClose: () => void;
  onPurchaseComplete: () => void;
}

type PaymentMethod = 'card' | 'crypto';

const paymentMethods = [
  { id: 'card' as PaymentMethod, name: 'Credit Card', icon: CreditCard, description: 'Visa, Mastercard, Amex' },
  { id: 'crypto' as PaymentMethod, name: 'Phantom Wallet', icon: Wallet, description: 'Pay with SOL via Phantom' },
];

export const PaymentModal: React.FC<PaymentModalProps> = ({
  track,
  isOpen,
  onClose,
  onPurchaseComplete,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const { walletAddress, isPhantomInstalled, connectWallet } = usePhantomWallet();

  if (!isOpen) return null;

  const usdPrice = track.price.toFixed(2);

  const handlePayment = async () => {
    setIsProcessing(true);
    
    if (selectedMethod === 'crypto') {
      if (!walletAddress) {
        await connectWallet();
        setIsProcessing(false);
        return;
      }
      // TODO: Implement crypto payment via Phantom
      toast({
        title: "Crypto payment coming soon",
        description: "Phantom wallet integration for payments is being finalized",
      });
      setIsProcessing(false);
      return;
    }
    
    // Simulate card payment processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsProcessing(false);
    onPurchaseComplete();
    onClose();
    
    toast({
      title: "Purchase successful!",
      description: `You earned +${track.shcReward} SHC! Enjoy "${track.title}"`,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 mb-4 sm:mb-0 bg-card rounded-2xl border border-border/50 shadow-xl animate-slide-up overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <h2 className="text-lg font-heading font-bold text-foreground">Purchase Track</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <X size={20} className="text-muted-foreground" />
          </button>
        </div>

        {/* Track Info */}
        <div className="p-4 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-xl bg-gradient-spiritual flex items-center justify-center text-2xl">
              {track.cover}
            </div>
            <div>
              <p className="font-medium text-foreground">{track.title}</p>
              <p className="text-sm text-muted-foreground">Sacred Healing</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-primary font-heading font-bold">${usdPrice}</span>
              </div>
            </div>
          </div>
          
          {/* Reward Badge */}
          <div className="mt-3 flex items-center gap-2 p-2 bg-accent/10 rounded-lg">
            <Sparkles size={16} className="text-accent" />
            <span className="text-sm text-accent">Earn +{track.shcReward} SHC reward with purchase!</span>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="p-4 space-y-2">
          <p className="text-sm text-muted-foreground mb-3">Select payment method</p>
          
          {paymentMethods.map((method) => (
            <button
              key={method.id}
              onClick={() => setSelectedMethod(method.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                selectedMethod === method.id
                  ? 'bg-primary/10 border-primary'
                  : 'bg-muted/20 border-border/50 hover:bg-muted/40'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                selectedMethod === method.id ? 'bg-primary/20' : 'bg-muted'
              }`}>
                <method.icon size={20} className={selectedMethod === method.id ? 'text-primary' : 'text-muted-foreground'} />
              </div>
              <div className="flex-1 text-left">
                <p className={`font-medium ${selectedMethod === method.id ? 'text-foreground' : 'text-foreground/80'}`}>
                  {method.name}
                </p>
                <p className="text-xs text-muted-foreground">{method.description}</p>
              </div>
              {selectedMethod === method.id && (
                <Check size={20} className="text-primary" />
              )}
            </button>
          ))}
        </div>

        {/* Action Button */}
        <div className="p-4 border-t border-border/50">
          <Button
            variant="gold"
            size="lg"
            className="w-full"
            onClick={handlePayment}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                {selectedMethod === 'card' && `Pay $${usdPrice}`}
                {selectedMethod === 'crypto' && (walletAddress ? `Pay with Phantom` : `Connect Phantom Wallet`)}
              </>
            )}
          </Button>
          
          <p className="text-xs text-muted-foreground text-center mt-3">
            Secure payment · Instant delivery · Lifetime access
          </p>
        </div>
      </div>
    </div>
  );
};
