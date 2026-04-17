"""
SQI-2050 Polyclaw Bot — News Edge Scanner + Arbitrage
======================================================
Based on the ShiestyFinance / OpenClaw Polyclaw strategy.

Strategy:
  1. Monitor 5-minute BTC/ETH Polymarket markets for YES+NO < $1.00 (arbitrage)
  2. Scan breaking news → match to active markets → estimate probability shift
  3. Kelly Criterion sizing — risk only what the edge justifies
  4. Place orders via py-clob-client on Polygon CLOB

Run:
    python polyclaw_bot.py

Env vars (same .env as main.py):
    POLYGON_RPC_URL, POLY_API_KEY, POLY_API_SECRET, POLY_API_PASSPHRASE,
    WALLET_PRIVATE_KEY, PAPER_MODE (true/false), RISK_PCT (default 0.05)
"""

import asyncio
import os
import json
import time
import aiohttp
from dotenv import load_dotenv
from logger import setup_logger

load_dotenv()

log = setup_logger("POLYCLAW")

# ─── Config ──────────────────────────────────────────────────────────────────
PAPER_MODE       = os.getenv("PAPER_MODE", "true").lower() == "true"
RISK_PCT         = float(os.getenv("RISK_PCT", "0.05"))        # 5% of balance
MIN_TRADE        = float(os.getenv("MIN_TRADE_USDC", "0.50"))  # €0.50 minimum
MAX_TRADE        = float(os.getenv("MAX_TRADE_USDC", "50.0"))  # €50 max
SCAN_INTERVAL    = int(os.getenv("SCAN_INTERVAL_S", "15"))     # scan every 15s
ARB_THRESHOLD    = float(os.getenv("ARB_THRESHOLD", "0.97"))   # YES+NO < 0.97
NEWS_EDGE_MIN    = float(os.getenv("NEWS_EDGE_MIN", "0.04"))   # 4% probability shift min
KELLY_FRACTION   = float(os.getenv("KELLY_FRACTION", "0.25")) # quarter-Kelly (safer)

GAMMA_API        = "https://gamma-api.polymarket.com"
CLOB_API         = "https://clob.polymarket.com"

# News sources — free RSS feeds, no API key needed
NEWS_FEEDS = [
    "https://feeds.reuters.com/reuters/businessNews",
    "https://feeds.bbci.co.uk/news/business/rss.xml",
    "https://rss.cnn.com/rss/money_latest.rss",
    "https://feeds.a.dj.com/rss/RSSMarketsMain.xml",  # WSJ Markets
    "https://cryptopanic.com/api/v1/posts/?auth_token=pub_free&kind=news",
]

# ─── Paper trading ledger ─────────────────────────────────────────────────────
class PaperLedger:
    def __init__(self, starting_balance=10.0):
        self.balance     = starting_balance
        self.trades      = []
        self.wins        = 0
        self.losses      = 0
        self.total_fees  = 0.0

    def record_trade(self, market_q, direction, size, price, strategy):
        fee = size * 0.0005  # 0.05% taker fee
        cost = size + fee if direction == "BUY" else fee
        if cost > self.balance:
            log.warning(f"Insufficient paper balance €{self.balance:.2f}, need €{cost:.2f}")
            return False
        self.balance    -= cost
        self.total_fees += fee
        self.trades.append({
            "time":     time.strftime("%H:%M:%S"),
            "market":   market_q[:50],
            "dir":      direction,
            "size":     size,
            "price":    price,
            "fee":      fee,
            "strategy": strategy,
            "status":   "OPEN",
        })
        log.info(
            f"📝 PAPER {direction} €{size:.2f} @ {price:.3f} | "
            f"fee €{fee:.4f} | balance €{self.balance:.2f} | "
            f"strategy: {strategy}"
        )
        return True

    def summary(self):
        return {
            "balance":     round(self.balance, 2),
            "trades":      len(self.trades),
            "total_fees":  round(self.total_fees, 4),
            "open":        sum(1 for t in self.trades if t["status"] == "OPEN"),
        }


