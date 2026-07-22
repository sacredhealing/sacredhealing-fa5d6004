import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { toast as sonnerToast } from 'sonner';
import { Sparkles, Play, Pause, Lock, Download, Heart, Clock, Music, CheckCircle, Star, CreditCard, Wallet, Crown, Key, Flame, Eye, Waves, TreePine, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ReviewSection } from '@/components/reviews/ReviewSection';
import { useAdminRole } from '@/hooks/useAdminRole';
import { IntentionThreshold } from '@/components/meditation/IntentionThreshold';
import { useUserDailyState } from '@/hooks/useUserDailyState';
import { getDayPhase, type DayPhase } from '@/utils/postSessionContext';
import { useMusicPlayer, UniversalAudioItem } from '@/contexts/MusicPlayerContext';
import { useHealingMeditationLanguage } from '@/hooks/useHealingMeditationLanguage';
import { HealingLanguageToggle } from '@/features/healing/HealingLanguageToggle';
import { getHealingSessions, type HealingSessionItem } from '@/features/healing/getHealingSessions';
import { useJyotishProfile } from '@/hooks/useJyotishProfile';
import { navigateToStripeCheckout, resolveStripeCheckoutUrl } from '@/lib/stripeCheckoutNavigation';
import { useSpiritualPaths, type SpiritualPath, type PathDay } from '@/hooks/useSpiritualPaths';
import { usePathTracks } from '@/hooks/usePathTracks';
import { normalizeSpiritualPathSlugKey } from '@/lib/spiritualPathSlug';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Wind, BookOpen, Headphones } from 'lucide-react';

