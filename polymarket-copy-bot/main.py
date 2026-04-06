"""
SQI-2050 Polymarket Copy-Trading Bot
=====================================
Sovereign abundance infrastructure — run on your own VPS (US-East recommended).

Usage:
    python main.py

Modules:
    listener.py   — On-chain ear (web3.py, Polygon RPC)
    matcher.py    — Market logic (Gamma API + CLOB price)
    executor.py   — Trade execution (py-clob-client)
    logger.py     — Real-time logging
"""

import asyncio
import os

from dotenv import load_dotenv

load_dotenv()

from listener import WhaleListener
from matcher import MarketMatcher
from executor import TradeExecutor
from logger import setup_logger

log = setup_logger("SQI-BOT")


async def main():
    log.info("⚡ SQI-2050 Polymarket Bot — INITIALIZING")
    log.info("🌊 Connecting to Polygon network...")

    matcher = MarketMatcher()
    executor = TradeExecutor()
    listener = WhaleListener(on_trade_callback=handle_whale_trade)

    listener.matcher = matcher
    listener.executor = executor

    log.info("👁️  Whale wallets locked. Listening for Smart Money movements...")
    await listener.start()


async def handle_whale_trade(event: dict):
    """
    Central callback — fires every time a monitored whale trades.
    """
    log_h = setup_logger("HANDLER")
    log_h.info(
        f"🐋 Whale {event['whale'][:8]}... | {event['side']} | "
        f"TokenID: {event['token_id'][:12]}..."
    )

    matcher = event["_matcher"]
    executor = event["_executor"]

    market = await matcher.resolve_market(event["token_id"])
    if not market:
        log_h.warning("⚠️  Market not found in Gamma API. Skipping.")
        return

    log_h.info(
        f"📊 Market: '{market['question']}' | Current Price: ${market['current_price']:.4f}"
    )

    if event["side"] != "BUY":
        log_h.info("🔁 Whale SOLD. Bot is configured to copy BUY only. Skipping.")
        return

    whale_price = event.get("whale_price", market["current_price"])
    price_delta = (market["current_price"] - whale_price) / max(whale_price, 0.001)

    if price_delta > 0.02:
        log_h.warning(
            f"🚨 SLIPPAGE TOO HIGH: Whale entered ${whale_price:.4f}, "
            f"current ${market['current_price']:.4f} "
            f"({price_delta*100:.1f}% drift). SKIPPING."
        )
        return

    usdc = float(os.getenv("FIXED_USDC_PER_TRADE", "10.0"))

    await executor.place_order(
        token_id=market["token_id"],
        side="BUY",
        usdc_amount=usdc,
        current_price=market["current_price"],
        market_name=market["question"],
    )


if __name__ == "__main__":
    asyncio.run(main())
