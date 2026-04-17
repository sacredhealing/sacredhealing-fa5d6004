# Railway Service 2: Copy bot (Bot 2) + Polyclaw loop (Bot 3) in main.py
# Optional: polyclaw_bot.py kept for standalone runs.
# Root: polymarket-copy-bot. Set PAPER_MODE, Polymarket API keys, WALLET_PRIVATE_KEY, POLYGON_RPC_URL.

FROM python:3.11-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1
ENV PAPER_MODE=true

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py listener.py matcher.py executor.py logger.py polyclaw_bot.py ./

CMD ["python", "-u", "main.py"]
