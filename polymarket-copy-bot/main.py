"""
SQI-2050 Copy Bot — Bot 2 + Bot 3 Combined (Railway 24/7)
==========================================================
Bot 2: ShiestyFinance copy-trading (whale on-chain mirror)
Bot 3: Polyclaw arbitrage + news edge + 5-min BTC reversion

Run: python main.py

Env vars:
    POLYGON_RPC_URL         — Alchemy Polygon RPC URL
    POLY_API_KEY            — from get_keys.py
    POLY_API_SECRET         — from get_keys.py
    POLY_API_PASSPHRASE     — from get_keys.py
    WALLET_PRIVATE_KEY      — your 64-char wallet key
    PAPER_MODE              — true (default) | false
    RISK_PCT                — 0.05 (default = 5%)
"""

import asyncio
import os
import json
import time
import re
import aiohttp
from dotenv import load_dotenv

load_dotenv()

from listener import WhaleListener
from matcher import MarketMatcher
from executor import TradeExecutor
from logger import setup_logger

log = setup_logger("SQI-BOT")

# ─── Config ───────────────────────────────────────────────────────────────────
PAPER_MODE = os.getenv("PAPER_MODE", "true").lower() == "true"
RISK_PCT = float(os.getenv("RISK_PCT", "0.05"))
MIN_TRADE = float(os.getenv("MIN_TRADE_USDC", "0.50"))
MAX_TRADE = float(os.getenv("MAX_TRADE_USDC", "50.0"))
SCAN_INTERVAL = int(os.getenv("SCAN_INTERVAL_S", "15"))
GAMMA_API = "https://gamma-api.polymarket.com"

# ─── Balance tracking ─────────────────────────────────────────────────────────
paper_balance = 10.0
trade_count = 0


def calc_size(balance: float) -> float:
    """5% of balance, min €0.50, max €50"""
    raw = balance * RISK_PCT
    return round(min(MAX_TRADE, max(MIN_TRADE, raw)), 2)


# ─── Fetch markets ────────────────────────────────────────────────────────────
async def fetch_markets(session: aiohttp.ClientSession) -> list:
    try:
        url = f"{GAMMA_API}/markets?limit=50&active=true&closed=false"
        async with session.get(url, timeout=aiohttp.ClientTimeout(total=10)) as r:
            if r.status != 200:
                return []
            data = await r.json()
            markets = []
            for m in data:
                try:
                    names = json.loads(m.get("outcomes", '["Yes","No"]'))
                    prices = json.loads(m.get("outcomePrices", '[0.5,0.5]'))
                    token_ids = json.loads(m.get("clobTokenIds", '["",""]'))
                    markets.append(
                        {
                            "id": m["id"],
                            "question": m.get("question", ""),
                            "liquidity": float(m.get("liquidity", 0)),
                            "volume": float(m.get("volume", 0)),
                            "closed": m.get("closed", False),
                            "outcomes": [
                                {
                                    "name": names[i],
                                    "price": float(prices[i]),
                                    "tokenId": token_ids[i] if i < len(token_ids) else "",
                                }
                                for i in range(len(names))
                            ],
                        }
                    )
                except Exception:
                    continue
            return markets
    except Exception as e:
        log.error(f"Market fetch error: {e}")
        return []


# ─── Fetch news headlines ─────────────────────────────────────────────────────
NEWS_FEEDS = [
    "https://feeds.reuters.com/reuters/businessNews",
    "https://feeds.bbci.co.uk/news/business/rss.xml",
    "https://cryptopanic.com/api/v1/posts/?auth_token=pub_free&kind=news",
]


async def fetch_news(session: aiohttp.ClientSession) -> list:
    headlines = []
    for feed in NEWS_FEEDS[:2]:
        try:
            async with session.get(feed, timeout=aiohttp.ClientTimeout(total=8)) as r:
                if r.status != 200:
                    continue
                text = await r.text()
                titles = re.findall(r"<title><!\[CDATA\[(.+?)\]\]></title>", text)
                if not titles:
                    titles = re.findall(r"<title>(.+?)</title>", text)[1:15]
                headlines.extend(titles[:8])
        except Exception:
            continue
    return headlines[:20]


