import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Play, Pause, Lock, Download, Heart, Clock, Music, CheckCircle, Star, CreditCard, Wallet } from 'lucide-react';
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
  { id: '7_day', name: '7-Day Healing', price: 97, days: 7 },
  { id: '14_day', name: '14-Day Healing', price: 147, days: 14 },
  { id: '30_day', name: '30-Day Healing', price: 197, days: 30 },
];

const translations = {
  en: {
    heroTitle: "30 Days of Sacred Healing",
    heroSubtitle: "Experience energetic, emotional, mental, and spiritual transformation with Adam & Laila's Sacred Healing Vibration.",
    moreAboutHealingTitle: "More About the Healing",
    moreAboutHealingText: "The 30 Days of Healing is designed to support your overall well-being and enhance multiple aspects of your life. Through this regular healing practice, we help you replenish your energy and vitality using divine energies of love, light, peace, and chi. This process may help promote balance, calm, and clarity, supporting body, mind, and spirit.",
    healthTitle: "Health & Vitality",
    healthText: "Supports energetic balance, vitality, organ and immune system function, circulation, digestive and reproductive health, stress relief, and overall wellness.",
    mentalTitle: "Mental & Emotional Balance",
    mentalText: "Helps reduce stress, anxiety, and negative thought patterns while promoting emotional stability, self-love, and positive mindset.",
    spiritualTitle: "Spiritual Transformation",
    spiritualText: "Supports awakening your spiritual potential, deeper meditation, higher vibration, wisdom, and connection with inner divinity.",
    testimonialsTitle: "Testimonials",
    faqTitle: "Frequently Asked Questions",
    purchaseTitle: "Join the Healing",
    purchaseSubtitle: "Select the package that fits your needs:",
    button7Day: "7-Day Healing - €97",
    button14Day: "14-Day Healing - €147",
    button30Day: "30-Day Healing - €197",
    button3Month: "Subscribe 3 Months - €147/mo",
    activeAccess: "You have active healing access!",
    freeAudio: "Free Healing Audio",
    premiumAudio: "Premium Healing Audio",
    free: "FREE",
    owned: "OWNED"
  },
  sv: {
    heroTitle: "30 Dagar av Helig Healing",
    heroSubtitle: "Upplev energisk, emotionell, mental och andlig transformation med Adam & Lailas Sacred Healing Vibration.",
    moreAboutHealingTitle: "Mer om Healing",
    moreAboutHealingText: "De 30 dagarna av Healing är utformade för att stödja ditt välbefinnande och förbättra flera aspekter av ditt liv. Genom denna regelbundna healing hjälper vi dig att fylla på energi och vitalitet med gudomlig energi av kärlek, ljus, fred och chi. Denna process kan främja balans, lugn och klarhet, stödja kropp, sinne och själ.",
    healthTitle: "Hälsa & Vitalitet",
    healthText: "Stöder energibalans, vitalitet, organ- och immunsystemfunktion, cirkulation, matsmältnings- och reproduktiv hälsa, stresslindring och allmänt välbefinnande.",
    mentalTitle: "Mental & Emotionell Balans",
    mentalText: "Hjälper till att minska stress, ångest och negativa tankemönster samtidigt som det främjar emotionell stabilitet, självkärlek och positivt tänkande.",
    spiritualTitle: "Andlig Transformation",
    spiritualText: "Stöder uppvaknande av din andliga potential, djupare meditation, högre vibration, visdom och kontakt med din inre gudomlighet.",
    testimonialsTitle: "Testimonials",
    faqTitle: "Vanliga Frågor",
    purchaseTitle: "Bli Medlem i Healing",
    purchaseSubtitle: "Välj paketet som passar dig:",
    button7Day: "7-Dagars Healing - €97",
    button14Day: "14-Dagars Healing - €147",
    button30Day: "30-Dagars Healing - €197",
    button3Month: "Prenumerera 3 Månader - €147/månad",
    activeAccess: "Du har aktiv healing-åtkomst!",
    freeAudio: "Gratis Healing Audio",
    premiumAudio: "Premium Healing Audio",
    free: "GRATIS",
    owned: "ÄGER"
  },
  es: {
    heroTitle: "30 Días de Sanación Sagrada",
    heroSubtitle: "Experimenta la transformación energética, emocional, mental y espiritual con la Vibración de Sanación Sagrada de Adam y Laila.",
    moreAboutHealingTitle: "Más Sobre la Sanación",
    moreAboutHealingText: "Los 30 Días de Sanación están diseñados para apoyar tu bienestar general y mejorar múltiples aspectos de tu vida. A través de esta práctica regular de sanación, ayudamos a reponer tu energía y vitalidad utilizando energías divinas de amor, luz, paz y chi. Este proceso puede promover equilibrio, calma y claridad, apoyando cuerpo, mente y espíritu.",
    healthTitle: "Salud & Vitalidad",
    healthText: "Apoya el equilibrio energético, vitalidad, función de órganos y sistema inmunológico, circulación, salud digestiva y reproductiva, alivio del estrés y bienestar general.",
    mentalTitle: "Equilibrio Mental & Emocional",
    mentalText: "Ayuda a reducir el estrés, la ansiedad y los patrones de pensamiento negativos mientras promueve estabilidad emocional, amor propio y una mentalidad positiva.",
    spiritualTitle: "Transformación Espiritual",
    spiritualText: "Apoya el despertar de tu potencial espiritual, meditación más profunda, vibración más alta, sabiduría y conexión con la divinidad interior.",
    testimonialsTitle: "Testimonios",
    faqTitle: "Preguntas Frecuentes",
    purchaseTitle: "Únete a la Sanación",
    purchaseSubtitle: "Selecciona el paquete que se adapta a tus necesidades:",
    button7Day: "Sanación de 7 Días - €97",
    button14Day: "Sanación de 14 Días - €147",
    button30Day: "Sanación de 30 Días - €197",
    button3Month: "Suscribirse 3 Meses - €147/mes",
    activeAccess: "¡Tienes acceso activo a sanación!",
    freeAudio: "Audio de Sanación Gratuito",
    premiumAudio: "Audio de Sanación Premium",
    free: "GRATIS",
    owned: "COMPRADO"
  },
  no: {
    heroTitle: "30 Dager med Hellig Healing",
    heroSubtitle: "Opplev energisk, emosjonell, mental og åndelig transformasjon med Adam & Lailas Sacred Healing Vibration.",
    moreAboutHealingTitle: "Mer om Healing",
    moreAboutHealingText: "De 30 dagene med Healing er designet for å støtte ditt generelle velvære og forbedre flere aspekter av livet ditt. Gjennom denne regelmessige healingpraksisen hjelper vi deg med å fylle på energi og vitalitet ved hjelp av guddommelige energier av kjærlighet, lys, fred og chi. Denne prosessen kan fremme balanse, ro og klarhet, og støtte kropp, sinn og sjel.",
    healthTitle: "Helse & Vitalitet",
    healthText: "Støtter energibalanse, vitalitet, organ- og immunsystemfunksjon, sirkulasjon, fordøyelses- og reproduktiv helse, stressavlastning og generell velvære.",
    mentalTitle: "Mental & Emosjonell Balanse",
    mentalText: "Hjelper med å redusere stress, angst og negative tankemønstre samtidig som det fremmer emosjonell stabilitet, egenkjærlighet og positiv tankegang.",
    spiritualTitle: "Åndelig Transformasjon",
    spiritualText: "Støtter oppvåkning av ditt åndelige potensial, dypere meditasjon, høyere vibrasjon, visdom og forbindelse med din indre guddommelighet.",
    testimonialsTitle: "Testimonials",
    faqTitle: "Ofte Stilte Spørsmål",
    purchaseTitle: "Bli Med på Healing",
    purchaseSubtitle: "Velg pakken som passer dine behov:",
    button7Day: "7-Dagers Healing - €97",
    button14Day: "14-Dagers Healing - €147",
    button30Day: "30-Dagers Healing - €197",
    button3Month: "Abonner 3 Måneder - €147/mnd",
    activeAccess: "Du har aktiv healing-tilgang!",
    freeAudio: "Gratis Healing Audio",
    premiumAudio: "Premium Healing Audio",
    free: "GRATIS",
    owned: "EIERD"
  }
};

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
    { question: "Does the healing cure physical symptoms or diseases?", answer: "Healing works on spiritual, mental, emotional, and physical levels. Spiritual and mental effects are noticed first, while emotional and physical improvements may take longer. Detox-like effects may occur. Not a substitute for medical care." },
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
    { question: "Botar healingen fysiska symptom eller sjukdomar?", answer: "Healing verkar på andliga, mentala, emotionella och fysiska nivåer. Andliga och mentala effekter märks först, medan emotionella och fysiska förbättringar kan ta längre tid. Detox-liknande effekter kan förekomma. Ersätter inte medicinsk vård." },
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
    { question: "¿La sanación cura síntomas físicos o enfermedades?", answer: "La sanación actúa en niveles espirituales, mentales, emocionales y físicos. Los efectos espirituales y mentales se notan primero, mientras que las mejoras emocionales y físicas pueden tardar más. Pueden ocurrir efectos similares a la desintoxicación. No sustituye la atención médica." },
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
    { question: "Kurerer healingen fysiske symptomer eller sykdommer?", answer: "Healing virker på åndelige, mentale, emosjonelle og fysiske nivåer. Åndelige og mentale effekter merkes først, mens emosjonelle og fysiske forbedringer kan ta lengre tid. Detox-lignende effekter kan forekomme. Erstatter ikke medisinsk behandling." },
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
  const { i18n } = useTranslation();
  const { toast } = useToast();
  const { balance } = useSHCBalance();
  const { walletAddress, isPhantomInstalled, connectWallet, isConnecting } = usePhantomWallet();
  
  const [audioTracks, setAudioTracks] = useState<HealingAudio[]>([]);
  const [ownedAudioIds, setOwnedAudioIds] = useState<Set<string>>(new Set());
  const [hasHealingAccess, setHasHealingAccess] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<HealingPlan | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [dynamicContent, setDynamicContent] = useState<Record<string, string>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Get current language translations
  const currentLang = i18n.language?.split('-')[0] || 'en';
  const t = translations[currentLang as keyof typeof translations] || translations.en;

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
        description: 'Welcome to your Sacred Healing Journey',
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

  const togglePlay = (audio: HealingAudio) => {
    const canPlay = audio.is_free || ownedAudioIds.has(audio.id);
    const audioUrl = canPlay ? audio.audio_url : audio.preview_url;

    if (!audioUrl) return;

    if (playingId === audio.id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(audioUrl);
      audioRef.current.play();
      audioRef.current.onended = () => setPlayingId(null);
      setPlayingId(audio.id);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const freeAudios = audioTracks.filter(a => a.is_free);
  const paidAudios = audioTracks.filter(a => !a.is_free);

  return (
    <div className="min-h-screen p-6 space-y-12">
      {/* Hero Section */}
      <Card className="bg-gradient-to-r from-primary/30 to-pink-500/30 border-none text-center overflow-hidden">
        <CardContent className="py-10 px-6">
          <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            {getContent('hero_title', t.heroTitle)}
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {getContent('hero_subtitle', t.heroSubtitle)}
          </p>
        </CardContent>
      </Card>

      {/* Main Content Sections */}
      <div className="space-y-8">
        <Card className="border-border">
          <CardContent className="pt-6">
            <h2 className="text-2xl font-bold text-foreground mb-3 flex items-center gap-2">
              <Heart className="w-6 h-6 text-primary" />
              {getContent('about_title', t.moreAboutHealingTitle)}
            </h2>
            <p className="text-muted-foreground">{getContent('about_text', t.moreAboutHealingText)}</p>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-3 gap-4">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="pt-6">
              <Star className="w-8 h-8 text-primary mb-3" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {getContent('health_title', t.healthTitle)}
              </h3>
              <p className="text-sm text-muted-foreground">{getContent('health_text', t.healthText)}</p>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="pt-6">
              <Heart className="w-8 h-8 text-primary mb-3" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {getContent('mental_title', t.mentalTitle)}
              </h3>
              <p className="text-sm text-muted-foreground">{getContent('mental_text', t.mentalText)}</p>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="pt-6">
              <Sparkles className="w-8 h-8 text-primary mb-3" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {getContent('spiritual_title', t.spiritualTitle)}
              </h3>
              <p className="text-sm text-muted-foreground">{getContent('spiritual_text', t.spiritualText)}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-center text-foreground">{t.testimonialsTitle}</h2>
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

      {/* FAQ Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-center text-foreground">{t.faqTitle}</h2>
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
      </div>

      {/* Purchase Section */}
      {!hasHealingAccess && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-2">{t.purchaseTitle}</h2>
            <p className="text-muted-foreground">{t.purchaseSubtitle}</p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4">
            {HEALING_PLANS.map((plan) => (
              <Button 
                key={plan.id}
                variant="gold" 
                size="lg"
                onClick={() => openPaymentModal(plan)}
                disabled={isProcessing}
              >
                {currentLang === 'en' && `${plan.name} - €${plan.price}`}
                {currentLang === 'sv' && `${plan.days}-Dagars Healing - €${plan.price}`}
                {currentLang === 'es' && `Sanación de ${plan.days} Días - €${plan.price}`}
                {currentLang === 'no' && `${plan.days}-Dagers Healing - €${plan.price}`}
              </Button>
            ))}
            <Button 
              variant="outline" 
              size="lg"
              onClick={handleSubscriptionStripe}
              disabled={isProcessing}
            >
              {t.button3Month}
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
              variant="gold"
              size="lg"
              className="w-full flex items-center justify-center gap-3"
              onClick={() => selectedPlan && handleStripePayment(selectedPlan.id)}
              disabled={isProcessing}
            >
              <CreditCard className="w-5 h-5" />
              Pay with Card
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full flex items-center justify-center gap-3 border-primary text-primary hover:bg-primary/10"
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
            <span className="font-medium">{t.activeAccess}</span>
          </div>
        </Card>
      )}

      {/* Free Audio Section */}
      {freeAudios.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Music className="w-5 h-5 text-primary" />
            {t.freeAudio}
          </h2>
          
          <div className="grid gap-3">
            {freeAudios.map(audio => (
              <Card key={audio.id} className="p-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => togglePlay(audio)}
                    className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center hover:bg-primary/30 transition-colors"
                  >
                    {playingId === audio.id ? (
                      <Pause className="w-5 h-5 text-primary" />
                    ) : (
                      <Play className="w-5 h-5 text-primary ml-1" />
                    )}
                  </button>
                  
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground"><TranslatedContent text={audio.title} /></h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{formatDuration(audio.duration_seconds)}</span>
                      <span className="text-green-500 font-medium">• {t.free}</span>
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
            {t.premiumAudio}
          </h2>
          
          <div className="grid gap-3">
            {paidAudios.map(audio => {
              const owned = ownedAudioIds.has(audio.id);
              
              return (
                <Card key={audio.id} className="p-4">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => togglePlay(audio)}
                      className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center hover:bg-primary/30 transition-colors relative"
                    >
                      {!owned && !hasHealingAccess && (
                        <Lock className="w-4 h-4 text-muted-foreground absolute -top-1 -right-1" />
                      )}
                      {playingId === audio.id ? (
                        <Pause className="w-5 h-5 text-primary" />
                      ) : (
                        <Play className="w-5 h-5 text-primary ml-1" />
                      )}
                    </button>
                    
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground"><TranslatedContent text={audio.title} /></h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{formatDuration(audio.duration_seconds)}</span>
                        {owned || hasHealingAccess ? (
                          <span className="text-green-500 font-medium">• {t.owned}</span>
                        ) : (
                          <span className="text-primary font-medium">• ${audio.price_usd}</span>
                        )}
                      </div>
                    </div>
                    
                    {owned || hasHealingAccess ? (
                      <Button variant="ghost" size="icon">
                        <Download className="w-4 h-4" />
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button 
                          variant="gold" 
                          size="sm"
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
  );
};

export default Healing;