ledger = PaperLedger(starting_balance=10.0)

# ─── Kelly Criterion sizing ───────────────────────────────────────────────────
def kelly_size(balance: float, win_prob: float, win_payout: float = 1.0) -> float:
    """
    Quarter-Kelly for safety.
    win_prob: estimated probability of winning (0-1)
    win_payout: net payout on win (e.g. 0.43 if buying YES at 0.70 → payout is 0.43/0.70)
    """
    if win_prob <= 0 or win_payout <= 0:
        return 0.0
    lose_prob = 1 - win_prob
    # Full Kelly = (win_prob * win_payout - lose_prob) / win_payout
    full_kelly = (win_prob * win_payout - lose_prob) / win_payout
    if full_kelly <= 0:
        return 0.0
    quarter_kelly = full_kelly * KELLY_FRACTION
    raw_size = balance * quarter_kelly
    return round(min(MAX_TRADE, max(MIN_TRADE, raw_size)), 2)


# ─── Polymarket API helpers ───────────────────────────────────────────────────
async def fetch_markets(session: aiohttp.ClientSession, limit=100) -> list:
    """Fetch active markets from Gamma API."""
    try:
        url = f"{GAMMA_API}/markets?limit={limit}&active=true&closed=false"
        async with session.get(url, timeout=aiohttp.ClientTimeout(total=10)) as r:
            if r.status != 200:
                return []
            data = await r.json()
            markets = []
            for m in data:
                try:
                    outcome_names  = json.loads(m.get("outcomes", '["Yes","No"]'))
                    outcome_prices = json.loads(m.get("outcomePrices", '[0.5,0.5]'))
                    token_ids      = json.loads(m.get("clobTokenIds", '["",""]'))
                    markets.append({
                        "id":        m["id"],
                        "question":  m.get("question", ""),
                        "slug":      m.get("slug", ""),
                        "liquidity": float(m.get("liquidity", 0)),
                        "volume":    float(m.get("volume", 0)),
                        "end_date":  m.get("endDate", ""),
                        "outcomes": [
                            {
                                "name":    outcome_names[i],
                                "price":   float(outcome_prices[i]),
                                "tokenId": token_ids[i] if i < len(token_ids) else "",
                            }
                            for i in range(len(outcome_names))
                        ],
                    })
                except Exception:
                    continue
            return markets
    except Exception as e:
        log.error(f"Market fetch error: {e}")
        return []


async def fetch_news_headlines(session: aiohttp.ClientSession) -> list[str]:
    """Fetch recent headlines from free RSS feeds."""
    headlines = []
    for feed_url in NEWS_FEEDS[:3]:  # limit to 3 feeds to avoid rate limits
        try:
            async with session.get(feed_url, timeout=aiohttp.ClientTimeout(total=8)) as r:
                if r.status != 200:
                    continue
                text = await r.text()
                # Simple regex to extract titles from RSS
                import re
                titles = re.findall(r'<title><!\[CDATA\[(.+?)\]\]></title>', text)
                if not titles:
                    titles = re.findall(r'<title>(.+?)</title>', text)[1:15]  # skip feed title
                headlines.extend(titles[:10])
        except Exception:
            continue
    return headlines[:30]  # max 30 headlines per cycle


# ─── STRATEGY 1: Pure Arbitrage (YES + NO < $1.00) ──────────────────────────
def find_arbitrage_opportunities(markets: list) -> list:
    """
    Find markets where YES price + NO price < $1.00.
    Buying both sides guarantees $1.00 at resolution → pure profit.
    """
    opportunities = []

    for market in markets:
        if market["liquidity"] < 1000:  # skip illiquid markets
            continue
        outcomes = market["outcomes"]
        if len(outcomes) < 2:
            continue

        yes = next((o for o in outcomes if o["name"].lower() == "yes"), None)
        no  = next((o for o in outcomes if o["name"].lower() == "no"), None)
        if not yes or not no:
            continue

        combined = yes["price"] + no["price"]
        spread   = 1.0 - combined

        if combined < ARB_THRESHOLD:
            profit_pct = (spread / combined) * 100
            opportunities.append({
                "market_id":   market["id"],
                "question":    market["question"],
                "yes_price":   yes["price"],
                "no_price":    no["price"],
                "yes_token":   yes["tokenId"],
                "no_token":    no["tokenId"],
                "combined":    combined,
                "spread":      spread,
                "profit_pct":  profit_pct,
                "liquidity":   market["liquidity"],
                "strategy":    "arbitrage",
            })

    # Sort by largest spread first
    opportunities.sort(key=lambda x: x["spread"], reverse=True)
    return opportunities[:5]  # top 5 only


