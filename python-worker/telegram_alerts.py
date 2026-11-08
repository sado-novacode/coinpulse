#!/usr/bin/env python3
"""
CoinPulse — Telegram Alert Worker (standalone bonus backend)
============================================================

A tiny, dependency-light worker that demonstrates the "backend alert engine"
pattern used in the CoinPulse dashboard:

    1. Load alert rules from a JSON file
    2. Poll Binance public API for live prices
    3. When a rule triggers (price crosses target), send a Telegram message
    4. Persist the new state so each alert fires exactly once

Run it for 24h alongside the web dashboard and you have a complete
monitoring product — a great thing to demo in an interview.

Usage:
    pip install -r requirements.txt
    python telegram_alerts.py            # uses ./alerts.json

Author: <Your Name> — 2026
"""

from __future__ import annotations

import json
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import requests

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent
CONFIG_FILE = BASE_DIR / "alerts.json"
STATE_FILE = BASE_DIR / ".alerts_state.json"  # runtime state (auto-created)

BINANCE_TICKER_URL = "https://api.binance.com/api/v3/ticker/price"
POLL_INTERVAL_SECONDS = 30
HTTP_TIMEOUT = 10


def load_config() -> dict[str, Any]:
    """Read alerts.json and validate the required fields."""
    if not CONFIG_FILE.exists():
        sys.exit(
            f"[!] {CONFIG_FILE.name} not found.\n"
            "    Copy alerts.example.json -> alerts.json and fill in your\n"
            "    Telegram bot token, chat id and alert rules first."
        )
    cfg = json.loads(CONFIG_FILE.read_text(encoding="utf-8"))
    if not cfg.get("telegramBotToken") or not cfg.get("telegramChatId"):
        sys.exit("[!] telegramBotToken / telegramChatId are missing in alerts.json")
    return cfg


def load_state() -> dict[str, str]:
    """Persisted {alert_id: 'TRIGGERED'} map so we never re-fire an alert."""
    if STATE_FILE.exists():
        return json.loads(STATE_FILE.read_text(encoding="utf-8"))
    return {}


def save_state(state: dict[str, str]) -> None:
    STATE_FILE.write_text(json.dumps(state, indent=2), encoding="utf-8")


# ---------------------------------------------------------------------------
# Upstream calls
# ---------------------------------------------------------------------------

def fetch_prices(symbols: list[str]) -> dict[str, float]:
    """Fetch current prices for all watched symbols in one request.

    Binance supports comma-separated symbols on /api/v3/ticker/price,
    e.g. ?symbols=["BTCUSDT","ETHUSDT"]  (URL-encoded JSON array).
    """
    params = {"symbols": json.dumps([f"{s}USDT" for s in symbols])}
    res = requests.get(BINANCE_TICKER_URL, params=params, timeout=HTTP_TIMEOUT)
    res.raise_for_status()
    return {item["symbol"].removesuffix("USDT"): float(item["price"]) for item in res.json()}


def send_telegram(token: str, chat_id: str, text: str) -> None:
    """Send a message through the Telegram Bot API."""
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    res = requests.post(url, json={"chat_id": chat_id, "text": text, "parse_mode": "HTML"}, timeout=HTTP_TIMEOUT)
    res.raise_for_status()


# ---------------------------------------------------------------------------
# Core engine
# ---------------------------------------------------------------------------

def evaluate(alert: dict[str, Any], price: float) -> bool:
    """Return True when the alert condition is met."""
    target = float(alert["target"])
    return price >= target if alert["direction"] == "ABOVE" else price <= target


def main() -> None:
    cfg = load_config()
    state = load_state()

    alerts = [a for a in cfg.get("alerts", []) if state.get(a["id"]) != "TRIGGERED"]
    if not alerts:
        print("[i] No pending alerts. Add rules to alerts.json")

    print(f"[i] CoinPulse worker started — watching {len(alerts)} alert(s), every {POLL_INTERVAL_SECONDS}s")
    print(f"[i] State file: {STATE_FILE}")

    while True:
        try:
            symbols = sorted({a["symbol"] for a in alerts})
            if symbols:
                prices = fetch_prices(symbols)

                for alert in alerts:
                    sym = alert["symbol"]
                    price = prices.get(sym)
                    if price is None:
                        continue

                    distance = (float(alert["target"]) - price) / price * 100
                    tag = "✅ TRIGGERED" if evaluate(alert, price) else f"👀 watching ({distance:+.2f}% away)"
                    print(f"    {sym:<6} ${price:,.2f} — target {alert['direction']} ${float(alert['target']):,.2f}  {tag}")

                    if evaluate(alert, price):
                        send_telegram(
                            cfg["telegramBotToken"],
                            cfg["telegramChatId"],
                            (
                                f"⚡️ <b>CoinPulse Alert</b>\n"
                                f"<b>{sym}</b> is now <b>${price:,.2f}</b>\n"
                                f"Target: {alert['direction']} ${float(alert['target']):,.2f}\n"
                                f"<i>{datetime.now(timezone.utc):%Y-%m-%d %H:%M:%S} UTC</i>"
                            ),
                        )
                        state[alert["id"]] = "TRIGGERED"
                        save_state(state)
                        print(f"    -> Telegram message sent for {sym}")

                        # one-shot: drop the alert from the watch loop
                        alerts = [a for a in alerts if a["id"] != alert["id"]]
                        if not alerts:
                            print("[i] All alerts fired. Exiting.")
                            return

        except requests.RequestException as exc:
            print(f"[!] Network error: {exc} — retrying next cycle")
        except Exception as exc:  # noqa: BLE001 - keep the worker alive
            print(f"[!] Unexpected error: {exc} — retrying next cycle")

        time.sleep(POLL_INTERVAL_SECONDS)


if __name__ == "__main__":
    main()
