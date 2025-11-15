# Build stage for frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# Production stage
FROM python:3.11-slim

# Install bd CLI
RUN apt-get update && \
    apt-get install -y curl && \
    curl -L https://github.com/steveyegge/beads/releases/latest/download/bd-linux -o /usr/local/bin/bd && \
    chmod +x /usr/local/bin/bd && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy backend files
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py beads.py ./

# Copy built frontend
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Set workspace path
ENV WORKSPACE_PATH=/workspace

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/')" || exit 1

# Run server
CMD ["python", "main.py"]
