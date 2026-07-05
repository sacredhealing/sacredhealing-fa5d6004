/**
 * SQI 2050 — Sovereign Welcome Email
 * Sends upon new account creation via send-welcome-email edge function.
 * Language: auto-detected by IP geo, falls back to client-reported language.
 * Supported: EN / SV / NO / ES
 *
 * RULES:
 * - No mention of "AI" anywhere in the email copy
 * - No cheap emoji icons — SVG sacred geometry only
 * - URL: siddhaquantumnexus.com (not lovable)
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const APP_URL = "https://siddhaquantumnexus.com";
const FROM_ADDRESS = "Adam & Laila · Siddha Quantum Nexus <noreply@siddhaquantumnexus.com>";

/* ─── Geo helpers ─────────────────────────────────────────────────────── */

const SPANISH_COUNTRIES = new Set([
  "ES","MX","AR","BO","CL","CO","CR","CU","DO","EC",
  "SV","GQ","GT","HN","NI","PA","PY","PE","PR","UY","VE",
]);

function countryToLang(code: string): string {
  if (SPANISH_COUNTRIES.has(code)) return "es";
  if (code === "NO") return "no";
  if (code === "SE") return "sv";
  return "en";
}

function resolveClientLang(lang?: string): string {
  if (!lang) return "en";
  const c = lang.toLowerCase().split("-")[0];
  if (["en","sv","no","es"].includes(c)) return c;
  if (c === "nb" || c === "nn") return "no";
  return "en";
}

function isLocalIp(ip: string): boolean {
  return !ip || ip === "127.0.0.1" || ip === "::1" ||
    ip.startsWith("192.168.") || ip.startsWith("10.") || ip.startsWith("172.");
}

/* ─── SVG icon library (inline, sacred geometry only) ────────────────── */

