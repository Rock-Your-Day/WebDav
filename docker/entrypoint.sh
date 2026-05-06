#!/bin/bash
set -e

echo "========================================="
echo "  OpenWebDav - Starting..."
echo "========================================="

# Ensure data directories exist
mkdir -p /data/storage /data/db /data/uploads

# Set database URL to persistent volume if not explicitly configured
export DATABASE_URL="${DATABASE_URL:-sqlite+aiosqlite:////data/db/openwebdav.db}"

# Initialize database tables and create admin user
echo "[*] Initializing database..."
cd /app/backend
python -c "
import asyncio
import os
import sys

async def init_db():
    from app.database import engine, async_session, Base
    from app.models import User, StorageDestination, AccessControl, ActivityLog, ThemeSettings, SLAPolicy
    from app.services.auth import hash_password

    # Create all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print('[*] Database tables created/verified')

    # Create default admin user if not exists
    from sqlalchemy import select
    async with async_session() as session:
        result = await session.execute(select(User).where(User.username == os.getenv('ADMIN_USERNAME', 'admin')))
        if not result.scalar_one_or_none():
            admin = User(
                username=os.getenv('ADMIN_USERNAME', 'admin'),
                email='admin@openwebdav.local',
                password_hash=hash_password(os.getenv('ADMIN_PASSWORD', 'admin')),
                role='admin',
                is_active=True,
                auth_provider='local'
            )
            session.add(admin)
            await session.commit()
            print('[*] Default admin user created')
        else:
            print('[*] Admin user already exists')

asyncio.run(init_db())
"

# Start FastAPI backend
echo "[*] Starting FastAPI backend..."
cd /app/backend
uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 2 &

# Wait for backend to be ready
echo "[*] Waiting for backend..."
for i in $(seq 1 30); do
    if curl -sf http://127.0.0.1:8000/api/v1/health > /dev/null 2>&1; then
        echo "[*] Backend is ready!"
        break
    fi
    sleep 1
done

# Start Nginx
echo "[*] Starting Nginx..."
echo "========================================="
echo "  OpenWebDav is running on port 80"
echo "========================================="
exec nginx -g "daemon off;"