# ─── STRATEGY 2: News Edge Scanner ───────────────────────────────────────────
def match_news_to_markets(headlines: list[str], markets: list) -> list:
    """
    Match breaking news headlines to active markets.
    Estimate probability shift using keyword matching.
    Returns signals with Kelly-sized positions.
    """
    signals = []
    processed = set()

    # Keyword → market impact mapping
    BULLISH_KEYWORDS = {
        "wins", "victory", "elected", "approved", "passes", "confirmed",
        "beats", "rises", "surge", "rally", "higher", "gain", "agreement",
        "deal", "ceasefire", "peace", "positive", "breakthrough", "record"
    }
    BEARISH_KEYWORDS = {
        "loses", "defeat", "rejected", "fails", "denied", "drops", "crash",
        "falls", "lower", "loss", "ban", "arrested", "resigned", "crisis",
        "war", "attack", "negative", "collapse", "default", "sanctions"
    }

    for headline in headlines:
        headline_lower = headline.lower()
        headline_words = set(headline_lower.split())

        # Determine sentiment
        bullish_hits = len(headline_words & BULLISH_KEYWORDS)
        bearish_hits = len(headline_words & BEARISH_KEYWORDS)

        if bullish_hits == 0 and bearish_hits == 0:
            continue

        sentiment = "bullish" if bullish_hits > bearish_hits else "bearish"

        # Match to markets by keyword overlap
        for market in markets:
            if market["liquidity"] < 5000:
                continue

            question_words = set(market["question"].lower().split())
            overlap = len(headline_words & question_words)

            if overlap < 2:  # need at least 2 words in common
                continue

            sig_id = f"{market['id']}-{headline[:30]}"
            if sig_id in processed:
                continue
            processed.add(sig_id)

            # Estimate probability shift (rough — 2-8% based on overlap strength)
            p_shift = min(0.08, overlap * 0.02)

            if p_shift < NEWS_EDGE_MIN:
                continue

            yes = next((o for o in market["outcomes"] if o["name"].lower() == "yes"), None)
            no  = next((o for o in market["outcomes"] if o["name"].lower() == "no"), None)
            if not yes or not no:
                continue

            # Direction: bullish news → buy YES, bearish → buy NO
            if sentiment == "bullish":
                target_outcome = yes
                new_prob = min(0.95, yes["price"] + p_shift)
            else:
                target_outcome = no
                new_prob = min(0.95, no["price"] + p_shift)

            current_price = target_outcome["price"]
            if current_price <= 0 or current_price >= 1:
                continue

            # Kelly sizing
            win_payout = (1.0 - current_price) / current_price
            size = kelly_size(ledger.balance, new_prob, win_payout)

            if size < MIN_TRADE:
                continue

            signals.append({
                "market_id":  market["id"],
                "question":   market["question"],
                "headline":   headline[:80],
                "sentiment":  sentiment,
                "outcome":    target_outcome["name"],
                "token_id":   target_outcome["tokenId"],
                "price":      current_price,
                "new_prob":   new_prob,
                "p_shift":    p_shift,
                "kelly_size": size,
                "strategy":   "news_edge",
            })

    signals.sort(key=lambda x: x["p_shift"], reverse=True)
    return signals[:3]  # max 3 news signals per cycle


