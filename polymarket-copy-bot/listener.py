"""
listener.py — The Ear
======================
Monitors Polygon blockchain in real-time.
Detects when Smart Money wallets interact with the Polymarket CTF contract.
Gracefully skips if POLYGON_RPC_URL is not set (paper-mode compatible).
"""

import asyncio
import json
import os

from logger import setup_logger

log = setup_logger("LISTENER")

POLYGON_RPC_URL = os.getenv("POLYGON_RPC_URL", "")

CTF_CONTRACT_ADDR = "0x4D97DCd97eC945f40cF65F87097ACe5EA0476045"

WHALE_WALLETS_RAW = [
    "0x91583ceb1ebec79951a068e1d7d02c1ea590fa7b",
    "0x4924840e6E4249C032F40a6b797825d0d8b33782",
]

CTF_ABI = json.loads(
    """
[
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true,  "name": "stakeholder",  "type": "address"},
      {"indexed": true,  "name": "collateralToken","type": "address"},
      {"indexed": true,  "name": "parentCollectionId","type": "bytes32"},
      {"indexed": false, "name": "conditionId",   "type": "bytes32"},
      {"indexed": false, "name": "partition",     "type": "uint256[]"},
      {"indexed": false, "name": "amount",        "type": "uint256"}
    ],
    "name": "PositionSplit",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true,  "name": "stakeholder",  "type": "address"},
      {"indexed": true,  "name": "collateralToken","type": "address"},
      {"indexed": true,  "name": "parentCollectionId","type": "bytes32"},
      {"indexed": false, "name": "conditionId",   "type": "bytes32"},
      {"indexed": false, "name": "partition",     "type": "uint256[]"},
      {"indexed": false, "name": "amount",        "type": "uint256"}
    ],
    "name": "PositionsMerge",
    "type": "event"
  }
]
"""
)


class WhaleListener:
    def __init__(self, on_trade_callback):
        self.callback = on_trade_callback
        self.matcher = None
        self.executor = None
        self._enabled = False

        if not POLYGON_RPC_URL:
            log.warning(
                "⚠️  POLYGON_RPC_URL not set — Whale Listener disabled. "
                "Add an Alchemy Polygon RPC URL to enable on-chain whale mirroring."
            )
            return

        try:
            from web3 import Web3
            from web3.middleware import geth_poa_middleware

            self._WHALE_WALLETS = [
                Web3.to_checksum_address(w) for w in WHALE_WALLETS_RAW
            ]
            self._CTF_CONTRACT = Web3.to_checksum_address(CTF_CONTRACT_ADDR)

            self.w3 = Web3(Web3.HTTPProvider(POLYGON_RPC_URL))
            self.w3.middleware_onion.inject(geth_poa_middleware, layer=0)

            if not self.w3.is_connected():
                log.error("❌ Cannot connect to Polygon RPC — Whale Listener disabled.")
                return

            self.contract = self.w3.eth.contract(
                address=self._CTF_CONTRACT, abi=CTF_ABI
            )
            self._enabled = True
            log.info(f"✅ Whale Listener connected to Polygon | Block: {self.w3.eth.block_number}")

        except Exception as e:
            log.error(f"❌ Whale Listener init failed: {e} — running without whale mirroring.")

    async def start(self):
        if not self._enabled:
            log.info("👁️  Whale Listener: standing by (no RPC configured).")
            while True:
                await asyncio.sleep(3600)  # sleep forever, non-blocking
            return

        last_block = self.w3.eth.block_number - 10

        while True:
            try:
                current_block = self.w3.eth.block_number

                if current_block > last_block:
                    await self._scan_blocks(last_block + 1, current_block)
                    last_block = current_block

                await asyncio.sleep(2)

            except Exception as e:
                log.error(f"Listener error: {e}")
                await asyncio.sleep(5)

    async def _scan_blocks(self, from_block: int, to_block: int):
        log.debug(f"Scanning blocks {from_block} → {to_block}")

        for event_name, side in [("PositionSplit", "BUY"), ("PositionsMerge", "SELL")]:
            try:
                event_filter = getattr(self.contract.events, event_name).create_filter(
                    fromBlock=from_block,
                    toBlock=to_block,
                )
                events = event_filter.get_all_entries()

                for evt in events:
                    stakeholder = evt["args"]["stakeholder"]

                    if stakeholder not in self._WHALE_WALLETS:
                        continue

                    condition_id = evt["args"]["conditionId"].hex()
                    amount_raw = evt["args"]["amount"]
                    amount_usdc = amount_raw / 1e6

                    log.info(
                        f"🐋 WHALE DETECTED | {side} | "
                        f"Wallet: {stakeholder[:10]}... | "
                        f"ConditionID: {condition_id[:16]}... | "
                        f"Amount: ${amount_usdc:.2f} USDC"
                    )

                    event_payload = {
                        "whale": stakeholder,
                        "token_id": condition_id,
                        "side": side,
                        "amount": amount_usdc,
                        "tx_hash": evt["transactionHash"].hex(),
                        "whale_price": None,
                        "_matcher": self.matcher,
                        "_executor": self.executor,
                    }

                    await self.callback(event_payload)

            except Exception as e:
                log.error(f"Error scanning {event_name}: {e}")
