import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast as sonnerToast } from 'sonner';
import { Sparkles, Play, Pause, Lock, Download, Heart, Clock, Music, CheckCircle, Star, CreditCard, Wallet, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSHCBalance } from '@/hooks/useSHCBalance';
import { ReviewSection } from '@/components/reviews/ReviewSection';
import { TranslatedContent } from '@/components/TranslatedContent';
import { usePhantomWallet } from '@/hooks/usePhantomWallet';
import { HealingProgressCard } from '@/components/healing/HealingProgressCard';
import { useAdminRole } from '@/hooks/useAdminRole';
import { IntentionThreshold, IntentionType } from '@/components/meditation/IntentionThreshold';
import MeditationMembershipBanner from '@/components/meditation/MeditationMembershipBanner';
import { useMusicPlayer, UniversalAudioItem } from '@/contexts/MusicPlayerContext';

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
}

interface HealingPlan {
  id: string;
  name: string;
  price: number;
  days: number;
}

const HEALING_PLANS: HealingPlan[] = [
  { id: '7_day', name: '7-Day Soul', price: 97, days: 7 },
  { id: '14_day', name: '14-Day Soul', price: 147, days: 14 },
  { id: '30_day', name: '30-Day Soul', price: 197, days: 30 },
];

const faqTranslations = {
  en: [
    { question: "How do I prepare myself for the healing?", answer: "You can receive the healing energy anytime, but choosing a specific time allows deeper connection. Sit or lie down comfortably, invite the energy to flow, and optionally listen to our healing music on Spotify or YouTube." },
    { question: "When will my healing start?", answer: "Healing begins after registration and booking your preferred date and time. The energy is programmed to flow according to your selected schedule." },
    { question: "How do I receive the healing at a distance?", answer: "Choose a time to receive the healing. Energy flows through the quantum field without restrictions. This encourages surrender and trust." },
    { question: "Do I have to do anything to make the healing work?", answer: "No special action is required, but meditation or being open enhances receptivity. Visualize receiving the energy and optionally pray for all beings. You can also send healing to someone else." },
    { question: "Is The Sacred Healing Vibration the same as Reiki?", answer: "Both draw from the universal source, but Sacred Healing Vibration does not follow a learned Reiki method. Frequencies are intuitively scanned and sent to support your unique needs." },
    { question: "Who can receive the healing?", answer: "Anyone or anything: adults, children, animals, those passing away, recently passed, or spaces like homes and vehicles. Healing works anywhere in the quantum universe." },
    { question: "How long is the healing sent for, and how often?", answer: "Each session is sent for approximately 30 minutes on the date and time booked." },
    { question: "How does the healing transform?", answer: "The Sacred Healing Vibration transmits divine love and light to the physical, emotional, mental, and spiritual levels. It works face-to-face or remotely. Being open enhances the experience." },
    { question: "What exactly will the energy heal?", answer: "Supports organ health, immune system, circulation, vitality, spiritual growth, focus, motivation, calmness, sleep, emotional balance, recovery, pain relief, and any other frequencies needed for your healing journey." },
    { question: "Does the soul practice support physical well-being?", answer: "The practice works on spiritual, mental, emotional, and physical levels. Spiritual and mental effects are noticed first, while emotional and physical improvements may take longer. Detox-like effects may occur. Not a substitute for medical care." },
    { question: "Can I sign someone else up for the healing?", answer: "Yes, you can register family, friends, or pets. Provide a photograph of the recipient after payment." },
    { question: "If I give the healing to someone else, do they have to know?", answer: "No. Healing works subtly on their body, mind, emotions, and spirit. Out of respect, ask first if possible." },
    { question: "Does the healing negatively affect other medical treatments?", answer: "No, the energy works on a subtle level and does not interfere with mainstream or alternative treatments. Temporary detox symptoms may occur." },
    { question: "Does it cost anything to receive the healing?", answer: "Pricing: 30-Day Healing €197, 14-Day Healing €147, 7-Day Healing €97. Option to subscribe 3 months for €147 per month." }
  ],
  sv: [
    { question: "Hur förbereder jag mig för healingen?", answer: "Du kan ta emot healingenergin när som helst, men att välja en specifik tid möjliggör djupare koppling. Sitt eller ligg bekvämt, bjud in energin att flöda, och lyssna gärna på vår healingmusik på Spotify eller YouTube." },
    { question: "När börjar min healing?", answer: "Healingen börjar efter registrering och bokning av ditt önskade datum och tid. Energin är programmerad att flöda enligt ditt valda schema." },
    { question: "Hur tar jag emot healingen på distans?", answer: "Välj en tid för att ta emot healingen. Energi flödar genom kvantfältet utan begränsningar. Detta uppmuntrar till överlåtelse och tillit." },
    { question: "Måste jag göra något för att healingen ska fungera?", answer: "Ingen speciell åtgärd krävs, men meditation eller öppenhet förstärker mottagligheten. Visualisera att du tar emot energin och be gärna för alla varelser. Du kan också skicka healing till någon annan." },
    { question: "Är Sacred Healing Vibration samma som Reiki?", answer: "Båda hämtar från den universella källan, men Sacred Healing Vibration följer inte en inlärd Reiki-metod. Frekvenser skannas intuitivt och skickas för att stödja dina unika behov." },
    { question: "Vem kan ta emot healingen?", answer: "Vem som helst eller vad som helst: vuxna, barn, djur, de som går bort, nyligen avlidna, eller utrymmen som hem och fordon. Healing fungerar överallt i kvantuniversum." },
    { question: "Hur länge skickas healingen och hur ofta?", answer: "Varje session skickas i cirka 30 minuter på det bokade datumet och tiden." },
    { question: "Hur transformerar healingen?", answer: "Sacred Healing Vibration överför gudomlig kärlek och ljus till fysiska, emotionella, mentala och andliga nivåer. Det fungerar ansikte mot ansikte eller på distans. Öppenhet förstärker upplevelsen." },
    { question: "Vad exakt kommer energin att heala?", answer: "Stöder organhälsa, immunsystem, cirkulation, vitalitet, andlig tillväxt, fokus, motivation, lugn, sömn, emotionell balans, återhämtning, smärtlindring och alla andra frekvenser som behövs för din healingresa." },
    { question: "Stöder själpraktiken fysiskt välbefinnande?", answer: "Praktiken verkar på andliga, mentala, emotionella och fysiska nivåer. Andliga och mentala effekter märks först, medan emotionella och fysiska förbättringar kan ta längre tid. Detox-liknande effekter kan förekomma. Ersätter inte medicinsk vård." },
    { question: "Kan jag anmäla någon annan för healingen?", answer: "Ja, du kan registrera familj, vänner eller husdjur. Ge ett fotografi av mottagaren efter betalning." },
    { question: "Om jag ger healingen till någon annan, måste de veta om det?", answer: "Nej. Healing verkar subtilt på deras kropp, sinne, känslor och ande. Av respekt, fråga först om möjligt." },
    { question: "Påverkar healingen andra medicinska behandlingar negativt?", answer: "Nej, energin verkar på en subtil nivå och stör inte konventionella eller alternativa behandlingar. Tillfälliga detox-symptom kan förekomma." },
    { question: "Kostar det något att ta emot healingen?", answer: "Prissättning: 30-dagars Healing €197, 14-dagars Healing €147, 7-dagars Healing €97. Möjlighet att prenumerera 3 månader för €147 per månad." }
  ],
  es: [
    { question: "¿Cómo me preparo para la sanación?", answer: "Puedes recibir la energía de sanación en cualquier momento, pero elegir un momento específico permite una conexión más profunda. Siéntate o acuéstate cómodamente, invita a la energía a fluir y, opcionalmente, escucha nuestra música de sanación en Spotify o YouTube." },
    { question: "¿Cuándo comenzará mi sanación?", answer: "La sanación comienza después del registro y la reserva de tu fecha y hora preferidas. La energía está programada para fluir según tu horario seleccionado." },
    { question: "¿Cómo recibo la sanación a distancia?", answer: "Elige un momento para recibir la sanación. La energía fluye a través del campo cuántico sin restricciones. Esto fomenta la entrega y la confianza." },
    { question: "¿Tengo que hacer algo para que la sanación funcione?", answer: "No se requiere ninguna acción especial, pero la meditación o estar abierto mejora la receptividad. Visualiza recibir la energía y opcionalmente ora por todos los seres. También puedes enviar sanación a otra persona." },
    { question: "¿Es la Vibración de Sanación Sagrada lo mismo que Reiki?", answer: "Ambos provienen de la fuente universal, pero la Vibración de Sanación Sagrada no sigue un método Reiki aprendido. Las frecuencias se escanean intuitivamente y se envían para apoyar tus necesidades únicas." },
    { question: "¿Quién puede recibir la sanación?", answer: "Cualquiera o cualquier cosa: adultos, niños, animales, personas que están falleciendo, recientemente fallecidas, o espacios como hogares y vehículos. La sanación funciona en cualquier lugar del universo cuántico." },
    { question: "¿Cuánto tiempo se envía la sanación y con qué frecuencia?", answer: "Cada sesión se envía durante aproximadamente 30 minutos en la fecha y hora reservadas." },
    { question: "¿Cómo transforma la sanación?", answer: "La Vibración de Sanación Sagrada transmite amor divino y luz a los niveles físico, emocional, mental y espiritual. Funciona cara a cara o de forma remota. Estar abierto mejora la experiencia." },
    { question: "¿Qué exactamente sanará la energía?", answer: "Apoya la salud de los órganos, sistema inmunológico, circulación, vitalidad, crecimiento espiritual, enfoque, motivación, calma, sueño, equilibrio emocional, recuperación, alivio del dolor y cualquier otra frecuencia necesaria para tu viaje de sanación." },
    { question: "¿La práctica del alma apoya el bienestar físico?", answer: "La práctica actúa en niveles espirituales, mentales, emocionales y físicos. Los efectos espirituales y mentales se notan primero, mientras que las mejoras emocionales y físicas pueden tardar más. Pueden ocurrir efectos similares a la desintoxicación. No sustituye la atención médica." },
    { question: "¿Puedo inscribir a otra persona para la sanación?", answer: "Sí, puedes registrar familia, amigos o mascotas. Proporciona una fotografía del destinatario después del pago." },
    { question: "Si le doy la sanación a otra persona, ¿tienen que saberlo?", answer: "No. La sanación actúa sutilmente en su cuerpo, mente, emociones y espíritu. Por respeto, pregunta primero si es posible." },
    { question: "¿La sanación afecta negativamente otros tratamientos médicos?", answer: "No, la energía actúa a un nivel sutil y no interfiere con tratamientos convencionales o alternativos. Pueden ocurrir síntomas temporales de desintoxicación." },
    { question: "¿Cuesta algo recibir la sanación?", answer: "Precios: Sanación de 30 días €197, Sanación de 14 días €147, Sanación de 7 días €97. Opción de suscribirse 3 meses por €147 al mes." }
  ],
  no: [
    { question: "Hvordan forbereder jeg meg på healingen?", answer: "Du kan motta healingenergien når som helst, men å velge et bestemt tidspunkt muliggjør dypere tilkobling. Sitt eller ligg komfortabelt, inviter energien til å flyte, og lytt gjerne til vår healingmusikk på Spotify eller YouTube." },
    { question: "Når starter healingen min?", answer: "Healingen begynner etter registrering og booking av ønsket dato og tid. Energien er programmert til å flyte i henhold til din valgte tidsplan." },
    { question: "Hvordan mottar jeg healingen på avstand?", answer: "Velg et tidspunkt for å motta healingen. Energi flyter gjennom kvantefeltet uten begrensninger. Dette oppmuntrer til overgivelse og tillit." },
    { question: "Må jeg gjøre noe for at healingen skal fungere?", answer: "Ingen spesiell handling er nødvendig, men meditasjon eller åpenhet forsterker mottakeligheten. Visualiser at du mottar energien og be gjerne for alle vesener. Du kan også sende healing til noen andre." },
    { question: "Er Sacred Healing Vibration det samme som Reiki?", answer: "Begge henter fra den universelle kilden, men Sacred Healing Vibration følger ikke en innlært Reiki-metode. Frekvenser skannes intuitivt og sendes for å støtte dine unike behov." },
    { question: "Hvem kan motta healingen?", answer: "Hvem som helst eller hva som helst: voksne, barn, dyr, de som går bort, nylig avdøde, eller rom som hjem og kjøretøy. Healing fungerer hvor som helst i kvanteuniverset." },
    { question: "Hvor lenge sendes healingen og hvor ofte?", answer: "Hver sesjon sendes i omtrent 30 minutter på den bookede datoen og tidspunktet." },
    { question: "Hvordan transformerer healingen?", answer: "Sacred Healing Vibration overfører guddommelig kjærlighet og lys til fysiske, emosjonelle, mentale og åndelige nivåer. Det fungerer ansikt til ansikt eller på avstand. Åpenhet forsterker opplevelsen." },
    { question: "Hva eksakt vil energien heale?", answer: "Støtter organhelse, immunsystem, sirkulasjon, vitalitet, åndelig vekst, fokus, motivasjon, ro, søvn, emosjonell balanse, restitusjon, smertelindring og alle andre frekvenser som trengs for din healingreise." },
    { question: "Støtter sjelpraksisen fysisk velvære?", answer: "Praktiken virker på åndelige, mentale, emosjonelle og fysiske nivåer. Åndelige og mentale effekter merkes først, mens emosjonelle og fysiske forbedringer kan ta lengre tid. Detox-lignende effekter kan forekomme. Erstatter ikke medisinsk behandling." },
    { question: "Kan jeg melde på noen andre for healingen?", answer: "Ja, du kan registrere familie, venner eller kjæledyr. Gi et fotografi av mottakeren etter betaling." },
    { question: "Hvis jeg gir healingen til noen andre, må de vite om det?", answer: "Nei. Healing virker subtilt på deres kropp, sinn, følelser og ånd. Av respekt, spør først hvis mulig." },
    { question: "Påvirker healingen andre medisinske behandlinger negativt?", answer: "Nei, energien virker på et subtilt nivå og forstyrrer ikke konvensjonelle eller alternative behandlinger. Midlertidige detox-symptomer kan forekomme." },
    { question: "Koster det noe å motta healingen?", answer: "Priser: 30-dagers Healing €197, 14-dagers Healing €147, 7-dagers Healing €97. Mulighet for å abonnere 3 måneder for €147 per måned." }
  ]
};