# ─── STRATEGY 3: 5-min BTC/ETH Market Scanner ──────────────────────────────
def find_5min_opportunities(markets: list) -> list:
    """
    Find 5-minute BTC/ETH markets — Polyclaw's core strategy.
    These resolve quickly so capital recycles fast.
    """
    opportunities = []

    keywords = ["5-minute", "5 minute", "5min", "btc", "eth", "bitcoin", "ethereum"]

    for market in markets:
        q_lower = market["question"].lower()
        if not any(kw in q_lower for kw in keywords):
            continue
        if market["liquidity"] < 500:
            continue

        yes = next((o for o in market["outcomes"] if o["name"].lower() == "yes"), None)
        no  = next((o for o in market["outcomes"] if o["name"].lower() == "no"), None)
        if not yes or not no:
            continue

        combined = yes["price"] + no["price"]

        # Only trade if one side is significantly mispriced (>5% from 50/50)
        imbalance = abs(yes["price"] - 0.5)
        if imbalance < 0.05:
            continue

        # Trade the side closer to fair value (mean reversion)
        if yes["price"] < 0.45:  # YES looks cheap
            target, price = yes, yes["price"]
            win_prob = 0.50  # expect reversion to 50%
        elif no["price"] < 0.45:   # NO looks cheap
            target, price = no, no["price"]
            win_prob = 0.50
        else:
            continue

        win_payout = (1.0 - price) / price
        size = kelly_size(ledger.balance, win_prob, win_payout)

        if size < MIN_TRADE:
            continue

        opportunities.append({
            "market_id":  market["id"],
            "question":   market["question"],
            "outcome":    target["name"],
            "token_id":   target["tokenId"],
            "price":      price,
            "combined":   combined,
            "imbalance":  imbalance,
            "kelly_size": size,
            "strategy":   "5min_reversion",
        })

    opportunities.sort(key=lambda x: x["imbalance"], reverse=True)
    return opportunities[:3]


# ─── Execute trade (paper or live) ───────────────────────────────────────────
async def execute_trade(session, signal: dict, size: float):
    """Route to paper or live execution."""

    if PAPER_MODE:
        return ledger.record_trade(
            market_q  = signal.get("question", signal.get("market_id", "")),
            direction = "BUY",
            size      = size,
            price     = signal.get("price", signal.get("yes_price", 0.5)),
            strategy  = signal.get("strategy", "unknown"),
        )
    else:
        # Live execution via py-clob-client
        try:
            from py_clob_client.client import ClobClient
            from py_clob_client.clob_types import OrderArgs, OrderType
            from py_clob_client.order_builder.constants import BUY

            client = ClobClient(
                host     = "https://clob.polymarket.com",
                chain_id = 137,
                key      = os.getenv("WALLET_PRIVATE_KEY", ""),
                creds    = {
                    "apiKey":      os.getenv("POLY_API_KEY", ""),
                    "secret":      os.getenv("POLY_API_SECRET", ""),
                    "passphrase":  os.getenv("POLY_API_PASSPHRASE", ""),
                },
            )

            price    = signal.get("price", signal.get("yes_price", 0.5))
            token_id = signal.get("token_id", signal.get("yes_token", ""))
            quantity = round(size / price, 2)

            order_args   = OrderArgs(token_id=token_id, price=price, size=quantity, side=BUY)
            signed_order = client.create_order(order_args)
            response     = client.post_order(signed_order, OrderType.GTC)

            if response and response.get("success"):
                log.info(f"✅ LIVE ORDER | {signal['question'][:50]} | €{size:.2f} @ {price:.3f} | ID: {response.get('orderID')}")
                return True
            else:
                log.error(f"❌ Live order failed: {response}")
                return False

        except Exception as e:
            log.error(f"❌ Execution error: {e}")
            return False


