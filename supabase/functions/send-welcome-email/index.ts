import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const templates: Record<string, { subject: string; heading: string; intro: string; body: string; cta: string; footer: string }> = {
  sv: {
    subject: "Välkommen hem till Sacred Healing ✨ Din resa börjar här",
    heading: "Välkommen hem",
    intro: "Din resa börjar här.",
    body: "Du har tagit det första steget mot inre frid och helande. Sacred Healing är din personliga plats för meditation, andning, mantras och djupare självkännedom.\n\nBörja med att utforska din dagliga vägledning – den väntar på dig varje morgon.",
    cta: "Öppna Sacred Healing",
    footer: "Med kärlek, Sacred Healing 🙏",
  },
  en: {
    subject: "Welcome home to Sacred Healing ✨ Your journey begins here",
    heading: "Welcome home",
    intro: "Your journey begins here.",
    body: "You've taken the first step toward inner peace and healing. Sacred Healing is your personal space for meditation, breathwork, mantras, and deeper self-awareness.\n\nStart by exploring your daily guidance – it's waiting for you every morning.",
    cta: "Open Sacred Healing",
    footer: "With love, Sacred Healing 🙏",
  },
  es: {
    subject: "Bienvenido a Sacred Healing ✨ Tu viaje comienza aquí",
    heading: "Bienvenido a casa",
    intro: "Tu viaje comienza aquí.",
    body: "Has dado el primer paso hacia la paz interior y la sanación. Sacred Healing es tu espacio personal para meditación, respiración, mantras y autoconocimiento profundo.\n\nComienza explorando tu guía diaria – te espera cada mañana.",
    cta: "Abrir Sacred Healing",
    footer: "Con amor, Sacred Healing 🙏",
  },
  no: {
    subject: "Velkommen hjem til Sacred Healing ✨ Reisen din begynner her",
    heading: "Velkommen hjem",
    intro: "Reisen din begynner her.",
    body: "Du har tatt det første steget mot indre fred og helbredelse. Sacred Healing er ditt personlige sted for meditasjon, pusteøvelser, mantraer og dypere selvbevissthet.\n\nBegynn med å utforske din daglige veiledning – den venter på deg hver morgen.",
    cta: "Åpne Sacred Healing",
    footer: "Med kjærlighet, Sacred Healing 🙏",
  },
};

function resolveLanguage(lang?: string): string {
  if (!lang) return "en";
  const code = lang.toLowerCase().split("-")[0];
  if (code in templates) return code;
  // Map nb/nn to no
  if (code === "nb" || code === "nn") return "no";
  return "en";
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, language } = await req.json();

    if (!email) {
      throw new Error("Email is required");
    }

    const displayName = name || "Friend";
    const lang = resolveLanguage(language);
    const t = templates[lang];

    const bodyParagraphs = t.body.split("\n\n").map(p =>
      `<p style="font-size:15px;line-height:1.7;color:#b0b0b0;margin:0 0 16px;">${p}</p>`
    ).join("");

    const html = `
      <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#e0e0e0;padding:40px 30px;border-radius:12px;">
        <h1 style="color:#c9a96e;font-size:28px;margin-bottom:8px;">${t.heading}, ${displayName} ✨</h1>
        <p style="font-size:16px;line-height:1.6;color:#b0b0b0;">${t.intro}</p>
        <hr style="border:none;border-top:1px solid #222;margin:24px 0;" />
        ${bodyParagraphs}
        <div style="text-align:center;margin:32px 0;">
          <a href="https://sacredhealing.lovable.app/dashboard" style="background:linear-gradient(135deg,#c9a96e,#a67c3d);color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">
            ${t.cta}
          </a>
        </div>
        <p style="font-size:13px;color:#666;text-align:center;margin-top:32px;">${t.footer}</p>
      </div>
    `;

    await resend.emails.send({
      from: "Sacred Healing <onboarding@resend.dev>",
      to: [email],
      subject: t.subject,
      html,
    });

    console.log(`Welcome email sent to ${email} in language: ${lang}`);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error sending welcome email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
