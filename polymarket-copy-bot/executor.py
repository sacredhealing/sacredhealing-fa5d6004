"""
executor.py — The Hand
========================
Places copy trades via py-clob-client. Slippage guard is in main.py.
"""

import os

from dotenv import load_dotenv
from py_clob_client.client import ClobClient
from py_clob_client.clob_types import OrderArgs, OrderType
from py_clob_client.order_builder.constants import BUY, SELL

from logger import setup_logger

load_dotenv()

log = setup_logger("EXECUTOR")

API_KEY = os.getenv("POLY_API_KEY", "")
API_SECRET = os.getenv("POLY_API_SECRET", "")
API_PASSPHRASE = os.getenv("POLY_API_PASSPHRASE", "")
WALLET_PK = os.getenv("WALLET_PRIVATE_KEY", "")
CHAIN_ID = 137

FIXED_USDC_PER_TRADE = float(os.getenv("FIXED_USDC_PER_TRADE", "10.0"))


class TradeExecutor:
    def __init__(self):
        if not all([API_KEY, API_SECRET, API_PASSPHRASE, WALLET_PK]):
            raise EnvironmentError(
                "❌ Missing Polymarket credentials. "
                "Set POLY_API_KEY, POLY_API_SECRET, POLY_API_PASSPHRASE, "
                "WALLET_PRIVATE_KEY in your .env file."
            )

        self.client = ClobClient(
            host="https://clob.polymarket.com",
            chain_id=CHAIN_ID,
            key=WALLET_PK,
            creds={
                "apiKey": API_KEY,
                "secret": API_SECRET,
                "passphrase": API_PASSPHRASE,
            },
        )

        log.info("✅ CLOB Client initialized. Ready to execute.")

    async def place_order(
        self,
        token_id: str,
        side: str,
        usdc_amount: float,
        current_price: float,
        market_name: str,
    ):
        if current_price <= 0 or current_price >= 1:
            log.warning(f"⚠️  Invalid price {current_price}. Skipping order.")
            return

        spend = usdc_amount if usdc_amount else FIXED_USDC_PER_TRADE
        quantity = round(spend / current_price, 2)
        clob_side = BUY if side == "BUY" else SELL

        log.info(
            f"📤 PLACING ORDER | {side} | '{market_name}' | "
            f"${spend:.2f} USDC | {quantity} tokens @ ${current_price:.4f}"
        )

        try:
            order_args = OrderArgs(
                token_id=token_id,
                price=current_price,
                size=quantity,
                side=clob_side,
            )

            signed_order = self.client.create_order(order_args)
            response = self.client.post_order(signed_order, OrderType.GTC)

            if response and response.get("success"):
                order_id = response.get("orderID", "N/A")
                log.info(
                    f"✅ ORDER PLACED ✅ | {side} {quantity} tokens of '{market_name}' "
                    f"@ ${current_price:.4f} | Order ID: {order_id}"
                )
            else:
                log.error(f"❌ Order failed. Response: {response}")

        except Exception as e:
            log.error(f"❌ Executor error: {e}")

    async def get_balance(self) -> float:
        try:
            balance_info = self.client.get_balance()
            usdc_balance = float(balance_info.get("balance", 0))
            log.info(f"💰 USDC Balance: ${usdc_balance:.2f}")
            return usdc_balance
        except Exception as e:
            log.error(f"Balance check failed: {e}")
            return 0.0
