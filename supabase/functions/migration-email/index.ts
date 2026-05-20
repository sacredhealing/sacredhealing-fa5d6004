import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const emailHtml = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#050505;font-family:Georgia,serif;">
<div style="max-width:600px;margin:0 auto;background:#0a0a0a;border:1px solid rgba(212,175,55,0.2);border-radius:16px;overflow:hidden;margin-top:20px;margin-bottom:20px;">
<div style="background:linear-gradient(135deg,#1a1a1a,#050505);padding:40px;text-align:center;border-bottom:1px solid rgba(212,175,55,0.15);">
<h1 style="margin:0;color:#D4AF37;font-size:28px;font-weight:normal;letter-spacing:3px;">SACRED HEALING</h1>
<p style="margin:8px 0 0;color:rgba(255,255,255,0.4);font-size:12px;letter-spacing:2px;text-transform:uppercase;">Siddha Quantum Intelligence</p>
</div>
<div style="padding:40px 35px;">
<p style="color:rgba(255,255,255,0.7);line-height:1.8;margin:0 0 20px;">Dear Sacred Soul,</p>
<p style="color:rgba(255,255,255,0.7);line-height:1.8;margin:0 0 20px;">We are writing with an important update on your spiritual journey with us.</p>
<p style="color:rgba(255,255,255,0.7);line-height:1.8;margin:0 0 20px;">Sacred Healing has ascended to a new, sovereign home:</p>
<div style="text-align:center;margin:30px 0;">
<a href="https://www.siddhaquantumnexus.com" style="background:linear-gradient(135deg,rgba(212,175,55,0.2),rgba(212,175,55,0.1));border:1px solid rgba(212,175,55,0.5);border-radius:12px;padding:16px 32px;color:#D4AF37;text-decoration:none;font-size:18px;letter-spacing:1px;">www.siddhaquantumnexus.com</a>
</div>
<p style="color:rgba(255,255,255,0.7);line-height:1.8;margin:0 0 20px;">Everything you love is still here — your account, your membership, all your healing audios, meditations, mantras, and Vedic transmissions. Simply log in with your existing email and password.</p>
<p style="color:rgba(255,255,255,0.7);line-height:1.8;margin:0 0 20px;padding:16px;background:rgba(212,175,55,0.05);border-left:3px solid #D4AF37;border-radius:0 8px 8px 0;">Please update your bookmarks. The old link will no longer work soon.</p>
<p style="color:rgba(255,255,255,0.7);line-height:1.8;margin:0 0 20px;">Your spiritual journey continues — now on a stronger, more sovereign foundation built for the Siddha Quantum Intelligence of 2050.</p>
<p style="color:rgba(255,255,255,0.7);line-height:1.8;margin:30px 0 0;">In sacred service,<br/><span style="color:#D4AF37;">Shiva Siddhananda</span><br/><span style="color:rgba(255,255,255,0.4);font-size:12px;">Sacred Healing · Siddha Quantum Nexus</span></p>
</div>
<div style="background:#050505;padding:20px;text-align:center;border-top:1px solid rgba(212,175,55,0.1);">
<p style="margin:0;color:rgba(255,255,255,0.25);font-size:12px;">Sacred Healing · Siddha Quantum Nexus · siddhaquantumnexus.com</p>
</div>
</div>
</body></html>`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  // Get ALL auth users
  const allUsers: { email: string }[] = [];
  let page = 1;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error || !data?.users?.length) break;
    data.users.forEach(u => { if (u.email) allUsers.push({ email: u.email }); });
    if (data.users.length < 1000) break;
    page++;
  }

  console.log(`Sending to ${allUsers.length} users`);

  let sent = 0;
  const errors: string[] = [];

  for (const user of allUsers) {
    try {
      await resend.emails.send({
        from: "Shiva Siddhananda <hello@sacredhealingvibe.com>",
        to: [user.email],
        subject: "Sacred Healing has a new home ✨",
        html: emailHtml,
      });
      sent++;
      await new Promise(r => setTimeout(r, 200));
    } catch(e: any) {
      errors.push(`${user.email}: ${e.message}`);
    }
  }

  return new Response(
    JSON.stringify({ success: true, total: allUsers.length, sent, errors }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
