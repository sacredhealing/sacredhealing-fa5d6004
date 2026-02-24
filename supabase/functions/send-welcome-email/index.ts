import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  name?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name }: WelcomeEmailRequest = await req.json();

    if (!email) {
      throw new Error("Email is required");
    }

    const displayName = name || "Friend";

    const html = `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #e0e0e0; padding: 40px 30px; border-radius: 12px;">
        <h1 style="color: #c9a96e; font-size: 28px; margin-bottom: 8px;">Välkommen hem, ${displayName} ✨</h1>
        <p style="font-size: 16px; line-height: 1.6; color: #b0b0b0;">Din resa börjar här.</p>
        <hr style="border: none; border-top: 1px solid #222; margin: 24px 0;" />
        <p style="font-size: 15px; line-height: 1.7;">
          Du har tagit det första steget mot inre frid och helande. Sacred Healing är din personliga plats för meditation, andning, mantras och djupare självkännedom.
        </p>
        <p style="font-size: 15px; line-height: 1.7;">
          Börja med att utforska din dagliga vägledning – den väntar på dig varje morgon.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="https://sacredhealing.lovable.app/dashboard" style="background: linear-gradient(135deg, #c9a96e, #a67c3d); color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
            Öppna Sacred Healing
          </a>
        </div>
        <p style="font-size: 13px; color: #666; text-align: center; margin-top: 32px;">
          Med kärlek, Sacred Healing 🙏
        </p>
      </div>
    `;

    await resend.emails.send({
      from: "Sacred Healing <onboarding@resend.dev>",
      to: [email],
      subject: "Välkommen hem till Sacred Healing ✨ Din resa börjar här",
      html,
    });

    console.log(`Welcome email sent to: ${email}`);

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
