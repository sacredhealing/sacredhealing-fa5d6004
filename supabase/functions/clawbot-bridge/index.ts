// Relays Hetzner CLAWBOT worker traffic into this project's real tables,
// using this project's own service_role key (never exposed to Hetzner).
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const BRIDGE_SECRET = Deno.env.get('CLAWBOT_BRIDGE_SECRET') || 'clawbot-bridge-2026';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'apikey, authorization, content-type, prefer, x-client-info',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const incomingKey = req.headers.get('apikey') || '';
  if (incomingKey !== BRIDGE_SECRET) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(req.url);
  const parts = url.pathname.split('/').filter(Boolean);
  const table = parts[parts.length - 1];
  if (!table || table === 'clawbot-bridge') {
    return new Response(JSON.stringify({ error: 'no table specified' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const target = `${SUPABASE_URL}/rest/v1/${table}${url.search}`;
  const headers: Record<string, string> = {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
  };
  const clientPrefer = req.headers.get('prefer');
  if (clientPrefer) headers['Prefer'] = clientPrefer;
  else if (req.method === 'POST') headers['Prefer'] = 'return=minimal';

  const body = (req.method === 'POST' || req.method === 'PATCH')
    ? await req.text()
    : undefined;

  const res = await fetch(target, { method: req.method, headers, body });
  const text = await res.text();
  return new Response(text, {
    status: res.status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
