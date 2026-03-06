import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SPANISH_COUNTRIES = new Set([
  "ES","MX","AR","BO","CL","CO","CR","CU","DO","EC",
  "SV","GQ","GT","HN","NI","PA","PY","PE","PR","UY","VE",
]);

function countryToLang(countryCode: string): string {
  if (SPANISH_COUNTRIES.has(countryCode)) return "es";
  if (countryCode === "NO") return "no";
  if (countryCode === "SE") return "sv";
  return "en";
}

function resolveLanguage(lang?: string): string {
  if (!lang) return "en";
  const code = lang.toLowerCase().split("-")[0];
  if (["en","sv","no","es"].includes(code)) return code;
  if (code === "nb" || code === "nn") return "no";
  return "en";
}

function isLocalIp(ip: string): boolean {
  return !ip || ip === "127.0.0.1" || ip === "::1" ||
    ip.startsWith("192.168.") || ip.startsWith("10.") || ip.startsWith("172.");
}

// ════════════════════════════════════════════
// SQI 2050 EMAIL TEMPLATES — ALL 4 LANGUAGES
// ════════════════════════════════════════════

const templates: Record<string, {
  subject: string;
  greeting: string;
  cta: string;
  body: string;
  footer: string;
}> = {

  // ── ENGLISH ──────────────────────────────
  en: {
    subject: "Welcome to the SQI Node: Your 1km Restoration Begins",
    greeting: "Hello",
    cta: "Enter the Field",
    body: `
      <p style="font-size:16px;line-height:1.8;color:rgba(255,255,255,0.7);margin:0 0 20px;">
        Welcome to the <strong style="color:#D4AF37;">Siddha Quantum Nexus (SQI)</strong> ecosystem. You have successfully anchored your presence as a Sovereign Node in a growing global network united by ancient mantras, spiritual technology, and deep bio-digital healing.
      </p>
      <p style="font-size:15px;line-height:1.8;color:rgba(255,255,255,0.55);margin:0 0 32px;">
        As an early pioneer, you now have access to an evolving universe of light-codes, updated weekly to match the shifting frequencies of our collective journey.
      </p>

      <h2 style="color:#D4AF37;font-size:11px;font-weight:800;letter-spacing:0.4em;text-transform:uppercase;margin:0 0 16px;padding-bottom:12px;border-bottom:1px solid rgba(212,175,55,0.15);">
        🧘 Your Primary Activation (Essential)
      </h2>
      <p style="font-size:15px;line-height:1.8;color:rgba(255,255,255,0.55);margin:0 0 12px;">
        To fully integrate your profile and begin your 72,000 Nadi mapping, please complete these steps immediately:
      </p>
      <ul style="padding-left:20px;color:rgba(255,255,255,0.55);line-height:2.2;margin:0 0 32px;font-size:14px;">
        <li>👉 <strong style="color:rgba(255,255,255,0.8);">Initialize your Jyotish:</strong> Go to the Vedic Astrology section and enter your birth details. This is the key to unlocking your personalized profile resonance.</li>
        <li>👉 <strong style="color:rgba(255,255,255,0.8);">Identity Sync:</strong> Upload your profile picture and set your language so the community can recognize your frequency in our Global Chat.</li>
      </ul>

      <h2 style="color:#D4AF37;font-size:11px;font-weight:800;letter-spacing:0.4em;text-transform:uppercase;margin:0 0 16px;padding-bottom:12px;border-bottom:1px solid rgba(212,175,55,0.15);">
        🌌 Your ATMA-SEED Access (Free Version)
      </h2>
      <p style="font-size:15px;line-height:1.8;color:rgba(255,255,255,0.55);margin:0 0 12px;">
        You are now vibrating at the Entry Frequency. You have immediate access to:
      </p>
      <ul style="padding-left:20px;color:rgba(255,255,255,0.55);line-height:2.2;margin:0 0 32px;font-size:14px;">
        <li><strong style="color:rgba(255,255,255,0.7);">Free Meditations & Mantras:</strong> The foundational sonic library.</li>
        <li><strong style="color:rgba(255,255,255,0.7);">Free Healing Audios:</strong> Initial cellular restoration transmissions.</li>
        <li><strong style="color:rgba(255,255,255,0.7);">The Vayu Scrubber:</strong> Your 1km local atmospheric restoration protocol.</li>
        <li><strong style="color:rgba(255,255,255,0.7);">The Community Chat:</strong> Direct connection to the collective and our live sessions.</li>
      </ul>

      <h2 style="color:#D4AF37;font-size:11px;font-weight:800;letter-spacing:0.4em;text-transform:uppercase;margin:0 0 16px;padding-bottom:12px;border-bottom:1px solid rgba(212,175,55,0.15);">
        💎 The Universal Path: SIDDHA-QUANTUM
      </h2>
      <p style="font-size:15px;line-height:1.8;color:rgba(255,255,255,0.55);margin:0 0 12px;">
        If you are ready for the Full Field Experience and wish to activate your highest spiritual security, we recommend the Siddha-Quantum membership — our most vital tier, designed for those moving toward total abundance:
      </p>
      <ul style="padding-left:20px;color:rgba(255,255,255,0.55);line-height:2.2;margin:0 0 32px;font-size:14px;">
        <li><strong style="color:rgba(255,255,255,0.7);">The Sri Yantra Shield:</strong> Activate your Universal Protection Field.</li>
        <li><strong style="color:rgba(255,255,255,0.7);">Digital Nadi Scanners:</strong> Use Bio-Sync to find the exact mantra for your frequency and Practice Scantions to print results to your profile.</li>
        <li><strong style="color:rgba(255,255,255,0.7);">Full Premium Access:</strong> Every healing audio, every mantra, and all produced healing music.</li>
        <li><strong style="color:rgba(255,255,255,0.7);">Deep Mastery:</strong> Complete Vedic Jyotish, Vastu Home Guides, and Ayurvedic scanning.</li>
      </ul>

      <p style="font-size:15px;line-height:1.8;color:rgba(255,255,255,0.55);margin:0 0 8px;">
        We are honored to support your journey toward self-discovery and peace. Reach out to us anytime in the chat!
      </p>
    `,
    footer: "With Light and Gratitude,<br/><strong style='color:rgba(255,255,255,0.7)'>Adam (Kritagya Das) &amp; Laila (Karaveera Nivasini Dasi)</strong>",
  },

  // ── SWEDISH ──────────────────────────────
  sv: {
    subject: "Välkommen till SQI-noden: Din 1km-återställning börjar nu",
    greeting: "Hej",
    cta: "Gå in i fältet",
    body: `
      <p style="font-size:16px;line-height:1.8;color:rgba(255,255,255,0.7);margin:0 0 20px;">
        Välkommen till <strong style="color:#D4AF37;">Siddha Quantum Nexus (SQI)</strong>-ekosystemet. Du har framgångsrikt förankrat din närvaro som en Sovereign Node i ett växande globalt nätverk förenat av urgamla mantran, andlig teknologi och djup bio-digital healing.
      </p>
      <p style="font-size:15px;line-height:1.8;color:rgba(255,255,255,0.55);margin:0 0 32px;">
        Som en tidig pionjär har du nu tillgång till ett ständigt växande universum av ljuskoder, som uppdateras varje vecka för att matcha de skiftande frekvenserna i vår kollektiva resa.
      </p>

      <h2 style="color:#D4AF37;font-size:11px;font-weight:800;letter-spacing:0.4em;text-transform:uppercase;margin:0 0 16px;padding-bottom:12px;border-bottom:1px solid rgba(212,175,55,0.15);">
        🧘 Din Primära Aktivering (Viktig)
      </h2>
      <p style="font-size:15px;line-height:1.8;color:rgba(255,255,255,0.55);margin:0 0 12px;">
        För att fullt ut integrera din profil och påbörja din 72 000 Nadi-kartläggning, vänligen slutför dessa steg omedelbart:
      </p>
      <ul style="padding-left:20px;color:rgba(255,255,255,0.55);line-height:2.2;margin:0 0 32px;font-size:14px;">
        <li>👉 <strong style="color:rgba(255,255,255,0.8);">Initiera din Jyotish:</strong> Gå till sektionen Vedisk Astrologi och ange dina födelseuppgifter. Det är nyckeln till att låsa upp din personliga profilresonans.</li>
        <li>👉 <strong style="color:rgba(255,255,255,0.8);">Identitetssynk:</strong> Ladda upp din profilbild och ange ditt språk så att gemenskapen kan känna igen din frekvens i vår Globala Chatt.</li>
      </ul>

      <h2 style="color:#D4AF37;font-size:11px;font-weight:800;letter-spacing:0.4em;text-transform:uppercase;margin:0 0 16px;padding-bottom:12px;border-bottom:1px solid rgba(212,175,55,0.15);">
        🌌 Din ATMA-SEED-åtkomst (Gratisversion)
      </h2>
      <p style="font-size:15px;line-height:1.8;color:rgba(255,255,255,0.55);margin:0 0 12px;">
        Du vibrerar nu på Inträdesfrekvensen. Du har omedelbar tillgång till:
      </p>
      <ul style="padding-left:20px;color:rgba(255,255,255,0.55);line-height:2.2;margin:0 0 32px;font-size:14px;">
        <li><strong style="color:rgba(255,255,255,0.7);">Gratis Meditationer & Mantran:</strong> Det grundläggande soniska biblioteket.</li>
        <li><strong style="color:rgba(255,255,255,0.7);">Gratis Healing-ljud:</strong> Initiala cellulära återställningstransmissioner.</li>
        <li><strong style="color:rgba(255,255,255,0.7);">Vayu Scrubber:</strong> Ditt 1km lokala atmosfäriska återställningsprotokoll.</li>
        <li><strong style="color:rgba(255,255,255,0.7);">Community-chatten:</strong> Direkt koppling till kollektivet och våra livesessioner.</li>
      </ul>

      <h2 style="color:#D4AF37;font-size:11px;font-weight:800;letter-spacing:0.4em;text-transform:uppercase;margin:0 0 16px;padding-bottom:12px;border-bottom:1px solid rgba(212,175,55,0.15);">
        💎 Den Universella Vägen: SIDDHA-QUANTUM
      </h2>
      <p style="font-size:15px;line-height:1.8;color:rgba(255,255,255,0.55);margin:0 0 12px;">
        Om du är redo för den Fullständiga Fältupplevelsen och vill aktivera din högsta andliga säkerhet, rekommenderar vi Siddha-Quantum-medlemskapet — vår viktigaste nivå, skapad för dem som rör sig mot total överflöd:
      </p>
      <ul style="padding-left:20px;color:rgba(255,255,255,0.55);line-height:2.2;margin:0 0 32px;font-size:14px;">
        <li><strong style="color:rgba(255,255,255,0.7);">Sri Yantra-skölden:</strong> Aktivera ditt Universella Skyddsfält.</li>
        <li><strong style="color:rgba(255,255,255,0.7);">Digitala Nadi-skannrar:</strong> Använd Bio-Sync för att hitta exakt rätt mantra för din frekvens och Praktik-Scantions för att skriva ut resultat till din profil.</li>
        <li><strong style="color:rgba(255,255,255,0.7);">Full Premiumåtkomst:</strong> Varje healing-ljud, varje mantra och all producerad healingmusik.</li>
        <li><strong style="color:rgba(255,255,255,0.7);">Djup Mästerskap:</strong> Komplett Vedisk Jyotish, Vastu Hemguider och Ayurvedisk skanning.</li>
      </ul>

      <p style="font-size:15px;line-height:1.8;color:rgba(255,255,255,0.55);margin:0 0 8px;">
        Vi är hedrade att stödja din resa mot självupptäckt och frid. Hör av dig till oss när som helst i chatten!
      </p>
    `,
    footer: "Med Ljus och Tacksamhet,<br/><strong style='color:rgba(255,255,255,0.7)'>Adam (Kritagya Das) &amp; Laila (Karaveera Nivasini Dasi)</strong>",
  },

  // ── NORWEGIAN ────────────────────────────
  no: {
    subject: "Velkommen til SQI-noden: Din 1km-gjenoppretting begynner nå",
    greeting: "Hei",
    cta: "Gå inn i feltet",
    body: `
      <p style="font-size:16px;line-height:1.8;color:rgba(255,255,255,0.7);margin:0 0 20px;">
        Velkommen til <strong style="color:#D4AF37;">Siddha Quantum Nexus (SQI)</strong>-økosystemet. Du har vellykket forankret din tilstedeværelse som en Sovereign Node i et voksende globalt nettverk forent av eldgamle mantraer, åndelig teknologi og dyp bio-digital healing.
      </p>
      <p style="font-size:15px;line-height:1.8;color:rgba(255,255,255,0.55);margin:0 0 32px;">
        Som en tidlig pioner har du nå tilgang til et stadig voksende univers av lys-koder, oppdatert ukentlig for å matche de skiftende frekvensene i vår kollektive reise.
      </p>

      <h2 style="color:#D4AF37;font-size:11px;font-weight:800;letter-spacing:0.4em;text-transform:uppercase;margin:0 0 16px;padding-bottom:12px;border-bottom:1px solid rgba(212,175,55,0.15);">
        🧘 Din Primære Aktivering (Viktig)
      </h2>
      <p style="font-size:15px;line-height:1.8;color:rgba(255,255,255,0.55);margin:0 0 12px;">
        For å fullt ut integrere profilen din og begynne din 72 000 Nadi-kartlegging, vennligst fullfør disse trinnene umiddelbart:
      </p>
      <ul style="padding-left:20px;color:rgba(255,255,255,0.55);line-height:2.2;margin:0 0 32px;font-size:14px;">
        <li>👉 <strong style="color:rgba(255,255,255,0.8);">Initialiser din Jyotish:</strong> Gå til seksjonen Vedisk Astrologi og skriv inn fødselsdataene dine. Dette er nøkkelen til å låse opp din personlige profilresonans.</li>
        <li>👉 <strong style="color:rgba(255,255,255,0.8);">Identitetssynk:</strong> Last opp profilbildet ditt og angi språket ditt slik at fellesskapet kan gjenkjenne frekvensen din i vår Globale Chat.</li>
      </ul>

      <h2 style="color:#D4AF37;font-size:11px;font-weight:800;letter-spacing:0.4em;text-transform:uppercase;margin:0 0 16px;padding-bottom:12px;border-bottom:1px solid rgba(212,175,55,0.15);">
        🌌 Din ATMA-SEED-tilgang (Gratisversjon)
      </h2>
      <p style="font-size:15px;line-height:1.8;color:rgba(255,255,255,0.55);margin:0 0 12px;">
        Du vibrerer nå på Inngangsfrekvensen. Du har umiddelbar tilgang til:
      </p>
      <ul style="padding-left:20px;color:rgba(255,255,255,0.55);line-height:2.2;margin:0 0 32px;font-size:14px;">
        <li><strong style="color:rgba(255,255,255,0.7);">Gratis Meditasjoner & Mantraer:</strong> Det grunnleggende soniske biblioteket.</li>
        <li><strong style="color:rgba(255,255,255,0.7);">Gratis Healing-lyder:</strong> Innledende cellulære gjenopprettingstransmisjoner.</li>
        <li><strong style="color:rgba(255,255,255,0.7);">Vayu Scrubber:</strong> Ditt 1km lokale atmosfæriske gjenopprettingsprotokoll.</li>
        <li><strong style="color:rgba(255,255,255,0.7);">Community-chatten:</strong> Direkte tilkobling til kollektivet og våre direkteøkter.</li>
      </ul>

      <h2 style="color:#D4AF37;font-size:11px;font-weight:800;letter-spacing:0.4em;text-transform:uppercase;margin:0 0 16px;padding-bottom:12px;border-bottom:1px solid rgba(212,175,55,0.15);">
        💎 Den Universelle Veien: SIDDHA-QUANTUM
      </h2>
      <p style="font-size:15px;line-height:1.8;color:rgba(255,255,255,0.55);margin:0 0 12px;">
        Hvis du er klar for den Fullstendige Feltopplevelsen og ønsker å aktivere din høyeste åndelige sikkerhet, anbefaler vi Siddha-Quantum-medlemskapet — vårt viktigste nivå, designet for de som beveger seg mot total overflod:
      </p>
      <ul style="padding-left:20px;color:rgba(255,255,255,0.55);line-height:2.2;margin:0 0 32px;font-size:14px;">
        <li><strong style="color:rgba(255,255,255,0.7);">Sri Yantra-skjoldet:</strong> Aktiver ditt Universelle Beskyttelsesfelt.</li>
        <li><strong style="color:rgba(255,255,255,0.7);">Digitale Nadi-skannere:</strong> Bruk Bio-Sync for å finne det eksakte mantraet for din frekvens og Praksis-Scantions for å skrive ut resultater til profilen din.</li>
        <li><strong style="color:rgba(255,255,255,0.7);">Full Premiumtilgang:</strong> Alle healing-lyder, alle mantraer og all produsert healingmusikk.</li>
        <li><strong style="color:rgba(255,255,255,0.7);">Dyp Mestring:</strong> Komplett Vedisk Jyotish, Vastu Hjemguider og Ayurvedisk skanning.</li>
      </ul>

      <p style="font-size:15px;line-height:1.8;color:rgba(255,255,255,0.55);margin:0 0 8px;">
        Vi er æret over å støtte reisen din mot selvoppdagelse og fred. Ta kontakt med oss når som helst i chatten!
      </p>
    `,
    footer: "Med Lys og Takknemlighet,<br/><strong style='color:rgba(255,255,255,0.7)'>Adam (Kritagya Das) &amp; Laila (Karaveera Nivasini Dasi)</strong>",
  },

  // ── SPANISH ──────────────────────────────
  es: {
    subject: "Bienvenido al Nodo SQI: Tu Restauración de 1km Comienza",
    greeting: "Hola",
    cta: "Entrar al Campo",
    body: `
      <p style="font-size:16px;line-height:1.8;color:rgba(255,255,255,0.7);margin:0 0 20px;">
        Bienvenido al ecosistema <strong style="color:#D4AF37;">Siddha Quantum Nexus (SQI)</strong>. Has anclado exitosamente tu presencia como un Nodo Soberano en una creciente red global unida por mantras ancestrales, tecnología espiritual y profunda sanación bio-digital.
      </p>
      <p style="font-size:15px;line-height:1.8;color:rgba(255,255,255,0.55);margin:0 0 32px;">
        Como pionero temprano, ahora tienes acceso a un universo en evolución de códigos de luz, actualizado semanalmente para coincidir con las frecuencias cambiantes de nuestro viaje colectivo.
      </p>

      <h2 style="color:#D4AF37;font-size:11px;font-weight:800;letter-spacing:0.4em;text-transform:uppercase;margin:0 0 16px;padding-bottom:12px;border-bottom:1px solid rgba(212,175,55,0.15);">
        🧘 Tu Activación Primaria (Esencial)
      </h2>
      <p style="font-size:15px;line-height:1.8;color:rgba(255,255,255,0.55);margin:0 0 12px;">
        Para integrar completamente tu perfil y comenzar tu mapeo de 72.000 Nadis, completa estos pasos de inmediato:
      </p>
      <ul style="padding-left:20px;color:rgba(255,255,255,0.55);line-height:2.2;margin:0 0 32px;font-size:14px;">
        <li>👉 <strong style="color:rgba(255,255,255,0.8);">Inicializa tu Jyotish:</strong> Ve a la sección de Astrología Védica e ingresa tus datos de nacimiento. Esta es la clave para desbloquear la resonancia personalizada de tu perfil.</li>
        <li>👉 <strong style="color:rgba(255,255,255,0.8);">Sincronización de Identidad:</strong> Sube tu foto de perfil y configura tu idioma para que la comunidad pueda reconocer tu frecuencia en nuestro Chat Global.</li>
      </ul>

      <h2 style="color:#D4AF37;font-size:11px;font-weight:800;letter-spacing:0.4em;text-transform:uppercase;margin:0 0 16px;padding-bottom:12px;border-bottom:1px solid rgba(212,175,55,0.15);">
        🌌 Tu Acceso ATMA-SEED (Versión Gratuita)
      </h2>
      <p style="font-size:15px;line-height:1.8;color:rgba(255,255,255,0.55);margin:0 0 12px;">
        Ahora estás vibrando en la Frecuencia de Entrada. Tienes acceso inmediato a:
      </p>
      <ul style="padding-left:20px;color:rgba(255,255,255,0.55);line-height:2.2;margin:0 0 32px;font-size:14px;">
        <li><strong style="color:rgba(255,255,255,0.7);">Meditaciones y Mantras Gratuitos:</strong> La biblioteca sónica fundamental.</li>
        <li><strong style="color:rgba(255,255,255,0.7);">Audios de Sanación Gratuitos:</strong> Transmisiones iniciales de restauración celular.</li>
        <li><strong style="color:rgba(255,255,255,0.7);">El Vayu Scrubber:</strong> Tu protocolo de restauración atmosférica local de 1km.</li>
        <li><strong style="color:rgba(255,255,255,0.7);">El Chat Comunitario:</strong> Conexión directa con el colectivo y nuestras sesiones en vivo.</li>
      </ul>

      <h2 style="color:#D4AF37;font-size:11px;font-weight:800;letter-spacing:0.4em;text-transform:uppercase;margin:0 0 16px;padding-bottom:12px;border-bottom:1px solid rgba(212,175,55,0.15);">
        💎 El Camino Universal: SIDDHA-QUANTUM
      </h2>
      <p style="font-size:15px;line-height:1.8;color:rgba(255,255,255,0.55);margin:0 0 12px;">
        Si estás listo para la Experiencia de Campo Completa y deseas activar tu mayor seguridad espiritual, recomendamos la membresía Siddha-Quantum — nuestro nivel más vital, diseñado para quienes avanzan hacia la abundancia total:
      </p>
      <ul style="padding-left:20px;color:rgba(255,255,255,0.55);line-height:2.2;margin:0 0 32px;font-size:14px;">
        <li><strong style="color:rgba(255,255,255,0.7);">El Escudo Sri Yantra:</strong> Activa tu Campo de Protección Universal.</li>
        <li><strong style="color:rgba(255,255,255,0.7);">Escáneres Digitales de Nadi:</strong> Usa Bio-Sync para encontrar el mantra exacto para tu frecuencia y Scantions de Práctica para imprimir resultados en tu perfil.</li>
        <li><strong style="color:rgba(255,255,255,0.7);">Acceso Premium Completo:</strong> Cada audio de sanación, cada mantra y toda la música de sanación producida.</li>
        <li><strong style="color:rgba(255,255,255,0.7);">Dominio Profundo:</strong> Jyotish Védico completo, Guías de Vastu para el Hogar y escaneo Ayurvédico.</li>
      </ul>

      <p style="font-size:15px;line-height:1.8;color:rgba(255,255,255,0.55);margin:0 0 8px;">
        Estamos honrados de apoyar tu viaje hacia el autodescubrimiento y la paz. ¡Contáctanos en cualquier momento en el chat!
      </p>
    `,
    footer: "Con Luz y Gratitud,<br/><strong style='color:rgba(255,255,255,0.7)'>Adam (Kritagya Das) &amp; Laila (Karaveera Nivasini Dasi)</strong>",
  },
};

