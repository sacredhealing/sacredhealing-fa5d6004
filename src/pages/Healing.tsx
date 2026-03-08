import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { toast as sonnerToast } from 'sonner';
import { Sparkles, Play, Pause, Lock, Download, Heart, Clock, Music, CheckCircle, Star, CreditCard, Wallet, ChevronDown, ChevronUp, Crown, Key, Flame, Eye, Waves, TreePine, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { SriYantra } from '@/components/dashboard/SriYantra';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ReviewSection } from '@/components/reviews/ReviewSection';
import { usePhantomWallet } from '@/hooks/usePhantomWallet';
import { HealingProgressCard } from '@/components/healing/HealingProgressCard';
import { useAdminRole } from '@/hooks/useAdminRole';
import { IntentionThreshold, IntentionType } from '@/components/meditation/IntentionThreshold';
import MeditationMembershipBanner from '@/components/meditation/MeditationMembershipBanner';
import { useMusicPlayer, UniversalAudioItem } from '@/contexts/MusicPlayerContext';
import { useHealingMeditationLanguage } from '@/hooks/useHealingMeditationLanguage';
import { HealingLanguageToggle } from '@/features/healing/HealingLanguageToggle';
import { getHealingSessions, type HealingSessionItem } from '@/features/healing/getHealingSessions';
import { useJyotishProfile } from '@/hooks/useJyotishProfile';

