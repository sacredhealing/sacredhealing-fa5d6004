"""
SQI Sovereign Whale Hunter Service
Runs on Railway. Every 6 hours:
  1. Fetches top traders from GMGN leaderboard
    2. Scores each wallet (winrate, consistency, 10x+ entries)
      3. Upserts top 9 into Supabase tracked_whales table
        4. Updates whale_scores table with historical ranking
        """

import os
import time
import json
import logging
import requests
from datetime import datetime, timezone
from supabase import create_client, Client

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("whale-hunter")

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_KEY"]
GMGN_BASE    = "https://gmgn.ai/defi/quotation/v1"
SLEEP_HOURS  = 6

SCORE_WEIGHTS = {
      "roi_30d":              0.30,
      "winrate_30d":          0.25,
      "realized_profit_30d":  0.20,
      "active_days_30d":      0.15,
      "avg_hold_minutes":     0.10,
}

SEED_WHALES = [
      {"address": "HdxkiXqeN6qpK2YbG51W23QSWj3Yygc1eEk2zwmKJExp", "label": "GMGN Leaderboard $8.9M 30d", "source": "gmgn_leaderboard", "tier": "S", "known_plays": ["pump.fun sniper", "early migrator"], "notes": "Top 30d PNL on GMGN Solana leaderboard."},
      {"address": "H72yLkhTnoBfhBTXXaj1RBXuirm8s8G5fcVh2XpQLggM", "label": "GMGN smart_degen early entries", "source": "gmgn_smart_money", "tier": "S", "known_plays": ["WIF early entry", "POPCAT early entry"], "notes": "Consistently tagged smart_degen by GMGN."},
      {"address": "4Be9CvxqHW6BYiRAxW9Q3xu1ycTMWaL5z8NX4HR3ha7t", "label": "Axiom 100x documented", "source": "axiom_leaderboard", "tier": "S", "known_plays": ["100x pump.fun", "Raydium sniper"], "notes": "Axiom top user. Multiple 100x entries."},
      {"address": "cifwifhatday.sol", "label": "Nansen WIF+POPCAT pre-breakout", "source": "nansen_smart_money", "tier": "A", "known_plays": ["WIF pre-breakout", "POPCAT pre-breakout"], "notes": "Nansen smart money. Accumulates weeks early."},
      {"address": "traderpow", "label": "Nansen multi-cycle survivor", "source": "nansen_smart_money", "tier": "A", "known_plays": ["POPCAT", "multi-cycle"], "notes": "Consistent across multiple meme cycles."},
      {"address": "7x6qE3DRMW2ZCgT1YQuBLePiheEWw7qjH6rYjj6GDtEd", "label": "WalletMaster high ROI sniper", "source": "walletmaster_api", "tier": "A", "known_plays": ["consistent micro-cap sniper"], "notes": "WalletMaster: high ROI, consistent pattern."},
      {"address": "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM", "label": "Dune first-buyer brainrot meta", "source": "dune_alpha_signals", "tier": "B", "known_plays": ["brainrot meta", "alien meta 2026"], "notes": "Dune Alpha Signals. Narrative meta specialist."},
      {"address": "DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh", "label": "Birdeye Raydium migrator", "source": "birdeye_top_traders", "tier": "B", "known_plays": ["Raydium migration", "bonding curve exit"], "notes": "Birdeye top trader. Migration trigger specialist."},
      {"address": "GHoTTNFnSBFBbZvBZNvwNz7jtJz1TBNBqkS9vGPnm7Dv", "label": "KolScan top-20 buyer", "source": "kolscan", "tier": "B", "known_plays": ["first 20 buyers", "pre-migration"], "notes": "KolScan. Consistent top-20 across launches."},
]

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def seed_known_whales():
      for w in SEED_WHALES:
                row = {
                              "address":      w["address"],
                              "label":        w["label"],
                              "tier":         w["tier"],
                              "source":       w["source"],
                              "known_plays":  json.dumps(w["known_plays"]),
                              "notes":        w["notes"],
                              "score":        {"S": 100, "A": 80, "B": 60}.get(w["tier"], 50),
                              "active":       True,
                              "last_updated": datetime.now(timezone.utc).isoformat(),
                }
                try:
                              supabase.table("tracked_whales").upsert(row, on_conflict="address").execute()
                              log.info(f"Seeded {w['address'][:8]} tier={w['tier']}")
