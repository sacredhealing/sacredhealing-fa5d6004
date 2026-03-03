import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/** Spanish-speaking country codes (ISO 3166-1 alpha-2) for welcome email language. */
const SPANISH_COUNTRY_CODES = new Set([
  "ES", "MX", "AR", "BO", "CL", "CO", "CR", "CU", "DO", "EC", "SV", "GQ", "GT", "HN", "NI", "PA", "PY", "PE", "PR", "UY", "VE",
]);

type LangCode = "en" | "es" | "no" | "sv";

const templates: Record<LangCode, { subject: string; greeting: string; body: string; footer: string; cta: string }> = {
  sv: {
    subject: "Välkommen hem till Sacred Healing ✨ Din resa börjar här",
    greeting: "Hej",
    body: `<p>Vad roligt att du har hittat till Sacred Healing! Du är nu en del av en växande community där vi förenas genom mantran, uråldrig visdom och djupgående healing.</p>
<p>Som en av de första medlemmarna i appen har du nu tillgång till ett unikt universum som vi fyller på med nytt material varje vecka.</p>

<h2 style="color:#c9a96e;font-size:18px;margin:28px 0 12px;">🧘 Ditt första steg (Viktigt!)</h2>
<p>För att få ut det mesta av appen och för att vi ska kunna vara sammankopplade i systemet, rekommenderar jag att du börjar här:</p>
<p>👉 <strong>Gå till Vedisk Astrologi</strong> i appen och fyll i dina uppgifter. Det är nyckeln till att din profil ska bli helt integrerad.</p>
<p>👉 <strong>Ladda upp en profilbild</strong> och välj ditt språk så att vi kan lära känna dig i vårt community-chat.</p>

<h2 style="color:#c9a96e;font-size:18px;margin:28px 0 12px;">🌌 Utforska Gratisversionen</h2>
<p>Du har direkt tillgång till:</p>
<ul style="padding-left:20px;color:#b0b0b0;line-height:2;">
<li>Utvalda Mantran & Meditationer</li>
<li>Basisk Ayurveda & Vedisk Astrologi</li>
<li>Vår Community-chatt där du kan prata med likasinnade och oss direkt</li>
<li>Kurser och YouTube-videos för din utveckling</li>
</ul>

<h2 style="color:#c9a96e;font-size:18px;margin:28px 0 12px;">💎 Ta steget till Premium (Universal Access)</h2>
<p>Om du känner att du vill ha den fullständiga upplevelsen och verkligen investera i din resa mot överflöd och hälsa, rekommenderar jag vårt Premium-medlemskap. Det är vår mest omfattande nivå och ger dig:</p>
<ul style="padding-left:20px;color:#b0b0b0;line-height:2;">
<li>Fullständig tillgång till ALL musik, ALLA mantran och ALLA healing-meditationer</li>
<li>Djupgående Vedisk Astrologi och verktyg för Vastu & Ayurveda</li>
<li>Exklusiva möjligheter för Abundance & Coaching</li>
</ul>
<p>Vi finns här för att stötta din resa mot sinnesro och självupptäckt. Tveka inte att skriva till oss i chatten!</p>`,
    footer: "Med ljus och tacksamhet,<br/><strong>Adam, Kritagya Das & Laila, Karaveera Nivasini Dasi</strong>",
    cta: "Öppna Sacred Healing",
  },
  en: {
    subject: "Welcome home to Sacred Healing ✨ Your journey begins here",
    greeting: "Hello",
    body: `<p>How wonderful that you've found Sacred Healing! You are now part of a growing community united through mantras, ancient wisdom, and deep healing.</p>
<p>As one of the first members of the app, you now have access to a unique universe that we fill with new material every week.</p>

<h2 style="color:#c9a96e;font-size:18px;margin:28px 0 12px;">🧘 Your First Step (Important!)</h2>
<p>To get the most out of the app and to stay connected in the system, we recommend starting here:</p>
<p>👉 <strong>Go to Vedic Astrology</strong> in the app and fill in your details. This is the key to fully integrating your profile.</p>
<p>👉 <strong>Upload a profile picture</strong> and choose your language so we can get to know you in our community chat.</p>

<h2 style="color:#c9a96e;font-size:18px;margin:28px 0 12px;">🌌 Explore the Free Version</h2>
<p>You have immediate access to:</p>
<ul style="padding-left:20px;color:#b0b0b0;line-height:2;">
<li>Selected Mantras & Meditations</li>
<li>Basic Ayurveda & Vedic Astrology</li>
<li>Our Community Chat where you can connect with like-minded people and us directly</li>
<li>Courses and YouTube videos for your growth</li>
</ul>

<h2 style="color:#c9a96e;font-size:18px;margin:28px 0 12px;">💎 Step Up to Premium (Universal Access)</h2>
<p>If you feel ready for the full experience and truly want to invest in your journey toward abundance and health, we recommend our Premium membership. It's our most comprehensive tier and gives you:</p>
<ul style="padding-left:20px;color:#b0b0b0;line-height:2;">
<li>Full access to ALL music, ALL mantras, and ALL healing meditations</li>
<li>Deep Vedic Astrology and tools for Vastu & Ayurveda</li>
<li>Exclusive Abundance & Coaching opportunities</li>
</ul>
<p>We're here to support your journey toward peace and self-discovery. Don't hesitate to reach out in the chat!</p>`,
    footer: "With light and gratitude,<br/><strong>Adam, Kritagya Das & Laila, Karaveera Nivasini Dasi</strong>",
    cta: "Open Sacred Healing",
  },
  es: {
    subject: "Bienvenido a Sacred Healing ✨ Tu viaje comienza aquí",
    greeting: "Hola",
    body: `<p>¡Qué alegría que hayas encontrado Sacred Healing! Ahora eres parte de una comunidad en crecimiento unida a través de mantras, sabiduría ancestral y sanación profunda.</p>
<p>Como uno de los primeros miembros de la app, tienes acceso a un universo único que llenamos con nuevo material cada semana.</p>

<h2 style="color:#c9a96e;font-size:18px;margin:28px 0 12px;">🧘 Tu primer paso (¡Importante!)</h2>
<p>Para aprovechar al máximo la app y mantenernos conectados en el sistema, te recomendamos empezar aquí:</p>
<p>👉 <strong>Ve a Astrología Védica</strong> en la app y completa tus datos. Es la clave para integrar completamente tu perfil.</p>
<p>👉 <strong>Sube una foto de perfil</strong> y elige tu idioma para que podamos conocerte en nuestro chat comunitario.</p>

<h2 style="color:#c9a96e;font-size:18px;margin:28px 0 12px;">🌌 Explora la versión gratuita</h2>
<p>Tienes acceso inmediato a:</p>
<ul style="padding-left:20px;color:#b0b0b0;line-height:2;">
<li>Mantras y meditaciones seleccionados</li>
<li>Ayurveda básico y Astrología Védica</li>
<li>Nuestro chat comunitario donde puedes conectar con personas afines y con nosotros directamente</li>
<li>Cursos y videos de YouTube para tu desarrollo</li>
</ul>

<h2 style="color:#c9a96e;font-size:18px;margin:28px 0 12px;">💎 Da el paso a Premium (Acceso Universal)</h2>
<p>Si sientes que quieres la experiencia completa e invertir en tu camino hacia la abundancia y la salud, te recomendamos nuestra membresía Premium. Es nuestro nivel más completo y te da:</p>
<ul style="padding-left:20px;color:#b0b0b0;line-height:2;">
<li>Acceso completo a TODA la música, TODOS los mantras y TODAS las meditaciones de sanación</li>
<li>Astrología Védica profunda y herramientas de Vastu y Ayurveda</li>
<li>Oportunidades exclusivas de Abundancia y Coaching</li>
</ul>
<p>Estamos aquí para apoyar tu viaje hacia la paz y el autodescubrimiento. ¡No dudes en escribirnos en el chat!</p>`,
    footer: "Con luz y gratitud,<br/><strong>Adam, Kritagya Das & Laila, Karaveera Nivasini Dasi</strong>",
    cta: "Abrir Sacred Healing",
  },
  no: {
    subject: "Velkommen hjem til Sacred Healing ✨ Reisen din begynner her",
    greeting: "Hei",
    body: `<p>Så flott at du har funnet Sacred Healing! Du er nå en del av et voksende fellesskap forent gjennom mantraer, eldgammel visdom og dyp healing.</p>
<p>Som en av de første medlemmene i appen har du nå tilgang til et unikt univers som vi fyller med nytt materiale hver uke.</p>

<h2 style="color:#c9a96e;font-size:18px;margin:28px 0 12px;">🧘 Ditt første steg (Viktig!)</h2>
<p>For å få mest mulig ut av appen og for at vi skal holde kontakten i systemet, anbefaler vi at du starter her:</p>
<p>👉 <strong>Gå til Vedisk Astrologi</strong> i appen og fyll inn opplysningene dine. Det er nøkkelen til å integrere profilen din fullstendig.</p>
<p>👉 <strong>Last opp et profilbilde</strong> og velg språket ditt slik at vi kan bli kjent med deg i community-chatten vår.</p>

<h2 style="color:#c9a96e;font-size:18px;margin:28px 0 12px;">🌌 Utforsk gratisversjonen</h2>
<p>Du har umiddelbar tilgang til:</p>
<ul style="padding-left:20px;color:#b0b0b0;line-height:2;">
<li>Utvalgte mantraer og meditasjoner</li>
<li>Grunnleggende Ayurveda og Vedisk Astrologi</li>
<li>Vår community-chat der du kan snakke med likesinnede og oss direkte</li>
<li>Kurs og YouTube-videoer for din utvikling</li>
</ul>

<h2 style="color:#c9a96e;font-size:18px;margin:28px 0 12px;">💎 Ta steget til Premium (Universal Access)</h2>
<p>Hvis du føler at du vil ha den fullstendige opplevelsen og virkelig investere i reisen din mot overflod og helse, anbefaler vi vårt Premium-medlemskap. Det er vårt mest omfattende nivå og gir deg:</p>
<ul style="padding-left:20px;color:#b0b0b0;line-height:2;">
<li>Full tilgang til ALL musikk, ALLE mantraer og ALLE healing-meditasjoner</li>
<li>Dyptgående Vedisk Astrologi og verktøy for Vastu og Ayurveda</li>
<li>Eksklusive muligheter for Abundance og Coaching</li>
</ul>
<p>Vi er her for å støtte reisen din mot sinnsro og selvoppdagelse. Ikke nøl med å skrive til oss i chatten!</p>`,
    footer: "Med lys og takknemlighet,<br/><strong>Adam, Kritagya Das & Laila, Karaveera Nivasini Dasi</strong>",
    cta: "Åpne Sacred Healing",
  },
};

