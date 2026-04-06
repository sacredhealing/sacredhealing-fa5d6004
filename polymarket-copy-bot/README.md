# SQI-2050 Polymarket Copy-Trading Bot

Sovereign infrastructure — run locally or on a VPS (US-East recommended).

## Layout

| File | Role |
|------|------|
| main.py | Entry + slippage guard + wiring |
| listener.py | Polygon CTF events, whale filter |
| matcher.py | Gamma API + CLOB midpoint |
| executor.py | py-clob-client orders |
| logger.py | Console logging |
| .env.example | Copy to `.env` (never commit `.env`) |

## Run

```bash
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python main.py
```

Full setup and safety notes: open the Sacred Healing app → **Income Streams** → **Polymarket Copy-Trading Bot** → guide page.
