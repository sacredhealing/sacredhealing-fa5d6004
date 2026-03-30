import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatBodyHtml(raw: string): string {
  const safe = escapeHtml(raw);
  return safe.split(/\r?\n/).map((line) =>
    line.length ? `<p style="margin:0 0 12px;line-height:1.6;color:rgba(255,255,255,0.75);">${line}</p>` : "<br/>"
  ).join("");
}

/** Normalize profile / i18n language codes to supported announcement columns. */
function resolveLang(raw: string | null | undefined): string {
  if (!raw) return "en";
  const code = raw.toLowerCase().split("-")[0];
  if (["en", "sv", "no", "es"].includes(code)) return code;
  if (code === "nb" || code === "nn") return "no";
  return "en";
}

type AnnouncementRow = Record<string, unknown>;

function getLocalized(
  announcement: AnnouncementRow,
  field: "title" | "message",
  lang: string,
): string {
  if (lang !== "en") {
    const localizedKey = `${field}_${lang}`;
    const localized = announcement[localizedKey];
    if (typeof localized === "string" && localized.trim()) return localized;
    if (field === "message") {
      const contentKey = `content_${lang}`;
      const alt = announcement[contentKey];
      if (typeof alt === "string" && alt.trim()) return alt;
    }
  }
  const base = announcement[field];
  return typeof base === "string" ? base : "";
}

async function listAllAuthUsers(
  supabase: ReturnType<typeof createClient>,
): Promise<{ id: string; email: string | undefined }[]> {
  const out: { id: string; email: string | undefined }[] = [];
  let page = 1;
  const perPage = 1000;
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    for (const u of data.users) {
      out.push({ id: u.id, email: u.email ?? undefined });
    }
    if (data.users.length < perPage) break;
    page++;
  }
  return out;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const resend = new Resend(resendKey);
  const from =
    Deno.env.get("RESEND_FROM") || "Sacred Healing <onboarding@resend.dev>";

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const supabase = createClient(supabaseUrl, serviceKey);

  let announcement_id: string;
  try {
    const body = await req.json();
    announcement_id = body?.announcement_id;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  if (!announcement_id || typeof announcement_id !== "string") {
    return new Response(JSON.stringify({ error: "announcement_id is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const { data: announcement, error: annErr } = await supabase
    .from("announcements")
    .select("*")
    .eq("id", announcement_id)
    .single();

  if (annErr || !announcement) {
    return new Response(JSON.stringify({ error: "Announcement not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const row = announcement as AnnouncementRow;

  // Fetch active email subscribers to filter recipients
  const { data: subscribers } = await supabase
    .from("email_subscribers")
    .select("email")
    .eq("is_active", true);

  const activeEmails = new Set(
    (subscribers ?? []).map((s: { email: string }) => s.email.toLowerCase()),
  );

  const { data: profiles, error: profErr } = await supabase
    .from("profiles")
    .select("user_id, preferred_language");

  if (profErr) {
    return new Response(JSON.stringify({ error: "Failed to load profiles" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const langByUser = new Map<string, string>();
  for (const p of profiles ?? []) {
    const rec = p as { user_id: string; preferred_language: string | null };
    langByUser.set(rec.user_id, resolveLang(rec.preferred_language));
  }

  let authUsers: { id: string; email: string | undefined }[];
  try {
    authUsers = await listAllAuthUsers(supabase);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to list users";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  // Only send to users whose email is in the active subscribers list
  const targets = authUsers.filter(
    (u) => u.email && u.email.includes("@") && activeEmails.has(u.email.toLowerCase()),
  );
  const skipped = authUsers.filter(
    (u) => u.email && u.email.includes("@") && !activeEmails.has(u.email.toLowerCase()),
  ).length;

  const batchSize = 8;
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < targets.length; i += batchSize) {
    const batch = targets.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map(async (user) => {
        const lang = langByUser.get(user.id) ?? "en";
        const subject = getLocalized(row, "title", lang);
        const bodyText = getLocalized(row, "message", lang);
        const bodyHtml = formatBodyHtml(bodyText);
        const subjectHtml = escapeHtml(subject);

        const siteUrl = Deno.env.get("SITE_URL") || "https://sacredhealing.lovable.app";
        const unsubLink = `${siteUrl}/dashboard?unsubscribe=true`;

        await resend.emails.send({
          from,
          to: [user.email!],
          subject,
          html: `
            <div style="background:#050505;color:#fff;font-family:sans-serif;padding:40px;border-radius:16px;max-width:560px;margin:0 auto;">
              <h1 style="color:#D4AF37;font-size:22px;margin:0 0 24px;">${subjectHtml}</h1>
              ${bodyHtml}
              <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:32px 0 16px;" />
              <p style="font-size:11px;color:rgba(255,255,255,0.25);text-align:center;margin:0;">
                You're receiving this because you subscribed to Sacred Healing updates.
                <br/><a href="${unsubLink}" style="color:rgba(212,175,55,0.5);text-decoration:underline;">Unsubscribe</a>
              </p>
            </div>
          `,
        });
      }),
    );

    for (const r of results) {
      if (r.status === "fulfilled") sent++;
      else failed++;
    }

    if (i + batchSize < targets.length) {
      await new Promise((r) => setTimeout(r, 400));
    }
  }

  return new Response(JSON.stringify({ sent, failed, skipped, total: targets.length }), {
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
});
