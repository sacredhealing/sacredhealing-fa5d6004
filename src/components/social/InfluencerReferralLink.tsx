import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Check, Users, TrendingUp, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface InfluencerPartner {
  id: string;
  name: string;
  referral_code: string;
  commission_rate: number;
  total_referrals: number;
  total_revenue: number;
}

interface InfluencerReferralLinkProps {
  referralCode: string;
}

export const InfluencerReferralLink: React.FC<InfluencerReferralLinkProps> = ({ referralCode }) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [partner, setPartner] = useState<InfluencerPartner | null>(null);

  const referralUrl = `https://sacredhealing.lovable.app/?ref=${referralCode}&utm_source=influencer&utm_medium=referral&utm_campaign=${referralCode}`;

  useEffect(() => {
    const fetchPartner = async () => {
      const { data } = await supabase
        .from('influencer_partners')
        .select('*')
        .eq('referral_code', referralCode)
        .single();
      
      if (data) {
        setPartner(data as InfluencerPartner);
      }
    };

    if (referralCode) {
      fetchPartner();
    }
  }, [referralCode]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      toast.success('Link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  if (!partner) return null;

  const stats = [
    {
      icon: Users,
      value: partner.total_referrals,
      label: 'Referrals',
      color: 'text-blue-400',
    },
    {
      icon: DollarSign,
      value: `€${partner.total_revenue.toFixed(0)}`,
      label: 'Revenue',
      color: 'text-green-400',
    },
    {
      icon: TrendingUp,
      value: `${(partner.commission_rate * 100).toFixed(0)}%`,
      label: 'Commission',
      color: 'text-purple-400',
    },
  ];

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Partner Dashboard</span>
          <Badge variant="outline" className="text-primary border-primary">
            {partner.name}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {stats.map((stat) => (
            <div 
              key={stat.label}
              className="text-center p-3 rounded-xl bg-background/50"
            >
              <stat.icon className={`w-5 h-5 ${stat.color} mx-auto mb-1`} />
              <p className="text-lg font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Referral Link */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Your Referral Link
          </label>
          <div className="flex gap-2">
            <Input 
              value={referralUrl}
              readOnly
              className="bg-background/50 text-sm"
            />
            <Button onClick={copyLink} variant="outline" size="icon">
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* UTM Breakdown */}
        <div className="p-4 rounded-xl bg-background/30 border border-border/50">
          <h4 className="text-sm font-medium text-foreground mb-2">UTM Parameters</h4>
          <div className="space-y-1 text-xs text-muted-foreground">
            <p><span className="text-primary">source:</span> influencer</p>
            <p><span className="text-primary">medium:</span> referral</p>
            <p><span className="text-primary">campaign:</span> {referralCode}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
