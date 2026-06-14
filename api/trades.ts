export const config = { runtime: 'edge' };

const SUPABASE_URL = 'https://ssygukfdbtehvtndandn.supabase.co';
const SK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqZHpocmRwaW94ZGV5eWZvZ2VwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDczMTk0NSwiZXhwIjoyMDYwMzA3OTQ1fQ.supabase-service-role-placeholder';

export default async function handler(req: Request) {
  const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
  try {
    // Use NEW_SERVICE_ROLE from Vercel env
    const key = process.env.NEW_SERVICE_ROLE || process.env.SUPABASE_SERVICE_KEY || '';
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/delta_arb_trades?select=id,asset,signal,delta,size_usd,entry_price,status,pnl_usdc,created_at&order=created_at.desc&limit=200`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } }
    );
    const data = await r.json();
    return new Response(JSON.stringify(Array.isArray(data) ? data : []), { headers });
  } catch (e) {
    return new Response('[]', { headers });
  }
}
