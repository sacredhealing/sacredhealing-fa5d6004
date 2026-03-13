import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotifyCommunityPayload {
  type: "live" | "post" | "message" | "dm";
  triggeredBy: string;
  channelId?: string;
  channelName?: string;
  title: string;
  body: string;
  link: string;
  targetUserIds?: string[];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload: NotifyCommunityPayload = await req.json();
    const { type, triggeredBy, channelId, channelName, title, body, link, targetUserIds } = payload;

    if (!type || !title || !body || !link) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get target users from profiles
    let query = supabase
      .from("profiles")
      .select("user_id, full_name, push_token, push_enabled, email_notifications, notify_live, notify_new_post, notify_new_message");

    if (targetUserIds && targetUserIds.length > 0) {
      query = query.in("user_id", targetUserIds);
    }

    const { data: profileRows, error: profileError } = await query;

    if (profileError) {
      console.error("Error fetching profiles:", profileError);
      return new Response(JSON.stringify({ error: profileError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const users = (profileRows || []) as Array<{
      user_id: string;
      full_name: string | null;
      push_token?: string | null;
      push_enabled?: boolean | null;
      email_notifications?: boolean | null;
      notify_live?: boolean | null;
      notify_new_post?: boolean | null;
      notify_new_message?: boolean | null;
    }>;

    // Filter by preference (columns may not exist yet - use optional chaining)
    const eligible = users.filter((u) => {
      if (type === "live") return u.notify_live !== false;
      if (type === "post") return u.notify_new_post !== false;
      if (type === "message" || type === "dm") return u.notify_new_message !== false;
      return true;
    });

    if (eligible.length === 0) {
      return new Response(
        JSON.stringify({ success: true, inserted: 0, emailsSent: 0, message: "No eligible users" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Insert in-app notifications (bulk insert)
    const notifications = eligible.map((u) => ({
      user_id: u.user_id,
      type,
      title,
      body,
      channel_id: channelId ?? null,
      link,
    }));

    const { error: insertError } = await supabase.from("community_notifications").insert(notifications);

    if (insertError) {
      console.error("Error inserting notifications:", insertError);
    }

    // 2. Get emails from auth.users for eligible users
    const emailMap: Record<string, string> = {};
    if (resendApiKey && eligible.some((u) => u.email_notifications !== false)) {
      try {
        const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
        const authUsers = authData?.users || [];
        authUsers.forEach((u) => {
          if (u.email) emailMap[u.id] = u.email;
        });
      } catch (authErr) {
        console.warn("Could not fetch auth users for email:", authErr);
      }
    }

    // 3. Send emails to users who have email_notifications and an email
    let emailsSent = 0;
    if (resendApiKey) {
      const emailUsers = eligible.filter(
        (u) => u.email_notifications !== false && emailMap[u.user_id]
      );

      if (emailUsers.length > 0) {
        const batchSize = 100;
        for (let i = 0; i < emailUsers.length; i += batchSize) {
          const batch = emailUsers.slice(i, i + batchSize);
          const emailPayload = batch.map((u) => ({
            from: "Sacred Healing <community@sacredhealing.com>",
            to: [emailMap[u.user_id]],
            subject: title,
            html: `
              <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px">
                <h2 style="color:#D4AF37">${title}</h2>
                <p style="color:#333;font-size:15px">${body}</p>
                <a href="https://sacredhealing.lovable.app${link}" 
                   style="display:inline-block;background:#D4AF37;color:#000;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:16px">
                  Open Community →
                </a>
                <p style="color:#999;font-size:12px;margin-top:24px">
                  You can turn off these notifications in your profile settings.
                </p>
              </div>
            `,
          }));

          const res = await fetch("https://api.resend.com/emails/batch", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(emailPayload),
          });

          if (res.ok) {
            const resData = await res.json();
            emailsSent += (resData?.data?.length ?? batch.length);
          } else {
            console.error("Resend batch error:", await res.text());
          }

          if (i + batchSize < emailUsers.length) {
            await new Promise((r) => setTimeout(r, 100));
          }
        }
      }
    }

    // 4. Browser push - would require VAPID + push_token; skip for now as it needs client-side setup
    // TODO: Integrate with web push when push_token is populated

    return new Response(
      JSON.stringify({
        success: true,
        inserted: notifications.length,
        emailsSent,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("notify-community error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
