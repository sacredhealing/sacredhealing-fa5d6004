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
import { ResonancePanel } from '@/components/resonance/UniversalResonanceEngine';

const JyotishHealingCard = () => {
  const jyotish = useJyotishProfile();
  if (jyotish.isLoading) return null;
  return (
    <div className="mx-4 mb-4 p-4 rounded-2xl bg-gradient-to-r from-amber-900/20 to-emerald-900/20 border border-amber-800/20">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-emerald-400">🔱</span>
        <span className="text-sm font-serif text-amber-300 uppercase tracking-wider">
          Vedic Healing Insight
        </span>
      </div>
      <p className="text-sm text-amber-100/70 mb-1">
        During your <strong className="text-amber-200">{jyotish.mahadasha}/{jyotish.antardasha}</strong> period,{' '}
        <strong className="text-amber-200">{jyotish.doshaImbalance}</strong> may occur.
      </p>
      <p className="text-sm text-amber-100/50">
        {jyotish.healingFocus} can help restore balance during your {jyotish.bhriguCycle} cycle.
      </p>
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
  // RENDER
  // ============================================================
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
    <div>
    <>
      <IntentionThreshold isOpen={showThreshold} onSelectIntention={handleIntentionSelected} onClose={handleThresholdClose} />

      <div className="min-h-screen bg-[#0a0a0a] text-white">

        {/* ========== SECTION 1: HERO ========== */}
        <section className="relative min-h-[85vh] flex flex-col items-center justify-center text-center px-6 overflow-hidden">
          {/* Background glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.08)_0%,transparent_70%)]" />
          {/* Sri Yantra background */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.06] pointer-events-none">
            <div className="w-[600px] h-[600px]">
              <SriYantra className="w-full h-full" variant="gold" />
            </div>
          </div>

          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#D4AF37] leading-tight" style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}>
              {T.heroTitle}
            </h1>
            <p className="text-white/70 text-base sm:text-lg leading-relaxed max-w-xl mx-auto">
              {T.heroSubtitle}
            </p>
            <button
              onClick={scrollToBooking}
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#D4AF37] text-black font-bold rounded-full text-base hover:bg-[#c4a030] transition"
            >
              <Sparkles className="w-5 h-5" />
              {T.heroCta}
            </button>
          </div>

          {/* Scroll hint */}
          <div className="absolute bottom-8 animate-bounce text-[#D4AF37]/40">
            <ChevronDown className="w-6 h-6" />
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-16 pb-24">

          {/* Language toggle */}
          <section className="flex flex-wrap items-center gap-3 rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 px-4 py-2.5">
            <span className="text-[#D4AF37]/70 text-sm font-medium">Language</span>
            <HealingLanguageToggle language={language} setLanguage={setLanguage} />
          </section>

          <MeditationMembershipBanner />

          <JyotishHealingCard />

          {/* ========== SECTION 2: HEALER'S STATEMENT ========== */}
          <section className="relative">
            <div className="border-l-2 border-[#D4AF37]/40 pl-6 sm:pl-8 space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-[#D4AF37]" style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}>
                {T.statementTitle}
              </h2>
              {T.statementBody.split('\n\n').map((para, i) => (
                <p key={i} className="text-white/75 leading-relaxed text-sm sm:text-base italic">
                  {para}
                </p>
              ))}
            </div>
          </section>

          {/* ========== SECTION 3: HOW IT WORKS ========== */}
          <section className="space-y-8">
            <h2 className="text-xl sm:text-2xl font-bold text-center text-[#D4AF37]" style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}>
              {T.howTitle}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { icon: <Waves className="w-6 h-6" />, title: T.howCard1Title, body: T.howCard1Body },
                { icon: <Flame className="w-6 h-6" />, title: T.howCard2Title, body: T.howCard2Body },
                { icon: <Music className="w-6 h-6" />, title: T.howCard3Title, body: T.howCard3Body },
              ].map((card, i) => (
                <div key={i} className="rounded-2xl border border-[#D4AF37]/20 bg-[#111] p-6 space-y-3 hover:border-[#D4AF37]/40 transition">
                  <div className="w-12 h-12 rounded-full bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37]">
                    {card.icon}
                  </div>
                  <h3 className="text-lg font-bold text-white">{card.title}</h3>
                  <p className="text-white/60 text-sm leading-relaxed">{card.body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ========== SECTION 4: COMPARISON ========== */}
          <section className="space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold text-center text-[#D4AF37]" style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}>
              {T.compTitle}
            </h2>
            <div className="space-y-3">
              {[
                [T.comp1L, T.comp1R], [T.comp2L, T.comp2R], [T.comp3L, T.comp3R], [T.comp4L, T.comp4R],
              ].map(([left, right], i) => (
                <div key={i} className="rounded-xl border border-[#D4AF37]/15 bg-[#111] overflow-hidden">
                  <div className="px-4 py-2.5 text-white/35 text-sm line-through decoration-white/20">{left}</div>
                  <div className="px-4 py-3 bg-[#D4AF37]/8 text-[#D4AF37] text-sm font-medium border-t border-[#D4AF37]/10">
                    → {right}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ========== DIRECT HEALING CTA ========== */}
          <section className="rounded-2xl overflow-hidden border-2 border-[#D4AF37]" style={{ boxShadow: '0 0 30px rgba(212,175,55,0.15)' }}>
            <div className="bg-gradient-to-r from-[#1a0b2e] to-[#0a0a0a] p-8 text-center space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}>
                {T.directTitle}
              </h2>
              <p className="text-white/70 text-sm max-w-lg mx-auto">{T.directSub}</p>
              <Link to="/private-sessions">
                <Button size="lg" className="bg-[#D4AF37] text-black font-semibold hover:bg-[#c4a030]">
                  <Sparkles className="w-5 h-5 mr-2" />
                  {T.directCta}
                </Button>
              </Link>
            </div>
          </section>

          {/* Journey card - collapsible on mobile */}
          <details className="rounded-xl border border-[#D4AF37]/15 bg-[#111] overflow-hidden group">
            <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-[#D4AF37]" />
                <span className="font-semibold text-white text-sm">Your Healing Journey</span>
              </div>
              <ChevronDown className="w-4 h-4 text-[#D4AF37]/50 group-open:rotate-180 transition-transform" />
            </summary>
            <div className="px-4 pb-4">
              <HealingProgressCard variant="full" />
            </div>
          </details>

          {/* ========== SECTION 5: MEDITATIONS ========== */}
          <section className="space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold text-center text-[#D4AF37]" style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}>
              {T.medTitle}
            </h2>

            <Tabs defaultValue="free" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2 h-11 bg-white/5 border border-[#D4AF37]/20">
                <TabsTrigger value="free" className="data-[state=active]:bg-[#D4AF37]/20 data-[state=active]:text-[#D4AF37] text-white/60">
                  {T.medCat1}
                </TabsTrigger>
                <TabsTrigger value="premium" className="data-[state=active]:bg-[#D4AF37]/20 data-[state=active]:text-[#D4AF37] text-white/60">
                  {T.medCat3}
                </TabsTrigger>
              </TabsList>

              <p className="text-center text-[#D4AF37]/50 text-xs uppercase tracking-widest">{T.medEncoded}</p>

              <TabsContent value="free" className="space-y-3 mt-4">
                {freeSessions.length > 0 ? freeSessions.map((audio) => (
                  <SessionRow key={audio.id} audio={audio as HealingAudio} isPlaying={isHealingPlaying(audio.id)} onTogglePlay={initiatePlay} formatDuration={formatDuration} isAdmin={isAdmin} ownedAudioIds={ownedAudioIds} hasHealingAccess={hasHealingAccess} onPurchase={handlePurchaseAudio} isProcessing={isProcessing} T={T} formatEnergyExchange={formatEnergyExchange} isPremiumTier={false} onRequestUpgrade={() => {}} />
                )) : (
                  <div className="py-8 text-center text-white/40 text-sm">{T.noSessions}</div>
                )}
              </TabsContent>
              <TabsContent value="premium" className="space-y-3 mt-4">
                {premiumSessions.length > 0 ? premiumSessions.map((audio) => (
                  <SessionRow key={audio.id} audio={audio as HealingAudio} isPlaying={isHealingPlaying(audio.id)} onTogglePlay={initiatePlay} formatDuration={formatDuration} isAdmin={isAdmin} ownedAudioIds={ownedAudioIds} hasHealingAccess={hasHealingAccess} onPurchase={handlePurchaseAudio} isProcessing={isProcessing} T={T} formatEnergyExchange={formatEnergyExchange} isPremiumTier onRequestUpgrade={() => setUpgradeSheetOpen(true)} />
                )) : (
                  <div className="py-8 text-center text-white/40 text-sm">{T.noSessions}</div>
                )}
              </TabsContent>
            </Tabs>

            <Button variant="outline" className="w-full border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10" onClick={() => navigate('/meditations')}>
              {T.viewAll}
            </Button>
          </section>

          {/* ========== SECTION 6: TESTIMONIALS ========== */}
          <section className="space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold text-center text-[#D4AF37]" style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}>
              {T.testimTitle}
            </h2>
            <p className="text-white/40 text-sm text-center">{T.testimSub}</p>

            {/* Video testimonials */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {testimonialVideos.map((url, j) => (
                <div key={j} className="aspect-video rounded-xl overflow-hidden border border-[#D4AF37]/20">
                  <iframe className="w-full h-full" src={url} title={`Testimonial ${j + 1}`} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                </div>
              ))}
            </div>

            {/* Text testimonials */}
            <div className="space-y-4">
              {testimonials.filter((x): x is typeof x & { text: string } => 'text' in x && !!x.text).slice(0, testimonialsExpanded ? 99 : 2).map((t, i) => (
                <div key={i} className="rounded-xl border border-[#D4AF37]/15 bg-[#111] p-5">
                  <div className="text-[#D4AF37]/30 text-4xl font-serif leading-none mb-2">"</div>
                  <p className="text-white/70 italic text-sm leading-relaxed">{t.text}</p>
                  <p className="text-[#D4AF37]/60 text-xs mt-3 font-semibold">— {t.name}</p>
                </div>
              ))}
              {testimonials.filter((x) => 'text' in x).length > 2 && (
                <Button variant="ghost" className="w-full text-[#D4AF37]/60 hover:text-[#D4AF37]" onClick={() => setTestimonialsExpanded(!testimonialsExpanded)}>
                  {testimonialsExpanded ? T.seeLess : T.seeMore}
                </Button>
              )}
            </div>
          </section>

          {/* ========== SECTION 7: FAQ ========== */}
          <section className="space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold text-center text-[#D4AF37]" style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}>
              {T.faqTitle}
            </h2>
            <Accordion type="multiple" className="space-y-2">
              {[
                { q: T.faq1Q, a: T.faq1A }, { q: T.faq2Q, a: T.faq2A }, { q: T.faq3Q, a: T.faq3A },
                { q: T.faq4Q, a: T.faq4A }, { q: T.faq5Q, a: T.faq5A }, { q: T.faq6Q, a: T.faq6A },
              ].map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border border-[#D4AF37]/15 rounded-xl px-5 bg-[#111]">
                  <AccordionTrigger className="text-left text-white/90 hover:no-underline text-sm py-4">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-white/60 text-sm leading-relaxed pb-4">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>

          {/* ========== SECTION 8: BOOKING ========== */}
          <section id="booking-section" className="scroll-mt-8 space-y-6">
            {!hasHealingAccess ? (
              <div className="rounded-2xl border-2 border-[#D4AF37]/30 bg-gradient-to-b from-[#1a0b2e]/50 to-[#0a0a0a] p-8 sm:p-12 text-center space-y-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-white" style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}>
                  {T.bookingTitle}
                </h2>
                <p className="text-white/50 text-sm max-w-lg mx-auto">{T.bookingSub}</p>

                <div className="flex flex-wrap justify-center gap-3">
                  {HEALING_PLANS.map((plan) => (
                    <button
                      key={plan.id}
                      onClick={() => openPaymentModal(plan)}
                      disabled={isProcessing}
                      className={`px-6 py-4 rounded-full font-bold text-base transition border-2 ${selectedPlan?.id === plan.id ? 'border-[#D4AF37] bg-[#D4AF37]/20 text-[#D4AF37]' : 'border-[#D4AF37]/30 bg-transparent text-[#D4AF37]/80 hover:border-[#D4AF37]/60'} disabled:opacity-50`}
                    >
                      {plan.days} {T.days} — €{plan.price}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleSubscriptionStripe}
                  disabled={isProcessing}
                  className="px-8 py-3 border border-[#D4AF37]/30 text-[#D4AF37]/70 rounded-full text-sm hover:border-[#D4AF37]/50 transition disabled:opacity-50"
                >
                  {T.bookingOngoing} — €147/{lang === 'sv' ? 'mån' : lang === 'no' ? 'mnd' : lang === 'es' ? 'mes' : 'mo'}
                </button>

                <p className="text-white/30 text-xs max-w-md mx-auto">{T.bookingDisclosure}</p>
              </div>
            ) : (
              <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-5 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-500 shrink-0" />
                <span className="text-green-400 font-medium">{T.activeAccess}</span>
              </div>
            )}
          </section>

          <ReviewSection contentType="healing" contentId="general" />
        </div>
      </div>

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
    </>
    </div>
      <aside className="hidden lg:block">
        <ResonancePanel page="Healing" />
      </aside>
    </div>
  );
};

// ============================================================
// SESSION ROW COMPONENT
// ============================================================
function SessionRow({ audio, isPlaying, onTogglePlay, formatDuration, isAdmin, ownedAudioIds, hasHealingAccess, onPurchase, isProcessing, T, formatEnergyExchange, isPremiumTier = false, onRequestUpgrade }: {
  audio: HealingAudio; isPlaying: boolean; onTogglePlay: (a: HealingAudio) => void; formatDuration: (s: number) => string; isAdmin: boolean; ownedAudioIds: Set<string>; hasHealingAccess: boolean; onPurchase: (a: HealingAudio, m: 'shc' | 'stripe') => void; isProcessing: boolean; T: Record<string, string>; formatEnergyExchange: (p: number) => string; isPremiumTier?: boolean; onRequestUpgrade?: () => void;
}) {
  const hasAccess = isAdmin || ownedAudioIds.has(audio.id) || hasHealingAccess;
  const isLockedPremium = isPremiumTier && !hasAccess;
  const priceLabel = formatEnergyExchange(audio.price_usd);

  return (
    <div className="rounded-xl border border-[#D4AF37]/10 bg-[#111] p-4 flex items-center gap-4 hover:border-[#D4AF37]/25 transition">
      <button
        type="button"
        onClick={() => isLockedPremium && onRequestUpgrade ? onRequestUpgrade() : onTogglePlay(audio)}
        className="w-12 h-12 rounded-full bg-[#D4AF37]/10 flex items-center justify-center hover:bg-[#D4AF37]/20 transition relative shrink-0"
      >
        {isLockedPremium && <Lock className="w-3 h-3 text-[#D4AF37] absolute -top-1 -right-1" />}
        {!hasAccess && !isLockedPremium && <Lock className="w-3 h-3 text-white/30 absolute -top-1 -right-1" />}
        {hasAccess && isPlaying ? <Pause className="w-5 h-5 text-[#D4AF37]" /> : <Play className="w-5 h-5 text-[#D4AF37] ml-0.5" />}
      </button>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-white text-sm truncate">{audio.title}</h3>
        <div className="flex items-center gap-2 text-xs text-white/40 mt-0.5">
          <Clock className="w-3 h-3" />
          <span>{formatDuration(audio.duration_seconds)}</span>
          {hasAccess ? (
            <span className="text-green-500">• {T.owned}</span>
          ) : (
            <span className="text-[#D4AF37]">• {priceLabel}</span>
          )}
        </div>
      </div>
      {hasAccess ? (
        <Button variant="ghost" size="icon" className="text-white/30 hover:text-white">
          <Download className="w-4 h-4" />
        </Button>
      ) : isLockedPremium ? (
        <Button size="sm" className="bg-[#D4AF37] text-black font-semibold text-xs" onClick={onRequestUpgrade}>
          Unlock
        </Button>
      ) : (
        <Button size="sm" className="bg-[#D4AF37] text-black font-bold text-xs" onClick={() => onPurchase(audio, 'stripe')} disabled={isProcessing}>
          {priceLabel}
        </Button>
      )}
    </div>
  );
}

export default Healing;