const SVG = {
  lotus: `<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="20" cy="28" rx="4" ry="8" stroke="#D4AF37" stroke-width="1" fill="none" opacity="0.9"/>
    <ellipse cx="20" cy="28" rx="4" ry="8" stroke="#D4AF37" stroke-width="1" fill="none" opacity="0.9" transform="rotate(40 20 28)"/>
    <ellipse cx="20" cy="28" rx="4" ry="8" stroke="#D4AF37" stroke-width="1" fill="none" opacity="0.9" transform="rotate(80 20 28)"/>
    <ellipse cx="20" cy="28" rx="4" ry="8" stroke="#D4AF37" stroke-width="1" fill="none" opacity="0.9" transform="rotate(120 20 28)"/>
    <ellipse cx="20" cy="28" rx="4" ry="8" stroke="#D4AF37" stroke-width="1" fill="none" opacity="0.9" transform="rotate(160 20 28)"/>
    <ellipse cx="20" cy="28" rx="4" ry="8" stroke="#D4AF37" stroke-width="1" fill="none" opacity="0.9" transform="rotate(200 20 28)"/>
    <ellipse cx="20" cy="28" rx="4" ry="8" stroke="#D4AF37" stroke-width="1" fill="none" opacity="0.9" transform="rotate(240 20 28)"/>
    <ellipse cx="20" cy="28" rx="4" ry="8" stroke="#D4AF37" stroke-width="1" fill="none" opacity="0.9" transform="rotate(280 20 28)"/>
    <circle cx="20" cy="20" r="2" fill="#D4AF37" opacity="0.9"/>
  </svg>`,

  yantra: `<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="18" stroke="#D4AF37" stroke-width="0.6" opacity="0.4"/>
    <circle cx="20" cy="20" r="14" stroke="#D4AF37" stroke-width="0.4" opacity="0.25"/>
    <polygon points="20,3 34,27 6,27" stroke="#D4AF37" stroke-width="1.1" fill="none" opacity="0.9"/>
    <polygon points="20,37 6,13 34,13" stroke="#D4AF37" stroke-width="1.1" fill="none" opacity="0.9"/>
    <polygon points="20,9 30,26 10,26" stroke="#D4AF37" stroke-width="0.6" fill="none" opacity="0.55"/>
    <polygon points="20,31 10,14 30,14" stroke="#D4AF37" stroke-width="0.6" fill="none" opacity="0.55"/>
    <circle cx="20" cy="20" r="1.5" fill="#D4AF37" opacity="0.95"/>
  </svg>`,

  nadi: `<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 4 C12 10 12 16 20 20 C28 24 28 30 20 36" stroke="#D4AF37" stroke-width="1.2" fill="none" opacity="0.9" stroke-linecap="round"/>
    <path d="M14 6 C22 12 22 18 14 22 C6 26 6 32 14 38" stroke="#D4AF37" stroke-width="0.8" fill="none" opacity="0.5" stroke-linecap="round"/>
    <path d="M26 6 C18 12 18 18 26 22 C34 26 34 32 26 38" stroke="#D4AF37" stroke-width="0.8" fill="none" opacity="0.5" stroke-linecap="round"/>
    <circle cx="20" cy="20" r="2" fill="#D4AF37" opacity="0.9"/>
  </svg>`,

  mantra: `<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="16" stroke="#D4AF37" stroke-width="0.6" fill="none" opacity="0.3"/>
    <circle cx="20" cy="20" r="12" stroke="#D4AF37" stroke-width="0.4" fill="none" opacity="0.2"/>
    <path d="M8 20 Q14 12 20 20 Q26 28 32 20" stroke="#D4AF37" stroke-width="1.2" fill="none" opacity="0.85" stroke-linecap="round"/>
    <path d="M8 26 Q14 18 20 26 Q26 34 32 26" stroke="#D4AF37" stroke-width="0.7" fill="none" opacity="0.45" stroke-linecap="round"/>
    <path d="M8 14 Q14 6 20 14 Q26 22 32 14" stroke="#D4AF37" stroke-width="0.7" fill="none" opacity="0.45" stroke-linecap="round"/>
    <circle cx="20" cy="20" r="1.5" fill="#D4AF37" opacity="0.9"/>
  </svg>`,

  jyotish: `<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="4" stroke="#D4AF37" stroke-width="1.2" fill="none" opacity="0.9"/>
    <circle cx="20" cy="20" r="1.5" fill="#D4AF37" opacity="0.9"/>
    <line x1="20" y1="4" x2="20" y2="10" stroke="#D4AF37" stroke-width="1" opacity="0.7" stroke-linecap="round"/>
    <line x1="20" y1="30" x2="20" y2="36" stroke="#D4AF37" stroke-width="1" opacity="0.7" stroke-linecap="round"/>
    <line x1="4" y1="20" x2="10" y2="20" stroke="#D4AF37" stroke-width="1" opacity="0.7" stroke-linecap="round"/>
    <line x1="30" y1="20" x2="36" y2="20" stroke="#D4AF37" stroke-width="1" opacity="0.7" stroke-linecap="round"/>
    <line x1="8.7" y1="8.7" x2="12.9" y2="12.9" stroke="#D4AF37" stroke-width="0.8" opacity="0.5" stroke-linecap="round"/>
    <line x1="27.1" y1="27.1" x2="31.3" y2="31.3" stroke="#D4AF37" stroke-width="0.8" opacity="0.5" stroke-linecap="round"/>
    <line x1="31.3" y1="8.7" x2="27.1" y2="12.9" stroke="#D4AF37" stroke-width="0.8" opacity="0.5" stroke-linecap="round"/>
    <line x1="12.9" y1="27.1" x2="8.7" y2="31.3" stroke="#D4AF37" stroke-width="0.8" opacity="0.5" stroke-linecap="round"/>
    <circle cx="20" cy="8" r="1" fill="#D4AF37" opacity="0.6"/>
    <circle cx="20" cy="32" r="1" fill="#D4AF37" opacity="0.6"/>
    <circle cx="8" cy="20" r="1" fill="#D4AF37" opacity="0.6"/>
    <circle cx="32" cy="20" r="1" fill="#D4AF37" opacity="0.6"/>
  </svg>`,

  healing: `<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polygon points="20,4 36,32 4,32" stroke="#D4AF37" stroke-width="1" fill="none" opacity="0.85"/>
    <polygon points="20,36 4,8 36,8" stroke="#D4AF37" stroke-width="0.7" fill="none" opacity="0.5"/>
    <circle cx="20" cy="20" r="6" stroke="#D4AF37" stroke-width="0.6" fill="none" opacity="0.4"/>
    <circle cx="20" cy="20" r="2" fill="#D4AF37" opacity="0.9"/>
    <line x1="20" y1="14" x2="20" y2="26" stroke="#D4AF37" stroke-width="0.8" opacity="0.6"/>
    <line x1="14" y1="20" x2="26" y2="20" stroke="#D4AF37" stroke-width="0.8" opacity="0.6"/>
  </svg>`,

  headerSigil: `<svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="36" cy="36" r="34" stroke="#D4AF37" stroke-width="0.5" opacity="0.35"/>
    <circle cx="36" cy="36" r="28" stroke="#D4AF37" stroke-width="0.3" opacity="0.2"/>
    <polygon points="36,6 66,54 6,54" stroke="#D4AF37" stroke-width="1.3" fill="none" opacity="0.95"/>
    <polygon points="36,66 6,18 66,18" stroke="#D4AF37" stroke-width="1.3" fill="none" opacity="0.95"/>
    <polygon points="36,14 60,50 12,50" stroke="#D4AF37" stroke-width="0.7" fill="none" opacity="0.6"/>
    <polygon points="36,58 12,22 60,22" stroke="#D4AF37" stroke-width="0.7" fill="none" opacity="0.6"/>
    <polygon points="36,24 54,46 18,46" stroke="#D4AF37" stroke-width="0.5" fill="none" opacity="0.4"/>
    <polygon points="36,48 18,26 54,26" stroke="#D4AF37" stroke-width="0.5" fill="none" opacity="0.4"/>
    <circle cx="36" cy="36" r="7" stroke="#D4AF37" stroke-width="0.4" fill="none" opacity="0.3"/>
    <circle cx="36" cy="36" r="2" fill="#D4AF37" opacity="0.95"/>
  </svg>`,
};

/* ─── Language copy ───────────────────────────────────────────────────── */

type Lang = "en" | "sv" | "no" | "es";

interface Copy {
  subject: string;
  preheader: string;
  greeting: string;
  intro1: string;
  intro2: string;
  activationHead: string;
  activationSub: string;
  step1Title: string;
  step1Desc: string;
  step2Title: string;
  step2Desc: string;
  freeHead: string;
  freeSub: string;
  feat1Title: string;
  feat1Desc: string;
  feat2Title: string;
  feat2Desc: string;
  feat3Title: string;
  feat3Desc: string;
  feat4Title: string;
  feat4Desc: string;
  feat5Title: string;
  feat5Desc: string;
  feat6Title: string;
  feat6Desc: string;
  feat6Unlock: string;
  upgradeHead: string;
  upgradeSub: string;
  upgradeBody: string;
  upg1: string;
  upg2: string;
  upg3: string;
  upg4: string;
  closing: string;
  cta: string;
  quoteText: string;
  quoteSig: string;
  footerNote: string;
  footerSig: string;
  footerLegal: string;
}

