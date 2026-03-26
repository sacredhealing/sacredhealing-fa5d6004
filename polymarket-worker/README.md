# Polymarket headless worker (24/7)

This is **separate** from `railway-worker/`, which is the **Python meditation audio** API (Flask).

## Why this exists

The Polymarket UI in the app (`src/pages/income-streams/PolymarketBotDetail.tsx`) runs strategies in the **browser**. For 24/7 operation without a tab open, the same logic must run on a **server**. This folder is the deploy target on Railway (or any Node host).

## Operational order (recommended)

1. Run **paper mode** in the app for several days; observe signals and behavior.
2. Add a **fast private Polygon RPC** (Alchemy / Infura / QuickNode). In the web app use `VITE_RPC_URL_*` in `.env.local`; in this worker use `POLYGON_RPC_URL` in Railway Variables.
3. Go **live** only with small size (e.g. USDC.e on Polygon); keep risk limits in mind.
4. Deploy **this worker** and port the strategy loop from `src/services/polymarket/` into Node here (or extract a shared npm package). Until that port is done, this process **health-checks RPC** and exposes `/health`.

## Environment variables

See `env.example`. Set secrets only in Railway (never commit).

- `POLYGON_RPC_URL` — primary Polygon HTTPS RPC.
- `BOT_PRIVATE_KEY` — optional for future live signing; keep unset until strategies are wired server-side.
- `PAPER_MODE` — default `true`.

## Local run

```bash
cd polymarket-worker
cp env.example .env
# edit .env
npm install
npm run dev
```

## Railway

- New service from this repo, **root directory** `polymarket-worker`, Dockerfile build, or `npm start` with Node 20.
- Set `PORT` if the platform assigns one (Railway usually injects `PORT`).

## Next implementation step

Copy or factor `src/services/polymarket/*`, `polymarketTrading.ts`, and related services into this package (or a `packages/polymarket-core` workspace), replace browser storage with env + secrets, and run the same intervals as the React `useEffect` loops.
