const https = require('https');
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeWd1a2ZkYnRlaHZ0bmRhbmRuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxNTY5MzI5MCwiZXhwIjoyMDMxMjY5MjkwfQ.4puWuECKMNz_JGby8eSFMIMUUEQfBb2nFgCbanMTEno';
const url = 'https://ssygukfdbtehvtndandn.supabase.co/rest/v1/shreem_brzee_live_trades?select=label,pnl_sol,pnl_pct,closed_at&status=eq.closed&order=closed_at.desc&limit=200';
const opts = {
  hostname: 'ssygukfdbtehvtndandn.supabase.co',
  path: '/rest/v1/shreem_brzee_live_trades?select=label,pnl_sol,pnl_pct,closed_at&status=eq.closed&order=closed_at.desc&limit=200',
  headers: { apikey: KEY, Authorization: 'Bearer ' + KEY }
};
https.get(opts, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const trades = JSON.parse(d);
    const since = new Date(Date.now() - 24*3600*1000);
    const today = trades.filter(t => new Date(t.closed_at) > since);
    const s = {};
    today.forEach(t => {
      const l = t.label || 'UNKNOWN';
      if (!s[l]) s[l] = {n:0, pnl:0, w:0};
      s[l].n++;
      const p = parseFloat(t.pnl_sol || 0);
      s[l].pnl += p;
      if (p > 0) s[l].w++;
    });
    console.log('=== Last 24h by whale ===');
    Object.entries(s).sort((a,b) => b[1].pnl - a[1].pnl).forEach(([l,v]) => {
      console.log(l + ': ' + v.n + ' trades ' + v.w + 'W/' + (v.n-v.w) + 'L PnL=' + v.pnl.toFixed(5) + ' SOL');
    });
    console.log('Total trades today:', today.length);
  });
});
