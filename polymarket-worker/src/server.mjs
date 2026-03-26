/**
 * Polymarket bot — headless worker (24/7 on Railway).
 *
 * The browser UI lives in: ../src/pages/income-streams/PolymarketBotDetail.tsx
 * Strategy engines live in: ../src/services/polymarket/ and polymarketTrading.ts
 *
 * Next step: extract those modules into a shared package or copy the service layer
 * here and run the same scan/execute loop without React.
 */

import 'dotenv/config';
import express from 'express';
import { ethers } from 'ethers';

const PORT = Number(process.env.PORT || 8080);
const PAPER_MODE = String(process.env.PAPER_MODE ?? 'true').toLowerCase() === 'true';

const rpcPool = [
  process.env.POLYGON_RPC_URL,
  process.env.POLYGON_RPC_URL_2,
  process.env.POLYGON_RPC_URL_3,
].filter(Boolean);

const app = express();
app.use(express.json());

let heartbeat = { startedAt: new Date().toISOString(), ticks: 0, lastRpcOk: null, address: null };

async function pingRpc() {
  if (rpcPool.length === 0) {
    heartbeat.lastRpcOk = false;
    return;
  }
  const url = rpcPool[0];
  try {
    const provider = new ethers.JsonRpcProvider(url, undefined, { staticNetwork: true });
    await provider.getBlockNumber();
    heartbeat.lastRpcOk = true;
  } catch (e) {
    console.error('[worker] RPC ping failed:', e?.message || e);
    heartbeat.lastRpcOk = false;
  }
}

function maybeLoadWallet() {
  const pk = process.env.BOT_PRIVATE_KEY;
  if (!pk || !/^0x[a-fA-F0-9]{64}$/.test(pk.trim())) {
    heartbeat.address = null;
    return;
  }
  try {
    const w = new ethers.Wallet(pk.trim());
    heartbeat.address = w.address;
  } catch {
    heartbeat.address = null;
  }
}

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'polymarket-worker',
    paperMode: PAPER_MODE,
    rpcConfigured: rpcPool.length > 0,
    walletConfigured: Boolean(heartbeat.address),
    heartbeat,
  });
});

app.get('/', (_req, res) => {
  res.type('text').send(
    'Sacred Healing Polymarket worker — use GET /health. Strategies still run in-app until ported from src/services/polymarket/.\n'
  );
});

async function main() {
  maybeLoadWallet();
  await pingRpc();

  setInterval(() => {
    heartbeat.ticks += 1;
    pingRpc().catch(() => {});
  }, 60_000);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[polymarket-worker] listening on ${PORT} paperMode=${PAPER_MODE} rpc=${rpcPool.length > 0} wallet=${Boolean(heartbeat.address)}`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