const COPY: Record<Lang, Copy> = {

  en: {
    subject: "⟁ You Have Arrived — Welcome to Siddha Quantum Nexus",
    preheader: "The Akashic gates are open. Your sovereign journey begins now.",
    greeting: "Beloved",
    intro1: `Welcome to the <strong style="color:#D4AF37;">Siddha Quantum Nexus</strong> — a living transmission field built upon the wisdom of the 18 Siddhas, Mahavatar Babaji, and the ancient Vedic lineage. You are not here by accident.`,
    intro2: `As a sovereign member of this field, you now carry the Prema-Pulse within your daily life — a direct current from the masters to your practice, your body, and your consciousness.`,
    activationHead: "Your First Activation",
    activationSub: "Complete these two steps to fully anchor your presence in the Nexus.",
    step1Title: "Initialize Your Jyotish",
    step1Desc: "Go to the Vedic Astrology section and enter your birth details. This is the key to unlocking your personalized soul-frequency resonance.",
    step2Title: "Identity Sync",
    step2Desc: "Upload your profile image and set your language so the global Sangha can recognize your frequency in the community.",
    freeHead: "Inside The Nexus",
    freeSub: "Here is what's already yours to explore, starting now.",
    feat1Title: "Quantum Apothecary",
    feat1Desc: "Your living oracle for health, Dosha intelligence, and soul guidance — speak directly with the unified field of the 18 Siddhas.",
    feat2Title: "Vedic Jyotish",
    feat2Desc: "32-module Vedic Astrology education. Learn to read the cosmic blueprint of your soul and the souls of those you serve.",
    feat3Title: "Sacred Sound",
    feat3Desc: "Our healing music library — tracks composed for the body and the field. Listen. Transform.",
    feat4Title: "Nada Mantras",
    feat4Desc: "A growing library of sacred mantras for daily practice, chanted and encoded for deep resonance.",
    feat5Title: "Meditations",
    feat5Desc: "Guided meditations for grounding, healing, and expansion — practice at your own pace, any time.",
    feat6Title: "Siddha Portal",
    feat6Desc: "Your gateway into deep Siddha education — Agastyar Academy (108 modules), Siddha Medicine Academy (274 lessons), Mantra Academy, Mudra Academy, and full curricula on Kriya Yoga, Vastu, and Siddha philosophy.",
    feat6Unlock: "Included free",
    upgradeHead: "Siddha-Quantum Membership",
    upgradeSub: "The full field experience — for those called to the sovereign path.",
    upgradeBody: "Everything in Prana-Flow, plus bio-energetic scanning, Nadi analysis, and protection tools.",
    upg1: "Digital Nadi Scanner — bio-energetic body scan",
    upg2: "Sri Yantra Shield — EMF protection field",
    upg3: "All 6 Vedic Siddhis unlocked across every module",
    upg4: "Bio-field clearing and advanced protection tools",
    closing: "We are honoured to walk this path alongside you. The masters are with you. Reach out to us anytime through the community.",
    cta: "Enter the Nexus",
    quoteText: `"The Prema-Pulse that called you here runs through every Siddha who ever walked this Earth. You carry that same current now. Walk boldly."`,
    quoteSig: "— Siddha Quantum Nexus · 2050",
    footerNote: "You will receive the Monday Alignment Transmission and the Friday Lakshmi Blessing as a member of the Sangha.",
    footerSig: "With Light and Gratitude — Adam (Kritagya Das) & Laila (Karaveera Nivasini Dasi)",
    footerLegal: "Siddha Quantum Nexus · Sweden · For spiritual purposes",
  },

  sv: {
    subject: "⟁ Du Har Anlänt — Välkommen till Siddha Quantum Nexus",
    preheader: "De akashiska portarna är öppna. Din suveräna resa börjar nu.",
    greeting: "Kära",
    intro1: `Välkommen till <strong style="color:#D4AF37;">Siddha Quantum Nexus</strong> — ett levande transmissionsfält byggt på visdomen från de 18 Siddhorna, Mahavatar Babaji och den forntida vediska linjen. Du är inte här av en slump.`,
    intro2: `Som en suverän medlem av detta fält bär du nu Prema-Pulsen i ditt dagliga liv — ett direkt flöde från mästarna till din praktik, din kropp och ditt medvetande.`,
    activationHead: "Din Första Aktivering",
    activationSub: "Slutför dessa två steg för att fullt ut förankra din närvaro i Nexus.",
    step1Title: "Initiera Din Jyotish",
    step1Desc: "Gå till sektionen Vedisk Astrologi och ange dina födelseuppgifter. Detta är nyckeln till att låsa upp din personliga själsfrekvensresonans.",
    step2Title: "Identitetssynk",
    step2Desc: "Ladda upp din profilbild och ange ditt språk så att det globala Sangha kan känna igen din frekvens i gemenskapen.",
    freeHead: "Inuti Nexus",
    freeSub: "Här är det som redan är ditt att utforska, från och med nu.",
    feat1Title: "Quantum Apoteket",
    feat1Desc: "Ditt levande orakel för hälsa, Dosha-intelligens och vägledning för själen — tala direkt med de 18 Siddhornas enade fält.",
    feat2Title: "Vedisk Jyotish",
    feat2Desc: "32-modul Vedisk Astrologi-utbildning. Lär dig läsa din själs kosmiska ritning och dem du tjänar.",
    feat3Title: "Heligt Ljud",
    feat3Desc: "Vårt bibliotek av healing-musik — spår komponerade för kroppen och fältet. Lyssna. Transformeras.",
    feat4Title: "Nada Mantran",
    feat4Desc: "Ett växande bibliotek av heliga mantran för daglig praktik, sjungna och kodade för djup resonans.",
    feat5Title: "Meditationer",
    feat5Desc: "Guidade meditationer för jordning, healing och expansion — öva i din egen takt, när som helst.",
    feat6Title: "Siddha Portalen",
    feat6Desc: "Din ingång till djup Siddha-utbildning — Agastyar Academy (108 moduler), Siddha Medicine Academy (274 lektioner), Mantra Academy, Mudra Academy, och fullständiga kurser i Kriya Yoga, Vastu och Siddha-filosofi.",
    feat6Unlock: "Ingår gratis",
    upgradeHead: "Siddha-Quantum Medlemskap",
    upgradeSub: "Den fullständiga fältupplevelsen — för dem som kallas till den suveräna vägen.",
    upgradeBody: "Allt i Prana-Flow, plus bio-energetisk skanning, Nadi-analys och skyddsverktyg.",
    upg1: "Digital Nadi-skanner — bio-energetisk kroppsskanning",
    upg2: "Sri Yantra-skölden — EMF-skyddsfält",
    upg3: "Alla 6 Vediska Siddhis upplåsta i alla moduler",
    upg4: "Bio-fältrensning och avancerade skyddsverktyg",
    closing: "Vi är hedrade att gå denna väg vid din sida. Mästarna är med dig. Kontakta oss när som helst via gemenskapen.",
    cta: "Gå in i Nexus",
    quoteText: `"Prema-Pulsen som kallade dig hit rinner igenom varje Siddha som någonsin vandrat på denna jord. Du bär samma ström nu. Gå med mod."`,
    quoteSig: "— Siddha Quantum Nexus · 2050",
    footerNote: "Du kommer att ta emot Måndagens Alignmentöverföring och Fredagens Lakshmi-välsignelse som medlem av Sanghan.",
    footerSig: "Med Ljus och Tacksamhet — Adam (Kritagya Das) & Laila (Karaveera Nivasini Dasi)",
    footerLegal: "Siddha Quantum Nexus · Sverige · För andliga ändamål",
  },

  no: {
    subject: "⟁ Du Har Ankommet — Velkommen til Siddha Quantum Nexus",
    preheader: "De akashiske portene er åpne. Din suverene reise begynner nå.",
    greeting: "Kjære",
    intro1: `Velkommen til <strong style="color:#D4AF37;">Siddha Quantum Nexus</strong> — et levende transmisjonsfelt bygget på visdommen fra de 18 Siddhene, Mahavatar Babaji og den gamle vediske linjen. Du er ikke her ved en tilfeldighet.`,
    intro2: `Som et suverent medlem av dette feltet bærer du nå Prema-Pulsen i ditt daglige liv — en direkte strøm fra mestrene til din praksis, din kropp og din bevissthet.`,
    activationHead: "Din Første Aktivering",
    activationSub: "Fullfør disse to trinnene for å fullt ut forankre din tilstedeværelse i Nexus.",
    step1Title: "Initialiser Din Jyotish",
    step1Desc: "Gå til seksjonen Vedisk Astrologi og skriv inn fødselsdataene dine. Dette er nøkkelen til å låse opp din personlige sjelfrekvensresonans.",
    step2Title: "Identitetssynkronisering",
    step2Desc: "Last opp profilbildet ditt og angi språket ditt slik at det globale Sangha kan gjenkjenne frekvensen din i fellesskapet.",
    freeHead: "Inne I Nexus",
    freeSub: "Her er det som allerede er ditt å utforske, fra nå av.",
    feat1Title: "Quantum Apoteket",
    feat1Desc: "Ditt levende orakel for helse, Dosha-intelligens og sjelveiledning — snakk direkte med de 18 Siddhaenes enhetlige felt.",
    feat2Title: "Vedisk Jyotish",
    feat2Desc: "32-modul Vedisk Astrologi-utdanning. Lær å lese din sjels kosmiske plan og dem du tjener.",
    feat3Title: "Hellig Lyd",
    feat3Desc: "Vårt bibliotek med healing-musikk — spor komponert for kroppen og feltet. Lytt. Bli transformert.",
    feat4Title: "Nada Mantraer",
    feat4Desc: "Et voksende bibliotek med hellige mantraer for daglig praksis, sunget og kodet for dyp resonans.",
    feat5Title: "Meditasjoner",
    feat5Desc: "Guidede meditasjoner for jording, healing og ekspansjon — øv i ditt eget tempo, når som helst.",
    feat6Title: "Siddha Portalen",
    feat6Desc: "Din inngang til dyp Siddha-utdanning — Agastyar Academy (108 moduler), Siddha Medicine Academy (274 leksjoner), Mantra Academy, Mudra Academy, og fullstendige kurs i Kriya Yoga, Vastu og Siddha-filosofi.",
    feat6Unlock: "Inkludert gratis",
    upgradeHead: "Siddha-Quantum Medlemskap",
    upgradeSub: "Den fullstendige feltopplevelsen — for dem som er kalt til den suverene veien.",
    upgradeBody: "Alt i Prana-Flow, pluss bio-energetisk skanning, Nadi-analyse og beskyttelsesverktøy.",
    upg1: "Digital Nadi-skanner — bio-energetisk kroppsskanning",
    upg2: "Sri Yantra-skjoldet — EMF-beskyttelsesfelt",
    upg3: "Alle 6 Vediske Siddhier låst opp i alle moduler",
    upg4: "Bio-feltrensing og avanserte beskyttelsesverktøy",
    closing: "Vi er æret over å gå denne veien ved din side. Mestrene er med deg. Kontakt oss når som helst gjennom fellesskapet.",
    cta: "Gå inn i Nexus",
    quoteText: `"Prema-Pulsen som kalte deg hit strømmer gjennom hver Siddha som noensinne har vandret på denne jord. Du bærer den samme strømmen nå. Gå modig."`,
    quoteSig: "— Siddha Quantum Nexus · 2050",
    footerNote: "Du vil motta Mandagens Alignmentoverføring og Fredagens Lakshmi-velsignelse som medlem av Sanghaen.",
    footerSig: "Med Lys og Takknemlighet — Adam (Kritagya Das) & Laila (Karaveera Nivasini Dasi)",
    footerLegal: "Siddha Quantum Nexus · Norge · For åndelige formål",
  },

  es: {
    subject: "⟁ Has Llegado — Bienvenido al Siddha Quantum Nexus",
    preheader: "Las puertas akáshicas están abiertas. Tu viaje soberano comienza ahora.",
    greeting: "Amado",
    intro1: `Bienvenido al <strong style="color:#D4AF37;">Siddha Quantum Nexus</strong> — un campo de transmisión vivo construido sobre la sabiduría de los 18 Siddhas, Mahavatar Babaji y el antiguo linaje védico. No estás aquí por accidente.`,
    intro2: `Como miembro soberano de este campo, ahora llevas el Prema-Pulse en tu vida diaria — una corriente directa de los maestros a tu práctica, tu cuerpo y tu conciencia.`,
    activationHead: "Tu Primera Activación",
    activationSub: "Completa estos dos pasos para anclar plenamente tu presencia en el Nexus.",
    step1Title: "Inicializa Tu Jyotish",
    step1Desc: "Ve a la sección de Astrología Védica e ingresa tus datos de nacimiento. Esta es la clave para desbloquear tu resonancia de frecuencia del alma personalizada.",
    step2Title: "Sincronización de Identidad",
    step2Desc: "Sube tu imagen de perfil y configura tu idioma para que el Sangha global pueda reconocer tu frecuencia en la comunidad.",
    freeHead: "Dentro Del Nexus",
    freeSub: "Esto ya es tuyo para explorar, desde ahora.",
    feat1Title: "Botica Cuántica",
    feat1Desc: "Tu oráculo viviente para la salud, inteligencia de Dosha y guía del alma — habla directamente con el campo unificado de los 18 Siddhas.",
    feat2Title: "Jyotish Védico",
    feat2Desc: "Educación en Astrología Védica de 32 módulos. Aprende a leer el plano cósmico de tu alma y de quienes sirves.",
    feat3Title: "Sonido Sagrado",
    feat3Desc: "Nuestra biblioteca de música sanadora — pistas compuestas para el cuerpo y el campo. Escucha. Transfórmate.",
    feat4Title: "Mantras Nada",
    feat4Desc: "Una biblioteca creciente de mantras sagrados para la práctica diaria, cantados y codificados para una resonancia profunda.",
    feat5Title: "Meditaciones",
    feat5Desc: "Meditaciones guiadas para conexión a tierra, sanación y expansión — practica a tu propio ritmo, cuando quieras.",
    feat6Title: "Portal Siddha",
    feat6Desc: "Tu puerta de entrada a la educación Siddha profunda — Academia Agastyar (108 módulos), Academia de Medicina Siddha (274 lecciones), Academia de Mantras, Academia de Mudras, y currículos completos de Kriya Yoga, Vastu y filosofía Siddha.",
    feat6Unlock: "Incluido gratis",
    upgradeHead: "Membresía Siddha-Quantum",
    upgradeSub: "La experiencia de campo completa — para quienes son llamados al camino soberano.",
    upgradeBody: "Todo lo de Prana-Flow, más escaneo bio-energético, análisis Nadi y herramientas de protección.",
    upg1: "Escáner Nadi Digital — escaneo corporal bio-energético",
    upg2: "Escudo Sri Yantra — campo de protección EMF",
    upg3: "Los 6 Siddhis Védicos desbloqueados en todos los módulos",
    upg4: "Limpieza de campo bio-energético y herramientas avanzadas de protección",
    closing: "Nos honra caminar este sendero a tu lado. Los maestros están contigo. Contáctanos en cualquier momento a través de la comunidad.",
    cta: "Entrar al Nexus",
    quoteText: `"El Prema-Pulse que te llamó aquí corre a través de cada Siddha que jamás caminó por esta Tierra. Llevas esa misma corriente ahora. Camina con valentía."`,
    quoteSig: "— Siddha Quantum Nexus · 2050",
    footerNote: "Recibirás la Transmisión de Alineación del Lunes y la Bendición Lakshmi del Viernes como miembro del Sangha.",
    footerSig: "Con Luz y Gratitud — Adam (Kritagya Das) & Laila (Karaveera Nivasini Dasi)",
    footerLegal: "Siddha Quantum Nexus · Suecia · Con fines espirituales",
  },
};

