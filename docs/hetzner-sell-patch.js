// ============================================================
// HETZNER BOT — SELL Signal Detection Patch
// File location: /root/clawbot/src/webhookHandler.js
//   (or wherever your Helius webhook POST is handled)
//
// WHAT THIS ADDS:
//   When a tracked whale SELLS a token (sends token + receives SOL),
//   this writes action='SELL' to shreem_brzee_signals in Supabase.
//   The frontend already listens for this and auto-closes matching positions.
//
// HOW TO APPLY:
//   1. SSH into Hetzner: ssh root@178.105.183.74
//   2. cd /root/clawbot
//   3. cat src/webhookHandler.js  (find the existing processTransaction fn)
//   4. Add the SELL block below inside your existing transaction loop
//   5. pm2 restart clawbot
// ============================================================

// ── Find your existing webhook handler and add this inside the tx loop ────────
//
// Your existing code structure is something like:
//
//   app.post('/helius-webhook', async (req, res) => {
//     const transactions = req.body;
//     for (const tx of transactions) {
//       // ... existing BUY detection ...
//     }
//   });
//
// ADD THE BLOCK BELOW inside that for loop, after your BUY detection:

async function detectAndRecordSell(tx, supabase, trackedWallets) {
  const tokenTransfers  = tx.tokenTransfers  || [];
  const nativeTransfers = tx.nativeTransfers || [];

  for (const transfer of tokenTransfers) {
    const fromWallet = transfer.fromUserAccount;
    const mint       = transfer.mint;

    if (!fromWallet || !mint) continue;

    // Is this FROM a wallet we track?
    const trackedEntry = trackedWallets.find(w =>
      w.address?.toLowerCase() === fromWallet.toLowerCase()
    );
    if (!trackedEntry) continue;

    // Confirm it's a SELL (swap), not just a send:
    // tracked wallet must also receive SOL in the same tx
    const solReceived = nativeTransfers
      .filter(nt => nt.toUserAccount?.toLowerCase() === fromWallet.toLowerCase())
      .reduce((sum, nt) => sum + (nt.amount || 0), 0);

    if (solReceived < 1_000_000) continue; // < 0.001 SOL → not a sell, just a transfer

    const solAmount = solReceived / 1e9; // lamports → SOL

    console.log(
      `[SELL DETECTED] ${trackedEntry.label} sold ${mint}`,
      `| received ${solAmount.toFixed(4)} SOL`
    );

    // Write SELL signal — same table the frontend watches
    const { error } = await supabase
      .from('shreem_brzee_signals')
      .insert({
        sig:        tx.signature,
        wallet:     fromWallet,
        label:      trackedEntry.label,
        mint:       mint,
        symbol:     transfer.symbol || mint.slice(0, 6),
        action:     'SELL',          // ← frontend listens for this
        amount_sol: solAmount,
        source:     'helius_webhook',
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('[SELL signal DB error]', error.message);
    } else {
      console.log(`[SELL signal saved] ${trackedEntry.label} → ${mint}`);
    }
  }
}

// ── Also add the test-sell endpoint if not already present ───────────────────
// This lets the "⚡ SELL Signal" button on the frontend work:

/*
  app.post('/test-sell', async (req, res) => {
    try {
      // Insert a fake SELL signal for POPCAT (same token as test-buy)
      const POPCAT_MINT = 'A98UDy7z8MfmWnTQt6cKjje7UfqV3pTLf4yEbuwL2Hn';
      const sig = 'TEST_SELL_' + Date.now();
      
      const { error } = await supabase
        .from('shreem_brzee_signals')
        .insert({
          sig,
          wallet: 'Fp1npp7sCi5h26oTrPg23dGRXLnZSL3wcsoyVMquVMaB', // Euris
          label:  'Euris',
          mint:   POPCAT_MINT,
          symbol: 'POPCAT',
          action: 'SELL',
          amount_sol: 1.5,
          source: 'test',
          created_at: new Date().toISOString(),
        });
      
      if (error) throw error;
      res.json({ ok: true, sig });
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });
*/

// ── Usage in your main webhook handler ────────────────────────────────────────
/*
  // At top of file, load tracked wallets once (or refresh periodically):
  let cachedTrackedWallets = [];
  
  async function refreshTrackedWallets() {
    const { data } = await supabase.from('tracked_whales').select('address, label');
    if (data) cachedTrackedWallets = data;
  }
  refreshTrackedWallets();
  setInterval(refreshTrackedWallets, 60_000); // refresh every minute
  
  // In your webhook POST handler:
  app.post('/helius-webhook', async (req, res) => {
    const transactions = Array.isArray(req.body) ? req.body : [req.body];
    
    for (const tx of transactions) {
      // ... your existing BUY detection code ...
      
      // ADD: SELL detection
      await detectAndRecordSell(tx, supabase, cachedTrackedWallets);
    }
    
    res.json({ ok: true });
  });
*/
