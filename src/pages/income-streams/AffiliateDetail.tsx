import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import {
  ArrowLeft, Copy, Share2, Users, DollarSign,
  TrendingUp, CheckCircle, Clock, Megaphone, Heart,
  Sparkles, Target, Edit3, Save, X, Wallet, Percent
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAffiliate } from '@/hooks/useAffiliate';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSHCPrice } from '@/hooks/useSHCPrice';
import { useSiteContent } from '@/hooks/useSiteContent';

const G = '#D4AF37';
const BG = '#050505';
const CYAN = '#22D3EE';
const GLASS = 'rgba(255,255,255,0.02)';
const GLASS_B = 'rgba(255,255,255,0.05)';

const SQI_AFFILIATE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap');
.sqi-aff{font-family:'Plus Jakarta Sans',system-ui,sans-serif;min-height:100vh;background:${BG};color:#fff;position:relative;overflow-x:hidden;padding-bottom:120px;}
.sqi-aff::before{content:'';position:fixed;inset:0;z-index:0;pointer-events:none;
  background:radial-gradient(ellipse 80% 50% at 50% -15%,rgba(212,175,55,0.07) 0%,transparent 55%),
    radial-gradient(ellipse 50% 40% at 90% 90%,rgba(34,211,238,0.04) 0%,transparent 45%);}
.sqi-aff-z{position:relative;z-index:1;}
.sqi-aff-glass{
  background:${GLASS};backdrop-filter:blur(40px);-webkit-backdrop-filter:blur(40px);
  border:1px solid ${GLASS_B};border-radius:40px;
}
.sqi-aff-gold-ring{
  background:${GLASS};backdrop-filter:blur(40px);-webkit-backdrop-filter:blur(40px);
  border:1px solid rgba(212,175,55,0.22);border-radius:40px;
  box-shadow:0 0 30px rgba(212,175,55,0.08);
}
.sqi-aff-gold-ring::before{
  content:'';position:absolute;top:0;left:0;right:0;height:1px;border-radius:40px 40px 0 0;
  background:linear-gradient(90deg,transparent,rgba(212,175,55,0.35),transparent);
}
.sqi-aff-label{font-size:8px;font-weight:800;letter-spacing:0.5em;text-transform:uppercase;color:rgba(255,255,255,0.32);}
.sqi-aff-title{font-weight:900;letter-spacing:-0.05em;color:${G};text-shadow:0 0 18px rgba(212,175,55,0.28);}
.sqi-aff-body{font-weight:400;line-height:1.6;color:rgba(255,255,255,0.58);font-size:13px;}
.sqi-aff-back{display:inline-flex;align-items:center;gap:8px;color:rgba(255,255,255,0.38);font-size:12px;font-weight:600;transition:color .2s;}
.sqi-aff-back:hover{color:${G};}
.sqi-aff-stat-icon{width:44px;height:44px;border-radius:18px;display:flex;align-items:center;justify-content:center;
  background:rgba(212,175,55,0.08);border:1px solid rgba(212,175,55,0.18);margin:0 auto 10px;}
`;

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
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <div className="h-10 w-10 rounded-full border-2 border-[#D4AF37]/30 border-t-[#D4AF37] animate-spin" />
      </div>
    );
  }

  return (
    <>
      <style>{SQI_AFFILIATE_CSS}</style>
      <div className="sqi-aff">
        <div className="sqi-aff-z px-4 pt-5 pb-8 max-w-lg mx-auto">
          <Link to="/income-streams" className="sqi-aff-back mb-6">
            <ArrowLeft className="w-4 h-4" strokeWidth={2} />
            <span>{t('common.back', 'Back to Income Streams')}</span>
          </Link>

          <div className="flex items-start gap-4 mb-8">
            <div
              className="w-[60px] h-[60px] rounded-[22px] shrink-0 flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(212,175,55,0.22), rgba(212,175,55,0.06))',
                border: '1px solid rgba(212,175,55,0.35)',
                boxShadow: '0 0 28px rgba(212,175,55,0.2)',
              }}
            >
              <Users className="w-8 h-8" style={{ color: G }} strokeWidth={2} />
            </div>
            <div className="min-w-0 pt-1">
              <p className="sqi-aff-label mb-2">◈ Prema-Pulse · Vedic Light-Code</p>
              <h1 className="sqi-aff-title text-2xl sm:text-[1.65rem] leading-tight">
                {content['affiliate_title'] || t('affiliate.title', 'Affiliate Program')}
              </h1>
              <p className="sqi-aff-body mt-2 text-sm">
                {content['affiliate_subtitle'] || t('affiliate.subtitle', 'Share & Earn Rewards')}
              </p>
            </div>
          </div>

          {/* Key Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { icon: Percent, label: t('affiliate.commission', 'Commission'), value: '30%' },
              { icon: Users, label: t('affiliate.referrals', 'Referrals'), value: String(data?.totalReferrals || 0) },
              { icon: TrendingUp, label: t('affiliate.earned', 'Earned'), value: `${totalEarnings} SHC` },
            ].map((s, i) => (
              <div key={i} className="sqi-aff-glass p-3 text-center relative overflow-hidden" style={{ borderRadius: '28px' }}>
                <div className="sqi-aff-stat-icon">
                  <s.icon className="w-5 h-5" style={{ color: G }} />
                </div>
                <p className="sqi-aff-label !text-[7px] !tracking-[0.35em] mb-1">{s.label}</p>
                <p className="font-black text-sm tracking-tight" style={{ color: '#fff' }}>{s.value}</p>
              </div>
            ))}
          </div>

          {totalEarnings > 0 && (
            <div className="sqi-aff-gold-ring relative p-5 mb-6 overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="sqi-aff-label mb-2">{t('affiliate.yourEarnings', 'Your Earnings')}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black tracking-tight sqi-aff-title !text-3xl">{totalEarnings}</span>
                    <span className="font-bold" style={{ color: G }}>SHC</span>
                  </div>
                  <p className="text-sm font-semibold mt-1" style={{ color: CYAN }}>≈ {formatEur(eurValue)}</p>
                </div>
                <Button
                  onClick={() => navigate('/wallet?tab=affiliate')}
                  className="rounded-full font-extrabold text-[#050505] shadow-[0_0_28px_rgba(212,175,55,0.4)] hover:shadow-[0_0_40px_rgba(212,175,55,0.55)] border-0 shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${G}, #e8c547)`,
                  }}
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  {t('affiliate.withdraw', 'Withdraw')}
                </Button>
              </div>
            </div>
          )}

          <div className="sqi-aff-glass p-5 mb-6" style={{ borderRadius: '40px' }}>
            <p className="sqi-aff-body">
              {content['affiliate_description'] || t('affiliate.description', 'Earn commissions by referring new users to the platform. When someone signs up using your unique referral link and makes a purchase, you earn a percentage of their transaction.')}
            </p>
          </div>

          {/* Referral Link */}
          <div className="sqi-aff-gold-ring relative p-5 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 shrink-0" style={{ color: G }} />
              <h2 className="sqi-aff-title text-lg tracking-tight">
                {t('affiliate.yourReferralLink', 'Your Referral Link')}
              </h2>
            </div>
            <p className="sqi-aff-label mb-2">{t('affiliate.shareThisLink', 'Share this link')}</p>
            <div
              className="rounded-[20px] p-4 mb-5 font-mono text-xs break-all"
              style={{ background: 'rgba(0,0,0,0.45)', border: `1px solid ${GLASS_B}` }}
            >
              {referralLink}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={copyToClipboard}
                className="flex-1 rounded-full font-extrabold text-[#050505] border-0 h-12"
                style={{
                  background: copied ? 'rgba(46,204,113,0.9)' : `linear-gradient(135deg, ${CYAN}, #06b6d4)`,
                  boxShadow: copied ? undefined : '0 0 24px rgba(34,211,238,0.35)',
                }}
              >
                {copied ? <CheckCircle className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {copied ? t('affiliate.copied', 'Copied!') : t('affiliate.copyLink', 'Copy Link')}
              </Button>
              <Button
                onClick={shareLink}
                className="flex-1 rounded-full font-extrabold text-[#050505] border-0 h-12 shadow-[0_0_28px_rgba(212,175,55,0.35)]"
                style={{ background: `linear-gradient(135deg, ${G}, #e8c547)` }}
              >
                <Share2 className="h-4 w-4 mr-2" />
                {t('affiliate.share', 'Share')}
              </Button>
            </div>

            <div className="mt-5 p-4 rounded-[24px]" style={{ background: 'rgba(0,0,0,0.35)', border: `1px solid ${GLASS_B}` }}>
              {isEditing ? (
                <div className="space-y-3">
                  <p className="sqi-aff-label !tracking-[0.3em]">{t('affiliate.customizeCode', 'Customize your referral code')}</p>
                  <Input
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                    placeholder="your-name"
                    className="font-mono text-sm rounded-2xl h-11 bg-black/40 border-white/10 text-white placeholder:text-white/35"
                    maxLength={30}
                  />
                  <p className="text-[11px] text-white/45">
                    {t('affiliate.codeRules', 'Only letters, numbers, hyphens, and underscores. 3-30 characters.')}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={saveCustomCode}
                      size="sm"
                      disabled={isSaving || customCode.length < 3}
                      className="flex-1 rounded-full font-extrabold text-[#050505] border-0"
                      style={{ background: `linear-gradient(135deg, ${CYAN}, #06b6d4)` }}
                    >
                      {isSaving ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#050505] border-t-transparent" />
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
                      variant="outline"
                      className="flex-1 rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10"
                    >
                      <X className="h-3 w-3 mr-1" />
                      {t('common.cancel', 'Cancel')}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <p className="sqi-aff-label mb-1">{t('affiliate.yourCode', 'Your code')}</p>
                    <p className="font-mono font-black text-base" style={{ color: G }}>{data?.referralCode}</p>
                  </div>
                  <Button
                    onClick={startEditing}
                    size="sm"
                    variant="outline"
                    className="rounded-full border-[#D4AF37]/35 bg-[#D4AF37]/10 text-[#D4AF37] hover:bg-[#D4AF37]/18"
                  >
                    <Edit3 className="h-4 w-4 mr-1" />
                    {t('affiliate.customize', 'Customize')}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* How It Works */}
          <div className="sqi-aff-glass p-5 mb-6" style={{ borderRadius: '40px' }}>
            <h3 className="sqi-aff-title text-base mb-5 flex items-center gap-2">
              <span className="opacity-90">🔗</span>
              {t('affiliate.howItWorks', 'How It Works')}
            </h3>
            <ol className="space-y-5">
              {[
                { step: 1, title: t('affiliate.getLink', 'Get Your Link'), desc: content['affiliate_step1'] || t('affiliate.step1Desc', 'Copy your unique referral link above.') },
                { step: 2, title: t('affiliate.shareIt', 'Share It'), desc: content['affiliate_step2'] || t('affiliate.step2Desc', 'Share your link with friends, on social media, or your website.') },
                { step: 3, title: t('affiliate.earnCommissions', 'Earn Commissions'), desc: content['affiliate_step3'] || t('affiliate.step3Desc', 'When someone signs up and makes a purchase, you earn a commission.') },
                { step: 4, title: t('affiliate.getPaid', 'Get Paid'), desc: content['affiliate_step4'] || t('affiliate.step4Desc', 'Withdraw your earnings via bank transfer or crypto wallet.') },
              ].map((item) => (
                <li key={item.step} className="flex gap-4">
                  <div
                    className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center font-black text-sm"
                    style={{
                      background: 'rgba(212,175,55,0.12)',
                      border: '1px solid rgba(212,175,55,0.28)',
                      color: G,
                    }}
                  >
                    {item.step}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm tracking-tight">{item.title}</h4>
                    <p className="sqi-aff-body text-[12px] mt-1">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Commission Matrix */}
          <div className="mb-6">
            <h4 className="sqi-aff-label mb-3 pl-1">Bhakti-Algorithm · Commission Matrix</h4>
            <div className="space-y-3">
              {[
                { name: 'Prana-Flow', reward: '€5/mo' },
                { name: 'Siddha-Quantum', reward: '€15/mo' },
                { name: 'Akasha-Infinity', reward: '€250' },
              ].map((item) => (
                <div
                  key={item.name}
                  className="sqi-aff-glass flex justify-between items-center px-5 py-4"
                  style={{ borderRadius: '40px' }}
                >
                  <span className="sqi-aff-label !text-[9px] !tracking-[0.28em] text-white/55">{item.name}</span>
                  <span className="font-black text-sm italic" style={{ color: G }}>{item.reward}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Promotion Tips */}
          <div className="sqi-aff-glass p-5 mb-6" style={{ borderRadius: '40px' }}>
            <h3 className="sqi-aff-title text-base mb-4 flex items-center gap-2">
              <Megaphone className="h-5 w-5" style={{ color: G }} />
              {t('affiliate.promotionTips', 'Promotion Tips')}
            </h3>
            <div className="space-y-3">
              {[
                { tip: t('affiliate.tip1', 'Share your unique link on social media'), icon: Share2 },
                { tip: t('affiliate.tip2', 'Tell friends about your healing journey'), icon: Heart },
                { tip: t('affiliate.tip3', 'Include link in your bio or signature'), icon: Target },
                { tip: t('affiliate.tip4', 'Create content about Sacred Healing'), icon: Megaphone },
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-[24px]"
                  style={{ background: 'rgba(0,0,0,0.35)', border: `1px solid ${GLASS_B}` }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)' }}
                  >
                    <item.icon className="h-4 w-4" style={{ color: G }} />
                  </div>
                  <span className="text-white/85 text-sm font-medium leading-snug">{item.tip}</span>
                </div>
              ))}
            </div>
          </div>

          {(data?.recentReferrals?.length || 0) > 0 && (
            <div className="sqi-aff-glass p-5 mb-6" style={{ borderRadius: '40px' }}>
              <h3 className="sqi-aff-title text-base mb-4 flex items-center gap-2">
                <Users className="h-5 w-5" style={{ color: G }} />
                {t('affiliate.recentReferrals', 'Recent Referrals')}
              </h3>
              <div className="space-y-2">
                {data?.recentReferrals.map((referral) => (
                  <div
                    key={referral.id}
                    className="flex items-center justify-between p-3 rounded-[24px]"
                    style={{ background: 'rgba(0,0,0,0.35)', border: `1px solid ${GLASS_B}` }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center bg-emerald-500/15 border border-emerald-500/25">
                        <CheckCircle className="h-4 w-4 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-sm text-white font-medium">{t('affiliate.newSignup', 'New signup')}</p>
                        <p className="text-xs text-white/45">
                          {new Date(referral.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className="font-black text-sm" style={{ color: G }}>+{referral.signup_bonus_shc} SHC</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(data?.earningsHistory?.length || 0) > 0 && (
            <div className="sqi-aff-glass p-5 mb-8" style={{ borderRadius: '40px' }}>
              <h3 className="sqi-aff-title text-base mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5" style={{ color: G }} />
                {t('affiliate.earningsHistory', 'Earnings History')}
              </h3>
              <div className="space-y-2">
                {data?.earningsHistory.map((earning) => (
                  <div
                    key={earning.id}
                    className="flex items-center justify-between p-3 rounded-[24px]"
                    style={{ background: 'rgba(0,0,0,0.35)', border: `1px solid ${GLASS_B}` }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                        earning.status === 'paid' ? 'bg-emerald-500/15 border border-emerald-500/25' : 'bg-amber-500/12 border border-amber-500/25'
                      }`}>
                        {earning.status === 'paid' ? (
                          <CheckCircle className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <Clock className="h-4 w-4 text-amber-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-white font-medium capitalize">{earning.purchase_type}</p>
                        <p className="text-xs text-white/45">
                          {new Date(earning.created_at).toLocaleDateString()} · {earning.status}
                        </p>
                      </div>
                    </div>
                    <span className="font-black text-sm" style={{ color: G }}>+{earning.commission_shc} SHC</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={shareLink}
            size="lg"
            className="w-full h-14 rounded-full font-extrabold text-[#050505] text-base shadow-[0_0_32px_rgba(212,175,55,0.4)] hover:shadow-[0_0_48px_rgba(212,175,55,0.5)] border-0"
            style={{ background: `linear-gradient(135deg, ${G}, #e8c547)` }}
          >
            <Share2 className="w-5 h-5 mr-2" />
            {t('affiliate.shareNow', 'Share Your Link Now')}
          </Button>
        </div>
      </div>
    </>
  );
};

export default AffiliateDetail;