/* ─── SQI-2050 INLINE STYLES ─── */
const H_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&family=Cinzel:wght@400;500;600&display=swap');
  :root { --h-gold:#D4AF37; --h-gold2:#F5E17A; --h-black:#050505; --h-glass:rgba(255,255,255,0.02); --h-border:rgba(255,255,255,0.05); --h-muted:rgba(255,255,255,0.42); --h-cyan:#22D3EE; --h-green:#10B981; --r40:40px; }
  .h-page { font-family: 'Plus Jakarta Sans', sans-serif; background: var(--h-black); color: rgba(255,255,255,0.9); min-height: 100vh; overflow-x: hidden; }
  .h-glass { background: var(--h-glass); backdrop-filter: blur(40px); -webkit-backdrop-filter: blur(40px); border: 1px solid var(--h-border); border-radius: var(--r40); transition: border-color .3s; }
  .h-glass:hover { border-color: rgba(212,175,55,.12); }
  @keyframes hShimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
  @keyframes rimG { 0%,100%{box-shadow:0 0 12px rgba(212,175,55,.06)} 50%{box-shadow:0 0 40px rgba(212,175,55,.22)} }
  @keyframes shimmer { 0%{left:-110%} 60%{left:110%} 100%{left:110%} }
  .h-shimmer { background: linear-gradient(135deg,#D4AF37 0%,#F5E17A 40%,#D4AF37 60%,#A07C10 100%); background-size: 200% auto; -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; animation: hShimmer 5s linear infinite; }
  @keyframes hNadi { 0%,100%{opacity:.6} 50%{opacity:1;filter:drop-shadow(0 0 8px rgba(212,175,55,.7))} }
  .h-nadi { animation: hNadi 3s ease-in-out infinite; color: var(--h-gold); }
  @keyframes hOrb { 0%,100%{transform:translateY(0) rotate(0deg);opacity:.2} 50%{transform:translateY(-18px) rotate(180deg);opacity:.5} }
  .h-orb { position: absolute; border-radius: 50%; background: radial-gradient(circle, rgba(212,175,55,.18), transparent 70%); pointer-events: none; animation: hOrb var(--dur,10s) ease-in-out infinite; animation-delay: var(--dl,0s); }
  .h-hero { position: relative; min-height: 85vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 28px 80px; text-align: center; overflow: hidden; }
  .h-hero::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse 80% 60% at 50% 30%, rgba(212,175,55,.07) 0%, transparent 65%), radial-gradient(ellipse 60% 40% at 20% 80%, rgba(34,211,238,.03) 0%, transparent 60%); pointer-events: none; }
  .h-hero-title { font-family: 'Cinzel', serif; font-size: clamp(26px,7vw,40px); font-weight: 600; letter-spacing: .04em; line-height: 1.1; margin-bottom: 20px; }
  .h-section-title { font-family: 'Cinzel', serif; font-size: clamp(18px,5vw,24px); font-weight: 500; letter-spacing: .06em; margin-top: 6px; }
  .h-micro { font-size: 8px; font-weight: 800; letter-spacing: .5em; text-transform: uppercase; color: rgba(212,175,55,.45); }
  .h-vedic { background: linear-gradient(135deg, rgba(16,185,129,.05), rgba(34,211,238,.04)); border: 1px solid rgba(16,185,129,.18); border-radius: var(--r40); padding: 18px 22px; }
  @keyframes hIconPulse { 0%,100%{box-shadow:0 0 14px rgba(212,175,55,.35)} 50%{box-shadow:0 0 28px rgba(212,175,55,.65)} }
  .h-how-icon { width: 56px; height: 56px; border-radius: 18px; background: linear-gradient(135deg, rgba(212,175,55,.22), rgba(255,215,80,.1) 50%, rgba(212,175,55,.06)); border: 1.5px solid rgba(212,175,55,.55); display: flex; align-items: center; justify-content: center; font-size: 24px; margin-bottom: 16px; color: #D4AF37; }
  .h-diff-old { padding: 12px 18px; font-size: 12px; color: rgba(255,255,255,.28); text-decoration: line-through; background: rgba(255,0,0,.025); }
  .h-diff-new { padding: 12px 18px; font-size: 13px; font-weight: 700; color: rgba(255,255,255,.82); border-top: 1px solid rgba(212,175,55,.07); background: rgba(212,175,55,.03); display: flex; align-items: center; gap: 8px; }
  .h-track { display: flex; align-items: center; gap: 14px; padding: 14px 18px; background: rgba(255,255,255,.015); border: 1px solid rgba(255,255,255,.05); border-radius: 20px; cursor: pointer; transition: all .2s; }
  .h-track:hover { border-color: rgba(212,175,55,.18); background: rgba(212,175,55,.03); }
  /* Golden Aura — active healing row (SQI-2050 breathing halo, inset-safe) */
  @keyframes hRowAura {
    0%, 100% {
      border-color: rgba(212,175,55,.38);
      box-shadow: inset 0 0 28px rgba(212,175,55,.1), 0 0 0 1px rgba(212,175,55,.25), 0 4px 24px rgba(212,175,55,.12);
      background: rgba(212,175,55,.05);
    }
    50% {
      border-color: rgba(212,175,55,.75);
      box-shadow: inset 0 0 40px rgba(212,175,55,.18), 0 0 0 2px rgba(212,175,55,.45), 0 8px 40px rgba(212,175,55,.28);
      background: rgba(212,175,55,.09);
    }
  }
  .h-track.h-playing { animation: hRowAura 2.8s ease-in-out infinite; }
  .h-play-btn { width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0; background: linear-gradient(135deg, rgba(212,175,55,.12), rgba(212,175,55,.04)); border: 1px solid rgba(212,175,55,.22); display: flex; align-items: center; justify-content: center; color: #D4AF37; transition: all .22s; position: relative; }
  .h-track:hover .h-play-btn:not(.h-playing) { background: linear-gradient(135deg, #D4AF37, #B8960C); color: #050505; box-shadow: 0 0 18px rgba(212,175,55,.45); }
  @keyframes hPlayGoldPulse {
    0%, 100% { box-shadow: 0 0 14px rgba(212,175,55,.55), 0 0 28px rgba(245,225,122,.2); transform: scale(1); }
    50% { box-shadow: 0 0 26px rgba(212,175,55,.95), 0 0 48px rgba(212,175,55,.35); transform: scale(1.05); }
  }
  @keyframes hCyanRing {
    0% { transform: scale(.85); opacity: .85; }
    100% { transform: scale(1.45); opacity: 0; }
  }
  .h-play-btn.h-playing {
    background: linear-gradient(145deg, #F5E17A, #D4AF37, #A07C10) !important;
    color: #050505 !important;
    border-color: rgba(212,175,55,.65) !important;
    animation: hPlayGoldPulse 2s ease-in-out infinite;
  }
  .h-play-btn.h-playing::after {
    content: '';
    position: absolute;
    inset: -6px;
    border-radius: 50%;
    border: 2px solid rgba(34,211,238,.55);
    pointer-events: none;
    animation: hCyanRing 2.2s ease-out infinite;
  }
  .h-testimonial { padding: 18px 20px; background: rgba(255,255,255,.015); border: 1px solid rgba(255,255,255,.04); border-radius: 24px; }
  .h-pricing { background: linear-gradient(135deg, rgba(139,92,246,.08), rgba(212,175,55,.05)); border: 1px solid rgba(212,175,55,.18); border-radius: var(--r40); padding: 30px 24px 24px; text-align: center; position: relative; overflow: hidden; }
  /* Decorative layer must not capture taps (otherwise tier / CTA buttons feel dead). */
  .h-pricing::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse 60% 40% at 50% 0%, rgba(212,175,55,.08), transparent 65%); pointer-events: none; }
  .h-tier-btn { flex: 1; min-width: 88px; padding: 12px 14px; border-radius: 100px; font-size: 12px; font-weight: 800; background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.08); color: rgba(255,255,255,.7); cursor: pointer; font-family: inherit; transition: all .22s; }
  .h-tier-btn:hover, .h-tier-btn.h-active { background: linear-gradient(135deg, rgba(212,175,55,.12), rgba(212,175,55,.04)); border-color: rgba(212,175,55,.3); color: #D4AF37; box-shadow: 0 0 16px rgba(212,175,55,.12); }
  .h-cta-btn { width: 100%; padding: 15px; border-radius: 100px; background: linear-gradient(135deg, #D4AF37, #B8960C); color: #050505; font-size: 13px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; border: none; cursor: pointer; font-family: inherit; box-shadow: 0 0 28px rgba(212,175,55,.4); transition: all .25s; display: flex; align-items: center; justify-content: center; gap: 9px; }
  .h-cta-btn:hover { box-shadow: 0 0 50px rgba(212,175,55,.65); transform: scale(1.02); }
  .h-divider { height: 1px; background: linear-gradient(90deg, transparent, rgba(212,175,55,.1), transparent); margin: 0 22px 32px; }
`;

// Note: the Vedic Healing Insight that used to live in its own JyotishHealingCard
// component is now fused directly into the hero paragraph below (see doshaPlainLanguage
// and the jyotish hook call in the main component) - one paragraph, not a separate card.

// ============================================================
// TYPES
// ============================================================
interface HealingAudio {
  id: string;
  title: string;
  description: string | null;
  audio_url: string;
  preview_url: string | null;
  cover_image_url: string | null;
  duration_seconds: number;
  is_free: boolean;
  price_usd: number;
  price_shc: number;
  category: string;
  language?: string | null;
  tags?: string[] | null;
  play_count?: number;
}

interface HealingPlan {
  id: string;
  name: string;
  price: number;
  days: number;
}

const HEALING_PLANS: HealingPlan[] = [
  { id: '7_day', name: '7 days', price: 97, days: 7 },
  { id: '14_day', name: '14 days', price: 147, days: 14 },
  { id: '30_day', name: '30 days', price: 197, days: 30 },
];

/** Quick-buy micro tiers, priced on the 11.11 pattern (an "angel number" — on-brand for this
 * audience, and cleanly linear: each extra day is another $11.11, so the math is legible at a
 * glance). Server-side in create-healing-checkout uses Stripe's dynamic price_data for these
 * three, since there's no pre-created Stripe Price object for them (unlike the plans above). */
const BOOST_PLANS: HealingPlan[] = [
  { id: 'boost_1_day', name: '1-Day Healing Boost', price: 11.11, days: 1 },
  { id: 'boost_2_day', name: '2-Day Healing Boost', price: 22.22, days: 2 },
  { id: 'boost_3_day', name: '3-Day Healing Boost', price: 33.33, days: 3 },
];

/** Ongoing subscription — same Stripe/crypto flows as fixed-duration plans */
const SUBSCRIPTION_PLAN: HealingPlan = {
  id: 'subscription',
  name: 'Ongoing Subscription',
  price: 147,
  days: 30,
};

/** EVM treasury for USDC/USDT (set VITE_HEALING_CRYPTO_WALLET for production) */
const HEALING_CRYPTO_TREASURY =
  import.meta.env.VITE_HEALING_CRYPTO_WALLET ||
  import.meta.env.VITE_PUBLIC_CRYPTO_WALLET ||
  '0x0000000000000000000000000000000000000000';

function formatEnergyExchange(priceUsd: number): string {
  const sek = Math.round(priceUsd * 11);
  return `Exchange: $${priceUsd} / ${sek}kr`;
}

/** Plain-language symptom translation for each dosha, so someone who has never heard of
 * Vedic astrology can still recognize themselves in the reading. `primaryDosha` from
 * useJyotishProfile() is one of these three, or 'Tridoshic' as a fallback when moon sign
 * is unavailable. */
function doshaPlainLanguage(primaryDosha: string): string {
  switch (primaryDosha) {
    case 'Vata':
      return 'anxiety, restlessness, racing thoughts, trouble settling down';
    case 'Pitta':
      return 'irritability, frustration, burnout, feeling overheated or overly critical';
    case 'Kapha':
      return 'heaviness, low motivation, sluggishness, feeling stuck';
    default:
      return 'shifting energy that can feel different day to day';
  }
}

// ============================================================
// 4-LANGUAGE TRANSLATIONS
// ============================================================
type LangKey = 'en' | 'sv' | 'no' | 'es';

const tx: Record<LangKey, Record<string, string>> = {
  en: {
    heroTitle: '15 Years of Healing — One Infinite Connection',
    heroSubtitle: 'Through the grace of Mahavatar Babaji and the 18 Siddha Masters, enter a sanctified field where miracles are the natural state of existence.',
    heroCta: 'Begin Your Transformation',
    statementTitle: 'The Evolution of Grace',
    statementBody: 'For 15 years, I have walked the path of the healer, serving as a bridge for those seeking balance. Through the sacred initiation of Atma Kriya Yoga and a direct connection to the lineage of Mahavatar Babaji and the 18 Siddhas, my work has evolved.\n\nI no longer simply treat the body; I recalibrate the soul. By merging the ancient science of the masters with the modern power of vibrational sound, I facilitate a \'Silent Transmission.\' This is surgery without a scalpel — performed in the Akasha, governed by Divine Grace, and delivered through the heart.',
    howTitle: 'The Power of Silent Transmission',
    howCard1Title: 'The Resonance',
    howCard1Body: 'When you book, your soul\'s frequency is integrated into my daily Atma Kriya Yoga. I scan your Akashic Record and perform Subtle Surgery during my dawn Sadhana.',
    howCard2Title: 'The 30-Day Blueprint',
    howCard2Body: 'Your physical body takes 30 days to catch up to the soul\'s new vibration. During this time, Siddha energy re-codes your cells 24/7. My music acts as the carrier wave.',
    howCard3Title: 'Sonic Alchemy',
    howCard3Body: 'As a producer, I weave sacred Beeja mantras and healing frequencies into music. Your transformation happens while you simply listen.',
    compTitle: 'Why This Is Different',
    compLeft: 'Traditional Therapy',
    compRight: 'Siddha Healing',
    comp1L: 'Talking about the past',
    comp1R: 'Clearing the past in the Akasha',
    comp2L: 'Fixed 1-hour sessions',
    comp2R: '24/7 Transmission for 30 days',
    comp3L: 'Surface-level relaxation',
    comp3R: 'Karmic surgery at the root',
    comp4L: 'Human effort',
    comp4R: 'Divine Grace through Babaji\'s Lineage',
    medTitle: 'Sonic Treatments',
    medCat1: 'Root & Earth',
    medCat1Desc: 'Grounding, physical vitality, and cellular regeneration.',
    medCat2: 'Heart & Water',
    medCat2Desc: 'Emotional release, heart opening, and relationship harmony.',
    medCat3: 'Akashic Gateway',
    medCat3Desc: 'High-frequency transmissions for spiritual awakening.',
    medEncoded: 'Encoded with Atma Kriya frequencies and Siddha Mantras',
    medIntro: 'Short frequency tracks you can play right now — grounding tones, heart-opening sequences, and high-frequency transmissions. A few are free to start; the full library unlocks with Prana-Flow.',
    medFreeLabel: 'Atma-Seed',
    medPremiumLabel: 'Prana-Flow',
    testimTitle: 'Miracle Logs',
    testimSub: 'Everyone experiences it differently.',
    testimMicro: 'Transmission Testimonials · Verified Field Reports',
    faqTitle: 'The Science of Grace',
    faq1Q: 'How can you heal me if we aren\'t talking on the phone?',
    faq1A: 'In the dimensions of the Siddhas, distance is an illusion. I work within the Akasha — the unified field where all consciousness is connected. Just as a radio captures a signal from miles away, your energy body receives the transmission I release during my daily Atma Kriya Yoga.',
    faq2Q: 'Why is the program 30 days long?',
    faq2A: 'True transformation isn\'t a quick fix — it\'s a cellular recalibration. It takes roughly 30 days for the human nervous system to fully integrate a shift in the soul\'s frequency. During this month, you are held in a Field of Grace that works 24/7.',
    faq3Q: 'I\'ve tried other healers. Why is this different?',
    faq3A: 'Most healers use their own personal energy, which is limited. I serve as a hollow bamboo for the lineage of Mahavatar Babaji. You aren\'t receiving my energy — you are being connected to a 5,000-year-old reservoir of Divine Power. My background as a Music Producer allows me to encode healing into sonic frequencies that bypass mental resistance.',
    faq4Q: 'What do I need to do during the 30 days?',
    faq4A: 'Your only job is surrender. Listen to the provided Initiation Track in the app. Drink plenty of water. Simply observe the shifts in your dreams, moods, and physical vitality.',
    faq5Q: 'Can you really see organs and past lives from a distance?',
    faq5A: 'Yes. Through Sukshma Drishti (Subtle Vision), I scan the body\'s energy field. Blockages appear as dark knots or dissonant frequencies. The root of physical pain is often a karmic imprint stored in the Akasha. I identify these seeds and use Siddha mantras to dissolve them at the source.',
    faq6Q: 'Is this related to a specific religion?',
    faq6A: 'This work is rooted in Sanatana Dharma (Universal Law) and the path of the Siddhas, but it is universal. Whether you are religious, spiritual, or skeptical, the frequencies work on a biological and energetic level.',
    bookingTitle: 'This is Not a Session. It is an Initiation.',
    bookingSub: '30 days of continuous Siddha transmission. Sacred sonic frequencies. Akashic surgery at the soul level.',
    bookingCta: 'Enter the Portal',
    bookingOngoing: 'Ongoing Subscription',
    bookingDisclosure: 'Remote support sessions. This app is for spiritual and entertainment purposes only. It is not intended to provide medical advice, diagnosis, or treatment.',
    activeAccess: 'Your Healing Portal is Active',
    owned: 'Owned',
    directTitle: 'Direct Healing Transmission',
    directSub: 'Personalized Alchemical Sound Healing with Adam. Limited Sacred Windows available.',
    directCta: 'Book Your Session',
    choosePayment: 'Choose payment method',
    payCard: 'Pay with card',
    payCrypto: 'Pay with crypto',
    payCryptoUsdcUsdt: 'Pay with crypto (USDC / USDT)',
    days: 'days',
    seeMore: 'See more testimonials',
    seeLess: 'See less',
    noSessions: 'No sessions in this language yet. More coming soon.',
    viewAll: 'View all sessions',
  },
  sv: {
    heroTitle: '15 År av Helande — En Oändlig Förbindelse',
    heroSubtitle: 'Genom Mahavatar Babajis och de 18 Siddha-mästarnas nåd, träd in i ett helgat fält där mirakel är det naturliga tillståndet.',
    heroCta: 'Påbörja Din Transformation',
    statementTitle: 'Nådens Evolution',
    statementBody: 'I 15 år har jag vandrat helarens väg, som en bro för dem som söker balans. Genom den heliga initiationen av Atma Kriya Yoga och en direkt koppling till Mahavatar Babajis och de 18 Siddhornas linje har mitt arbete utvecklats.\n\nJag behandlar inte längre bara kroppen; jag kalibrerar om själen. Genom att sammanföra mästarnas urgamla vetenskap med den moderna kraften av vibrationellt ljud, underlättar jag en \'Tyst Transmission.\' Detta är kirurgi utan skalpell — utförd i Akasha, styrd av Gudomlig Nåd, och levererad genom hjärtat.',
    howTitle: 'Den Tysta Transmissionens Kraft',
    howCard1Title: 'Resonansen',
    howCard1Body: 'När du bokar integreras din själs frekvens i min dagliga Atma Kriya Yoga. Jag skannar ditt Akashiska Arkiv och utför Subtil Kirurgi under min grynings-Sadhana.',
    howCard2Title: '30-dagars Blåkopian',
    howCard2Body: 'Din fysiska kropp behöver 30 dagar för att komma ikapp själens nya vibration. Under denna tid omkodar Siddha-energi dina celler dygnet runt.',
    howCard3Title: 'Sonisk Alkemi',
    howCard3Body: 'Som producent väver jag heliga Beeja-mantran och helande frekvenser in i musik. Din transformation sker medan du bara lyssnar.',
    compTitle: 'Varför Detta Är Annorlunda',
    compLeft: 'Traditionell Terapi',
    compRight: 'Siddha-Helande',
    comp1L: 'Prata om det förflutna',
    comp1R: 'Rensa det förflutna i Akasha',
    comp2L: 'Fasta 1-timmes sessioner',
    comp2R: '24/7 Transmission i 30 dagar',
    comp3L: 'Ytlig avslappning',
    comp3R: 'Karmisk kirurgi vid roten',
    comp4L: 'Mänsklig ansträngning',
    comp4R: 'Gudomlig Nåd genom Babajis Linje',
    medTitle: 'Soniska Behandlingar',
    medCat1: 'Rot & Jord',
    medCat1Desc: 'Jordning, fysisk vitalitet och cellförnyelse.',
    medCat2: 'Hjärta & Vatten',
    medCat2Desc: 'Emotionell frigörelse, hjärtöppning och relationsharmoni.',
    medCat3: 'Akashisk Portal',
    medCat3Desc: 'Högfrekventa transmissioner för andligt uppvaknande.',
    medEncoded: 'Kodad med Atma Kriya-frekvenser och Siddha-Mantran',
    medIntro: 'Korta frekvensspår du kan spela direkt — jordande toner, hjärtöppnande sekvenser och högfrekventa transmissioner. Några är gratis, hela biblioteket låses upp med Prana-Flow.',
    medFreeLabel: 'Atma-Seed',
    medPremiumLabel: 'Prana-Flow',
    testimTitle: 'Mirakelloggar',
    testimSub: 'Alla upplever det olika.',
    testimMicro: 'Transmissionsvittnesmål · Verifierade fältrapporter',
    faqTitle: 'Nådens Vetenskap',
    faq1Q: 'Hur kan du hela mig om vi inte pratar på telefon?',
    faq1A: 'I Siddhornas dimensioner är avstånd en illusion. Jag arbetar inom Akasha — det enhetliga fältet där allt medvetande är sammankopplat.',
    faq2Q: 'Varför är programmet 30 dagar?',
    faq2A: 'Verklig transformation är inte en snabb fix — det är en cellulär omkalibrering. Det tar ungefär 30 dagar för nervsystemet att fullt integrera en förändring.',
    faq3Q: 'Jag har provat andra healers. Varför är detta annorlunda?',
    faq3A: 'De flesta healers använder sin egen energi. Jag tjänar som en ihålig bambu för Mahavatar Babajis linje. Du kopplas till ett 5000 år gammalt reservoar av Gudomlig Kraft.',
    faq4Q: 'Vad behöver jag göra under 30 dagarna?',
    faq4A: 'Ditt enda jobb är att överlämna dig. Lyssna på initiationsspåret i appen. Drick mycket vatten. Observera förändringarna.',
    faq5Q: 'Kan du verkligen se organ och tidigare liv på distans?',
    faq5A: 'Ja. Genom Sukshma Drishti skannar jag kroppens energifält. Blockeringar visar sig som mörka knutar. Roten till fysisk smärta är ofta ett karmiskt avtryck i Akasha.',
    faq6Q: 'Är detta kopplat till en specifik religion?',
    faq6A: 'Detta arbete är rotat i Sanatana Dharma och Siddhornas väg, men det är universellt. Frekvenserna fungerar på biologisk och energetisk nivå.',
    bookingTitle: 'Detta Är Inte en Session. Det Är en Initiation.',
    bookingSub: '30 dagars kontinuerlig Siddha-transmission. Heliga soniska frekvenser.',
    bookingCta: 'Träd In I Portalen',
    bookingOngoing: 'Löpande Prenumeration',
    bookingDisclosure: 'Fjärrstödssessioner. Appen är för andliga ändamål och underhållning, inte medicinsk rådgivning.',
    activeAccess: 'Din Helande Portal Är Aktiv',
    owned: 'Ägd',
    directTitle: 'Direkt Helande Transmission',
    directSub: 'Personlig Alkemisk Ljudhelande med Adam.',
    directCta: 'Boka Din Session',
    choosePayment: 'Välj betalningsmetod',
    payCard: 'Betala med kort',
    payCrypto: 'Betala med crypto',
    payCryptoUsdcUsdt: 'Betala med krypto (USDC / USDT)',
    days: 'dagar',
    seeMore: 'Se fler omdömen',
    seeLess: 'Se färre',
    noSessions: 'Inga sessioner på detta språk ännu.',
    viewAll: 'Visa alla sessioner',
  },
  no: {
    heroTitle: '15 År med Helbredelse — Én Uendelig Forbindelse',
    heroSubtitle: 'Gjennom nåden til Mahavatar Babaji og de 18 Siddha-mestrene, tre inn i et hellig felt der mirakler er den naturlige tilstanden.',
    heroCta: 'Start Din Transformasjon',
    statementTitle: 'Nådens Evolusjon',
    statementBody: 'I 15 år har jeg gått helerens vei, som en bro for de som søker balanse. Gjennom den hellige innvielsen av Atma Kriya Yoga og en direkte forbindelse til Mahavatar Babajis og de 18 Siddhaenes linje, har arbeidet mitt utviklet seg.\n\nJeg behandler ikke lenger bare kroppen; jeg rekalibrerer sjelen. Ved å forene mesterne\'s eldgamle vitenskap med den moderne kraften av vibrasjonell lyd, fasiliterer jeg en \'Stille Transmisjon.\' Dette er kirurgi uten skalpell.',
    howTitle: 'Kraften i Stille Transmisjon',
    howCard1Title: 'Resonansen',
    howCard1Body: 'Når du bestiller, integreres sjelens frekvens i min daglige Atma Kriya Yoga.',
    howCard2Title: '30-dagers Blåkopi',
    howCard2Body: 'Kroppen trenger 30 dager for å innhente sjelens nye vibrasjon. Siddha-energi omkoder cellene dine døgnet rundt.',
    howCard3Title: 'Sonisk Alkymi',
    howCard3Body: 'Som produsent vever jeg hellige Beeja-mantraer og helbredende frekvenser inn i musikk.',
    compTitle: 'Hvorfor Dette Er Annerledes',
    compLeft: 'Tradisjonell Terapi', compRight: 'Siddha-Helbredelse',
    comp1L: 'Snakke om fortiden', comp1R: 'Rense fortiden i Akasha',
    comp2L: 'Faste 1-times økter', comp2R: '24/7 Transmisjon i 30 dager',
    comp3L: 'Overfladisk avslapning', comp3R: 'Karmisk kirurgi ved roten',
    comp4L: 'Menneskelig innsats', comp4R: 'Guddommelig Nåde gjennom Babajis Linje',
    medTitle: 'Soniske Behandlinger', medCat1: 'Rot & Jord', medCat1Desc: 'Jording og fysisk vitalitet.',
    medCat2: 'Hjerte & Vann', medCat2Desc: 'Emosjonell frigjøring og relasjonsharmoni.',
    medCat3: 'Akashisk Portal', medCat3Desc: 'Høyfrekvente transmisjoner for åndelig oppvåkning.',
    medEncoded: 'Kodet med Atma Kriya-frekvenser og Siddha-Mantraer',
    medIntro: 'Korte frekvensspor du kan spille med en gang — jordende toner, hjerteåpnende sekvenser og høyfrekvente transmisjoner. Noen er gratis, hele biblioteket låses opp med Prana-Flow.',
    medFreeLabel: 'Atma-Seed',
    medPremiumLabel: 'Prana-Flow',
    testimTitle: 'Mirakellogger', testimSub: 'Alle opplever det forskjellig.',
    testimMicro: 'Transmisjonst vitnesbyrd · Verifiserte feltrapporter',
    faqTitle: 'Nådens Vitenskap',
    faq1Q: 'Hvordan kan du helbrede meg uten å snakke med meg?', faq1A: 'I Siddhaenes dimensjoner er avstand en illusjon. Jeg jobber i Akasha — det enhetlige feltet.',
    faq2Q: 'Hvorfor er programmet 30 dager?', faq2A: 'Det tar ca. 30 dager for nervesystemet å integrere en frekvensskift.',
    faq3Q: 'Hvorfor er dette annerledes?', faq3A: 'Jeg kanaliserer Babajis linje, ikke min egen energi.',
    faq4Q: 'Hva må jeg gjøre i 30 dager?', faq4A: 'Ditt eneste jobb er å overgi deg. Lytt til sporet i appen.',
    faq5Q: 'Kan du virkelig se organer på avstand?', faq5A: 'Ja. Gjennom Sukshma Drishti skanner jeg energifeltet.',
    faq6Q: 'Er dette knyttet til en religion?', faq6A: 'Rotet i Sanatana Dharma, men universelt.',
    bookingTitle: 'Dette Er Ikke en Økt. Det Er en Innvielse.',
    bookingSub: '30 dager med kontinuerlig Siddha-transmisjon.',
    bookingCta: 'Tre Inn I Portalen', bookingOngoing: 'Løpende Abonnement',
    bookingDisclosure: 'Fjernstøtteøkter. Appen er for åndelige formål.',
    activeAccess: 'Din Helbredelsesportal Er Aktiv', owned: 'Eid',
    directTitle: 'Direkte Helbredende Transmisjon', directSub: 'Personlig Alkymisk Lydhelbredelse med Adam.',
    directCta: 'Bestill Din Økt', choosePayment: 'Velg betalingsmetode',
    payCard: 'Betal med kort', payCrypto: 'Betal med krypto', payCryptoUsdcUsdt: 'Betal med krypto (USDC / USDT)', days: 'dager',
    seeMore: 'Se flere', seeLess: 'Se færre', noSessions: 'Ingen økter på dette språket ennå.', viewAll: 'Vis alle økter',
  },
  es: {
    heroTitle: '15 Años de Sanación — Una Conexión Infinita',
    heroSubtitle: 'A través de la gracia de Mahavatar Babaji y los 18 Maestros Siddha, entra en un campo sagrado donde los milagros son el estado natural.',
    heroCta: 'Comienza Tu Transformación',
    statementTitle: 'La Evolución de la Gracia',
    statementBody: 'Durante 15 años, he caminado el sendero del sanador, sirviendo como puente para quienes buscan equilibrio. A través de la iniciación sagrada del Atma Kriya Yoga y una conexión directa con el linaje de Mahavatar Babaji y los 18 Siddhas, mi trabajo ha evolucionado.\n\nYa no trato simplemente el cuerpo; recalibro el alma. Al fusionar la ciencia ancestral de los maestros con el poder moderno del sonido vibracional, facilito una \'Transmisión Silenciosa.\' Esto es cirugía sin bisturí.',
    howTitle: 'El Poder de la Transmisión Silenciosa',
    howCard1Title: 'La Resonancia', howCard1Body: 'Al reservar, la frecuencia de tu alma se integra en mi Atma Kriya Yoga diario.',
    howCard2Title: 'El Plan de 30 Días', howCard2Body: 'Tu cuerpo necesita 30 días para alcanzar la nueva vibración del alma.',
    howCard3Title: 'Alquimia Sónica', howCard3Body: 'Como productor, tejo mantras Beeja sagrados y frecuencias sanadoras en la música.',
    compTitle: 'Por Qué Esto Es Diferente',
    compLeft: 'Terapia Tradicional', compRight: 'Sanación Siddha',
    comp1L: 'Hablar del pasado', comp1R: 'Limpiar el pasado en el Akasha',
    comp2L: 'Sesiones fijas de 1 hora', comp2R: 'Transmisión 24/7 por 30 días',
    comp3L: 'Relajación superficial', comp3R: 'Cirugía kármica en la raíz',
    comp4L: 'Esfuerzo humano', comp4R: 'Gracia Divina a través del Linaje de Babaji',
    medTitle: 'Tratamientos Sónicos', medCat1: 'Raíz & Tierra', medCat1Desc: 'Conexión a tierra y vitalidad física.',
    medCat2: 'Corazón & Agua', medCat2Desc: 'Liberación emocional y armonía relacional.',
    medCat3: 'Portal Akáshico', medCat3Desc: 'Transmisiones de alta frecuencia para el despertar espiritual.',
    medEncoded: 'Codificado con frecuencias de Atma Kriya y Mantras Siddha',
    medIntro: 'Pistas de frecuencia cortas que puedes reproducir ahora mismo — tonos de conexión a tierra, secuencias de apertura del corazón y transmisiones de alta frecuencia. Algunas son gratuitas, la biblioteca completa se desbloquea con Prana-Flow.',
    medFreeLabel: 'Atma-Seed',
    medPremiumLabel: 'Prana-Flow',
    testimTitle: 'Registros de Milagros', testimSub: 'Cada uno lo experimenta de manera diferente.',
    testimMicro: 'Testimonios de transmisión · Informes de campo verificados',
    faqTitle: 'La Ciencia de la Gracia',
    faq1Q: '¿Cómo puedes sanarme sin hablar conmigo?', faq1A: 'En las dimensiones de los Siddhas, la distancia es una ilusión. Trabajo en el Akasha.',
    faq2Q: '¿Por qué el programa dura 30 días?', faq2A: 'El sistema nervioso necesita 30 días para integrar un cambio de frecuencia.',
    faq3Q: '¿Por qué es diferente?', faq3A: 'Canalizo el linaje de Babaji, no mi propia energía.',
    faq4Q: '¿Qué debo hacer durante los 30 días?', faq4A: 'Tu único trabajo es rendirte. Escucha la pista en la app.',
    faq5Q: '¿Puedes ver órganos y vidas pasadas a distancia?', faq5A: 'Sí. A través de Sukshma Drishti escaneo el campo energético.',
    faq6Q: '¿Está relacionado con una religión?', faq6A: 'Enraizado en Sanatana Dharma, pero universal.',
    bookingTitle: 'Esto No Es una Sesión. Es una Iniciación.',
    bookingSub: '30 días de transmisión Siddha continua.',
    bookingCta: 'Entra al Portal', bookingOngoing: 'Suscripción Continua',
    bookingDisclosure: 'Sesiones de apoyo remoto. Esta app es para fines espirituales.',
    activeAccess: 'Tu Portal de Sanación Está Activo', owned: 'Adquirido',
    directTitle: 'Transmisión de Sanación Directa', directSub: 'Sanación Sonora Alquímica personalizada con Adam.',
    directCta: 'Reserva Tu Sesión', choosePayment: 'Elige método de pago',
    payCard: 'Pagar con tarjeta', payCrypto: 'Pagar con crypto', payCryptoUsdcUsdt: 'Pagar con cripto (USDC / USDT)', days: 'días',
    seeMore: 'Ver más', seeLess: 'Ver menos', noSessions: 'No hay sesiones en este idioma aún.', viewAll: 'Ver todas las sesiones',
  },
};

// ============================================================
// TESTIMONIALS
// ============================================================
const testimonials = [
  { name: 'Michelle F.', text: "I 'randomly' came into contact with Adam & Laila, and from that day on my life has gone through positive transformations on every level." },
  { name: 'Cathrine N.', text: 'Everything changed at Adam\'s workshop. I am free from old stress and totally cured from the panic attacks I had since I was 14 years old.' },
  { name: 'Michelle F.', videos: ['https://www.youtube.com/embed/xOHaZqrykjg?start=1', 'https://www.youtube.com/embed/NX-aI9_PTR4', 'https://www.youtube.com/embed/rk1MdyH3BV0'] },
];

// ============================================================
// MAIN COMPONENT
// ============================================================
const Healing: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useAdminRole();

  // ── Siddha Healers Sovereign Path ──
  const {
    paths: sovereignPaths,
    isLoading: pathsLoading,
    userProgress: pathUserProgress,
    getProgressForPath,
    getPathDays,
    getPathBySlug,
    startPath,
    completeDay,
    isProgressLoading,
  } = useSpiritualPaths();
  const [selectedPath, setSelectedPath] = React.useState<SpiritualPath | null>(null);
  const [pathDays, setPathDays] = React.useState<PathDay[]>([]);
  const [pathDaysLoading, setPathDaysLoading] = React.useState(false);
  const [expandedPath, setExpandedPath] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (selectedPath) {
      setPathDaysLoading(true);
      getPathDays(selectedPath.id).then((days) => {
        setPathDays(days);
        setPathDaysLoading(false);
      });
    }
  }, [selectedPath]);
  const { language, setLanguage } = useHealingMeditationLanguage();
  const jyotish = useJyotishProfile();
  const { playUniversalAudio, currentAudio, isPlaying: playerIsPlaying } = useMusicPlayer();
  const userDailyState = useUserDailyState();
  const dayPhase: DayPhase = getDayPhase();
  const dayPhaseLabel = t(`meditations.dayPhase.${dayPhase}`);

  // Determine display language
  const rawLang = (i18n.language?.split('-')[0] || 'en') as string;
  const lang: LangKey = (rawLang === 'sv' || rawLang === 'no' || rawLang === 'es') ? rawLang : 'en';
  const T = tx[lang];

  const [audioTracks, setAudioTracks] = useState<HealingAudio[]>([]);
  const [ownedAudioIds, setOwnedAudioIds] = useState<Set<string>>(new Set());
  const [hasHealingAccess, setHasHealingAccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<HealingPlan | null>(HEALING_PLANS[1]);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [healingCryptoModalOpen, setHealingCryptoModalOpen] = useState(false);
  const [healingCryptoPlan, setHealingCryptoPlan] = useState<HealingPlan | null>(null);
  const [showThreshold, setShowThreshold] = useState(false);
  const [pendingAudio, setPendingAudio] = useState<HealingAudio | null>(null);
  const [testimonialsExpanded, setTestimonialsExpanded] = useState(false);
  const [freeTracksExpanded, setFreeTracksExpanded] = useState(false);
  const [premiumTracksExpanded, setPremiumTracksExpanded] = useState(false);
  const [learnMoreOpen, setLearnMoreOpen] = useState<string | null>(null);
  const [upgradeSheetOpen, setUpgradeSheetOpen] = useState(false);

  const sessions = useMemo(() => getHealingSessions(audioTracks as HealingSessionItem[], language), [audioTracks, language]);
  const freeSessions = useMemo(() => sessions.allInLanguage.filter((a) => a.is_free), [sessions.allInLanguage]);
  const premiumSessions = useMemo(() => sessions.allInLanguage.filter((a) => !a.is_free), [sessions.allInLanguage]);
  const testimonialVideos = useMemo(() => {
    const entry = testimonials.find((x): x is typeof x & { videos: string[] } => 'videos' in x && Array.isArray((x as { videos?: string[] }).videos));
    return entry?.videos ?? [];
  }, []);

  const isHealingPlaying = (audioId: string) => currentAudio?.id === audioId && currentAudio?.contentType === 'healing' && playerIsPlaying;

  useEffect(() => { fetchAudioTracks(); checkHealingAccess(); checkOwnedAudio(); }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      toast({ title: 'Payment successful', description: 'Welcome to your healing journey.' });
      window.history.replaceState({}, '', '/healing');
      checkHealingAccess();
    }
  }, [toast]);

  const fetchAudioTracks = async () => {
    const { data } = await supabase.from('healing_audio').select('*').order('created_at', { ascending: false });
    if (data) setAudioTracks(data);
  };

  const checkHealingAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('healing_purchases').select('*').eq('user_id', user.id).eq('status', 'active').gte('expires_at', new Date().toISOString()).limit(1);
    setHasHealingAccess(!!(data && data.length > 0));
  };

  const checkOwnedAudio = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('healing_audio_purchases').select('audio_id').eq('user_id', user.id);
    if (data) setOwnedAudioIds(new Set(data.map((p) => p.audio_id)));
  };

  const openPaymentModal = (plan: HealingPlan) => { setSelectedPlan(plan); setPaymentModalOpen(true); };

  const handleStripePayment = async (planType: string) => {
    setIsProcessing(true);
    setPaymentModalOpen(false);
    const loadingId = 'healing-stripe-checkout';
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        sonnerToast.error('Sign in to continue', { description: 'Log in or create an account to open checkout.' });
        navigate('/auth');
        return;
      }
      sonnerToast.loading('Opening secure checkout…', { id: loadingId });
      const affiliateId = sessionStorage.getItem('affiliateId') || null;
      const { data, error } = await supabase.functions.invoke('create-healing-checkout', {
        body: { planType, origin: window.location.origin, ...(affiliateId ? { affiliateId } : {}) },
      });
      if (error) throw error;
      if (data && typeof data === 'object' && 'error' in data && (data as { error?: string }).error) {
        throw new Error(String((data as { error: string }).error));
      }
      const url = resolveStripeCheckoutUrl(data);
      if (!url) {
        sonnerToast.error('Checkout unavailable', {
          id: loadingId,
          description: 'No payment link returned. Try again or contact support.',
        });
        return;
      }
      const nav = navigateToStripeCheckout(url);
      if (nav === 'invalid_url') {
        sonnerToast.error('Checkout unavailable', {
          id: loadingId,
          description: 'Invalid payment link. Contact support.',
        });
        return;
      }
      if (nav === 'popup_blocked') {
        sonnerToast.error('Pop-up blocked', {
          id: loadingId,
          description: 'Allow pop-ups for this site, or open the app outside the preview iframe.',
        });
        return;
      }
      sonnerToast.success(
        nav === 'opened_new_tab' ? 'Checkout opened in a new tab' : 'Redirecting to Stripe…',
        { id: loadingId, duration: 2500 }
      );
    } catch (err: unknown) {
      sonnerToast.dismiss(loadingId);
      sonnerToast.error(err instanceof Error ? err.message : 'Checkout failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCryptoPayment = async (plan: HealingPlan) => {
    setPaymentModalOpen(false);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      sonnerToast.error('Sign in required', { description: 'Log in to use crypto payment instructions.' });
      navigate('/auth');
      return;
    }
    setSelectedPlan(plan);
    setHealingCryptoPlan(plan);
    setHealingCryptoModalOpen(true);
  };

  const handleHealingCryptoSubmitted = async () => {
    if (!healingCryptoPlan) return;
    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: 'Please sign in', variant: 'destructive' });
        return;
      }
      const base = {
        user_id: user.id,
        amount: healingCryptoPlan.price,
        currency: 'EUR',
        status: 'pending',
      };
      let { error } = await (supabase as any).from('pending_crypto_payments').insert({
        ...base,
        notes: `healing_sacred_initiation:${healingCryptoPlan.id}`,
      });
      if (error) {
        ({ error } = await (supabase as any).from('pending_crypto_payments').insert(base));
      }
      if (error) throw error;
      toast({
        title: 'Payment recorded',
        description: 'We will activate your initiation after verification (usually within 24 hours).',
      });
      setHealingCryptoModalOpen(false);
      setHealingCryptoPlan(null);
    } catch (err: unknown) {
      toast({
        title: 'Could not record payment',
        description: err instanceof Error ? err.message : 'Try again or contact support.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePurchaseAudio = async (audio: HealingAudio, method: 'shc' | 'stripe') => {
    setIsProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: 'Please sign in', variant: 'destructive' });
        return;
      }
      const { data, error } = await supabase.functions.invoke('purchase-healing-audio', {
        body: { audioId: audio.id, paymentMethod: method },
      });
      if (error) throw error;
      const checkoutUrl = resolveStripeCheckoutUrl(data);
      if (checkoutUrl) {
        const nav = navigateToStripeCheckout(checkoutUrl);
        if (nav === 'popup_blocked') {
          toast({ title: 'Pop-up blocked', description: 'Allow pop-ups to open Stripe checkout.', variant: 'destructive' });
        } else if (nav === 'invalid_url') {
          toast({ title: 'Invalid checkout link', variant: 'destructive' });
        }
        return;
      }
      if (data && typeof data === 'object' && 'success' in data && (data as { success?: boolean }).success) {
        toast({ title: 'Purchase complete', description: `You now own ${audio.title}` });
        setOwnedAudioIds((prev) => new Set([...prev, audio.id]));
      }
    } catch (err: unknown) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Unknown error', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const startPlayback = (audio: HealingAudio) => {
    const canPlay = isAdmin || audio.is_free || ownedAudioIds.has(audio.id) || hasHealingAccess;
    const audioUrl = canPlay ? audio.audio_url : audio.preview_url;
    if (!audioUrl) return;
    playUniversalAudio({ id: audio.id, title: audio.title, artist: 'Sacred Soul', audio_url: audioUrl, cover_image_url: audio.cover_image_url, duration_seconds: audio.duration_seconds, shc_reward: audio.is_free ? 0 : audio.price_shc, contentType: 'healing', originalData: audio });
  };

  const initiatePlay = (audio: HealingAudio) => {
    const canPlay = isAdmin || audio.is_free || ownedAudioIds.has(audio.id) || hasHealingAccess;
    const audioUrl = canPlay ? audio.audio_url : audio.preview_url;
    if (!audioUrl) {
      sonnerToast.error(canPlay ? 'Audio not yet uploaded for this healing track. Upload via Admin panel.' : 'No preview available for this track.');
      return;
    }
    // Play directly using the same mini-player as meditations — no banner gate
    startPlayback(audio);
  };

  const handleIntentionSelected = () => { setShowThreshold(false); if (pendingAudio) { startPlayback(pendingAudio); setPendingAudio(null); } };
  const handleThresholdClose = () => { setShowThreshold(false); if (pendingAudio) { startPlayback(pendingAudio); setPendingAudio(null); } };

  const formatDuration = (s: number) => { const m = Math.floor(s / 60); return `${m}:${(s % 60).toString().padStart(2, '0')}`; };

  const scrollToBooking = () => { document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth' }); };

  // ============================================================
  // RENDER — SQI-2050 UI, all logic preserved
  // ============================================================
  return (
    <>
    <div className="h-page">
      <style>{H_CSS}</style>
      <IntentionThreshold
        isOpen={showThreshold}
        onSelectIntention={handleIntentionSelected}
        onClose={handleThresholdClose}
        weeklyContext={{
          last7DaysSessions: userDailyState.last7DaysSessions,
          userState: userDailyState.userState,
          todaySessions: userDailyState.todaySessions,
          dayPhaseLabel,
        }}
      />

      {/* ══ HERO ══ */}
      <section className="h-hero">
        <div className="h-orb" style={{ width: 220, height: 220, top: -80, right: -70, '--dur': '12s', '--dl': '0s' } as React.CSSProperties & { '--dur': string; '--dl': string }} />
        <div className="h-orb" style={{ width: 120, height: 120, top: '60%', left: -40, '--dur': '8s', '--dl': '-4s' } as React.CSSProperties & { '--dur': string; '--dl': string }} />
        <div className="h-orb" style={{ width: 80, height: 80, bottom: 100, right: 20, '--dur': '7s', '--dl': '-2s' } as React.CSSProperties & { '--dur': string; '--dl': string }} />

        <button type="button" style={{ position: 'absolute', top: 52, left: 22, width: 36, height: 36, borderRadius: 12, background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,.4)', fontSize: 14, fontFamily: 'inherit' }} onClick={() => navigate(-1)}>←</button>

        <div className="h-micro" style={{ marginBottom: 16 }}>Siddha-Quantum Healing Portal · Avataric Blueprint Active</div>
        <h1 className="h-hero-title h-shimmer">
          {T.heroTitle}
        </h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,.42)', lineHeight: 1.75, maxWidth: 320, marginBottom: 32 }}>
          {(!jyotish.isLoading && jyotish.mahadasha) ? (
            <>For 15 years I've worked through direct energetic healing — transmitted through my own daily spiritual practice. Right now, Vedic astrology shows you're in a {jyotish.mahadasha}/{jyotish.antardasha} period — a time that often brings {jyotish.primaryDosha} imbalance: {doshaPlainLanguage(jyotish.primaryDosha)}. These frequencies are made to help restore that balance, ease whatever else you're facing, or simply support your next spiritual upgrade.</>
          ) : (
            T.heroSubtitle
          )}
        </p>
        <button type="button" className="h-cta-btn" style={{ width: 'auto', padding: '16px 36px' }} onClick={scrollToBooking}>
          <Sparkles size={15} className="h-nadi" />
          {T.heroCta}
        </button>
      </section>

      {/* Healing Boost — the primary conversion element, right after the hero, before anything else */}
      {!hasHealingAccess && (
      <div style={{ padding: '0 22px 28px' }}>
        <div style={{ textAlign: 'center', marginBottom: 14 }}>
          <div className="h-micro" style={{ marginBottom: 4 }}>Instant · No Commitment</div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,.9)' }}>Get Your Healing Boost</div>
          <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,.4)', marginTop: 6, maxWidth: 260, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.55 }}>Full library access, right now — pick your days and go.</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {BOOST_PLANS.map((plan, i) => (
            <button
              key={plan.id}
              type="button"
              onClick={() => {
                setSelectedPlan(plan);
                void handleStripePayment(plan.id);
              }}
              disabled={isProcessing}
              style={{
                flex: 1,
                position: 'relative',
                background: i === 1 ? 'linear-gradient(160deg, rgba(212,175,55,.18), rgba(212,175,55,.04))' : 'linear-gradient(135deg, rgba(212,175,55,.1), rgba(212,175,55,.03))',
                border: i === 1 ? '1.5px solid #D4AF37' : '1px solid rgba(212,175,55,.3)',
                borderRadius: 18,
                padding: i === 1 ? '16px 6px' : '14px 6px',
                textAlign: 'center',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transform: i === 1 ? 'scale(1.05)' : undefined,
                boxShadow: i === 1 ? '0 0 24px rgba(212,175,55,.2)' : undefined,
              }}
            >
              {i === 1 && (
                <span style={{ position: 'absolute', top: -9, left: '50%', transform: 'translateX(-50%)', fontSize: 7, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', background: '#D4AF37', color: '#050505', padding: '2px 8px', borderRadius: 10, whiteSpace: 'nowrap' }}>Most Chosen</span>
              )}
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.04em', color: 'rgba(255,255,255,.65)', marginBottom: 4 }}>{plan.days} {plan.days === 1 ? 'Day' : 'Days'}</div>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 15, color: '#D4AF37' }}>${plan.price.toFixed(2)}</div>
            </button>
          ))}
        </div>
      </div>
      )}

      {/* Sonic Treatments — moved right after the hero so the actual audio library is seen */}
      {/* before any upsell copy. Language toggle merged in here since it directly filters */}
      {/* which tracks show below (freeSessions/premiumSessions are derived from `language`). */}
      <section style={{ padding: '0 22px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div className="h-micro" style={{ marginBottom: 6 }}>Vedic Light-Code Audio · Frequency Transmissions</div>
          <div className="h-section-title h-shimmer">{T.medTitle}</div>
          <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,.5)', lineHeight: 1.65, marginTop: 10, maxWidth: 320, marginLeft: 'auto', marginRight: 'auto' }}>{T.medIntro}</p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <div className="h-glass" style={{ padding: '10px 16px', display: 'inline-flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,.4)' }}>🌐 {t('healing.langLabel', 'Meditation language')}</span>
            <HealingLanguageToggle language={language} setLanguage={setLanguage} />
          </div>
        </div>

        <Tabs defaultValue="free" className="space-y-4">
          <TabsList style={{ display: 'flex', background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.05)', borderRadius: 100, padding: 4, marginBottom: 20, gap: 3 }}>
            <TabsTrigger value="free" style={{ flex: 1, borderRadius: 100, fontSize: 10, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', padding: '8px 0' }}>{T.medFreeLabel}</TabsTrigger>
            <TabsTrigger value="premium" style={{ flex: 1, borderRadius: 100, fontSize: 10, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', padding: '8px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>{!(isAdmin || hasHealingAccess) && <Lock size={9} />}{T.medPremiumLabel}</TabsTrigger>
          </TabsList>

          <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.3em', textTransform: 'uppercase', color: 'rgba(212,175,55,.35)', textAlign: 'center', marginBottom: 16 }}>{T.medEncoded}</p>

          <TabsContent value="free" className="space-y-3 mt-4">
            {freeSessions.length > 0 ? freeSessions.slice(0, freeTracksExpanded ? undefined : 3).map((audio) => (
              <SessionRow key={audio.id} audio={audio as HealingAudio} isPlaying={isHealingPlaying(audio.id)} onTogglePlay={initiatePlay} formatDuration={formatDuration} isAdmin={isAdmin} ownedAudioIds={ownedAudioIds} hasHealingAccess={hasHealingAccess} onPurchase={handlePurchaseAudio} isProcessing={isProcessing} T={T} formatEnergyExchange={formatEnergyExchange} isPremiumTier={false} onRequestUpgrade={() => {}} />
            )) : (
              <div style={{ padding: '24px 0', textAlign: 'center', color: 'rgba(255,255,255,.3)', fontSize: 12 }}>{T.noSessions}</div>
            )}
            {freeSessions.length > 3 && (
              <button type="button" onClick={() => setFreeTracksExpanded(!freeTracksExpanded)} style={{ display: 'block', width: '100%', textAlign: 'center', padding: '8px 0', fontSize: 11, fontWeight: 700, color: 'rgba(212,175,55,.6)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                {freeTracksExpanded ? '← Show fewer' : `See all ${freeSessions.length} tracks →`}
              </button>
            )}
          </TabsContent>
          <TabsContent value="premium" className="space-y-3 mt-4">
            {premiumSessions.length > 0 ? premiumSessions.slice(0, premiumTracksExpanded ? undefined : 3).map((audio) => (
              <SessionRow key={audio.id} audio={audio as HealingAudio} isPlaying={isHealingPlaying(audio.id)} onTogglePlay={initiatePlay} formatDuration={formatDuration} isAdmin={isAdmin} ownedAudioIds={ownedAudioIds} hasHealingAccess={hasHealingAccess} onPurchase={handlePurchaseAudio} isProcessing={isProcessing} T={T} formatEnergyExchange={formatEnergyExchange} isPremiumTier onRequestUpgrade={() => setUpgradeSheetOpen(true)} />
            )) : (
              <div style={{ padding: '24px 0', textAlign: 'center', color: 'rgba(255,255,255,.3)', fontSize: 12 }}>{T.noSessions}</div>
            )}
            {premiumSessions.length > 3 && (
              <button type="button" onClick={() => setPremiumTracksExpanded(!premiumTracksExpanded)} style={{ display: 'block', width: '100%', textAlign: 'center', padding: '8px 0', fontSize: 11, fontWeight: 700, color: 'rgba(212,175,55,.6)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                {premiumTracksExpanded ? '← Show fewer' : `See all ${premiumSessions.length} tracks →`}
              </button>
            )}
          </TabsContent>
        </Tabs>
      </section>

      {/* Unlock the Library — merged: Prana-Flow subscription + the real 7/14/30-day breakdown + crypto */}
      {/* (used to be two disconnected cards/sections; same Stripe/crypto handlers as before, just one place) */}
      <section id="booking-section" style={{ padding: '0 22px 32px', scrollMarginTop: 32 }}>
        {!hasHealingAccess ? (
          <div className="h-pricing">
            <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: '1.3rem', color: 'white', textAlign: 'center', marginBottom: 8 }}>Unlock the Full Healing Library</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.45)', lineHeight: 1.7, marginBottom: 20, maxWidth: 300, margin: '0 auto 20px', textAlign: 'center' }}>Divine Transmission Audios · Sacred Frequencies · Full Meditation Access — go monthly, or pick a one-time pass below.</div>

            <button
              type="button"
              onClick={() => {
                setSelectedPlan(SUBSCRIPTION_PLAN);
                void handleStripePayment('subscription');
              }}
              disabled={isProcessing}
              style={{ width: '100%', padding: 16, borderRadius: 20, background: 'linear-gradient(135deg, rgba(212,175,55,.14), rgba(212,175,55,.04))', border: '1.5px solid #D4AF37', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center', marginBottom: 8 }}
            >
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.15em', textTransform: 'uppercase', color: 'rgba(212,175,55,.6)', marginBottom: 4 }}>Healing Monthly</div>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 18, color: '#D4AF37' }}>€147/{lang === 'sv' ? 'mån' : lang === 'no' ? 'mnd' : lang === 'es' ? 'mes' : 'mo'}</div>
            </button>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.3)', textAlign: 'center', marginBottom: 16 }}>Cancel anytime</div>

            <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,.3)', textAlign: 'center', marginBottom: 10 }}>Day-Pass · One-Time</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
              {HEALING_PLANS.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  className={`h-tier-btn${selectedPlan?.id === plan.id ? ' h-active' : ''}`}
                  onClick={() => {
                    setSelectedPlan(plan);
                    void handleStripePayment(plan.id);
                  }}
                  disabled={isProcessing}
                >
                  {plan.days} {T.days} — €{plan.price}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="h-cta-btn"
              onClick={() => void handleStripePayment((selectedPlan ?? HEALING_PLANS[1]).id)}
              disabled={isProcessing}
            >
              <Sparkles size={15} className="h-nadi" />
              {T.bookingCta}
            </button>

            <button
              type="button"
              disabled={isProcessing}
              onClick={() => void handleCryptoPayment(selectedPlan ?? HEALING_PLANS[1])}
              style={{
                width: '100%',
                marginTop: 12,
                padding: 12,
                borderRadius: 100,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '.08em',
                textTransform: 'uppercase',
                background: 'transparent',
                border: '1px solid rgba(212,175,55,.38)',
                color: '#D4AF37',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {T.payCryptoUsdcUsdt}
            </button>

            <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,.2)', lineHeight: 1.6, marginTop: 14 }}>{T.bookingDisclosure}</div>
            </div>
          </div>
        ) : (
          <div style={{ padding: 18, background: 'rgba(16,185,129,.08)', border: '1px solid rgba(16,185,129,.25)', borderRadius: 40, display: 'flex', alignItems: 'center', gap: 12 }}>
            <CheckCircle className="w-6 h-6 text-[#10B981] shrink-0" />
            <span style={{ color: '#10B981', fontWeight: 700 }}>{T.activeAccess}</span>
          </div>
        )}
      </section>

      <div className="h-divider" />

      {/* Learn More — everything kept, nothing deleted, tucked behind small icon taps for people who want depth */}
      <div style={{ padding: '20px 22px 6px' }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div className="h-micro">For Those Who Want to Know More</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginBottom: 4 }}>
          {[
            { key: 'why', icon: '✦', label: 'Why It Works' },
            { key: 'story', icon: '◈', label: 'Our Story' },
            { key: 'testimonials', icon: '❝', label: 'Testimonials' },
            { key: 'faq', icon: '?', label: 'Full Q&A' },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setLearnMoreOpen(learnMoreOpen === item.key ? null : item.key)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: learnMoreOpen === item.key ? 'rgba(212,175,55,.12)' : 'rgba(255,255,255,.02)', border: `1px solid ${learnMoreOpen === item.key ? 'rgba(212,175,55,.5)' : 'rgba(255,255,255,.08)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: 'rgba(212,175,55,.6)' }}>{item.icon}</div>
              <div style={{ fontSize: 8, color: 'rgba(255,255,255,.35)', textTransform: 'uppercase', letterSpacing: '.04em', textAlign: 'center', maxWidth: 56 }}>{item.label}</div>
            </button>
          ))}
        </div>

        {learnMoreOpen === 'why' && (
          <div style={{ marginTop: 16, background: 'rgba(255,255,255,.015)', border: '1px solid rgba(255,255,255,.05)', borderRadius: 20, padding: '18px 18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { icon: '◈', title: T.howCard1Title, body: T.howCard1Body },
              { icon: '⟁', title: T.howCard2Title, body: T.howCard2Body },
              { icon: '☽◯☾', title: T.howCard3Title, body: T.howCard3Body },
            ].map((card) => (
              <div key={card.title}>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: 'rgba(255,255,255,.75)', marginBottom: 4 }}>{card.icon} {card.title}</div>
                <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,.45)', lineHeight: 1.65 }}>{card.body}</div>
              </div>
            ))}
            <div style={{ borderTop: '1px solid rgba(255,255,255,.06)', paddingTop: 12 }}>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: 'rgba(255,255,255,.75)', marginBottom: 8 }}>{T.compTitle}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[[T.comp1L, T.comp1R], [T.comp2L, T.comp2R], [T.comp3L, T.comp3R], [T.comp4L, T.comp4R]].map(([left, right], i) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,.015)', border: '1px solid rgba(255,255,255,.04)', borderRadius: 16, overflow: 'hidden' }}>
                    <div className="h-diff-old">{left}</div>
                    <div className="h-diff-new"><span style={{ color: '#D4AF37' }}>→</span> {right}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {learnMoreOpen === 'story' && (
          <div style={{ marginTop: 16, background: 'rgba(255,255,255,.015)', border: '1px solid rgba(255,255,255,.05)', borderRadius: 20, padding: '18px' }}>
            {T.statementBody.split('\n\n').map((para, i) => (
              <p key={i} style={{ fontSize: 12.5, color: 'rgba(255,255,255,.5)', lineHeight: 1.75, fontStyle: 'italic', marginBottom: i === 0 ? 12 : 0 }}>{para}</p>
            ))}
          </div>
        )}

        {learnMoreOpen === 'testimonials' && (
          <div style={{ marginTop: 16 }}>
            <ReviewSection contentType="healing" contentId="general" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
              {testimonials.filter((x): x is typeof x & { text: string } => 'text' in x && !!x.text).slice(0, testimonialsExpanded ? 99 : 2).map((t_, i) => (
                <div key={i} className="h-testimonial">
                  <div style={{ fontSize: 22, color: 'rgba(212,175,55,.3)', lineHeight: 1, marginBottom: 8 }}>"</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', lineHeight: 1.7, fontStyle: 'italic', marginBottom: 10 }}>{t_.text}</div>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(212,175,55,.5)' }}>— {t_.name}</div>
                </div>
              ))}
              {testimonials.filter((x) => 'text' in x).length > 2 && (
                <Button variant="ghost" className="w-full text-[#D4AF37]/60 hover:text-[#D4AF37]" onClick={() => setTestimonialsExpanded(!testimonialsExpanded)}>
                  {testimonialsExpanded ? T.seeLess : T.seeMore}
                </Button>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginTop: 16 }}>
              {testimonialVideos.map((url, j) => (
                <div key={j} style={{ aspectRatio: '16/9', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(212,175,55,.2)' }}>
                  <iframe title={`Testimonial ${j + 1}`} src={url} style={{ width: '100%', height: '100%' }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                </div>
              ))}
            </div>
          </div>
        )}

        {learnMoreOpen === 'faq' && (
          <div style={{ marginTop: 16 }}>
            <Accordion type="single" collapsible style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { q: T.faq1Q, a: T.faq1A }, { q: T.faq2Q, a: T.faq2A }, { q: T.faq3Q, a: T.faq3A },
                { q: T.faq4Q, a: T.faq4A }, { q: T.faq5Q, a: T.faq5A }, { q: T.faq6Q, a: T.faq6A },
              ].map((item, i) => (
                <AccordionItem key={i} value={`faq-${i}`} style={{ background: 'rgba(255,255,255,.015)', border: '1px solid rgba(255,255,255,.05)', borderRadius: 20, overflow: 'hidden' }}>
                  <AccordionTrigger style={{ padding: '16px 20px', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,.82)', textAlign: 'left' }}>{item.q}</AccordionTrigger>
                  <AccordionContent style={{ padding: '0 20px 16px', fontSize: 12.5, color: 'rgba(255,255,255,.45)', lineHeight: 1.75, borderTop: '1px solid rgba(255,255,255,.04)' }}>{item.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}
      </div>

      <div className="h-divider" />

      {/* 1:1 sessions — small footer link, not a competing section. A different product from the library above. */}
      <div style={{ padding: '20px 22px 40px', textAlign: 'center' }}>
        <Link to="/private-sessions" style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', borderBottom: '1px solid rgba(255,255,255,.15)', paddingBottom: 2 }}>
          Looking for a personal 1:1 session with Kritagya & Laila? →
        </Link>
      </div>

      <div style={{ height: 60 }} />

      {/* ========== PAYMENT MODAL ========== */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="sm:max-w-md bg-[#1a1a1a] border-[#D4AF37]/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-[#D4AF37]">{T.choosePayment}</DialogTitle>
            <DialogDescription className="text-white/50">
              {selectedPlan && `${selectedPlan.name} — €${selectedPlan.price}`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Button size="lg" className="w-full bg-[#D4AF37] text-black font-bold" onClick={() => selectedPlan && handleStripePayment(selectedPlan.id)} disabled={isProcessing}>
              <CreditCard className="w-5 h-5 mr-2" />{T.payCard}
            </Button>
            <Button size="lg" className="w-full bg-white/[0.03] text-[#D4AF37] border border-[#D4AF37]/35 hover:bg-[#D4AF37]/10 hover:border-[#D4AF37]/45" onClick={() => selectedPlan && handleCryptoPayment(selectedPlan)} disabled={isProcessing}>
              <Wallet className="w-5 h-5 mr-2" />{T.payCryptoUsdcUsdt}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Crypto: USDC/USDT to treasury + record pending payment (same pattern as Akashic) */}
      <Dialog open={healingCryptoModalOpen} onOpenChange={(o) => { setHealingCryptoModalOpen(o); if (!o) setHealingCryptoPlan(null); }}>
        <DialogContent className="sm:max-w-md bg-[#0a0a0a] border-[#D4AF37]/30 text-white">
          <DialogHeader>
            <DialogTitle className="text-[#D4AF37]">{T.payCrypto}</DialogTitle>
            <DialogDescription className="text-white/50">
              {healingCryptoPlan &&
                (healingCryptoPlan.id === 'subscription'
                  ? `${T.bookingOngoing} — €${healingCryptoPlan.price}`
                  : `${healingCryptoPlan.days} ${T.days} — €${healingCryptoPlan.price}`)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm py-2">
            <p className="text-white/80">
              Send <strong className="text-[#D4AF37]">€{healingCryptoPlan?.price.toFixed(2)}</strong> equivalent in{' '}
              <strong className="text-[#D4AF37]">USDC or USDT</strong> (same network as the address below) to:
            </p>
            <div className="p-3 rounded-lg bg-black/50 font-mono text-xs break-all border border-[#D4AF37]/20 select-all">
              {HEALING_CRYPTO_TREASURY}
            </div>
            <p className="text-white/50 text-xs">
              Include your account email in the transaction memo if your wallet allows it. After sending, tap the button below so we can match your payment.
            </p>
            <Button
              className="w-full bg-[#D4AF37] text-black hover:bg-[#D4AF37]/90 font-bold"
              onClick={handleHealingCryptoSubmitted}
              disabled={isProcessing || !healingCryptoPlan}
            >
              {isProcessing ? '…' : "I've sent payment — record my initiation"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ========== UPGRADE SHEET ========== */}
      <Sheet open={upgradeSheetOpen} onOpenChange={setUpgradeSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl border-t border-[#D4AF37]/30 bg-[#0a0a0a] text-white">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-xl text-[#D4AF37]">
              <Crown className="w-6 h-6" /> Upgrade to Sovereign
            </SheetTitle>
            <SheetDescription className="text-white/50">Unlock all premium transmissions.</SheetDescription>
          </SheetHeader>
          <div className="grid gap-3 py-6">
            {HEALING_PLANS.map((plan) => (
              <Button key={plan.id} size="lg" className="w-full bg-[#D4AF37] text-black font-semibold" onClick={() => { setUpgradeSheetOpen(false); openPaymentModal(plan); }} disabled={isProcessing}>
                {plan.days} {T.days} — {formatEnergyExchange(plan.price)}
              </Button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
    </>
  );
};

// ============================================================
// SESSION ROW COMPONENT
// ============================================================
// Track titles come straight from the DB as e.g. "Shunya-Prakash: The Pure Void_432Hz_80Hz" —
// split the trailing frequency codes out into their own badge instead of showing raw underscores.
function parseTrackTitle(title: string): { name: string; freq: string | null } {
  const match = title.match(/^(.*?)((?:[\s_]*\d+(?:\.\d+)?\s*Hz)+)\s*$/i);
  if (!match) return { name: title, freq: null };
  const name = match[1].replace(/[_\s]+$/, '').trim();
  const freq = match[2].split('_').map((s) => s.trim()).filter(Boolean).join(' · ');
  return { name, freq: freq || null };
}

function SessionRow({ audio, isPlaying, onTogglePlay, formatDuration, isAdmin, ownedAudioIds, hasHealingAccess, onPurchase, isProcessing, T, formatEnergyExchange, isPremiumTier = false, onRequestUpgrade }: {
  audio: HealingAudio; isPlaying: boolean; onTogglePlay: (a: HealingAudio) => void; formatDuration: (s: number) => string; isAdmin: boolean; ownedAudioIds: Set<string>; hasHealingAccess: boolean; onPurchase: (a: HealingAudio, m: 'shc' | 'stripe') => void; isProcessing: boolean; T: Record<string, string>; formatEnergyExchange: (p: number) => string; isPremiumTier?: boolean; onRequestUpgrade?: () => void;
}) {
  const hasAccess = isAdmin || audio.is_free || ownedAudioIds.has(audio.id) || hasHealingAccess;
  const isLockedPremium = isPremiumTier && !hasAccess;
  const priceLabel = formatEnergyExchange(audio.price_usd);
  const { name: trackName, freq: trackFreq } = parseTrackTitle(audio.title);

  const live = hasAccess && isPlaying;

  return (
    <div className={`h-track${live ? ' h-playing' : ''}`}>
      <button
        type="button"
        onClick={() => isLockedPremium && onRequestUpgrade ? onRequestUpgrade() : onTogglePlay(audio)}
        className={`h-play-btn${live ? ' h-playing' : ''}`}
      >
        {isLockedPremium && <Lock className="w-3 h-3 text-[#D4AF37] absolute -top-1 -right-1 z-[1]" />}
        {hasAccess && isPlaying ? <Pause size={14} className="relative z-[1]" /> : <Play size={14} style={{ marginLeft: 2 }} className="relative z-[1]" />}
      </button>
      <div className="flex-1 min-w-0">
        <div
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: '.02em',
            color: isPlaying ? '#D4AF37' : 'rgba(255,255,255,0.88)',
            textShadow: isPlaying ? '0 0 20px rgba(212,175,55,0.45), 0 0 40px rgba(212,175,55,0.15)' : undefined,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical' as const,
            lineHeight: 1.35,
            marginBottom: 3,
          }}
        >
          {trackName}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', fontSize: 10.5, color: 'rgba(255,255,255,.4)' }}>
          <span>⏱ {formatDuration(audio.duration_seconds)}</span>
          {trackFreq && (
            <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 7px', borderRadius: 20, background: 'rgba(212,175,55,.08)', border: '1px solid rgba(212,175,55,.2)', color: 'rgba(212,175,55,.75)' }}>{trackFreq}</span>
          )}
          {hasAccess ? (
            <span style={{ color: '#D4AF37', fontSize: 9, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase' }}>● {T.owned}</span>
          ) : (
            <span style={{ color: '#D4AF37' }}>• {priceLabel}</span>
          )}
        </div>
      </div>
      {hasAccess ? (
        <Download size={14} style={{ color: 'rgba(255,255,255,.2)', cursor: 'pointer', flexShrink: 0 }} />
      ) : isLockedPremium ? (
        <Button size="sm" className="bg-[#D4AF37] text-black font-semibold text-xs shrink-0" onClick={onRequestUpgrade}>Unlock</Button>
      ) : (
        <Button size="sm" className="bg-[#D4AF37] text-black font-bold text-xs shrink-0" onClick={() => onPurchase(audio, 'stripe')} disabled={isProcessing}>{priceLabel}</Button>
      )}
    </div>
  );
}

export default Healing;
