import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, Copy, Share2, Users, DollarSign, 
  TrendingUp, CheckCircle, Clock, Megaphone, Heart,
  Sparkles, Target, Award, Edit3, Save, X, Wallet, ArrowRight, Check, Percent
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAffiliate } from '@/hooks/useAffiliate';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSHCPrice } from '@/hooks/useSHCPrice';
import { useSiteContent } from '@/hooks/useSiteContent';

const AffiliateDetail: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, isLoading, getReferralLink, refetch } = useAffiliate();
  const { toast } = useToast();
  const { convertShcToEur, formatEur } = useSHCPrice();
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [customCode, setCustomCode] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Fetch editable content
  const { content } = useSiteContent([
    'affiliate_title',
    'affiliate_subtitle',
    'affiliate_description',
    'affiliate_step1',
    'affiliate_step2',
    'affiliate_step3',
    'affiliate_step4',
  ]);

  const referralLink = getReferralLink();
  const totalEarnings = data?.totalEarnings || 0;
  const eurValue = convertShcToEur(totalEarnings);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast({
        title: t('affiliate.linkCopied', 'Link Copied!'),
        description: t('affiliate.linkCopiedDesc', 'Your referral link has been copied to clipboard'),
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: t('affiliate.failedToCopy', 'Failed to copy'),
        description: t('affiliate.copyManually', 'Please copy the link manually'),
        variant: "destructive",
      });
    }
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Sacred Healing',
          text: t('affiliate.shareText', 'Start your healing journey and earn rewards! Use my referral link:'),
          url: referralLink,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      copyToClipboard();
    }
  };

  const startEditing = () => {
    setCustomCode(data?.referralCode || '');
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setCustomCode('');
  };

  const saveCustomCode = async () => {
    if (!user || !customCode.trim()) return;
    
    const sanitized = customCode.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (sanitized.length < 3 || sanitized.length > 30) {
      toast({
        title: t('affiliate.invalidCode', 'Invalid Code'),
        description: t('affiliate.codeRequirements', 'Code must be 3-30 characters (letters, numbers, hyphens, underscores)'),
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { data: existing } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('referral_code', sanitized)
        .neq('user_id', user.id)
        .single();

      if (existing) {
        toast({
          title: t('affiliate.codeTaken', 'Code Taken'),
          description: t('affiliate.codeTakenDesc', 'This referral code is already in use. Try another one.'),
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ referral_code: sanitized })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: t('affiliate.codeUpdated', 'Code Updated!'),
        description: `${t('affiliate.newCode', 'Your new referral code is')}: ${sanitized}`,
      });
      setIsEditing(false);
      refetch();
    } catch (error) {
      console.error('Error updating referral code:', error);
      toast({
        title: t('common.error', 'Error'),
        description: t('affiliate.updateError', 'Failed to update referral code. Please try again.'),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="px-4 pt-4 pb-6">
        <Link to="/income-streams" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">{t('common.back', 'Back to Income Streams')}</span>
        </Link>
        
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
            <Users className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {content['affiliate_title'] || t('affiliate.title', 'Affiliate Program')}
            </h1>
            <p className="text-sm text-muted-foreground">
              {content['affiliate_subtitle'] || t('affiliate.subtitle', 'Share & Earn Rewards')}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-6">
        {/* Key Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/10 border-green-500/30">
            <CardContent className="p-3 text-center">
              <Percent className="w-5 h-5 text-green-500 mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">{t('affiliate.commission', 'Commission')}</p>
              <p className="font-bold text-foreground text-sm">30%</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border-blue-500/30">
            <CardContent className="p-3 text-center">
              <Users className="w-5 h-5 text-blue-500 mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">{t('affiliate.referrals', 'Referrals')}</p>
              <p className="font-bold text-foreground text-sm">{data?.totalReferrals || 0}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/10 border-purple-500/30">
            <CardContent className="p-3 text-center">
              <TrendingUp className="w-5 h-5 text-purple-500 mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">{t('affiliate.earned', 'Earned')}</p>
              <p className="font-bold text-foreground text-sm">{totalEarnings} SHC</p>
            </CardContent>
          </Card>
        </div>

        {/* Withdraw Earnings Card */}
        {totalEarnings > 0 && (
          <Card className="bg-gradient-to-r from-secondary/20 to-primary/20 border-secondary/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('affiliate.yourEarnings', 'Your Earnings')}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-foreground">{totalEarnings}</span>
                    <span className="text-accent">SHC</span>
                  </div>
                  <p className="text-sm text-secondary font-medium">≈ {formatEur(eurValue)}</p>
                </div>
                <Button 
                  onClick={() => navigate('/wallet?tab=affiliate')} 
                  className="bg-gradient-to-r from-[hsl(51,100%,50%)] to-[hsl(45,100%,45%)] text-gray-900 font-extrabold shadow-[0_0_20px_hsl(51_100%_50%/0.5)] hover:shadow-[0_0_30px_hsl(51_100%_50%/0.6)] border-0"
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  {t('affiliate.withdraw', 'Withdraw')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Description */}
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <p className="text-muted-foreground">
              {content['affiliate_description'] || t('affiliate.description', 'Earn commissions by referring new users to the platform. When someone signs up using your unique referral link and makes a purchase, you earn a percentage of their transaction.')}
            </p>
          </CardContent>
        </Card>

        {/* Referral Link Card */}
        <Card className="bg-gradient-healing border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-secondary" />
              {t('affiliate.yourReferralLink', 'Your Referral Link')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-background/50 rounded-xl p-4 mb-4">
              <p className="text-sm text-muted-foreground mb-2">{t('affiliate.shareThisLink', 'Share this link')}:</p>
              <p className="text-foreground font-mono text-sm break-all">{referralLink}</p>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={copyToClipboard} 
                className="flex-1 bg-[#00F2FE] text-black font-extrabold hover:bg-[#00D4E0] shadow-[0_0_25px_rgba(0,242,254,0.5)] border-0"
              >
                {copied ? <CheckCircle className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {copied ? t('affiliate.copied', 'Copied!') : t('affiliate.copyLink', 'Copy Link')}
              </Button>
              <Button 
                onClick={shareLink} 
                className="flex-1 bg-gradient-to-r from-[hsl(51,100%,50%)] to-[hsl(45,100%,45%)] text-gray-900 font-extrabold shadow-[0_0_20px_hsl(51_100%_50%/0.5)] hover:shadow-[0_0_30px_hsl(51_100%_50%/0.6)] border-0"
              >
                <Share2 className="h-4 w-4 mr-2" />
                {t('affiliate.share', 'Share')}
              </Button>
            </div>
            
            {/* Editable Referral Code */}
            <div className="mt-4 p-3 rounded-xl bg-background/30 border border-border/30">
              {isEditing ? (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">{t('affiliate.customizeCode', 'Customize your referral code')}:</p>
                  <Input
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                    placeholder="your-name"
                    className="font-mono text-sm bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    maxLength={30}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('affiliate.codeRules', 'Only letters, numbers, hyphens, and underscores. 3-30 characters.')}
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      onClick={saveCustomCode} 
                      size="sm" 
                      disabled={isSaving || customCode.length < 3}
                      className="flex-1 bg-[#00F2FE] text-black font-extrabold hover:bg-[#00D4E0] shadow-[0_0_15px_rgba(0,242,254,0.4)] border-0"
                    >
                      {isSaving ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                      ) : (
                        <>
                          <Save className="h-3 w-3 mr-1" />
                          {t('common.save', 'Save')}
                        </>
                      )}
                    </Button>
                    <Button 
                      onClick={cancelEditing} 
                      size="sm" 
                      className="flex-1 bg-white/10 text-white border border-white/20 hover:bg-white/20"
                    >
                      <X className="h-3 w-3 mr-1" />
                      {t('common.cancel', 'Cancel')}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{t('affiliate.yourCode', 'Your code')}:</p>
                    <p className="font-mono font-bold text-primary">{data?.referralCode}</p>
                  </div>
                  <Button 
                    onClick={startEditing} 
                    size="sm" 
                    className="bg-white/10 text-white border border-white/20 hover:bg-white/20"
                  >
                    <Edit3 className="h-4 w-4 mr-1" />
                    {t('affiliate.customize', 'Customize')}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">🔗 {t('affiliate.howItWorks', 'How It Works')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              {[
                { step: 1, title: t('affiliate.getLink', 'Get Your Link'), desc: content['affiliate_step1'] || t('affiliate.step1Desc', 'Copy your unique referral link above.') },
                { step: 2, title: t('affiliate.shareIt', 'Share It'), desc: content['affiliate_step2'] || t('affiliate.step2Desc', 'Share your link with friends, on social media, or your website.') },
                { step: 3, title: t('affiliate.earnCommissions', 'Earn Commissions'), desc: content['affiliate_step3'] || t('affiliate.step3Desc', 'When someone signs up and makes a purchase, you earn a commission.') },
                { step: 4, title: t('affiliate.getPaid', 'Get Paid'), desc: content['affiliate_step4'] || t('affiliate.step4Desc', 'Withdraw your earnings via bank transfer or crypto wallet.') },
              ].map((item) => (
                <li key={item.step} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 font-semibold text-sm">
                    {item.step}
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        {/* SQI 2050: Commission Matrix */}
        <div className="mt-10 space-y-4">
          <h4 className="text-[#D4AF37] text-[10px] font-black tracking-[0.4em] uppercase">Commission Matrix</h4>
          <div className="grid grid-cols-1 gap-3">
            {[
              { name: "Prana-Flow", reward: "€5/mo", color: "white" },
              { name: "Siddha-Quantum", reward: "€15/mo", color: "#D4AF37" },
              { name: "Akasha-Infinity", reward: "€250", color: "#D4AF37" },
            ].map((item) => (
              <div
                key={item.name}
                className="flex justify-between items-center p-4 rounded-2xl bg-white/[0.02] border border-white/5"
              >
                <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest">{item.name}</span>
                <span className="text-[#D4AF37] text-xs font-black italic">{item.reward}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Promotion Tips */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-accent" />
              {t('affiliate.promotionTips', 'Promotion Tips')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { tip: t('affiliate.tip1', 'Share your unique link on social media'), icon: Share2 },
              { tip: t('affiliate.tip2', 'Tell friends about your healing journey'), icon: Heart },
              { tip: t('affiliate.tip3', 'Include link in your bio or signature'), icon: Target },
              { tip: t('affiliate.tip4', 'Create content about Sacred Healing'), icon: Megaphone },
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-background/50">
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                  <item.icon className="h-4 w-4 text-accent" />
                </div>
                <span className="text-foreground text-sm">{item.tip}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Referrals */}
        {(data?.recentReferrals?.length || 0) > 0 && (
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                {t('affiliate.recentReferrals', 'Recent Referrals')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data?.recentReferrals.map((referral) => (
                <div key={referral.id} className="flex items-center justify-between p-3 rounded-xl bg-background/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm text-foreground">{t('affiliate.newSignup', 'New signup')}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(referral.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-secondary">+{referral.signup_bonus_shc} SHC</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Earnings History */}
        {(data?.earningsHistory?.length || 0) > 0 && (
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-secondary" />
                {t('affiliate.earningsHistory', 'Earnings History')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data?.earningsHistory.map((earning) => (
                <div key={earning.id} className="flex items-center justify-between p-3 rounded-xl bg-background/50">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      earning.status === 'paid' ? 'bg-green-500/20' : 'bg-yellow-500/20'
                    }`}>
                      {earning.status === 'paid' ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Clock className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-foreground capitalize">{earning.purchase_type}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(earning.created_at).toLocaleDateString()} • {earning.status}
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-secondary">+{earning.commission_shc} SHC</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Main CTA */}
        <Button 
          onClick={shareLink} 
          className="w-full bg-gradient-to-r from-[hsl(51,100%,50%)] to-[hsl(45,100%,45%)] text-gray-900 font-extrabold shadow-[0_0_20px_hsl(51_100%_50%/0.5)] hover:shadow-[0_0_30px_hsl(51_100%_50%/0.6)] border-0" 
          size="lg"
        >
          <Share2 className="w-4 h-4 mr-2" />
          {t('affiliate.shareNow', 'Share Your Link Now')}
        </Button>
      </div>
    </div>
  );
};

export default AffiliateDetail;