# ─── Main scan loop ───────────────────────────────────────────────────────────
async def run():
    log.info("═══════════════════════════════════════════════")
    log.info("SQI-2050 POLYCLAW BOT — Polymarket Edge Scanner")
    log.info(f"Mode: {'PAPER 📝' if PAPER_MODE else 'LIVE 💰'} | Risk: {RISK_PCT*100:.0f}% | Kelly: {KELLY_FRACTION*100:.0f}%")
    log.info("Strategies: Arbitrage + News Edge + 5min Reversion")
    log.info("═══════════════════════════════════════════════")

    async with aiohttp.ClientSession() as session:
        scan_count = 0

        while True:
            scan_count += 1
            log.info(f"── Scan #{scan_count} | Balance: €{ledger.balance:.2f} | Trades: {len(ledger.trades)} ──")

            try:
                # Fetch markets and news in parallel
                markets_task  = fetch_markets(session)
                news_task     = fetch_news_headlines(session)
                markets, news = await asyncio.gather(markets_task, news_task)

                log.info(f"Fetched {len(markets)} markets, {len(news)} headlines")

                # ── Strategy 1: Arbitrage ──
                arb_opps = find_arbitrage_opportunities(markets)
                if arb_opps:
                    log.info(f"Found {len(arb_opps)} arbitrage opportunities")
                    for opp in arb_opps[:2]:  # max 2 arb trades per cycle
                        size = kelly_size(ledger.balance, 0.98, opp["spread"] / opp["combined"])
                        size = max(MIN_TRADE, min(size, ledger.balance * RISK_PCT))
                        log.info(
                            f"🎯 ARB | {opp['question'][:60]} | "
                            f"YES {opp['yes_price']:.3f} + NO {opp['no_price']:.3f} = {opp['combined']:.3f} | "
                            f"Spread: {opp['spread']*100:.1f}% | Size: €{size:.2f}"
                        )
                        # Buy YES side of arbitrage
                        yes_signal = {
                            "question": opp["question"],
                            "price":    opp["yes_price"],
                            "token_id": opp["yes_token"],
                            "strategy": "arbitrage_yes",
                        }
                        await execute_trade(session, yes_signal, size / 2)
                        await asyncio.sleep(0.5)
                        # Buy NO side of arbitrage
                        no_signal = {
                            "question": opp["question"],
                            "price":    opp["no_price"],
                            "token_id": opp["no_token"],
                            "strategy": "arbitrage_no",
                        }
                        await execute_trade(session, no_signal, size / 2)
                        await asyncio.sleep(0.5)

                # ── Strategy 2: News Edge ──
                if news:
                    news_signals = match_news_to_markets(news, markets)
                    if news_signals:
                        log.info(f"Found {len(news_signals)} news edge signals")
                        for sig in news_signals:
                            log.info(
                                f"📰 NEWS | {sig['headline'][:60]} | "
                                f"{sig['sentiment'].upper()} | {sig['question'][:50]} | "
                                f"{sig['outcome']} @ {sig['price']:.3f} | "
                                f"Shift: +{sig['p_shift']*100:.1f}% | Kelly: €{sig['kelly_size']:.2f}"
                            )
                            await execute_trade(session, sig, sig["kelly_size"])
                            await asyncio.sleep(0.5)

                # ── Strategy 3: 5-min BTC/ETH ──
                five_min = find_5min_opportunities(markets)
                if five_min:
                    log.info(f"Found {len(five_min)} 5-min opportunities")
                    for sig in five_min:
                        log.info(
                            f"⚡ 5MIN | {sig['question'][:60]} | "
                            f"{sig['outcome']} @ {sig['price']:.3f} | "
                            f"Imbalance: {sig['imbalance']*100:.1f}% | Kelly: €{sig['kelly_size']:.2f}"
                        )
                        await execute_trade(session, sig, sig["kelly_size"])
                        await asyncio.sleep(0.5)

                # Summary every 10 scans
                if scan_count % 10 == 0:
                    s = ledger.summary()
                    log.info(f"📊 SUMMARY | Balance: €{s['balance']} | Trades: {s['trades']} | Open: {s['open']} | Fees: €{s['total_fees']}")

            except Exception as e:
                log.error(f"Scan error: {e}")

            await asyncio.sleep(SCAN_INTERVAL)


if __name__ == "__main__":
    asyncio.run(run())