# ─── Arbitrage scanner ────────────────────────────────────────────────────────
def find_arb(markets: list, balance: float) -> list:
    opps = []
    for m in markets:
        if m["liquidity"] < 1000 or m["closed"]:
            continue
        yes = next((o for o in m["outcomes"] if o["name"].lower() == "yes"), None)
        no = next((o for o in m["outcomes"] if o["name"].lower() == "no"), None)
        if not yes or not no:
            continue
        combined = yes["price"] + no["price"]
        if combined < 0.97:
            spread = 1.0 - combined
            size = calc_size(balance)
            opps.append(
                {
                    "question": m["question"],
                    "yes_price": yes["price"],
                    "yes_token": yes["tokenId"],
                    "no_price": no["price"],
                    "no_token": no["tokenId"],
                    "combined": combined,
                    "spread": spread,
                    "size": size,
                    "strategy": "arbitrage",
                }
            )
    return sorted(opps, key=lambda x: x["spread"], reverse=True)[:3]


# ─── News edge scanner ────────────────────────────────────────────────────────
BULLISH = {
    "wins",
    "victory",
    "elected",
    "approved",
    "passes",
    "confirmed",
    "beats",
    "rises",
    "surge",
    "rally",
    "higher",
    "gain",
    "agreement",
    "deal",
    "positive",
}
BEARISH = {
    "loses",
    "defeat",
    "rejected",
    "fails",
    "drops",
    "crash",
    "falls",
    "lower",
    "loss",
    "ban",
    "arrested",
    "resigned",
    "crisis",
    "collapse",
    "sanctions",
}


def find_news_edge(headlines: list, markets: list, balance: float) -> list:
    signals = []
    seen = set()
    for h in headlines:
        words = set(h.lower().split())
        bull = len(words & BULLISH)
        bear = len(words & BEARISH)
        if bull == 0 and bear == 0:
            continue
        sentiment = "bullish" if bull > bear else "bearish"
        for m in markets:
            if m["liquidity"] < 5000 or m["closed"]:
                continue
            overlap = len(words & set(m["question"].lower().split()))
            if overlap < 2:
                continue
            sig_id = f"{m['id']}-{h[:20]}"
            if sig_id in seen:
                continue
            seen.add(sig_id)
            yes = next((o for o in m["outcomes"] if o["name"].lower() == "yes"), None)
            no = next((o for o in m["outcomes"] if o["name"].lower() == "no"), None)
            if not yes or not no:
                continue
            outcome = yes if sentiment == "bullish" else no
            price = outcome["price"]
            if price <= 0 or price >= 1:
                continue
            size = calc_size(balance)
            signals.append(
                {
                    "question": m["question"],
                    "headline": h[:60],
                    "outcome": outcome["name"],
                    "token_id": outcome["tokenId"],
                    "price": price,
                    "size": size,
                    "strategy": "news_edge",
                }
            )
    return sorted(signals, key=lambda x: x["size"], reverse=True)[:3]


# ─── Execute trade ────────────────────────────────────────────────────────────
async def execute(
    market_name: str,
    token_id: str,
    price: float,
    size: float,
    strategy: str,
    executor=None,
):
    global paper_balance, trade_count

    fee = size * 0.0005
    cost = size + fee

    if PAPER_MODE:
        if cost > paper_balance:
            log.warning(f"⚠️  Paper balance €{paper_balance:.2f} < cost €{cost:.2f}")
            return False
        paper_balance -= cost
        trade_count += 1
        log.info(
            f"📝 PAPER BUY | {market_name[:50]} | "
            f"€{size:.2f} @ {price:.3f} | "
            f"strategy: {strategy} | "
            f"balance: €{paper_balance:.2f} | #{trade_count}"
        )
        return True
    else:
        if executor:
            await executor.place_order(
                token_id=token_id,
                side="BUY",
                usdc_amount=size,
                current_price=price,
                market_name=market_name,
            )
            trade_count += 1
            return True
        return False


