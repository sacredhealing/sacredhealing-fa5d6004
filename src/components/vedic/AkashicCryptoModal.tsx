import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const PLACEHOLDER_ADDRESS = '0x0000000000000000000000000000000000000000';

interface AkashicCryptoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  userId: string;
  onPaymentSubmitted?: () => void;
}

export function AkashicCryptoModal({
  open,
  onOpenChange,
  amount,
  userId,
  onPaymentSubmitted,
}: AkashicCryptoModalProps) {
  const [submitting, setSubmitting] = useState(false);

  const handlePaymentSubmitted = async () => {
    setSubmitting(true);
    try {
      const { error } = await (supabase as any).from('pending_crypto_payments').insert({
        user_id: userId,
        amount,
        currency: 'USD',
        status: 'pending',
      });
      if (error) throw error;
      toast.success('Payment recorded. Your reading will be unlocked within 24 hours after confirmation.');
      onPaymentSubmitted?.();
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to record payment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-[#0a0a0a] border-[#D4AF37]/30 text-[#D4AF37]">
        <DialogHeader>
          <DialogTitle className="text-[#D4AF37]">Pay with Crypto</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <p className="text-white/80">
            Send <strong className="text-[#D4AF37]">${amount.toFixed(2)} USDC/USDT</strong> to:
          </p>
          <div className="p-3 rounded-lg bg-black/50 font-mono text-xs break-all border border-[#D4AF37]/20">
            {PLACEHOLDER_ADDRESS}
          </div>
          <p className="text-white/60 text-xs">
            Send the exact amount to this address. Your reading will be unlocked within 24 hours after confirmation.
          </p>
          <Button
            onClick={handlePaymentSubmitted}
            disabled={submitting}
            className="w-full bg-[#D4AF37] text-black hover:bg-[#D4AF37]/90"
          >
            {submitting ? 'Submitting...' : "I've sent payment"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