/** Resolve language from country code (IP geolocation). Spanish countries → es, Norway → no, Sweden → sv, else en. */
function languageFromCountryCode(countryCode: string | null): LangCode {
  if (!countryCode) return "en";
  const cc = countryCode.toUpperCase();
  if (SPANISH_COUNTRY_CODES.has(cc)) return "es";
  if (cc === "NO") return "no";
  if (cc === "SE") return "sv";
  return "en";
}

/** Fallback: resolve from client-provided language (e.g. i18n). */
function resolveLanguageFromClient(lang?: string): LangCode {
  if (!lang) return "en";
  const code = lang.toLowerCase().split("-")[0];
  if (code === "es" || code === "no" || code === "sv" || code === "en") return code as LangCode;
  if (code === "nb" || code === "nn") return "no";
  return "en";
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const step = (msg: string, data?: Record<string, unknown>) => {
    console.log(`[send-welcome-email] ${msg}`, data ? JSON.stringify(data) : "");
  };

  try {
    step("Step 1: Request received");

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey || resendApiKey.length < 10) {
      step("Step 0: RESEND_API_KEY missing or invalid – cannot send email");
      return new Response(
        JSON.stringify({ error: "Email service not configured (RESEND_API_KEY)" }),
        { status: 503, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const body = await req.json().catch(() => ({})) as { email?: string; name?: string; language?: string };
    const email = body?.email;
    const name = body?.name;
    const clientLanguage = body?.language;

    if (!email || typeof email !== "string") {
      step("Step 1: Validation failed – email required");
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    step("Step 1: Parsed body", { email, hasName: !!name, clientLanguage });

    // --- IP detection ---
    const forwarded = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    const rawIp = forwarded?.split(/\s*,\s*/)[0]?.trim() || realIp?.trim() || null;
    step("Step 2: IP detection", { rawIp, hasForwarded: !!forwarded, hasRealIp: !!realIp });

    let countryCode: string | null = null;
    if (rawIp && rawIp !== "127.0.0.1" && !rawIp.startsWith("::")) {
      try {
        const geoUrl = `http://ip-api.com/json/${encodeURIComponent(rawIp)}?fields=countryCode,status`;
        const geoRes = await fetch(geoUrl);
        const geo = await geoRes.json() as { status?: string; countryCode?: string };
        if (geo?.status === "success" && geo?.countryCode) {
          countryCode = geo.countryCode;
          step("Step 3: Geolocation success", { countryCode });
        } else {
          step("Step 3: Geolocation failed or limited", { geo });
        }
      } catch (geoErr) {
        step("Step 3: Geolocation request error", { error: String(geoErr) });
      }
    } else {
      step("Step 3: No IP or local IP – skipping geolocation");
    }

    const langFromGeo = languageFromCountryCode(countryCode);
    const langFromClient = resolveLanguageFromClient(clientLanguage);
    const lang: LangCode = countryCode ? langFromGeo : langFromClient;
    step("Step 4: Language selection", { countryCode, langFromGeo, langFromClient, selected: lang });

    const t = templates[lang];
    if (!t) {
      step("Step 5: Template missing for lang", { lang });
      return new Response(
        JSON.stringify({ error: "Unsupported language" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    step("Step 5: Template selected", { lang, subject: t.subject });

    const displayName = (name && String(name).trim()) || "Friend";
    const html = `
      <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#e0e0e0;padding:40px 30px;border-radius:12px;">
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="color:#c9a96e;font-size:28px;margin:0 0 4px;">Sacred Healing</h1>
        </div>
        <p style="font-size:16px;line-height:1.6;color:#e0e0e0;">${t.greeting} ${displayName},</p>
        <hr style="border:none;border-top:1px solid #222;margin:20px 0;" />
        <div style="font-size:15px;line-height:1.7;color:#b0b0b0;">
          ${t.body}
        </div>
        <div style="text-align:center;margin:32px 0;">
          <a href="https://sacredhealing.lovable.app/dashboard" style="background:linear-gradient(135deg,#c9a96e,#a67c3d);color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">
            ${t.cta}
          </a>
        </div>
        <hr style="border:none;border-top:1px solid #222;margin:24px 0;" />
        <p style="font-size:14px;color:#888;text-align:center;">${t.footer}</p>
      </div>
    `;

    const resend = new Resend(resendApiKey);
    step("Step 6: Calling Resend API", { to: email, subject: t.subject, lang });

    try {
      const result = await resend.emails.send({
        from: "Sacred Healing <onboarding@resend.dev>",
        to: [email],
        subject: t.subject,
        html,
      });

      if (result.error) {
        step("Step 7: Resend returned error", { error: result.error });
        console.error("[send-welcome-email] Resend error:", result.error);
        return new Response(
          JSON.stringify({ error: result.error.message || "Email send failed" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      step("Step 7: Welcome email sent successfully", { email, lang, id: (result as { data?: { id?: string } })?.data?.id });
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    } catch (sendErr: unknown) {
      step("Step 7: Exception during send", { error: String(sendErr) });
      console.error("[send-welcome-email] Send exception:", sendErr);
      throw sendErr;
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[send-welcome-email] Error:", error);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
