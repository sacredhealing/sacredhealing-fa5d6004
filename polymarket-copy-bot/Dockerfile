# Railway / VPS: Polyclaw bot (SQI-2050)
# Set service root to polymarket-copy-bot. Override PAPER_MODE in Railway Variables.

FROM python:3.11-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1
# Default to paper until you set PAPER_MODE=false in Railway
ENV PAPER_MODE=true

COPY polyclaw_requirements.txt .
RUN pip install --no-cache-dir -r polyclaw_requirements.txt

COPY polyclaw_bot.py .
COPY logger.py .

CMD ["python", "-u", "polyclaw_bot.py"]