const testimonials = [
  { 
    name: "Michelle Folhmann", 
    videos: [
      "https://www.youtube.com/embed/xOHaZqrykjg?start=1", 
      "https://www.youtube.com/embed/NX-aI9_PTR4", 
      "https://www.youtube.com/embed/rk1MdyH3BV0"
    ] 
  },
  { 
    name: "Michelle Folhmann", 
    text: "I 'randomly' came into contact with Adam & Laila, and from that day on my life has gone through positive transformations on every level. My life has taken turns I never thought were possible, and for that I am forever grateful." 
  },
  { 
    name: "Cathrine Nummiranta", 
    text: "Everything changed at Adam's workshop. I am free from old stress and totally cured from the panic attacks I had since I was 14 years old. I listen daily to Adam & Laila's meditations. There are no words for how much it means to me." 
  }
];

const Healing: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { balance } = useSHCBalance();
  const { walletAddress, isPhantomInstalled, connectWallet, isConnecting } = usePhantomWallet();
  const { isAdmin } = useAdminRole();
  
  const [audioTracks, setAudioTracks] = useState<HealingAudio[]>([]);
  const [ownedAudioIds, setOwnedAudioIds] = useState<Set<string>>(new Set());
  const [hasHealingAccess, setHasHealingAccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<HealingPlan | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [dynamicContent, setDynamicContent] = useState<Record<string, string>>({});
  
  // Unified player
  const { playUniversalAudio, currentAudio, isPlaying: playerIsPlaying } = useMusicPlayer();
  
  // Intention threshold state
  const [showThreshold, setShowThreshold] = useState(false);
  const [pendingAudio, setPendingAudio] = useState<HealingAudio | null>(null);
  const [currentIntention, setCurrentIntention] = useState<IntentionType | null>(null);
  const [faqOpen, setFaqOpen] = useState(false);
  
  // Check if healing audio is currently playing
  const isHealingPlaying = (audioId: string) => {
    return currentAudio?.id === audioId && currentAudio?.contentType === 'healing' && playerIsPlaying;
  };

  const currentLang = i18n.language?.split('-')[0] || 'en';

  // Helper to get content from database or fallback to static
  const getContent = (key: string, fallback: string) => {
    const dbKey = `healing_${key}_${currentLang}`;
    return dynamicContent[dbKey] || fallback;
  };

  useEffect(() => {
    fetchAudioTracks();
    fetchDynamicContent();
    checkHealingAccess();
    checkOwnedAudio();

    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      toast({
        title: 'Payment Successful!',
        description: 'Welcome to your Sacred Soul Journey',
      });
      window.history.replaceState({}, '', '/healing');
      checkHealingAccess();
    }
  }, []);

  useEffect(() => {
    fetchDynamicContent();
  }, [currentLang]);

  const fetchDynamicContent = async () => {
    const { data } = await supabase
      .from('site_content')
      .select('content_key, content')
      .like('content_key', 'healing_%');
    
    if (data) {
      const contentMap: Record<string, string> = {};
      data.forEach(item => {
        contentMap[item.content_key] = item.content;
      });
      setDynamicContent(contentMap);
    }
  };

  const fetchAudioTracks = async () => {
    const { data } = await supabase
      .from('healing_audio')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setAudioTracks(data);
  };

  const checkHealingAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('healing_purchases')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gte('expires_at', new Date().toISOString())
      .limit(1);

    setHasHealingAccess(data && data.length > 0);
  };

  const checkOwnedAudio = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('healing_audio_purchases')
      .select('audio_id')
      .eq('user_id', user.id);

    if (data) {
      setOwnedAudioIds(new Set(data.map(p => p.audio_id)));
    }
  };

  const openPaymentModal = (plan: HealingPlan) => {
    setSelectedPlan(plan);
    setPaymentModalOpen(true);
  };

  const handleStripePayment = async (planType: string) => {
    setIsProcessing(true);
    setPaymentModalOpen(false);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: 'Please sign in', variant: "destructive" });
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-healing-checkout', {
        body: { planType },
      });

      if (error) throw error;
      if (data?.url) window.open(data.url, '_blank');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast({ title: 'Error', description: message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCryptoPayment = async (plan: HealingPlan) => {
    setPaymentModalOpen(false);
    
    if (!isPhantomInstalled) {
      toast({
        title: "Phantom Not Installed",
        description: "Please install Phantom wallet to pay with crypto",
        variant: "destructive",
      });
      window.open('https://phantom.app/', '_blank');
      return;
    }

    if (!walletAddress) {
      try {
        await connectWallet();
      } catch {
        toast({
          title: "Connection Failed",
          description: "Please connect your Phantom wallet",
          variant: "destructive",
        });
        return;
      }
    }

    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Please sign in", variant: "destructive" });
        setIsProcessing(false);
        return;
      }

      const treasuryWallet = "BAfPGN6DUAKYVwmmGkhMQxJyDv2cHEHRnfcbzy1GNy5j";
      const solAmount = (plan.price * 0.005).toFixed(4);
      const solanaUrl = `https://phantom.app/ul/v1/browse/https://solscan.io/account/${treasuryWallet}`;
      
      toast({
        title: "Send SOL to Complete Purchase",
        description: `Please send ${solAmount} SOL to: ${treasuryWallet.slice(0, 8)}...${treasuryWallet.slice(-8)}. Contact support after sending to activate your healing access.`,
      });
      
      window.open(solanaUrl, '_blank');
      
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Payment failed';
      toast({ title: "Payment Failed", description: message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubscriptionStripe = async () => {
    setIsProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: 'Please sign in', variant: "destructive" });
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-healing-checkout', {
        body: { planType: 'subscription' },
      });

      if (error) throw error;
      if (data?.url) window.open(data.url, '_blank');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast({ title: 'Error', description: message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePurchaseAudio = async (audio: HealingAudio, method: 'shc' | 'stripe') => {
    setIsProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: 'Please sign in', variant: "destructive" });
        return;
      }

      const { data, error } = await supabase.functions.invoke('purchase-healing-audio', {
        body: { audioId: audio.id, paymentMethod: method },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      } else if (data?.success) {
        toast({ title: 'Purchase Complete!', description: `You now own ${audio.title}` });
        setOwnedAudioIds(prev => new Set([...prev, audio.id]));
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast({ title: 'Error', description: message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  // Opens the intention threshold before starting a healing audio
  const initiatePlay = (audio: HealingAudio) => {
    // Admins, healing plan subscribers, and audio purchasers have full access
    const canPlay = isAdmin || audio.is_free || ownedAudioIds.has(audio.id) || hasHealingAccess;
    const audioUrl = canPlay ? audio.audio_url : audio.preview_url;

    if (!audioUrl) {
      // No audio URL available - show helpful message
      if (canPlay && !audio.audio_url) {
        sonnerToast.error('Audio not yet uploaded', { description: 'This healing audio is coming soon.' });
      }
      return;
    }

    // If already playing this one, toggle via unified player
    if (currentAudio?.id === audio.id && currentAudio?.contentType === 'healing') {
      const audioItem: UniversalAudioItem = {
        id: audio.id,
        title: audio.title,
        artist: 'Sacred Soul',
        audio_url: audioUrl,
        cover_image_url: audio.cover_image_url,
        duration_seconds: audio.duration_seconds,
        shc_reward: audio.is_free ? 0 : audio.price_shc,
        contentType: 'healing',
        originalData: audio,
      };
      playUniversalAudio(audioItem);
      return;
    }
    
    // Store the pending audio and show threshold
    setPendingAudio(audio);
    setShowThreshold(true);
  };

  // Handles intention selection and starts playback
  const handleIntentionSelected = (intention: IntentionType) => {
    setCurrentIntention(intention);
    setShowThreshold(false);
    
    if (pendingAudio) {
      startPlayback(pendingAudio);
      setPendingAudio(null);
    }
  };

  // Skip threshold and start without intention
  const handleThresholdClose = () => {
    setShowThreshold(false);
    if (pendingAudio) {
      startPlayback(pendingAudio);
      setPendingAudio(null);
    }
  };

  // Actual audio playback logic - now uses unified player
  const startPlayback = (audio: HealingAudio) => {
    // Admins, healing plan subscribers, and audio purchasers have full access
    const canPlay = isAdmin || audio.is_free || ownedAudioIds.has(audio.id) || hasHealingAccess;
    const audioUrl = canPlay ? audio.audio_url : audio.preview_url;
    
    if (!audioUrl) return;
    
    const audioItem: UniversalAudioItem = {
      id: audio.id,
      title: audio.title,
      artist: 'Sacred Soul',
      audio_url: audioUrl,
      cover_image_url: audio.cover_image_url,
      duration_seconds: audio.duration_seconds,
      shc_reward: audio.is_free ? 0 : audio.price_shc,
      contentType: 'healing',
      originalData: audio,
    };
    
    playUniversalAudio(audioItem);
  };

  // Toggle play - uses unified player
  const togglePlay = (audio: HealingAudio) => {
    initiatePlay(audio); // playUniversalAudio handles toggle internally
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const freeAudios = audioTracks.filter(a => a.is_free);
  const paidAudios = audioTracks.filter(a => !a.is_free);

  return (
    <>
      {/* Intention Threshold Screen */}
      <IntentionThreshold
        isOpen={showThreshold}
        onSelectIntention={handleIntentionSelected}
        onClose={handleThresholdClose}
      />
      
      <div className="min-h-screen p-6 space-y-12">
      {/* Membership Banner */}
      <MeditationMembershipBanner />

      {/* Hero Section */}
      <Card className="bg-gradient-to-r from-primary/30 to-pink-500/30 border-none text-center overflow-hidden">
        <CardContent className="py-10 px-6">
          <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            {getContent('hero_title', t('soul.heroTitle'))}
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {getContent('hero_subtitle', t('soul.heroSubtitle'))}
          </p>
        </CardContent>
      </Card>

      {/* Healing Progress Card */}
      <HealingProgressCard variant="full" />

      {/* Main Content Sections */}
      <div className="space-y-8">
        <Card className="border-border">
          <CardContent className="pt-6">
            <h2 className="text-2xl font-bold text-foreground mb-3 flex items-center gap-2">
              <Heart className="w-6 h-6 text-primary" />
              {getContent('about_title', t('soul.moreAboutTitle'))}
            </h2>
            <p className="text-muted-foreground">{getContent('about_text', t('soul.moreAboutText'))}</p>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-3 gap-4">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="pt-6">
              <Star className="w-8 h-8 text-primary mb-3" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {getContent('health_title', t('soul.healthTitle'))}
              </h3>
              <p className="text-sm text-muted-foreground">{getContent('health_text', t('soul.healthText'))}</p>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="pt-6">
              <Heart className="w-8 h-8 text-primary mb-3" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {getContent('mental_title', t('soul.mentalTitle'))}
              </h3>
              <p className="text-sm text-muted-foreground">{getContent('mental_text', t('soul.mentalText'))}</p>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="pt-6">
              <Sparkles className="w-8 h-8 text-primary mb-3" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {getContent('spiritual_title', t('soul.spiritualTitle'))}
              </h3>
              <p className="text-sm text-muted-foreground">{getContent('spiritual_text', t('soul.spiritualText'))}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-center text-foreground">{t('soul.testimonialsTitle')}</h2>
        <div className="space-y-4">
          {testimonials.map((testimonial, i) => (
            <Card key={i} className="border-border">
              <CardContent className="pt-6 space-y-4">
                <h3 className="font-semibold text-foreground text-lg">{testimonial.name}</h3>
                {testimonial.text && <p className="text-muted-foreground italic">"{testimonial.text}"</p>}
                {testimonial.videos && (
                  <div className="grid md:grid-cols-3 gap-4">
                    {testimonial.videos.map((url, j) => (
                      <div key={j} className="aspect-video">
                        <iframe
                          className="w-full h-full rounded-lg"
                          src={url}
                          title={`Video testimonial ${j+1}`}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* FAQ Section - Collapsible */}
      <div className="space-y-4">
        <Button
          variant="outline"
          className="w-full flex items-center justify-between py-6"
          onClick={() => setFaqOpen(!faqOpen)}
        >
          <span className="text-lg font-semibold">{t('soul.faqTitle')}</span>
          {faqOpen ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </Button>
        
        {faqOpen && (
          <Accordion type="multiple" className="space-y-2">
            {(faqTranslations[currentLang as keyof typeof faqTranslations] || faqTranslations.en).map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border border-border rounded-lg px-4">
                <AccordionTrigger className="text-left text-foreground hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>

      {/* Purchase Section */}
      {!hasHealingAccess && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-2">{t('soul.purchaseTitle')}</h2>
            <p className="text-muted-foreground">{t('soul.purchaseSubtitle')}</p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4">
            {HEALING_PLANS.map((plan) => (
              <Button 
                key={plan.id}
                size="lg"
                className="bg-[#00F2FE] text-black font-extrabold hover:bg-[#00D4E0] shadow-[0_0_25px_rgba(0,242,254,0.5)] hover:shadow-[0_0_35px_rgba(0,242,254,0.6)] border-0"
                onClick={() => openPaymentModal(plan)}
                disabled={isProcessing}
              >
                {currentLang === 'en' && `${plan.days}-Day Soul - €${plan.price}`}
                {currentLang === 'sv' && `${plan.days}-Dagars Själ - €${plan.price}`}
                {currentLang === 'es' && `Alma de ${plan.days} Días - €${plan.price}`}
                {currentLang === 'no' && `${plan.days}-Dagers Sjel - €${plan.price}`}
              </Button>
            ))}
            <Button 
              size="lg"
              className="bg-[#00F2FE] text-black font-extrabold hover:bg-[#00D4E0] shadow-[0_0_25px_rgba(0,242,254,0.5)] hover:shadow-[0_0_35px_rgba(0,242,254,0.6)] border-0"
              onClick={handleSubscriptionStripe}
              disabled={isProcessing}
            >
              {t('soul.button3Month')}
            </Button>
          </div>
        </div>
      )}

      {/* Payment Method Modal */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Choose Payment Method</DialogTitle>
            <DialogDescription>
              {selectedPlan && `${selectedPlan.name} - €${selectedPlan.price}`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Button
              size="lg"
              className="w-full flex items-center justify-center gap-3 bg-[#00F2FE] text-black font-extrabold hover:bg-[#00D4E0] shadow-[0_0_25px_rgba(0,242,254,0.5)] border-0"
              onClick={() => selectedPlan && handleStripePayment(selectedPlan.id)}
              disabled={isProcessing}
            >
              <CreditCard className="w-5 h-5" />
              Pay with Card
            </Button>
            <Button
              size="lg"
              className="w-full flex items-center justify-center gap-3 bg-white/10 text-white border border-white/20 hover:bg-white/20"
              onClick={() => selectedPlan && handleCryptoPayment(selectedPlan)}
              disabled={isProcessing}
            >
              <Wallet className="w-5 h-5" />
              Pay with Crypto (SOL)
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Access Badge */}
      {hasHealingAccess && (
        <Card className="p-4 bg-green-500/10 border-green-500/30">
          <div className="flex items-center gap-2 text-green-500">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">{t('soul.activeAccess')}</span>
          </div>
        </Card>
      )}

      {/* Free Audio Section */}
      {freeAudios.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Music className="w-5 h-5 text-primary" />
            {t('soul.freeAudio')}
          </h2>
          
          <div className="grid gap-3">
            {freeAudios.map(audio => (
              <Card key={audio.id} className="p-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => togglePlay(audio)}
                    className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center hover:bg-primary/30 transition-colors"
                  >
                    {isHealingPlaying(audio.id) ? (
                      <Pause className="w-5 h-5 text-primary" />
                    ) : (
                      <Play className="w-5 h-5 text-primary ml-1" />
                    )}
                  </button>
                  
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">{audio.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{formatDuration(audio.duration_seconds)}</span>
                      <span className="text-green-500 font-medium">• {t('soul.free')}</span>
                    </div>
                  </div>
                  
                  <Button variant="ghost" size="icon">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Premium Audio Section */}
      {paidAudios.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {t('soul.premiumAudio')}
          </h2>
          
          <div className="grid gap-3">
            {paidAudios.map(audio => {
              const owned = isAdmin || ownedAudioIds.has(audio.id);
              const hasAccess = isAdmin || owned || hasHealingAccess;
              
              return (
                <Card key={audio.id} className="p-4">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => togglePlay(audio)}
                      className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center hover:bg-primary/30 transition-colors relative"
                    >
                      {!hasAccess && (
                        <Lock className="w-4 h-4 text-muted-foreground absolute -top-1 -right-1" />
                      )}
                      {isHealingPlaying(audio.id) ? (
                        <Pause className="w-5 h-5 text-primary" />
                      ) : (
                        <Play className="w-5 h-5 text-primary ml-1" />
                      )}
                    </button>
                    
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">{audio.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{formatDuration(audio.duration_seconds)}</span>
                        {hasAccess ? (
                          <span className="text-green-500 font-medium">• {t('soul.owned')}</span>
                        ) : (
                          <span className="text-primary font-medium">• ${audio.price_usd}</span>
                        )}
                      </div>
                    </div>
                    
                    {hasAccess ? (
                      <Button variant="ghost" size="icon">
                        <Download className="w-4 h-4" />
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button 
                          size="sm"
                          className="bg-[#00F2FE] text-black font-extrabold hover:bg-[#00D4E0] shadow-[0_0_20px_rgba(0,242,254,0.4)] border-0"
                          onClick={() => handlePurchaseAudio(audio, 'stripe')}
                          disabled={isProcessing}
                        >
                          ${audio.price_usd}
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Reviews Section */}
      <ReviewSection contentType="healing" contentId="general" />
    </div>
    </>
  );
};

export default Healing;
