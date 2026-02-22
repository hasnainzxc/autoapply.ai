#!/bin/bash

# ApplyMate - Stop all services

echo "🛑 Stopping ApplyMate..."

# Stop Docker containers
echo "📦 Stopping Docker containers..."
docker stop applymate-db applymate-redis 2>/dev/null

# Kill backend and frontend
pkill -f "uvicorn app.main" 2>/dev/null
pkill -f "next dev" 2>/dev/null

echo "✅ All services stopped!"
