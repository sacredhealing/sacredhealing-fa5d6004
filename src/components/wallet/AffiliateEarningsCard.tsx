import React from 'react';
import { TrendingUp, DollarSign, Wallet, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAffiliate } from '@/hooks/useAffiliate';
import { useSHCPrice } from '@/hooks/useSHCPrice';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AnimatedCounter } from '@/components/ui/animated-counter';

export const AffiliateEarningsCard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, isLoading } = useAffiliate();
  const { convertShcToEur, formatEur, price, isLoading: priceLoading } = useSHCPrice();

  const totalEarnings = data?.totalEarnings || 0;
  const eurValue = convertShcToEur(totalEarnings);

  if (isLoading) {
    return (
      <Card className="bg-gradient-healing border-border/50">
        <CardContent className="p-6">
          <div className="animate-pulse h-24 bg-muted/30 rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-healing border-border/50 glow-purple animate-fade-in">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5 text-secondary" />
          {t('wallet.affiliateEarnings', 'Affiliate Earnings')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2 mb-2">
          <AnimatedCounter 
            value={totalEarnings}
            className="text-4xl font-heading font-bold text-foreground"
          />
          <span className="text-xl text-accent font-medium">SHC</span>
        </div>
        
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span className="text-lg text-secondary font-semibold">
            {priceLoading ? '...' : formatEur(eurValue)}
          </span>
          {price && !price.fallback && (
            <span className="text-xs text-muted-foreground">
              (1 SHC = {formatEur(price.priceEur)})
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-background/30 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-accent">{data?.pendingEarnings || 0}</p>
            <p className="text-xs text-muted-foreground">{t('wallet.pending', 'Pending')}</p>
          </div>
          <div className="bg-background/30 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-green-500">{data?.paidEarnings || 0}</p>
            <p className="text-xs text-muted-foreground">{t('wallet.paid', 'Paid Out')}</p>
          </div>
        </div>

        <Button 
          onClick={() => navigate('/promote')} 
          variant="outline" 
          className="w-full"
        >
          <Wallet className="h-4 w-4 mr-2" />
          {t('wallet.viewPromotePage', 'View Promote Page')}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
};
