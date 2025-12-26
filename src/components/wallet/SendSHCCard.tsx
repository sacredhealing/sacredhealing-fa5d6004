import React, { useState } from 'react';
import { Send, User, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useSHC } from '@/contexts/SHCContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useSHCPrice } from '@/hooks/useSHCPrice';

export const SendSHCCard: React.FC = () => {
  const { t } = useTranslation();
  const { balance, refreshBalance } = useSHC();
  const { convertShcToEur, formatEur } = useSHCPrice();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSend = async () => {
    if (!recipient.trim() || !amount || parseFloat(amount) <= 0) {
      toast.error(t('wallet.invalidInput', 'Please enter a valid recipient and amount'));
      return;
    }

    const amountNum = parseFloat(amount);
    if (amountNum > (balance?.balance || 0)) {
      toast.error(t('wallet.insufficientBalance', 'Insufficient balance'));
      return;
    }

    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-shc-p2p', {
        body: { 
          recipientIdentifier: recipient.trim(),
          amount: amountNum,
          note: note.trim() || undefined,
        },
      });

      if (error) throw error;

      if (data.success) {
        setSuccess(true);
        toast.success(t('wallet.sentSuccess', 'SHC sent successfully!'));
        setRecipient('');
        setAmount('');
        setNote('');
        refreshBalance();
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Send error:', err);
      toast.error(err instanceof Error ? err.message : t('wallet.sendFailed', 'Failed to send SHC'));
    } finally {
      setIsSending(false);
    }
  };

  const eurValue = convertShcToEur(parseFloat(amount) || 0);

  return (
    <Card className="bg-gradient-card border-border/50 animate-fade-in">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Send className="h-5 w-5 text-primary" />
          {t('wallet.sendSHC', 'Send SHC')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {success ? (
          <div className="flex flex-col items-center py-8">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <p className="text-lg font-semibold text-green-500">
              {t('wallet.sentSuccess', 'SHC sent successfully!')}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="recipient" className="text-muted-foreground">
                {t('wallet.recipientLabel', 'Recipient (referral code or email)')}
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="recipient"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder={t('wallet.recipientPlaceholder', 'Enter referral code or email')}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount" className="text-muted-foreground">
                {t('wallet.amount', 'Amount')}
              </Label>
              <div className="relative">
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  min="1"
                  max={balance?.balance || 0}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs"
                  onClick={() => setAmount(String(balance?.balance || 0))}
                >
                  MAX
                </Button>
              </div>
              {amount && parseFloat(amount) > 0 && (
                <p className="text-xs text-muted-foreground">
                  ≈ {formatEur(eurValue)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="note" className="text-muted-foreground">
                {t('wallet.note', 'Note (optional)')}
              </Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t('wallet.notePlaceholder', 'Add a message...')}
                rows={2}
              />
            </div>

            <div className="p-3 rounded-xl bg-background/30 border border-border/30 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                {t('wallet.sendWarning', 'Make sure the recipient identifier is correct. Transfers cannot be reversed.')}
              </p>
            </div>

            <Button
              onClick={handleSend}
              disabled={isSending || !recipient || !amount || parseFloat(amount) <= 0}
              className="w-full"
              variant="gold"
            >
              {isSending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  {t('wallet.sendButton', 'Send SHC')}
                </>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};
