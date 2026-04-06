"""
matcher.py — The Logic
=======================
Gamma API: conditionId → market. CLOB: live midpoint price.
"""

import asyncio

import aiohttp

from logger import setup_logger

log = setup_logger("MATCHER")

GAMMA_API = "https://gamma-api.polymarket.com"
CLOB_API = "https://clob.polymarket.com"


class MarketMatcher:
    def __init__(self):
        self._cache = {}

    async def resolve_market(self, condition_id: str) -> dict | None:
        if condition_id in self._cache:
            cached = self._cache[condition_id]
            price = await self._fetch_price(cached["token_id"])
            cached["current_price"] = price
            return cached

        try:
            async with aiohttp.ClientSession() as session:
                url = f"{GAMMA_API}/markets?conditionId={condition_id}&limit=1"
                async with session.get(url, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                    if resp.status != 200:
                        log.warning(f"Gamma API returned {resp.status} for {condition_id[:12]}...")
                        return None

                    data = await resp.json()
                    markets = data if isinstance(data, list) else data.get("markets", [])

                    if not markets:
                        log.warning(f"No market found for conditionId {condition_id[:12]}...")
                        return None

                    market = markets[0]
                    question = market.get("question", "Unknown Market")
                    tokens = market.get("clobTokenIds", [])
                    yes_token = tokens[0] if tokens else condition_id

                    log.info(f"✅ Resolved: '{question}' | YES token: {str(yes_token)[:12]}...")

                    price = await self._fetch_price(yes_token)

                    result = {
                        "question": question,
                        "market_id": market.get("id", ""),
                        "token_id": yes_token,
                        "current_price": price,
                    }

                    self._cache[condition_id] = result
                    return result

        except asyncio.TimeoutError:
            log.error("⏱️  Gamma API timeout.")
            return None
        except Exception as e:
            log.error(f"Matcher error: {e}")
            return None

    async def _fetch_price(self, token_id: str) -> float:
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{CLOB_API}/midpoint?token_id={token_id}"
                async with session.get(url, timeout=aiohttp.ClientTimeout(total=5)) as resp:
                    if resp.status != 200:
                        return 0.5

                    data = await resp.json()
                    price = float(data.get("mid", 0.5))
                    log.info(f"💲 Live CLOB price for {str(token_id)[:12]}...: ${price:.4f}")
                    return price

        except Exception as e:
            log.warning(f"Price fetch failed: {e} — using fallback 0.5")
            return 0.5

    async def calculate_alpha(self, token_id: str, entry_price: float) -> dict:
        current_price = await self._fetch_price(token_id)
        edge = current_price - entry_price
        alpha_score = round(edge / max(entry_price, 0.001), 4)

        return {
            "entry_price": entry_price,
            "current_price": current_price,
            "edge": round(edge, 4),
            "alpha_score": alpha_score,
            "signal": "STRONG"
            if alpha_score > 0.05
            else "WEAK"
            if alpha_score > 0
            else "NEGATIVE",
        }
