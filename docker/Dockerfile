# =============================================================================
# Stage 1: Build Frontend
# =============================================================================
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --production=false
COPY frontend/ ./
RUN npm run build

# =============================================================================
# Stage 2: Build Backend Dependencies
# =============================================================================
FROM python:3.11-slim AS backend-builder

WORKDIR /app/backend
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# =============================================================================
# Stage 3: Production Image
# =============================================================================
FROM python:3.11-slim AS production

# Install nginx and runtime dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends nginx curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -r -s /bin/bash openwebdav && \
    mkdir -p /data/storage /data/db /app && \
    chown -R openwebdav:openwebdav /data

# Copy Python dependencies
COPY --from=backend-builder /install /usr/local

# Copy backend source
WORKDIR /app
COPY backend/ ./backend/

# Copy frontend build
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist/

# Copy nginx config
COPY docker/nginx.conf /etc/nginx/nginx.conf

# Copy entrypoint
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Volumes
VOLUME ["/data"]

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/api/v1/health || exit 1

ENTRYPOINT ["/entrypoint.sh"]