/* ─── SQI-2050 INLINE STYLES ─── */
const H_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&family=Cinzel:wght@400;500;600&display=swap');
  :root { --h-gold:#D4AF37; --h-gold2:#F5E17A; --h-black:#050505; --h-glass:rgba(255,255,255,0.02); --h-border:rgba(255,255,255,0.05); --h-muted:rgba(255,255,255,0.42); --h-cyan:#22D3EE; --h-green:#10B981; --r40:40px; }
  .h-page { font-family: 'Plus Jakarta Sans', sans-serif; background: var(--h-black); color: rgba(255,255,255,0.9); min-height: 100vh; overflow-x: hidden; }
  .h-glass { background: var(--h-glass); backdrop-filter: blur(40px); -webkit-backdrop-filter: blur(40px); border: 1px solid var(--h-border); border-radius: var(--r40); transition: border-color .3s; }
  .h-glass:hover { border-color: rgba(212,175,55,.12); }
  @keyframes hShimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
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
  .h-play-btn { width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0; background: linear-gradient(135deg, rgba(212,175,55,.12), rgba(212,175,55,.04)); border: 1px solid rgba(212,175,55,.22); display: flex; align-items: center; justify-content: center; color: #D4AF37; transition: all .22s; }
  .h-track:hover .h-play-btn { background: linear-gradient(135deg, #D4AF37, #B8960C); color: #050505; box-shadow: 0 0 18px rgba(212,175,55,.45); }
  .h-testimonial { padding: 18px 20px; background: rgba(255,255,255,.015); border: 1px solid rgba(255,255,255,.04); border-radius: 24px; }
  .h-pricing { background: linear-gradient(135deg, rgba(139,92,246,.08), rgba(212,175,55,.05)); border: 1px solid rgba(212,175,55,.18); border-radius: var(--r40); padding: 30px 24px 24px; text-align: center; position: relative; overflow: hidden; }
  .h-pricing::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse 60% 40% at 50% 0%, rgba(212,175,55,.08), transparent 65%); }
  .h-tier-btn { flex: 1; min-width: 88px; padding: 12px 14px; border-radius: 100px; font-size: 12px; font-weight: 800; background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.08); color: rgba(255,255,255,.7); cursor: pointer; font-family: inherit; transition: all .22s; }
  .h-tier-btn:hover, .h-tier-btn.h-active { background: linear-gradient(135deg, rgba(212,175,55,.12), rgba(212,175,55,.04)); border-color: rgba(212,175,55,.3); color: #D4AF37; box-shadow: 0 0 16px rgba(212,175,55,.12); }
  .h-cta-btn { width: 100%; padding: 15px; border-radius: 100px; background: linear-gradient(135deg, #D4AF37, #B8960C); color: #050505; font-size: 13px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; border: none; cursor: pointer; font-family: inherit; box-shadow: 0 0 28px rgba(212,175,55,.4); transition: all .25s; display: flex; align-items: center; justify-content: center; gap: 9px; }
  .h-cta-btn:hover { box-shadow: 0 0 50px rgba(212,175,55,.65); transform: scale(1.02); }
  .h-divider { height: 1px; background: linear-gradient(90deg, transparent, rgba(212,175,55,.1), transparent); margin: 0 22px 32px; }
`;

const JyotishHealingCard = () => {
  const jyotish = useJyotishProfile();
  if (jyotish.isLoading || !jyotish.mahadasha) return null;
  return (
    <div className="h-vedic" style={{ margin: '0 22px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ color: '#10B981', fontSize: 15 }}>⚕</span>
        <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: '.4em', textTransform: 'uppercase', color: 'rgba(16,185,129,.7)' }}>Vedic Healing Insight</span>
      </div>
      <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.5)', lineHeight: 1.65 }}>
        During your <strong style={{ color: '#D4AF37' }}>{jyotish.mahadasha}/{jyotish.antardasha}</strong> period, <strong style={{ color: '#D4AF37' }}>{jyotish.doshaImbalance}</strong> may occur. {jyotish.healingFocus} can help restore balance during your {jyotish.bhriguCycle} cycle.
      </div>
    </div>
  );
};

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

function formatEnergyExchange(priceUsd: number): string {
  const sek = Math.round(priceUsd * 11);
  return `Exchange: $${priceUsd} / ${sek}kr`;
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
    testimTitle: 'Miracle Logs',
    testimSub: 'Everyone experiences it differently.',
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
    testimTitle: 'Mirakelloggar',
    testimSub: 'Alla upplever det olika.',
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
    testimTitle: 'Mirakellogger', testimSub: 'Alle opplever det forskjellig.',
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
    payCard: 'Betal med kort', payCrypto: 'Betal med krypto', days: 'dager',
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
    testimTitle: 'Registros de Milagros', testimSub: 'Cada uno lo experimenta de manera diferente.',
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
    payCard: 'Pagar con tarjeta', payCrypto: 'Pagar con crypto', days: 'días',
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
  const { walletAddress, isPhantomInstalled, connectWallet } = usePhantomWallet();
  const { isAdmin } = useAdminRole();
  const { language, setLanguage } = useHealingMeditationLanguage();
  const { playUniversalAudio, currentAudio, isPlaying: playerIsPlaying } = useMusicPlayer();

  // Determine display language
  const rawLang = (i18n.language?.split('-')[0] || 'en') as string;
  const lang: LangKey = (rawLang === 'sv' || rawLang === 'no' || rawLang === 'es') ? rawLang : 'en';
  const T = tx[lang];

  const [audioTracks, setAudioTracks] = useState<HealingAudio[]>([]);
  const [ownedAudioIds, setOwnedAudioIds] = useState<Set<string>>(new Set());
  const [hasHealingAccess, setHasHealingAccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<HealingPlan | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [showThreshold, setShowThreshold] = useState(false);
  const [pendingAudio, setPendingAudio] = useState<HealingAudio | null>(null);
  const [testimonialsExpanded, setTestimonialsExpanded] = useState(false);
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
    setIsProcessing(true); setPaymentModalOpen(false);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast({ title: 'Please sign in', variant: 'destructive' }); return; }
      const { data, error } = await supabase.functions.invoke('create-healing-checkout', { body: { planType } });
      if (error) throw error;
      if (data?.url) window.open(data.url, '_blank');
    } catch (err: unknown) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Unknown error', variant: 'destructive' });
    } finally { setIsProcessing(false); }
  };

  const handleCryptoPayment = async (plan: HealingPlan) => {
    setPaymentModalOpen(false);
    if (!isPhantomInstalled) {
      toast({ title: 'Phantom Not Installed', description: 'Install Phantom wallet', variant: 'destructive' });
      window.open('https://phantom.app/', '_blank'); return;
    }
    if (!walletAddress) { try { await connectWallet(); } catch { toast({ title: 'Connection Failed', variant: 'destructive' }); } return; }
    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast({ title: 'Please sign in', variant: 'destructive' }); return; }
      const treasuryWallet = 'BAfPGN6DUAKYVwmmGkhMQxJyDv2cHEHRnfcbzy1GNy5j';
      const solAmount = (plan.price * 0.005).toFixed(4);
      toast({ title: 'Send SOL', description: `Send ${solAmount} SOL. Contact support after to activate.` });
      window.open(`https://phantom.app/ul/v1/browse/https://solscan.io/account/${treasuryWallet}`, '_blank');
    } catch (err: unknown) {
      toast({ title: 'Payment Failed', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' });
    } finally { setIsProcessing(false); }
  };

  const handleSubscriptionStripe = async () => {
    setIsProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast({ title: 'Please sign in', variant: 'destructive' }); return; }
      const { data, error } = await supabase.functions.invoke('create-healing-checkout', { body: { planType: 'subscription' } });
      if (error) throw error;
      if (data?.url) window.open(data.url, '_blank');
    } catch (err: unknown) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Unknown error', variant: 'destructive' });
    } finally { setIsProcessing(false); }
  };

  const handlePurchaseAudio = async (audio: HealingAudio, method: 'shc' | 'stripe') => {
    setIsProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast({ title: 'Please sign in', variant: 'destructive' }); return; }
      const { data, error } = await supabase.functions.invoke('purchase-healing-audio', { body: { audioId: audio.id, paymentMethod: method } });
      if (error) throw error;
      if (data?.url) window.open(data.url, '_blank');
      else if (data?.success) {
        toast({ title: 'Purchase complete', description: `You now own ${audio.title}` });
        setOwnedAudioIds((prev) => new Set([...prev, audio.id]));
      }
    } catch (err: unknown) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Unknown error', variant: 'destructive' });
    } finally { setIsProcessing(false); }
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
    if (!audioUrl) { if (canPlay && !audio.audio_url) sonnerToast.error('Audio not yet uploaded'); return; }
    if (currentAudio?.id === audio.id && currentAudio?.contentType === 'healing') { startPlayback(audio); return; }
    setPendingAudio(audio); setShowThreshold(true);
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
      <IntentionThreshold isOpen={showThreshold} onSelectIntention={handleIntentionSelected} onClose={handleThresholdClose} />

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
          {T.heroSubtitle}
        </p>
        <button type="button" className="h-cta-btn" style={{ width: 'auto', padding: '16px 36px' }} onClick={scrollToBooking}>
          <Sparkles size={15} className="h-nadi" />
          {T.heroCta}
        </button>
      </section>

      {/* Language toggle */}
      <div style={{ padding: '0 22px', marginBottom: 24 }}>
        <div className="h-glass" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,.4)' }}>🌐 {t('healing.langLabel', 'Meditation language')}</span>
          <HealingLanguageToggle language={language} setLanguage={setLanguage} />
        </div>
      </div>

      <MeditationMembershipBanner />

      <JyotishHealingCard />

      {/* HealingProgressCard */}
      <div style={{ padding: '0 22px', marginBottom: 24 }}>
        <HealingProgressCard variant="full" />
      </div>

      <div className="h-divider" />

      {/* Evolution of Grace */}
      <section style={{ padding: '0 22px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div className="h-micro" style={{ marginBottom: 6 }}>Avataric Blueprint · Origin Story</div>
          <div className="h-section-title h-shimmer">{T.statementTitle}</div>
        </div>
        <div className="h-glass" style={{ padding: '28px 26px' }}>
          {T.statementBody.split('\n\n').map((para, i) => (
            <p key={i} style={{ fontSize: 13, color: 'rgba(255,255,255,.55)', lineHeight: 1.8, fontStyle: 'italic', marginBottom: i === 0 ? 14 : 0 }}>{para}</p>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '0 22px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div className="h-micro" style={{ marginBottom: 6 }}>Prema-Pulse Mechanics</div>
          <div className="h-section-title h-shimmer">{T.howTitle}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { icon: '◈', title: T.howCard1Title, body: T.howCard1Body },
            { icon: '⟁', title: T.howCard2Title, body: T.howCard2Body },
            { icon: '☽◯☾', title: T.howCard3Title, body: T.howCard3Body },
          ].map((card) => (
            <div key={card.title} className="h-glass" style={{ padding: '26px 24px' }}>
              <div className="h-how-icon">{card.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: '-.01em', marginBottom: 8 }}>{card.title}</div>
              <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.5)', lineHeight: 1.65 }}>{card.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Why different */}
      <section style={{ padding: '0 22px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div className="h-micro" style={{ marginBottom: 6 }}>Bhakti-Algorithm Comparison</div>
          <div className="h-section-title h-shimmer">{T.compTitle}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[[T.comp1L, T.comp1R], [T.comp2L, T.comp2R], [T.comp3L, T.comp3R], [T.comp4L, T.comp4R]].map(([left, right], i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,.015)', border: '1px solid rgba(255,255,255,.04)', borderRadius: 20, overflow: 'hidden' }}>
              <div className="h-diff-old">{left}</div>
              <div className="h-diff-new"><span style={{ color: '#D4AF37' }}>→</span> {right}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Direct Healing CTA */}
      <div style={{ margin: '0 22px 32px', background: 'linear-gradient(135deg,rgba(139,92,246,.07),rgba(212,175,55,.05))', border: '1px solid rgba(212,175,55,.2)', borderRadius: 40, padding: '30px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 50% at 50% 0%,rgba(212,175,55,.07),transparent 65%)', pointerEvents: 'none' }} />
        <div className="h-section-title h-shimmer" style={{ marginBottom: 10 }}>{T.directTitle}</div>
        <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.45)', lineHeight: 1.65, marginBottom: 24 }}>{T.directSub}</div>
        <Link to="/private-sessions">
          <button type="button" className="h-cta-btn" style={{ width: 'auto', padding: '16px 36px', display: 'inline-flex' }}>
            <Sparkles size={15} className="h-nadi" />
            {T.directCta}
          </button>
        </Link>
      </div>

      {/* Your Healing Journey accordion */}
      <div style={{ padding: '0 22px 32px' }}>
        <Accordion type="single" collapsible>
          <AccordionItem value="journey" style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.05)', borderRadius: 40, overflow: 'hidden' }}>
            <AccordionTrigger style={{ padding: '20px 24px', fontWeight: 800, fontSize: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Sparkles size={15} style={{ color: '#D4AF37' }} />
                {t('healing.journeyTitle', 'Your Healing Journey')}
              </div>
            </AccordionTrigger>
            <AccordionContent style={{ padding: '0 24px 20px' }}>
              <HealingProgressCard variant="full" />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <div className="h-divider" />

      {/* Sonic Treatments */}
      <section style={{ padding: '0 22px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div className="h-micro" style={{ marginBottom: 6 }}>Vedic Light-Code Audio · Frequency Transmissions</div>
          <div className="h-section-title h-shimmer">{T.medTitle}</div>
        </div>

        <Tabs defaultValue="free" className="space-y-4">
          <TabsList style={{ display: 'flex', background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.05)', borderRadius: 100, padding: 4, marginBottom: 20, gap: 3 }}>
            <TabsTrigger value="free" style={{ flex: 1, borderRadius: 100, fontSize: 10, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', padding: '8px 0' }}>{T.medCat1}</TabsTrigger>
            <TabsTrigger value="premium" style={{ flex: 1, borderRadius: 100, fontSize: 10, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', padding: '8px 0' }}>{T.medCat3}</TabsTrigger>
          </TabsList>

          <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.3em', textTransform: 'uppercase', color: 'rgba(212,175,55,.35)', textAlign: 'center', marginBottom: 16 }}>{T.medEncoded}</p>

          <TabsContent value="free" className="space-y-3 mt-4">
            {freeSessions.length > 0 ? freeSessions.map((audio) => (
              <SessionRow key={audio.id} audio={audio as HealingAudio} isPlaying={isHealingPlaying(audio.id)} onTogglePlay={initiatePlay} formatDuration={formatDuration} isAdmin={isAdmin} ownedAudioIds={ownedAudioIds} hasHealingAccess={hasHealingAccess} onPurchase={handlePurchaseAudio} isProcessing={isProcessing} T={T} formatEnergyExchange={formatEnergyExchange} isPremiumTier={false} onRequestUpgrade={() => {}} />
            )) : (
              <div style={{ padding: '24px 0', textAlign: 'center', color: 'rgba(255,255,255,.3)', fontSize: 12 }}>{T.noSessions}</div>
            )}
          </TabsContent>
          <TabsContent value="premium" className="space-y-3 mt-4">
            {premiumSessions.length > 0 ? premiumSessions.map((audio) => (
              <SessionRow key={audio.id} audio={audio as HealingAudio} isPlaying={isHealingPlaying(audio.id)} onTogglePlay={initiatePlay} formatDuration={formatDuration} isAdmin={isAdmin} ownedAudioIds={ownedAudioIds} hasHealingAccess={hasHealingAccess} onPurchase={handlePurchaseAudio} isProcessing={isProcessing} T={T} formatEnergyExchange={formatEnergyExchange} isPremiumTier onRequestUpgrade={() => setUpgradeSheetOpen(true)} />
            )) : (
              <div style={{ padding: '24px 0', textAlign: 'center', color: 'rgba(255,255,255,.3)', fontSize: 12 }}>{T.noSessions}</div>
            )}
          </TabsContent>
        </Tabs>

        <button type="button" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: 14, marginTop: 12, background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.05)', borderRadius: 20, fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.45)', cursor: 'pointer', fontFamily: 'inherit' }} onClick={() => navigate('/meditations')}>
          {T.viewAll} →
        </button>
      </section>

      <div className="h-divider" />

      {/* Miracle Logs / Testimonials */}
      <section style={{ padding: '0 22px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div className="h-micro" style={{ marginBottom: 6 }}>Transmission Testimonials · Verified Field Reports</div>
          <div className="h-section-title h-shimmer">{T.testimTitle}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', marginTop: 6 }}>{T.testimSub}</div>
        </div>

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
      </section>

      <div className="h-divider" />

      {/* FAQ */}
      <section style={{ padding: '0 22px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div className="h-micro" style={{ marginBottom: 6 }}>Akasha-Intelligence Answers</div>
          <div className="h-section-title h-shimmer">{T.faqTitle}</div>
        </div>
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
      </section>

      {/* Booking — Stripe/checkout preserved */}
      <section id="booking-section" style={{ padding: '0 22px 32px', scrollMarginTop: 32 }}>
        {!hasHealingAccess ? (
          <div className="h-pricing">
            <div className="h-micro" style={{ marginBottom: 10 }}>Sacred Initiation · Stripe Checkout</div>
            <div className="h-section-title h-shimmer" style={{ marginBottom: 8 }}>{T.bookingTitle}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.45)', lineHeight: 1.7, marginBottom: 24, maxWidth: 300, margin: '0 auto 24px' }}>{T.bookingSub}</div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
              {HEALING_PLANS.map((plan) => (
                <button key={plan.id} type="button" className={`h-tier-btn${selectedPlan?.id === plan.id ? ' h-active' : ''}`} onClick={() => openPaymentModal(plan)} disabled={isProcessing}>
                  {plan.days} {T.days} — €{plan.price}
                </button>
              ))}
            </div>

            <button type="button" style={{ width: '100%', padding: 13, borderRadius: 100, fontSize: 12, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.06)', color: 'rgba(255,255,255,.45)', cursor: 'pointer', fontFamily: 'inherit', marginBottom: 20 }} onClick={handleSubscriptionStripe} disabled={isProcessing}>
              {T.bookingOngoing} — €147/{lang === 'sv' ? 'mån' : lang === 'no' ? 'mnd' : lang === 'es' ? 'mes' : 'mo'}
            </button>

            <button type="button" className="h-cta-btn" onClick={() => openPaymentModal(selectedPlan ?? HEALING_PLANS[1])}>
              <Sparkles size={15} className="h-nadi" />
              {T.bookingCta}
            </button>

            <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,.2)', lineHeight: 1.6, marginTop: 14, position: 'relative', zIndex: 1 }}>{T.bookingDisclosure}</div>
          </div>
        ) : (
          <div style={{ padding: 18, background: 'rgba(16,185,129,.08)', border: '1px solid rgba(16,185,129,.25)', borderRadius: 40, display: 'flex', alignItems: 'center', gap: 12 }}>
            <CheckCircle className="w-6 h-6 text-[#10B981] shrink-0" />
            <span style={{ color: '#10B981', fontWeight: 700 }}>{T.activeAccess}</span>
          </div>
        )}
      </section>

      <div style={{ display: 'flex', justifyContent: 'center', padding: '0 22px 40px' }}>
        <SriYantra style={{ width: 80, height: 80 }} />
      </div>

      <div style={{ padding: '0 22px 32px' }}>
        <MeditationMembershipBanner />
      </div>

      <div style={{ height: 100 }} />

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
            <Button size="lg" className="w-full bg-white/10 text-white border border-white/20 hover:bg-white/20" onClick={() => selectedPlan && handleCryptoPayment(selectedPlan)} disabled={isProcessing}>
              <Wallet className="w-5 h-5 mr-2" />{T.payCrypto}
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
function SessionRow({ audio, isPlaying, onTogglePlay, formatDuration, isAdmin, ownedAudioIds, hasHealingAccess, onPurchase, isProcessing, T, formatEnergyExchange, isPremiumTier = false, onRequestUpgrade }: {
  audio: HealingAudio; isPlaying: boolean; onTogglePlay: (a: HealingAudio) => void; formatDuration: (s: number) => string; isAdmin: boolean; ownedAudioIds: Set<string>; hasHealingAccess: boolean; onPurchase: (a: HealingAudio, m: 'shc' | 'stripe') => void; isProcessing: boolean; T: Record<string, string>; formatEnergyExchange: (p: number) => string; isPremiumTier?: boolean; onRequestUpgrade?: () => void;
}) {
  const hasAccess = isAdmin || audio.is_free || ownedAudioIds.has(audio.id) || hasHealingAccess;
  const isLockedPremium = isPremiumTier && !hasAccess;
  const priceLabel = formatEnergyExchange(audio.price_usd);

  return (
    <div className="h-track">
      <button
        type="button"
        onClick={() => isLockedPremium && onRequestUpgrade ? onRequestUpgrade() : onTogglePlay(audio)}
        className="h-play-btn relative"
      >
        {isLockedPremium && <Lock className="w-3 h-3 text-[#D4AF37] absolute -top-1 -right-1" />}
        {hasAccess && isPlaying ? <Pause size={14} /> : <Play size={14} style={{ marginLeft: 2 }} />}
      </button>
      <div className="flex-1 min-w-0">
        <div style={{ fontSize: 13.5, fontWeight: 700, letterSpacing: '-.01em', marginBottom: 3 }}>{audio.title}</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 10.5, color: 'rgba(255,255,255,.4)' }}>
          <span>⏱ {formatDuration(audio.duration_seconds)}</span>
          {hasAccess ? (
            <span style={{ color: '#10B981', fontSize: 9, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase' }}>● {T.owned}</span>
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
