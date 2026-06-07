import type { VercelRequest, VercelResponse } from '@vercel/node';

const SUPABASE_URL = 'https://fjdzhrdpioxdeyyfogep.supabase.co';
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/delta_arb_trades?select=id,asset,signal,delta,size_usd,entry_price,status,pnl_usdc,created_at&order=created_at.desc&limit=200`,
      {
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
        },
      }
    );
    const data = await r.json();
    res.status(200).json(Array.isArray(data) ? data : []);
  } catch (e) {
    res.status(200).json([]);
  }
}
