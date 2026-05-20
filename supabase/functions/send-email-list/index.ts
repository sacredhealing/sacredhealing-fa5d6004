import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
  const from = Deno.env.get("EMAIL_FROM") || "Shiva Siddhananda <noreply@siddhaquantumnexus.com>";

  const body = await req.json().catch(() => ({}));
  const { subject, html, plain } = body;

  if (!subject || (!html && !plain)) {
    return new Response(JSON.stringify({ error: "subject and html or plain required" }), { status: 400, headers: cors });
  }

  const { data: emails, error } = await supabase
    .from("email_list")
    .select("email")
    .eq("subscribed", true);

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: cors });

  const finalHtml = html || plain?.split('\n').map((l: string) => `<p style="color:rgba(255,255,255,0.7);line-height:1.8;">${l}</p>`).join('');

  let sent = 0, failed = 0;
  for (const { email } of emails || []) {
    try {
      await resend.emails.send({ from, to: [email], subject, html: finalHtml });
      sent++;
      await new Promise(r => setTimeout(r, 200));
    } catch(e: any) {
      console.error(`Failed ${email}: ${e.message}`);
      failed++;
    }
  }

  return new Response(
    JSON.stringify({ success: true, total: emails?.length, sent, failed }),
    { headers: { ...cors, "Content-Type": "application/json" } }
  );
});