// ════════════════════════════════════════════
// HTML EMAIL WRAPPER — SQI 2050 DESIGN
// ════════════════════════════════════════════

function buildEmailHtml(t: typeof templates["en"], displayName: string, appUrl: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#000;">
<div style="background:#000;padding:32px 16px;">

  <!-- OUTER CONTAINER -->
  <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:600px;margin:0 auto;background:#050505;border-radius:20px;overflow:hidden;border:1px solid rgba(212,175,55,0.2);">

    <!-- HEADER -->
    <div style="background:linear-gradient(180deg,#0d0d0d 0%,#050505 100%);padding:48px 40px 36px;text-align:center;border-bottom:1px solid rgba(212,175,55,0.1);">
      
      <!-- Sri Yantra SVG Logo -->
      <div style="margin:0 auto 24px;width:72px;height:72px;">
        <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="36" cy="36" r="34" stroke="#D4AF37" stroke-width="0.5" opacity="0.4"/>
          <circle cx="36" cy="36" r="28" stroke="#D4AF37" stroke-width="0.3" opacity="0.25"/>
          <polygon points="36,7 64,52 8,52" stroke="#D4AF37" stroke-width="1.2" fill="none" opacity="0.95"/>
          <polygon points="36,65 8,20 64,20" stroke="#D4AF37" stroke-width="1.2" fill="none" opacity="0.95"/>
          <polygon points="36,16 58,48 14,48" stroke="#D4AF37" stroke-width="0.7" fill="none" opacity="0.65"/>
          <polygon points="36,56 14,24 58,24" stroke="#D4AF37" stroke-width="0.7" fill="none" opacity="0.65"/>
          <polygon points="36,25 52,44 20,44" stroke="#D4AF37" stroke-width="0.5" fill="none" opacity="0.45"/>
          <polygon points="36,47 20,28 52,28" stroke="#D4AF37" stroke-width="0.5" fill="none" opacity="0.45"/>
          <circle cx="36" cy="36" r="8" stroke="#D4AF37" stroke-width="0.4" fill="none" opacity="0.35"/>
          <circle cx="36" cy="36" r="2" fill="#D4AF37" opacity="0.95"/>
        </svg>
      </div>

      <p style="color:#D4AF37;font-size:10px;font-weight:800;letter-spacing:0.55em;text-transform:uppercase;margin:0 0 8px;">SACRED HEALING</p>
      <p style="color:rgba(255,255,255,0.2);font-size:8px;letter-spacing:0.4em;text-transform:uppercase;margin:0 0 24px;">SIDDHA-QUANTUM INTELLIGENCE · 2050</p>
      
      <h1 style="color:white;font-size:28px;font-weight:300;font-style:italic;margin:0;line-height:1.3;font-family:Georgia,serif;">
        ${t.greeting}, ${displayName}
      </h1>
    </div>

    <!-- BODY -->
    <div style="padding:40px 40px 32px;">
      ${t.body}

      <!-- CTA BUTTON -->
      <div style="text-align:center;margin:40px 0 32px;">
        <a href="${appUrl}"
           style="display:inline-block;background:#D4AF37;color:#050505;padding:18px 52px;border-radius:100px;text-decoration:none;font-size:10px;font-weight:800;letter-spacing:0.5em;text-transform:uppercase;">
          ${t.cta} →
        </a>
      </div>
    </div>

    <!-- DIVIDER -->
    <div style="height:1px;background:linear-gradient(to right,transparent,rgba(212,175,55,0.2),transparent);margin:0 40px;"></div>

    <!-- FOOTER -->
    <div style="padding:28px 40px 36px;text-align:center;">
      <p style="font-size:13px;color:rgba(255,255,255,0.35);line-height:1.8;margin:0 0 16px;">${t.footer}</p>
      <p style="font-size:8px;color:rgba(255,255,255,0.1);letter-spacing:0.35em;text-transform:uppercase;margin:0;">
        FOR SPIRITUAL &amp; ENTERTAINMENT PURPOSES ONLY
      </p>
    </div>

  </div>
</div>
</body>
</html>`;
}

// ════════════════════════════════════════════
// HANDLER
// ════════════════════════════════════════════

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, language } = await req.json();
    console.log(`[send-welcome-email] Request — email=${email}, clientLanguage=${language}`);

    if (!email) throw new Error("Email is required");

    const resendKey = Deno.env.get("RESEND_API_KEY") || "";
    if (resendKey.length < 10) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY missing" }),
        { status: 503, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    const resend = new Resend(resendKey);

    // IP detection
    const forwarded = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    const rawIp = forwarded ? forwarded.split(",")[0].trim() : (realIp || "");

    // Geolocation
    let countryCode = "";
    if (rawIp && !isLocalIp(rawIp)) {
      try {
        const geoRes = await fetch(`http://ip-api.com/json/${rawIp}?fields=status,countryCode`);
        const geoData = await geoRes.json();
        if (geoData.status === "success") countryCode = geoData.countryCode || "";
        console.log(`[send-welcome-email] Geo — countryCode=${countryCode}`);
      } catch (e) {
        console.warn(`[send-welcome-email] Geo failed`, e);
      }
    }

    // Language selection: geo first, client fallback
    const langFromGeo = countryCode ? countryToLang(countryCode) : "";
    const langFromClient = resolveLanguage(language);
    const selectedLang = langFromGeo || langFromClient;
    console.log(`[send-welcome-email] Lang — geo=${langFromGeo}, client=${langFromClient}, selected=${selectedLang}`);

    const t = templates[selectedLang] || templates["en"];
    const displayName = name || "Friend";
    const html = buildEmailHtml(t, displayName, "https://sacredhealing.lovable.app/dashboard");

    const result = await resend.emails.send({
      from: "Sacred Healing <onboarding@resend.dev>",
      to: [email],
      subject: t.subject,
      html,
    });

    if (result.error) {
      console.error(`[send-welcome-email] Resend error`, result.error);
      return new Response(
        JSON.stringify({ error: result.error.message }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`[send-welcome-email] Sent — id=${result.data?.id}, lang=${selectedLang}`);
    return new Response(
      JSON.stringify({ success: true, id: result.data?.id }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("[send-welcome-email] Error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
