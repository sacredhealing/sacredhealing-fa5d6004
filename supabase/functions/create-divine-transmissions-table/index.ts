import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const MIGRATION_SQL = `
CREATE TABLE IF NOT EXISTS public.divine_transmissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'divine_transmissions',
  audio_url_en TEXT,
  audio_url_sv TEXT,
  cover_image_url TEXT,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  is_free BOOLEAN NOT NULL DEFAULT false,
  required_tier INTEGER NOT NULL DEFAULT 0,
  series_name TEXT,
  series_order INTEGER,
  published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.divine_transmissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view published transmissions" ON public.divine_transmissions;
CREATE POLICY "Anyone can view published transmissions"
  ON public.divine_transmissions FOR SELECT
  USING (published = true);

DROP POLICY IF EXISTS "Admins can view all transmissions" ON public.divine_transmissions;
CREATE POLICY "Admins can view all transmissions"
  ON public.divine_transmissions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can insert transmissions" ON public.divine_transmissions;
CREATE POLICY "Admins can insert transmissions"
  ON public.divine_transmissions FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update transmissions" ON public.divine_transmissions;
CREATE POLICY "Admins can update transmissions"
  ON public.divine_transmissions FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete transmissions" ON public.divine_transmissions;
CREATE POLICY "Admins can delete transmissions"
  ON public.divine_transmissions FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_divine_transmissions_category
  ON public.divine_transmissions(category);

CREATE INDEX IF NOT EXISTS idx_divine_transmissions_published
  ON public.divine_transmissions(published);

CREATE OR REPLACE FUNCTION public.update_divine_transmissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_divine_transmissions_updated_at ON public.divine_transmissions;
CREATE TRIGGER set_divine_transmissions_updated_at
  BEFORE UPDATE ON public.divine_transmissions
  FOR EACH ROW EXECUTE FUNCTION public.update_divine_transmissions_updated_at();
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[MIGRATION] Running divine_transmissions migration for admin ${user.id}`);

    const { Client } = await import("https://deno.land/x/postgres@v0.17.0/mod.ts");

    let dbUrl = Deno.env.get("DATABASE_URL");
    if (!dbUrl) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
      const dbPassword = Deno.env.get("SUPABASE_DB_PASSWORD");
      const projectRef = supabaseUrl.replace("https://", "").replace(".supabase.co", "");
      if (dbPassword) {
        dbUrl = `postgresql://postgres.${projectRef}:${dbPassword}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;
      } else {
        throw new Error("DATABASE_URL or SUPABASE_DB_PASSWORD must be set");
      }
    }

    const client = new Client(dbUrl);
    try {
      await client.connect();

      const statements = MIGRATION_SQL
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s && !s.startsWith("--"));

      await client.queryArray("BEGIN");
      for (const stmt of statements) {
        if (!stmt) continue;
        const clean = stmt
          .split("\n")
          .map((l: string) => { const ci = l.indexOf("--"); return ci >= 0 ? l.substring(0, ci).trim() : l.trim(); })
          .filter((l: string) => l)
          .join(" ");
        if (clean) await client.queryArray(clean);
      }
      await client.queryArray("COMMIT");
      console.log("[MIGRATION] divine_transmissions table created successfully");
    } finally {
      await client.end();
    }

    return new Response(
      JSON.stringify({ success: true, message: "divine_transmissions table created" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[MIGRATION] Error:", msg);
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
