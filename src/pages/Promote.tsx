import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Copy, Share2, Users, DollarSign, Gift, 
  TrendingUp, CheckCircle, Clock, Megaphone, Heart,
  Sparkles, Target, Award, Edit3, Save, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAffiliate } from '@/hooks/useAffiliate';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const Promote: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, isLoading, getReferralLink, refetch } = useAffiliate();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [customCode, setCustomCode] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const referralLink = getReferralLink();

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast({
        title: "Link Copied!",
        description: "Your referral link has been copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually",
        variant: "destructive",
      });
    }
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Sacred Healing',
          text: 'Start your healing journey and earn rewards! Use my referral link:',
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
    
    // Validate: only alphanumeric, hyphens, underscores, 3-30 chars
    const sanitized = customCode.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (sanitized.length < 3 || sanitized.length > 30) {
      toast({
        title: "Invalid Code",
        description: "Code must be 3-30 characters (letters, numbers, hyphens, underscores)",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      // Check if code is already taken
      const { data: existing } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('referral_code', sanitized)
        .neq('user_id', user.id)
        .single();

      if (existing) {
        toast({
          title: "Code Taken",
          description: "This referral code is already in use. Try another one.",
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }

      // Update the code
      const { error } = await supabase
        .from('profiles')
        .update({ referral_code: sanitized })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Code Updated!",
        description: `Your new referral code is: ${sanitized}`,
      });
      setIsEditing(false);
      refetch();
    } catch (error) {
      console.error('Error updating referral code:', error);
      toast({
        title: "Error",
        description: "Failed to update referral code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const commissionTiers = [
    { type: 'New User Signup', reward: '100 SHC', icon: Users },
    { type: 'Music Purchase', reward: '30% commission', icon: DollarSign },
    { type: 'Course Enrollment', reward: '30% commission', icon: Award },
    { type: 'Healing Subscription', reward: '30% commission', icon: Heart },
  ];

  const promotionTips = [
    { tip: 'Share your unique link on social media', icon: Share2 },
    { tip: 'Tell friends about your healing journey', icon: Heart },
    { tip: 'Include link in your bio or signature', icon: Target },
    { tip: 'Create content about Sacred Healing', icon: Megaphone },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 pt-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Promote & Earn</h1>
          <p className="text-muted-foreground text-sm">Share Sacred Healing and earn rewards</p>
        </div>
      </div>

      {/* Referral Link Card */}
      <Card className="mb-6 bg-gradient-healing border-border/50 glow-purple animate-fade-in">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-secondary" />
            Your Referral Link
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-background/50 rounded-xl p-4 mb-4">
            <p className="text-sm text-muted-foreground mb-2">Share this link:</p>
            <p className="text-foreground font-mono text-sm break-all">{referralLink}</p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={copyToClipboard} 
              variant="outline" 
              className="flex-1"
            >
              {copied ? <CheckCircle className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
              {copied ? 'Copied!' : 'Copy Link'}
            </Button>
            <Button onClick={shareLink} variant="gold" className="flex-1">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
          
          {/* Editable Referral Code */}
          <div className="mt-4 p-3 rounded-xl bg-background/30 border border-border/30">
            {isEditing ? (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">Customize your referral code:</p>
                <Input
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                  placeholder="your-name"
                  className="font-mono text-sm"
                  maxLength={30}
                />
                <p className="text-xs text-muted-foreground">
                  Only letters, numbers, hyphens, and underscores. 3-30 characters.
                </p>
                <div className="flex gap-2">
                  <Button 
                    onClick={saveCustomCode} 
                    size="sm" 
                    disabled={isSaving || customCode.length < 3}
                    className="flex-1"
                  >
                    {isSaving ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                    ) : (
                      <>
                        <Save className="h-3 w-3 mr-1" />
                        Save
                      </>
                    )}
                  </Button>
                  <Button onClick={cancelEditing} size="sm" variant="outline" className="flex-1">
                    <X className="h-3 w-3 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Your code:</p>
                  <p className="font-mono font-bold text-primary">{data?.referralCode}</p>
                </div>
                <Button onClick={startEditing} size="sm" variant="ghost">
                  <Edit3 className="h-4 w-4 mr-1" />
                  Customize
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6 animate-slide-up">
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="text-3xl font-heading font-bold text-foreground">{data?.totalReferrals || 0}</p>
            <p className="text-xs text-muted-foreground">Total Referrals</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 text-secondary" />
            <p className="text-3xl font-heading font-bold text-secondary">{data?.totalEarnings || 0}</p>
            <p className="text-xs text-muted-foreground">Total Earned (SHC)</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 mx-auto mb-2 text-accent" />
            <p className="text-3xl font-heading font-bold text-accent">{data?.pendingEarnings || 0}</p>
            <p className="text-xs text-muted-foreground">Pending (SHC)</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <p className="text-3xl font-heading font-bold text-green-500">{data?.paidEarnings || 0}</p>
            <p className="text-xs text-muted-foreground">Paid Out (SHC)</p>
          </CardContent>
        </Card>
      </div>

      {/* Commission Structure */}
      <Card className="mb-6 bg-gradient-card border-border/50 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-secondary" />
            How You Earn
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {commissionTiers.map((tier, index) => (
            <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-background/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <tier.icon className="h-5 w-5 text-primary" />
                </div>
                <span className="text-foreground">{tier.type}</span>
              </div>
              <span className="font-bold text-secondary">{tier.reward}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Promotion Tips */}
      <Card className="mb-6 bg-gradient-card border-border/50 animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-accent" />
            Promotion Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {promotionTips.map((item, index) => (
            <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-background/50">
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                <item.icon className="h-4 w-4 text-accent" />
              </div>
              <span className="text-foreground text-sm">{item.tip}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      {(data?.recentReferrals?.length || 0) > 0 && (
        <Card className="mb-6 bg-gradient-card border-border/50 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Recent Referrals
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
                    <p className="text-sm text-foreground">New signup</p>
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
        <Card className="bg-gradient-card border-border/50 animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-secondary" />
              Earnings History
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
    </div>
  );
};

export default Promote;
