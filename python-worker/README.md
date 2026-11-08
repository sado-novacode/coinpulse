# CoinPulse — Telegram Alert Worker (Python)

A standalone backend companion to the CoinPulse dashboard: it watches Binance
prices and pushes triggered price alerts to Telegram.

This is the same "alert engine" concept the web app implements in
`src/app/api/alerts/check/route.ts` — but as an independent Python process,
so you can show both a **Node/TypeScript** and a **Python** backend in your
portfolio.

## Setup (3 steps)

1. **Create a bot** — message [@BotFather](https://t.me/BotFather) on Telegram,
   send `/newbot`, and copy the token.

2. **Get your chat id** — message [@userinfobot](https://t.me/userinfobot),
   it replies with your id. (For a group chat, add the bot to the group first.)

3. **Configure & run**

```bash
cp alerts.example.json alerts.json
#   -> paste your token + chat id, edit the alert rules
pip install -r requirements.txt
python telegram_alerts.py
```

Example `alerts.json`:

```json
{
  "telegramBotToken": "123456:ABC-DEF...",
  "telegramChatId": "98765432",
  "alerts": [
    { "id": "a1", "symbol": "BTC", "direction": "ABOVE", "target": 100000 },
    { "id": "a2", "symbol": "ETH", "direction": "BELOW", "target": 1800 }
  ]
}
```

You'll receive a message like:

> ⚡️ **CoinPulse Alert**
> **BTC** is now **$101,234.50**
> Target: ABOVE $100,000.00

## How it works

- Polls `GET /api/v3/ticker/price` (all symbols in one request) every 30 s
- Evaluates `ABOVE` / `BELOW` rules against the live price
- Fires **exactly once per alert** — state is persisted in `.alerts_state.json`
- Network errors never crash the loop; it retries on the next cycle

## Notes

- If Binance is geo-blocked on your network, route the script through a VPN —
  or swap the URL for another exchange's public ticker API.
- Keep `alerts.json` **private** (it contains your bot token) — it is already
  listed in the repo `.gitignore` pattern guidance; double-check before pushing.
