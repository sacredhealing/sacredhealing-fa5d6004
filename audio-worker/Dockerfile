# Sacred Healing Audio Worker
# Docker image for deployment to Railway, Render, Fly.io, etc.

FROM python:3.11-slim

# Install system dependencies for audio processing
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsndfile1 \
    libsndfile1-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements first for caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
# Expose default port (Railway may override via PORT env var)
EXPOSE 8000

# Health check using curl (now installed)
HEALTHCHECK --interval=30s --timeout=30s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8000}/health || exit 1

# Run with gunicorn - bind to PORT env var (Railway sets this), fallback to 8000
CMD gunicorn --bind 0.0.0.0:${PORT:-8000} --workers 2 --timeout 300 app:app