# ─── Whale copy trading callback ──────────────────────────────────────────────
async def handle_whale_trade(event: dict):
    log.info(
        f"🐋 Whale {event['whale'][:8]}... | " f"{event['side']} | {event['token_id'][:12]}..."
    )

    matcher = event["_matcher"]
    executor = event.get("_executor")

    market = await matcher.resolve_market(event["token_id"])
    if not market:
        log.warning("Market not found, skipping")
        return

    if event["side"] != "BUY":
        log.info("Whale sold — configured to copy BUY only. Skipping.")
        return

    whale_price = event.get("whale_price", market["current_price"])
    price_delta = (market["current_price"] - whale_price) / max(whale_price, 0.001)

    if price_delta > 0.02:
        log.warning(f"Slippage too high ({price_delta*100:.1f}%). Skipping.")
        return

    size = calc_size(paper_balance if PAPER_MODE else 10.0)
    await execute(
        market_name=market["question"],
        token_id=market["token_id"],
        price=market["current_price"],
        size=size,
        strategy="whale_mirror",
        executor=executor if not PAPER_MODE else None,
    )


# ─── Polyclaw scan loop ───────────────────────────────────────────────────────
async def polyclaw_loop(executor=None):
    """Runs Bot 3 strategies: arb + news edge"""
    async with aiohttp.ClientSession() as session:
        scan = 0
        while True:
            scan += 1
            log.info(
                f"── Polyclaw Scan #{scan} | "
                f"Balance: €{paper_balance:.2f} | "
                f"5%: €{calc_size(paper_balance):.2f} ──"
            )
            try:
                markets, news = await asyncio.gather(
                    fetch_markets(session),
                    fetch_news(session),
                )
                log.info(f"Fetched {len(markets)} markets, {len(news)} headlines")

                # Arbitrage
                for opp in find_arb(markets, paper_balance)[:2]:
                    log.info(
                        f"🎯 ARB | {opp['question'][:50]} | "
                        f"YES {opp['yes_price']:.3f} + NO {opp['no_price']:.3f} "
                        f"= {opp['combined']:.3f} | Spread: {opp['spread']*100:.1f}%"
                    )
                    await execute(
                        opp["question"],
                        opp["yes_token"],
                        opp["yes_price"],
                        opp["size"] / 2,
                        "arbitrage_yes",
                        executor,
                    )
                    await asyncio.sleep(0.3)
                    await execute(
                        opp["question"],
                        opp["no_token"],
                        opp["no_price"],
                        opp["size"] / 2,
                        "arbitrage_no",
                        executor,
                    )
                    await asyncio.sleep(0.3)

                # News edge
                for sig in find_news_edge(news, markets, paper_balance):
                    log.info(
                        f"📰 NEWS | {sig['headline']} | "
                        f"{sig['outcome']} @ {sig['price']:.3f} | €{sig['size']:.2f}"
                    )
                    await execute(
                        sig["question"],
                        sig["token_id"],
                        sig["price"],
                        sig["size"],
                        sig["strategy"],
                        executor,
                    )
                    await asyncio.sleep(0.3)

            except Exception as e:
                log.error(f"Polyclaw scan error: {e}")

            await asyncio.sleep(SCAN_INTERVAL)


# ─── Main ─────────────────────────────────────────────────────────────────────
async def main():
    log.info("═══════════════════════════════════════════════════")
    log.info("SQI-2050 Combined Bot 2+3 — Railway Worker")
    log.info(f"Mode: {'PAPER 📝' if PAPER_MODE else 'LIVE 💰'} | Risk: {RISK_PCT*100:.0f}%")
    log.info("Bot 2: Whale Copy-Trading | Bot 3: Arb + News Edge")
    log.info("═══════════════════════════════════════════════════")

    # Setup executor (live only)
    executor = None
    if not PAPER_MODE:
        try:
            executor = TradeExecutor()
            log.info("✅ Live executor ready")
        except Exception as e:
            log.error(f"Executor failed: {e}. Falling back to paper.")

    # Setup whale listener (Bot 2)
    matcher = MarketMatcher()
    listener = WhaleListener(on_trade_callback=handle_whale_trade)
    listener.matcher = matcher
    listener.executor = executor

    log.info("👁️  Whale listener starting...")

    # Run both strategies concurrently
    await asyncio.gather(
        listener.start(),  # Bot 2: whale copy-trading (on-chain)
        polyclaw_loop(executor),  # Bot 3: arb + news edge (API)
    )


if __name__ == "__main__":
    asyncio.run(main())
