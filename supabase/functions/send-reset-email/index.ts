import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SPANISH_COUNTRIES = new Set([
  "ES", "MX", "AR", "BO", "CL", "CO", "CR", "CU", "DO", "EC",
  "SV", "GQ", "GT", "HN", "NI", "PA", "PY", "PE", "PR", "UY", "VE",
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
  if (code in templates) return code;
  if (code === "nb" || code === "nn") return "no";
  return "en";
}

function isLocalIp(ip: string): boolean {
  return !ip || ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.") || ip.startsWith("10.") || ip.startsWith("172.");
}

const RESET_LINK = "https://sacredhealing.lovable.app/reset-password";

const templates: Record<string, { subject: string; greeting: string; cta: string; body: string; footer: string }> = {
  sv: {
    subject: "Återställ ditt lösenord — Sacred Healing",
    greeting: "Hej",
    cta: "Återställ lösenord",
    body: `
    <p>Vi fick en begäran om att återställa lösenordet för ditt Sacred Healing-konto.</p>
    <p>Klicka på knappen nedan för att välja ett nytt lösenord. Länken är giltig i <strong>60 minuter</strong>.</p>
    <p style="color:#888;font-size:13px;">Om du inte begärde detta kan du ignorera detta e-postmeddelande — ditt konto är säkert.</p>
  `,
    footer: "Med ljus och omsorg,<br/><strong>Sacred Healing · SQI 2050</strong>",
  },
  en: {
    subject: "Reset your password — Sacred Healing",
    greeting: "Hello",
    cta: "Reset Password",
    body: `
    <p>We received a request to reset the password for your Sacred Healing account.</p>
    <p>Click the button below to choose a new password. This link is valid for <strong>60 minutes</strong>.</p>
    <p style="color:#888;font-size:13px;">If you didn't request this, you can safely ignore this email — your account is secure.</p>
  `,
    footer: "With light and care,<br/><strong>Sacred Healing · SQI 2050</strong>",
  },
  no: {
    subject: "Tilbakestill passordet ditt — Sacred Healing",
    greeting: "Hei",
    cta: "Tilbakestill passord",
    body: `
    <p>Vi mottok en forespørsel om å tilbakestille passordet for din Sacred Healing-konto.</p>
    <p>Klikk på knappen nedenfor for å velge et nytt passord. Lenken er gyldig i <strong>60 minutter</strong>.</p>
    <p style="color:#888;font-size:13px;">Hvis du ikke ba om dette, kan du trygt ignorere denne e-posten — kontoen din er sikker.</p>
  `,
    footer: "Med lys og omsorg,<br/><strong>Sacred Healing · SQI 2050</strong>",
  },
  es: {
    subject: "Restablece tu contraseña — Sacred Healing",
    greeting: "Hola",
    cta: "Restablecer contraseña",
    body: `
    <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta de Sacred Healing.</p>
    <p>Haz clic en el botón de abajo para elegir una nueva contraseña. El enlace es válido durante <strong>60 minutos</strong>.</p>
    <p style="color:#888;font-size:13px;">Si no solicitaste esto, puedes ignorar este correo — tu cuenta está segura.</p>
  `,
    footer: "Con luz y cuidado,<br/><strong>Sacred Healing · SQI 2050</strong>",
  },
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, language } = await req.json();
    console.log(`[send-reset-email] Request — email=${email}, clientLanguage=${language}`);

    if (!email) {
      throw new Error("Email is required");
    }

    const resendKey = Deno.env.get("RESEND_API_KEY") || "";
    if (resendKey.length < 10) {
      console.error("[send-reset-email] RESEND_API_KEY missing or invalid");
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY missing or invalid" }),
        { status: 503, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    const resend = new Resend(resendKey);

    const forwarded = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    const rawIp = forwarded ? forwarded.split(",")[0].trim() : (realIp || "");
    console.log(`[send-reset-email] IP — rawIp=${rawIp}`);

    let countryCode = "";
    if (rawIp && !isLocalIp(rawIp)) {
      try {
        const geoRes = await fetch(`http://ip-api.com/json/${rawIp}?fields=status,countryCode`);
        const geoData = await geoRes.json();
        if (geoData.status === "success") countryCode = geoData.countryCode || "";
      } catch (e) {
        console.warn("[send-reset-email] Geolocation failed", e);
      }
    }

    const langFromGeo = countryCode ? countryToLang(countryCode) : "";
    const langFromClient = resolveLanguage(language);
    const selectedLang = langFromGeo || langFromClient;
    console.log(`[send-reset-email] Language — selected=${selectedLang}`);

    const t = templates[selectedLang] || templates["en"];

    const html = `
<div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:600px;margin:0 auto;background:#050505;color:#e0e0e0;padding:0;border-radius:16px;overflow:hidden;border:1px solid rgba(212,175,55,0.15);">
  <div style="background:linear-gradient(135deg,#0a0a0a 0%,#111 100%);padding:48px 40px 32px;text-align:center;border-bottom:1px solid rgba(212,175,55,0.1);">
    <div style="margin:0 auto 20px;width:64px;height:64px;">
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="32" r="30" stroke="#D4AF37" stroke-width="0.5" opacity="0.5"/>
        <polygon points="32,6 56,46 8,46" stroke="#D4AF37" stroke-width="1" fill="none" opacity="0.9"/>
        <polygon points="32,58 8,18 56,18" stroke="#D4AF37" stroke-width="1" fill="none" opacity="0.9"/>
        <polygon points="32,14 50,42 14,42" stroke="#D4AF37" stroke-width="0.6" fill="none" opacity="0.6"/>
        <polygon points="32,50 14,22 50,22" stroke="#D4AF37" stroke-width="0.6" fill="none" opacity="0.6"/>
        <circle cx="32" cy="32" r="5" stroke="#D4AF37" stroke-width="0.5" fill="none" opacity="0.4"/>
        <circle cx="32" cy="32" r="1.5" fill="#D4AF37" opacity="0.9"/>
      </svg>
    </div>
    <h1 style="color:#D4AF37;font-size:11px;font-weight:800;letter-spacing:0.5em;text-transform:uppercase;margin:0 0 8px;">SACRED HEALING</h1>
    <p style="color:rgba(255,255,255,0.3);font-size:8px;letter-spacing:0.4em;text-transform:uppercase;margin:0;">SIDDHA-QUANTUM INTELLIGENCE · 2050</p>
  </div>
  <div style="padding:40px 40px 32px;">
    <p style="font-size:15px;color:rgba(255,255,255,0.6);margin:0 0 24px;">${t.greeting},</p>
    <div style="font-size:15px;line-height:1.8;color:rgba(255,255,255,0.55);">
      ${t.body}
    </div>
    <div style="text-align:center;margin:40px 0;">
      <a href="${RESET_LINK}" style="display:inline-block;background:#D4AF37;color:#050505;padding:16px 48px;border-radius:100px;text-decoration:none;font-size:11px;font-weight:800;letter-spacing:0.4em;text-transform:uppercase;box-shadow:0 0 40px rgba(212,175,55,0.3);">
        ${t.cta} →
      </a>
    </div>
    <p style="font-size:11px;color:rgba(255,255,255,0.2);text-align:center;word-break:break-all;">${RESET_LINK}</p>
  </div>
  <div style="padding:24px 40px 32px;border-top:1px solid rgba(255,255,255,0.04);text-align:center;">
    <p style="font-size:12px;color:rgba(255,255,255,0.25);margin:0;">${t.footer}</p>
    <p style="font-size:9px;color:rgba(255,255,255,0.1);letter-spacing:0.3em;text-transform:uppercase;margin:12px 0 0;">FOR SPIRITUAL & ENTERTAINMENT PURPOSES ONLY</p>
  </div>
</div>
`;

    const result = await resend.emails.send({
      from: Deno.env.get("EMAIL_FROM") || "Kritagya Das <noreply@siddhaquantumnexus.com>",
      to: [email],
      subject: t.subject,
      html,
    });

    if (result.error) {
      console.error("[send-reset-email] Resend error", result.error);
      return new Response(
        JSON.stringify({ error: result.error.message || "Resend send failed" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`[send-reset-email] Success — email=${email}, lang=${selectedLang}, id=${result.data?.id}`);
    return new Response(
      JSON.stringify({ success: true, id: result.data?.id }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[send-reset-email] Error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