except Exception as e:
            log.error(f"Seed failed {w['address'][:8]}: {e}")


def fetch_gmgn_leaderboard(limit: int = 100) -> list:
      url = f"{GMGN_BASE}/rank/sol/wallets/1d"
      params = {"orderby": "realized_profit", "direction": "desc", "limit": limit, "tag": "smart_degen,sniper,kol"}
      try:
                r = requests.get(url, params=params, headers={"User-Agent": "SQI-WhaleHunter/1.0"}, timeout=15)
                r.raise_for_status()
                wallets = r.json().get("data", {}).get("rank", [])
                log.info(f"GMGN returned {len(wallets)} wallets")
                return wallets
except Exception as e:
        log.warning(f"GMGN fetch failed: {e}")
        return []


def score_wallet(w: dict) -> float:
      roi         = min(float(w.get("roi_30d", 0) or 0), 50)
      winrate     = min(float(w.get("winrate_30d", 0) or 0), 100)
      profit      = min(float(w.get("realized_profit_30d", 0) or 0), 5_000_000)
      active_days = min(int(w.get("active_days_30d", 0) or 0), 30)
      hold_min    = max(float(w.get("avg_hold_minutes", 60) or 60), 1)
      roi_n    = roi / 50
      wr_n     = winrate / 100
      profit_n = profit / 5_000_000
      act_n    = active_days / 30
      hold_n   = 1 - min(hold_min / 120, 1)
      return round(
          roi_n    * SCORE_WEIGHTS["roi_30d"]             * 100 +
          wr_n     * SCORE_WEIGHTS["winrate_30d"]         * 100 +
          profit_n * SCORE_WEIGHTS["realized_profit_30d"] * 100 +
          act_n    * SCORE_WEIGHTS["active_days_30d"]     * 100 +
          hold_n   * SCORE_WEIGHTS["avg_hold_minutes"]    * 100, 2)


def filter_quality(wallets: list) -> list:
      return [w for w in wallets if
                          float(w.get("winrate_30d", 0) or 0) >= 45 and
                          int(w.get("active_days_30d", 0) or 0) >= 18 and
                          float(w.get("realized_profit_30d", 0) or 0) >= 10_000 and
                          float(w.get("roi_30d", 0) or 0) >= 2]


def upsert_scored(wallets: list):
      scored = sorted([(score_wallet(w), w) for w in wallets], reverse=True)[:20]
      for score, w in scored:
                address = w.get("address") or w.get("wallet_address", "")
                if not address:
                              continue
                          try:
                                        supabase.table("tracked_whales").upsert({
                                                          "address":      address,
                                                          "label":        w.get("tag") or "gmgn_auto",
                                                          "tier":         "S" if score >= 80 else "A" if score >= 60 else "B",
                                                          "source":       "gmgn_leaderboard_auto",
                                                          "score":        score,
                                                          "active":       True,
                                                          "last_updated": datetime.now(timezone.utc).isoformat(),
                                        }, on_conflict="address").execute()
                                        supabase.table("whale_scores").insert({
                                            "address": address, "roi_30d": float(w.get("roi_30d", 0) or 0),
                                            "winrate_30d": float(w.get("winrate_30d", 0) or 0),
                                            "realized_profit": float(w.get("realized_profit_30d", 0) or 0),
                                            "active_days": int(w.get("active_days_30d", 0) or 0),
                                            "avg_hold_min": float(w.get("avg_hold_minutes", 0) or 0),
                                            "composite_score": score,
                                            "scored_at": datetime.now(timezone.utc).isoformat(),
                                        }).execute()
                                        log.info(f"Upserted {address[:8]} score={score}")
except Exception as e:
            log.error(f"Upsert error {address[:8]}: {e}")


def main():
      log.info("SQI Sovereign Whale Hunter starting")
      seed_known_whales()
      while True:
                try:
                              raw = fetch_gmgn_leaderboard()
                              quality = filter_quality(raw)
                              upsert_scored(quality)
                              log.info(f"Cycle done. {len(quality)} wallets processed.")
except Exception as e:
            log.error(f"Cycle error: {e}")
        log.info(f"Sleeping {SLEEP_HOURS}h...")
        time.sleep(SLEEP_HOURS * 3600)


if __name__ == "__main__":
      main()
  