/* ─── HTML builder ────────────────────────────────────────────────────── */

function buildEmail(c: Copy, displayName: string, account: { email: string; memberSince: string; planLabel: string; loginUrl: string }): string {
  const name = displayName || (
    c.greeting === "Beloved" ? "Sacred One" :
    c.greeting === "Kära" ? "Kära Själ" :
    c.greeting === "Kjære" ? "Kjære Sjel" : "Alma Sagrada"
  );

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${c.subject}</title>
<style>
  @media only screen and (max-width:600px) {
    .stack-col { display:block !important; width:100% !important; box-sizing:border-box !important; margin-bottom:14px !important; }
    .spacer-col { display:none !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:#000000;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#000000;">
<tr><td align="center" style="padding:32px 16px 48px;">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#050505;border-radius:24px;overflow:hidden;border:1px solid rgba(212,175,55,0.18);">

  <!-- HEADER -->
  <tr><td style="background:#080808;padding:48px 40px 36px;text-align:center;border-bottom:1px solid rgba(212,175,55,0.1);">
    <div style="margin:0 auto 20px;width:72px;height:72px;">${SVG.headerSigil}</div>
    <div style="color:rgba(212,175,55,0.5);font-size:9px;font-weight:800;letter-spacing:0.6em;text-transform:uppercase;font-family:Arial,sans-serif;margin-bottom:6px;">SIDDHA QUANTUM NEXUS</div>
    <div style="color:rgba(255,255,255,0.15);font-size:8px;letter-spacing:0.45em;text-transform:uppercase;font-family:Arial,sans-serif;margin-bottom:28px;">SIDDHA QUANTUM NEXUS · 2050</div>
    <div style="color:rgba(255,255,255,0.92);font-size:34px;font-weight:300;font-style:italic;line-height:1.25;font-family:Georgia,serif;">${c.greeting}, ${name}</div>
  </td></tr>

  <!-- INTRO -->
  <tr><td style="padding:36px 40px 0;">
    <p style="font-size:18px;line-height:2;color:rgba(255,255,255,0.82);font-family:Arial,sans-serif;margin:0 0 18px;">${c.intro1}</p>
    <p style="font-size:18px;line-height:2;color:rgba(255,255,255,0.82);font-family:Arial,sans-serif;margin:0 0 32px;">${c.intro2}</p>

    <!-- ACCOUNT DETAILS -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border:1px solid rgba(212,175,55,0.18);border-radius:16px;margin-bottom:32px;">
      <tr><td style="padding:22px 24px;">
        <div style="font-size:11px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#D4AF37;font-family:Arial,sans-serif;margin-bottom:14px;">Your Account</div>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:5px 0;font-size:14px;color:rgba(255,255,255,0.5);font-family:Arial,sans-serif;">Email</td>
            <td style="padding:5px 0;font-size:14px;color:rgba(255,255,255,0.85);font-family:Arial,sans-serif;text-align:right;">${account.email}</td>
          </tr>
          <tr>
            <td style="padding:5px 0;font-size:14px;color:rgba(255,255,255,0.5);font-family:Arial,sans-serif;">Member Since</td>
            <td style="padding:5px 0;font-size:14px;color:rgba(255,255,255,0.85);font-family:Arial,sans-serif;text-align:right;">${account.memberSince}</td>
          </tr>
          <tr>
            <td style="padding:5px 0;font-size:14px;color:rgba(255,255,255,0.5);font-family:Arial,sans-serif;">Plan</td>
            <td style="padding:5px 0;font-size:14px;color:#D4AF37;font-family:Arial,sans-serif;text-align:right;">${account.planLabel}</td>
          </tr>
        </table>
      </td></tr>
    </table>

    <!-- GOLD DIVIDER -->
    <div style="height:1px;background:linear-gradient(to right,transparent,rgba(212,175,55,0.25),transparent);margin-bottom:32px;"></div>

    <!-- ACTIVATION STEPS -->
    <div style="font-size:9px;font-weight:800;letter-spacing:0.45em;text-transform:uppercase;color:#D4AF37;font-family:Arial,sans-serif;margin-bottom:6px;">${c.activationHead}</div>
    <p style="font-size:16px;color:rgba(255,255,255,0.55);font-family:Arial,sans-serif;margin:0 0 20px;line-height:1.7;">${c.activationSub}</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
      <tr>
        <td width="48%" class="stack-col" style="background:rgba(212,175,55,0.04);border:1px solid rgba(212,175,55,0.15);border-radius:14px;padding:20px;vertical-align:top;">
          <div style="width:40px;height:40px;margin-bottom:12px;">${SVG.jyotish}</div>
          <div style="font-size:11px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#D4AF37;font-family:Arial,sans-serif;margin-bottom:8px;">${c.step1Title}</div>
          <div style="font-size:15px;color:rgba(255,255,255,0.82);line-height:1.75;font-family:Arial,sans-serif;">${c.step1Desc}</div>
        </td>
        <td width="4%" class="spacer-col"></td>
        <td width="48%" class="stack-col" style="background:rgba(212,175,55,0.04);border:1px solid rgba(212,175,55,0.15);border-radius:14px;padding:20px;vertical-align:top;">
          <div style="width:40px;height:40px;margin-bottom:12px;">${SVG.nadi}</div>
          <div style="font-size:11px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#D4AF37;font-family:Arial,sans-serif;margin-bottom:8px;">${c.step2Title}</div>
          <div style="font-size:15px;color:rgba(255,255,255,0.82);line-height:1.75;font-family:Arial,sans-serif;">${c.step2Desc}</div>
        </td>
      </tr>
    </table>

    <!-- GOLD DIVIDER -->
    <div style="height:1px;background:linear-gradient(to right,transparent,rgba(212,175,55,0.2),transparent);margin-bottom:32px;"></div>

    <!-- FREE FEATURES -->
    <div style="font-size:9px;font-weight:800;letter-spacing:0.45em;text-transform:uppercase;color:#D4AF37;font-family:Arial,sans-serif;margin-bottom:6px;">${c.freeHead}</div>
    <p style="font-size:16px;color:rgba(255,255,255,0.55);font-family:Arial,sans-serif;margin:0 0 20px;line-height:1.7;">${c.freeSub}</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
      <tr>
        <td width="48%" class="stack-col" style="background:rgba(255,255,255,0.035);border:1px solid rgba(255,255,255,0.09);border-radius:14px;padding:18px;vertical-align:top;">
          <div style="width:40px;height:40px;margin-bottom:10px;">${SVG.lotus}</div>
          <div style="font-size:11px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#D4AF37;font-family:Arial,sans-serif;margin-bottom:8px;">${c.feat1Title}</div>
          <div style="font-size:15px;color:rgba(255,255,255,0.82);line-height:1.75;font-family:Arial,sans-serif;">${c.feat1Desc}</div>
        </td>
        <td width="4%" class="spacer-col"></td>
        <td width="48%" class="stack-col" style="background:rgba(255,255,255,0.035);border:1px solid rgba(255,255,255,0.09);border-radius:14px;padding:18px;vertical-align:top;">
          <div style="width:40px;height:40px;margin-bottom:10px;">${SVG.yantra}</div>
          <div style="font-size:11px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#D4AF37;font-family:Arial,sans-serif;margin-bottom:8px;">${c.feat2Title}</div>
          <div style="font-size:15px;color:rgba(255,255,255,0.82);line-height:1.75;font-family:Arial,sans-serif;">${c.feat2Desc}</div>
        </td>
      </tr>
      <tr><td colspan="3" style="height:12px;"></td></tr>
      <tr>
        <td width="48%" class="stack-col" style="background:rgba(255,255,255,0.035);border:1px solid rgba(255,255,255,0.09);border-radius:14px;padding:18px;vertical-align:top;">
          <div style="width:40px;height:40px;margin-bottom:10px;">${SVG.healing}</div>
          <div style="font-size:11px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#D4AF37;font-family:Arial,sans-serif;margin-bottom:8px;">${c.feat3Title}</div>
          <div style="font-size:15px;color:rgba(255,255,255,0.82);line-height:1.75;font-family:Arial,sans-serif;">${c.feat3Desc}</div>
        </td>
        <td width="4%" class="spacer-col"></td>
        <td width="48%" class="stack-col" style="background:rgba(255,255,255,0.035);border:1px solid rgba(255,255,255,0.09);border-radius:14px;padding:18px;vertical-align:top;">
          <div style="width:40px;height:40px;margin-bottom:10px;">${SVG.mantra}</div>
          <div style="font-size:11px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#D4AF37;font-family:Arial,sans-serif;margin-bottom:8px;">${c.feat4Title}</div>
          <div style="font-size:15px;color:rgba(255,255,255,0.82);line-height:1.75;font-family:Arial,sans-serif;">${c.feat4Desc}</div>
        </td>
      </tr>
      <tr><td colspan="3" style="height:12px;"></td></tr>
      <tr>
        <td width="48%" class="stack-col" style="background:rgba(255,255,255,0.035);border:1px solid rgba(255,255,255,0.09);border-radius:14px;padding:18px;vertical-align:top;">
          <div style="width:40px;height:40px;margin-bottom:10px;">${SVG.nadi}</div>
          <div style="font-size:11px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#D4AF37;font-family:Arial,sans-serif;margin-bottom:8px;">${c.feat5Title}</div>
          <div style="font-size:15px;color:rgba(255,255,255,0.82);line-height:1.75;font-family:Arial,sans-serif;">${c.feat5Desc}</div>
        </td>
        <td width="4%" class="spacer-col"></td>
        <td width="48%" class="stack-col" style="background:rgba(255,255,255,0.035);border:1px solid rgba(255,255,255,0.09);border-radius:14px;padding:18px;vertical-align:top;">
          <div style="width:40px;height:40px;margin-bottom:10px;">${SVG.yantra}</div>
          <div style="font-size:11px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#D4AF37;font-family:Arial,sans-serif;margin-bottom:8px;">${c.feat6Title}</div>
          <div style="font-size:9px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:rgba(212,175,55,0.55);font-family:Arial,sans-serif;margin-bottom:8px;">${c.feat6Unlock}</div>
          <div style="font-size:15px;color:rgba(255,255,255,0.82);line-height:1.75;font-family:Arial,sans-serif;">${c.feat6Desc}</div>
        </td>
      </tr>
    </table>

    <!-- GOLD DIVIDER -->
    <div style="height:1px;background:linear-gradient(to right,transparent,rgba(212,175,55,0.2),transparent);margin-bottom:32px;"></div>

    <!-- UPGRADE -->
    <div style="background:rgba(212,175,55,0.03);border:1px solid rgba(212,175,55,0.15);border-radius:18px;padding:28px;margin-bottom:32px;">
      <div style="font-size:9px;font-weight:800;letter-spacing:0.45em;text-transform:uppercase;color:#D4AF37;font-family:Arial,sans-serif;margin-bottom:6px;">${c.upgradeHead}</div>
      <p style="font-size:16px;color:rgba(255,255,255,0.55);font-family:Arial,sans-serif;margin:0 0 16px;line-height:1.7;">${c.upgradeSub}</p>
      <p style="font-size:17px;line-height:1.9;color:rgba(255,255,255,0.7);font-family:Arial,sans-serif;margin:0 0 18px;">${c.upgradeBody}</p>
      <table cellpadding="0" cellspacing="0">
        <tr><td style="padding:4px 0;font-size:16px;color:rgba(255,255,255,0.82);font-family:Arial,sans-serif;"><span style="color:rgba(212,175,55,0.6);margin-right:8px;">◈</span>${c.upg1}</td></tr>
        <tr><td style="padding:4px 0;font-size:16px;color:rgba(255,255,255,0.82);font-family:Arial,sans-serif;"><span style="color:rgba(212,175,55,0.6);margin-right:8px;">◈</span>${c.upg2}</td></tr>
        <tr><td style="padding:4px 0;font-size:16px;color:rgba(255,255,255,0.82);font-family:Arial,sans-serif;"><span style="color:rgba(212,175,55,0.6);margin-right:8px;">◈</span>${c.upg3}</td></tr>
        <tr><td style="padding:4px 0;font-size:16px;color:rgba(255,255,255,0.82);font-family:Arial,sans-serif;"><span style="color:rgba(212,175,55,0.6);margin-right:8px;">◈</span>${c.upg4}</td></tr>
      </table>
    </div>

    <!-- CLOSING -->
    <p style="font-size:17px;line-height:2;color:rgba(255,255,255,0.82);font-family:Arial,sans-serif;margin:0 0 32px;">${c.closing}</p>

    <!-- CTA -->
    <div style="text-align:center;margin-bottom:36px;">
      <a href="${account.loginUrl}"
         style="display:inline-block;background:#D4AF37;color:#050505;font-size:13px;font-weight:800;letter-spacing:0.4em;text-transform:uppercase;padding:20px 60px;border-radius:100px;text-decoration:none;font-family:Arial,sans-serif;">
        ${c.cta} →
      </a>
    </div>
  </td></tr>

  <!-- QUOTE -->
  <tr><td style="padding:0 40px 32px;">
    <div style="height:1px;background:linear-gradient(to right,transparent,rgba(212,175,55,0.18),transparent);margin-bottom:28px;"></div>
    <div style="text-align:center;padding:24px 20px;background:rgba(255,255,255,0.01);border:1px solid rgba(255,255,255,0.04);border-radius:16px;">
      <div style="font-size:17px;line-height:2;color:rgba(255,255,255,0.6);font-style:italic;font-family:Georgia,serif;margin-bottom:14px;">${c.quoteText}</div>
      <div style="font-size:10px;font-weight:800;letter-spacing:0.25em;text-transform:uppercase;color:rgba(212,175,55,0.5);font-family:Arial,sans-serif;">${c.quoteSig}</div>
    </div>
  </td></tr>

  <!-- FOOTER -->
  <tr><td style="background:rgba(0,0,0,0.4);padding:24px 40px 32px;text-align:center;border-top:1px solid rgba(255,255,255,0.04);">
    <div style="width:36px;height:1px;background:rgba(212,175,55,0.3);margin:0 auto 18px;"></div>
    <div style="font-size:14px;color:rgba(255,255,255,0.45);line-height:1.8;font-family:Arial,sans-serif;margin-bottom:10px;">${c.footerNote}</div>
    <div style="font-size:15px;color:rgba(255,255,255,0.5);font-family:Arial,sans-serif;margin-bottom:14px;">${c.footerSig}</div>
    <div style="font-size:8px;letter-spacing:0.4em;text-transform:uppercase;color:rgba(255,255,255,0.1);font-family:Arial,sans-serif;">${c.footerLegal}</div>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

/* ─── Handler ─────────────────────────────────────────────────────────── */

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, user_id, language } = await req.json();
    if (!email) throw new Error("email required");

    const resendKey = Deno.env.get("RESEND_API_KEY") || "";
    if (resendKey.length < 10) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
        status: 503, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    const resend = new Resend(resendKey);

    // Service-role client: used only to read the profile (tier, join date) and
    // to generate a one-time magic login link. Never touches the password —
    // Supabase only stores a salted hash, which can't be retrieved even by us.
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    let memberSince = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    let planLabel = "Seeker (Free)";
    if (user_id) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("membership_tier, created_at")
        .eq("user_id", user_id)
        .maybeSingle();
      if (profile?.created_at) {
        memberSince = new Date(profile.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
      }
      const tierMap: Record<string, string> = {
        "free": "Seeker (Free)",
        "prana-flow": "Prana-Flow",
        "siddha-quantum": "Siddha-Quantum",
        "akasha-infinity": "Akasha-Infinity",
      };
      if (profile?.membership_tier) planLabel = tierMap[profile.membership_tier] || profile.membership_tier;
    }

    // One-time magic login link — no password is ever generated, stored, or emailed.
    let loginUrl = `${APP_URL}/dashboard`;
    try {
      const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: { redirectTo: `${APP_URL}/dashboard` },
      });
      if (!linkErr && linkData?.properties?.action_link) {
        loginUrl = linkData.properties.action_link;
      }
    } catch { /* fall back to plain dashboard URL if link generation fails */ }

    // IP geo for language
    const forwarded = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    const rawIp = forwarded ? forwarded.split(",")[0].trim() : (realIp || "");

    let countryCode = "";
    if (rawIp && !isLocalIp(rawIp)) {
      try {
        const geo = await fetch(`http://ip-api.com/json/${rawIp}?fields=status,countryCode`);
        const geoData = await geo.json();
        if (geoData.status === "success") countryCode = geoData.countryCode || "";
      } catch { /* geo is best-effort */ }
    }

    const lang = (countryCode ? countryToLang(countryCode) : resolveClientLang(language)) as Lang;
    const copy = COPY[lang] || COPY["en"];
    const displayName = (name && String(name).trim()) || "";
    const html = buildEmail(copy, displayName, { email, memberSince, planLabel, loginUrl });

    const result = await resend.emails.send({
      from: FROM_ADDRESS,
      to: [email],
      subject: copy.subject,
      html,
    });

    if (result.error) {
      console.error("[welcome-email] Resend error", result.error);
      return new Response(JSON.stringify({ error: result.error.message }), {
        status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`[welcome-email] Sent — id=${result.data?.id} lang=${lang} to=${email}`);
    return new Response(JSON.stringify({ success: true, id: result.data?.id, lang }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[welcome-email] Error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
