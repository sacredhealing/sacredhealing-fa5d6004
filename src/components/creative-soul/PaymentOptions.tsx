import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Radio, Download, Loader2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface PaymentOptionsProps {
  affiliateId?: string | null;
  onPurchaseStart?: () => void;
  onPurchaseComplete?: () => void;
}

export function PaymentOptions({ affiliateId, onPurchaseStart, onPurchaseComplete }: PaymentOptionsProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const handlePurchase = async (option: 'one_time' | 'subscription' | 'per_track') => {
    if (!user) {
      toast.info('Please sign in to purchase');
      navigate('/auth');
      return;
    }

    setLoading(option);
    if (onPurchaseStart) {
      onPurchaseStart();
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-meditation-audio-checkout', {
        body: {
          option: option,
          ...(affiliateId && { affiliateId }),
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to create checkout session');
      }

      if (data?.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
        
        if (onPurchaseComplete) {
          onPurchaseComplete();
        }
      } else {
        throw new Error('No checkout URL returned from server');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.message || 'Failed to initiate payment. Please try again.');
      setLoading(null);
    }
  };

  const pricingOptions = [
    {
      id: 'one_time' as const,
      title: 'One-Time Unlock',
      price: '€149',
      coins: '+1000 Coins',
      description: 'Lifetime access with all features',
      icon: Crown,
      color: 'bg-green-600 hover:bg-green-700',
      textColor: 'text-white',
    },
    {
      id: 'subscription' as const,
      title: 'Monthly Subscription',
      price: '€9.99',
      coins: '+200 Coins/month',
      description: 'Cancel anytime, recurring billing',
      icon: Radio,
      color: 'bg-blue-600 hover:bg-blue-700',
      textColor: 'text-white',
    },
    {
      id: 'per_track' as const,
      title: 'Per-Track Generation',
      price: '€9.99',
      coins: '+100 Coins',
      description: 'Pay as you go, per conversion',
      icon: Download,
      color: 'bg-amber-400 hover:bg-amber-500',
      textColor: 'text-gray-900',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2 cursor-pointer hover:scale-105 transition-transform inline-block">
          Choose Your Plan
        </h2>
        <p className="text-muted-foreground">
          Select the payment option that works best for you
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {pricingOptions.map((option) => {
          const Icon = option.icon;
          const isLoading = loading === option.id;
          
          return (
            <Card
              key={option.id}
              className="border-2 hover:border-primary hover:shadow-xl transition-all cursor-pointer group hover:scale-105"
            >
              <CardHeader className="text-center pb-2">
                <div className={`w-16 h-16 rounded-full ${option.color} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-8 h-8 ${option.textColor}`} />
                </div>
                <CardTitle className="text-xl">{option.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <div>
                  <p className="text-3xl font-bold text-primary">{option.price}</p>
                  {option.id === 'subscription' && (
                    <p className="text-sm text-muted-foreground">per month</p>
                  )}
                  <p className="text-sm font-semibold text-amber-600 mt-1">{option.coins}</p>
                </div>
                <p className="text-sm text-muted-foreground">{option.description}</p>
                <Button
                  onClick={() => handlePurchase(option.id)}
                  disabled={isLoading}
                  className={`w-full ${option.color} ${option.textColor} cursor-pointer`}
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      {option.id === 'one_time' && 'Purchase Now'}
                      {option.id === 'subscription' && 'Subscribe Now'}
                      {option.id === 'per_track' && 'Pay Per Track'}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {affiliateId && (
        <div className="text-center text-sm text-muted-foreground mt-4">
          Affiliate tracking active: <span className="font-semibold">{affiliateId}</span>
        </div>
      )}

      <div className="text-center text-sm text-muted-foreground mt-6">
        <p>🔒 Secure payment processing by Stripe</p>
        <p>Coins are automatically credited after successful payment</p>
      </div>
    </div>
  );
}

