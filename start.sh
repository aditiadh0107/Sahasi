#!/bin/bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "==> Stopping existing processes..."

pkill -f "python.*main.py"       2>/dev/null || true
pkill -9 -f "node.*server.js"    2>/dev/null || true

for PORT in 3001 3002 3003; do
  lsof -ti :$PORT | xargs kill -9 2>/dev/null || true
done

lsof -ti :8081 | xargs kill -9 2>/dev/null || true

sleep 2

echo "==> Starting backend (FastAPI :8000)..."
cd "$ROOT/backend" && python main.py &

echo "==> Starting middleware (Node :3000)..."
cd "$ROOT/middleware_nodejs" && node server.js &

echo "==> Starting police-web (:3001)..."
cd "$ROOT/police-web" && PORT=3001 npm start &

echo "==> Starting therapist-web (:3002)..."
cd "$ROOT/therapist-web" && PORT=3002 npm start &

echo "==> Starting admin-web (:3003)..."
cd "$ROOT/admin-web" && PORT=3003 npm start &

echo ""
echo "==> All background services started. Starting Expo (mobile)..."
echo "    Press Ctrl+C to stop Expo. Background services keep running."
echo ""

cd "$ROOT/mobile-app" && npx expo start
