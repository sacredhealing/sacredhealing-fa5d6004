import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

  const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
  const { table, offset = 0, limit = 500 } = body;

  // Mode 1: list all tables
  if (!table) {
    const { data } = await supabase.rpc("get_public_tables").catch(() => ({ data: null }));
    let tables: string[] = [];
    if (data) {
      tables = data.map((t: any) => t.table_name);
    } else {
      const res = await supabase.from("information_schema.tables" as any)
        .select("table_name")
        .eq("table_schema", "public")
        .eq("table_type", "BASE TABLE");
      tables = (res.data || []).map((r: any) => r.table_name);
    }
    const counts: any = {};
    for (const t of tables) {
      const { count } = await supabase.from(t).select("*", { count: "exact", head: true });
      counts[t] = count ?? 0;
    }
    return new Response(JSON.stringify({ tables: counts }), {
      headers: { ...cors, "Content-Type": "application/json" }
    });
  }

  // Mode 2: export one table with pagination
  const { data, error } = await supabase.from(table).select("*").range(offset, offset + limit - 1);
  return new Response(JSON.stringify({ table, offset, rows: data ?? [], error: error?.message }), {
    headers: { ...cors, "Content-Type": "application/json" }
  });
});
